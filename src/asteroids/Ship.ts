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
    QUEUE_PRIORITIES
} from "./constants";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";
import { DynamicGameObject, random, findUnoccupiedPosition, CoreGameObjectParams, Vec2 } from "./engine";
import { IPointData, DEG_TO_RAD, Rectangle } from "@pixi/math";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Container } from "@pixi/display";
import { BlurFilter } from "@pixi/filter-blur";
import { LINE_JOIN } from "@pixi/graphics";
import { Projectile } from "./Projectile";
import '@pixi/mixin-cache-as-bitmap';
import { ShipSpawnAnimation } from "./ShipSpawnAnimation";
import { Explosion } from "./Explosion";

export class Ship extends DynamicGameObject<GameState, GameEvents> {
    private _ship: Graphics;
    private _fire: Graphics;
    private _shipShadow: Graphics;
    private _fireShadow: Graphics;
    private _accelerationAmount: number;
    private _rotationAmount: number;
    private _lastFireAnimation: number;
    private _invulnerableCountdown!: number;
    private _hyperspaceCountdown: number;

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
        this._accelerationAmount = 0;
        this._lastFireAnimation = 0;
        this._hyperspaceCountdown = 0;
        this._rotationAmount = 0;
        this.invulnerable = params.invulnerable;

        this._ship = Ship.createModel(this.state.theme.foregroundColor);
        this._fire = Ship.createFireModel();

        this._shipShadow = this._ship.clone();
        this._fireShadow = this._fire.clone();
        this._shipShadow.filters = [new BlurFilter()];
        this._fireShadow.filters = [new BlurFilter()];

        this._ship.cacheAsBitmap = true;
        this._fire.cacheAsBitmap = true;
        this.container.addChild(this._fireShadow, this._fire, this._shipShadow, this._ship);
        this.container.addChild(new ShipSpawnAnimation({
            color: this.state.theme.foregroundColor,
            diameter: 50,
            queue: this.queue,
        }).container);

