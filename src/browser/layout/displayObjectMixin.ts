import { DisplayObject, IDestroyOptions } from "@pixi/display";
import { ISize } from "@pixi/core";
import FlexLayout, { FlexLayoutProps, MeasureMode } from "./FlexLayout";

const displayObject = DisplayObject.prototype;

const _super = {
    render: displayObject.render,
    destroy: displayObject.destroy,
};

Object.defineProperties(displayObject, {
    layout: {
        get(this: DisplayObject): FlexLayout {
            if (!this._layout) {
                this._layout = new FlexLayout(this);
            }
            return this._layout;
        },
    },
    layoutStyle: {
        set(this: DisplayObject, props: Partial<FlexLayoutProps>) {
            // TODO does not reset already applied styles
            this.layout.style(props);
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
    if (this._layout) {
        this._layout.destroy();
        this._layout = undefined;
    }
}

displayObject.onLayoutMeasure = function (
    width: number,
    widthMeasureMode: MeasureMode,
    height: number,
    heightMeasureMode: MeasureMode
): ISize {
    const bounds = this.getLocalBounds();
    const scale = this.scale;
    return {
        width: bounds.width * scale.x,
        height: bounds.height * scale.y,
    };
}
