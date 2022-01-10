import { PI_2 } from "@pixi/math";
import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { OneShotAnimation, CoreOneShotAnimationParams } from "./engine";
import { QUEUE_PRIORITIES } from "./constants";
import { LINE_JOIN } from "@pixi/graphics";

export class ShipSpawnAnimation extends OneShotAnimation {
    private readonly _graphics: Graphics;
    private readonly _color: number;
    private readonly _angles: { sin: number, cos: number }[];
    protected radius: number;
    protected length: number;
    protected opacity: number;

    constructor(params: CoreOneShotAnimationParams & {
        color: number,
        diameter: number,
    }) {
        super({ ...params, queuePriority: QUEUE_PRIORITIES.animation, defaultAnimeParams: { duration: 1000 } });
        this._color = params.color;
        this.radius = params.diameter / 2;
        this.length = 0;
        this.opacity = 0.8;
        this.timeline.add({
            targets: this,
            keyframes: [
                { length: 20, radius: params.diameter, opacity: 0.8 },
                { length: 0, radius: params.diameter * 1.5, opacity: 0 },
            ],
            easing: "easeOutBack",
            change: () => {
                this._graphics.clear();
                this._graphics.lineStyle({
                    width: 1,
                    color: this._color,
                    alpha: this.opacity,
                    join: LINE_JOIN.BEVEL,
                });
                if (this._graphics.parent) {
                    this._graphics.rotation = -this._graphics.parent.rotation;
                }
                for (const {sin, cos} of this._angles) {
                    this._graphics.moveTo(this.radius * sin, this.radius * -cos);
                    this._graphics.lineTo((this.radius + this.length) * sin, (this.radius + this.length) * -cos);
                }
            },
        });
        this._angles = [];
        for (let i = 0; i < PI_2; i += PI_2 / 12) {
            this._angles.push({ sin: Math.sin(i), cos: Math.cos(i) });
        }
        this._graphics = new Graphics();
    }

    get container(): Container {
        return this._graphics;
    }
}
