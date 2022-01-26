import { ITextStyle, Text as PixiText, TextStyle } from "@pixi/text";
import { ComputedLayout } from "../layout";
import { FONT_FAMILY } from "./theme";

export class Text extends PixiText {
    constructor(text: string, style: TextStyle | Partial<ITextStyle>) {
        super(text, { ...style, fontFamily: FONT_FAMILY });
    }

    override onLayout(layout: ComputedLayout): void {
        this.style.wordWrapWidth = layout.width;
    }
}
