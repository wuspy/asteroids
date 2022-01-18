import { DisplayObject } from "@pixi/display";
import { ISize } from "@pixi/math";
import yoga, { getYoga, YogaUnit, YogaNode, YogaEdge, } from "./yoga";

export type Dimension = number | [number, "%"];
export type DimensionOrAuto = Dimension | "auto";

export enum FlexDirection {
    Column = 0,
    ColumnReverse,
    Row,
    RowReverse,
}

export enum JustifyContent {
    FlexStart = 0,
    Center,
    FlexEnd,
    SpaceBetween,
    SpaceAround,
    SpaceEvenly,
}

export enum FlexWrap {
    NoWrap = 0,
    Wrap,
    WrapReverse,
}

export enum Align {
    Auto = 0,
    FlexStart,
    Center,
    FlexEnd,
    Stretch,
    Baseline,
    SpaceBetween,
    SpaceAround,
}

export enum PositionType {
    Relative = 0,
    Absolute,
}

interface YogaValue {
    readonly unit: YogaUnit | number,
    readonly value: number,
}

/**
 * Converts a Yoga dimension value to our dimension value
 */
const toDimension = ({ value, unit }: YogaValue): Dimension | undefined => {
    if (unit === yoga.UNIT_PERCENT) {
        return value === 0 ? 0 : [value, "%"];
    } else if (unit === yoga.UNIT_POINT) {
        return value;
    } else {
        return undefined;
    }
}

const toDimensionOrAuto = (value: YogaValue): DimensionOrAuto | undefined => {
    if (value.unit === yoga.UNIT_AUTO) {
        return "auto";
    } else {
        return toDimension(value);
    }
}

export interface ComputedLayout {
    readonly top: number;
    readonly bottom: number;
    readonly left: number;
    readonly right: number;
    readonly width: number;
    readonly height: number;
}

export interface ComputedEdges {
    readonly top: number;
    readonly bottom: number;
    readonly left: number;
    readonly right: number;
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
    flexBasis: DimensionOrAuto;
    justifyContent: JustifyContent;
    marginTop: DimensionOrAuto;
    marginBottom: DimensionOrAuto;
    marginLeft: DimensionOrAuto;
    marginRight: DimensionOrAuto;
    marginHorizontal: DimensionOrAuto;
    marginVertical: DimensionOrAuto;
    margin: DimensionOrAuto;
    paddingTop: Dimension;
    paddingBottom: Dimension;
    paddingLeft: Dimension;
    paddingRight: Dimension;
    paddingHorizontal: Dimension;
    paddingVertical: Dimension;
    padding: Dimension;
    position: PositionType;
    top: Dimension | undefined;
    bottom: Dimension | undefined;
    left: Dimension | undefined;
    right: Dimension | undefined;
    width: DimensionOrAuto;
    height: DimensionOrAuto;
    maxWidth: Dimension | undefined;
    maxHeight: Dimension | undefined;
    minWidth: Dimension | undefined;
    minHeight: Dimension | undefined;
    originAtCenter: boolean;
}

export type MeasureCallback = () => ISize;

export default class FlexLayout {
    private readonly _node: YogaNode;
    private _parent?: FlexLayout;
    private _children: FlexLayout[];
    private _displayObject: DisplayObject;
    private _width: DimensionOrAuto;
    private _height: DimensionOrAuto;
    private _excluded: boolean;

    originAtCenter: boolean;

    constructor(displayObject: DisplayObject) {
        this._displayObject = displayObject;
        this._node = getYoga().Node.create();
        this._children = [];
        this.originAtCenter = false;
        this._excluded = false;
        this._width = "auto";
        this._height = "auto";
    }

    insertChild(child: FlexLayout, index: number): void {
        if (child._parent) {
            child._parent.removeChild(child);
        }
        if (this._children.length === 0) {
            // This is no longer a leaf node, so set yoga width/height auto if needed since
            // it will no longer be measured
            if (this._width === "auto") {
                this._node.setWidthAuto();
            }
            if (this._height === "auto") {
                this._node.setHeightAuto();
            }
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
        }
    }

    update(): void {
        this.measure();
        this._node.calculateLayout();
        this.apply();
    }

    reset(): void {
        this._node.reset();
        this.originAtCenter = false;
        this._excluded = false;
        this._width = "auto";
        this._height = "auto";
    }

    destroy(): void {
        this._node.free();
    }

    style<T extends keyof FlexLayoutProps>(props: Partial<FlexLayoutProps>) {
        for (const [prop, value] of Object.entries(props) as [T, FlexLayoutProps[T]][]) {
            (this as Pick<FlexLayout, keyof FlexLayoutProps>)[prop] = value;
        }
    }

