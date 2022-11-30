import { GameState } from "../../core";
import { TickQueue } from "../../core/engine";
import { ScoreText, Text, TickableContainer, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR } from "../ui";
import { ContainerBackgroundShape } from "../layout";
import { PopAnimation } from "../animations";
import { Sprite } from "@pixi/sprite";

export class ScoreIndicator extends TickableContainer {
    private readonly _state: GameState;
    private readonly _text: ScoreText;
    private _lastScore: number;

    constructor(params: {
        queue: TickQueue,
        state: GameState,
    }) {
        super(params.queue);
        this._state = params.state;
        this._lastScore = -1;
        this.interactiveChildren = false;

        this.flexContainer = true;
        this.layout.style({
            paddingHorizontal: 12,
            paddingVertical: 8,
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

        this._text = new ScoreText(this._state.score, 0.25, { fontSize: 48 });

        this.addChild(this._text);
    }

    tick(): void {
        if (this._lastScore !== this._state.score) {
            this._text.score = this._state.score;
            // The reason we need to update the layout manually here is so we can position the animation
            // in case the number of digits, and therefore the score position, has changed
            this.layout.update();
            const animation = new ScoreAnimation(this.queue, this._text.scoreText);
            animation.layout.excluded = true;
            animation.position.set(
                this._text.x + this._text.scoreText.x + this._text.scoreText.width / 2,
                this._text.y + this._text.scoreText.y + this._text.scoreText.height / 2,
            );
            this.addChild(animation);
            this._lastScore = this._state.score;
        }
    }
}

class ScoreAnimation extends PopAnimation {
    constructor(queue: TickQueue, target: Text) {
        const text = new Sprite(target.texture);
        text.anchor.set(0.5);
        text.alpha = 0.8;

        super({
            queue,
            target: text,
            scale: 2,
            duration: 250,
        });
    }
}
