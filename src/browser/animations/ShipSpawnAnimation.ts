import { PI_2 } from "@pixi/math";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { TickQueue } from "../../core/engine";
import { LINE_JOIN } from "@pixi/graphics";
import { OneShotAnimation } from "./OneShotAnimation";

export class ShipSpawnAnimation extends OneShotAnimation {
    radius: number;
    length: number;
    opacity: number;

    constructor({ queue, color, diameter }: {
        queue: TickQueue,
        color: number,
        diameter: number,
    }) {
        super(queue, { duration: 1000 });
        this.radius = diameter / 2;
        this.length = 0;
        this.opacity = 0.8;

        const graphics = new Graphics();
        this.addChild(graphics);

        const angles: { sin: number, cos: number }[] = [];
        for (let i = 0; i < PI_2; i += PI_2 / 12) {
            angles.push({ sin: Math.sin(i), cos: Math.cos(i) });
        }

        this.timeline.add({
            targets: this,
            keyframes: [
                { length: 20, radius: diameter, opacity: 0.8 },
                { length: 0, radius: diameter * 1.5, opacity: 0 },
            ],
            easing: "easeOutBack",
            change: () => {
                graphics.clear();
                graphics.lineStyle({
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
                    graphics.moveTo(this.radius * sin, this.radius * -cos);
                    graphics.lineTo((this.radius + this.length) * sin, (this.radius + this.length) * -cos);
                }
            },
        });
    }
}
