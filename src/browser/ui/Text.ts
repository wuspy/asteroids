import { ISize } from "@pixi/math";
import { ITextStyle, Text as PixiText, TextStyle } from "@pixi/text";
import { MeasureMode } from "../layout";
import { FONT_FAMILY, UI_FOREGROUND_COLOR } from "./theme";

export class Text extends PixiText {
    constructor(text: string, style: TextStyle | Partial<ITextStyle>) {
        super(text, { fontFamily: FONT_FAMILY, fill: UI_FOREGROUND_COLOR, ...style });
    }

    override onLayoutMeasure(
        width: number,
        widthMeasureMode: MeasureMode,
        height: number,
        heightMeasureMode: MeasureMode
    ): ISize {
        if (this.style.wordWrap && widthMeasureMode !== MeasureMode.Undefined) {
            this.style.wordWrapWidth = width;
        }
        this.updateText(true);
        return super.onLayoutMeasure(width, widthMeasureMode, height, heightMeasureMode);
    }
}
