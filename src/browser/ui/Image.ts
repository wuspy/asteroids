import { Assets } from "@pixi/assets";
import { Resource, Texture } from "@pixi/core";
import { Sprite } from "@pixi/sprite";
import { TickQueue } from "../../core/engine";
import { FadeContainer } from "./FadeContainer";

export class Image extends FadeContainer {
    private _sprite?: Sprite;
    private _tint: number;

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

        this._tint = params.tint ?? 0xffffff;
        this._flexContainer = true;

        if (texture) {
            this.addSprite(texture);
        } else {
            Assets.load(params.url).then((texture) => {
                if (!this.destroyed) {
                    this.addSprite(texture);
                    this.fadeIn();
                }
            });
        }
    }

    get tint(): number {
        return this._tint;
    }

    set tint(tint: number) {
        this._tint = tint;
        if (this._sprite) {
            this._sprite.tint = tint;
        }
    }

    private addSprite(texture: Texture<Resource>) {
        this.backgroundStyle = undefined;
        this._sprite = new Sprite(texture);
        this._sprite.tint = this._tint;
        this.addChild(this._sprite);
    }
}
