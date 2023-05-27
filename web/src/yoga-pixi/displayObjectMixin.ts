import { ISize } from "@pixi/core";
import { DisplayObject, IDestroyOptions } from "@pixi/display";
import { YogaPixi } from "./YogaPixi";

const displayObject = DisplayObject.prototype;

const _super = {
    render: displayObject.render,
    destroy: displayObject.destroy,
};

Object.defineProperties(displayObject, {
    yoga: {
        get(this: DisplayObject): YogaPixi {
            if (!this._yoga) {
                this._yoga = new YogaPixi(this);
            }
            return this._yoga;
        },
    },
    isYogaChild: {
        get(this: DisplayObject): boolean {
            return !!this.parent && this.parent.yogaContainer && !this.yoga.excluded;
        }
    },
});

displayObject.destroy = function (options?: boolean | IDestroyOptions) {
    _super.destroy.call(this, options);
    if (this._yoga) {
        this._yoga.destroy();
        this._yoga = undefined;
    }
}

displayObject.onLayoutMeasure = function (): ISize {
    const { width, height } = this.yoga.cachedLocalBounds;
    return { width, height };
}
