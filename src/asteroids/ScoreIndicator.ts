import { FONT_FAMILY, QUEUE_PRIORITIES } from "./constants";
import { GameState } from "./GameState";
import { OneShotAnimation, Tickable, RelativeLayout, CoreOneShotAnimationParams, Widget, CoreWidgetParams } from "./engine";
import { Text } from "@pixi/text";
import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { ISize } from "@pixi/math";
import '@pixi/mixin-cache-as-bitmap';

const FONT_SIZE = 48;
const FONT_WEIGHT = "normal";
const PADDING: ISize = {
    width: 12,
    height: 8
};
const MAX_DIGITS = 7;

export class ScoreIndicator extends Widget implements Tickable {
    private readonly _state: GameState;
    private readonly _container: RelativeLayout;
    private readonly _zeroText: Text;
    private readonly _scoreText: Text;
    private readonly _background: Graphics;
    private _lastScore: number;

    constructor(params: CoreWidgetParams & {
        state: GameState,
    }) {
        super({ ...params, queuePriority: 0 });
        this._state = params.state;
        this._lastScore = -1;

        this._container = new RelativeLayout();
        this._zeroText = new Text(Array(MAX_DIGITS - 1).fill("0").join(""), {
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE,
            fontWeight: FONT_WEIGHT,
            fill: this._state.theme.uiForegroundColor,
        });
        this._zeroText.alpha = 0.25;
        this._scoreText = new Text("0", {
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE,
            fontWeight: FONT_WEIGHT,
            fill: this._state.theme.uiForegroundColor,
        });

        this._background = new Graphics();
        this._background.x = 0;
        this._background.y = 0;
        this._background.beginFill(this._state.theme.uiBackgroundColor, this._state.theme.uiBackgroundAlpha, true);
        this._background.drawRoundedRect(
            0,
            0,
            this._zeroText.width + this._scoreText.width + PADDING.width * 2,
            this._zeroText.height + PADDING.height * 2,
            12,
        );

        this._container.height = this._background.height;
        this._container.width = this._background.width;
        this._container.addChildWithConstraints(this._background, {
            constraints: {
                left: ["parent", "left"],
                top: ["parent", "top"],
            },
        });
        this._container.addChildWithConstraints(this._zeroText, {
            margin: { left: PADDING.width, top: PADDING.height },
            constraints: {
                left: ["parent", "left"],
                top: ["parent", "top"],
            },
        });
        this._container.addChildWithConstraints(this._scoreText, {
            margin: { top: PADDING.height },
            constraints: {
                left: [this._zeroText, "right"],
                top: ["parent", "top"],
            },
        });
        this._background.cacheAsBitmap = true;
        this._zeroText.cacheAsBitmap = true;
        this._scoreText.cacheAsBitmap = true;
    }

    tick(timestamp: number, elapsed: number): void {
        if (this._lastScore !== this._state.score) {
            const score = this._state.score.toFixed();
            if (this._lastScore.toFixed().length !== score.length) {
                this._zeroText.cacheAsBitmap = false;
                this._zeroText.text = Array(MAX_DIGITS - score.length).fill("0").join("");
                this._zeroText.cacheAsBitmap = true;
            }
            this._scoreText.cacheAsBitmap = false;
            this._scoreText.text = score;
            this._scoreText.cacheAsBitmap = true;
            const animation = new ScoreAnimation({
                state: this._state,
                queue: this.queue,
                score: this._state.score,
                color: this._state.theme.uiForegroundColor,
            });
            this._container.addChildWithConstraints(animation.container, {
                constraints: {
                    hcenter: [this._scoreText, "hcenter"],
                    vcenter: [this._scoreText, "vcenter"],
                },
            });
            this._lastScore = this._state.score;
        }
    }

    get container(): RelativeLayout {
        return this._container;
    }
}

class ScoreAnimation extends OneShotAnimation {
    private _score: string;
    private _text: Text;

    constructor(params: CoreOneShotAnimationParams & {
        score: number,
        state: GameState,
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
        this._score = params.score.toFixed();

        this._text = new Text(this._score, {
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE,
            fontWeight: FONT_WEIGHT,
            fill: params.color,
        });
        this._text.alpha = 0.8;

        this.timeline.add({
            targets: this._text,
            alpha: 0,
        }, 0).add({
            targets: this._text.style,
            fontSize: FONT_SIZE * 2,
        }, 0);
    }

    get container(): Container {
        return this._text;
    }
}
