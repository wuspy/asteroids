import { Point, Rectangle } from "@pixi/core";
import { Container, DisplayObject, DisplayObjectEvents } from "@pixi/display";
import { EventBoundary, FederatedPointerEvent, FederatedWheelEvent } from "@pixi/events";
import { SmoothGraphics } from "@pixi/graphics-smooth";
import { clamp, lineSegmentLength } from "@wuspy/asteroids-core";
import { For, JSX, Setter, createMemo, createRenderEffect, createSignal, onCleanup, onMount } from "solid-js";
import { onTick, useApp } from "../AppContext";
import { drawContainerBackground } from "../layout";
import { ContainerProps } from "../solid-pixi";
import { LIST_BACKGROUND } from "./theme";

const SCROLL_CAPTURE_THRESHOLD = 10;

const deriveNormalizedWheelDelta = (e: WheelEvent): number => {
    if (e.detail) {
        if ((e as any).wheelDelta) {
            return (e as any).wheelDelta / e.detail / 40 * (e.detail > 0 ? 1 : -1); // Opera
        } else {
            return -e.detail / 3; // Firefox
        }
    } else {
        return (e as any).wheelDelta / 120; // IE,Safari,Chrome
    }
};

export interface VirtualizedListActions {
    scrollToPosition: (pos: number, blocking: boolean) => void;
    scrollToPositionImmediate: (pos: number) => void;
    scrollToIndex: (index: number, blocking: boolean, middle?: boolean) => void;
    scrollToIndexImmediate: (index: number, middle?: boolean) => void;
}

export interface VirtualizedListProps<Data> extends Omit<ContainerProps, "children"> {
    children: (props: { data: Data, index: number }) => JSX.Element;
    data: readonly Data[];
    itemHeight: number;
    overscroll?: number;
    actions?: Setter<VirtualizedListActions>;
}

