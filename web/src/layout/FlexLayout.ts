import { DisplayObject } from "@pixi/display";
import { Point, Rectangle } from "@pixi/math";
import * as yg from "yoga-wasm-web";
import getYoga from "./getYoga";

function withInverse<M extends Record<string, number>>(map: M): M & { [K in number]: keyof M } {
    const inverse: { [K in number]: keyof M } = {} as any;
    for (const k in map) {
        inverse[map[k]] = k;
    }
    return { ...map, ...inverse };
}

const flexDirection = withInverse({
    "row": yg.FLEX_DIRECTION_ROW,
    "row-reverse": yg.FLEX_DIRECTION_ROW_REVERSE,
    "column": yg.FLEX_DIRECTION_COLUMN,
    "column-reverse": yg.FLEX_DIRECTION_COLUMN_REVERSE,
} as const);

export type FlexDirection = Extract<keyof typeof flexDirection, string>;

const justifyContent = withInverse({
    "flex-start": yg.JUSTIFY_FLEX_START,
    "center": yg.JUSTIFY_CENTER,
    "flex-end": yg.JUSTIFY_FLEX_END,
    "space-between": yg.JUSTIFY_SPACE_BETWEEN,
    "space-around": yg.JUSTIFY_SPACE_AROUND,
    "space-evenly": yg.JUSTIFY_SPACE_EVENLY,
} as const);

export type JustifyContent = Extract<keyof typeof justifyContent, string>;

const flexWrap = withInverse({
    "nowrap": yg.WRAP_NO_WRAP,
    "wrap": yg.WRAP_WRAP,
    "wrap-reverse": yg.WRAP_WRAP_REVERSE,
} as const);

export type FlexWrap = Extract<keyof typeof flexWrap, string>;

const align = withInverse({
    "auto": yg.ALIGN_AUTO,
    "flex-start": yg.ALIGN_FLEX_START,
    "center": yg.ALIGN_CENTER,
    "flex-end": yg.ALIGN_FLEX_END,
    "stretch": yg.ALIGN_STRETCH,
    "baseline": yg.ALIGN_BASELINE,
    "space-between": yg.ALIGN_SPACE_BETWEEN,
    "space-around": yg.ALIGN_SPACE_AROUND,
} as const);

export type Align = Extract<keyof typeof align, string>;

const positionType = withInverse({
    "static": yg.POSITION_TYPE_STATIC,
    "relative": yg.POSITION_TYPE_RELATIVE,
    "absolute": yg.POSITION_TYPE_ABSOLUTE,
} as const);

export type PositionType = Extract<keyof typeof positionType, string>;

export type Value = number | string | undefined;

export enum MeasureMode {
    Undefined = yg.MEASURE_MODE_UNDEFINED,
    Exactly = yg.MEASURE_MODE_EXACTLY,
    AtMost = yg.MEASURE_MODE_AT_MOST,
}

export interface ComputedEdges {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

function fromNativeValue(value: { unit: yg.Unit, value: number }): Value {
    switch (value.unit) {
        case yg.UNIT_AUTO:
            return "auto";
        case yg.UNIT_PERCENT:
            return `${value.value}%`;
        case yg.UNIT_POINT:
            return value.value;
        default:
            return undefined;
    }
}

type YgValueSetter =
    | "setPosition"
    | "setMargin"
    | "setFlexBasis"
    | "setWidth"
    | "setHeight"
    | "setMinWidth"
    | "setMinHeight"
    | "setMaxWidth"
    | "setMaxHeight"
    | "setPadding";

export class FlexLayoutStyleProxy {
    private readonly _node: yg.Node;

    constructor(node: yg.Node) {
        this._node = node;
        this.excluded = false;
        this.anchor = new Point(0, 0);
    }

    anchor: Point;
    excluded: boolean;

    get alignContent(): Align {
        return align[this._node.getAlignContent()];
    }

    set alignContent(value: Align) {
        this._node.setAlignContent(align[value]);
    }

    get alignItems(): Align {
        return align[this._node.getAlignItems()];
    }

