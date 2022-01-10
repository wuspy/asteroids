import { BlurFilter } from "@pixi/filter-blur";
import { LINE_JOIN } from "@pixi/graphics";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { DEG_TO_RAD, Polygon } from "@pixi/math";
import { UFO_HITAREA, UFOType, UFO_SIZES, UFO_SCORES, UFO_SPEEDS, UFO_PROJECTILE_SPEEDS, QUEUE_PRIORITIES, UFO_INACCURACY, UFO_FIRE_INTERVALS, UFO_SHIFT_INTERVALS, UFO_SHIFT_AMOUNTS, UFO_HARD_INACCURACY_SCORE } from "./constants";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";
import { atan2, calculateVelocityToIntercept, CoreGameObjectParams, GameObject, random, scalePolygon, WrapMode } from "./engine";
import { Explosion } from "./Explosion";
import { Projectile } from "./Projectile";

// const COLOR = 0x01d6ff;

const EXPLOSION_SIZES: Readonly<{ [Key in UFOType]: number }> = {
    large: 250,
    small: 200,
};

const HITAREAS: Readonly<{ [Key in UFOType]: Polygon }> = {
    large: scalePolygon(UFO_HITAREA, UFO_SIZES.large),
    small: scalePolygon(UFO_HITAREA, UFO_SIZES.small),
};

const LINE_WIDTHS: Readonly<{ [Key in UFOType]: number }> = {
    large: 4,
    small: 3
};

export class UFO extends GameObject<GameState, GameEvents> {
    private _type: UFOType;
    private _nextFireTime!: number;
    private _nextYShift?: number;
    private _currentYShiftEnd?: number;
    private _direction: number;

    constructor(params: CoreGameObjectParams<GameState, GameEvents> & {
        type: UFOType,
    }) {
        super({ ...params, hitArea: HITAREAS[params.type], wrapMode: WrapMode.Vertical, queuePriority: QUEUE_PRIORITIES.ufo });
        this._type = params.type;

        const startY = random(Math.floor(this.boundingBox.height), Math.floor(this.worldSize.height - this.boundingBox.height), true);
        const left = -this.boundingBox.width / 2;
        const right = this.worldSize.width - left;
        this._direction = [-1, 1][random(0, 1, true)];
        this.position.set(this._direction === 1 ? left : right, startY);
        this.velocity.x = this._direction * UFO_SPEEDS[this._type];

        const sprite = UFO.createModel(LINE_WIDTHS[this._type], UFO_SIZES[this._type], this.state.theme.ufoColor);
        sprite.cacheAsBitmap = true;
        const shadow = new Graphics(sprite.geometry);
        shadow.filters = [new BlurFilter()];
        this.container.addChild(shadow, sprite);

        this.setNextFireTime();
        this.setNextYShift();
        this.events.trigger("ufoCreated", this);
    }

    static createModel(lineWidth: number, scale: number, color: number): Graphics {
        const ufo = new Graphics();
        ufo.lineStyle({
            width: lineWidth,
            color,
            alpha: 1,
            join: LINE_JOIN.BEVEL,
        });
        ufo.moveTo(-60 * scale, 12 * scale);
        ufo.lineTo(-36 * scale, -13 * scale);
        ufo.lineTo(35 * scale, -13 * scale);
        ufo.lineTo(59 * scale, 12 * scale);
        ufo.closePath();
        ufo.moveTo(-32 * scale, -13 * scale);
        ufo.lineTo(-24 * scale, -35 * scale);
        ufo.lineTo(23 * scale, -35 * scale);
        ufo.lineTo(31 * scale, -13 * scale);

        ufo.moveTo(-34 * scale, 12 * scale);
        ufo.arcTo(0, 72 * scale, 33 * scale, 12 * scale, 38 * scale);

        return ufo;
    }

