// @ts-check

import {
    disableSaveButton,
    enableSaveButton,
    getToolbar,
} from '../ui/toolbar.js';
import { dungeonIcon, itemsIcon, roomsIcon } from '../ui/icon.js';
import {
    formatDungeon,
    formatError,
    formatHomepage,
    formatItems,
    formatName,
    formatReadyState,
    formatRooms,
} from './formatter.js';
import { generateDungeon } from '../dungeon/generate.js';
import { generateItems } from '../item/generate.js';
import { generateName } from '../name/generate.js';
import { generateRooms } from '../room/generate.js';
import { getFormData, getKnobPanel, validateOnBlur } from '../ui/form.js';
import { getNav, setActiveNavItem } from '../ui/nav.js';
import { toss, isRequired } from '../utility/tools.js';

// -- Type Imports -------------------------------------------------------------

/** @typedef {import('../utility/xhr.js').Request} Request */
/** @typedef {import('./knobs.js').Config} Config */
/** @typedef {import('./knobs.js').DungeonConfig} DungeonConfig */
/** @typedef {import('./knobs.js').ItemConfig} ItemConfig */
/** @typedef {import('./knobs.js').NameConfig} NameConfig */
/** @typedef {import('./knobs.js').RoomConfig} RoomConfig */

// -- Types --------------------------------------------------------------------

/** @typedef {(Event) => void} Trigger */ // Rename to AppEvent?
/** @typedef {{ [key in Action]: Trigger }} Triggers */
/** @typedef {typeof generators[keyof typeof generators]} Generator */
/** @typedef {typeof pages[keyof typeof pages]} Page */

/**
 * @typedef {object} Sections
 *
 * @prop {HTMLElement} body
 * @prop {HTMLElement} content
 * @prop {HTMLElement} footer
 * @prop {HTMLElement} knobs
 * @prop {HTMLElement} nav
 * @prop {HTMLElement} toolbar
 */

/**
 * @typedef {object} State
 *
 * @prop {() => object} get
 * @prop {(object) => object} set
 */

/**
 * @typedef {object} Route
 *
 * @prop {Generator} [generator]
 * @prop {string} [key]
 * @prop {Page} [page]
 */

/**
 * @typedef {"accordion"
 * | "expand"
 * | "generate"
 * | "navigate"
 * | "save"
 * | "toggle"
 * } Action
 */

/** @typedef {404} StatusCode */

// -- Config -------------------------------------------------------------------

/**
 * App generators, keyed by generator route.
 *
 * Object order determines the order of navigation links.
 */
export const generators = Object.freeze(/** @type {const} */ ({
    '/maps' : 'maps',
    '/rooms': 'rooms',
    '/items': 'items',
    // '/names': 'names', // Disabled
}));

export const generatorConfigs = {
    maps : { title: 'Generate Dungeon', icon: dungeonIcon },
    rooms: { title: 'Generate Rooms',   icon: roomsIcon },
    items: { title: 'Generate Items',   icon: itemsIcon },
};

export const pages = Object.freeze(/** @type {const} */ ({
    '/': 'home',
}));

const genKeyRouteRegEx = `^\\\/(${Object.keys(generators).join('|').replace(/\//g, '')})\\\/([a-z0-9]{13}$)`;

export {
    genKeyRouteRegEx   as testGenKeyRouteRegEx,
};

// -- Private Generator Functions ----------------------------------------------

/**
 * Generates and formats output for the dungeon generator.
 *
 * @private
 *
 * @param {State} state
 * @param {DungeonConfig} config
 *
 * @returns {string}
 */
function dungeonGenerator(state, config) {
    let newState = generateDungeon(config);

    state.set(newState);

    return formatDungeon(newState);
}
/**
 * Generates and formats output for the item generator.
 *
 * @private
 *
 * @param {State} state
 * @param {ItemConfig} config
 *
 * @returns {string}
 */
function itemGenerator(state, config) {
    let newState = generateItems(config);
    state.set(newState);

    return formatItems(newState);
}

/**
 * Generates and formats output for the name generator.
 *
 * Note: Currently disabled.
 *
 * @private
 *
 * @param {State} state
 * @param {NameConfig} config
 *
 * @returns {string}
 */
function nameGenerator(state, config) {
    let newState = generateName(config);
    state.set(newState);

    return formatName(newState);
}

/**
 * Generates and formats output for the room generator.
 *
 * @private
 *
 * @param {State} state
 * @param {RoomConfig} config
 *
 * @returns {string}
 */
function roomGenerator(state, config) {
    let newState = generateRooms(config);
    state.set(newState);

    return formatRooms(newState);
}

