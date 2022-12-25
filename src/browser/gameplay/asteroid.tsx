import { IRenderer, Texture } from "@pixi/core";
import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { Asteroid, ASTEROID_HITAREAS } from "../../core";
import { Explosion, PopAnimation } from "../animations";
import { GameTheme } from "../GameTheme";
import { PowerupFilter } from "../filters";
import { createDropShadowTexture, createShadowTexture } from "../util";
import { Sprite } from "@pixi/sprite";
import { TickFn } from "../../core/engine";

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

export interface AsteroidDisplayProps {
    asteroid: Asteroid;
    theme: GameTheme;
    mainContainer: Container;
    foregroundContainer: Container;
    renderer: IRenderer;
}

export const displayAsteroid = ({ asteroid, theme, mainContainer, foregroundContainer, renderer }: AsteroidDisplayProps) => {
    if (!TEXTURE_CACHE.has(renderer)) {
        generateTextureCache(renderer);
    }

    const container = new Container();
    container.position.copyFrom(asteroid.position);
    container.rotation = asteroid.rotation;

    const sprite = new Sprite(TEXTURE_CACHE.get(renderer)![asteroid.model][asteroid.generation]);
    sprite.tint = asteroid.hasPowerup ? theme.powerupColor : theme.foregroundColor;

    const spawnAnimation = new PopAnimation({
        queue: asteroid.queue,
        texture: SPAWN_ANIMATION_TEXTURE_CACHE.get(renderer)![asteroid.model][asteroid.generation],
        scale: GENERATION_SPAWN_SIZES[asteroid.generation],
        duration: 250,
    });

    spawnAnimation.tint = sprite.tint;

    container.addChild(sprite, spawnAnimation);
    mainContainer.addChild(container);

    let powerupFilter: PowerupFilter;
    if (asteroid.hasPowerup) {
        powerupFilter = new PowerupFilter();
        container.filters = [powerupFilter];
    }

    asteroid.onPositionChange = position => container.position.copyFrom(position);
    asteroid.onRotationChange = rotation => container.rotation = rotation;

    const tick: TickFn = (timestamp, elapsed) => {
        powerupFilter?.tick(timestamp, elapsed);
    };

    asteroid.queue.add(100, tick);

    asteroid.onDestroyed = ({ hit }) => {
        if (hit) {
            const explosion = new Explosion({
                queue: asteroid.queue,
                diameter: GENERATION_EXPLOSION_SIZES[asteroid.generation],
                maxDuration: 2000,
                color: sprite.tint,
                renderer,
            });
            explosion.position.copyFrom(container.position);
            explosion.rotation = container.rotation;
            foregroundContainer.addChild(explosion);
        }
        container.destroy({ children: true });
        asteroid.queue.remove(tick);
    };
};
