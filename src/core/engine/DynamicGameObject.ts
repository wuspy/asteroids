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
        if (this.acceleration) {
            this.velocity.x += this.acceleration * elapsed * this.sinRotation;
            this.velocity.y -= this.acceleration * elapsed * this.cosRotation;
        }

        if (this.velocity.x || this.velocity.y) {
            let speed = this.speed;

            // Add friction
            const elapsedFriction = this.friction * elapsed;
            if (this.velocity.x > 0) {
                this.velocity.x = Math.max(0, this.velocity.x - elapsedFriction * (this.velocity.x / speed));
            } else if (this.velocity.x < 0) {
                this.velocity.x = Math.min(0, this.velocity.x - elapsedFriction * (this.velocity.x / speed));
            }
            if (this.velocity.y > 0) {
                this.velocity.y = Math.max(0, this.velocity.y - elapsedFriction * (this.velocity.y / speed));
            } else if (this.velocity.y < 0) {
                this.velocity.y = Math.min(0, this.velocity.y - elapsedFriction * (this.velocity.y / speed));
            }

            // Limit speed
            speed -= elapsedFriction;
            const overSpeed = speed - this.maxSpeed;
            if (overSpeed > 0) {
                this.velocity.x -= overSpeed * (this.velocity.x / speed);
                this.velocity.y -= overSpeed * (this.velocity.y / speed);
            }
        }

        super.tick(timestamp, elapsed);
    }
}
