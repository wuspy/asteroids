import {
    ACCELERATION,
    FRICTION,
    INVULNERABLE_TIME,
    MAX_ROTATION_SPEED,
    MAX_SPEED,
    RECOIL,
    ROTATION_ACCELERATION,
    ROTATION_FRICTION,
    SHIP_HITAREA,
    HYPERSPACE_DELAY,
    BASE_SHIP_PROJECTILE_SPEED,
    MIN_SHIP_PROJECTILE_SPEED,
    MAX_SHIP_PROJECTILE_SPEED,
    QUEUE_PRIORITIES,
    HYPERSPACE_COOLDOWN,
    SHIP_POWERUP_DURATION,
    SHIP_POWERUP_PROJECTILE_SPEED_MULTIPLIER,
    SHIP_PROJECTILE_ENABLE_TANGENTIAL_VELOCITY,
    SHIP_FIRE_COOLDOWN,
    SHIP_POWERUP_RECOIL_MULTIPLER
} from "./constants";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";
import { DynamicGameObject, random, CoreGameObjectParams, Vec2, IGameObjectDisplay } from "./engine";
import { DEG_TO_RAD } from "@pixi/math";
import { Projectile } from "./Projectile";

const HYPERSPACE_COOLDOWN_MS = HYPERSPACE_COOLDOWN * 1000;
const FIRE_COOLDOWN_MS = SHIP_FIRE_COOLDOWN * 1000;

export interface ShipDestroyOptions {
    hit: boolean;
}

export interface IShipDisplay extends IGameObjectDisplay<ShipDestroyOptions> {
    onHyperspace(): void;
    onPowerupStart(): void;
    onPowerupEnd(): void;
}

export class Ship extends DynamicGameObject<GameState, ShipDestroyOptions, GameEvents> {
    override display?: IShipDisplay;
    accelerationAmount: number;
    rotationAmount: number;
    private _invulnerableRemaining!: number;
    private _hyperspaceCountdown: number;
    private _lastHyperspaceTime: number;
    private _lastFireTime: number;
    private _powerupRemaining: number;

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
        this._lastFireTime = 0;
        this.rotationAmount = 0;
        this.invulnerable = params.invulnerable;
        this._powerupRemaining = 0;
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
                this.display?.onHyperspace();
            }
            this._hyperspaceCountdown = Math.max(0, this._hyperspaceCountdown - elapsed);
        }

        if (this._invulnerableRemaining) {
            this._invulnerableRemaining = Math.max(0, this._invulnerableRemaining - elapsed);
        }

        if (this._powerupRemaining) {
            this._powerupRemaining = Math.max(0, this._powerupRemaining - elapsed);
            if (this._powerupRemaining === 0) {
                this.display?.onPowerupEnd();
            }
        }

        this.maxRotationSpeed = Math.abs(this.rotationAmount) * MAX_ROTATION_SPEED;
        this.rotationAcceleration = Math.sign(this.rotationAmount) * ROTATION_ACCELERATION;
        this.acceleration = this.accelerationAmount * ACCELERATION;

        super.tick(timestamp, elapsed);
    }

    override destroy(options: ShipDestroyOptions): void {
        super.destroy(options);
        this.events.trigger("shipDestroyed", this, options.hit);
    }

    fire(): void {
        if (!this._powerupRemaining && this.state.timestamp - this._lastFireTime < FIRE_COOLDOWN_MS) {
            return;
        }
        const velocity = { ...this.velocity };
        // Add tangential velocity from rotation
        if (SHIP_PROJECTILE_ENABLE_TANGENTIAL_VELOCITY) {
            velocity.x += this.rotationSpeed * 36 * this.cosRotation;
            velocity.y += this.rotationSpeed * 36 * this.sinRotation;
        }
        // Add base velocity
        const baseSpeed = this._powerupRemaining
            ? BASE_SHIP_PROJECTILE_SPEED * SHIP_POWERUP_PROJECTILE_SPEED_MULTIPLIER
            : BASE_SHIP_PROJECTILE_SPEED;
        velocity.x += baseSpeed * this.sinRotation;
        velocity.y -= baseSpeed * this.cosRotation;
        // Clamp speed between MAX_SHIP_PROJECTILE_SPEED and MIN_SHIP_PROJECTILE_SPEED
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        if (speed > MAX_SHIP_PROJECTILE_SPEED) {
            velocity.x -= (speed - MAX_SHIP_PROJECTILE_SPEED) * (velocity.x / speed);
            velocity.y -= (speed - MAX_SHIP_PROJECTILE_SPEED) * (velocity.y / speed);
        } else if (speed < MIN_SHIP_PROJECTILE_SPEED) {
            velocity.x += (MIN_SHIP_PROJECTILE_SPEED - speed) * (velocity.x / speed);
            velocity.y += (MIN_SHIP_PROJECTILE_SPEED - speed) * (velocity.y / speed);
        }

        this.events.trigger("projectileCreated", new Projectile({
            events: this.events,
            state: this.state,
            queue: this.queue,
            worldSize: this.worldSize,
            position: {
                x: this.x + 36 * this.sinRotation,
                y: this.y - 36 * this.cosRotation,
            },
            rotation: this.rotation,
            velocity,
            from: this,
        }));

        // Add recoil
        const recoil = this._powerupRemaining ? RECOIL * SHIP_POWERUP_RECOIL_MULTIPLER : RECOIL;
        this.velocity.x -= recoil * this.sinRotation;
        this.velocity.y += recoil * this.cosRotation;
        const overSpeed = this.speed - this.maxSpeed;
        if (overSpeed > 0) {
            this.velocity.x -= overSpeed * (this.velocity.x / speed);
            this.velocity.y -= overSpeed * (this.velocity.y / speed);
        }
        this._lastFireTime = this.state.timestamp;
    }

    hyperspace(): void {
        if (this.state.timestamp - this._lastHyperspaceTime >= HYPERSPACE_COOLDOWN_MS) {
            this._hyperspaceCountdown = HYPERSPACE_DELAY;
            this._lastHyperspaceTime = this.state.timestamp;
        }
    }

    get invulnerable(): boolean {
        return this._invulnerableRemaining > 0 || this._hyperspaceCountdown > 0;
    }

    set invulnerable(invulnerable: boolean) {
        this._invulnerableRemaining = invulnerable ? INVULNERABLE_TIME : 0;
    }

    get hyperspaceCountdown(): number {
        return this._hyperspaceCountdown;
    }

    get invulnerableRemaining(): number {
        return this._invulnerableRemaining;
    }

    get lastHyperspaceTime(): number {
        return this._lastHyperspaceTime;
    }

    get lastFireTime(): number {
        return this._lastFireTime;
    }

    startPowerup(): void {
        this._powerupRemaining = SHIP_POWERUP_DURATION;
        this.display?.onPowerupStart();
    }

    get powerupRemaining(): number {
        return this._powerupRemaining;
    }
}
