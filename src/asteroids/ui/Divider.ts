import { Container } from "@pixi/display";
import { ContainerBackgroundShape } from "../layout";

export class Divider extends Container {
    constructor() {
        super();
        this.backgroundStyle = {
            shape: ContainerBackgroundShape.Rectangle,
            fill: {
                color: 0x606060,
            }
        };
        this.layout.style({
            marginVertical: 12,
            height: 2,
            width: [100, "%"],
        });
    }
}
