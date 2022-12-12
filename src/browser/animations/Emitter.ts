import { Container } from "@pixi/display";
import { Emitter as PixiEmitter, EmitterConfigV3 } from "@pixi/particle-emitter";
import { TickQueue } from "../../core/engine";

export interface EmitterOwner {
    x: number;
    y: number;
    rotation: number;
    destroyed: boolean;
}

export interface EmitterConfig extends Omit<EmitterConfigV3, "autoUpdate"> {
    queue: TickQueue;
    parent: Container;
    owner?: EmitterOwner;
    destroyWhenComplete?: boolean;
    destroyParent?: boolean;
}

export class Emitter extends PixiEmitter {
    destroyParent: boolean;
    owner?: EmitterOwner;
    protected readonly queue: TickQueue;

    constructor(config: EmitterConfig) {
        super(config.parent, config);
        this.autoUpdate = false;
        this._destroyWhenComplete = !!config.destroyWhenComplete;
        this.destroyParent = !!config.destroyParent;
        this.owner = config.owner;
        this.queue = config.queue;
        this.queue.add(101, this.tick, this);
        if (this.owner) {
            this.updateOwnerPos(this.owner.x, this.owner.y);
            this.rotate(this.owner.rotation);
        }
    }

    get destroyWhenComplete(): boolean {
        return this._destroyWhenComplete;
    }

    set destroyWhenComplete(destroyWhenComplete: boolean) {
        this._destroyWhenComplete = destroyWhenComplete;
    }

    tick(timestamp: number, elapsed: number) {
        if (this.owner) {
            if (this.owner.destroyed) {
                this._emit = false;
                this._destroyWhenComplete = true;
            } else {
                this.updateOwnerPos(this.owner.x, this.owner.y);
                this.rotate(this.owner.rotation);
            }
        }
        this.update(elapsed);
    }

    override destroy() {
        const parent = this.parent;
        super.destroy();
        this.queue.remove(this.tick, this);
        if (this.destroyParent && parent && !parent.destroyed) {
            parent.destroy({ children: true });
        }
    }
}
