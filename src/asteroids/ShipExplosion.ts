import { Explosion, ExplosionParams } from "./Explosion";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { DEG_TO_RAD } from "@pixi/math";
import { LINE_JOIN } from "@pixi/graphics";
import { random } from "./engine";

interface Shrapnel {
    x: number;
    y: number;
    rotation: number;
    endRotation: number;
    opacity: number;
    endX: number;
    endY: number;
    graphics: Graphics;
}

// TODO remove this?
export class ShipExplosion extends Explosion {
    private _shrapnel: Shrapnel[];

    constructor(params: ExplosionParams) {
        super(params);
        this._shrapnel = [];
        for (let i = 0; i < 8; i++) {
            const angle = random(0, 360, false) * DEG_TO_RAD;
            const rotation = random(0, 360, false) * DEG_TO_RAD;
            const [sin, cos] = [Math.sin(angle), Math.cos(angle)];
            const startRadius = random(params.diameter / 20, params.diameter / 10, false);
            const endRadius = random(params.diameter / 4, params.diameter / 2, false);
            const length = random(params.diameter / 16, params.diameter / 8, false);
            const graphics = new Graphics();
            graphics.lineStyle({
                width: 3,
                color: params.color,
                alpha: 1,
                join: LINE_JOIN.BEVEL,
            });
            graphics.moveTo(-length / 2, 0);
            graphics.lineTo(length / 2, 0);
            this._shrapnel.push({
                x: startRadius * sin,
                y: startRadius * -cos,
                rotation,
                endRotation: rotation + [-1,1][random(0, 1, false)] * random(90, 420, false) * DEG_TO_RAD,
                opacity: 1,
                endX: endRadius * sin,
                endY: endRadius * -cos,
                graphics,
            });
        }
        this.timeline.add({
            targets: this._shrapnel,
            x: (s: Shrapnel) => s.endX,
            y: (s: Shrapnel) => s.endY,
            easing: "easeOutQuad",
        }, 0).add({
            targets: this._shrapnel,
            rotation: (s: Shrapnel) => s.endRotation,
            easing: "linear",
        }, 0).add({
            targets: this._shrapnel,
            duration: () => random(params.maxDuration / 2, params.maxDuration / 1.5, false),
            opacity: 0,
            easing: 'easeInQuad',
        }, 0);

        for (const shrapnel of this._shrapnel) {
            this.addChild(shrapnel.graphics);
        }

        this.timeline.change = () => {
            for (const shrapnel of this._shrapnel) {
                shrapnel.graphics.alpha = shrapnel.opacity;
                shrapnel.graphics.position.set(shrapnel.x, shrapnel.y);
                shrapnel.graphics.rotation = shrapnel.rotation;
            }
        }
    }
}
