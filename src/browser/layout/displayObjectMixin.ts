import { DisplayObject, IDestroyOptions } from "@pixi/display";
import FlexLayout, { ComputedLayout } from "./FlexLayout";

declare module "@pixi/display"
{
    export interface DisplayObject {
        get layout(): FlexLayout;
        get isLayoutChild(): boolean;
        onLayout(layout: ComputedLayout): void;
    }
}

interface DisplayObjectPrivate extends DisplayObject {
    _layout?: FlexLayout;
}

const displayObject = DisplayObject.prototype as DisplayObjectPrivate;

const _super = {
    render: displayObject.render,
    destroy: displayObject.destroy,
};

Object.defineProperties(displayObject, {
    layout: {
        get(this: DisplayObjectPrivate): FlexLayout {
            if (!this._layout) {
                this._layout = new FlexLayout(this);
            }
            return this._layout;
        },
    },
    isLayoutChild: {
        get(this: DisplayObjectPrivate): boolean {
            return !!this.parent && this.parent.flexContainer && !this.layout.excluded;
        }
    },
});

displayObject.destroy = function (this: DisplayObjectPrivate, options?: boolean | IDestroyOptions) {
    _super.destroy.call(this, options);
    this._layout?.destroy();
    this._layout = undefined;
}

displayObject.onLayout = function () { };
