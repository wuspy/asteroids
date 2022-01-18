import { FONT_FAMILY, QUEUE_PRIORITIES } from "./constants";
import { GameState } from "./GameState";
import { OneShotAnimation, TickableContainer, TickQueue } from "./engine";
import { Text } from "@pixi/text";
import { ContainerBackgroundShape, FlexDirection } from "./layout";
import { UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "./Theme";

const FONT_SIZE = 48;
const FONT_WEIGHT = "normal";
const MAX_DIGITS = 7;

export class ScoreIndicator extends TickableContainer {
    private readonly _state: GameState;
    private readonly _zeroText: Text;
    private readonly _scoreText: Text;
    private _lastScore: number;

    constructor(params: {
        queue: TickQueue,
        state: GameState,
    }) {
        super(params.queue);
        this._state = params.state;
        this._lastScore = -1;

        this.flexContainer = true;
        this.layout.style({
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: FlexDirection.Row,
        });
        this.backgroundStyle = {
            shape: ContainerBackgroundShape.Rectangle,
            cornerRadius: 12,
            cacheAsBitmap: true,
            fill: {
                color: UI_BACKGROUND_COLOR,
                alpha: UI_BACKGROUND_ALPHA,
                smooth: true,
            },
        };
        this._zeroText = new Text(Array(MAX_DIGITS - 1).fill("0").join(""), {
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE,
            fontWeight: FONT_WEIGHT,
            fill: UI_FOREGROUND_COLOR,
        });
        this._zeroText.alpha = 0.25;
        this._scoreText = new Text("0", {
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE,
            fontWeight: FONT_WEIGHT,
            fill: UI_FOREGROUND_COLOR,
        });

        this.addChild(this._zeroText);
        this.addChild(this._scoreText);
        this._zeroText.cacheAsBitmap = true;
        this._scoreText.cacheAsBitmap = true;
    }

    tick(timestamp: number, elapsed: number): void {
        if (this._lastScore !== this._state.score) {
            const score = this._state.score.toFixed();
            this._scoreText.cacheAsBitmap = false;
            this._scoreText.text = score;
            this._scoreText.cacheAsBitmap = true;
            if (this._lastScore.toFixed().length !== score.length) {
                this._zeroText.cacheAsBitmap = false;
                this._zeroText.text = Array(MAX_DIGITS - score.length).fill("0").join("");
                this._zeroText.cacheAsBitmap = true;
                // The reason we need to update the layout manually here is so we can position the animation
                // since the number of digits, and therefore the score position, has changed
                this.layout.update();
            }
            const animation = new ScoreAnimation({
                state: this._state,
                queue: this.queue,
                score: this._state.score,
                color: UI_FOREGROUND_COLOR,
            });
            animation.layout.excluded = true;
            animation.position.set(
                this._scoreText.x + this._scoreText.width / 2,
                this._scoreText.y + this._scoreText.height / 2,
            );
            this.addChild(animation);
            this._lastScore = this._state.score;
        }
    }
}

class ScoreAnimation extends OneShotAnimation {
    constructor(params: {
        queue: TickQueue,
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
        const score = params.score.toFixed();

        const text = new Text(score, {
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE,
            fontWeight: FONT_WEIGHT,
            fill: params.color,
        });
        text.anchor.set(0.5);
        text.alpha = 0.8;
        this.addChild(text);

        this.timeline.add({
            targets: text,
            alpha: 0,
        }, 0).add({
            targets: text.style,
            fontSize: FONT_SIZE * 2,
        }, 0);
    }
}
