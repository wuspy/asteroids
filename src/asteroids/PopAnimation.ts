import { Container } from "@pixi/display";
import { QUEUE_PRIORITIES } from "./constants";
import { OneShotAnimation, TickQueue } from "./engine";

export class PopAnimation extends OneShotAnimation {
    constructor(params: {
        queue: TickQueue,
        target: Container,
        scale: number,
    }) {
        super({
            ...params,
            queuePriority: QUEUE_PRIORITIES.animation,
            defaultAnimeParams: ({
                duration: 250,
                easing: "linear",
            })
        });

        this.addChild(params.target);
        this.timeline.add({
            targets: params.target,
            alpha: 0,
        }, 0).add({
            targets: params.target.scale,
            x: params.scale,
            y: params.scale,
        }, 0);
    }
}