    set alignItems(value: Align) {
        this._node.setAlignItems(align[value]);
    }

    get alignSelf(): Align {
        return align[this._node.getAlignSelf()];
    }

    set alignSelf(value: Align) {
        this._node.setAlignSelf(align[value]);
    }

    get aspectRatio(): number {
        return this._node.getAspectRatio();
    }

    set aspectRatio(aspectRatio: number) {
        this._node.setAspectRatio(aspectRatio);
    }

    set flex(flex: number) {
        this._node.setFlex(flex);
    }

    get flexGrow(): number {
        return this._node.getFlexGrow();
    }

    set flexGrow(flexGrow: number) {
        this._node.setFlexGrow(flexGrow);
    }

    get flexShrink(): number {
        return this._node.getFlexShrink();
    }

    set flexShrink(flexShrink: number) {
        this._node.setFlexShrink(flexShrink);
    }

    get flexWrap(): FlexWrap {
        return flexWrap[this._node.getFlexWrap()];
    }

    set flexWrap(value: FlexWrap) {
        this._node.setFlexWrap(flexWrap[value]);
    }

    get flexDirection(): FlexDirection {
        return flexDirection[this._node.getFlexDirection()];
    }

    set flexDirection(value: FlexDirection) {
        this._node.setFlexDirection(flexDirection[value]);
    }

    get flexBasis(): Value {
        return fromNativeValue(this._node.getFlexBasis());
    }

    set flexBasis(value: Value) {
        this.setNativeValue("setFlexBasis", value);
    }

    get justifyContent(): JustifyContent {
        return justifyContent[this._node.getJustifyContent()];
    }

    set justifyContent(value: JustifyContent) {
        this._node.setJustifyContent(justifyContent[value]);
    }

    get marginTop(): Value {
        return fromNativeValue(this._node.getMargin(yg.EDGE_TOP));
    }

    set marginTop(value: Value) {
        this.setNativeValue("setMargin", yg.EDGE_TOP, value);
    }

    get marginBottom(): Value {
        return fromNativeValue(this._node.getMargin(yg.EDGE_BOTTOM));
    }

    set marginBottom(value: Value) {
        this.setNativeValue("setMargin", yg.EDGE_BOTTOM, value);
    }

    get marginLeft(): Value {
        return fromNativeValue(this._node.getMargin(yg.EDGE_LEFT));
    }

    set marginLeft(value: Value) {
        this.setNativeValue("setMargin", yg.EDGE_LEFT, value);
    }

    get marginRight(): Value {
        return fromNativeValue(this._node.getMargin(yg.EDGE_RIGHT));
    }

    set marginRight(value: Value) {
        this.setNativeValue("setMargin", yg.EDGE_RIGHT, value);
    }

    set marginY(value: Value) {
        this.setNativeValue("setMargin", yg.EDGE_VERTICAL, value);
    }

    set marginX(value: Value) {
        this.setNativeValue("setMargin", yg.EDGE_HORIZONTAL, value);
    }

    set margin(value: Value) {
        this.setNativeValue("setMargin", yg.EDGE_ALL, value);
    }

    get paddingTop(): Value {
        return fromNativeValue(this._node.getPadding(yg.EDGE_TOP));
    }

    set paddingTop(value: Value) {
        this.setNativeValue("setPadding", yg.EDGE_TOP, value);
    }

    get paddingBottom(): Value {
        return fromNativeValue(this._node.getPadding(yg.EDGE_BOTTOM));
    }

    set paddingBottom(value: Value) {
        this.setNativeValue("setPadding", yg.EDGE_BOTTOM, value);
    }

    get paddingLeft(): Value {
        return fromNativeValue(this._node.getPadding(yg.EDGE_LEFT));
    }

    set paddingLeft(value: Value) {
        this.setNativeValue("setPadding", yg.EDGE_LEFT, value);
    }

    get paddingRight(): Value {
        return fromNativeValue(this._node.getPadding(yg.EDGE_RIGHT));
    }

    set paddingRight(value: Value) {
        this.setNativeValue("setPadding", yg.EDGE_RIGHT, value);
    }

