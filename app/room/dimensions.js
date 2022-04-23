// @ts-check

import { roll } from '../utility/roll.js';
import { roomTypes } from './room.js';
import { sizes } from '../attribute/size.js';

// -- Type Imports -------------------------------------------------------------

/** @typedef {import('../attribute/size').Size} Size */
/** @typedef {import('../dungeon/grid.js').Dimensions} Dimensions */
/** @typedef {import('./room.js').RoomType} RoomType */

// -- Types --------------------------------------------------------------------


/** @typedef {[ number, number ]} RoomDimensions */ // TODO use Dimensions type

// -- Config -------------------------------------------------------------------

// TODO rename to not confuse "width" with x-axis
const hallLengthMin = 3;
const hallWidthMin  = 1;
const hallWidthMax  = 1;

/**
 * Dimension ranges
 *
 * @type {{ [key in Size]?: RoomDimensions }}
 */
export const dimensionRanges = {
    tiny   : [ 2, 3  ],
    small  : [ 2, 4  ],
    medium : [ 2, 5  ],
    large  : [ 3, 10 ],
    massive: [ 5, 15 ],
};

/**
 * A lookup of room sizes by room types.
 *
 * Room types which are not included in the lookup can be of any size.
 *
 * TODO make into Sets?
 *
 * @type {{ [key in RoomType]?: Size[] }}
 */
const roomSizes = {
    ballroom      : [ 'medium', 'large', 'massive' ],
    bathhouse     : [ 'small', 'medium', 'large', 'massive' ],
    dining        : [ 'small', 'medium', 'large', 'massive' ],
    dormitory     : [ 'medium', 'large', 'massive' ],
    greatHall     : [ 'large', 'massive' ],
    pantry        : [ 'tiny', 'small', 'medium' ],
    parlour       : [ 'tiny', 'small', 'medium' ],
    study         : [ 'tiny', 'small', 'medium' ],
    throne        : [ 'medium', 'large', 'massive' ],
    tortureChamber: [ 'tiny', 'small', 'medium' ],
};

/**
 * A lookup of custom room dimension functions.
 *
 * @type {{
 *     hallway: (roomSize: string, options?: { isHorizontal?: boolean }) => Dimensions
 * }}
 */
export const customDimensions = {
    hallway: (roomSize, { isHorizontal = roll() } = {}) => {
        let [ min, max ] = dimensionRanges[roomSize];

        let length = roll(Math.max(hallLengthMin, min), max);
        let width  = roll(hallWidthMin, hallWidthMax);

        let hallWidth  = isHorizontal ? length : width;
        let hallHeight = isHorizontal ? width  : length;

        return {
            width: hallWidth,
            height: hallHeight,
        };
    },
};

/**
 * Room sizes by room RoomType.
 *
 * All room sizes are returned if the room type is not limited to a sub-set of
 * sizes defined in `roomSizes`.
 *
 * Rename to `roomSizesByType` & combine with constant object
 *
 * @type {{ RoomType: Size[] }}
 */
export const roomTypeSizes = roomTypes.reduce((obj, roomType) => {
    obj[roomType] = roomSizes[roomType] || sizes;

    return obj;
}, /** @type {{ RoomType: Size[] }} */ ({}));

export {
    hallLengthMin as testHallLengthMin,
    hallWidthMin  as testHallWidthMin,
    hallWidthMax  as testHallWidthMax,
};