    get computedLayout(): ComputedLayout {
        return this._node.getComputedLayout();
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

    get excluded(): boolean {
        return this._excluded || !this._displayObject.visible;
    }

    set excluded(excluded: boolean) {
        this._excluded = excluded;
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

    get flexBasis(): DimensionOrAuto {
        return toDimensionOrAuto(this._node.getFlexBasis() as any) || "auto";
    }

    set flexBasis(flexBasis: DimensionOrAuto) {
        if (flexBasis === "auto") {
            this._node.setFlexBasis(NaN);
        } else if (Array.isArray(flexBasis)) {
            this._node.setFlexBasis(`${flexBasis[0]}%`);
        } else {
            this._node.setFlexBasis(flexBasis);
        }
    }

    get justifyContent(): JustifyContent {
        return this._node.getJustifyContent();
    }

    set justifyContent(justifyContent: JustifyContent) {
        this._node.setJustifyContent(justifyContent);
    }

    get marginTop(): DimensionOrAuto {
        return toDimensionOrAuto(this._node.getMargin(yoga.EDGE_TOP)) || 0;
    }

    set marginTop(margin: DimensionOrAuto) {
        this.setMargin(yoga.EDGE_TOP, margin);
    }

    get marginBottom(): DimensionOrAuto {
        return toDimensionOrAuto(this._node.getMargin(yoga.EDGE_BOTTOM)) || 0;
    }

    set marginBottom(margin: DimensionOrAuto) {
        this.setMargin(yoga.EDGE_BOTTOM, margin);
    }

    get marginLeft(): DimensionOrAuto {
        return toDimensionOrAuto(this._node.getMargin(yoga.EDGE_LEFT)) || 0;
    }

    set marginLeft(margin: DimensionOrAuto) {
        this.setMargin(yoga.EDGE_LEFT, margin);
    }

    get marginRight(): DimensionOrAuto {
        return toDimensionOrAuto(this._node.getMargin(yoga.EDGE_RIGHT)) || 0;
    }

    set marginRight(margin: DimensionOrAuto) {
        this.setMargin(yoga.EDGE_RIGHT, margin);
    }

    set marginVertical(margin: DimensionOrAuto) {
        this.setMargin(yoga.EDGE_VERTICAL, margin);
    }

    set marginHorizontal(margin: DimensionOrAuto) {
        this.setMargin(yoga.EDGE_HORIZONTAL, margin);
    }

    set margin(margin: DimensionOrAuto) {
        this.setMargin(yoga.EDGE_ALL, margin);
    }

    get paddingTop(): Dimension {
        return toDimension(this._node.getPadding(yoga.EDGE_TOP)) || 0;
    }

    set paddingTop(padding: Dimension) {
        this.setPadding(yoga.EDGE_TOP, padding);
    }

    get paddingBottom(): Dimension {
        return toDimension(this._node.getPadding(yoga.EDGE_BOTTOM)) || 0;
    }

    set paddingBottom(padding: Dimension) {
        this.setPadding(yoga.EDGE_BOTTOM, padding);
    }

    get paddingLeft(): Dimension {
        return toDimension(this._node.getPadding(yoga.EDGE_LEFT)) || 0;
    }

    set paddingLeft(padding: Dimension) {
        this.setPadding(yoga.EDGE_LEFT, padding);
    }

    get paddingRight(): Dimension {
        return toDimension(this._node.getPadding(yoga.EDGE_RIGHT)) || 0;
    }

    set paddingRight(padding: Dimension) {
        this.setPadding(yoga.EDGE_RIGHT, padding);
    }

    set paddingVertical(padding: Dimension) {
        this.setPadding(yoga.EDGE_VERTICAL, padding);
    }

    set paddingHorizontal(padding: Dimension) {
        this.setPadding(yoga.EDGE_HORIZONTAL, padding);
    }

    set padding(padding: Dimension) {
        this.setPadding(yoga.EDGE_ALL, padding);
    }

    get position(): PositionType {
        return this._node.getPositionType();
    }

    set position(position: PositionType) {
        this._node.setPositionType(position);
    }

    get top(): Dimension | undefined {
        return toDimension(this._node.getPosition(yoga.EDGE_TOP));
    }

    set top(top: Dimension | undefined) {
        this.setPosition(yoga.EDGE_TOP, top);
    }

    get left(): Dimension | undefined {
        return toDimension(this._node.getPosition(yoga.EDGE_LEFT));
    }

    set left(left: Dimension | undefined) {
        this.setPosition(yoga.EDGE_LEFT, left);
    }

    get right(): Dimension | undefined {
        return toDimension(this._node.getPosition(yoga.EDGE_RIGHT));
    }

    set right(right: Dimension | undefined) {
        this.setPosition(yoga.EDGE_RIGHT, right);
    }

    get bottom(): Dimension | undefined {
        return toDimension(this._node.getPosition(yoga.EDGE_BOTTOM));
    }

    set bottom(bottom: Dimension | undefined) {
        this.setPosition(yoga.EDGE_BOTTOM, bottom);
    }

    get width(): DimensionOrAuto {
        return this._width;
    }

    set width(width: DimensionOrAuto) {
        this._width = width;
        this.setDimensionOrAuto("Width", width);
    }

    get height(): DimensionOrAuto {
        return this._height;
    }

    set height(height: DimensionOrAuto) {
        this._height = height;
        this.setDimensionOrAuto("Height", height);
    }

    get maxWidth(): Dimension | undefined {
        return toDimension(this._node.getMaxWidth());
    }

    set maxWidth(maxWidth: Dimension | undefined) {
        this.setDimension("MaxWidth", maxWidth);
    }

    get maxHeight(): Dimension | undefined {
        return toDimension(this._node.getMaxHeight());
    }

    set maxHeight(maxHeight: Dimension | undefined) {
        this.setDimension("MaxHeight", maxHeight);
    }

    get minWidth(): Dimension | undefined {
        return toDimension(this._node.getMinWidth());
    }

    set minWidth(minWidth: Dimension | undefined) {
        this.setDimension("MinWidth", minWidth);
    }

    get minHeight(): Dimension | undefined {
        return toDimension(this._node.getMinHeight());
    }

    set minHeight(minHeight: Dimension | undefined) {
        this.setDimension("MinHeight", minHeight);
    }

    private measure(): void {
        if (this.excluded) {
            this._node.setDisplay(yoga.DISPLAY_NONE);
            return;
        } else {
            this._node.setDisplay(yoga.DISPLAY_FLEX);
        }
        if (this._children.length) {
            for (const child of this._children) {
                child.measure();
            }
        } else if (this._width === "auto" || this._height === "auto") {
            if ("width" in this._displayObject && "height" in this._displayObject) {
                if (this._width === "auto") {
                    this._node.setWidth((this._displayObject as any).width);
                }
                if (this._height === "auto") {
                    this._node.setHeight((this._displayObject as any).height);
                }
            } else {
                const bounds = this._displayObject.getLocalBounds();
                const scale = this._displayObject.scale;
                if (this._width === "auto") {
                    this._node.setWidth(scale.x * bounds.width);
                }
                if (this._height === "auto") {
                    this._node.setHeight(scale.y * bounds.height);
                }
            }
        }
    }

    private apply(): void {
        if (this.excluded) {
            return;
        }
        const layout = this.computedLayout;
        if (this._parent) {
            if (this.originAtCenter) {
                this._displayObject.position.set(layout.left + layout.width / 2, layout.top + layout.height / 2);
            } else {
                this._displayObject.position.set(layout.left, layout.top);
            }
        }
        for (const child of this._children) {
            child.apply();
        }
        this._displayObject.onLayout(layout);
    }

    private getComputedEdges(type: "Margin" | "Padding" | "Border"): ComputedEdges {
        return {
            top: this._node[`getComputed${type}`](yoga.EDGE_TOP),
            bottom: this._node[`getComputed${type}`](yoga.EDGE_BOTTOM),
            left: this._node[`getComputed${type}`](yoga.EDGE_LEFT),
            right: this._node[`getComputed${type}`](yoga.EDGE_RIGHT),
        };
    }

    private setPadding(edge: YogaEdge, value: Dimension) {
        if (Array.isArray(value)) {
            if (value[1] === "%") {
                this._node.setPaddingPercent(edge, value[0]);
            } else {
                this._node.setPadding(edge, value[0]);
            }
        } else if (value !== undefined) {
            this._node.setPadding(edge, value);
        }
    }

    private setMargin(edge: YogaEdge, value: DimensionOrAuto) {
        if (value === "auto") {
            this._node.setMarginAuto(edge);
        } else if (Array.isArray(value)) {
            if (value[1] === "%") {
                this._node.setMarginPercent(edge, value[0]);
            } else {
                this._node.setMargin(edge, value[0]);
            }
        } else {
            this._node.setMargin(edge, value);
        }
    }

    private setPosition(edge: YogaEdge, value: Dimension | undefined) {
        if (Array.isArray(value)) {
            if (value[1] === "%") {
                this._node.setPositionPercent(edge, value[0]);
            } else {
                this._node.setPosition(edge, value[0]);
            }
        } else {
            this._node.setPosition(edge, value ?? NaN);
        }
    }

    private setDimensionOrAuto(dimension: "Width" | "Height", value?: DimensionOrAuto) {
        if (value === "auto" || value === undefined) {
            this._node[`set${dimension}Auto`]();
        } else {
            this.setDimension(dimension, value);
        }
    }

    private setDimension(dimension: "Width" | "Height" | "MinWidth" | "MinHeight" | "MaxWidth" | "MaxHeight", value?: Dimension) {
        if (Array.isArray(value)) {
            this._node[`set${dimension}Percent`](value[0]);
        } else {
            this._node[`set${dimension}`](value ?? NaN);
        }
    }
}
