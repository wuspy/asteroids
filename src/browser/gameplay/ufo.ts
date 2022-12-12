import { AbstractRenderer, Texture } from "@pixi/core";
import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { UFO, UFOType, UFO_SIZES } from "../../core";
import { Explosion } from "../animations";
import { GameTheme } from "../GameTheme";
import { Sprite } from "@pixi/sprite";
import { createDropShadowTexture } from "../util";

const EXPLOSION_SIZES: Readonly<{ [Key in UFOType]: number }> = {
    large: 250,
    small: 200,
} as const;

const LINE_WIDTHS: Readonly<{ [Key in UFOType]: number }> = {
    large: 4,
    small: 3
} as const;

const TEXTURE_CACHE = new WeakMap<AbstractRenderer, { [Key in UFOType]: Texture }>();

const createUFOTexture = (renderer: AbstractRenderer, type: UFOType): Texture => {
    const graphics = new Graphics();
    graphics.lineStyle({
        width: LINE_WIDTHS[type],
        color: 0xffffff,
        alpha: 1,
        join: LINE_JOIN.BEVEL,
    });
    const scale = UFO_SIZES[type];
    graphics.moveTo(-60 * scale, 12 * scale);
    graphics.lineTo(-36 * scale, -13 * scale);
    graphics.lineTo(35 * scale, -13 * scale);
    graphics.lineTo(59 * scale, 12 * scale);
    graphics.closePath();
    graphics.moveTo(-32 * scale, -13 * scale);
    graphics.lineTo(-24 * scale, -35 * scale);
    graphics.lineTo(23 * scale, -35 * scale);
    graphics.lineTo(31 * scale, -13 * scale);

    graphics.moveTo(-34 * scale, 12 * scale);
    graphics.arcTo(0, 72 * scale, 33 * scale, 12 * scale, 38 * scale);

    const texture = createDropShadowTexture(renderer, renderer.generateTexture(graphics));
    texture.defaultAnchor.set(0.5);
    return texture;
};

const generateTextureCache = (renderer: AbstractRenderer) => {
    TEXTURE_CACHE.set(renderer, {
        "large": createUFOTexture(renderer, "large"),
        "small": createUFOTexture(renderer, "small"),
    });
};

export interface UFODisplayProps {
    ufo: UFO;
    theme: GameTheme;
    mainContainer: Container;
    foregroundContainer: Container;
    renderer: AbstractRenderer;
}

export const displayUFO = ({ ufo, theme, mainContainer, foregroundContainer, renderer }: UFODisplayProps) => {
    if (!TEXTURE_CACHE.has(renderer)) {
        generateTextureCache(renderer);
    }

    const sprite = new Sprite(TEXTURE_CACHE.get(renderer)![ufo.type]);
    sprite.tint = theme.ufoColor;
    sprite.position.copyFrom(ufo.position);
    sprite.rotation = ufo.rotation;

    mainContainer.addChild(sprite);

    ufo.onPositionChange = position => sprite.position.copyFrom(position);
    ufo.onRotationChange = rotation => sprite.rotation = rotation;
    ufo.onDestroyed = ({ hit }) => {
        if (hit) {
            const explosion = new Explosion({
                queue: ufo.queue,
                diameter: EXPLOSION_SIZES[ufo.type],
                maxDuration: 2000,
                color: theme.ufoColor,
                renderer,
            });
            explosion.position.copyFrom(sprite.position);
            explosion.rotation = sprite.rotation;
            foregroundContainer.addChild(explosion);
        }
        sprite.destroy();
    };
};
