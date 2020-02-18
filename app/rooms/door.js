
import { Probability } from '../utility/roll.js';

const door = {
    archway   : 'archway',
    brass     : 'brass',
    concealed : 'concealed',
    hole      : 'hole',
    iron      : 'iron',
    mechanical: 'mechanical',
    passageway: 'passageway',
    portal    : 'portal',
    portcullis: 'portcullis',
    secret    : 'secret',
    steel     : 'steel',
    stone     : 'stone',
    wooden    : 'wooden',
};

export default door;

export const list = Object.keys(door);

export const outside = 'outside';

export const appendDoorway = new Set([
    door.brass,
    door.iron,
    door.mechanical,
    door.steel,
    door.stone,
    door.wooden,
]);

export const lockable = new Set([
    door.brass,
    door.iron,
    door.mechanical,
    door.portcullis,
    door.steel,
    door.stone,
    door.wooden,
]);

export const probability = new Probability([
    [ 20,  door.passageway ],
    [ 40,  door.archway    ],
    [ 55,  door.hole       ],
    [ 60,  door.mechanical ],
    [ 65,  door.portcullis ],
    [ 75,  door.wooden     ],
    [ 80,  door.steel      ],
    [ 85,  door.iron       ],
    [ 90,  door.brass      ],
    [ 95,  door.stone      ],
    [ 100, door.portal     ],
]);

export const secretProbability = new Probability([
    [ 15, door.concealed ],
    [ 30, door.secret    ],
]);

export const lockedChance = 25;

export const createDoorLookup = (doors) => {
    let lookup = {};
    let keys   = [];

    doors.forEach((door) => {
        Object.keys(door.connections).forEach((roomNumber) => {
            if (!lookup[roomNumber]) {
                lookup[roomNumber] = [];
            }

            let roomDoor = {
                ...door,
                connection: door.connections[roomNumber],
            };

            if (door.locked) {
                keys.push({
                    type: door.type,
                    connections: door.connections
                });
            }

            lookup[roomNumber].push(roomDoor);
        });
    });

    return {
        keys,
        doors: lookup,
    };
};
