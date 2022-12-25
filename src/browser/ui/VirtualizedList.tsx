import { Point } from "@pixi/core";
import { EventBoundary, FederatedPointerEvent, FederatedWheelEvent } from "@pixi/events";
import { DisplayObject, DisplayObjectEvents } from "@pixi/display";
import { clamp, lineSegmentLength } from "../../core/engine";
import anime from "animejs";
import { ComputedLayout, drawContainerBackground, FlexDirection, PositionType } from "../layout";
import { LIST_BACKGROUND } from "./theme";
import { Container, ContainerProps, Graphics, RefType } from "../react-pixi";
import { ReactNode, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useApp, useTick } from "../AppContext";

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

export interface VirtualizedListProps<Data> extends ContainerProps {
    itemRenderer: (data: Data, index: number) => ReactNode;
    data: readonly Data[];
    itemHeight: number;
    overscroll?: number;
    actions?: React.Ref<VirtualizedListActions>; // forwardRef doesn't play nice with generic components
}

export const VirtualizedList = <Data extends any>({
    itemRenderer,
    data,
    itemHeight,
    overscroll = 0,
    actions,
    ...props
}: VirtualizedListProps<Data>) => {
    const { renderer, dpr } = useApp();
    const root = useRef<RefType<typeof Container>>(null);
    const itemContainer = useRef<RefType<typeof Container>>(null);
    const mask = useRef<RefType<typeof Graphics>>(null);
    const eventBoundary = useMemo(() => new EventBoundary(), []);

    const pointerDownAt = useRef<Point>();
    const scrollCaptured = useRef<boolean>(false);
    const targetPosition = useRef(-overscroll);
    const lastTimestamp = useRef(0);
    const [isBlockingMove, setIsBlockingMove] = useState(false);

    const [position, setPosition] = useState(-overscroll);
    const [height, setHeight] = useState(0);
    const anim = useRef<anime.AnimeTimelineInstance>();

    const maxScrollPosition = useMemo(
        () => Math.max(Math.ceil((data.length * itemHeight - height + overscroll) / itemHeight) * itemHeight, 0),
        [data.length, itemHeight, height, overscroll],
    );

    useLayoutEffect(() => {
        root.current!.mask = mask.current!;
    }, []);

    useTick("app", (timestamp) => {
        lastTimestamp.current = timestamp;
        anim.current?.tick(timestamp);
    });

    const hitTest = (x: number, y: number): DisplayObject | undefined => {
        itemContainer.current!.interactiveChildren = true;
        eventBoundary.rootTarget = itemContainer.current!;
        const hit = eventBoundary.hitTest(x, y);
        itemContainer.current!.interactiveChildren = false;
        return hit;
    }

    const proxyInteraction = (name: keyof DisplayObjectEvents, e: FederatedPointerEvent): DisplayObject | undefined => {
        const hit = hitTest(e.globalX, e.globalY);
        hit?.emit(name, e);
        return hit;
    };

    const scrollToPositionImmediate = (pos: number) => {
        if (isNaN(height) || data.length === 0) {
            return;
        }
        pos = clamp(pos, maxScrollPosition, -overscroll);
        targetPosition.current = pos;
        anim.current = undefined;
        setPosition(pos);
    };

    const scrollToPosition = (pos: number, blocking: boolean) => {
        if (isNaN(height) || data.length === 0 || (!blocking && isBlockingMove)) {
            return;
        }
        targetPosition.current = clamp(pos, maxScrollPosition, -overscroll);
        if (position !== targetPosition.current) {
            setIsBlockingMove(blocking);
            const target = { position };
            anim.current = anime.timeline({
                autoplay: false,
                easing: "easeOutQuart",
                complete: () => {
                    anim.current = undefined;
                    setIsBlockingMove(false);
                    setPosition(targetPosition.current);
                },
            }).add({
                targets: target,
                position: targetPosition.current,
                duration: blocking ? Math.sqrt(Math.abs(position - targetPosition.current)) * 36 : 250,
                change: () => setPosition(target.position),
            });
            anim.current.tick(lastTimestamp.current);
        }
    };

    const getIndexPosition = (index: number, middle?: boolean): number => {
        if (middle) {
            return getIndexPosition(index - Math.round(height / itemHeight / 2) + 1, false);
        } else {
            return index * itemHeight;
        }
    }

    const scrollToIndexImmediate = (index: number, middle?: boolean) =>
        scrollToPositionImmediate(getIndexPosition(index, middle));

    const scrollToIndex = (index: number, blocking: boolean, middle?: boolean) =>
        scrollToPosition(getIndexPosition(index, middle), blocking);

    useImperativeHandle(actions, () => ({
        scrollToPosition,
        scrollToIndexImmediate,
        scrollToIndex,
        scrollToPositionImmediate,
    }));

    const onWheel = (e: FederatedWheelEvent) => {
        const delta = deriveNormalizedWheelDelta(e.nativeEvent as WheelEvent);
        scrollToPosition(Math.floor((targetPosition.current - (delta * itemHeight)) / itemHeight) * itemHeight, false);
    };

    const onPointerdown = (e: FederatedPointerEvent) => {
        pointerDownAt.current = e.global.clone();
        proxyInteraction("pointerdown", e);
    };

    const _pointerup = () => {
        if (scrollCaptured.current) {
            scrollCaptured.current = false;
            // Align closest item with top of list
            if (overscroll && position < -overscroll / 2) {
                scrollToPosition(-overscroll, false);
            } else {
                scrollToIndex(Math.round(position / itemHeight), false);
            }
        }
        pointerDownAt.current = undefined;
    };

    const onPointerup = (e: FederatedPointerEvent) => {
        proxyInteraction("pointerup", e);
        if (!scrollCaptured.current) {
            proxyInteraction("pointertap", e);
        }
        _pointerup();
    };

    const onPointerupoutside = (e: FederatedPointerEvent) => {
        proxyInteraction("pointerupoutside", e);
        _pointerup();
    };

    const onPointermove = (e: PointerEvent) => {
        if (pointerDownAt.current) {
            if (!scrollCaptured.current
                && Math.abs(lineSegmentLength([pointerDownAt.current, { x: e.offsetX, y: e.offsetY }])) > SCROLL_CAPTURE_THRESHOLD
            ) {
                scrollCaptured.current = true;
                anim.current = undefined;
            }
            if (scrollCaptured.current) {
                scrollToPositionImmediate(position + (pointerDownAt.current.y - e.offsetY) / root.current!.worldTransform.d);
                pointerDownAt.current.set(e.offsetX, e.offsetY);
            }
        }
        const hit = hitTest(e.offsetX, e.offsetY);
        root.current!.cursor = (hit?.interactive ? hit.cursor : null) || "auto";
    };

    useLayoutEffect(() => {
        // As of pixi v7 move events are local, so this must be bound to the canvas to allow touch scrolling
        renderer.view.addEventListener("pointermove", onPointermove);
        return () => renderer.view.removeEventListener("pointermove", onPointermove);
    }, [onPointermove, renderer.view]);

    const onLayout = (layout: ComputedLayout) => {
        if (layout.height !== height) {
            mask.current!.clear();
            drawContainerBackground(
                mask.current!,
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

    const items = [];
    const [start, end] = [
        Math.max(0, Math.floor(position / itemHeight)),
        Math.min(data.length, Math.ceil((position + height) / itemHeight)),
    ];
    for (let i = start; i < end; ++i) {
        items.push(itemRenderer(data[i], i));
    }

    return <Container
        {...props}
        ref={root}
        flexContainer
        interactive={!isBlockingMove}
        backgroundStyle={LIST_BACKGROUND}
        on:layout={onLayout}
        on:pointerup={onPointerup}
        on:pointerupoutside={onPointerupoutside}
        on:pointerdown={onPointerdown}
        on:wheel={onWheel}
    >
        <Container
            ref={itemContainer}
            flexContainer
            interactiveChildren={false}
            layoutStyle={{
                flexDirection: FlexDirection.Column,
                position: PositionType.Absolute,
                top: position > 0 ? -position % itemHeight : -position,
                left: 0,
                right: 0,
            }}
        >
            {items}
        </Container>
        <Graphics ref={mask} layoutStyle={{ excluded: true }} />
    </Container>;
};
