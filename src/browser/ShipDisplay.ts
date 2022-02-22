import { Container, IDestroyOptions } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { BlurFilter } from "@pixi/filter-blur";
import { Tickable } from "@core/engine";
import { IShipDisplay, Ship, HYPERSPACE_DELAY, ShipDestroyOptions } from "@core";
import { Explosion, ShipSpawnAnimation } from "./animations";
import { GameTheme } from "./GameTheme";
import { PowerupFilter } from "./filters";

export class ShipDisplay extends Container implements IShipDisplay, Tickable {
    private readonly _ship: Ship;
    private readonly _theme: GameTheme;
    private readonly _shipGraphics: Graphics;
    private readonly _fireGraphics: Graphics;
    private readonly _shipShadow: Graphics;
    private readonly _fireShadow: Graphics;
    private _lastFireAnimation: number;
    private _powerupFilter?: PowerupFilter;

    constructor(ship: Ship, theme: GameTheme) {
        super();
        ship.display = this;
        this._ship = ship;
        this._theme = theme;
        this.position.copyFrom(ship.position);
        this.rotation = ship.rotation;

        this._shipGraphics = ShipDisplay.createModel(theme.foregroundColor);
        this._fireGraphics = ShipDisplay.createFireModel(theme.fireColor);
        this._lastFireAnimation = 0;

        this._shipShadow = this._shipGraphics.clone();
        this._fireShadow = this._fireGraphics.clone();
        this._shipShadow.filters = [new BlurFilter()];
        this._fireShadow.filters = [new BlurFilter()];

        this._shipGraphics.cacheAsBitmap = true;
        this._fireGraphics.cacheAsBitmap = true;
        this.addChild(this._fireShadow, this._fireGraphics, this._shipShadow, this._shipGraphics);

        this._ship.queue.add(100, this);
        this.createSpawnAnimation();
    }

    static createModel(color: number, lineWidth = 3, height = 60): Graphics {
        const ship = new Graphics();
        const scale = height / 60;
        ship.lineStyle({
            width: lineWidth,
            color,
            alpha: 1,
            join: LINE_JOIN.BEVEL,
        });

        ship.moveTo(0, -30 * scale);
        ship.lineTo(20 * scale, 30 * scale);
        ship.lineTo(7 * scale, 16 * scale);
        ship.lineTo(-7 * scale, 16 * scale);
        ship.lineTo(-20 * scale, 30 * scale);
        ship.closePath();
        ship.moveTo(-15.335 * scale, 16 * scale);
        ship.arcTo(0, 0, 15.335 * scale, 16 * scale, 20 * scale);

        ship.lineStyle({ width: 0 });
        ship.beginFill(color, 1, true);
        ship.moveTo(15.335 * scale, 16 * scale);
        ship.lineTo(20 * scale, 30 * scale);
        ship.lineTo(7 * scale, 16 * scale);
        ship.lineTo(-7 * scale, 16 * scale);
        ship.lineTo(-20 * scale, 30 * scale);
        ship.lineTo(-15.335 * scale, 16 * scale);
        ship.arcTo(0, 0, 15.335 * scale, 16 * scale, 20 * scale);
        ship.endFill();
        return ship;
    }

    static createFireModel(color: number): Graphics {
        const fire = new Graphics();

        fire.lineStyle({
            width: 3,
            color,
            alpha: 1,
            join: LINE_JOIN.BEVEL,
        });
        fire.moveTo(8, 16);
        fire.lineTo(0, 36);
        fire.lineTo(-8, 16);
        return fire;
    }

    tick(timestamp: number, elapsed: number): void {
        if (this._ship.hyperspaceCountdown) {
            const progress = Math.abs(this._ship.hyperspaceCountdown - HYPERSPACE_DELAY / 2) / (HYPERSPACE_DELAY / 2);
            this.alpha = progress;
            this.scale.set(progress / 2 + 0.5);
        } else if (this._ship.invulnerable) {
            this.alpha = (this._ship.invulnerableRemaining * 1000) % 150 > 75 ? 0.2 : 1;
        } else {
            this.alpha = 1;
        }
        if (this._ship.accelerationAmount) {
            if (timestamp - this._lastFireAnimation > 100) {
                this._fireGraphics.visible = false;
                this._fireShadow.visible = false;
                this._lastFireAnimation = timestamp;
            } else if (timestamp - this._lastFireAnimation > 50) {
                this._fireGraphics.visible = true;
                this._fireShadow.visible = true;
            }
        } else {
            this._fireGraphics.visible = false;
            this._fireShadow.visible = false;
        }
        this._powerupFilter?.tick(timestamp, elapsed);
    }

    onHyperspace(): void {
        this.createSpawnAnimation();
    }

    onPowerupStart(): void {
        this._shipGraphics.cacheAsBitmap = false;
        this._fireGraphics.cacheAsBitmap = false;
        this._shipGraphics.tint = this._shipShadow.tint = this._theme.powerupColor;
        this._fireGraphics.tint = this._fireShadow.tint = this._theme.powerupColor;
        this.filters = [
            this._powerupFilter = new PowerupFilter(),
        ];
        this._shipGraphics.cacheAsBitmap = true;
        this._fireGraphics.cacheAsBitmap = true;
        this.createSpawnAnimation();
    }

    onPowerupEnd(): void {
        this._shipGraphics.cacheAsBitmap = false;
        this._fireGraphics.cacheAsBitmap = false;
        this._shipGraphics.tint = this._shipShadow.tint = 0xffffff;
        this._fireGraphics.tint = this._fireShadow.tint = 0xffffff;
        this._shipGraphics.cacheAsBitmap = true;
        this._fireGraphics.cacheAsBitmap = true;
        this.filters = null;
        this._powerupFilter = undefined;
    }

    gameObjectDestroyed({ hit }: ShipDestroyOptions): void {
        if (hit && this.parent) {
            const explosion = new Explosion({
                queue: this._ship.queue,
                diameter: 250,
                maxDuration: 3000,
                color: this._theme.foregroundColor,
            });
            explosion.position.copyFrom(this.position);
            explosion.rotation = this.rotation;
            this.parent.addChild(explosion);
        }
        this.destroy({ children: true });
    }

    override destroy(options?: boolean | IDestroyOptions): void {
        this._ship.queue.remove(100, this);
        this._ship.display = undefined;
        super.destroy(options);
    }

    private createSpawnAnimation(): void {
        this.addChild(new ShipSpawnAnimation({
            color: this._ship.powerupRemaining ? this._theme.powerupColor : this._theme.foregroundColor,
            diameter: 50,
            queue: this._ship.queue,
        }));
    }
}
