import anime from "animejs";
import { TickableContainer } from "./TickableContainer";
import { TickQueue } from "./TickQueue";

export abstract class OneShotAnimation extends TickableContainer {
    protected readonly timeline: anime.AnimeTimelineInstance;

    constructor(params: {
        queue: TickQueue,
        queuePriority?: number,
        defaultAnimeParams?: anime.AnimeParams,
    }) {
        super(params.queue, params.queuePriority);
        this.timeline = anime.timeline({
            ...params.defaultAnimeParams,
            autoplay: false
        });
    }

    tick(timestamp: number, elapsed: number) {
        this.timeline.tick(timestamp);
        if (this.completed) {
            this.destroy();
        }
    }

    get completed(): boolean {
        return this.timeline.completed;
    }
}
