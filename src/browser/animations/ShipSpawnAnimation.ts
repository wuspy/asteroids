import { PI_2 } from "@pixi/math";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { TickQueue } from "../../core/engine";
import { LINE_JOIN } from "@pixi/graphics";
import anime from "animejs";
import { IDestroyOptions } from "@pixi/display";

export class ShipSpawnAnimation extends Graphics {
    private readonly _timeline: anime.AnimeTimelineInstance;
    private readonly _queue: TickQueue;

    radius: number;
    length: number;
    opacity: number;

    constructor({ queue, color, diameter }: {
        queue: TickQueue,
        color: number,
        diameter: number,
    }) {
        super();
        this._queue = queue;
        this.radius = diameter / 2;
        this.length = 0;
        this.opacity = 0.8;

        const angles: { sin: number, cos: number }[] = [];
        for (let i = 0; i < PI_2; i += PI_2 / 12) {
            angles.push({ sin: Math.sin(i), cos: Math.cos(i) });
        }

        this._timeline = anime.timeline({
            duration: 1000,
            autoplay: false,
            complete: () => this.destroy(),
        }).add({
            targets: this,
            keyframes: [
                { length: 20, radius: diameter, opacity: 0.8 },
                { length: 0, radius: diameter * 1.5, opacity: 0 },
            ],
            easing: "easeOutBack",
            change: () => {
                this.clear();
                this.lineStyle({
                    width: 1,
                    color,
                    alpha: this.opacity,
                    join: LINE_JOIN.BEVEL,
                });
                if (this.parent) {
                    // Keep this animaion's rotation constant regardless of the ship's rotation
                    this.rotation = -this.parent.rotation;
                }
                for (const {sin, cos} of angles) {
                    this.moveTo(this.radius * sin, this.radius * -cos);
                    this.lineTo((this.radius + this.length) * sin, (this.radius + this.length) * -cos);
                }
            },
        });

        queue.add(100, this._timeline.tick, this._timeline);
    }

    override destroy(options?: boolean | IDestroyOptions) {
        super.destroy(options);
        this._queue.remove(this._timeline.tick, this._timeline);
    }
}
