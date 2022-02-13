import { Container, DisplayObject } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { clamp, TickQueue, lineSegmentLength } from "@core/engine";
import anime from "animejs";
import { TickableContainer } from "./TickableContainer";
import { ComputedLayout, drawContainerBackground, FlexDirection, PositionType } from "../layout";
import { LIST_BACKGROUND } from "./theme";
import { InteractionEvent, InteractionManager, } from "@pixi/interaction";
import { Point } from "@pixi/math";
import { Renderer } from "@pixi/core";

export interface VirtualizedListItem<Data> extends DisplayObject {
    setListItemData(data: Data, index: number, selected: boolean): void;
    setListItemSelected(selected: boolean): void;
}

export type ItemFactory<Data, Item extends VirtualizedListItem<Data>> = () => Item;

const SCROLL_CAPTURE_THRESHOLD = 10;

export class VirtualizedList<Data, Item extends VirtualizedListItem<Data>> extends TickableContainer {
    private readonly _itemContainer: Container;
    private readonly _itemFactory: ItemFactory<Data, Item>;
    private readonly _items: { [Key in number]: Item };
    private _selections: readonly number[];
    private _itemPool: Item[];
    private readonly _data: readonly Data[];
    private readonly _itemHeight: number;
    private _pointerDownAt?: Point;
    private _scrollCaptured: boolean;
    private _timeline?: anime.AnimeInstance;
    private _currentPos: number;
    private _targetPos: number;
    private _currentHeight: number;
    private _lastTimestamp: number;
    private _interactionManager?: InteractionManager;
    private _overscroll: number;

    constructor(params: {
        queue: TickQueue,
        data: readonly Data[],
        itemFactory: ItemFactory<Data, Item>,
        itemHeight: number,
        overscroll?: number,
    }) {
        super(params.queue);
        this._items = {};
        this._selections = [];
        this._itemPool = [];
        this._data = params.data;
        this._overscroll = params.overscroll || 0;
        this._currentPos = -this._overscroll;
        this._targetPos = -this._overscroll;
        this._currentHeight = 0;
        this._lastTimestamp = 0;
        this._itemFactory = params.itemFactory;
        this._itemHeight = params.itemHeight;
        this.interactive = true;
        this.scrollInteractive = true;
        this.flexContainer = true;
        this.backgroundStyle = LIST_BACKGROUND;
        this._scrollCaptured = false;

        this._itemContainer = new Container();
        this._itemContainer.flexContainer = true;
        this._itemContainer.interactiveChildren = false;
        this._itemContainer.layout.style({
            flexDirection: FlexDirection.Column,
            position: PositionType.Absolute,
            top: 0,
            left: 0,
            right: 0,
        });
        this.addChild(this._itemContainer);

        this.on("mousewheel", (value: number) => {
            this.scrollToPosition(Math.floor((this._targetPos - (value * this._itemHeight)) / this._itemHeight) * this._itemHeight);
        });
        this.on("pointerdown", (e: InteractionEvent) => {
            this._pointerDownAt = e.data.global.clone();
            this.proxyInteraction("pointerdown", e);
        });
        const pointerUp = () => {
            if (this._scrollCaptured) {
                this._scrollCaptured = false;
                // Align closest item with top of list
                this.scrollToIndex(Math.round(this._currentPos / this._itemHeight));
            }
            this._pointerDownAt = undefined;
        };
        this.on("pointerup", (e: InteractionEvent) => {
            this.proxyInteraction("pointerup", e);
            if (!this._scrollCaptured) {
                this.proxyInteraction("pointertap", e);
            }
            pointerUp();
        });
        this.on("pointerupoutside", (e: InteractionEvent) => {
            this.proxyInteraction("pointerupoutside", e);
            pointerUp();
        });
        this.on("pointermove", (e: InteractionEvent) => {
            if (this._pointerDownAt) {
                if (!this._scrollCaptured
                    && Math.abs(lineSegmentLength([this._pointerDownAt, e.data.global])) > SCROLL_CAPTURE_THRESHOLD
                ) {
                    this._scrollCaptured = true;
                    this._timeline = undefined;
                }
                if (this._scrollCaptured) {
                    this._scrollToPosition(this._currentPos + (this._pointerDownAt.y - e.data.global.y), this._currentHeight);
                    this._pointerDownAt.copyFrom(e.data.global);
                }
            }
            const hit = this.proxyInteraction("pointermove", e);
            this.cursor = hit ? hit.cursor : "auto";
        });

        // We need a mask, otherwise pixi will render anything we draw, anywhere, regardless of layout bounds
        const mask = this.mask = new Graphics();
        mask.layout.excluded = true;
        this.addChild(mask);
    }

