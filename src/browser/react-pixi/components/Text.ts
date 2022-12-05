import { Text as PixiText } from "@pixi/text"
import { Sprite as PixiSprite } from "@pixi/sprite";
import { PixiComponent, PixiContainerProps } from "../element";

export type TextProps = PixiContainerProps<PixiText>;

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
