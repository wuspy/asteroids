import { DEG_TO_RAD } from "@pixi/math";
import { UFOType, UFO_HITAREAS, UFO_SCORES, UFO_SPEEDS, UFO_PROJECTILE_SPEEDS, QUEUE_PRIORITIES, UFO_INACCURACY, UFO_FIRE_INTERVALS, UFO_SHIFT_INTERVALS, UFO_SHIFT_AMOUNTS, UFO_HARD_INACCURACY_SCORE } from "./constants";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";
import { atan2, calculateVelocityToIntercept, CoreGameObjectParams, GameObject, GameObjectObserver, WrapMode } from "./engine";
import { Projectile } from "./Projectile";

export interface UFODestroyOptions {
    hit: boolean;
    scored: boolean;
}

export type UFOObserver = GameObjectObserver<UFODestroyOptions>;

export class UFO extends GameObject<GameState, UFODestroyOptions, GameEvents> {
    private _type: UFOType;
    private _nextFireTime!: number;
    private _nextYShift?: number;
    private _currentYShiftEnd?: number;
    private _direction: number;

    constructor(params: CoreGameObjectParams<GameState, GameEvents> & {
        type: UFOType,
    }) {
        super({ ...params, hitArea: UFO_HITAREAS[params.type], wrapMode: WrapMode.Vertical, queuePriority: QUEUE_PRIORITIES.ufo });
        this._type = params.type;

        const startY = this._random(Math.floor(this.boundingBox.height), Math.floor(this.worldSize.height - this.boundingBox.height));
        const left = -this.boundingBox.width / 2;
        const right = this.worldSize.width - left;
        this._direction = [-1, 1][this._random(0, 1)];
        this.position.set(this._direction === 1 ? left : right, startY);
        this.velocity.x = this._direction * UFO_SPEEDS[this._type];

        this.setNextFireTime();
        this.setNextYShift();
    }

    override tick(timestamp: number, elapsed: number): void {
        if (this._nextYShift && timestamp >= this._nextYShift) {
            if (process.env.NODE_ENV === "development" && timestamp > this._nextYShift) {
                console.warn("Frame tick not synced to UFO y-shift start");
            }
            this._nextYShift = undefined;
            this.velocity.x = this.velocity.x / Math.SQRT2;
            this.velocity.y = [-1, 1][this._random(0, 1)] * this.velocity.x;
            this._currentYShiftEnd = timestamp + this._random(UFO_SHIFT_AMOUNTS[this._type][0], UFO_SHIFT_AMOUNTS[this._type][1]) / Math.abs(this.velocity.y) * 1000;
        } else if (this._currentYShiftEnd && timestamp >= this._currentYShiftEnd) {
            if (process.env.NODE_ENV === "development" && timestamp > this._currentYShiftEnd) {
                console.warn("Frame tick not synced to UFO y-shift end");
            }
            const distanceToEdge = Math.min(this.position.y, this.worldSize.height - this.position.y);
            if (distanceToEdge < this.boundingBox.height) {
                // Don't allow a UFO to get stuck near the screen margin, even if it needs to travel a bit further
                this._currentYShiftEnd = timestamp + this.boundingBox.height / Math.abs(this.velocity.y) * 1000;
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
            this.destroy({ hit: false, scored: false });
        } else if (timestamp >= this._nextFireTime) {
            if (process.env.NODE_ENV === "development" && timestamp > this._nextFireTime) {
                console.warn("Frame tick not synced to UFO fire time");
            }
            this.fire();
            this.setNextFireTime();
        }
    }

    private fire(): void {
        let angle: number;
        if (this._type === "large") {
            // Large UFOs just fire in a random direction
            angle = this._random(1, 360) * DEG_TO_RAD;
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
                const i = this._random(0, this.state.asteroids.length - 1);
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
                    angle += this._random(-Math.floor(inaccuracy * 100), Math.floor(inaccuracy * 100)) / 100;
                }
            } else {
                // No targets to fire at
                angle = this._random(1, 360) * DEG_TO_RAD;
            }
        }

        const speed = UFO_PROJECTILE_SPEEDS[this._type];
        this.events.trigger("projectileCreated", new Projectile({
            state: this.state,
            events: this.events,
            queue: this.queue,
            worldSize: this.worldSize,
            random: this._random,
            position: this.position,
            rotation: angle,
            velocity: {
                x: speed * Math.sin(angle),
                y: speed * -Math.cos(angle),
            },
            from: this,
        }));
    }

    private setNextFireTime(): void {
        this._nextFireTime = this.state.timestamp + this._random(UFO_FIRE_INTERVALS[this._type][0] * 1000, UFO_FIRE_INTERVALS[this._type][1] * 1000);
    }

    private setNextYShift(): void {
        this._nextYShift = this.state.timestamp + this._random(UFO_SHIFT_INTERVALS[this._type][0] * 1000, UFO_SHIFT_INTERVALS[this._type][1] * 1000);
    }

    override destroy(options: UFODestroyOptions): void {
        super.destroy(options);
        this.events.trigger("ufoDestroyed", this, !!options?.hit, !!options?.scored);
    }

    get score(): number {
        return UFO_SCORES[this._type];
    }

    get type(): UFOType {
        return this._type;
    }

    get nextYShift(): number | undefined {
        return this._nextYShift;
    }

    get currentYShiftEnd(): number | undefined {
        return this._currentYShiftEnd;
    }

    get nextFireTime(): number {
        return this._nextFireTime;
    }
}
