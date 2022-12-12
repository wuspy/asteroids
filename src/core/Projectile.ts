import { PROJECTILE_LIFETIME, QUEUE_PRIORITIES } from "./constants";
import { CoreGameObjectParams, GameObject, Vec2 } from "./engine";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";

export interface ProjectileDestroyOptions {
    hit: boolean;
}

export class Projectile extends GameObject<GameState, ProjectileDestroyOptions, GameEvents> {
    private readonly _creationTime: number;
    private _from: GameObject;

    constructor(params: CoreGameObjectParams<GameState, GameEvents> & {
        position: Vec2,
        rotation: number,
        velocity: Vec2,
        from: GameObject,
    }) {
        super({
            ...params,
            queuePriority: QUEUE_PRIORITIES.projectile,
            hitArea: 6
        });
        this._creationTime = this.state.timestamp;
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
