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
    HYPERSPACE_COOLDOWN
} from "./constants";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";
import { DynamicGameObject, random, CoreGameObjectParams, Vec2, IGameObjectDisplay, addVec2 } from "./engine";
import { DEG_TO_RAD } from "@pixi/math";
import { Projectile } from "./Projectile";

export interface ShipDestroyOptions {
    hit: boolean;
}

export interface IShipDisplay extends IGameObjectDisplay<ShipDestroyOptions> {
    onHyperspace(): void;
}

export class Ship extends DynamicGameObject<GameState, ShipDestroyOptions, GameEvents> {
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
                this.display?.onHyperspace();
            }
            this._hyperspaceCountdown = Math.max(0, this._hyperspaceCountdown - elapsed);
        }

        if (this.invulnerable) {
            this._invulnerableCountdown = Math.max(0, this._invulnerableCountdown - elapsed);
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
        const velocity = { ...this.velocity };
        // Add tangential velocity from rotation
        velocity.x += this.rotationSpeed * 36 * this.cosRotation;
        velocity.y += this.rotationSpeed * 36 * this.sinRotation;
        // Add base velocity
        velocity.x += BASE_SHIP_PROJECTILE_SPEED * this.sinRotation;
        velocity.y -= BASE_SHIP_PROJECTILE_SPEED * this.cosRotation;
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
        this.velocity.x -= RECOIL * this.sinRotation;
        this.velocity.y += RECOIL * this.cosRotation;
        const overSpeed = speed - this.maxSpeed;
        if (overSpeed > 0) {
            this.velocity.x -= overSpeed * (this.velocity.x / speed);
            this.velocity.y -= overSpeed * (this.velocity.y / speed);
        }
    }

    hyperspace(): void {
        if (this.state.timestamp - this._lastHyperspaceTime >= HYPERSPACE_COOLDOWN * 1000) {
            this._hyperspaceCountdown = HYPERSPACE_DELAY;
            this._lastHyperspaceTime = this.state.timestamp;
        }
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
