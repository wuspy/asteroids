import { Container } from "@pixi/display";
import { TickQueue, Tickable } from "./TickQueue";

export interface WidgetParams {
    queue: TickQueue;
    queuePriority: number;
}

export type CoreWidgetParams = Pick<WidgetParams, "queue">;

export abstract class Widget implements Tickable {
    protected readonly queue: TickQueue;
    protected readonly queuePriority: number;

    constructor(params: WidgetParams) {
        this.queue = params.queue;
        this.queuePriority = params.queuePriority;
        this.queue.add(this.queuePriority, this);
    }

    abstract tick(timestamp: number, elapsed: number): void;

    abstract get container(): Container;

    destroy(): void {
        if (!this.container.destroyed) {
            this.container.destroy();
        }
        this.queue.remove(this.queuePriority, this);
    }
}
