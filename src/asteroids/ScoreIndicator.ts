import { FONT_FAMILY, QUEUE_PRIORITIES } from "./constants";
import { GameState } from "./GameState";
import { OneShotAnimation, Tickable, CoreOneShotAnimationParams, Widget, CoreWidgetParams } from "./engine";
import { Text } from "@pixi/text";
import { Container } from "@pixi/display";
import { FlexDirection } from "./layout";

const FONT_SIZE = 48;
const FONT_WEIGHT = "normal";
const MAX_DIGITS = 7;

export class ScoreIndicator extends Widget implements Tickable {
    private readonly _state: GameState;
    private readonly _container: Container;
    private readonly _zeroText: Text;
    private readonly _scoreText: Text;
    private _lastScore: number;

    constructor(params: CoreWidgetParams & {
        state: GameState,
    }) {
        super({ ...params, queuePriority: 0 });
        this._state = params.state;
        this._lastScore = -1;

        this._container = new Container();
        this._container.flexContainer = true;
        this._container.layout.style({
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: FlexDirection.Row,
        });
        this._container.backgroundStyle = {
            shape: "rectangle",
            cornerRadius: 12,
            cacheAsBitmap: true,
            fill: {
                color: this._state.theme.uiBackgroundColor,
                alpha: this._state.theme.uiBackgroundAlpha,
                smooth: true,
            },
        };
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

        this._container.addChild(this._zeroText);
        this._container.addChild(this._scoreText);
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
            const needsUpdate = score.length !== this._scoreText.text.length;
            this._scoreText.text = score;
            if (needsUpdate) {
                // The reason we need to update the layout manually here is so we can position the animation
                this._container.layout.update();
            }
            this._scoreText.cacheAsBitmap = true;
            const animation = new ScoreAnimation({
                state: this._state,
                queue: this.queue,
                score: this._state.score,
                color: this._state.theme.uiForegroundColor,
            });
            animation.container.layout.excluded = true;
            animation.container.position.set(
                this._scoreText.x + this._scoreText.width / 2,
                this._scoreText.y + this._scoreText.height / 2,
            );
            this._container.addChild(animation.container);
            this._lastScore = this._state.score;
        }
    }

    get container(): Container {
        return this._container;
    }
}

class ScoreAnimation extends OneShotAnimation {
    private readonly _score: string;
    private readonly _text: Text;

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
        this._text.anchor.set(0.5);
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
