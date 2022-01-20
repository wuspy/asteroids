import { Container, DisplayObject } from "@pixi/display";

export type ItemRenderer<T> = (item: T) => DisplayObject;

export class VirtualizedList<T> extends Container {
    private readonly _itemRenderer: ItemRenderer<T>;

    constructor(params: {
        items: T[],
        itemRenderer: ItemRenderer<T>,
        itemHeight: number,
    }) {
        super();
        this._itemRenderer = params.itemRenderer;
        this.interactive = true;
        this.scrollInteractive = true;
        this.on("mousewheel", (value) => console.log(value));
    }
}
