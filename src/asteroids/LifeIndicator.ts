import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LIVES, QUEUE_PRIORITIES } from "./constants";
import { OneShotAnimation, TickableContainer, TickQueue } from "./engine";
import { Ship } from "./Ship";
import { GameState } from "./GameState";
import '@pixi/mixin-cache-as-bitmap';
import { ContainerBackgroundShape, FlexDirection } from "./layout";
import { UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "./Theme";

const SIZE = 36;

export class LifeIndicator extends TickableContainer {
    private _state: GameState;
    private readonly _indicators: Graphics[]
    private _lastLives: number;

    constructor(params:  {
        queue: TickQueue,
        state: GameState,
    }) {
        super(params.queue);
        this._state = params.state;
        this._lastLives = LIVES;
        this.flexContainer = true;
        this.layout.style({
            paddingHorizontal: 14,
            paddingVertical: 12,
            flexDirection: FlexDirection.Row,
        });
        this.backgroundStyle = {
            shape: ContainerBackgroundShape.Rectangle,
            cornerRadius: 12,
            cacheAsBitmap: true,
            fill: {
                color: UI_BACKGROUND_COLOR,
                alpha: UI_BACKGROUND_ALPHA,
                smooth: true
            },
        };

        this._indicators = [];
        const baseIndicator = Ship.createModel(UI_FOREGROUND_COLOR, 3, SIZE);

        for (let i = 0; i < LIVES; i++) {
            const indicator = new Graphics(baseIndicator.geometry);
            indicator.layout.originAtCenter = true;
            indicator.cacheAsBitmap = true;
            if (i > 0) {
                indicator.layout.marginLeft = 8;
            }
            this._indicators.push(indicator);
            this.addChild(indicator);
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
                animation.layout.excluded = true;
                animation.position.copyFrom(indicator.position);
                this.addChild(animation);
            }
        }
    }
}

class LifeAnimation extends OneShotAnimation {
    private readonly _graphics: Graphics;
    size: number;

    constructor(params: {
        queue: TickQueue,
        color: number,
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

        this._graphics = Ship.createModel(params.color, 3, SIZE);
        this._graphics.cacheAsBitmap = true;
        this._graphics.alpha = 0.8;
        this.addChild(this._graphics);

        this.timeline.add({
            targets: this._graphics,
            alpha: 0,
        }, 0).add({
            targets: this,
            size: SIZE * 3,
            change: () => this._graphics.scale.set(this.size / SIZE),
        }, 0);
    }
}
