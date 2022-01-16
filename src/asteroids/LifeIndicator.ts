import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LIVES, QUEUE_PRIORITIES } from "./constants";
import { OneShotAnimation, Tickable, CoreOneShotAnimationParams, Widget, CoreWidgetParams } from "./engine";
import { Ship } from "./Ship";
import { GameState } from "./GameState";
import '@pixi/mixin-cache-as-bitmap';
import { FlexDirection } from "./layout";

const SIZE = 36;

export class LifeIndicator extends Widget implements Tickable {
    private _state: GameState;
    private _indicators: Graphics[]
    private _container: Container;
    private _lastLives: number;

    constructor(params: CoreWidgetParams & {
        state: GameState;
    }) {
        super({ ...params, queuePriority: 0 });
        this._state = params.state;
        this._lastLives = LIVES;
        this._container = new Container();
        this._container.flexContainer = true;
        this._container.layout.style({
            paddingHorizontal: 14,
            paddingVertical: 12,
            flexDirection: FlexDirection.Row,
        });
        this._container.backgroundStyle = {
            shape: "rectangle",
            cornerRadius: 12,
            cacheAsBitmap: true,
            fill: {
                color: this._state.theme.uiBackgroundColor,
                alpha: this._state.theme.uiBackgroundAlpha,
                smooth: true
            },
        };

        this._indicators = [];
        const baseIndicator = Ship.createModel(this._state.theme.uiForegroundColor, 3, SIZE);

        for (let i = 0; i < LIVES; i++) {
            const indicator = new Graphics(baseIndicator.geometry);
            indicator.layout.originAtCenter = true;
            indicator.cacheAsBitmap = true;
            if (i > 0) {
                indicator.layout.marginLeft = 8;
            }
            this._indicators.push(indicator);
            this._container.addChild(indicator);
        }
    }

    tick(timestamp: number, elapsed: number): void {
        if (this._lastLives !== this._state.lives) {
            this._lastLives = this._state.lives;
            for (let i = 0; i < LIVES; i++) {
                const indicator = this._indicators[i];
                if (i < LIVES - this._state.lives && indicator.alpha !== 0.25) {
                    indicator.alpha = 0.25;
                } else if (i >= LIVES - this._state.lives && indicator.alpha !== 1) {
                    indicator.alpha = 1;
                } else {
                    continue;
                }
                const animation = new LifeAnimation({
                    queue: this.queue,
                    color: 0xffffff,
                });
                animation.container.layout.excluded = true;
                animation.container.position.copyFrom(indicator.position);
                this._container.addChild(animation.container);
            }
        }
    }

    get container(): Container {
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
