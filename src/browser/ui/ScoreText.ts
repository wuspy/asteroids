import { Container } from "@pixi/display";
import { ITextStyle, TextStyle } from "@pixi/text";
import { Text } from "./Text";

const DIGITS = 7;

export class ScoreText extends Container {
    readonly scoreText: Text;
    readonly zeroText: Text;
    private _score!: number;

    constructor(score: number, zeroAlpha: number, textStyle: TextStyle | Partial<ITextStyle>) {
        super();
        this.flexContainer = true;
        this.scoreText = new Text("", textStyle);
        this.zeroText = new Text("", textStyle);
        this.zeroText.alpha = zeroAlpha;
        this.score = score;
        this.addChild(this.zeroText, this.scoreText);
    }

    get score(): number {
        return this._score;
    }

    set score(score: number) {
        if (score !== this._score) {
            this._score = score;
            this.scoreText.text = score.toFixed();
            if (this.scoreText.text.length < DIGITS) {
                this.zeroText.text = Array(DIGITS - this.scoreText.text.length).fill("0").join("");
                this.zeroText.visible = true;
            } else {
                this.zeroText.visible = false;
            }
        }
    }
}
