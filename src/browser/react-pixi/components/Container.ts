import { Container as PixiContainer } from "@pixi/display"
import { PixiComponent, PixiContainerProps } from "../element";

export type ContainerProps = PixiContainerProps<PixiContainer>;

export const Container = PixiComponent<ContainerProps, PixiContainer>("Container", {
    create: () => new PixiContainer(),
});
