import { CoreWidgetParams, random, Tickable, Widget } from "./engine";
import { Text } from "@pixi/text";
import { Container } from "@pixi/display";
import { GameState } from "./GameState";
import { FONT_FAMILY } from "./constants";

const FONT_SIZE = 28;
const MAX_DIGITS = 3;
const LEVEL_CHANGE_ANIMATION_DURATION = 1;

const CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export class LevelIndicator extends Widget implements Tickable {
    private readonly _state: GameState;
    private readonly _text: Text;
    private _lastLevel: number;
    private _levelChangeAnimationCountdown: number;

    constructor(params: CoreWidgetParams & {
        state: GameState;
    }) {
        super({ ...params, queuePriority: 0 });
        this._state = params.state;
        this._text = new Text("", {
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE,
            fill: this._state.theme.foregroundColor,
        });
        this._lastLevel = -1;
        this._levelChangeAnimationCountdown = 0;
    }

    tick(timestamp: number, elapsed: number): void {
        if (this._state.level !== this._lastLevel) {
            this._levelChangeAnimationCountdown = LEVEL_CHANGE_ANIMATION_DURATION;
            this._lastLevel = this._state.level;
        } else if (this._levelChangeAnimationCountdown) {
            let text = "LVL ";
            this._levelChangeAnimationCountdown = Math.max(0, this._levelChangeAnimationCountdown - elapsed);
            if ((this._levelChangeAnimationCountdown * 1000) % 50 < 25) {
                for (let i = 0; i < MAX_DIGITS; i++) {
                    if ((LEVEL_CHANGE_ANIMATION_DURATION - this._levelChangeAnimationCountdown) * MAX_DIGITS / LEVEL_CHANGE_ANIMATION_DURATION >= i + 1) {
                        text += this._lastLevel.toFixed().padStart(MAX_DIGITS, "0")[i];
                    } else {
                        text += CHARS[random(0, CHARS.length - 1, false)];
                    }
                }
                this._text.text = text;
            }
        }
    }

    get container(): Container {
        return this._text;
    }
}
