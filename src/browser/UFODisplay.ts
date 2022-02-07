import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { BlurFilter } from "@pixi/filter-blur";
import { IUFODisplay, UFO, UFOType, UFO_SIZES } from "@core";
import { Explosion } from "./animations";
import { GameTheme } from "./GameTheme";

const EXPLOSION_SIZES: Readonly<{ [Key in UFOType]: number }> = {
    large: 250,
    small: 200,
} as const;

const LINE_WIDTHS: Readonly<{ [Key in UFOType]: number }> = {
    large: 4,
    small: 3
} as const;

export class UFODisplay extends Container implements IUFODisplay {
    private readonly _ufo: UFO;
    private readonly _theme: GameTheme;

    constructor(ufo: UFO, theme: GameTheme) {
        super();
        ufo.display = this;
        this._ufo = ufo;
        this._theme = theme;
        this.position.copyFrom(ufo.position);
        this.rotation = ufo.rotation;

        const sprite = UFODisplay.createModel(LINE_WIDTHS[ufo.type], UFO_SIZES[ufo.type], theme.ufoColor);
        sprite.cacheAsBitmap = true;
        const shadow = new Graphics(sprite.geometry);
        shadow.filters = [new BlurFilter()];
        this.addChild(shadow, sprite);
    }

    static createModel(lineWidth: number, scale: number, color: number): Graphics {
        const graphics = new Graphics();
        graphics.lineStyle({
            width: lineWidth,
            color,
            alpha: 1,
            join: LINE_JOIN.BEVEL,
        });
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

        return graphics;
    }

    createExplosion(): void {
        const explosion = new Explosion({
            queue: this._ufo.queue,
            diameter: EXPLOSION_SIZES[this._ufo.type],
            maxDuration: 2000,
            color: this._theme.ufoColor,
        });
        explosion.position.copyFrom(this.position);
        explosion.rotation = this.rotation;
        this.parent?.addChild(explosion);
    }

    override destroy(): void {
        this._ufo.display = undefined;
        super.destroy({ children: true });
    }
}
