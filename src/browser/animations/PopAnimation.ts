import { Container } from "@pixi/display";
import { OneShotAnimation } from "./OneShotAnimation";
import { TickQueue } from "../../core/engine";

export class PopAnimation extends OneShotAnimation {
    constructor({ queue, target, scale, duration }: {
        queue: TickQueue,
        target: Container,
        scale: number,
        duration: number,
    }) {
        super(queue, { duration, easing: "linear" });

        this.addChild(target);
        this.timeline.add({
            targets: target,
            alpha: 0,
        }, 0).add({
            targets: target.scale,
            x: scale,
            y: scale,
        }, 0);
    }
}
