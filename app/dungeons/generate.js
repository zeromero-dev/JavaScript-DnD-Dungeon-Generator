
import { generateMap } from './map';

export const generateDungeon = (settings) => {
    return [
        generateMap(settings),
    ].join('');
};
