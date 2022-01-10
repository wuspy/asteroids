import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { FONT_FAMILY, LIVES, QUEUE_PRIORITIES } from "./constants";
import { OneShotAnimation, Tickable, RelativeLayout, CoreOneShotAnimationParams, Widget, CoreWidgetParams } from "./engine";
import { Ship } from "./Ship";
import { ISize } from "@pixi/math";
import { Text } from "@pixi/text";
import { GameState } from "./GameState";
import '@pixi/mixin-cache-as-bitmap';

const SIZE = 36;
const SPACING = 8;
const PADDING: ISize = {
    width: 14,
    height: 12
};

export class LifeIndicator extends Widget implements Tickable {
    private _state: GameState;
    private _indicators: Graphics[]
    private _background: Graphics;
    private _container: RelativeLayout;
    private _lastLives: number;

    constructor(params: CoreWidgetParams & {
        state: GameState;
    }) {
        super({ ...params, queuePriority: 0 });
        this._state = params.state;
        this._lastLives = LIVES;
        this._container = new RelativeLayout();
        // this._container.backgroundStyle = {
        //     shape: "rectangle",
        //     cornerRadius: 12,
        //     fillStyle: {
        //         color: this._state.theme.uiBackgroundColor,
        //         alpha: this._state.theme.uiBackgroundAlpha,
        //         smooth: true
        //     },
        // };
        this._indicators = [];

        const baseIndicator = Ship.createModel(this._state.theme.uiForegroundColor, 3, SIZE);
        this._background = new Graphics();
        this._background.beginFill(this._state.theme.uiBackgroundColor, this._state.theme.uiBackgroundAlpha, true);
        this._background.drawRoundedRect(0,
            0,
            // TODO find out why life indicators have an extra pixel of spacing between them (SPACING + 1 instead of just SPACING)
            baseIndicator.width * LIVES + (SPACING + 1) * (LIVES - 1) + PADDING.width * 2,
            baseIndicator.height + PADDING.height * 2,
            12
        );
        this._container.width = this._background.width;
        this._container.height = this._background.height;
        this._background.cacheAsBitmap = true;
        this._container.addChildWithConstraints(this._background, {
            constraints: {
                left: ["parent", "left"],
                top: ["parent", "top"],
            },
        });

        for (let i = 0; i < LIVES; i++) {
            const indicator = new Graphics(baseIndicator.geometry);
            indicator.pivot.set(-indicator.width / 2, -indicator.height / 2);
            indicator.cacheAsBitmap = true;
            this._indicators.push(indicator);
            if (i === 0) {
                this._container.addChildWithConstraints(indicator, {
                    margin: { left: PADDING.width, top: PADDING.height, bottom: PADDING.height },
                    constraints: {
                        left: ["parent", "left"],
                        top: ["parent", "top"],
                    },
                });
            } else {
                this._container.addChildWithConstraints(indicator, {
                    margin: { left: SPACING, top: PADDING.height, bottom: PADDING.height },
                    constraints: {
                        left: [this._indicators[i - 1], "right"],
                        top: [this._indicators[i - 1], "top"],
                    },
                });
            }
        }
    }

    tick(timestamp: number, elapsed: number): void {
        if (this._lastLives !== this._state.lives) {
            this._lastLives = this._state.lives;
            for (let i = 0; i < LIVES; i++) {
                if (i < LIVES - this._state.lives && this._indicators[i].alpha !== 0.25) {
                    this._indicators[i].alpha = 0.25;
                } else if (i >= LIVES - this._state.lives && this._indicators[i].alpha !== 1) {
                    this._indicators[i].alpha = 1;
                    const animation = new ExtraLifeAnimation({
                        queue: this.queue,
                        color: 0xffffff,
                    });
                    animation.container.y = 64;
                    this._container.addChildWithConstraints(animation.container, {
                        constraints: {
                            hcenter: ["parent", "hcenter"],
                        }
                    });
                } else {
                    continue;
                }
                const animation = new LifeAnimation({
                    queue: this.queue,
                    color: 0xffffff,
                });
                this._container.addChildWithConstraints(animation.container, {
                    constraints: {
                        hcenter: [this._indicators[i], "hcenter"],
                        vcenter: [this._indicators[i], "vcenter"],
                    }
                });
            }
        }
    }

    get container(): RelativeLayout {
        return this._container;
    }
}

class LifeAnimation extends OneShotAnimation {
    size: number;
    private _graphic: Graphics;

    constructor(params: CoreOneShotAnimationParams & {
        color: number
    }) {
        super({
            ...params,
            queuePriority: QUEUE_PRIORITIES.animation,
            defaultAnimeParams: ({
                duration: 250,
                easing: "linear",
            })
        });
        this.size = SIZE;

        this._graphic = Ship.createModel(params.color, 3, SIZE);
        this._graphic.pivot.set(-this._graphic.width / 2, -this._graphic.height / 2);
        this._graphic.cacheAsBitmap = true;
        this._graphic.alpha = 0.8;

        this.timeline.add({
            targets: this._graphic,
            alpha: 0,
        }, 0).add({
            targets: this,
            size: SIZE * 3,
            change: () => this._graphic.scale.set(this.size / SIZE),
        }, 0);
    }

    get container(): Container {
        return this._graphic;
    }
}

class ExtraLifeAnimation extends OneShotAnimation {
    size: number;
    alpha: number;
    private _text: Text;

    constructor(params: CoreOneShotAnimationParams & {
        color: number,
    }) {
        super({
            ...params,
            queuePriority: QUEUE_PRIORITIES.animation,
            defaultAnimeParams: ({
                duration: 1000,
                easing: "easeOutBack",
            })
        });
        this.alpha = 0;
        this.size = 12;

        this.timeline.add({
            targets: this,
            keyframes: [
                { alpha: 1, size: 24 },
                { alpha: 0, size: 48 },
            ],
            change: () => {
                this._text.style.fontSize = this.size;
                this._text.alpha = this.alpha;
            },
        });
        this._text = new Text("Extra Life!", {
            fontFamily: FONT_FAMILY,
            fontSize: this.size,
            fill: params.color,
        });
    }

    get container(): Container {
        return this._text;
    }
}
