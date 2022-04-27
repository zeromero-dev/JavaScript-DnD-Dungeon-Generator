// @ts-check

import { capacity, itemSizeSpace, maxItemQuantitySmall } from './types/container.js';
import {
    hideItemSetCondition,
    hideItemDetails,
    indicateItemSetRarity,
    itemsByRarity,
    itemsByType,
    mysteriousObject,
} from './item.js';
import {
    anyRoomFurniture,
    furnishing,
    furnishingByRoomType,
    furnishingQuantityRanges,
    probability as roomFurnishingProbability,
    requiredRoomFurniture,
} from './furnishing.js';
import { probability as conditionProbability } from '../attribute/condition.js';
import { probability as rarityProbability } from '../attribute/rarity.js';
import { isRequired, toss } from '../utility/tools.js';
import { roll, rollArrayItem } from '../utility/roll.js';
import { quantityRanges, probability as quantityProbability } from '../attribute/quantity.js';

// -- Type Imports -------------------------------------------------------------

/** @typedef {import('../attribute/condition.js').Condition} Condition */
/** @typedef {import('../attribute/quantity.js').Quantity} Quantity */
/** @typedef {import('../attribute/rarity.js').Rarity} Rarity */
/** @typedef {import('../attribute/size.js').Size} Size */
/** @typedef {import('../controller/knobs.js').Config} Config */
/** @typedef {import('./furnishing.js').FurnitureQuantity} FurnitureQuantity */
/** @typedef {import('./item.js').ItemBase} ItemBase */
/** @typedef {import('./item.js').ItemType} ItemType */

// -- Types --------------------------------------------------------------------

/**
 * @typedef {object} Item
 *
 * @prop {string} name
 * @prop {Condition} condition
 * @prop {Rarity} rarity
 * @prop {Size} size
 * @prop {ItemType} type
 * @prop {number} count
 * @prop {number} [capacity] - Max number of small items found inside
 * @prop {string[]} [variants] - Array of variations
 */

/**
 * @typedef {Item & { contents: Item[] }} Container
 */

/**
 * @typedef {object} ItemSet
 *
 * @prop {Item[]} items
 * @prop {Container[]} containers
 * @prop {Condition} [conditionUniformity]
 * @prop {Rarity} [rarityUniformity]
 */

// -- Config -------------------------------------------------------------------

/**
 * Maximum number of columns for dungeon item lists.
 *
 * TODO rename.
 */
const maxColumnsItems = 4;

/**
 * Maximum number of columns for non-dungeon room item lists.
 */
const maxColumnsRoom = 2;

// -- Private Functions --------------------------------------------------------

/**
 * Generates furnishings by room type.
 *
 * @private
 *
 * @param {string} roomType
 * @param {FurnitureQuantity} quantity
 * @param {Condition} [roomCondition]
 *
 * @returns {Item[]}
 */
function generateFurnishings(roomType, quantity, roomCondition = 'average') {
    let furniture = [];

    if (quantity === 'none') {
        return furniture;
    }

    if (requiredRoomFurniture[roomType]) {
        requiredRoomFurniture[roomType].forEach((item) => {
            furniture.push({
                ...item,
                condition: roomCondition,
            });
        });
    }

    let extraItems = roll(1, furnishingQuantityRanges[quantity]);
    let itemSet    = furnishingByRoomType[roomType]
        ? anyRoomFurniture.concat(furnishingByRoomType[roomType])
        : Object.values(furnishing);

    for (let i = 0; i < extraItems; i++) {
        let item = rollArrayItem(itemSet);

        furniture.push({
            ...item,
            condition: roomCondition,
        });
    }

    return furniture;
}

/**
 * Generates an item config based on room settings.
 *
 * @TODO break out or inject randomization logic for testing.
 *
 * @param {Config} config
 *
 * @returns {Item}
 */
const generateItem = (config) => {
    let {
        itemCondition,
        itemQuantity,
        itemRarity,
        itemType,
    } = config;

    !itemCondition && toss('Item condition is required in generateItem()');
    !itemType      && toss('Item type is required in generateItem()');
    !itemQuantity  && toss('Item quantity is required in generateItem()');
    !itemRarity    && toss('Item rarity is required in generateItem()');

    itemQuantity === 'zero' && toss('Item quantity cannot be zero');

    if (itemRarity === 'random') {
        itemRarity = rarityProbability.roll();
    }

    let randomItem;

    // TODO break out into function, add early returns for undefined groups.
    if (itemType === 'random') {
        randomItem = itemsByRarity[itemRarity] && rollArrayItem(itemsByRarity[itemRarity]);
    } else {
        let itemsByTypeAndRarity = itemsByType[itemType] && itemsByType[itemType][itemRarity];
        randomItem = itemsByTypeAndRarity && itemsByTypeAndRarity.length && rollArrayItem(itemsByTypeAndRarity);
    }

    /** @type {ItemBase} */
    let item = randomItem || mysteriousObject;

    let {
        type,
        name,
        maxCount = 1,
    } = item;

    if (hideItemDetails.has(type)) {
        itemCondition = 'average';
        itemRarity    = 'average';
    }

    if (itemCondition === 'random') {
        itemCondition = conditionProbability.roll();
    }

    let count = 1;

    if (maxCount > 1) {
        count = roll(1, maxCount);

        // TODO breakout into function. move to formatting
        if (count > 1) {
            if (type === 'coin') {
                // TODO pluralize()
                name = `${maxCount} ${name}${maxCount > 1 ? 's' : ''}`;
            } else {
                name += `, set of ${count}`;
            }
        }
    }

    if (item.variants) {
        name += `, ${rollArrayItem(item.variants)}`;
    }

    return {
        name,
        count,
        condition: itemCondition,
        rarity: itemRarity,
        size: item.size,
        type: item.type,
    };
};

