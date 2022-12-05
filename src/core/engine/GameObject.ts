import {
    Rectangle,
    IPointData,
    ISize,
    Polygon,
    ObservablePoint,
    PI_2
} from "@pixi/math";
import {
    HitArea,
    pointsCoincident,
    Vec2,
    atan2,
} from "./math";
import { EventManager, EventMap } from "./EventManager";
import { Tickable, TickQueue } from "./TickQueue";
import { RandomFn } from "./random";

export const enum WrapMode {
    None = 0,
    Vertical = 0b01,
    Horizontal = 0b10,
    Both = WrapMode.Vertical | WrapMode.Horizontal
}

export interface GameObjectParams<State, Events extends EventMap<keyof Events>> {
    state: Readonly<State>;
    events: EventManager<Events>,
    queue: TickQueue;
    queuePriority: number;
    worldSize: ISize;
    random: RandomFn;
    hitArea: HitArea;
    wrapMode?: WrapMode;
    position?: Vec2;
    rotation?: number;
    velocity?: Vec2;
    rotationSpeed?: number;
}

export interface GameObjectObserver<DestroyOptions> extends Tickable {
    onDestroy(options: DestroyOptions): void;
    position: ObservablePoint;
    set rotation(rotation: number);
}

export type CoreGameObjectParams<State, Events extends EventMap<keyof Events>> =
    Pick<
        GameObjectParams<State, Events>,
        | "state"
        | "events"
        | "queue"
        | "queue"
        | "worldSize"
        | "random"
    >;

export abstract class GameObject<State = any, DestroyOptions = any, Events extends EventMap<keyof Events> = object> {
    observer?: GameObjectObserver<DestroyOptions>;
    readonly state: Readonly<State>;
    readonly events: EventManager<Events>
    readonly queue: TickQueue;
    readonly queuePriority: number;
    readonly worldSize: Readonly<ISize>;
    readonly position: ObservablePoint;
    readonly velocity: Vec2;
    protected readonly _random: RandomFn;
    wrapMode: WrapMode;
    rotationSpeed: number;
    private _rotation: number;
    private _sinRotation: number;
    private _cosRotation: number;
    private _boundingBox!: Rectangle;
    private _hitArea!: HitArea;
    private readonly _hitAreaPosition: IPointData;
    private _hitAreaRotation: number;
    private _ignoreNextPositionChange: boolean;

    constructor(params: GameObjectParams<State, Events>) {
        this.state = params.state;
        this.events = params.events;
        this.queue = params.queue;
        this.queuePriority = params.queuePriority;
        this.worldSize = params.worldSize;
        this._random = params.random;
        this._ignoreNextPositionChange = false;
        this.position = new ObservablePoint(this.onPositionChange, this, params.position?.x || 0, params.position?.y || 0);
        this.wrapMode = params.wrapMode ?? WrapMode.Both;
        this._rotation = params.rotation ?? 0;
        this._sinRotation = Math.sin(this._rotation);
        this._cosRotation = Math.cos(this._rotation);
        this.velocity = { x: params.velocity?.x || 0, y: params.velocity?.y || 0 };
        this.rotationSpeed = params.rotationSpeed || 0;
        this._hitAreaPosition = { x: 0, y: 0 };
        this._hitAreaRotation = 0;
        this.hitArea = params.hitArea;
        this.queue.add(this.queuePriority, this);
    }

    tick(timestamp: number, elapsed: number) {
        if (this.rotationSpeed) {
            this.rotate(this.rotationSpeed * elapsed);
        }
        if (this.velocity.x || this.velocity.y) {
            this.translate(this.velocity.x * elapsed, this.velocity.y * elapsed);
        }
        this.observer?.tick(timestamp, elapsed);
    }

    // Returns true if this object's hitarea collides with another
    collidesWith(other: GameObject<any, any, any>): boolean {
        // Fast collision detection using bounding box
        if (this._boundingBox.intersects(other._boundingBox)) {
            // Slow(er) collision detection using hitarea
            if (typeof (this._hitArea) === "number" && typeof (other._hitArea) === "number") {
                return pointsCoincident(this.position, other.position, this._hitArea + other._hitArea);
            } else if (typeof (this._hitArea) === "number") {
                return (other._hitArea as Polygon).contains2(this.position, other.position, this._hitArea);
            } else if (typeof (other._hitArea) === "number") {
                return (this._hitArea as Polygon).contains2(other.position, this.position, other._hitArea);
            } else {
                return this._hitArea.intersects(other._hitArea);
            }
        }
        return false;
    }