    override tick(timestamp: number, elapsed: number): void {
        if (this._nextYShift && timestamp >= this._nextYShift) {
            this._nextYShift = undefined;
            this.velocity.x = this.velocity.x / Math.SQRT2;
            this.velocity.y = [-1, 1][random(0, 1, true)] * this.velocity.x;
            this._currentYShiftEnd = timestamp + random(UFO_SHIFT_AMOUNTS[this._type][0], UFO_SHIFT_AMOUNTS[this._type][1], true) / Math.abs(this.velocity.y) * 1000;            
        } else if (this._currentYShiftEnd && timestamp >= this._currentYShiftEnd) {
            const distanceToEdge = Math.min(this.position.y, this.worldSize.height - this.position.y);
            if (distanceToEdge < this.boundingBox.height) {
                // Don't allow a UFO to get stuck near the screen margin, even if it needs to travel a bit further
                this._currentYShiftEnd = timestamp + distanceToEdge / Math.abs(this.velocity.y) * 1000;
            } else {
                this._currentYShiftEnd = undefined;
                this.velocity.y = 0;
                this.velocity.x *= Math.SQRT2;
                this.setNextYShift();
            }
        }

        super.tick(timestamp, elapsed);

        if ((this._direction === 1 && this.position.x > this.worldSize.width + this.boundingBox.width / 2)
            || (this._direction === -1 && this.position.x < -this.boundingBox.width / 2)
        ) {
            this.destroy(false);
        } else if (timestamp >= this._nextFireTime) {
            this.fire();
            this.setNextFireTime();
        }
    }

    private fire(): void {
        let angle;
        if (this._type === "large") {
            // Large UFOs just fire in a random direction
            angle = random(1, 360, true) * DEG_TO_RAD;
        } else {
            // Small UFOs fire at the location the ship will be if it continues at its current velocity
            let v;
            if (this.state.ship) {
                v = calculateVelocityToIntercept({
                    originPosition: this.position,
                    originSpeed: UFO_PROJECTILE_SPEEDS[this._type],
                    targetPosition: this.state.ship.position,
                    targetVelocity: this.state.ship.velocity,
                });
            }
            if (!v && this.state.asteroids.length) {
                // Ship is either destroyed or moving too fast for a projectile to catch, so fire at a random
                // asteroid instead
                const i = random(0, this.state.asteroids.length - 1, true);
                v = calculateVelocityToIntercept({
                    originPosition: this.position,
                    originSpeed: UFO_PROJECTILE_SPEEDS[this._type],
                    targetPosition: this.state.asteroids[i].position,
                    targetVelocity: this.state.asteroids[i].velocity,
                });
            }

            if (v) {
                angle = atan2(v.y, v.x);
                // Calculate inaccuracy at current score
                const inaccuracy = Math.min(1, this.state.score / UFO_HARD_INACCURACY_SCORE) * (UFO_INACCURACY.hard - UFO_INACCURACY.easy) + UFO_INACCURACY.easy;
                if (inaccuracy) {
                    angle += random(-Math.floor(inaccuracy * 100), Math.floor(inaccuracy * 100), true) / 100;
                }
            } else {
                // No targets to fire at
                angle = random(1, 360, true) * DEG_TO_RAD;
            }
        }

        new Projectile({
            state: this.state,
            events: this.events,
            queue: this.queue,
            worldSize: this.worldSize,
            position: this.position,
            rotation: angle,
            speed: UFO_PROJECTILE_SPEEDS[this._type],
            from: this,
            color: this.state.theme.ufoColor,
        });
    }

    private setNextFireTime(): void {
        this._nextFireTime = this.state.timestamp + random(UFO_FIRE_INTERVALS[this._type][0] * 1000, UFO_FIRE_INTERVALS[this._type][1] * 1000, true);
    }

    private setNextYShift(): void {
        this._nextYShift = this.state.timestamp + random(UFO_SHIFT_INTERVALS[this._type][0] * 1000, UFO_SHIFT_INTERVALS[this._type][1] * 1000, true);
    }

    override destroy(explode: boolean = false): void {
        if (explode && this.container.parent) {
            const explosion = new Explosion({
                queue: this.queue,
                diameter: EXPLOSION_SIZES[this._type],
                maxDuration: 2000,
                color: this.state.theme.ufoColor,
            });
            explosion.container.position.copyFrom(this.position);
            explosion.container.rotation = this.rotation;
            this.container.parent.addChild(explosion.container);
        }
        super.destroy();
        this.events.trigger("ufoDestroyed", this);
    }

    get score(): number {
        return UFO_SCORES[this._type];
    }
}
