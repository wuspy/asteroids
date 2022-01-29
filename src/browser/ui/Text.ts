import { ISize } from "@pixi/math";
import { ITextStyle, Text as PixiText, TextStyle } from "@pixi/text";
import { MeasureMode } from "../layout";
import { FONT_FAMILY } from "./theme";

export class Text extends PixiText {
    constructor(text: string, style: TextStyle | Partial<ITextStyle>) {
        super(text, { ...style, fontFamily: FONT_FAMILY });
    }

    override isLayoutMeasurementDirty(): boolean {
        return this.dirty || this.localStyleID !== this._style.styleID;
    }

    override onLayoutMeasure(
        width: number,
        widthMeasureMode: MeasureMode,
        height: number,
        heightMeasureMode: MeasureMode
    ): ISize {
        if (this.style.wordWrap && widthMeasureMode !== MeasureMode.Undefined) {
            this.style.wordWrapWidth = width;
            this.updateText(true);
        }
        return super.onLayoutMeasure(width, widthMeasureMode, height, heightMeasureMode);
    }
}
