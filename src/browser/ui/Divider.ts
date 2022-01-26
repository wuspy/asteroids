import { Container } from "@pixi/display";
import { ContainerBackgroundShape } from "../layout";

export class Divider extends Container {
    constructor(margin?: number) {
        super();
        this.backgroundStyle = {
            shape: ContainerBackgroundShape.Rectangle,
            fill: {
                color: 0x606060,
            }
        };
        this.layout.style({
            marginVertical: margin ?? 12,
            height: 2,
            width: [100, "%"],
        });
    }
}
