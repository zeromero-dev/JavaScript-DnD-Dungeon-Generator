
import { createAttrs } from '../utility/html';
import { directions } from './map';
import doorType, { lockable } from '../rooms/door';

const pxBorder   = 2;
const pxCell     = 24;
const pxGridLine = 1;

const colorGridFill   = '#f0f0f0';
const colorGridStroke = '#cfcfcf';
const colorRoomFill   = 'rgba(255, 255, 255, 0.7)';
const colorRoomStroke = '#a9a9a9';
const colorText       = '#666666';
const colorPillarFill = '#ffffff';

const pillarRadius = 4;
const doorWidth    = 8;
const doorInset    = 12;

const labelRoomNumberFontSize = 14;
const labelRoomTypeFontSize   = 10;

const drawText = (text, [ x, y ], { fontSize }) => {
    let attrs = createAttrs({
        x, y: y + 2,
        fill: colorText,
        'alignment-baseline': 'middle',
        'font-family': 'monospace',
        'font-size': `${fontSize}px`,
        'text-anchor': 'middle',
    });

    return `<text ${attrs}>${text}</text>`;
};

const drawLine = ({ x1, y1, x2, y2, color, width }) => {
    let attrs = createAttrs({
        x1, y1, x2, y2,
        stroke: color,
        'shape-rendering': 'crispEdges',
        'stroke-linecap': 'square',
        'stroke-width': width,
    });

    return `<line ${attrs} />`;
};

const drawCircle = ({ cx, cy, r }) => {
    let attrs = createAttrs({
        cx, cy, r,
        stroke: colorRoomStroke,
        fill: colorPillarFill,
        'shape-rendering': 'geometricPrecision',
        'stroke-width': 2,
    });

    return `<circle ${attrs} />`;
};

const drawRect = (rectAttrs) => {
    let attrs = createAttrs(rectAttrs);

    return `<rect ${attrs} />`;
}

export const getRectAttrs = ({ x, y, width, height }) => {
    let xPx = x * pxCell;
    let yPx = y * pxCell;

    let widthPx  = width * pxCell;
    let heightPx = height * pxCell;

    return { x: xPx, y: yPx, width: widthPx, height: heightPx }
};

export const drawGrid = ({ gridWidth, gridHeight }) => {
    let lines = '';

    let gridLineAttrs = {
        color: colorGridStroke,
        width: pxGridLine,
    };

    for (let i = 0; i <= gridHeight; i++) {
        let unit = i * pxCell;

        lines += drawLine({
            ...gridLineAttrs,
            x1: 0,
            y1: unit,
            x2: gridWidth * pxCell,
            y2: unit,

        });
    }

    for (let i = 0; i <= gridWidth; i++) {
        let unit = i * pxCell;

        lines += drawLine({
            ...gridLineAttrs,
            x1: unit,
            y1: 0,
            x2: unit,
            y2: gridHeight * pxCell,
        });
    }

    return lines;
};

export const drawRoom = (rectAttrs) => {
    let attrs = {
        ...rectAttrs,
        fill: colorRoomFill,
        stroke: colorRoomStroke,
        'shape-rendering': 'crispEdges',
        'stroke-width': pxBorder,
    };

    return drawRect(attrs);
};

export const drawRoomText = (rectAttrs, { roomNumber, roomLabel }) => {
    let middleX = (rectAttrs.x + rectAttrs.width  / 2);
    let middleY = (rectAttrs.y + rectAttrs.height / 2);

    let fontSize = labelRoomNumberFontSize;
    let labelY   = roomLabel ? middleY - (fontSize / 2) : middleY;

    let text = drawText(roomNumber, [ middleX, labelY ], { fontSize });

    if (roomLabel) {
        let roomLabelY = labelY + fontSize;

        text += drawText(roomLabel, [ middleX, roomLabelY ], { fontSize: labelRoomTypeFontSize });
    }

    return text;
};

export const drawDoor = (doorAttrs, { direction, type }) => {
    let rectAttrs = getRectAttrs(doorAttrs);

    let attrs = createAttrs({
        ...rectAttrs,
        fill: colorRoomFill,
        stroke: colorRoomFill,
        'stroke-width': pxBorder,
    });

    let rect = `<rect ${attrs} />`;

    let { x, y, width, height } = rectAttrs;

    let lineAttrs = {
        color: colorRoomStroke,
        width: pxBorder,
    };

    let lineCords = [];
    let isVertical = direction === directions.north || direction === directions.south;

    let xHalf   = x + (width / 2);
    let yHalf   = y + (height / 2);
    let xRight  = x + width
    let yBottom = y + height

    if (isVertical) {
        let y2 = y + height;

        lineCords.push({ x1: x,      y1: y, x2: x,      y2: y2 });
        lineCords.push({ x1: xRight, y1: y, x2: xRight, y2: y2 });
            // drawLine({ ...lineAttrs, x1, y1: yHalf, x2: xRight, y2: yHalf }),
    } else {
        let x2 = x + width;

        lineCords.push({ x1: x, y1: y,       x2: x2, y2: y });
        lineCords.push({ x1: x, y1: yBottom, x2: x2, y2: yBottom });

            // drawLine({ ...lineAttrs, x1: xHalf, y1, x2: xHalf, y2: yBottom }),
    }

    let details = [];

    if (lockable.has(type)) {
        let x1 = isVertical ? x      : xHalf;
        let y1 = isVertical ? yHalf  : y;
        let x2 = isVertical ? xRight : xHalf;
        let y2 = isVertical ? yHalf  : yBottom;

        lineCords.push({ x1, y1, x2, y2 });

        let inset     = isVertical ? (width - doorInset) : (height - doorInset);
        let halfInset = doorInset / 2;
        let halfWidth = doorWidth / 2;

        let rectWidth  = isVertical ? inset : doorWidth;
        let rectHeight = isVertical ? doorWidth : inset;

        let rectX = isVertical ? (x1 + halfInset) : (x1 - halfWidth);
        let rectY = isVertical ? (y1 - halfWidth) : (y1 + halfInset);

        details.push(drawRect({
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight,
            fill: colorPillarFill,
            stroke: colorRoomStroke,
            'stroke-width': pxBorder,
        }));

    } else if (type === doorType.archway) {
        let cx  = isVertical ? x      : xHalf;
        let cy  = isVertical ? yHalf  : y;
        let cx2 = isVertical ? xRight : cx;
        let cy2 = isVertical ? cy     : yBottom;

        details.push(drawCircle({ cx, cy, r: pillarRadius }));
        details.push(drawCircle({ cx: cx2, cy: cy2, r: pillarRadius }));

    } else if (type === doorType.hole) {

    }

    let lines = lineCords.map((cords) => drawLine({ ...lineAttrs, ...cords })).join('');

    return rect + lines + details.join();
};

export const drawMap = ({ gridWidth, gridHeight }, content) => {
    let attrs = createAttrs({
        width : (gridWidth * pxCell),
        height: (gridHeight * pxCell),
        style : `background: ${colorGridFill}; overflow: visible;`,
    });

    return `<svg ${attrs}>${content}</svg>`;
};
