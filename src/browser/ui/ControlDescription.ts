import { Container } from "@pixi/display";
import { Align, FlexDirection } from "../layout";
import { ControlGraphic, ControlType } from "./ControlGraphic";
import { Text } from "./Text";

export class ControlDescription extends Container {
    constructor(params: {
        type: ControlType,
        control: string,
        background: number,
        foreground: number,
        beforeLabel?: string,
        afterLabel?: string,
        fontSize: number,
        direction: "horizontal" | "vertical",
    }) {
        super();
        this.flexContainer = true;
        this.layout.alignItems = Align.Center;
        const control = new ControlGraphic({
            ...params,
            fontSize: params.fontSize * 0.75,
        });
        if (params.direction === "horizontal") {
            const margin = Math.round(params.fontSize * 0.5);
            control.layout.style({
                marginLeft: params.beforeLabel ? margin : 0,
                marginRight: params.afterLabel ? margin : 0,
            });
        } else {
            const margin = Math.round(params.fontSize * 0.3);
            this.layout.flexDirection = FlexDirection.Column;
            control.layout.style({
                marginTop: params.beforeLabel ? margin : 0,
                marginBottom: params.afterLabel ? margin : 0,
            });
        }
        if (params.beforeLabel) {
            const beforeLabel = new Text(params.beforeLabel, {
                fontSize: params.fontSize,
                fill: params.background,
            });
            beforeLabel.cacheAsBitmap = true;
            this.addChild(beforeLabel);
        }
        this.addChild(control);
        if (params.afterLabel) {
            const afterLabel = new Text(params.afterLabel, {
                fontSize: params.fontSize,
                fill: params.background,
            });
            afterLabel.cacheAsBitmap = true;
            this.addChild(afterLabel);
        }
    }
}
