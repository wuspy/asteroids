import { Container, IDestroyOptions } from "@pixi/display";
import { TickQueue, Tickable } from "@core/engine";

export abstract class TickableContainer extends Container implements Tickable {
    protected readonly queue: TickQueue;
    protected readonly queuePriority: number;

    constructor(queue: TickQueue, queuePriority = 0) {
        super();
        this.queue = queue;
        this.queuePriority = queuePriority;
        this.queue.add(this.queuePriority, this);
    }

    abstract tick(timestamp: number, elapsed: number): void;

    override destroy(options?: boolean | IDestroyOptions): void {
        super.destroy(options);
        this.queue.remove(this.queuePriority, this);
    }
}
