import { PROJECTILE_LIFETIME, QUEUE_PRIORITIES } from "./constants";
import { CoreGameObjectParams, GameObject, IGameObjectDisplay, Vec2 } from "./engine";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";

export interface ProjectileDestroyOptions {
    hit: boolean;
}

export type IProjectileDisplay = IGameObjectDisplay<ProjectileDestroyOptions>;

export class Projectile extends GameObject<GameState, ProjectileDestroyOptions, GameEvents> {
    private readonly _creationTime: number;
    override display?: IProjectileDisplay;
    private _traveled: number;
    private _from: GameObject;

    constructor(params: CoreGameObjectParams<GameState, GameEvents> & {
        position: Vec2,
        from: GameObject,
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
        this._creationTime = this.state.timestamp;
        this._traveled = 0;
        this._from = params.from;
    }

    override tick(timestamp: number, elapsed: number): void {
        super.tick(timestamp, elapsed);
        if (this.life >= PROJECTILE_LIFETIME) {
            this.destroy({ hit: false });
        }
    }

    override destroy(options: ProjectileDestroyOptions): void {
        super.destroy(options);
        this.events.trigger("projectileDestroyed", this, options.hit);
    }

    get from(): Readonly<GameObject<any, any>> {
        return this._from;
    }

    /**
     * Number of seconds that this projectile has existed
     */
    get life(): number {
        return (this.state.timestamp - this._creationTime) / 1000;
    }
}
