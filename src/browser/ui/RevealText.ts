import { ITextStyle, TextStyle } from "@pixi/text";
import { TickQueue } from "../../core/engine";
import { TickableContainer } from "./TickableContainer";
import anime from "animejs";
import { ISize } from "@pixi/math";
import { MeasureMode } from "../layout";
import { Text } from "./Text";

export class RevealText extends TickableContainer {
    private readonly _timeline: anime.AnimeTimelineInstance;
    private readonly _text: Text;
    private readonly _leftBracket: Text;
    private readonly _rightBracket: Text;

    constructor(params: {
        queue: TickQueue,
        text: string,
        textStyle: TextStyle | Partial<ITextStyle>,
        duration: number,
    }) {
        super(params.queue);
        this._text = new Text(params.text, params.textStyle);
        this._text.alpha = 0;
        this._leftBracket = new Text("[", params.textStyle);
        this._rightBracket = new Text("]", params.textStyle);
        this._text.x = this._leftBracket.width;
        this._rightBracket.x = this._text.x + this._text.width / 2;
        this._leftBracket.x = this._rightBracket.x - this._leftBracket.width;

        this.addChild(this._text, this._leftBracket, this._rightBracket);

        this._timeline = anime.timeline({
            autoplay: false,
            duration: params.duration,
            easing: "easeOutExpo",
        }).add({
            targets: this._rightBracket,
            x: this._text.width + this._text.x,
        }, 0).add({
            targets: this._leftBracket,
            x: 0,
        }, 0).add({
            targets: this._text,
            alpha: 1,
        }, 0)
    }

    // @ts-ignore
    override isLayoutMeasurementDirty(): boolean {
        return false;
    }

    // @ts-ignore
    override onLayoutMeasure(width: number, widthMeasureMode: MeasureMode, height: number, heightMeasureMode: MeasureMode): ISize {
        return {
            width: this._text.width + this._leftBracket.width + this._rightBracket.width,
            height: this._text.height,
        }
    }

    tick(timestamp: number, elapsed: number): void {
        this._timeline.tick(timestamp);
    }
}
