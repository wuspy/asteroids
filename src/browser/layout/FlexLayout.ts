import { DisplayObject } from "@pixi/display";
import yoga, { Value, Node, Layout } from "@wuspy/yoga-layout-wasm";
import getYoga from "./getYoga";

export const enum FlexDirection {
    Column = 0,
    ColumnReverse,
    Row,
    RowReverse,
}

export const enum JustifyContent {
    FlexStart = 0,
    Center,
    FlexEnd,
    SpaceBetween,
    SpaceAround,
    SpaceEvenly,
}

export const enum FlexWrap {
    NoWrap = 0,
    Wrap,
    WrapReverse,
}

export const enum Align {
    Auto = 0,
    FlexStart,
    Center,
    FlexEnd,
    Stretch,
    Baseline,
    SpaceBetween,
    SpaceAround,
}

export const enum PositionType {
    Static = 0,
    Relative,
    Absolute,
}

export const enum MeasureMode {
    Undefined = 0,
    Exactly,
    AtMost,
}

export const enum Direction {
    Inherit = 0,
    LTR,
    RTL,
}

export type ComputedLayout = Layout;

export interface ComputedEdges {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface FlexLayoutProps {
    alignContent: Align;
    alignItems: Align;
    alignSelf: Align;
    aspectRatio: number;
    flex: number;
    flexGrow: number;
    flexShrink: number;
    flexWrap: FlexWrap;
    flexDirection: FlexDirection;
    flexBasis: Value;
    justifyContent: JustifyContent;
    marginTop: Value;
    marginBottom: Value;
    marginLeft: Value;
    marginRight: Value;
    marginX: Value;
    marginY: Value;
    margin: Value;
    paddingTop: Value;
    paddingBottom: Value;
    paddingLeft: Value;
    paddingRight: Value;
    paddingX: Value;
    paddingY: Value;
    padding: Value;
    position: PositionType;
    top: Value;
    bottom: Value;
    left: Value;
    right: Value;
    width: Value;
    height: Value;
    maxWidth: Value;
    maxHeight: Value;
    minWidth: Value;
    minHeight: Value;
    originAtCenter: boolean;
    excluded: boolean;
}

export default class FlexLayout {
    private readonly _node: Node;
    private readonly _displayObject: DisplayObject;
    private _parent?: FlexLayout;
    private _children: FlexLayout[];

    excluded: boolean;
    originAtCenter: boolean;

    constructor(displayObject: DisplayObject) {
        const yoga = getYoga();
        const config = yoga.Config.create();
        config.setUseWebDefaults(true);
        config.setPointScaleFactor(10);
        this._node = yoga.Node.createWithConfig(config);
        this._displayObject = displayObject;
        this._children = [];
        this.originAtCenter = false;
        this.excluded = false;
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
        this.originAtCenter = false;
        this.excluded = false;
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

    style<T extends keyof FlexLayoutProps>(props: Partial<FlexLayoutProps>) {
        for (const [prop, value] of Object.entries(props) as [T, FlexLayoutProps[T]][]) {
            (this as Pick<FlexLayout, keyof FlexLayoutProps>)[prop] = value;
        }
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

    get alignContent(): Align {
        return this._node.getAlignContent();
    }

    set alignContent(alignContent: Align) {
        this._node.setAlignContent(alignContent);
    }

    get alignItems(): Align {
        return this._node.getAlignItems();
    }

    set alignItems(alignItems: Align) {
        this._node.setAlignItems(alignItems);
    }

    get alignSelf(): Align {
        return this._node.getAlignSelf();
    }

    set alignSelf(alignSelf: Align) {
        this._node.setAlignSelf(alignSelf);
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
        return this._node.getFlexWrap();
    }

    set flexWrap(flexWrap: FlexWrap) {
        this._node.setFlexWrap(flexWrap);
    }

    get flexDirection(): FlexDirection {
        return this._node.getFlexDirection();
    }

    set flexDirection(flexDirection: FlexDirection) {
        this._node.setFlexDirection(flexDirection);
    }

    get flexBasis(): Value {
        return this._node.getFlexBasis();
    }

    set flexBasis(flexBasis: Value) {
        this._node.setFlexBasis(flexBasis);
    }

    get justifyContent(): JustifyContent {
        return this._node.getJustifyContent();
    }

    set justifyContent(justifyContent: JustifyContent) {
        this._node.setJustifyContent(justifyContent);
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

    get position(): PositionType {
        return this._node.getPositionType();
    }

    set position(position: PositionType) {
        this._node.setPositionType(position);
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

    private prepareLayout(): void {
        if (this.excluded || !this._displayObject.visible) {
            this._node.setDisplay(yoga.DISPLAY_NONE);
        } else {
            this._node.setDisplay(yoga.DISPLAY_FLEX);
            if (this._children.length) {
                for (const child of this._children) {
                    child.prepareLayout();
                }
            } else {
                this._node.markDirty();
            }
        }
    }

    private applyLayout(): void {
        if (this.excluded || !this._displayObject.visible) {
            return;
        }
        if (this._node.getHasNewLayout()) {
            const layout = this.computedLayout;
            if (this._parent) {
                if (this.originAtCenter) {
                    this._displayObject.position.set(layout.left + layout.width / 2, layout.top + layout.height / 2);
                } else {
                    this._displayObject.position.set(layout.left, layout.top);
                }
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
