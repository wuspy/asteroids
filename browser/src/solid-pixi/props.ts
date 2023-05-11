import { DisplayObject, DisplayObjectEvents } from "@pixi/display";
import { Point, ObservablePoint, IPoint, IPointData } from "@pixi/core";

export type PointLike = IPointData | [number, number] | number;
export type AnyProps = Record<string, any>;

/**
 * Allowed formats:
 *  { x: number, y: number }
 *  [number, number]
 *  number
 */
function parsePoint(value: PointLike): IPointData {
    if (Array.isArray(value)) {
        if (process.env.NODE_ENV === "development") {
            if (typeof value[0] !== "number" || typeof value[1] !== "number") {
                console.error("Invalid point data", value);
            }
        }
        return { x: value[0], y: value[1] };
    }

    if (typeof value === "number") {
        return { x: value, y: value };
    }

    if (process.env.NODE_ENV === "development") {
        if (typeof value !== "object" || typeof value.x !== "number" || typeof value.y !== "number") {
            console.error("Invalid point data", value);
        }
    }
    return value as IPointData;
}

/**
 * Determine value is type of Point or ObservablePoint
 * See https://github.com/michalochman/react-pixi-fiber/blob/a4dbddbef0ffbf0f563c64d30766ea28222a51ea/src/utils.js#L48
 */
function isPointType(value: any): value is IPoint {
    return value instanceof Point || value instanceof ObservablePoint;
}

export function displayObjectSetProp(instance: DisplayObject, prop: string, newValue: any, oldValue: any): void {
    if (prop.startsWith("on:")) {
        // Event listener
        const event = prop.substring(3) as keyof DisplayObjectEvents;
        if (typeof oldValue === "function") {
            instance.removeListener(event, oldValue);
        }
        if (typeof newValue === "function") {
            instance.addListener(event, newValue);
        }
    } else if (prop.startsWith("yg:")) {
        // Yoga layout prop
        (instance.layout.style as any)[prop.substring(3)] = newValue;
    } else if (isPointType((instance as any)[prop])) {
        // copy point value
        ((instance as any)[prop]).copyFrom(parsePoint(newValue));
    } else {
        // just hard assign value
        (instance as any)[prop] = newValue;
    }
}
