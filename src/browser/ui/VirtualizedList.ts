import { Container, DisplayObject } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import anime from "animejs";
import { TickableContainer } from "./TickableContainer";
import { clamp, TickQueue } from "../../core/engine";
import { ComputedLayout, ContainerBackgroundShape, FlexDirection, PositionType } from "../layout";

export type ItemRenderer<T> = (item: T) => DisplayObject;

export class VirtualizedList<T> extends TickableContainer {
    private readonly _itemContainer: Container;
    private readonly _itemRenderer: ItemRenderer<T>;
    private readonly _renderedItems: { [Key in number]: DisplayObject };
    private readonly _items: T[];
    private readonly _itemHeight: number;
    // private readonly _edgeFadeFilter: EdgeFadeFilter;
    private _timeline?: anime.AnimeInstance;
    private _currentPos: number;
    private _targetPos: number;
    private _currentHeight: number;

    constructor(params: {
        queue: TickQueue,
        items: T[],
        itemRenderer: ItemRenderer<T>,
        itemHeight: number,
    }) {
        super(params.queue);
        this._renderedItems = {};
        this._items = params.items;
        this._currentPos = 0;
        this._targetPos = 0;
        this._currentHeight = 0;
        this._itemRenderer = params.itemRenderer;
        this._itemHeight = params.itemHeight;
        this.interactive = true;
        this.scrollInteractive = true;
        this.flexContainer = true;

        this._itemContainer = new Container();
        this._itemContainer.flexContainer = true;
        this._itemContainer.layout.style({
            flexDirection: FlexDirection.Column,
            position: PositionType.Absolute,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        });
        this.addChild(this._itemContainer);

        this.on("mousewheel", (value) => {
            this._targetPos = clamp(this._targetPos - (value * this._itemHeight), this.getMaxScrollPosition(this._currentHeight), 0);
            this.scrollToPosition(this._targetPos);
        });

        // Set a default "transparent" background so we can receive input events from pixi if no other background is set
        this.backgroundStyle = {
            shape: ContainerBackgroundShape.Rectangle,
            fill: {
                color: 0,
                alpha: 0.0001,
            },
        };
        // We need a mask, otherwise pixi will render anything we draw, anywhere, regardless of layout bounds
        const mask = this._itemContainer.mask = new Graphics();
        mask.layout.excluded = true;
        this._itemContainer.addChild(mask);
    }

    scrollToIndex(index: number) {
        this.scrollToPosition(index * this._itemHeight);
    }

    scrollToPosition(pos: number) {
        const target = { pos: this._currentPos };
        this._timeline = anime.timeline({
            autoplay: false,
            easing: "easeOutQuad",
            complete: () => {
                this._timeline = undefined;
                this._scrollToPosition(pos, this._currentHeight);
            },
        }).add({
            targets: target,
            pos,
            duration: 250,
            change: () => this._scrollToPosition(target.pos, this._currentHeight),
        });
    }

    tick(timestamp: number): void {
        this._timeline?.tick(timestamp);
    }

    override onLayout(layout: ComputedLayout): void {
        super.onLayout(layout);
        if (layout.height !== this._currentHeight) {
            const mask = this._itemContainer.mask as Graphics;
            mask.clear();
            mask.drawRect(0, 0, layout.width, layout.height);
            this._scrollToPosition(this._currentPos, layout.height);
            this._currentHeight = layout.height;
        }
    }

    private _scrollToPosition(pos: number, height: number) {
        if (isNaN(height) || this._items.length === 0) {
            return;
        }
        const max = this.getMaxScrollPosition(height);
        pos = clamp(pos, max, 0);
        const [ firstIndex, lastIndex ] = this.getPositionItemRange(pos, height);
        const [ currentFirstIndex, currentLastIndex ] = this.getPositionItemRange(this._currentPos, this._currentHeight);
        // Cull existing items that have moved out of bounds
        for (let i = currentFirstIndex; i <= currentLastIndex; i++) {
            if (i in this._renderedItems && (i < firstIndex || i > lastIndex)) {
                this._renderedItems[i].destroy({ children: true });
                delete this._renderedItems[i];
            }
        }
        // Add new items if needed and adjust item positions
        const offset = -(pos % this._itemHeight);
        for (let i = firstIndex; i <= lastIndex; i++) {
            const renderedItem = this.getRenderedItem(i);
            renderedItem.layout.top = offset;
            if (i < currentFirstIndex) {
                this._itemContainer.addChildAt(renderedItem, i - firstIndex);
            } else if (i > currentLastIndex) {
                this._itemContainer.addChild(renderedItem);
            }
        }

        this._currentPos = pos;
    }

    private getMaxScrollPosition(height: number) {
        return Math.max((this._items.length * this._itemHeight) - height, 0);
    }

    private getPositionItemRange(pos: number, height: number): [number, number] {
        return [
            Math.max(0, Math.floor(pos / this._itemHeight)),
            Math.min(this._items.length, Math.ceil((pos + height) / this._itemHeight)) - 1,
        ];
    }

    private getRenderedItem(index: number): DisplayObject {
        return index in this._renderedItems
            ? this._renderedItems[index]
            : this._renderedItems[index] = this._itemRenderer(this._items[index]);
    }
}
