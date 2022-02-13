import { Container, IDestroyOptions } from "@pixi/display";
import { BlurFilter } from "@pixi/filter-blur";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { Asteroid, IAsteroidDisplay, ASTEROID_HITAREAS, AsteroidDestroyOptions } from "@core";
import { Explosion, PopAnimation } from "./animations";
import { GameTheme } from "./GameTheme";

const GENERATION_LINE_WIDTHS: readonly number[] = [4, 3.5, 3];
const GENERATION_SPAWN_SIZES: readonly number[] = [1, 1.75, 2.25];
const GENERATION_EXPLOSION_SIZES: readonly number[] = [250, 200, 150];

const GEOMETRIES = ASTEROID_HITAREAS.map((generations) => generations.map((polygon, generation) => {
    const graphics = new Graphics();
    graphics.lineStyle({
        width: GENERATION_LINE_WIDTHS[generation],
        color: 0xffffff,
        alpha: 1,
        join: LINE_JOIN.BEVEL,
    });
    graphics.drawPolygon(polygon);
    return graphics.geometry;
}));

export class AsteroidDisplay extends Container implements IAsteroidDisplay {
    private readonly _asteroid: Asteroid;
    private readonly _theme: GameTheme;

    constructor(asteroid: Asteroid, theme: GameTheme) {
        super();
        asteroid.display = this;
        this._asteroid = asteroid;
        this._theme = theme;
        this.position.copyFrom(asteroid.position);
        this.rotation = asteroid.rotation;

        const sprite = new Graphics(GEOMETRIES[asteroid.model][asteroid.generation]);
        sprite.tint = theme.foregroundColor;
        const blur = sprite.clone();
        blur.filters = [new BlurFilter()];
        this.addChild(blur, sprite);

        this.createSpawnAnimation();
    }

    gameObjectDestroyed({ hit }: AsteroidDestroyOptions): void {
        if (hit && this.parent) {
            const explosion = new Explosion({
                queue: this._asteroid.queue,
                diameter: GENERATION_EXPLOSION_SIZES[this._asteroid.generation],
                maxDuration: 2000,
                color: this._theme.foregroundColor,
            });
            explosion.position.copyFrom(this.position);
            this.parent.addChild(explosion);
        }
        this.destroy({ children: true });
    }

    override destroy(options?: boolean | IDestroyOptions): void {
        this._asteroid.display = undefined;
        super.destroy(options);
    }

    private createSpawnAnimation(): void {
        const sprite = new Graphics(GEOMETRIES[this._asteroid.model][this._asteroid.generation]);
        sprite.tint = this._theme.foregroundColor;
        sprite.filters = [new BlurFilter(12)];

        const animation = new PopAnimation({
            queue: this._asteroid.queue,
            target: sprite,
            scale: GENERATION_SPAWN_SIZES[this._asteroid.generation],
            duration: 250,
        });
        this.addChild(animation);
    }
}
