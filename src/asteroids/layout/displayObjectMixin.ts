import { DisplayObject, IDestroyOptions } from "@pixi/display";
import FlexLayout, { ComputedLayout } from "./FlexLayout";

declare module "@pixi/display"
{
    export interface DisplayObject {
        _layout?: FlexLayout;
        _excludeFromLayout: boolean;
        get layout(): FlexLayout;
        get isLayoutChild(): boolean;
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
        get(): FlexLayout {
            if (!this._layout) {
                this._layout = new FlexLayout(this);
            }
            return this._layout;
        },
    },
    isLayoutChild: {
        get(): boolean {
            return !!this.parent && this.parent.flexContainer && !this.excludeFromLayout;
        }
    },
});

displayObject.destroy = function (options: IDestroyOptions) {
    _super.destroy.call(this, options);
    this._layout?.destroy();
}

displayObject.onLayout = function () { };
