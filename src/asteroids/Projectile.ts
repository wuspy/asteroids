import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { PROJECTILE_LIFETIME, QUEUE_PRIORITIES } from "./constants";
import { CoreGameObjectParams, GameObject, Vec2 } from "./engine";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";
import { GlowFilter } from "@pixi/filter-glow";

const GEOMETRY = (() => {
    const graphics = new Graphics();
    graphics.beginFill(0xffffff, 1, true);
    // graphics.drawRect(0, 0, 4, 32);
    graphics.drawCircle(0, 0, 5);
    // graphics.arc(0, 0, 5, 165 * DEG_TO_RAD, 375 * DEG_TO_RAD);
    // graphics.moveTo()
    graphics.endFill();
    return graphics.geometry;
})();

export class Projectile extends GameObject<GameState, GameEvents> {
    private _traveled: number;
    private _sprite: Graphics;
    private _from: Readonly<GameObject<any, any>>;
    private _color: number;

    constructor(params: CoreGameObjectParams<GameState, GameEvents> & {
        position: Vec2,
        from: Readonly<GameObject<any, any>>,
        speed: number,
        rotation: number,
        color: number,
    }) {
        super({
            ...params,
            queuePriority: QUEUE_PRIORITIES.projectile,
            velocity: {
                x: params.speed * Math.sin(params.rotation),
                y: params.speed * -Math.cos(params.rotation),
            },
            hitArea: 6
        });
        this._traveled = 0;
        this._from = params.from;
        this._color = params.color;
        this._sprite = new Graphics(GEOMETRY);
        this._sprite.tint = this._color;
        this.container.addChild(this._sprite);
        this.events.trigger("projectileCreated", this);
    }

    override tick(timestamp: number, elapsed: number): void {
        super.tick(timestamp, elapsed);
        this._traveled += Math.abs(Math.sqrt((this.velocity.x * elapsed) ** 2 + (this.velocity.y * elapsed) ** 2));
        this._sprite.alpha = Math.min(1, (PROJECTILE_LIFETIME - this._traveled) / (PROJECTILE_LIFETIME * 0.2));
        if (this._traveled >= PROJECTILE_LIFETIME) {
            this.destroy();
        }
    }

    override destroy(): void {
        super.destroy();
        this.events.trigger("projectileDestroyed", this);
    }

    get from(): Readonly<GameObject<any, any>> {
        return this._from;
    }
}
