import { Container, DisplayObject } from "@pixi/display";
import { FlexDirection } from "../layout";

export class LinearGroup extends Container {
    constructor(direction: FlexDirection, spacing: number, items: DisplayObject[]) {
        super();
        this.flexContainer = true;
        this.layout.flexDirection = direction;
        let margin: "marginLeft" | "marginRight" | "marginTop" | "marginBottom";
        if (direction === FlexDirection.Row) {
            margin = "marginLeft";
        } else if (direction === FlexDirection.RowReverse) {
            margin = "marginRight";
        } else if (direction === FlexDirection.Column) {
            margin = "marginTop";
        } else {
            margin = "marginBottom";
        }
        for (let i = 1; i < items.length; i++) {
            items[i].layout[margin] = spacing;
        }
        this.addChild(...items);
    }
}