// -- Private Functions --------------------------------------------------------

/**
 * Returns the active generator based on the route, or undefined.
 *
 * TODO update tests
 * @private
 *
 * @param {string} path
 *
 * @returns {Route}
 */
function getActiveRoute(path) {
    let page = pages[path];

    if (page) {
        return { page };
    }

    let generator = generators[path];

    if (generator) {
        return { generator };
    }

    let parts = path.match(genKeyRouteRegEx);

    if (parts?.length === 3) {
        parts.shift();

        let [ gen, key ] = parts;

        return {
            generator: /** @type {Generator} */ (gen),
            key,
        };
    }

    return {}; // 404
}

/**
 * Returns a generator function.
 *
 * @private
 * @throws
 *
 * @param {Generator} generator
 *
 * @returns {(state: State, config: DungeonConfig | ItemConfig | NameConfig | RoomConfig) => string}
 */
function getGenerator(generator) {
    switch (generator) {
        case 'maps':
            return dungeonGenerator;

        case 'rooms':
            return roomGenerator;

        case 'items':
            return itemGenerator;

        // case 'names':
        //     return nameGenerator;

        default:
            toss(`Invalid generator "${generator}" in getGenerator()`);
    }
}

/**
 * Returns an error object containing title & message strings.
 *
 * @private
 *
 * @param {StatusCode} [statusCode]
 *
 * @returns {{ title: string; messages: string[] }}
 */
function getErrorPageContent(statusCode) {
    if (statusCode === 404) {
        return {
            title   : '404',
            messages: [ 'These are not the mischievous kobolds you are looking for.' ],
        };
    }

    return {
        title   : 'Oh no!',
        messages: [
            'Goblins have infiltrated the castle and hacked into the JavaScript!',
            'This error has been scribbled onto a magical scroll by a preposterous robot so AJ can fix this bug.',
        ],
    };
}

/**
 * Returns a trigger function for the given action.
 *
 * @private
 * @throws
 *
 * @param {Triggers} triggers
 * @param {Action} action
 *
 * @returns {Trigger}
 */
function getTrigger(triggers, action) {
    isRequired(triggers[action], `Invalid action "${action}" passed to getTrigger()`);

    return triggers[action];
}

/**
 * Returns title and icon for the given generator's ready state.
 *
 * @private
 * @throws
 *
 * @param {Generator} generator
 *
 * @returns {{ title: string; icon: string }}
 */
function getReadyState(generator) {
    return generatorConfigs[generator] || toss(`Invalid generator "${generator}" in getReadyState()`);
}

/**
 * Returns the element if the event target is a control element, otherwise null.
 *
 * @private
 *
 * @param {EventTarget | null} target
 *
 * @returns {HTMLInputElement | HTMLSelectElement | null}
 */
const getTargetControl = (target) =>
    target instanceof HTMLInputElement || target instanceof HTMLSelectElement
        ? target
        : null;

/**
 * Returns an event target's dataset, if any.
 *
 * @private
 *
 * @param {EventTarget | null} target
 *
 * @returns {DOMStringMap}
 */
const getTargetDataset = (target) => target instanceof HTMLElement ? target.dataset : {};

/**
 * Returns an event target's href, if any.
 *
 * @private
 *
 * @param {EventTarget | null} target
 *
 * @returns {string?}
 */
const getTargetHref = (target) => target instanceof HTMLElement ? target.getAttribute('href') : null;

/**
 * Returns a boolean to indicate if the sidebar is expanded
 *
 * @private
 *
 * @param {HTMLElement} body
 *
 * @returns {boolean}
 */
const isSidebarExpanded = (body) => body.dataset.layout === 'sidebar-expanded';

/**
 * Generator event handler.
 *
 * @private
 * @throws
 *
 * @param {State} state
 * @param {Sections} sections
 * @param {() => string} getPathname
 */
function onGenerate(state, sections, getPathname) {
    let { body, content, knobs } = sections;

    let config = getFormData(knobs);

    let { generator } = getActiveRoute(getPathname());

    if (!generator) {
        renderErrorPage(sections);
        return;
    }

    let generate = getGenerator(generator);

    content.innerHTML = generate(state, config);

    enableSaveButton(sections.toolbar); // TODO test

    if (isSidebarExpanded(body)) {
        toggleExpand(sections, getPathname);
    }
}

/**
 * Navigation event handler.
 *
 * @private
 *
 * @param {Sections} sections
 * @param {Event} e
 * @param {(string) => void} updatePath
 */
