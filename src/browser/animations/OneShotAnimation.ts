import anime from "animejs";
import { TickQueue } from "../../core/engine";
import { TickableContainer } from "../ui";

export abstract class OneShotAnimation extends TickableContainer {
    protected readonly timeline: anime.AnimeTimelineInstance;

    constructor(params: {
        queue: TickQueue,
        defaultAnimeParams?: anime.AnimeParams,
    }) {
        super(params.queue, 100);
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
