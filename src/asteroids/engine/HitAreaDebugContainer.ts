import { GameObject } from "./GameObject";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Container } from "@pixi/display";
import { Tickable } from "./TickQueue";
import { Widget, WidgetParams } from "./Widget";

export class HitAreaDebugContainer extends Widget implements Tickable {
    private _objects: readonly GameObject<any, any>[];
    private readonly _graphics: Graphics;

    public constructor(params: WidgetParams) {
        super(params);
        this._graphics = new Graphics();
        this._objects = [];
    }

    tick(timestamp: number, elapsed: number): void {
        if (this._graphics.visible) {
            this._graphics.clear();
            for (const object of this._objects) {
                this._graphics.lineStyle({
                    width: 2,
                    color: 0xff0000,
                    alpha: 0.5,
                    smooth: false
                });
                this._graphics.drawRect(object.boundingBox.x, object.boundingBox.y, object.boundingBox.width, object.boundingBox.height);
                this._graphics.line.alpha = 0;
                this._graphics.beginFill(0xff0000, 0.5, false);
                if (typeof (object.hitArea) === "object") {
                    this._graphics.drawPolygon(object.hitArea);
                } else {
                    this._graphics.drawCircle(object.x, object.y, object.hitArea);
                }
                this._graphics.endFill();
            }
        }
    }

    set objects(objects: readonly GameObject<any, any>[]) {
        this._objects = objects;
    }

    get container(): Container {
        return this._graphics;
    }

    get visible(): boolean {
        return this.container.visible;
    }

    set visible(visible: boolean) {
        if (visible && !this.visible) {
            this.container.visible = true;
            this.queue.add(this.queuePriority, this);
        } else if (!visible && this.visible) {
            this.container.visible = false;
            this.queue.remove(this.queuePriority, this);
        }
    }
}
