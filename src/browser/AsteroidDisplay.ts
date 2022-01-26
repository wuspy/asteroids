import { Container } from "@pixi/display";
import { BlurFilter } from "@pixi/filter-blur";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { Asteroid, IAsteroidDisplay, ASTEROID_HITAREAS } from "@core";
import { Explosion } from "./animations";

const GENERATION_LINE_WIDTHS: readonly number[] = [4, 3.5, 3];
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

    constructor(asteroid: Asteroid) {
        super();
        asteroid.display = this;
        this._asteroid = asteroid;
        this.position.copyFrom(asteroid.position);
        this.rotation = asteroid.rotation;

        const sprite = new Graphics(GEOMETRIES[asteroid.model][asteroid.generation]);
        sprite.tint = asteroid.state.theme.foregroundColor;
        const blur = sprite.clone();
        blur.filters = [new BlurFilter()];
        this.addChild(blur, sprite);
    }

    createExplosion(): void {
        if (this.parent) {
            const explosion = new Explosion({
                queue: this._asteroid.queue,
                diameter: GENERATION_EXPLOSION_SIZES[this._asteroid.generation],
                maxDuration: 2000,
                color: this._asteroid.state.theme.foregroundColor,
            });
            explosion.position.copyFrom(this.position);
            this.parent.addChild(explosion);
        }
    }

    override destroy(): void {
        this._asteroid.display = undefined;
        super.destroy({ children: true });
    }
}
