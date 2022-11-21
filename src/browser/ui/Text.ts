import { ITextStyle, Text as PixiText, TextStyle } from "@pixi/text";
import { FONT_FAMILY, UI_FOREGROUND_COLOR } from "./theme";

export class Text extends PixiText {
    constructor(text: string, style: TextStyle | Partial<ITextStyle>) {
        super(text, { fontFamily: FONT_FAMILY, fill: UI_FOREGROUND_COLOR, ...style });
    }
}
