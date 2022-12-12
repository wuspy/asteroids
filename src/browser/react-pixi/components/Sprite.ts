import { Sprite as PixiSprite } from "@pixi/sprite"
import { PixiComponent, PixiContainerProps } from "../element";

export type SpriteProps = PixiContainerProps<PixiSprite>;

export const Sprite = PixiComponent<SpriteProps, PixiSprite>("Sprite", {
    create: ({ texture }) => new PixiSprite(texture),
});