    set paddingY(value: Value) {
        this.setNativeValue("setPadding", yg.EDGE_VERTICAL, value);
    }

    set paddingX(value: Value) {
        this.setNativeValue("setPadding", yg.EDGE_HORIZONTAL, value);
    }

    set padding(value: Value) {
        this.setNativeValue("setPadding", yg.EDGE_ALL, value);
    }

    get position(): PositionType {
        return positionType[this._node.getPositionType()];
    }

    set position(value: PositionType) {
        this._node.setPositionType(positionType[value]);
    }

    get top(): Value {
        return fromNativeValue(this._node.getPosition(yg.EDGE_TOP));
    }

    set top(value: Value) {
        this.setNativeValue("setPosition", yg.EDGE_TOP, value);
    }

    get left(): Value {
        return fromNativeValue(this._node.getPosition(yg.EDGE_LEFT));
    }

    set left(value: Value) {
        this.setNativeValue("setPosition", yg.EDGE_LEFT, value);
    }

    get right(): Value {
        return fromNativeValue(this._node.getPosition(yg.EDGE_RIGHT));
    }

    set right(value: Value) {
        this.setNativeValue("setPosition", yg.EDGE_RIGHT, value);
    }

    get bottom(): Value {
        return fromNativeValue(this._node.getPosition(yg.EDGE_BOTTOM));
    }

    set bottom(value: Value) {
        this.setNativeValue("setPosition", yg.EDGE_BOTTOM, value);
    }

    set inset(value: Value) {
        this.setNativeValue("setPosition", yg.EDGE_ALL, value);
    }

    get width(): Value {
        return fromNativeValue(this._node.getWidth());
    }

    set width(value: Value) {
        this.setNativeValue("setWidth", value);
    }

    get height(): Value {
        return fromNativeValue(this._node.getHeight());
    }

    set height(value: Value) {
        this.setNativeValue("setHeight", value);
    }

    get maxWidth(): Value {
        return fromNativeValue(this._node.getMaxWidth());
    }

    set maxWidth(value: Value) {
        this.setNativeValue("setMaxWidth", value);
    }

    get maxHeight(): Value {
        return fromNativeValue(this._node.getMaxHeight());
    }

    set maxHeight(value: Value) {
        this.setNativeValue("setMaxHeight", value);
    }

    get minWidth(): Value {
        return fromNativeValue(this._node.getMinWidth());
    }

    set minWidth(value: Value) {
        this.setNativeValue("setMinWidth", value);
    }

    get minHeight(): Value {
        return fromNativeValue(this._node.getMinHeight());
    }

    set minHeight(value: Value) {
        this.setNativeValue("setMinHeight", value);
    }

    private setNativeValue<T extends YgValueSetter>(
        method: T,
        ...args: Parameters<yg.Node[T]> extends [...infer R, any]
            ? [...R, Value]
            : [Value]
    ) {
        const value = args.pop() as Value;
        if (value === "auto") {
            const setMethodAuto = `${method}Auto`;
            if (!(setMethodAuto in this._node)) {
                throw new Error(`${method} cannot take value 'auto'`);
            }
            // @ts-expect-error
            this._node[setMethodAuto](...args);
        } else if (value === undefined) {
            // @ts-expect-error
            this._node[method](...args, NaN);
        } else if (typeof value === "string" && value.endsWith("%")) {
            // @ts-expect-error
            this._node[`${method}Percent`](...args, parseFloat(value));
        } else {
            // @ts-expect-error
            this._node[method](...args, Number(value));
        }
    }
}

export default class FlexLayout {
    private readonly _node: yg.Node;
    private readonly _displayObject: DisplayObject;
    private _parent?: FlexLayout;
    private _children: FlexLayout[];

    readonly style: FlexLayoutStyleProxy;
    readonly computedLayout: Rectangle;
    readonly cachedLocalBounds: Rectangle;

