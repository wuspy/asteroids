import { Container, DisplayObject, DisplayObjectEvents, IDestroyOptions } from "@pixi/display";
import { JSX, Ref } from "solid-js";
import { YogaPixi } from "../yoga-pixi";
import { PointLike, displayObjectSetProp } from './props';

export type IfEquals<X, Y, A = X, B = never> =
    (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

export type ReadonlyKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
}[keyof T];

export type WithPointLike<T extends keyof any> = { [P in T]: PointLike };

export type WithPrefix<P extends string, T> = {
    [K in keyof T as K extends string | number ? `${P}:${K}` : never]: T[K];
};

type YogaPixiPointLikes = "anchor";

export type YogaProps = Partial<WithPrefix<"yg", Omit<
    YogaPixi,
    YogaPixiPointLikes | ReadonlyKeys<YogaPixi>
> & WithPointLike<YogaPixiPointLikes>>>;

type DisplayObjectPointLikes = "position" | "scale" | "pivot" | "anchor" | "skew";

export type DisplayObjectEventProps = WithPrefix<"on", {
    [P in keyof DisplayObjectEvents]?: (...args: DisplayObjectEvents[P]) => void;
}>;

export type PixiDisplayObjectProps<T extends DisplayObject> = Partial<
    Omit<T, "children" | "style" | "layout" | DisplayObjectPointLikes | ReadonlyKeys<T>>
        & WithPointLike<DisplayObjectPointLikes>
> & DisplayObjectEventProps & YogaProps & { ref?: Ref<T> };

export type PixiContainerProps<T extends Container> = PixiDisplayObjectProps<T> & { children?: JSX.Element };

type AnyProps = Record<string, any>;

export interface PixiComponentLifecycle<Props extends AnyProps, PixiInstance extends DisplayObject> {
    /**
     * Create the PIXI instance
     */
    create(): PixiInstance;

    /**
     * Instance mounted
     */
    didMount?(instance: PixiInstance): void;

    /**
     * Instance will unmount.
     */
    willUnmount?(instance: PixiInstance): IDestroyOptions;

    /**
     * Apply props for this custom component.
     */
    setProp?<P extends keyof Props>(
        instance: PixiInstance,
        prop: P,
        newValue: Props[P] | undefined,
        oldValue: Props[P] | undefined
    ): void;
}

export type SolidPixiInstance<PixiInstance extends DisplayObject = DisplayObject> = PixiInstance & {
    __solidpixi: Readonly<{
        setProp: NonNullable<PixiComponentLifecycle<AnyProps, PixiInstance>["setProp"]>,
        didMount: NonNullable<PixiComponentLifecycle<AnyProps, PixiInstance>["didMount"]>,
        willUnmount: NonNullable<PixiComponentLifecycle<AnyProps, PixiInstance>["willUnmount"]>,
    }>,
};

/**
 * Injected types
 */
const TYPES: { [Key in string]: Required<PixiComponentLifecycle<AnyProps, DisplayObject>> } = {};

/**
 * Create an element based on tag type
 */
export function createPixiElement(tagName: string): SolidPixiInstance {
    const lifecycle = TYPES[tagName];
    const instance = lifecycle.create() as SolidPixiInstance;

    instance.__solidpixi = lifecycle;

    return instance;
}

function defaultDidMount() { } // eslint-disable-line
function defaultWillUnmount() {
    return { children: true };
}

/**
 * Create Component
 */
export function registerPixiComponent<Props extends AnyProps, PixiInstance extends DisplayObject>(
    tagName: string,
    lifecycle: PixiComponentLifecycle<Props, PixiInstance>
): void {
    if (tagName in TYPES) {
        throw new Error(`A component named '${tagName}' is already registered`);
    }
    if (!tagName.match(/^[a-z_]+[a-z0-9_]*$/)) {
        throw new Error(`Invalid component name '${tagName}'`);
    }
    TYPES[tagName] = {
        create: lifecycle.create,
        setProp: lifecycle.setProp || displayObjectSetProp,
        didMount: lifecycle.didMount || defaultDidMount,
        willUnmount: lifecycle.willUnmount || defaultWillUnmount,
    };
}
