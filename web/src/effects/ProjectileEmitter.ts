import { Container } from "@pixi/display";
import { Emitter } from "./Emitter";
import { Color, ColorSource, Texture } from "@pixi/core";
import { Projectile } from "@wuspy/asteroids-core";
import { UI_TICK_PRIORITY } from "../AppContext";

interface ProjectileEmitterProps {
    parent: Container;
    owner: Container;
    color: ColorSource;
    texture: Texture;
    projectile: Projectile;
}

export class ProjectileEmitter extends Emitter {
    public constructor({ parent, owner, color, texture, projectile }: ProjectileEmitterProps) {
        const tick = () => {
            const scale = projectile.life + 1;
            this.maxLifetime = 0.2 / scale;
            this.minLifetime = 0.1 / scale;
        };

        super({
            queue: projectile.queue,
            parent,
            onDestroyed: () => {
                projectile.onScreenWrap = undefined;
                projectile.queue.remove(tick);
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

        projectile.onScreenWrap = () => this.resetPositionTracking();
        projectile.queue.add(UI_TICK_PRIORITY, tick);
    }
}