/**
 * Generate item objects
 *
 * TODO rename to getItemObjects
 *
 * @private
 *
 * @param {number} count
 * @param {Config} config
 *
 * @returns {Item[]}
 */
const generateItemObjects = (count, config) => Object.values([ ...Array(count) ].reduce((items) => {
    let item  = generateItem(config);
    let { condition, name } = item;

    let key = `${name}-${condition}`;

    if (!items[key]) {
        items[key] = {
            ...item,
            count: 1,
        };

        return items;
    }

    items[key].count++;

    return items;
}, {}));

/**
 * Get furnishing objects
 *
 * TODO rename to `getFurnishing()`
 * TODO move to furnishing.js
 *
 * @private
 *
 * @param {Item[]} furnishings
 *
 * @returns {Item[]}
 */
const getFurnishingObjects = (furnishings) => Object.values(furnishings.reduce((obj, item) => {
    let { name, condition } = item;

    let key = `${name}-${condition}`;

    if (!obj[key]) {
        obj[key] = {
            ...item,
            count: 1,
        };

        return obj;
    }

    obj[key].count++;

    return obj;
}, {}));

/**
 * Get item count based on quantity config.
 *
 * @private
 *
 * @param {Quantity} itemQuantity
 *
 * @returns {number}
 */
function getItemCount(itemQuantity) {
    let range = quantityRanges[itemQuantity];

    if (!range) {
        toss('Invalid quantity "${itemQuantity}" in getItemCount()');
    }

    let { min, max } = range;

    return roll(min, max);
}

export {
    generateFurnishings  as testGenerateFurnishings,
    generateItem         as testGenerateItem,
    generateItemObjects  as testGenerateItemObjects,
    getFurnishingObjects as testGetFurnishingObjects,
    getItemCount         as testGetItemCount,
};

// -- Public Functions ---------------------------------------------------------

/**
 * Generate items
 *
 * @param {Config} config
 *
 * @returns {ItemSet}
 */
export function generateItems(config) {
    let {
        itemCondition,
        itemQuantity,
        itemRarity,
        itemType,
        roomCondition,
        roomFurnitureQuantity,
        roomType,
    } = config;

    isRequired(itemCondition, 'itemCondition is required in generateItems()');
    isRequired(itemQuantity,  'itemQuantity is required in generateItems()');
    isRequired(itemRarity,    'itemRarity is required in generateItems()');
    isRequired(itemType,      'itemType is required in generateItems()');

    let inRoom = Boolean(roomType);

    if (inRoom && !roomCondition) {
        isRequired(roomCondition, 'roomCondition is required for room items in generateItems()');
    }

    if (itemQuantity === 'random') {
        itemQuantity = quantityProbability.roll();
    }

    if (itemQuantity === 'zero') {
        return {
            containers: [],
            items: [],
        };
    }

    if (roomFurnitureQuantity === 'random') {
        roomFurnitureQuantity = roomFurnishingProbability.roll();
    }

    let count = getItemCount(itemQuantity);
    let items = generateItemObjects(count, config);

    let containers = [];

    /** @type {Item[]} */
    let smallItems = [];

    /** @type {Item[]} */
    let remaining  = [];

    let furnishingConfigs = inRoom ? generateFurnishings(roomType, roomFurnitureQuantity, roomCondition) : [];
    let furnishings = getFurnishingObjects(furnishingConfigs);

    // TODO break out into function for testing
    // distributeItems() ?
    furnishings.forEach((furnishingItem) => {
        if (furnishingItem.capacity) {
            containers.push(furnishingItem);
            return;
        }

        remaining.push(furnishingItem);
    });

    items.forEach((item) => {
        if (item.type === 'container') {
            containers.push(item);
            return;
        }

        if (item.size === 'tiny' || item.size === 'small') {
            smallItems.push(item);
            return;
        }

        remaining.push(item);
    });

    // TODO break out into function for testing
    containers.forEach((_, index, array) => {
        let container = array[index];

        if (!smallItems.length) {
            return;
        }

        let contents       = [];
        let remainingSpace = capacity[container.size]; // TODO can be undefined
        let itemCount      = smallItems.length;

        for (let i = 0; i < itemCount; i++) {
            if (remainingSpace <= 0) {
                continue;
            }

            let item = smallItems[0];

            if (!item) {
                continue;
            }

            if (item.count > maxItemQuantitySmall) {
                continue;
            }

            let spaceRequired     = itemSizeSpace[item.size];
            let spaceAfterAdded   = remainingSpace - spaceRequired;

            if (spaceAfterAdded < 0) {
                continue;
            }

            remainingSpace = spaceAfterAdded;

            contents.push(smallItems.shift());
        }

        if (contents.length) {
            container.contents = contents;
        }
    });

    /** @type {Item[]} */
    let emptyContainers = [];

    /** @type {Container[]} */
    let containerList = [];

    containers.forEach((container) => {
        if (!container.contents) {
            emptyContainers.push(container);
            return;
        }

        containerList.push(container);
    });

    /** @type {Item[]} */
    let itemList = remaining.concat(smallItems, emptyContainers).map((item) => item);

    let conditionUniformity;
    let rarityUniformity;

    if (itemQuantity !== 'one' && itemCondition !== 'random' && !hideItemSetCondition.has(itemCondition)) {
        conditionUniformity = itemCondition;
    }

    if (itemQuantity !== 'one' && itemRarity !== 'random' && indicateItemSetRarity.has(itemRarity)) {
        rarityUniformity = itemRarity;
    }

    return {
        conditionUniformity,
        containers: containerList,
        items: itemList,
        rarityUniformity,
    };
}
