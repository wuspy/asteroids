import { Resource, Texture } from "@pixi/core";
import { Loader } from "@pixi/loaders";
import { Sprite } from "@pixi/sprite";
import { FadeContainer, TickQueue } from "../engine";
import { ComputedLayout, ContainerBackgroundShape } from "../layout";

export class Image extends FadeContainer {
    private _sprite?: Sprite;
    private _tint: number;

    constructor(params: {
        queue: TickQueue,
        resource: string,
        fadeInOnLoad: boolean,
        tint?: number,
    }) {
        const resource = Loader.shared.resources[params.resource];
        super({
            queue: params.queue,
            fadeInDuration: 200,
            fadeOutDuration: 200,
            initiallyVisible: resource.isComplete && !!resource.texture,
            makeInvisible: false,
        });

        this._tint = params.tint ?? 0xffffff;

        const waitForTexture = () => {
            if (resource.texture) {
                if (!this.destroyed) { // In case the container was destroyed before the resource loaded
                    this.addSprite(resource.texture);
                    if (params.fadeInOnLoad) {
                        this.fadeIn();
                    } else {
                        this.show();
                    }
                }
            } else {
                window.setTimeout(waitForTexture);
            }
        }

        if (resource.isComplete) {
            waitForTexture();
        } else {
            resource.onComplete.add(waitForTexture);
        }

        if (!this._sprite) {
            this.backgroundStyle = {
                shape: ContainerBackgroundShape.Rectangle,
                fill: {
                    color: 0,
                    alpha: 0.01,
                },
            };
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
    
    override onLayout(layout: ComputedLayout): void {
        super.onLayout(layout);
        if (this._sprite) {
            if (this._sprite.width !== layout.width) {
                this._sprite.width = layout.width;
            }
            if (this._sprite.height !== layout.height) {
                this._sprite.height = layout.height;
            }
        }
    }

    private addSprite(texture: Texture<Resource>) {
        this.backgroundStyle = undefined;
        this._sprite = new Sprite(texture);
        this._sprite.tint = this._tint;
        this.addChild(this._sprite);
    }
}