function onNavigate(sections, e, updatePath) {
    let href = getTargetHref(e.target);

    if (!href) {
        toss(`Invalid href "${href}" in onNavigate`);
    }

    // Update URL
    updatePath(href);

    // Render it
    renderApp(sections, getActiveRoute(href));

    disableSaveButton(sections.toolbar); // TODO test
}

/**
 * Initiates downloading a JSON file for the current generation.
 *
 * @param {State} state
 * @param {Request} request
 * @param {() => string} getPathname
 */
function onSave(state, request, getPathname) {
    let {
        generator,
        key, // TODO update existing record
    } = getActiveRoute(getPathname());

    request(`/api/save/${generator}`, {
        data: state.get(),
        method: 'POST',
        callback: (test) => {
            console.log(test);
        },
    });
}

/**
 * Renders the given page or generator.
 *
 * @private
 *
 * @param {Sections} sections
 * @param {Route} route
 */
function renderApp(sections, route) {
    let { generator, key, page } = route;

    if (generator) {
        renderGenerator(sections, { generator, key });
        return;
    }

    if (page) {
        renderPage(sections, { page });
        return;
    }

    renderErrorPage(sections, 404);
}

/**
 * Renders the error page.
 *
 * @private
 *
 * @param {Sections} sections
 * @param {404} [statusCode]
 */
function renderErrorPage({ body, content, knobs, nav, toolbar }, statusCode) {
    let { title, messages } = getErrorPageContent(statusCode);

    setActiveNavItem(nav); // Clear it

    body.dataset.layout = 'full';

    toolbar.innerHTML = '';
    knobs.innerHTML   = '';
    content.innerHTML = formatError(title, messages);
}

/**
 * Renders a generator.
 *
 * // TODO tests from `renderApp()`
 *
 * @private
 *
 * @param {Sections} sections
 * @param {{ generator: Generator; key?: string }} generatorRoute
 */
function renderGenerator(sections, { generator, key }) {
    // TODO render existing record by key

    let { body, content, knobs, nav, toolbar } = sections;

    if (body.dataset.layout === 'full') {
        body.dataset.layout = 'default';
    }

    setActiveNavItem(nav, generator);

    let isExpanded = isSidebarExpanded(body);
    let { title, icon } = getReadyState(generator);

    toolbar.innerHTML = getToolbar(generator);
    knobs.innerHTML   = getKnobPanel(generator, { isExpanded });
    content.innerHTML = formatReadyState(title, icon);
}

/**
 * Renders a page.
 *
 * // TODO tests
 *
 * @private
 *
 * @param {Sections} sections
 * @param {{ page: Page }} pageRoute
 */
function renderPage({ body, content, knobs, nav, toolbar }, { page }) {
    setActiveNavItem(nav); // Clear it

    body.dataset.layout = 'full';

    toolbar.innerHTML = '';
    knobs.innerHTML   = '';

    switch (page) {
        case 'home':
            content.innerHTML = formatHomepage();
            return;

        default:
            toss(`Invalid page "${page}" in renderPage()`);
    }
}

/**
 * Toggles an accordion element identified by the value of the `data-target`
 * attribute on a click event's `target` element.
 *
 * @private
 * @throws
 *
 * @param {HTMLElement} container
 * @param {Event} e
 */
function toggleAccordion(container, e) {
    let { target } = getTargetDataset(e.target);

    isRequired(target, 'Missing target for accordion toggle');

    /** @type {HTMLElement | null} targetSectionEl */
    let targetSectionEl = container.querySelector(`[data-accordion][data-id="${target}"]`);

    if (!targetSectionEl) {
        toss(`Invalid accordion section target "${target}"`);
    }

    /** @type {NodeListOf<HTMLElement>} sectionEls */
    let sectionEls = container.querySelectorAll('[data-accordion]');

    [ ...sectionEls ].forEach((el) => {
        if (el !== targetSectionEl) {
            el.dataset.accordion = 'collapsed';
        }
    });

    let isCollapsed = targetSectionEl.dataset.accordion === 'collapsed';

    targetSectionEl.dataset.accordion = isCollapsed ? 'expanded' : 'collapsed';
}

/**
 * Toggles the generation form from sidebar to full screen.
 *
 * @private
 *
 * @param {Sections} sections
 * @param {() => string} getPathname
 */
function toggleExpand(sections, getPathname) {
    let { body, knobs } = sections;

    body.dataset.layout = body.dataset.layout === 'sidebar-expanded'
        ? 'default'
        : 'sidebar-expanded';

    let { generator } = getActiveRoute(getPathname());

    if (!generator) {
        renderErrorPage(sections);
        return;
    }

    let isExpanded = isSidebarExpanded(body);

    knobs.innerHTML = getKnobPanel(generator, {
        config: getFormData(knobs),
        isExpanded,
    });
}

