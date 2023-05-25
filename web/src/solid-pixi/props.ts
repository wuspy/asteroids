import { DisplayObject, DisplayObjectEvents } from "@pixi/display";
import { Point, ObservablePoint, IPoint, IPointData } from "@pixi/core";

export type PointLike = IPointData | [number, number] | number;

export function setPoint(target: IPoint, value: PointLike) {
    if (Array.isArray(value)) {
        if (process.env.NODE_ENV === "development") {
            if (value.length !== 2 || typeof value[0] !== "number" || typeof value[1] !== "number") {
                console.error("Invalid point data", value);
            }
        }
        target.set(...value);
    } else if (typeof value === "number") {
        target.set(value, value);
    } else {
        if (process.env.NODE_ENV === "development") {
            if (typeof value !== "object" || typeof value.x !== "number" || typeof value.y !== "number") {
                console.error("Invalid point data", value);
            }
        }
        target.copyFrom(value as IPointData);
    }
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
        const style = prop.substring(3);
        if (isPointType((instance.layout.style as any)[style])) {
            setPoint((instance.layout.style as any)[style], newValue);
        } else {
            (instance.layout.style as any)[style] = newValue;
        }
    } else if (isPointType((instance as any)[prop])) {
        // set point value
        setPoint((instance as any)[prop], newValue);
    } else {
        // just hard assign value
        (instance as any)[prop] = newValue;
    }
}
