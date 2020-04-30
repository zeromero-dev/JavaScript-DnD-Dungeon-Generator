
import {
    createProbability,
    roll,
    rollArrayItem,
    rollPercentile,
} from '../roll.js';

/**
 * @param {import('../../../unit/unit.js').Utility}
 */
export default ({ assert, describe, it }) => {
    describe('#roll', () => {
        it('should return a number', () => {
            assert(roll()).isNumber();
        });

        describe('given a float for `min`', () => {
            it('should throw', () => {
                assert(() => { roll(3.1415); }).throws();
            });
        });

        describe('given a float for `max`', () => {
            it('should throw', () => {
                assert(() => { roll(0, 3.1415); }).throws();
            });
        });

        describe('given a negative `min`', () => {
            it('should throw', () => {
                assert(() => { roll(-100); }).throws();
            });
        });

        describe('given a `min` that is greater than `max`', () => {
            it('should throw', () => {
                assert(() => { roll(100, 20); }).throws();
            });
        });

        describe('given the same `min` and `max`', () => {
            it('should throw', () => {
                assert(roll(10, 10)).equals(10);
            });
        });

        describe('given a `min` and a `max`', () => {
            it('should return an integer between `min` and `max`, inclusive', () => {
                const result = roll(1, 3);
                assert([1, 2, 3].includes(result)).isTrue();
            });
        });
    });

    describe('#rollArrayItem', () => {
        describe('given an array with a single item', () => {
            it('should return the item', () => {
                assert(rollArrayItem([ '20' ])).equals('20');
            });
        });

        describe('given an array with multiple items', () => {
            it('should return one of the item', () => {
                const options = [ 'cats', 'turtles', 'chickens' ];
                const result  = rollArrayItem(options);

                assert((options.includes(result))).isTrue();
            });
        });

        describe('given no value', () => {
            it('should throw', () => {
                assert(() => { rollArrayItem(); }).throws();
            });
        });

        describe('given an empty array', () => {
            it('should throw', () => {
                assert(() => { rollArrayItem([]); }).throws();
            });
        });
    });

    describe('#rollPercentile', () => {
        describe('given a float', () => {
            it('should throw', () => {
                assert(() => { rollPercentile(3.1415); }).throws();
            });
        });

        describe('given an integer less than `1`', () => {
            it('should throw', () => {
                assert(() => { rollPercentile(0); }).throws();
            });
        });

        describe('given an integer greater than `100`', () => {
            it('should throw', () => {
                assert(() => { rollPercentile(216); }).throws();
            });
        });

        describe('given an integer between `1` and `100`', () => {
            it('should return a boolean', () => {
                assert(rollPercentile(2)).isBoolean();
            });
        });
    });

    describe('#createProbability', () => {
        describe('given a valid `config`', () => {
            const probability = createProbability([[ 23, 'boats' ]]);

            it('should return an object`', () => {
                assert(probability).isObject();
            });

            describe('return object properties', () => {
                it('should return a object with a string property `description`', () => {
                    assert(probability.description).isString();
                });

                it('should return an object with a function property `roll`', () => {
                    assert(probability.roll).isFunction();
                });
            });
        });

        describe('return description', () => {
            const probability = createProbability([
                [ 23, 'boats' ],
                [ 55, 'horses' ],
            ]);

            it('should include the probability range and value for each `config` entry', () => {
                assert(probability.description)
                    .stringContains('1-23% boats')
                    .stringContains('24-55% horses');
            });
        });

        it('should return an object`', () => {
            assert(createProbability([[ 23, 'boats' ]])).isObject();
        });

        describe('given a `config` that is not an array`', () => {
            it('should throw', () => {
                assert(() => { createProbability('junk'); }).throws();
            });
        });

        describe('given an empty `config`', () => {
            it('should throw', () => {
                assert(() => { createProbability([]); }).throws();
            });
        });

        describe('given a `config` that is not a 2 dimensional array', () => {
            it('should throw', () => {
                assert(() => { createProbability([ 'junk' ]); }).throws();
            });
        });

        describe('given a `config` with invalid map keys', () => {
            it('should throw', () => {
                assert(() => { createProbability([[ 'bad', 'panda' ]]); }).throws();
            });
        });

        describe('given a `config` with invalid map values', () => {
            it('should throw', () => {
                assert(() => { createProbability([[ 23, 99 ]]); }).throws();
            });
        });

        describe('given a `config` with an out of bounds probability', () => {
            describe('given a map key less than `1`', () => {
                it('should throw', () => {
                    assert(() => {
                        createProbability([
                            [ 0,  'backpack' ],
                            [ 50, 'belt pouch' ]
                        ]);
                    }).throws();
                });
            });

            describe('given a map key greater than `100`', () => {
                it('should throw', () => {
                    assert(() => {
                        createProbability([
                            [ 1,  'backpack' ],
                            [ 102, 'belt pouch' ]
                        ]);
                    }).throws();
                });
            });
        });
    });
};
