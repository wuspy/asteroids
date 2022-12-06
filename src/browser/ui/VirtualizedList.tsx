import { Container as PixiContainer, DisplayObject } from "@pixi/display";
import { clamp, lineSegmentLength } from "../../core/engine";
import anime from "animejs";
import { ComputedLayout, drawContainerBackground, FlexDirection, PositionType } from "../layout";
import { LIST_BACKGROUND } from "./theme";
import { InteractionEvent, InteractionManager, } from "@pixi/interaction";
import { Point } from "@pixi/math";
import { Container, ContainerProps, Graphics, RefType } from "../react-pixi";
import { ReactNode, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { useTick } from "../AppContext";

const SCROLL_CAPTURE_THRESHOLD = 10;

export interface VirtualizedListActions {
    scrollToPosition: (pos: number, blocking: boolean) => void;
    scrollToPositionImmediate: (pos: number) => void;
    scrollToIndex: (index: number, blocking: boolean, middle?: boolean) => void;
    scrollToIndexImmediate: (index: number, middle?: boolean) => void;
}

export interface VirtualizedListProps<Data> extends ContainerProps {
    interactionManager: InteractionManager;
    itemRenderer: (data: Data, index: number) => ReactNode;
    data: readonly Data[];
    itemHeight: number;
    overscroll?: number;
    actions?: React.Ref<VirtualizedListActions>; // forwardRef doesn't play nice with generic components
}

export const VirtualizedList = <Data extends any>({
    interactionManager,
    itemRenderer,
    data,
    itemHeight,
    overscroll = 0,
    actions,
    ...props
}: VirtualizedListProps<Data>) => {
    const root = useRef<RefType<typeof Container>>(null);
    const itemContainer = useRef<RefType<typeof Container>>(null);
    const mask = useRef<RefType<typeof Graphics>>(null);

    const pointerDownAt = useRef<Point>();
    const scrollCaptured = useRef<boolean>(false);
    const targetPosition = useRef(-overscroll);
    const lastTimestamp = useRef(0);
    const [isBlockingMove, setIsBlockingMove] = useState(false);

    const [position, setPosition] = useState(-overscroll);
    const [height, setHeight] = useState(0);
    const anim = useRef<anime.AnimeTimelineInstance>();

    useLayoutEffect(() => {
        root.current!.mask = mask.current!;
    }, []);

    useTick("app", (timestamp) => {
        lastTimestamp.current = timestamp;
        anim.current?.tick(timestamp);
    });

    const proxyInteraction = (name: string, e: InteractionEvent): DisplayObject | undefined => {
        itemContainer.current!.interactiveChildren = true;
        const hit = interactionManager.hitTest(e.data.global, itemContainer.current!);
        hit?.emit(name, e);
        itemContainer.current!.interactiveChildren = false;
        return hit;
    };

    const getMaxScrollPosition = () =>
        Math.max(Math.ceil((data.length * itemHeight - height + overscroll) / itemHeight) * itemHeight, 0);

    const scrollToPositionImmediate = (pos: number) => {
        if (isNaN(height) || data.length === 0) {
            return;
        }
        pos = clamp(pos, getMaxScrollPosition(), -overscroll);
        targetPosition.current = pos;
        anim.current = undefined;
        setPosition(pos);
    };

    const scrollToPosition = (pos: number, blocking: boolean) => {
        if (isNaN(height) || data.length === 0 || (!blocking && isBlockingMove)) {
            return;
        }
        targetPosition.current = clamp(pos, getMaxScrollPosition(), -overscroll);
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

    const onMousewheel = (value: number) => {
        scrollToPosition(Math.floor((targetPosition.current - (value * itemHeight)) / itemHeight) * itemHeight, false);
    };

    const onPointerdown = (e: InteractionEvent) => {
        pointerDownAt.current = e.data.global.clone();
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

    const onPointerup = (e: InteractionEvent) => {
        proxyInteraction("pointerup", e);
        if (!scrollCaptured.current) {
            proxyInteraction("pointertap", e);
        }
        _pointerup();
    };

    const onPointerupoutside = (e: InteractionEvent) => {
        proxyInteraction("pointerupoutside", e);
        _pointerup();
    };

    const onPointermove = (e: InteractionEvent) => {
        if (pointerDownAt.current) {
            if (!scrollCaptured.current
                && Math.abs(lineSegmentLength([pointerDownAt.current, e.data.global])) > SCROLL_CAPTURE_THRESHOLD
            ) {
                scrollCaptured.current = true;
                anim.current = undefined;
            }
            if (scrollCaptured.current) {
                scrollToPositionImmediate(position + (pointerDownAt.current.y - e.data.global.y));
                pointerDownAt.current.copyFrom(e.data.global);
            }
        }
        const hit = proxyInteraction("pointermove", e);
        root.current!.cursor = hit ? hit.cursor : "auto";
    };

    const onLayoutChange = (layout: ComputedLayout) => {
        PixiContainer.prototype.onLayoutChange.call(root.current!, layout);
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
        scrollInteractive
        backgroundStyle={LIST_BACKGROUND}
        onLayoutChange={onLayoutChange}
        on:pointerup={onPointerup}
        on:pointerupoutside={onPointerupoutside}
        on:pointerdown={onPointerdown}
        on:pointermove={onPointermove}
        on:mousewheel={onMousewheel}
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
