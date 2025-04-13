import { Container } from "@pixi/display";
import { Emitter } from "./Emitter";
import { Color, ColorSource, IRenderer, Texture } from "@pixi/core";
import { createShadowTexture } from "../util";
import { Ship } from "@wuspy/asteroids-core";

interface ShipHyperspaceEmitterProps {
    parent: Container;
    owner: Container;
    color: ColorSource;
    texture: Texture;
    ship: Ship;
    renderer: IRenderer;
}

export class ShipHyperspaceEmitter extends Emitter {
    public constructor({ parent, owner, color, texture, ship, renderer }: ShipHyperspaceEmitterProps) {
        super({
            queue: ship.queue,
            parent,
            owner,
            emit: true,
            lifetime: { min: 0.1, max: 0.1 },
            frequency: 0.0002,
            emitterLifetime: -1,
            maxParticles: 500,
            pos: { x: 0, y: 0 },
            behaviors: [{
                type: "alpha",
                config: { alpha: { start: 0.25, end: 0 } },
            }, {
                type: "scale",
                config: { scale: { start: 0.5, end: 0 } },
            }, {
                type: "colorStatic",
                config: { color: new Color(color).toHex() }
            }, {
                type: "textureSingle",
                config: { texture: createShadowTexture(renderer, texture) },
            }],
        });
    }
}
