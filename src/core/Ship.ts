import {
    ACCELERATION,
    FRICTION,
    INVULNERABLE_TIME,
    MAX_ROTATION,
    MAX_SPEED,
    RECOIL,
    ROTATION_ACCELERATION,
    ROTATION_FRICTION,
    SHIP_HITAREA,
    HYPERSPACE_DELAY,
    SHIP_PROJECTILE_SPEED,
    QUEUE_PRIORITIES,
    HYPERSPACE_COOLDOWN
} from "./constants";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";
import { DynamicGameObject, random, CoreGameObjectParams, Vec2, IGameObjectDisplay } from "./engine";
import { IPointData, DEG_TO_RAD } from "@pixi/math";
import { Projectile } from "./Projectile";

export interface IShipDisplay extends IGameObjectDisplay {
    createSpawnAnimation(): void;
    createExplosion(): void;
}

export class Ship extends DynamicGameObject<GameState, GameEvents> {
    override display?: IShipDisplay;
    accelerationAmount: number;
    rotationAmount: number;
    private _invulnerableCountdown!: number;
    private _hyperspaceCountdown: number;
    private _lastHyperspaceTime: number;

    constructor(params: CoreGameObjectParams<GameState, GameEvents> & {
        invulnerable: boolean,
        position: Vec2,
    }) {
        super({
            ...params,
            hitArea: SHIP_HITAREA,
            queuePriority: QUEUE_PRIORITIES.ship,
            maxSpeed: MAX_SPEED,
            maxRotationSpeed: 0,
            friction: FRICTION,
            rotationFriction: ROTATION_FRICTION,
        });

        this.accelerationAmount = 0;
        this._hyperspaceCountdown = 0;
        this._lastHyperspaceTime = 0;
        this.rotationAmount = 0;
        this.invulnerable = params.invulnerable;
    }

    override tick(timestamp: number, elapsed: number): void {
        if (this._hyperspaceCountdown) {
            if (this._hyperspaceCountdown >= HYPERSPACE_DELAY / 2 && this._hyperspaceCountdown - elapsed < HYPERSPACE_DELAY / 2) {
                // We're in the middle of the hyperspace delay, the ship is invisible, so find a new location and move the ship to it
                this.stop();
                this.rotation = random(0, 360, true) * DEG_TO_RAD;
                this.position.set(
                    random(this.boundingBox.width, this.worldSize.width - this.boundingBox.width * 2, true),
                    random(this.boundingBox.height, this.worldSize.height - this.boundingBox.height * 2, true),
                );
                this.display?.createSpawnAnimation();
            }
            this._hyperspaceCountdown = Math.max(0, this._hyperspaceCountdown - elapsed);
        }

        if (this.invulnerable) {
            this._invulnerableCountdown = Math.max(0, this._invulnerableCountdown - elapsed);
        }

        this.maxRotationSpeed = Math.abs(this.rotationAmount) * MAX_ROTATION;
        this.rotationAcceleration = Math.sign(this.rotationAmount) * ROTATION_ACCELERATION;
        this.acceleration = this.accelerationAmount * ACCELERATION;

        super.tick(timestamp, elapsed);
    }

    override destroy(options?: {
        explode: boolean,
    }): void {
        if (!!options?.explode && this.display) {
            this.display.createExplosion();
        }
        super.destroy();
        this.events.trigger("shipDestroyed", this);
    }

    fire(): void {
        this.events.trigger("projectileCreated", new Projectile({
            events: this.events,
            state: this.state,
            queue: this.queue,
            worldSize: this.worldSize,
            position: this.gunPosition,
            rotation: this.rotation,
            // Give projectiles a little boost if we're moving in the same direction
            speed: Math.max(SHIP_PROJECTILE_SPEED, SHIP_PROJECTILE_SPEED + this.speedAtRotation / 2),
            from: this,
        }));
        // Add recoil
        if (this.speedAtRotation > -MAX_SPEED) {
            this.velocity.x -= RECOIL * Math.sin(this.rotation);
            this.velocity.y -= RECOIL * -Math.cos(this.rotation);
        }
    }

    hyperspace(): void {
        if (this.state.timestamp - this._lastHyperspaceTime >= HYPERSPACE_COOLDOWN * 1000) {
            this._hyperspaceCountdown = HYPERSPACE_DELAY;
            this._lastHyperspaceTime = this.state.timestamp;
        }
    }

    get gunPosition(): IPointData {
        return {
            x: this.x + 20 * Math.sin(this.rotation),
            y: this.y + 20 * -Math.cos(this.rotation),
        };
    }

    get invulnerable(): boolean {
        return this._invulnerableCountdown > 0 || this._hyperspaceCountdown > 0;
    }

    set invulnerable(invulnerable: boolean) {
        this._invulnerableCountdown = invulnerable ? INVULNERABLE_TIME : 0;
    }

    get hyperspaceCountdown(): number {
        return this._hyperspaceCountdown;
    }

    get invulnerableCountdown(): number {
        return this._invulnerableCountdown;
    }

    get lastHyperspaceTime(): number {
        return this._lastHyperspaceTime;
    }
}
