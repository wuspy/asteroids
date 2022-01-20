import { IRendererPlugin, Renderer } from "@pixi/core";
import { DisplayObject } from "@pixi/display";
import { InteractionManager } from "@pixi/interaction";
import { Point } from "@pixi/math";

declare module "@pixi/display"
{
    export interface DisplayObject {
        set scrollInteractive(scrollInteractive: boolean);
        get scrollInteractive(): boolean;
    }
}

interface DispalyObjectPrivate extends DisplayObject {
    _scrollInteractive: boolean;
}

const displayObject = DisplayObject.prototype as DispalyObjectPrivate;

Object.defineProperties(displayObject, {
    scrollInteractive: {
        get(this: DispalyObjectPrivate): boolean {
            return this._scrollInteractive;
        },
        set(this: DispalyObjectPrivate, scrollInteractive: boolean) {
            if (scrollInteractive && !this.interactive) {
                this.interactive = true;
            }
            this._scrollInteractive = scrollInteractive;
        },
    },
});

displayObject._scrollInteractive = false;

const deriveNormalizedWheelDelta = (e: WheelEvent): number => {
    if (e.detail) {
        if ((e as any).wheelDelta) {
            return (e as any).wheelDelta / e.detail / 40 * (e.detail > 0 ? 1 : -1); // Opera
        } else {
            return -e.detail / 3; // Firefox
        }
    } else {
        return (e as any).wheelDelta / 120; // IE,Safari,Chrome
    }
};

export class ScrollInteractionManager implements IRendererPlugin {
    private _renderer: Renderer;

    constructor(renderer: Renderer) {
        this._renderer = renderer;
        this._renderer.view.onwheel = (e) => {
            const interaction = this._renderer.plugins.interaction as InteractionManager;
            const hit = interaction.hitTest(new Point(e.offsetX, e.offsetY));
            if (hit && hit.scrollInteractive) {
                e.preventDefault();
                hit.emit("mousewheel", deriveNormalizedWheelDelta(e));
            }
        };
    }

    destroy(): void {
        this._renderer.view.onwheel = null;
    }
}
