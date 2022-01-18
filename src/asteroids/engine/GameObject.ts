import {
    Rectangle,
    IPointData,
    ISize,
    Polygon,
    ObservablePoint,
    PI_2
} from "@pixi/math";
import {
    getPolygonBoundingBox,
    HitArea,
    pointsCoincident,
    polygonContainsPoint,
    polygonsIntersects,
    rectanglesIntersect,
    rotatePolygon,
    translatePolygon,
    translateRectangle,
    Vec2,
    atan2
} from "./math";
import { EventManager, EventMap } from "./EventManager";
import { Container } from "@pixi/display";
import { TickQueue } from "./TickQueue";

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
    hitArea: HitArea;
    wrapMode?: WrapMode;
    position?: Vec2;
    rotation?: number;
    velocity?: Vec2;
    rotationSpeed?: number;
}

export type CoreGameObjectParams<State, Events extends EventMap<keyof Events>> =
    Pick<
        GameObjectParams<State, Events>,
        | "state"
        | "events"
        | "queue"
        | "queue"
        | "worldSize"
    >

export abstract class GameObject<State, Events extends EventMap<keyof Events>> {
    protected readonly state: Readonly<State>;
    protected readonly events: EventManager<Events>
    protected readonly queue: TickQueue;
    protected readonly queuePriority: number;
    protected readonly worldSize: ISize;
    private readonly _container: Container;
    private readonly _position: ObservablePoint;
    private _wrapMode: WrapMode;
    private _rotation: number;
    private _velocity: Vec2;
    private _rotationSpeed: number;
    private _boundingBox: Rectangle;
    private _hitArea: HitArea;
    private _hitAreaPosition: IPointData;
    private _hitAreaRotation: number;
    private _ignoreNextPositionChange: boolean;

    constructor(params: GameObjectParams<State, Events>) {
        this.state = params.state;
        this.events = params.events;
        this.queue = params.queue;
        this.queuePriority = params.queuePriority;
        this.worldSize = params.worldSize;
        this._position = new ObservablePoint(this.onPositionChange, this, params.position?.x || 0, params.position?.y || 0);
        this._wrapMode = params.wrapMode ?? WrapMode.Both;
        this._rotation = params.rotation ?? 0;
        this._velocity = { x: params.velocity?.x || 0, y: params.velocity?.y || 0 };
        this._rotationSpeed = params.rotationSpeed || 0;
        this._hitArea = params.hitArea;
        this._hitAreaPosition = { x: 0, y: 0 };
        this._hitAreaRotation = 0;
        this._ignoreNextPositionChange = false;
        if (typeof (this._hitArea) === "object") {
            this._boundingBox = getPolygonBoundingBox(this._hitArea);
        } else {
            this._boundingBox = new Rectangle(
                this.x - this._hitArea,
                this.y - this._hitArea,
                this._hitArea * 2,
                this._hitArea * 2,
            );
        }
        this._container = new Container();
        this._container.position.copyFrom(this._position);
        this._container.rotation = this._rotation;
        this.queue.add(this.queuePriority, this);
    }

    tick(timestamp: number, elapsed: number) {
        if (this._rotationSpeed) {
            this.rotate(this._rotationSpeed * elapsed);
        }
        if (this._velocity.x || this._velocity.y) {
            this.translate(this._velocity.x * elapsed, this._velocity.y * elapsed);
        }
    }

    // Returns true if this object's hitarea collides with another
    collidesWith(other: GameObject<any, any>): boolean {
        // Fast collision detection using bounding box
        if (rectanglesIntersect(this.boundingBox, other.boundingBox)) {
            // Slow(er) collision detection using hitarea
            const [thisIsPoint, otherIsPoint] = [typeof (this._hitArea) === "number", typeof (other._hitArea) === "number"];
            if (thisIsPoint || otherIsPoint) {
                if (thisIsPoint && otherIsPoint) {
                    return pointsCoincident(this._position, other._position, (this._hitArea as number) + (other._hitArea as number));
                } else {
                    const objWithHitbox = thisIsPoint ? other : this;
                    const objWithPoint = otherIsPoint ? other : this;
                    return polygonContainsPoint(
                        objWithHitbox._hitArea as Polygon,
                        objWithPoint._position,
                        objWithHitbox._position,
                        objWithPoint._hitArea as number
                    );
                }
            } else {
                return polygonsIntersects(this._hitArea as Polygon, other._hitArea as Polygon);
            }
        }
        return false;
    }

