import { IRenderer, Texture } from "@pixi/core";
import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Sprite } from "@pixi/sprite";
import { PROJECTILE_LIFETIME, Projectile, Ship, UFO } from "@wuspy/asteroids-core";
import { ProjectileEmitter } from "../effects";
import { createDropShadowTexture } from "../util";
import { onTick, useApp } from "../AppContext";
import { onCleanup, onMount } from "solid-js";
import { trackGameObject } from "./util";

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

interface ProjectileSpriteProps {
    projectile: Projectile;
    effectsContainer: Container;
    destroyEmitterImmediately?: boolean;
}

export const ProjectileSprite = (props: ProjectileSpriteProps) => {
    const { renderer, theme } = useApp();

    if (!TEXTURE_CACHE.has(renderer)) {
        generateTextureCache(renderer);
    }

    const color = () => props.projectile.from instanceof UFO
        ? theme().ufoColor
        : props.projectile.from instanceof Ship && props.projectile.from.powerupRemaining
            ? theme().powerupColor
            : theme().foregroundColor;

    let sprite!: Sprite;
    let projectileEmitter!: ProjectileEmitter;

    onMount(() => {
        trackGameObject(props.projectile, sprite);
        projectileEmitter = new ProjectileEmitter({
            parent: props.effectsContainer,
            owner: sprite,
            color: sprite.tint,
            texture: sprite.texture,
            projectile: props.projectile,
        });
    });

    onCleanup(() => {
        if (props.destroyEmitterImmediately) {
            projectileEmitter.destroy();
        } else {
            projectileEmitter.emit = false;
            projectileEmitter.destroyWhenComplete = true;
        }
    });

    onTick(props.projectile.queue, () => { // eslint-disable-line solid/reactivity
        sprite.alpha = Math.min((PROJECTILE_LIFETIME - props.projectile.life) / (PROJECTILE_LIFETIME * 0.2), 1);
    });

    return <sprite
        ref={sprite}
        texture={TEXTURE_CACHE.get(renderer)}
        tint={color()}
        anchor={0.5}
    />;
};
