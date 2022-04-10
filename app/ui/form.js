// @ts-check

import { button, infoLabel } from './button.js';
import { div, fieldset, section } from './block.js';
import { element } from '../utility/element.js';
import { getKnobConfig, typeSelect, typeNumber, typeRange } from '../controller/knobs.js';
import { paragraph, small, title } from './typography.js';
import { select, input, slider, fieldLabel } from './field.js';
import { toDash, toss } from '../utility/tools.js';

// -- Type Imports -------------------------------------------------------------

/** @typedef {import('../controller/controller.js').Action} Action */
/** @typedef {import('../controller/knobs.js').Config} Config */
/** @typedef {import('../controller/knobs.js').KnobSet} KnobSet */
/** @typedef {import('../controller/knobs.js').KnobSettings} KnobSettings */
/** @typedef {import('./nav.js').Page} Page */

// -- Config -------------------------------------------------------------------

const submitButton = button('Generate', 'generate', {
    size: 'large',
    type: 'submit',
});

const expandButton = button(element('span', '&#x25C1'), 'expand', {
    size: 'auto',
});

// -- Private Functions --------------------------------------------------------

/**
 * Returns a set of HTML fieldset accordion element strings containing form
 * elements for the given knobs.
 *
 * @private
 *
 * @param {KnobSet[]} knobs
 *
 * @returns {string}
 */
const formatKnobAccordions = (knobs) => knobs.map((knobSet, i) => {
    let {
        label,
        fields,
    } = knobSet;

    let fieldsetId = `fieldset-${toDash(label)}`;
    let handle = button(label, 'accordion', { target: fieldsetId });

    let attrs = {
        'data-collapsed': i === 0 ? false : true,
        'data-id': fieldsetId,
    };

    return fieldset(handle + section(getFields(fields)), attrs);
}).join('');

/**
 * Returns a set of HTML fieldset element strings containing form elements for
 * the given knobs.
 *
 * @private
 *
 * @param {KnobSet[]} knobs
 *
 * @returns {string}
 */
const formatKnobSections = (knobs) => knobs.map((knobSet) => {
    let {
        label,
        fields,
    } = knobSet;

    return fieldset(title(label) + section(getFields(fields)));
}).join('');

/**
 * Returns HTML form field element strings for the given fields.
 *
 * @private
 * @throws
 *
 * @param {KnobSettings[]} fields
 *
 * @returns {string}
 */
const getFields = (fields) => fields.map((settings) => {
    let { desc, label, name } = settings;

    !name  && toss('Missing required knob name');
    !label && toss('Missing required knob label');
    !desc  && toss('Missing required knob description');

    let knob       = getKnob(settings);
    let descId     = desc && `info-${name}`;
    let descButton = button(infoLabel, 'toggle', { target: descId, size: 'auto' });
    let descText   = paragraph(small(desc), { hidden: true, 'data-id': descId });
    let knobLabel  = fieldLabel(label + descButton);

    return div(knobLabel + descText + knob);
}).join('');

/**
 * Returns an array of HTMLInputElement children for the knob container.
 *
 * @private
 *
 * @param {HTMLElement} knobContainer
 *
 * @returns {ReturnType<HTMLInputElement[]>}
 */
const getInputElements = (knobContainer) => [ ...knobContainer.querySelectorAll('[name]') ];

/**
 * Returns an HTML from element string for the given knob type.
 *
 * @private
 * @throws
 *
 * @param {KnobSettings} settings
 *
 * @returns {string}
 */
function getKnob(settings) {
    let {
        name,
        type,
        value,
        values,
        min,
        max,
    } = settings;

    switch (type) {
        case typeSelect:
            return select(name, values, value);

        case typeNumber:
            return input(name, { type: 'number' , value });

        case typeRange:
            return slider(name, { min, max, value });

        default:
            toss('Invalid knob type');
    }
}

export {
    formatKnobAccordions as testFormatKnobAccordions,
    getFields            as testGetFields,
    getKnob              as testGetKnob,
};

// -- Public Functions ---------------------------------------------------------

/**
 * Gets form data for the given form container.
 *
 * @param {HTMLElement} knobContainer
 *
 * @returns {Config}
 */
export function getFormData(knobContainer) {
    return getInputElements(knobContainer).reduce((setting, item) => {
        let { name, value } = item;

        setting[name] = value;

        return setting;
    }, {});
}

/**
 * Update form knobs when changing pages.
 *
 * @param {Page} page
 * @param {object} [options]
 *     @param {Config} [options.config]
 *     @param {boolean} [options.isExpanded]
 *
 * @returns {string}
 */
export function getKnobPanel(page, { config, isExpanded } = {}) {
    let knobConfig = getKnobConfig(page, config);
    let knobs = isExpanded
        ? formatKnobSections(knobConfig)
        : formatKnobAccordions(knobConfig);

    let knobContainerAttrs = isExpanded ? { 'data-grid': 3 } : {};

    let content = div(submitButton + expandButton, { 'data-flex': 'between' })
        + div(knobs, knobContainerAttrs);

    return content;
}