export const VirtualizedList = <Data extends any>(props: VirtualizedListProps<Data>) => {
    const { renderer } = useApp();
    let root!: Container;
    let itemContainer!: Container;
    let mask!: SmoothGraphics;
    const eventBoundary = new EventBoundary();

    let pointerDownAt: Point | undefined = undefined;
    let scrollCaptured = false;
    // eslint-disable-next-line solid/reactivity
    let targetPosition = -(props.overscroll || 0);
    const [isBlockingMove, setIsBlockingMove] = createSignal(false);
    // eslint-disable-next-line solid/reactivity
    const [position, setPosition] = createSignal(-(props.overscroll || 0));
    const [height, setHeight] = createSignal(0);

    const maxScrollPosition = createMemo(() => Math.max(Math.ceil((props.data.length * props.itemHeight - height() + (props.overscroll || 0)) / props.itemHeight) * props.itemHeight, 0));

    // eslint-disable-next-line solid/reactivity
    onTick("app", (timestamp, elapsed) => {
        const diff = targetPosition - position();
        if (diff) {
            setPosition(Math.abs(diff) < 1 ? targetPosition : position() + diff * elapsed * 15);
        } else if (isBlockingMove()) {
            setIsBlockingMove(false);
        }
    });

    const hitTest = (x: number, y: number): DisplayObject | undefined => {
        itemContainer.interactiveChildren = true;
        eventBoundary.rootTarget = itemContainer;
        const hit = eventBoundary.hitTest(x, y);
        itemContainer.interactiveChildren = false;
        return hit;
    }

    const proxyInteraction = (name: keyof DisplayObjectEvents, e: FederatedPointerEvent): DisplayObject | undefined => {
        const hit = hitTest(e.globalX, e.globalY);
        hit?.emit(name, e);
        return hit;
    };

    const scrollToPositionImmediate = (pos: number) => {
        if (isNaN(height()) || props.data.length === 0) {
            return;
        }
        pos = clamp(pos, maxScrollPosition(), -(props.overscroll || 0));
        targetPosition = pos;
        setPosition(pos);
    };

    const scrollToPosition = (pos: number, blocking: boolean) => {
        if (isNaN(height()) || props.data.length === 0 || (!blocking && isBlockingMove())) {
            return;
        }
        targetPosition = clamp(pos, maxScrollPosition(), -(props.overscroll || 0));
        setIsBlockingMove(blocking);
    };

    const getIndexPosition = (index: number, middle?: boolean): number => {
        if (middle) {
            return getIndexPosition(index - Math.round(height() / props.itemHeight / 2) + 1, false);
        } else {
            return index * props.itemHeight;
        }
    }

    const scrollToIndexImmediate = (index: number, middle?: boolean) =>
        scrollToPositionImmediate(getIndexPosition(index, middle));

    const scrollToIndex = (index: number, blocking: boolean, middle?: boolean) =>
        scrollToPosition(getIndexPosition(index, middle), blocking);

    createRenderEffect(() => {
        if (props.actions) {
            props.actions({
                scrollToPosition,
                scrollToIndexImmediate,
                scrollToIndex,
                scrollToPositionImmediate,
            });
        }
    });

    const onWheel = (e: FederatedWheelEvent) => {
        const ih = props.itemHeight;
        const delta = deriveNormalizedWheelDelta(e.nativeEvent as WheelEvent);
        scrollToPosition(Math.floor((targetPosition - (delta * ih)) / ih) * ih, false);
    };

    const onPointerdown = (e: FederatedPointerEvent) => {
        pointerDownAt = e.global.clone();
        proxyInteraction("pointerdown", e);
    };

    const _pointerup = () => {
        if (scrollCaptured) {
            scrollCaptured = false;
            // Align closest item with top of list
            if (props.overscroll && position() < -props.overscroll / 2) {
                scrollToPosition(-props.overscroll, false);
            } else {
                scrollToIndex(Math.round(position() / props.itemHeight), false);
            }
        }
        pointerDownAt = undefined;
    };

    const onPointerup = (e: FederatedPointerEvent) => {
        proxyInteraction("pointerup", e);
        if (!scrollCaptured) {
            proxyInteraction("pointertap", e);
        }
        _pointerup();
    };

    const onPointerupoutside = (e: FederatedPointerEvent) => {
        proxyInteraction("pointerupoutside", e);
        _pointerup();
    };

    const onPointermove = (e: PointerEvent) => {
        if (pointerDownAt) {
            if (!scrollCaptured && Math.abs(
                lineSegmentLength([pointerDownAt, { x: e.offsetX, y: e.offsetY }])
            ) > SCROLL_CAPTURE_THRESHOLD) {
                scrollCaptured = true;
            }
            if (scrollCaptured) {
                scrollToPositionImmediate(position() + (pointerDownAt.y - e.offsetY) / root.worldTransform.d);
                pointerDownAt.set(e.offsetX, e.offsetY);
            }
        }
        const hit = hitTest(e.offsetX, e.offsetY);
        root.cursor = (hit?.interactive ? hit.cursor : null) || "auto";
    };

    // As of pixi v7 move events are local, so this must be bound to the canvas to allow touch scrolling
    onMount(() => renderer.view.addEventListener("pointermove", onPointermove));
    onCleanup(() => renderer.view.removeEventListener("pointermove", onPointermove));

    const onLayout = (layout: Rectangle) => {
        if (layout.height !== height()) {
            mask.clear();
            drawContainerBackground(
                mask,
                {
                    ...LIST_BACKGROUND,
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
            setHeight(layout.height);
        }
    };

    const indexedItems = createMemo(() => props.data.map((data, index) => ({ data, index })));
    const start = createMemo(() => Math.max(0, Math.floor(position() / props.itemHeight)));
    const end = createMemo(() => Math.min(props.data.length, Math.ceil((position() + height()) / props.itemHeight)));

    return <container
        {...props}
        ref={root}
        flexContainer
        eventMode={isBlockingMove() ? "auto" : "static"}
        backgroundStyle={LIST_BACKGROUND}
        on:layout={onLayout}
        on:pointerup={onPointerup}
        on:pointerupoutside={onPointerupoutside}
        on:pointerdown={onPointerdown}
        on:wheel={onWheel}
    >
        <graphics ref={mask} yg:excluded />
        <container
            ref={itemContainer}
            mask={mask}
            interactiveChildren={false}
            flexContainer
            yg:flexDirection="column"
            yg:position="absolute"
            yg:top={position() > 0 ? -position() % props.itemHeight : -position()}
            yg:left={0}
            yg:right={0}
        >
            <For each={indexedItems().slice(start(), end())}>
                {props.children}
            </For>
        </container>
    </container>;
};