/**
 * Toggles visibility of an element based on the element's id, identified by the
 * value of the `data-target` attribute on a click event's `target` element.
 *
 * @private
 * @throws
 *
 * @param {Element} container
 * @param {Event} e
 */
function toggleVisibility(container, e) {
    let { target } = getTargetDataset(e.target);

    isRequired(target, 'Missing target for visibility toggle');

    /** @type {HTMLElement | null} targetEl */
    let targetEl = container.querySelector(`[id="${target}"]`);

    if (!targetEl) {
        toss(`Invalid visibility toggle target "${target}"`);
    }

    targetEl.hidden = !targetEl.hidden;
}

export {
    getActiveRoute      as testGetActiveRoute,
    getErrorPageContent as testGetErrorPageContent,
    getGenerator        as testGetGenerator,
    getReadyState       as testGetReadyState,
    getTargetControl    as testGetTargetControl,
    getTargetDataset    as testGetTargetDataset,
    getTrigger          as testGetTrigger,
    isSidebarExpanded   as testIsSidebarExpanded,
    onGenerate          as testOnGenerate,
    onNavigate          as testOnNavigate,
    renderApp           as testRenderApp,
    renderErrorPage     as testRenderErrorPage,
    toggleAccordion     as testToggleAccordion,
    toggleExpand        as testToggleExpand,
    toggleVisibility    as testToggleVisibility,
};

// -- Public Functions ---------------------------------------------------------

/**
 * Attaches an application level click delegate to the document body.
 *
 * TODO private
 *
 * @param {Sections} sections
 * @param {Triggers} triggers
 * @param {(any) => void} onError
 */
export function attachEventDelegates(sections, triggers, onError) {
    let { body, knobs } = sections;

    body.addEventListener('click', (e) => {
        /** @type {{ action?: Action }} */
        let { action } = getTargetDataset(e.target);

        if (!action) {
            return;
        }

        // TODO handle cmd click on links
        e.preventDefault();

        try {
            let trigger = getTrigger(triggers, action);

            trigger(e);
        } catch (error) {
            onError(error);
            renderErrorPage(sections);
        }
    });

    // TODO tests
    body.addEventListener('blur', (e) => {
        let control = getTargetControl(e.target);

        if (!control) {
            return;
        }

        try {
            validateOnBlur(knobs, control);
        } catch (error) {
            onError(error);
            renderErrorPage(sections);
        }
    }, true);
}

/**
 * Initializes the application controller.
 *
 * @param {Sections} sections
 * @param {(error: Error) => void} onError
 * @param {(path: string) => void} updatePath
 * @param {() => string} getPathname
 * @param {Request} request
 * @returns {{
 *     render: (path) => void;
 * }}
 */
export function initController(sections, onError, updatePath, getPathname, request) {
    let controllerState;
    let state = {
        get: () => controllerState,
        set: (newState) => controllerState = newState,
    };

    let triggers = getTriggers(state, sections, updatePath, getPathname, request);
    let { generator } = getActiveRoute(getPathname());

    attachEventDelegates(sections, triggers, onError);

    sections.nav.innerHTML = getNav(generator);

    return {
        render: getRender(sections, onError),
    };
}

/**
 * Returns the app's render function.
 *
 * TODO private
 *
 * @param {Sections} sections
 * @param {(error: Error) => void} onError
 *
 * @returns {(path: string) => void}
 */
export const getRender = (sections, onError) => (path) => {
    try {
        renderApp(sections, getActiveRoute(path));
    } catch (error) {
        onError(error);
        renderErrorPage(sections);
    }
};

/**
 * Returns an object of action triggers.
 *
 * TODO private
 *
 * @param {State} state
 * @param {Sections} sections
 * @param {(path: string) => void} updatePath
 * @param {() => string} getPathname
 * @param {Request} request
 *
 * @returns {Triggers}
 */
export function getTriggers(state, sections, updatePath, getPathname, request) {
    let { body } = sections;

    return {
        accordion: (e) => toggleAccordion(body, e),
        expand   : ( ) => toggleExpand(sections, getPathname),
        generate : ( ) => onGenerate(state, sections, getPathname),
        navigate : (e) => onNavigate(sections, e, updatePath),
        save     : ( ) => onSave(state, request, getPathname),
        toggle   : (e) => toggleVisibility(body, e),
    };
}
