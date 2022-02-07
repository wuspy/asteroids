import { Container, DisplayObject } from "@pixi/display";
import { Align, FlexDirection } from "../layout";

export class LinearGroup extends Container {
    private readonly _marginType: "marginHorizontal" | "marginVertical";
    private readonly _halfSpacing: number;

    constructor(direction: FlexDirection, spacing: number, items?: DisplayObject[]) {
        super();
        this.flexContainer = true;
        this.layout.style({
            flexDirection: direction,
            alignItems: Align.Center,
        });
        if (direction === FlexDirection.Row || direction === FlexDirection.RowReverse) {
            this._marginType = "marginHorizontal";
        } else {
            this._marginType = "marginVertical";
        }
        this._halfSpacing = spacing / 2;
        items && this.addChild(...items);
    }

    override addChild<T extends DisplayObject[]>(...children: T): T[0] {
        // Container calls addChild recursively on every item in children
        if (children.length === 1) {
            children[0].layout[this._marginType] = this._halfSpacing;
        }
        return super.addChild(...children);
    }

    override addChildAt<T extends DisplayObject>(child: T, index: number): T {
        child.layout[this._marginType] = this._halfSpacing;
        return super.addChildAt(child, index);
    }
}
