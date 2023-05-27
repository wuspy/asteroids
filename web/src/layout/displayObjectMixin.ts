import { ISize } from "@pixi/core";
import { DisplayObject, IDestroyOptions } from "@pixi/display";
import FlexLayout from "./FlexLayout";

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
    isLayoutChild: {
        get(this: DisplayObject): boolean {
            return !!this.parent && this.parent.flexContainer && !this.layout.style.excluded;
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

displayObject.onLayoutMeasure = function (): ISize {
    const { width, height } = this.layout.cachedLocalBounds;
    return { width, height };
}
