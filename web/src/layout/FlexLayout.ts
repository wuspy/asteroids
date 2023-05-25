import { DisplayObject } from "@pixi/display";
import { Point, Rectangle } from "@pixi/math";
import yoga, { Value, Node, Layout, MeasureFunc } from "@wuspy/yoga-layout-wasm";
import getYoga from "./getYoga";

export enum FlexDirection {
    "column" = 0,
    "column-reverse",
    "row",
    "row-reverse",
}

export enum JustifyContent {
    "flex-start" = 0,
    "center",
    "flex-end",
    "space-between",
    "space-around",
    "space-evenly",
}

export enum FlexWrap {
    "nowrap" = 0,
    "wrap",
    "wrap-reverse",
}

export enum Align {
    "auto" = 0,
    "flex-start",
    "center",
    "flex-end",
    "stretch",
    "baseline",
    "space-between",
    "space-around",
}

export enum PositionType {
    "static" = 0,
    "relative",
    "absolute",
};

export enum Direction {
    "inherit" = 0,
    "ltr",
    "rtl",
}

export const enum MeasureMode {
    Undefined = 0,
    Exactly,
    AtMost,
}

export type ComputedLayout = Layout;

export interface ComputedEdges {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export class FlexLayoutStyleProxy {
    private readonly _node: Node;

    constructor(node: Node) {
        this._node = node;
        this.excluded = false;
        this.anchor = new Point(0, 0);
    }

    anchor: Point;
    excluded: boolean;

    get alignContent(): keyof typeof Align {
        return Align[this._node.getAlignContent()] as keyof typeof Align;
    }

    set alignContent(alignContent: keyof typeof Align) {
        this._node.setAlignContent(Align[alignContent]);
    }

    get alignItems(): keyof typeof Align {
        return Align[this._node.getAlignItems()] as keyof typeof Align;
    }

    set alignItems(alignItems: keyof typeof Align) {
        this._node.setAlignItems(Align[alignItems]);
    }

    get alignSelf(): keyof typeof Align {
        return Align[this._node.getAlignSelf()] as keyof typeof Align;
    }

