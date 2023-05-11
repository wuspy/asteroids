import { ITextStyle, Text as PixiText, TextStyle } from "@pixi/text"
import { Sprite as PixiSprite } from "@pixi/sprite";
import { PixiComponent, PixiContainerProps } from "../element";

export type TextProps = Omit<PixiContainerProps<PixiText>, "style">  & { style?: TextStyle | Partial<ITextStyle> };

export const Text = PixiComponent<TextProps, PixiText | PixiSprite>("Text", {
    create: ({ text, style, isSprite }) => {
        const pixiText = new PixiText(text, style);
        if (isSprite) {
            pixiText.updateText(true);
            return new PixiSprite(pixiText.texture);
        }
        return pixiText;
    },
});
