import { Container, IDestroyOptions } from "@pixi/display";
import anime from "animejs";
import { Tickable, TickQueue } from "../../core/engine";

export abstract class OneShotAnimation extends Container implements Tickable {
    protected readonly timeline: anime.AnimeTimelineInstance;
    protected readonly queue: TickQueue;

    constructor(queue: TickQueue, defaultAnimeParams?: anime.AnimeParams) {
        super();
        this.timeline = anime.timeline({
            ...defaultAnimeParams,
            autoplay: false
        });
        this.queue = queue;
        this.queue.add(100, this);
    }

    tick(timestamp: number, elapsed: number) {
        this.timeline.tick(timestamp);
        if (this.completed) {
            this.destroy({ children: true });
        }
    }

    get completed(): boolean {
        return this.timeline.completed;
    }

    override destroy(options?: boolean | IDestroyOptions): void {
        super.destroy(options);
        this.queue.remove(100, this);
    }
}
