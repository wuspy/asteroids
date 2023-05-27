import { Texture } from "@pixi/core";
import { IDestroyOptions } from "@pixi/display";
import { Sprite } from "@pixi/sprite";
import { TickQueue } from "@wuspy/asteroids-core";
import anime from "animejs";

export class PopAnimation extends Sprite {
    private readonly _timeline: anime.AnimeTimelineInstance;
    private readonly _queue: TickQueue;

    constructor({ queue, texture, scale, duration }: {
        queue: TickQueue,
        texture: Texture,
        scale: number,
        duration: number,
    }) {
        super(texture);
        this._queue = queue;

        this._timeline = anime.timeline({
            duration,
            easing: "linear",
            autoplay: false,
            complete: () => this.destroy(),
        }).add({
            targets: this,
            alpha: 0,
        }, 0).add({
            targets: this.scale,
            x: scale,
            y: scale,
        }, 0);

        queue.add(100, this._timeline.tick, this._timeline);
    }

    override destroy(options?: boolean | IDestroyOptions) {
        super.destroy(options);
        this._queue.remove(this._timeline.tick, this._timeline);
    }
}
