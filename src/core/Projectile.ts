import { PROJECTILE_LIFETIME, QUEUE_PRIORITIES } from "./constants";
import { CoreGameObjectParams, GameObject, IGameObjectDisplay, Vec2 } from "./engine";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";

export type IProjectileDisplay = IGameObjectDisplay;

export class Projectile extends GameObject<GameState, GameEvents> {
    override display?: IProjectileDisplay;
    private _traveled: number;
    private _from: Readonly<GameObject<any, any>>;

    constructor(params: CoreGameObjectParams<GameState, GameEvents> & {
        position: Vec2,
        from: Readonly<GameObject<any, any>>,
        speed: number,
        rotation: number,
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
    }

    override tick(timestamp: number, elapsed: number): void {
        super.tick(timestamp, elapsed);
        this._traveled += Math.abs(Math.sqrt((this.velocity.x * elapsed) ** 2 + (this.velocity.y * elapsed) ** 2));
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

    get traveled(): number {
        return this._traveled;
    }
}
