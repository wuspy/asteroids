import { ITextStyle, Text as PixiText, TextStyle } from "@pixi/text";
import { FONT_FAMILY } from "../Theme";

export class Text extends PixiText {
    constructor(text: string, style: TextStyle | Partial<ITextStyle>) {
        super(text, { ...style, fontFamily: FONT_FAMILY });
    }

    override set style(style: TextStyle | Partial<ITextStyle>) {
        super.style = { ...style, fontFamily: FONT_FAMILY };
    }
}
