import { ColorSource, Texture } from "@pixi/core";
import { IDestroyOptions } from "@pixi/display";
import { Sprite } from "@pixi/sprite";
import { TickQueue } from "@wuspy/asteroids-core";
import anime from "animejs";
import { UI_TICK_PRIORITY } from "../AppContext";

interface PopAnimationProps {
    queue: TickQueue;
    texture: Texture;
    scale: number;
    duration: number;
    tint?: ColorSource;
}

export class PopAnimation extends Sprite {
    private readonly _timeline: anime.AnimeTimelineInstance;
    private readonly _queue: TickQueue;

    constructor({ queue, texture, scale, duration, tint }: PopAnimationProps) {
        super(texture);
        this._queue = queue;
        if (tint !== undefined) {
            this.tint = tint;
        }

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

        this._queue.add(UI_TICK_PRIORITY, this._timeline.tick, this._timeline);
    }

    override destroy(options?: boolean | IDestroyOptions) {
        super.destroy(options);
        this._queue.remove(this._timeline.tick, this._timeline);
    }
}
