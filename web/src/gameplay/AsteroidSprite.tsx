import { Filter, IRenderer, Texture } from "@pixi/core";
import { Container } from "@pixi/display";
import { LINE_JOIN } from "@pixi/graphics";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { ASTEROID_HITAREAS, Asteroid } from "@wuspy/asteroids-core";
import { Explosion, PopAnimation } from "../effects";
import { PowerupFilter } from "../filters";
import { createDropShadowTexture, createShadowTexture } from "../util";
import { onTick, useApp } from "../AppContext";
import { onMount } from "solid-js";
import { trackGameObject } from "./util";

const GENERATION_LINE_WIDTHS: readonly number[] = [4, 3.5, 3];
const GENERATION_SPAWN_SIZES: readonly number[] = [1.15, 1.75, 2.25];
const GENERATION_EXPLOSION_SIZES: readonly number[] = [250, 200, 150];

const createAsteroidTexture = (renderer: IRenderer, model: number, generation: number): Texture => {
    const graphics = new Graphics();
    graphics.lineStyle({
        width: GENERATION_LINE_WIDTHS[generation],
        color: 0xffffff,
        alpha: 1,
        join: LINE_JOIN.BEVEL,
    });
    graphics.drawPolygon(ASTEROID_HITAREAS[model][generation]);
    return renderer.generateTexture(graphics);
};

const TEXTURE_CACHE = new WeakMap<IRenderer, Texture[][]>;
const SPAWN_ANIMATION_TEXTURE_CACHE = new WeakMap<IRenderer, Texture[][]>;

const generateTextureCache = (renderer: IRenderer) => {
    TEXTURE_CACHE.set(renderer, ASTEROID_HITAREAS.map((generations, model) =>
        generations.map((polygon, generation) => {
            const texture = createDropShadowTexture(renderer, createAsteroidTexture(renderer, model, generation));
            texture.defaultAnchor.set(0.5);
            return texture;
        })
    ));

    SPAWN_ANIMATION_TEXTURE_CACHE.set(renderer, ASTEROID_HITAREAS.map((generations, model) =>
        generations.map((polygon, generation) => {
            const texture = createShadowTexture(renderer, createAsteroidTexture(renderer, model, generation), 12);
            texture.defaultAnchor.set(0.5);
            return texture;
        })
    ));
};

interface AsteroidSpriteProps {
    asteroid: Asteroid;
    effectsContainer: Container;
}

export const AsteroidsSprite = (props: AsteroidSpriteProps) => {
    const {renderer, theme} = useApp();

    if (!TEXTURE_CACHE.has(renderer)) {
        generateTextureCache(renderer);
    }

    let container!: Container;

    const tint = () => props.asteroid.hasPowerup ? theme().powerupColor : theme().foregroundColor;

    let filters: Filter[] | null = null;
    if (props.asteroid.hasPowerup) { // eslint-disable-line solid/reactivity
        const powerupFilter = new PowerupFilter();
        filters = [powerupFilter];
        // eslint-disable-next-line solid/reactivity
        onTick(props.asteroid.queue, (timestamp, elapsed) => powerupFilter.tick(timestamp, elapsed));
    }

    onMount(() => {
        trackGameObject(props.asteroid, container);
        props.asteroid.onDestroyed = ({ hit }) => { // eslint-disable-line solid/reactivity
            if (hit) {
                props.effectsContainer.addChild(new Explosion({
                    source: props.asteroid,
                    diameter: GENERATION_EXPLOSION_SIZES[props.asteroid.generation],
                    maxDuration: 2000,
                    color: tint(),
                    renderer,
                }));
            }
        };
        container.addChild(new PopAnimation({
            queue: props.asteroid.queue,
            texture: SPAWN_ANIMATION_TEXTURE_CACHE.get(renderer)![props.asteroid.model][props.asteroid.generation],
            scale: GENERATION_SPAWN_SIZES[props.asteroid.generation],
            duration: 250,
            tint: tint(),
        }));
    });

    return <container ref={container} filters={filters}>
        <sprite
            texture={TEXTURE_CACHE.get(renderer)![props.asteroid.model][props.asteroid.generation]}
            tint={tint()}
            anchor={0.5}
        />
    </container>
};