    set alignSelf(alignSelf: keyof typeof Align) {
        this._node.setAlignSelf(Align[alignSelf]);
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

    get flexWrap(): keyof typeof FlexWrap {
        return FlexWrap[this._node.getFlexWrap()] as keyof typeof FlexWrap;
    }

    set flexWrap(flexWrap: keyof typeof FlexWrap) {
        this._node.setFlexWrap(FlexWrap[flexWrap]);
    }

    get flexDirection(): keyof typeof FlexDirection {
        return FlexDirection[this._node.getFlexDirection()] as keyof typeof FlexDirection;
    }

    set flexDirection(flexDirection: keyof typeof FlexDirection) {
        this._node.setFlexDirection(FlexDirection[flexDirection]);
    }

    get flexBasis(): Value {
        return this._node.getFlexBasis();
    }

    set flexBasis(flexBasis: Value) {
        this._node.setFlexBasis(flexBasis);
    }

    get justifyContent(): keyof typeof JustifyContent {
        return JustifyContent[this._node.getJustifyContent()] as keyof typeof JustifyContent;
    }

    set justifyContent(justifyContent: keyof typeof JustifyContent) {
        this._node.setJustifyContent(JustifyContent[justifyContent]);
    }

    get direction(): Direction {
        return this._node.getDirection();
    }

    set direction(direction: Direction) {
        this._node.setDirection(direction);
    }

    get marginTop(): Value {
        return this._node.getMargin(yoga.EDGE_TOP);
    }

    set marginTop(margin: Value) {
        this._node.setMargin(yoga.EDGE_TOP, margin);
    }

    get marginBottom(): Value {
        return this._node.getMargin(yoga.EDGE_BOTTOM);
    }

    set marginBottom(margin: Value) {
        this._node.setMargin(yoga.EDGE_BOTTOM, margin);
    }

    get marginLeft(): Value {
        return this._node.getMargin(yoga.EDGE_LEFT);
    }

    set marginLeft(margin: Value) {
        this._node.setMargin(yoga.EDGE_LEFT, margin);
    }

    get marginRight(): Value {
        return this._node.getMargin(yoga.EDGE_RIGHT);
    }

    set marginRight(margin: Value) {
        this._node.setMargin(yoga.EDGE_RIGHT, margin);
    }

    set marginY(margin: Value) {
        this._node.setMargin(yoga.EDGE_VERTICAL, margin);
    }

    set marginX(margin: Value) {
        this._node.setMargin(yoga.EDGE_HORIZONTAL, margin);
    }

    set margin(margin: Value) {
        this._node.setMargin(yoga.EDGE_ALL, margin);
    }

    get paddingTop(): Value {
        return this._node.getPadding(yoga.EDGE_TOP);
    }

    set paddingTop(padding: Value) {
        this._node.setPadding(yoga.EDGE_TOP, padding);
    }

    get paddingBottom(): Value {
        return this._node.getPadding(yoga.EDGE_BOTTOM);
    }

    set paddingBottom(padding: Value) {
        this._node.setPadding(yoga.EDGE_BOTTOM, padding);
    }

    get paddingLeft(): Value {
        return this._node.getPadding(yoga.EDGE_LEFT);
    }

    set paddingLeft(padding: Value) {
        this._node.setPadding(yoga.EDGE_LEFT, padding);
    }

    get paddingRight(): Value {
        return this._node.getPadding(yoga.EDGE_RIGHT);
    }

    set paddingRight(padding: Value) {
        this._node.setPadding(yoga.EDGE_RIGHT, padding);
    }

    set paddingY(padding: Value) {
        this._node.setPadding(yoga.EDGE_VERTICAL, padding);
    }

    set paddingX(padding: Value) {
        this._node.setPadding(yoga.EDGE_HORIZONTAL, padding);
    }

    set padding(padding: Value) {
        this._node.setPadding(yoga.EDGE_ALL, padding);
    }

    get position(): keyof typeof PositionType {
        return PositionType[this._node.getPositionType()] as keyof typeof PositionType;
    }

    set position(position: keyof typeof PositionType) {
        this._node.setPositionType(PositionType[position]);
    }

    get top(): Value {
        return this._node.getPosition(yoga.EDGE_TOP);
    }

    set top(top: Value) {
        this._node.setPosition(yoga.EDGE_TOP, top);
    }

    get left(): Value {
        return this._node.getPosition(yoga.EDGE_LEFT);
    }

    set left(left: Value) {
        this._node.setPosition(yoga.EDGE_LEFT, left);
    }

    get right(): Value {
        return this._node.getPosition(yoga.EDGE_RIGHT);
    }

    set right(right: Value) {
        this._node.setPosition(yoga.EDGE_RIGHT, right);
    }

    get bottom(): Value {
        return this._node.getPosition(yoga.EDGE_BOTTOM);
    }

    set bottom(bottom: Value) {
        this._node.setPosition(yoga.EDGE_BOTTOM, bottom);
    }

    set inset(inset: Value) {
        this._node.setPosition(yoga.EDGE_ALL, inset);
    }

    get width(): Value {
        return this._node.getWidth();
    }

    set width(width: Value) {
        this._node.setWidth(width);
    }

    get height(): Value {
        return this._node.getHeight();
    }

    set height(height: Value) {
        this._node.setHeight(height);
    }

    get maxWidth(): Value {
        return this._node.getMaxWidth();
    }

    set maxWidth(maxWidth: Value) {
        this._node.setMaxWidth(maxWidth);
    }

    get maxHeight(): Value {
        return this._node.getMaxHeight();
    }

    set maxHeight(maxHeight: Value) {
        this._node.setMaxHeight(maxHeight);
    }

    get minWidth(): Value {
        return this._node.getMinWidth();
    }

    set minWidth(minWidth: Value) {
        this._node.setMinWidth(minWidth);
    }

    get minHeight(): Value {
        return this._node.getMinHeight();
    }

    set minHeight(minHeight: Value) {
        this._node.setMinHeight(minHeight);
    }
}

export default class FlexLayout {
    private readonly _node: Node;
    private readonly _displayObject: DisplayObject;
    private _parent?: FlexLayout;
    private _children: FlexLayout[];

    readonly style: FlexLayoutStyleProxy;
    readonly cachedLocalBounds: Rectangle;

    constructor(displayObject: DisplayObject) {
        const yoga = getYoga();
        const config = yoga.Config.create();
        config.setUseWebDefaults(true);
        config.setPointScaleFactor(10);
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

    get computedLayout(): Layout {
        return this._node.getComputedLayout();
    }

    get comptedWidth(): number {
        return this._node.getComputedWidth();
    }

    get computedHeight(): number {
        return this._node.getComputedHeight();
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
            this._node.setDisplay(yoga.DISPLAY_NONE);
        } else {
            this._node.setDisplay(yoga.DISPLAY_FLEX);
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
        if (this._node.getHasNewLayout()) {
            const layout = this.computedLayout;
            if (this._parent) {
                this._displayObject.position.set(
                    layout.left + layout.width * this.style.anchor.x,
                    layout.top + layout.height * this.style.anchor.y,
                );
            }
            this._displayObject.emit("layout", layout);
            this._node.setHasNewLayout(false);
        }
        for (const child of this._children) {
            child.applyLayout();
        }
    }

    private getComputedEdges(type: "Margin" | "Padding" | "Border"): ComputedEdges {
        return {
            top: this._node[`getComputed${type}`](yoga.EDGE_TOP),
            bottom: this._node[`getComputed${type}`](yoga.EDGE_BOTTOM),
            left: this._node[`getComputed${type}`](yoga.EDGE_LEFT),
            right: this._node[`getComputed${type}`](yoga.EDGE_RIGHT),
        };
    }
}
