import { Container, DisplayObject } from "@pixi/display";
import React from "react";
import { AnyProps, applyDefaultProps, diffProperties, PointLike, UpdatePayload } from './props'

type Events = {
    [P in `on:${string}`]?: (...args: any[]) => void;
};

type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

type ReadonlyKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
}[keyof T];

type WithPointLike<T extends keyof any> = { [P in T]: PointLike };

type DisplayObjectPointLikes = "position" | "scale" | "pivot" | "anchor" | "skew";

export type PixiDisplayObjectProps<T extends DisplayObject> = Partial<
    Omit<T, "children" | DisplayObjectPointLikes | ReadonlyKeys<T>> & WithPointLike<DisplayObjectPointLikes>
> & Events & { ref?: React.Ref<T> };

export type PixiContainerProps<T extends Container> = PixiDisplayObjectProps<T> & { children?: React.ReactNode };

export type RefType<C> = C extends React.FC<infer P>
    ? P extends { ref?: React.Ref<infer T> } ? T : never
    : never;

export interface PixiComponentLifecycle<Props extends AnyProps, PixiInstance extends DisplayObject> {
    /**
     * Create the PIXI instance
     * The component is created during React reconciliation.
     */
    create(props: Readonly<Props>): PixiInstance;

    /**
     * Instance mounted
     * This is called during React reconciliation.
     */
    didMount?(instance: PixiInstance, parent: Container): void;

    /**
     * Instance will unmount
     * This is called during React reconciliation.
     */
    willUnmount?(instance: PixiInstance, parent: Container): void;

    /**
     * Apply props for this custom component.
     * This is called during React reconciliation.
     */
    applyProps?(instance: PixiInstance, updatePayload: UpdatePayload<Props>): void;

    /**
     * Reconcile config
     */
    config?: {
        /**
         * Destroy instance on unmount?
         * @default true
         */
        destroy: boolean;

        /**
         * Destroy child instances?
         * @default true
         */
        destroyChildren: boolean;
    }
}

const DEFAULT_CONFIG = {
    destroy: true,
    destroyChildren: true,
};

export type ReactPixiInstance<PixiInstance extends DisplayObject = DisplayObject> = PixiInstance & {
    __reactpixi: {
        root?: ReactPixiInstance<Container>,
        applyProps: NonNullable<PixiComponentLifecycle<AnyProps, PixiInstance>["applyProps"]>,
        didMount?: PixiComponentLifecycle<AnyProps, PixiInstance>["didMount"],
        willUnmount?: PixiComponentLifecycle<AnyProps, PixiInstance>["willUnmount"],
        config: NonNullable<PixiComponentLifecycle<AnyProps, PixiInstance>["config"]>,
    }
}

/**
 * Injected types
 */
const TYPES: { [Key in string]: PixiComponentLifecycle<AnyProps, DisplayObject> } = {};

/**
 * Create an element based on tag type
 * Similar to react-dom's `React.createElement()`
 */
export function createElement(type: string, props: AnyProps = {}, rootContainer: ReactPixiInstance<Container> | undefined = undefined) {
    const component = TYPES[type];
    const instance = component.create(props) as ReactPixiInstance;

    instance.__reactpixi = {
        root: rootContainer,
        applyProps: component.applyProps || applyDefaultProps,
        didMount: component.didMount,
        willUnmount: component.willUnmount,
        config: component.config || DEFAULT_CONFIG,
    };

    // Apply initial props
    const updatePayload = diffProperties({}, props);
    if (updatePayload) {
        instance.__reactpixi.applyProps(instance, updatePayload);
    }

    return instance;
}

/**
 * Create Component
 */
export function PixiComponent<Props extends AnyProps, PixiInstance extends DisplayObject>(
    componentName: string,
    lifecycle: PixiComponentLifecycle<Props, PixiInstance>
): React.FC<Props> {
    if (componentName in TYPES) {
        throw new Error(`A component named '${componentName}' is already registered`);
    }
    TYPES[componentName] = lifecycle;
    // @ts-ignore FC return type is purely for type completion
    return componentName;
}