    scrollToIndex(index: number) {
        this.scrollToPosition(index * this._itemHeight);
    }

    scrollToPosition(pos: number) {
        this._targetPos = pos = clamp(pos, this.getMaxScrollPosition(this._currentHeight), -this._overscroll);
        const target = { pos: this._currentPos };
        this._timeline = anime.timeline({
            autoplay: false,
            easing: "easeOutQuart",
            complete: () => {
                this._timeline = undefined;
                this._scrollToPosition(this._targetPos, this._currentHeight);
            },
        }).add({
            targets: target,
            pos: this._targetPos,
            duration: 250,
            change: () => this._scrollToPosition(target.pos, this._currentHeight),
        });
        this._timeline.tick(this._lastTimestamp);
    }

    get items(): Readonly<{ [Key in number]: Item }> {
        return this._items;
    }

    get itemPool(): readonly Item[] {
        return this._itemPool;
    }

    set selections(selections: readonly number[]) {
        for (const index of this.selections) {
            if (index in this._items) {
                this._items[index].setListItemSelected(false);
            }
        }
        for (const index of selections) {
            if (index in this._items) {
                this._items[index].setListItemSelected(true);
            }
        }
        this._selections = selections;
    }

    get selections(): readonly number[] {
        return this._selections;
    }

    tick(timestamp: number): void {
        this._lastTimestamp = timestamp;
        this._timeline?.tick(timestamp);
    }

    override onLayout(layout: ComputedLayout): void {
        super.onLayout(layout);
        if (layout.height !== this._currentHeight) {
            const mask = this.mask as Graphics;
            mask.clear();
            drawContainerBackground(
                mask,
                {
                    ...this.backgroundStyle!,
                    fill: {
                        color: 0xffffff,
                    },
                    stroke: {
                        width: 2,
                        color: 0xffffff,
                        alignment: 0,
                    },
                },
                layout.width,
                layout.height,
            );
            this._scrollToPosition(this._currentPos, layout.height);
            this._currentHeight = layout.height;
        }
    }

    override render(renderer: Renderer): void {
        this._interactionManager = renderer.plugins.interaction as InteractionManager;
        super.render(renderer);
    }

    private proxyInteraction(name: string, e: InteractionEvent): DisplayObject | undefined {
        this._itemContainer.interactiveChildren = true;
        const hit = this._interactionManager?.hitTest(e.data.global, this._itemContainer);
        hit?.emit(name, e);
        this._itemContainer.interactiveChildren = false;
        return hit;
    }

    private _scrollToPosition(pos: number, height: number) {
        if (isNaN(height) || this._data.length === 0) {
            return;
        }
        pos = clamp(pos, this.getMaxScrollPosition(height), -this._overscroll);
        const [ firstIndex, lastIndex ] = this.getPositionItemRange(pos, height);
        const [ currentFirstIndex, currentLastIndex ] = this.getPositionItemRange(this._currentPos, this._currentHeight);
        // Cull existing items that have moved out of bounds
        for (let i = currentFirstIndex; i <= currentLastIndex; ++i) {
            if (i in this._items && (i < firstIndex || i > lastIndex)) {
                const item = this._items[i];
                this._itemPool.push(this._itemContainer.removeChild(item));
                delete this._items[i];
            }
        }
        // Add new items if needed and adjust item positions
        this._itemContainer.layout.top = pos > 0 ? -pos % this._itemHeight : -pos;
        for (let i = firstIndex; i < currentFirstIndex; ++i) {
            this._itemContainer.addChildAt(this.getItem(i), i - firstIndex);
        }
        for (let i = Math.max(currentLastIndex + 1, 0); i <= lastIndex; ++i) {
            this._itemContainer.addChild(this.getItem(i));
        }

        this._currentPos = pos;
    }

    private getMaxScrollPosition(height: number) {
        return Math.max(Math.ceil((this._data.length * this._itemHeight - height + this._overscroll) / this._itemHeight) * this._itemHeight, 0);
    }

    private getPositionItemRange(pos: number, height: number): [number, number] {
        return [
            Math.max(0, Math.floor(pos / this._itemHeight)),
            Math.min(this._data.length, Math.ceil((pos + height) / this._itemHeight)) - 1,
        ];
    }

    private getItem(index: number): Item {
        if (index in this._items) {
            return this._items[index];
        } else if (this._itemPool.length) {
            const item = this._items[index] = this._itemPool.pop()!;
            item.setListItemData(this._data[index], index, this._selections.includes(index));
            return item;
        } else {
            const item = this._items[index] = this._itemFactory();
            item.setListItemData(this._data[index], index, this._selections.includes(index));
            return item;
        }
    }
}
