import { Container } from "@pixi/display";
import { Emitter } from "./Emitter";
import { Color, ColorSource, Texture } from "@pixi/core";
import { Projectile } from "@wuspy/asteroids-core";

interface ProjectileEmitterProps {
    owner: Container;
    color: ColorSource;
    texture: Texture;
    projectile: Projectile;
}

export class ProjectileEmitter extends Container {
    private readonly emitter: Emitter;

    public constructor({ owner, color, texture, projectile }: ProjectileEmitterProps) {
        super();

        this.emitter = new Emitter({
            queue: projectile.queue,
            parent: this,
            onDestroyed: () => {
                projectile.onScreenWrap = undefined;
                this.destroy();
            },
            owner,
            emit: true,
            lifetime: { min: 0.1, max: 0.2 },
            frequency: 0.002,
            emitterLifetime: -1,
            maxParticles: 100,
            pos: { x: 0, y: 0 },
            behaviors: [{
                type: "alpha",
                config: { alpha: { start: 0.1, end: 0 } },
            }, {
                type: "scale",
                config: { scale: { start: 0.75, end: 0 } },
            }, {
                type: "colorStatic",
                config: { color: new Color(color).toHex() }
            }, {
                type: "moveSpeed",
                config: { speed: { start: 50, end: 10 } },
            }, {
                type: 'rotationStatic',
                config: { min: 0, max: 360 },
            }, {
                type: "textureSingle",
                config: { texture },
            }],
        });

        projectile.onScreenWrap = () => this.emitter.resetPositionTracking();
    }
}
