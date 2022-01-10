import anime from "animejs";
import { Tickable } from "./TickQueue";
import { Widget, WidgetParams } from "./Widget";

export interface OneShotAnimationParams extends WidgetParams {
    defaultAnimeParams?: anime.AnimeParams;
}

export type CoreOneShotAnimationParams = Pick<OneShotAnimationParams, "queue">;

export abstract class OneShotAnimation extends Widget implements Tickable {
    protected readonly timeline: anime.AnimeTimelineInstance;

    constructor(params: OneShotAnimationParams) {
        super(params);
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
