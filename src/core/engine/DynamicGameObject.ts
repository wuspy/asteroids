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

export abstract class DynamicGameObject<State = any, DestroyOptions = any, Events extends EventMap<keyof Events> = object> extends GameObject<State, DestroyOptions, Events> {
    acceleration: number;
    rotationAcceleration: number;
    maxSpeed: number;
    maxRotationSpeed: number;
    friction: number;
    rotationFriction: number;

    constructor(params: DynamicGameObjectParams<State, Events>) {
        super(params);
        this.maxSpeed = params.maxSpeed;
        this.maxRotationSpeed = params.maxRotationSpeed;
        this.acceleration = params.acceleration || 0;
        this.rotationAcceleration = params.rotationAcceleration || 0;
        this.friction = params.friction;
        this.rotationFriction = params.rotationFriction;
    }

    override tick(timestamp: number, elapsed: number): void {
        // Add rotation

        if (this.rotationAcceleration) {
            this.rotationSpeed = clamp(this.rotationSpeed + this.rotationAcceleration * elapsed, this.maxRotationSpeed);
        } else if (this.rotationSpeed > 0) {
            this.rotationSpeed = Math.max(0, this.rotationSpeed - this.rotationFriction * elapsed);
        } else if (this.rotationSpeed < 0) {
            this.rotationSpeed = Math.min(0, this.rotationSpeed + this.rotationFriction * elapsed);
        }

        // Add acceleration

        // TODO find a way to clamp maxSpeed without comparing every tick
        if (this.acceleration && this.speedAtRotation < this.maxSpeed) {
            this.velocity.x += this.acceleration * elapsed * Math.sin(this.rotation);
            this.velocity.y += this.acceleration * elapsed * -Math.cos(this.rotation);
        }

        // Add friction

        const heading = this.heading;
        if (this.velocity.x > 0) {
            this.velocity.x = Math.max(0, this.velocity.x - this.friction * elapsed * Math.sin(heading));
        } else if (this.velocity.x < 0) {
            this.velocity.x = Math.min(0, this.velocity.x - this.friction * elapsed * Math.sin(heading));
        }
        if (this.velocity.y > 0) {
            this.velocity.y = Math.max(0, this.velocity.y + this.friction * elapsed * Math.cos(heading));
        } else if (this.velocity.y < 0) {
            this.velocity.y = Math.min(0, this.velocity.y + this.friction * elapsed * Math.cos(heading));
        }

        super.tick(timestamp, elapsed);
    }
}