    constructor(displayObject: DisplayObject) {
        const yoga = getYoga();
        const config = yoga.Config.create();
        config.setUseWebDefaults(true);
        config.setPointScaleFactor(10);
        this.computedLayout = Rectangle.EMPTY;
        this._node = yoga.Node.createWithConfig(config);
        this._displayObject = displayObject;
        this.style = new FlexLayoutStyleProxy(this._node);
        this.cachedLocalBounds = Rectangle.EMPTY;
        this._children = [];
        this._node.setMeasureFunc((...args) => this._displayObject.onLayoutMeasure(...args));
    }

    insertChild(child: FlexLayout, index: number): void {
        if (child._parent) {
            child._parent.removeChild(child);
        }
        if (this._children.length === 0) {
            // This is no longer a leaf node, so remove measureFunc so yoga doesn't complain
            this._node.unsetMeasureFunc();
        }
        this._node.insertChild(child._node, index);
        this._children.splice(index, 0, child);
        child._parent = this;
    }

    appendChild(child: FlexLayout): void {
        this.insertChild(child, this._children.length);
    }

    removeChild(child: FlexLayout): void {
        const i = this._children.indexOf(child);
        if (i !== -1) {
            this._node.removeChild(child._node);
            this._children.splice(i, 1);
            child._parent = undefined;
            if (this._children.length === 0) {
                // This is now a leaf node, so set measureFunc again
                this._node.setMeasureFunc((...args) => this._displayObject.onLayoutMeasure(...args));
            }
        } else {
            console.warn("Not a child of this layout:", child);
        }
    }

    update(): void {
        this.prepareLayout();
        this._node.calculateLayout();
        this.applyLayout();
    }

    reset(): void {
        this._node.reset();
        this.style.anchor.set(0, 0);
        this.style.excluded = false;
    }

    destroy(): void {
        if (this._parent) {
            this._parent.removeChild(this);
        }
        for (const child of this._children) {
            child._parent = undefined;
        }
        this._node.free();
    }

    get computedMargin(): ComputedEdges {
        return this.getComputedEdges("Margin");
    }

    get computedPadding(): ComputedEdges {
        return this.getComputedEdges("Padding");
    }

    get computedBorder(): ComputedEdges {
        return this.getComputedEdges("Border");
    }

    isDirty(): boolean {
        return this._node.isDirty();
    }

    markDirty() {
        this._node.markDirty();
    }

    private prepareLayout(): void {
        if (this.style.excluded || !this._displayObject.visible) {
            this._node.setDisplay(yg.DISPLAY_NONE);
        } else {
            this._node.setDisplay(yg.DISPLAY_FLEX);
            if (this._children.length) {
                for (const child of this._children) {
                    child.prepareLayout();
                }
            } else {
                const { width, height } = this.cachedLocalBounds;
                this._displayObject.getLocalBounds(this.cachedLocalBounds);
                if (width !== this.cachedLocalBounds.width || height !== this.cachedLocalBounds.height) {
                    this.markDirty();
                }
            }
        }
    }

    private applyLayout(): void {
        if (this.style.excluded || !this._displayObject.visible) {
            return;
        }

        const layout = this._node.getComputedLayout();
        if (this.computedLayout.x !== layout.left
            || this.computedLayout.y !== layout.top
            || this.computedLayout.width !== layout.width
            || this.computedLayout.height !== layout.height
        ) {
            this.computedLayout.x = layout.left;
            this.computedLayout.y = layout.top;
            this.computedLayout.width = layout.width;
            this.computedLayout.height = layout.height;

            if (this._parent) {
                this._displayObject.position.set(
                    layout.left + layout.width * this.style.anchor.x,
                    layout.top + layout.height * this.style.anchor.y,
                );
            }
            this._displayObject.emit("layout", this.computedLayout);
        }

        for (const child of this._children) {
            child.applyLayout();
        }
    }

    private getComputedEdges(type: "Margin" | "Padding" | "Border"): ComputedEdges {
        return {
            top: this._node[`getComputed${type}`](yg.EDGE_TOP),
            bottom: this._node[`getComputed${type}`](yg.EDGE_BOTTOM),
            left: this._node[`getComputed${type}`](yg.EDGE_LEFT),
            right: this._node[`getComputed${type}`](yg.EDGE_RIGHT),
        };
    }
}
