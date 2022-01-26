import { ISize, IPointData, Rectangle, Polygon, PI_2 } from "@pixi/math";
import { random } from "./random";

// Aliased because the name IPointData doesn't really make sense when referring to things like
// velocity or deltas, which this type is also used for. Also to shorten the name.
export type Vec2 = IPointData;

export type LineSegment = [Vec2, Vec2];

export const dotVec2 = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

export const addVec2 = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });

export const subVec2 = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const clamp = (value: number, max: number, min?: number): number => Math.max(min ?? -max, Math.min(max, value));

export type HitArea = Polygon | number;

// Returns true if points a, b, and c are arranged in a counterclockwise orientation
const ccw = (a: Vec2, b: Vec2, c: Vec2) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);

// Returns true if lines a and b intersect
export const linesIntersect = (a: LineSegment, b: LineSegment) =>
    ccw(a[0], b[0], b[1]) != ccw(a[1], b[0], b[1])
    && ccw(a[0], a[1], b[0]) != ccw(a[0], a[1], b[1]);

// Returns true if points a and b are within a certain distance from eachother
export const pointsCoincident = (a: Vec2, b: Vec2, distance = 0) => Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2) <= distance;

// Gets the midpoint of a line segment
export const lineMidpoint = (line: LineSegment): Vec2 => ({ x: (line[0].x + line[1].x) / 2, y: (line[0].y + line[1].y) / 2 })

// atan2 where the result is adjusted to the game's coordinate system
export const atan2 = (y: number, x: number): number => {
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) {
        angle += PI_2;
    }
    return angle;
}

export const scaleRectangle = (rect: Rectangle, scale: number): Rectangle => {
    if (scale === 1) {
        return rect;
    }
    return new Rectangle(
        rect.x - (rect.width / 2),
        rect.y - (rect.height / 2),
        rect.width * 2,
        rect.height * 2
    );
}

export const translateRectangle = (rect: Rectangle, delta: Vec2): Rectangle => {
    if (delta.x === 0 && delta.y === 0) {
        return rect;
    }
    const pos = addVec2(rect, delta);
    return new Rectangle(
        pos.x,
        pos.y,
        rect.width,
        rect.height,
    );
};

export const rectanglesIntersect = (a: Rectangle, b: Rectangle): boolean =>
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

export const translatePolygon = (polygon: Polygon, delta: Vec2): Polygon => {
    if (delta.x === 0 && delta.y === 0) {
        return polygon;
    }
    return new Polygon(polygon.points.map((num, index) =>
        num + (index % 2 === 0 ? delta.x : delta.y)
    ));
}

export const rotatePolygon = (polygon: Polygon, angle: number): Polygon => {
    if (angle % PI_2 === 0) {
        return polygon;
    }
    const [sin, cos] = [Math.sin(angle), Math.cos(angle)];
    return new Polygon(polygon.points.map((num, index) =>
        index % 2 === 0
            ? num * cos - polygon.points[index + 1] * sin
            : num * cos + polygon.points[index - 1] * sin
    ));
}

export const scalePolygon = (polygon: Polygon, scale: number): Polygon => {
    if (scale === 1) {
        return polygon;
    }
    return new Polygon(polygon.points.map((num) => num * scale));
}

export const getPolygonBoundingBox = (polygon: Polygon): Rectangle => {
    if (polygon.points.length === 0) {
        throw new Error("Cannot find bounding box for empty polygon");
    }
    let [x1, x2, y1, y2] = [
        polygon.points[0],
        polygon.points[0],
        polygon.points[1],
        polygon.points[1]
    ];
    for (let i = 2; i < polygon.points.length; i += 2) {
        x1 = Math.min(x1, polygon.points[i]);
        y1 = Math.min(y1, polygon.points[i + 1]);
        x2 = Math.max(x2, polygon.points[i]);
        y2 = Math.max(y2, polygon.points[i + 1]);
    }
    return new Rectangle(x1, y1, x2 - x1, y2 - y1);
}

// Returns true if the point is contained in the polygon within a certain margin of error.
// Uses the raycasting method.
export const polygonContainsPoint = (polygon: Polygon, point: Vec2, polygonCenter: Vec2, margin = 0) => {
    const adjacent = polygonCenter.x - point.x;
    const opposite = polygonCenter.y - point.y;
    const hypotenuse = Math.sqrt(adjacent ** 2 + opposite ** 2);
    const sin = opposite / hypotenuse;
    const cos = adjacent / hypotenuse;
    const p1: Vec2 = { x: point.x + margin * cos, y: point.y + margin * sin };
    const p2: Vec2 = { x: point.x + 1000000 * cos, y: point.y + 1000000 * sin };

    let intersections = 0;
    for (let i = 0; i < polygon.points.length; i += 2) {
        const pp1 = { x: polygon.points[i], y: polygon.points[i + 1] };
        const pp2 = { x: polygon.points[(i + 2) % polygon.points.length], y: polygon.points[(i + 3) % polygon.points.length] };
        intersections += +linesIntersect([p1, p2], [pp1, pp2]);
    }
    return intersections % 2 === 1;
}

