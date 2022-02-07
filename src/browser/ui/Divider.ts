import { Container } from "@pixi/display";
import { ContainerBackgroundShape } from "../layout";
import { UI_DIVIDER_COLOR } from "./theme";

export class Divider extends Container {
    constructor(margin?: number) {
        super();
        this.backgroundStyle = {
            shape: ContainerBackgroundShape.Rectangle,
            fill: {
                color: UI_DIVIDER_COLOR,
            }
        };
        this.layout.style({
            marginVertical: margin ?? 12,
            height: 2,
            width: "100%",
        });
    }
}