        this.events.trigger("shipCreated", this);
    }

    static createModel(color: number, lineWidth = 3, height = 60): Graphics {
        const ship = new Graphics();
        const scale = height / 60;
        ship.lineStyle({
            width: lineWidth,
            color,
            alpha: 1,
            join: LINE_JOIN.BEVEL,
        });

        ship.moveTo(0, -30 * scale);
        ship.lineTo(20 * scale, 30 * scale);
        ship.lineTo(7 * scale, 16 * scale);
        ship.lineTo(-7 * scale, 16 * scale);
        ship.lineTo(-20 * scale, 30 * scale);
        ship.closePath();
        ship.moveTo(-15.335 * scale, 16 * scale);
        ship.arcTo(0, 0, 15.335 * scale, 16 * scale, 20 * scale);

        ship.lineStyle({ width: 0 });
        ship.beginFill(color, 1, true);
        ship.moveTo(15.335 * scale, 16 * scale);
        ship.lineTo(20 * scale, 30 * scale);
        ship.lineTo(7 * scale, 16 * scale);
        ship.lineTo(-7 * scale, 16 * scale);
        ship.lineTo(-20 * scale, 30 * scale);
        ship.lineTo(-15.335 * scale, 16 * scale);
        ship.arcTo(0, 0, 15.335 * scale, 16 * scale, 20 * scale);
        ship.endFill();
        return ship;
    }

    static createFireModel(): Graphics {
        const fire = new Graphics();

        fire.lineStyle({
            width: 3,
            color: 0xfa7850,
            alpha: 1,
            join: LINE_JOIN.BEVEL,
        });
        fire.moveTo(8, 16);
        fire.lineTo(0, 36);
        fire.lineTo(-8, 16);
        return fire;
    }

    override tick(timestamp: number, elapsed: number): void {
        if (this._hyperspaceCountdown) {
            if (this._hyperspaceCountdown >= HYPERSPACE_DELAY / 2 && this._hyperspaceCountdown - elapsed < HYPERSPACE_DELAY / 2) {
                // We're in the middle of the hyperspace delay, the ship is invisible, so find a new location and move the ship to it
                this.stop();
                this.rotation = random(0, 360, true) * DEG_TO_RAD;
                this.position.copyFrom(findUnoccupiedPosition({
                    bounds: new Rectangle(
                        this.boundingBox.width,
                        this.boundingBox.height,
                        this.worldSize.width - this.boundingBox.width * 2,
                        this.worldSize.height - this.boundingBox.height * 2,
                    ),
                    objectSize: this.boundingBox,
                    obstacles: [...this.state.asteroids, ...this.state.ufos].map((obstacle) => obstacle.boundingBox),
                    useSeededRandom: true,
                }));
                this.container.addChild(new ShipSpawnAnimation({
                    color: this.state.theme.foregroundColor,
                    diameter: 50,
                    queue: this.queue,
                }).container);
            }
            this._hyperspaceCountdown = Math.max(0, this._hyperspaceCountdown - elapsed);
        }

        if (this.invulnerable) {
            this._invulnerableCountdown = Math.max(0, this._invulnerableCountdown - elapsed);
        }

        this.maxRotationSpeed = Math.abs(this._rotationAmount) * MAX_ROTATION;
        this.rotationAcceleration = Math.sign(this._rotationAmount) * ROTATION_ACCELERATION;
        this.acceleration = this._accelerationAmount * ACCELERATION;

        super.tick(timestamp, elapsed);

        if (this._hyperspaceCountdown) {
            const progress = Math.abs(this._hyperspaceCountdown - HYPERSPACE_DELAY / 2) / (HYPERSPACE_DELAY / 2);
            this.container.alpha = progress;
            this.container.scale.set(progress / 2 + 0.5);
        } else if (this.invulnerable) {
            this.container.alpha = (this._invulnerableCountdown * 1000) % 150 > 75 ? 0.2 : 1;
        } else {
            this.container.alpha = 1;
        }
        if (this._accelerationAmount) {
            if (timestamp - this._lastFireAnimation > 100) {
                this._fire.visible = false;
                this._fireShadow.visible = false;
                this._lastFireAnimation = timestamp;
            } else if (timestamp - this._lastFireAnimation > 50) {
                this._fire.visible = true;
                this._fireShadow.visible = true;
            }
        } else {
            this._fire.visible = false;
            this._fireShadow.visible = false;
        }
    }

    override destroy(explode: boolean = false): void {
        if (explode && this.container.parent) {
            const explosion = new Explosion({
                queue: this.queue,
                diameter: 250,
                maxDuration: 3000,
                color: this.state.theme.foregroundColor,
            });
            explosion.container.position.copyFrom(this.position);
            explosion.container.rotation = this.rotation;
            this.container.parent.addChild(explosion.container);
        }
        super.destroy();
        this.events.trigger("shipDestroyed", this);
    }

    fire(): void {
        new Projectile({
            events: this.events,
            state: this.state,
            queue: this.queue,
            worldSize: this.worldSize,
            position: this.gunPosition,
            rotation: this.rotation,
            // Give projectiles a little boost if we're moving in the same direction
            speed: Math.max(SHIP_PROJECTILE_SPEED, SHIP_PROJECTILE_SPEED + this.speedAtRotation / 2),
            from: this,
            color: this.state.theme.foregroundColor,
        });
        // Add recoil
        if (this.speedAtRotation > -MAX_SPEED) {
            this.velocity.x -= RECOIL * Math.sin(this.rotation);
            this.velocity.y -= RECOIL * -Math.cos(this.rotation);
        }
    }

    hyperspace(): void {
        this._hyperspaceCountdown = HYPERSPACE_DELAY;
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

    get accelerationAmount(): number {
        return this._accelerationAmount;
    }

    set accelerationAmount(amount: number) {
        this._accelerationAmount = amount;
    }

    get rotationAmount(): number {
        return this._rotationAmount;
    }

    set rotationAmount(amount: number) {
        this._rotationAmount = amount;
    }
}
