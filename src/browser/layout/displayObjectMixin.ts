import { DisplayObject, IDestroyOptions } from "@pixi/display";
import { ISize } from "@pixi/math";
import FlexLayout, { ComputedLayout, MeasureMode } from "./FlexLayout";

declare module "@pixi/display"
{
    export interface DisplayObject {
        _lastMeasuredSize: ISize;
        _layout?: FlexLayout;
        get layout(): FlexLayout;
        get isLayoutChild(): boolean;
        isLayoutMeasurementDirty(): boolean;
        onLayoutMeasure(
            width: number,
            widthMeasureMode: MeasureMode,
            height: number,
            heightMeasureMode: MeasureMode,
        ): ISize,
        onLayout(layout: ComputedLayout): void;
    }
}

const displayObject = DisplayObject.prototype;

const _super = {
    render: displayObject.render,
    destroy: displayObject.destroy,
};

Object.defineProperties(displayObject, {
    layout: {
        get(this: DisplayObject): FlexLayout {
            if (!this._layout) {
                this._lastMeasuredSize = { width: 0, height: 0 };
                this._layout = new FlexLayout(this);
            }
            return this._layout;
        },
    },
    isLayoutChild: {
        get(this: DisplayObject): boolean {
            return !!this.parent && this.parent.flexContainer && !this.layout.excluded;
        }
    },
});

displayObject.destroy = function (options?: boolean | IDestroyOptions) {
    _super.destroy.call(this, options);
    this._layout?.destroy();
    this._layout = undefined;
}

displayObject.onLayout = function () { };

displayObject.isLayoutMeasurementDirty = function(): boolean {
    const bounds = this.getLocalBounds();
    const scale = this.scale;
    return this._lastMeasuredSize.width !== bounds.width * scale.x
        || this._lastMeasuredSize.height !== bounds.height * scale.y;
}

displayObject.onLayoutMeasure = function (
    width: number,
    widthMeasureMode: MeasureMode,
    height: number,
    heightMeasureMode: MeasureMode
): ISize {
    const bounds = this.getLocalBounds();
    const scale = this.scale;
    return this._lastMeasuredSize = {
        width: bounds.width * scale.x,
        height: bounds.height * scale.y,
    };
}
