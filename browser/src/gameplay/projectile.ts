import { PROJECTILE_LIFETIME, Projectile, Ship, TickFn, UFO } from "@wuspy/asteroids-core";
import { IRenderer, Texture, utils } from "@pixi/core";
import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Sprite } from "@pixi/sprite";
import { GameTheme } from "../GameTheme";
import { Emitter } from "../animations";
import { createDropShadowTexture } from "../util";

export interface ProjectileDisplayProps {
    projectile: Projectile;
    theme: GameTheme;
    mainContainer: Container;
    backgroundContainer: Container;
    renderer: IRenderer;
}

const TEXTURE_CACHE = new WeakMap<IRenderer, Texture>();

const generateTextureCache = (renderer: IRenderer) => {
    const graphics = new Graphics();
    graphics.beginFill(0xffffff, 1, true);
    graphics.drawCircle(0, 0, 5);
    graphics.endFill();

    const texture = createDropShadowTexture(renderer, renderer.generateTexture(graphics))
    texture.defaultAnchor.set(0.5);
    TEXTURE_CACHE.set(renderer, texture);
}

export const displayProjectile = ({ projectile, theme, mainContainer, backgroundContainer, renderer }: ProjectileDisplayProps) => {
    if (!TEXTURE_CACHE.has(renderer)) {
        generateTextureCache(renderer);
    }
    const texture = TEXTURE_CACHE.get(renderer);

    const color = projectile.from instanceof UFO
        ? theme.ufoColor
        : projectile.from instanceof Ship && projectile.from.powerupRemaining
            ? theme.powerupColor
            : theme.foregroundColor;

    const emitterContainer = new Container();
    backgroundContainer.addChild(emitterContainer);

    const sprite = new Sprite(texture);
    sprite.tint = color;
    sprite.position.copyFrom(projectile.position);
    sprite.rotation = projectile.rotation;
    mainContainer.addChild(sprite);

    const emitter = new Emitter({
        queue: projectile.queue,
        parent: emitterContainer,
        destroyParent: true,
        owner: sprite,
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
            config: { color: utils.hex2string(color) }
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

    const tick: TickFn = () => {
        emitterContainer.alpha = sprite.alpha = Math.min(1, (PROJECTILE_LIFETIME - projectile.life) / (PROJECTILE_LIFETIME * 0.2));
    };

    projectile.queue.add(100, tick);

    projectile.onDestroyed = () => {
        sprite.destroy();
        projectile.queue.remove(tick);
    };

    projectile.onPositionChange = position => sprite.position.copyFrom(position);
    projectile.onRotationChange = rotation => sprite.rotation = rotation;
    projectile.onScreenWrap = () => emitter.resetPositionTracking();
};
