import { Container } from "@pixi/display";
import { OneShotAnimation } from "./OneShotAnimation";
import { TickQueue } from "../../core/engine";
import { Renderer, RenderTexture } from "@pixi/core";

export class PopAnimation extends OneShotAnimation {
    private _texture?: RenderTexture;

    constructor(params: {
        queue: TickQueue,
        target: Container,
        scale: number,
        duration: number,
    }) {
        super({
            ...params,
            defaultAnimeParams: ({
                duration: params.duration,
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
