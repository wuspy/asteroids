import { IRenderer, Texture } from "@pixi/core";
import { Container } from "@pixi/display";
import { LINE_JOIN } from "@pixi/graphics";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Sprite } from "@pixi/sprite";
import { UFO, UFOType, UFO_SIZES } from "@wuspy/asteroids-core";
import { Explosion } from "../effects";
import { createDropShadowTexture } from "../util";
import { useApp } from "../AppContext";
import { onMount } from "solid-js";
import { trackGameObject } from "./util";

const EXPLOSION_SIZES: Readonly<{ [Key in UFOType]: number }> = {
    large: 250,
    small: 200,
} as const;

const LINE_WIDTHS: Readonly<{ [Key in UFOType]: number }> = {
    large: 4,
    small: 3
} as const;

const TEXTURE_CACHE = new WeakMap<IRenderer, { [Key in UFOType]: Texture }>();

const createUFOTexture = (renderer: IRenderer, type: UFOType): Texture => {
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

const generateTextureCache = (renderer: IRenderer) => {
    TEXTURE_CACHE.set(renderer, {
        "large": createUFOTexture(renderer, "large"),
        "small": createUFOTexture(renderer, "small"),
    });
};

interface UFOSpriteProps {
    ufo: UFO;
    effectsContainer: Container;
}

export const UfoSprite = (props: UFOSpriteProps) => {
    const { renderer, theme } = useApp();

    if (!TEXTURE_CACHE.has(renderer)) {
        generateTextureCache(renderer);
    }

    let sprite!: Sprite;

    onMount(() => {
        trackGameObject(props.ufo, sprite);
        props.ufo.onDestroyed = ({ hit }) => { // eslint-disable-line solid/reactivity
            if (hit) {
                props.effectsContainer.addChild(new Explosion({
                    source: props.ufo,
                    diameter: EXPLOSION_SIZES[props.ufo.type],
                    maxDuration: 2000,
                    color: theme().ufoColor,
                    renderer,
                }));
            }
        };
    });

    return <sprite
        ref={sprite}
        texture={TEXTURE_CACHE.get(renderer)![props.ufo.type]}
        tint={theme().ufoColor}
        anchor={0.5}
    />;
};
