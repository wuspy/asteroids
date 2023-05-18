import { Container } from "@pixi/display"
import { registerPixiComponent, PixiContainerProps } from "../element";

export type ContainerProps = PixiContainerProps<Container>;

declare module "solid-js" {
    namespace JSX {
        interface IntrinsicElements {
            container: ContainerProps,
        }
    }
}

registerPixiComponent<ContainerProps, Container>("container", {
    create() {
        return new Container();
    },
});
