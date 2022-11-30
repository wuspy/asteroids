import { DEG_TO_RAD } from "@pixi/math";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { urandom, TickQueue } from "../../core/engine";
import { OneShotAnimation } from "./OneShotAnimation";

interface Particle {
    x: number;
    y: number;
    radius: number;
    endX: number;
    endY: number;
}

export interface ExplosionParams {
    queue: TickQueue;
    diameter: number;
    maxDuration: number;
    color: number;
}

export class Explosion extends OneShotAnimation {
    private readonly _particles: Particle[];
    private readonly _color: number;
    private readonly _graphics: Graphics;

    constructor(params: ExplosionParams) {
        super({
            ...params,
            defaultAnimeParams: {
                duration: urandom(params.maxDuration / 1.5, params.maxDuration)
            },
        });
        this._color = params.color;
        this._particles = [];
        this._graphics = new Graphics();
        this.addChild(this._graphics);
        for (let i = 0; i < params.diameter / 6; i++) {
            const angle = urandom(0, 360) * DEG_TO_RAD;
            const [sin, cos] = [Math.sin(angle), Math.cos(angle)];
            const startRadius = urandom(params.diameter / 50, params.diameter / 10);
            const endRadius = urandom(params.diameter / 6, params.diameter / 2);
            this._particles.push({
                x: startRadius * sin,
                y: startRadius * -cos,
                radius: urandom(params.diameter / 36, params.diameter / 18),
                endX: endRadius * sin,
                endY: endRadius * -cos,
            });
        }
        this.timeline.add({
            targets: this._particles,
            x: (p: Particle) => p.endX,
            y: (p: Particle) => p.endY,
            radius: 0,
            easing: "easeOutExpo",
            change: () => {
                this._graphics.clear();
                for (const particle of this._particles.filter((particle) => particle.radius > 0.2)) {
                    this._graphics.beginFill(this._color, 1, true);
                    this._graphics.drawCircle(particle.x, particle.y, particle.radius);
                    this._graphics.endFill();
                }
            },
        });
    }
}