    destroy(options: DestroyOptions) {
        if (this.observer) {
            this.observer.onDestroy(options);
            this.observer = undefined;
        }
        this.events.offThis(this);
        this.queue.remove(this.queuePriority, this);
    }

    get x(): number {
        return this.position.x;
    }

    get y(): number {
        return this.position.y;
    }

    get rotation(): number {
        return this._rotation;
    }

    set rotation(angle: number) {
        this._rotation = angle % PI_2;
        this._sinRotation = Math.sin(this._rotation);
        this._cosRotation = Math.cos(this._rotation);
        this.updateHitarea();
        this.observer && (this.observer.rotation = this._rotation);
    }

    get sinRotation(): number {
        return this._sinRotation;
    }

    get cosRotation(): number {
        return this._cosRotation;
    }

    translate(dX: number, dY: number): void {
        this.position.set(
            this.x + dX,
            this.y + dY,
        );
    }

    rotate(delta: number): void {
        this.rotation += delta;
    }

    get boundingBox(): Readonly<Rectangle> {
        return this._boundingBox!;
    }

    get hitArea(): HitArea {
        return this._hitArea;
    }

    protected set hitArea(hitArea: HitArea) {
        if (typeof (hitArea) === "object") {
            this._hitArea = hitArea.clone();
            this._boundingBox = hitArea.getBoundingBox();
        } else {
            this._hitArea = hitArea;
            this._boundingBox = new Rectangle(
                this.x - this._hitArea,
                this.y - this._hitArea,
                this._hitArea * 2,
                this._hitArea * 2,
            );
        }
        this._hitAreaPosition.x = this._hitAreaPosition.y = this._hitAreaRotation = 0;
        this.updateHitarea();
    }

    get heading(): number {
        return atan2(this.velocity.y, this.velocity.x);
    }

    get speed(): number {
        return Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    }

    get speedAtRotation(): number {
        return this.velocity.x * this.sinRotation - this.velocity.y * this.cosRotation;
    }

    stop() {
        this.velocity.x = this.velocity.y = 0;
        this.rotationSpeed = 0;
    }

    protected onPositionChange(): void {
        if (this._ignoreNextPositionChange) {
            this._ignoreNextPositionChange = false;
            return;
        }
        if (this.wrapMode) {
            let x = this.x, y = this.y;

            if ((this.wrapMode & WrapMode.Horizontal) && (x < 0 || x > this.worldSize.width)) {
                const margin = this._boundingBox.width / 2;
                const width = this.worldSize.width + this._boundingBox.width;
                x = (this.x + margin) % width - margin;
                if (x < -margin) {
                    x += width;
                }
            }

            if ((this.wrapMode & WrapMode.Vertical) && (y < 0 || y > this.worldSize.height)) {
                const margin = this._boundingBox.height / 2;
                const height = this.worldSize.height + this._boundingBox.height;
                y = (this.y + margin) % height - margin;
                if (y < -margin) {
                    y += height;
                }
            }

            if (x !== this.x || y !== this.y) {
                this._ignoreNextPositionChange = true;
                this.position.set(x, y);
            }
        }
        this.updateHitarea();
        this.observer?.position.copyFrom(this.position);
    }

    /**
     * Update hitArea and boundingBox to match the transform of this GameObject
     */
    private updateHitarea(): void {
        if (typeof (this._hitArea) === "object") {
            if (this._rotation !== this._hitAreaRotation) {
                this._hitArea
                    .translate(-this._hitAreaPosition.x, -this._hitAreaPosition.y)
                    .rotate(this._rotation - this._hitAreaRotation);
                this._hitArea.getBoundingBox(this._boundingBox);
                this._hitAreaPosition.x = this._hitAreaPosition.y = 0;
                this._hitAreaRotation = this._rotation;
            }
            if (!this.position.equals(this._hitAreaPosition)) {
                const dx = this.x - this._hitAreaPosition.x;
                const dy = this.y - this._hitAreaPosition.y;
                this._hitArea.translate(dx, dy);
                this._boundingBox.translate(dx, dy);
                this._hitAreaPosition.x = this.x;
                this._hitAreaPosition.y = this.y;
            }
        } else if (!this.position.equals(this._hitAreaPosition)) {
            this._boundingBox.x = this.x - this._hitArea;
            this._boundingBox.y = this.y - this._hitArea;
            this._hitAreaPosition.x = this.x;
            this._hitAreaPosition.y = this.y;
        }
    }
}
