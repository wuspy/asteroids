import "@pixi/mixin-cache-as-bitmap";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LIVES, GameState } from "@core";
import { TickQueue } from "@core/engine";
import { ShipDisplay } from "../ShipDisplay";
import { ContainerBackgroundShape, FlexDirection } from "../layout";
import { PopAnimation } from "../animations";
import { LinearGroup, TickableContainer, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "../ui";

const SIZE = 36;

export class LifeIndicator extends TickableContainer {
    private _state: GameState;
    private readonly _indicators: Graphics[]
    private _lastLives: number;

    constructor(params: {
        queue: TickQueue,
        state: GameState,
    }) {
        super(params.queue);
        this._state = params.state;
        this._lastLives = LIVES;
        this.flexContainer = true;
        this.interactiveChildren = false;
        this.layout.style({
            paddingHorizontal: 14,
            paddingVertical: 12,
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
        const baseIndicator = ShipDisplay.createModel(UI_FOREGROUND_COLOR, 3, SIZE);

        for (let i = 0; i < LIVES; i++) {
            const indicator = new Graphics(baseIndicator.geometry);
            indicator.layout.originAtCenter = true;
            indicator.cacheAsBitmap = true;
            this._indicators.push(indicator);
        }
        this.addChild(new LinearGroup(FlexDirection.Row, 8, this._indicators));
    }

    tick(): void {
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
                const animation = new LifeAnimation(this.queue);
                animation.layout.excluded = true;
                animation.position.copyFrom(indicator.position);
                indicator.parent.addChild(animation);
            }
        }
    }
}

class LifeAnimation extends PopAnimation {
    constructor(queue: TickQueue) {
        const target = ShipDisplay.createModel(UI_FOREGROUND_COLOR, 3, SIZE);
        target.cacheAsBitmap = true;
        target.alpha = 0.8;
        super({
            queue,
            target,
            scale: 3,
            duration: 250,
        });
    }
}
