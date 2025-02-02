# JavaScript D&D Generator

D&D Generator at [dnd.mysticwaffle.com](https://dnd.mysticwaffle.com/) is web application, forged by AJ, a Human Sorcerer, written (mostly) in JavaScript. The app implements a procedural generation algorithm to draw Dungeons & Dragons game maps as SVG graphics using user input. The maps are accompanied by randomly generated room descriptions, doorway connections, and items.

The application has zero 3rd party library dependencies. Functionally is validated on page load by a custom built unit testing framework. The API, which is not included in this repository, servers as a backend for storing user generated content.

This project is a work in progress with numerous features and configuration options still to come.

## Screenshot

![D&D Dungeon Generator App](/img/screenshot.png)

## Application Design

The app uses native browser support for importing JavaScript modules, and so will only run in modern browsers.

HTML is generated via template literals.

A multi-dimensional array is used to represent the map grid. Rooms and doorway connections are procedurally generated on the grid and drawn as an SVG element. Room descriptions, traps, doorways, and items are randomly assigned to each room based on probability tables for attributes such as rarity, condition, and quantity.

The application is organized as follows, with a top level `/index.html` and `/app/app.js` files that initialize the app and loads scrips in the following directories:

- `/app/attribute/*` - Contains configurations for reusable attributes such as size and condition
- `/app/controller/*` - Application controller code
- `/app/dungeon/*` - Code related to generating dungeons
- `/app/item/*` - Code related to generating items
- `/app/name/*` - Code related to generating names (WIP, currently disabled)
- `/app/room/*` - Code related to, you guessed it, generating rooms
- `/app/ui/*` - HTML generators
- `/app/unit/*` - Unit testing library
- `/app/utility/*` - Utilities such as randomization and text formatters

## Unit Tests

Because 3rd party libraries have been avoided, a custom unit test framework can be found in the `/unit/*` directory. Tests are run by navigating to `/unit.html` as well as on every page load of the main app. Test output is printed to the browser.

New unit test suites must be added to the test manifest in `/unit/suite.js`.

## Creative Commons

Want to add a feature? Improve something? Fork this repo and open a pull request.

I ask you don't use this for commercial use without permission and link attribution back to this repo under the Creative Commons Attribution-NonCommercial license.

<a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc/4.0/88x31.png" /></a><br /><span xmlns:dct="http://purl.org/dc/terms/" href="http://purl.org/dc/dcmitype/InteractiveResource" property="dct:title" rel="dct:type">D&D Dungeon Generator</span> by <a xmlns:cc="http://creativecommons.org/ns#" href="http://dnd.mysticwaffle.com/" property="cc:attributionName" rel="cc:attributionURL">Mystic Waffle</a> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial 4.0 International License</a>.

## TODO

- [ ] Fix awkward room descriptions.
- [ ] Add rare loot and magical item generation.
- [ ] Required items by room type. For example, a bedroom should always contain at least a bed.
- [ ] Item frequency by room type. For example, books should be more common in libraries and studies.
- [ ] Item quantity by room type. For example, a hallway should typically have fewer items than a laboratory.
- [ ] Add checkbox sets for many of the select menu options. For example, users should be able to select a subset of room types or room conditions, not just "random" or a single room type.
- [ ] Add a max room count setting.
- [ ] Add grid dimension settings.
- [ ] Generate dungeon title and dungeon description.
- [ ] Generate random encounters based on challenge rating and encounter frequency knobs.
- [ ] Add dungeon and environment types. Such as classic dungeon, wilderness, jungle ruin, etc.
- [ ] Config for multiple entrances & exits to the dungeon.
- [ ] Better visuals
