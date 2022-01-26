import { GameObject, TickQueue } from "@core/engine";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { TickableContainer } from "./TickableContainer";

export class HitAreaDebugContainer extends TickableContainer {
    private _objects: readonly GameObject<any, any>[];
    private readonly _graphics: Graphics;

    public constructor(queue: TickQueue) {
        super(queue);
        this._graphics = new Graphics();
        this.addChild(this._graphics);
        this._objects = [];
    }

    tick(): void {
        if (this.visible) {
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
}