/**
 * Returns true if a polygon intersects another.
 * Uses line segment intersection, so can be relatively slow when testing two complex polygons.
 */
export const polygonsIntersects = (a: Polygon, b: Polygon) => {
    for (let ai = 0; ai < a.points.length; ai += 2) {
        const a1 = { x: a.points[ai], y: a.points[ai + 1] };
        const a2 = { x: a.points[(ai + 2) % a.points.length], y: a.points[(ai + 3) % a.points.length] };
        for (let bi = 0; bi < b.points.length; bi += 2) {
            const b1 = { x: b.points[bi], y: b.points[bi + 1] };
            const b2 = { x: b.points[(bi + 2) % b.points.length], y: b.points[(bi + 3) % b.points.length] };
            if (linesIntersect([a1, a2], [b1, b2])) {
                return true;
            }
        }
    }
    return false;
}

// Finds a random unoccupied location to plce an an object of size objectSize within a bounding box with a list of obstacles.
//
// This is currently just a brute force algorithm and although it doesn't matter for the number of objects
// we're dealing with in this game, it should probably be rewritten at some point.
export const findUnoccupiedPosition = (params: {
    bounds: Rectangle,
    objectSize: ISize,
    obstacles: Rectangle[],
    useSeededRandom: boolean,
}): Vec2 => {
    const margin: ISize = { width: params.objectSize.width / 2, height: params.objectSize.height / 2 };
    const object = new Rectangle(
        -margin.width,
        -margin.height,
        params.objectSize.width,
        params.objectSize.height
    );

    locationSearch:
    for (let i = 0; i < 1000; i++) {
        const location: Vec2 = {
            x: random(params.bounds.left, params.bounds.right, params.useSeededRandom),
            y: random(params.bounds.top, params.bounds.bottom, params.useSeededRandom)
        };
        const translatedObject = translateRectangle(object, location);
        for (const obstacle of params.obstacles) {
            if (rectanglesIntersect(translatedObject, obstacle)) {
                continue locationSearch;
            }
        }
        return location;
    }
    // No location found, try again at 90% size
    console.warn("Could not find unoccupied position for object ", params.objectSize);
    return findUnoccupiedPosition({
        ...params,
        objectSize: { width: params.objectSize.width * 0.9, height: params.objectSize.height * 0.9 }
    });
}

const calculateInterceptTime = (params: {
    relPosition: Vec2,
    relVelocity: Vec2,
    speed: number,
}): number | undefined => {
    // Based on https://www.gamedeveloper.com/programming/shooting-a-moving-target
    const a = dotVec2(params.relVelocity, params.relVelocity) - params.speed ** 2;
    const b = 2 * dotVec2(params.relVelocity, params.relPosition);
    const c = dotVec2(params.relPosition, params.relPosition);

    const desc = b * b - 4 * a * c;

    // If the discriminant is negative, then there is no solution
    if (desc > 0) {
        return 2 * c / (Math.sqrt(desc) - b);
    } else {
        return undefined;
    }
}

/**
 * Calculates the velocity needed for origin moving at originSpeed to intercept a target moving
 * at constant velocity
 */
export const calculateVelocityToIntercept = (params: {
    originPosition: Vec2,
    originSpeed: number,
    targetPosition: Vec2,
    targetVelocity: Vec2,
}): Vec2 | undefined => {
    const relPosition = subVec2(params.targetPosition, params.originPosition);
    const relVelocity = params.targetVelocity;
    const t = calculateInterceptTime({ relPosition, relVelocity, speed: params.originSpeed });
    if (t === undefined) {
        return undefined;
    }

    const relInterceptPosition: Vec2 = {
        x: relPosition.x + relVelocity.x * t,
        y: relPosition.y + relVelocity.y * t,
    };

    const distance = Math.sqrt(relInterceptPosition.x ** 2 + relInterceptPosition.y ** 2);

    return {
        x: params.originSpeed * (relInterceptPosition.x / distance),
        y: params.originSpeed * (relInterceptPosition.y / distance),
    };
}
