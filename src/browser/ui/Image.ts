import { Assets } from "@pixi/assets";
import { Sprite } from "@pixi/sprite";
import { TickQueue } from "../../core/engine";
import { FadeContainer } from "./FadeContainer";

export class Image extends FadeContainer {
    private _sprite: Sprite;

    constructor(params: {
        queue: TickQueue,
        url: string,
        tint?: number,
    }) {
        const texture = Assets.get(params.url);
        super({
            queue: params.queue,
            fadeInDuration: 200,
            fadeOutDuration: 200,
            initiallyVisible: !!texture,
            keepVisible: true,
        });

        this.flexContainer = true;

        this._sprite = new Sprite();
        this._sprite.tint = params.tint ?? 0xffffff;
        this.addChild(this._sprite);

        if (texture) {
            this._sprite.texture = texture;
        } else {
            Assets.load(params.url).then((texture) => {
                if (!this.destroyed) {
                    this._sprite.texture = texture;
                    this.fadeIn();
                }
            });
        }
    }

    get tint(): number {
        return this._sprite.tint;
    }

    set tint(tint: number) {
        this._sprite.tint = tint;
    }
}
