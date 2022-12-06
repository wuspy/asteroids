import { DisplayObject } from "@pixi/display";
import { Point, ObservablePoint, IPoint, IPointData } from "@pixi/math";
import deepEqual from "fast-deep-equal";

export type PointLike = IPointData | [number, number];
export type AnyProps = Record<string, any>;
export type UpdatePayload<Props extends AnyProps> = Partial<Readonly<{[Key in keyof Props]: [Props[Key] | undefined, Props[Key] | undefined]}>>;

/**
 * Allowed formats:
 *  { x: number, y: number }
 *  [number, number]
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

/**
 * Default display object props
 * See https://github.com/michalochman/react-pixi-fiber/blob/a4dbddbef0ffbf0f563c64d30766ea28222a51ea/src/props.js#L9
 */
export const DEFAULT_DISPLAY_OBJECT_PROPS = {
    alpha: 1,
    buttonMode: false,
    cacheAsBitmap: false,
    cursor: null,
    filterArea: null,
    filters: null,
    hitArea: null,
    interactive: false,
    mask: null,
    pivot: 0,
    position: 0,
    renderable: true,
    rotation: 0,
    scale: 1,
    skew: 0,
    transform: null,
    visible: true,
    x: 0,
    y: 0,
} as const;

/**
 * Set value on a PIXI.DisplayObject
 * See https://github.com/Izzimach/react-pixi/blob/a25196251a13ed9bb116a8576d93e9fceac2a14c/src/ReactPIXI.js#L114
 */
function setValue(instance: DisplayObject, prop: string, value: any) {
    if (isPointType((instance as any)[prop])) {
        // copy value
        ((instance as any)[prop]).copyFrom(parsePoint(value));
    } else {
        // just hard assign value
        (instance as any)[prop] = value;
    }
}

// get diff between 2 objects
// https://github.com/facebook/react/blob/97e2911/packages/react-dom/src/client/ReactDOMFiberComponent.js#L546
export function diffProperties<Props extends AnyProps>(lastProps: Props, nextProps: Props): UpdatePayload<Props> | null {
    let updatePayload: UpdatePayload<Props> | null = null;

    // Check for delete properties
    for (const propKey in lastProps) {
        if (propKey === "children" || propKey in nextProps || lastProps[propKey] === undefined) {
            continue;
        }
        if (!updatePayload) {
            updatePayload = {};
        }
        updatePayload[propKey] = [lastProps[propKey], undefined];
    }

    for (const propKey in nextProps) {
        if (propKey === "children") {
            continue;
        }

        const nextProp = nextProps[propKey];
        const lastProp = lastProps[propKey];

        if (!deepEqual(lastProp, nextProp)) {
            if (!updatePayload) {
                updatePayload = {};
            }
            updatePayload[propKey] = [lastProp, nextProp];
        }
    }

    return updatePayload;
}

/**
 * Apply default props on Display Object instance (which are all components)
 */
export function applyDefaultProps(instance: DisplayObject, updatePayload: UpdatePayload<AnyProps>): void {
    for (const propKey in updatePayload) {
        // update event handlers
        if (propKey.startsWith("on:")) {
            const event = propKey.substring(3);
            const [oldValue, newValue] = updatePayload[propKey]!;
            if (typeof oldValue === "function") {
                instance.removeListener(event, oldValue);
            }
            if (typeof newValue === "function") {
                instance.addListener(event, newValue);
            }
            continue;
        }

        const newValue = updatePayload[propKey]![1];
        if (newValue !== undefined) {
            setValue(instance, propKey, newValue);
        } else if (propKey in DEFAULT_DISPLAY_OBJECT_PROPS) {
            if (process.env.NODE_ENV === "development") {
                console.warn(`setting default value '${propKey}', from '${(instance as any)[propKey]}' to '${newValue}' for:`, instance);
            }
            setValue(instance, propKey, (DEFAULT_DISPLAY_OBJECT_PROPS as any)[propKey])
        } else if (process.env.NODE_ENV === "development") {
            console.warn(`ignoring prop '${propKey}', from '${(instance as any)[propKey]}' to '${newValue}' for:`, instance);
        }
    }
}