    destroy() {
        this.container.destroy();
        this.events.offThis(this);
        this.queue.remove(this.queuePriority, this);
    }

    get container(): Container {
       return this._container; 
    }

    get x(): number {
        return this._position.x;
    }

    get y(): number {
        return this._position.y;
    }

    get position(): ObservablePoint {
        return this._position;
    }

    get rotation(): number {
        return this._rotation;
    }

    set rotation(angle: number) {
        this._rotation = angle;
        this.container.rotation = angle % PI_2;
    }

    translate(dX: number, dY: number): void {
        this._position.set(
            this.x + dX,
            this.y + dY,
        );
    }

    rotate(delta: number): void {
        this.rotation += delta;
    }

    get boundingBox(): Readonly<Rectangle> {
        this.updateHitarea();
        return this._boundingBox!;
    }

    get hitArea(): HitArea {
        this.updateHitarea();
        return this._hitArea;
    }

    protected set hitArea(hitArea: HitArea) {
        this._hitArea = hitArea;
        this._hitAreaPosition.x = this._hitAreaPosition.y = this._hitAreaRotation = 0;
    }

    get velocity(): Vec2 {
        return this._velocity;
    }

    set velocity(velocity: Vec2) {
        this._velocity.x = velocity.x;
        this._velocity.y = velocity.y;
    }

    get heading(): number {
        return atan2(this.velocity.y, this.velocity.x)
    }

    get speed(): number {
        return Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    }

    get speedAtRotation(): number {
        return this.speed * Math.cos(this.rotation - this.heading)
    }

    stop() {
        this._velocity.x = this._velocity.y = 0;
        this._rotationSpeed = 0;
    }

    get rotationSpeed(): number {
        return this._rotationSpeed;
    }

    set rotationSpeed(rotationSpeed: number) {
        this._rotationSpeed = rotationSpeed;
    }

    protected onPositionChange(): void {
        if (this._ignoreNextPositionChange) {
            return;
        }
        if (this._wrapMode) {
            let x, y;
            const margin = {
                width: this._boundingBox.width / 2,
                height: this._boundingBox.height / 2,
            };

            if (this._wrapMode & WrapMode.Horizontal) {
                const width = this.worldSize.width + margin.width * 2;
                x = (this.x + margin.width) % width - margin.width;
                if (x < -margin.width) {
                    x += width;
                }
            } else {
                x = this.x;
            }

            if (this._wrapMode & WrapMode.Vertical) {
                const height = this.worldSize.height + margin.height * 2;
                y = (this.y + margin.height) % height - margin.height;
                if (y < -margin.height) {
                    y += height;
                }
            } else {
                y = this.y;
            }

            if (x !== this.x || y !== this.y) {
                this._ignoreNextPositionChange = true;
                this._position.set(x, y);
                this._ignoreNextPositionChange = false;
            }
        }
        this.container.position.copyFrom(this._position);
    }

    /**
     * Update hitArea and boundingBox to match the transform of this GameObject
     */
    private updateHitarea(): void {
        if (typeof (this._hitArea) === "object") {
            if (this._rotation !== this._hitAreaRotation) {
                this._hitArea = rotatePolygon(
                    translatePolygon(
                        this._hitArea,
                        { x: -this._hitAreaPosition.x, y: -this._hitAreaPosition.y },
                    ),
                    this._rotation - this._hitAreaRotation
                );
                this._boundingBox = getPolygonBoundingBox(this._hitArea);
                this._hitAreaPosition.x = this._hitAreaPosition.y = 0;
                this._hitAreaRotation = this._rotation;
            }
            if (!this._position.equals(this._hitAreaPosition)) {
                const delta = {
                    x: this.x - this._hitAreaPosition.x,
                    y: this.y - this._hitAreaPosition.y,
                };
                this._hitArea = translatePolygon(this._hitArea, delta);
                this._boundingBox = translateRectangle(this._boundingBox, delta);
                this._hitAreaPosition.x = this.x;
                this._hitAreaPosition.y = this.y;
            }
        } else if (!this.position.equals(this._hitAreaPosition)) {
            this._boundingBox.x = this.x - this._hitArea;
            this._boundingBox.y = this.y - this._hitArea;
            this._boundingBox.width = this._boundingBox.height = this._hitArea * 2;
            this._hitAreaPosition.x = this.x;
            this._hitAreaPosition.y = this.y;
        }
    }
}
