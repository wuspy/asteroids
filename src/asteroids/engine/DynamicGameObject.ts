import { GameObject, GameObjectParams } from "./GameObject";
import { EventMap } from "./EventManager";
import { clamp } from "./math";

export interface DynamicGameObjectParams<State, Events extends EventMap<keyof Events>> extends GameObjectParams<State, Events> {
    acceleration?: number;
    rotationAcceleration?: number;
    friction: number;
    rotationFriction: number;
    maxSpeed: number;
    maxRotationSpeed: number;
}

export abstract class DynamicGameObject<State, Events extends EventMap<keyof Events>> extends GameObject<State, Events> {
    private _acceleration: number;
    private _rotationAcceleration: number;
    private _maxSpeed: number;
    private _maxRotationSpeed: number;
    private _friction: number;
    private _rotationFriction: number;

    constructor(params: DynamicGameObjectParams<State, Events>) {
        super(params);
        this._maxSpeed = params.maxSpeed;
        this._maxRotationSpeed = params.maxRotationSpeed;
        this._acceleration = params.acceleration || 0;
        this._rotationAcceleration = params.rotationAcceleration || 0;
        this._friction = params.friction;
        this._rotationFriction = params.rotationFriction;
    }

    override tick(timestamp: number, elapsed: number): void {
        // Add rotation

        if (this._rotationAcceleration) {
            this.rotationSpeed = clamp(this.rotationSpeed + this._rotationAcceleration * elapsed, this._maxRotationSpeed);
        } else if (this.rotationSpeed > 0) {
            this.rotationSpeed = Math.max(0, this.rotationSpeed - this._rotationFriction * elapsed);
        } else if (this.rotationSpeed < 0) {
            this.rotationSpeed = Math.min(0, this.rotationSpeed + this._rotationFriction * elapsed);
        }

        // Add acceleration

        // TODO find a way to clamp maxSpeed without comparing every tick
        if (this._acceleration && this.speedAtRotation < this._maxSpeed) {
            this.velocity.x += this._acceleration * elapsed * Math.sin(this.rotation);
            this.velocity.y += this._acceleration * elapsed * -Math.cos(this.rotation);
        }

        // Add friction

        const heading = this.heading;
        if (this.velocity.x > 0) {
            this.velocity.x = Math.max(0, this.velocity.x - this._friction * elapsed * Math.sin(heading));
        } else if (this.velocity.x < 0) {
            this.velocity.x = Math.min(0, this.velocity.x - this._friction * elapsed * Math.sin(heading));
        }
        if (this.velocity.y > 0) {
            this.velocity.y = Math.max(0, this.velocity.y + this._friction * elapsed * Math.cos(heading));
        } else if (this.velocity.y < 0) {
            this.velocity.y = Math.min(0, this.velocity.y + this._friction * elapsed * Math.cos(heading));
        }

        super.tick(timestamp, elapsed);
    }

    get acceleration(): number {
        return this._acceleration;
    }

    set acceleration(acceleration: number) {
        this._acceleration = acceleration;
    }

    get rotationAcceleration(): number {
        return this._rotationAcceleration;
    }

    set rotationAcceleration(acceleration: number) {
        this._rotationAcceleration = acceleration;
    }

    get maxSpeed(): number {
        return this._maxSpeed;
    }

    set maxSpeed(maxSpeed: number) {
        this._maxSpeed = maxSpeed;
    }

    get maxRotationSpeed(): number {
        return this._maxRotationSpeed;
    }

    set maxRotationSpeed(maxRotationSpeed: number) {
        this._maxRotationSpeed = maxRotationSpeed;
    }

    get friction(): number {
        return this._friction;
    }

    set friction(friction: number) {
        this._friction = friction;
    }

    get rotationFriction(): number {
        return this._rotationFriction;
    }

    set rotationFriction(rotationFriction: number) {
        this._rotationFriction = rotationFriction;
    }
}
