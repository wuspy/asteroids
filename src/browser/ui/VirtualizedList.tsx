import { Container as PixiContainer, DisplayObject } from "@pixi/display";
import { clamp, lineSegmentLength } from "../../core/engine";
import anime from "animejs";
import { ComputedLayout, drawContainerBackground, FlexDirection, PositionType } from "../layout";
import { LIST_BACKGROUND } from "./theme";
import { InteractionEvent, InteractionManager, } from "@pixi/interaction";
import { Point } from "@pixi/math";
import { Container, ContainerProps, Graphics, RefType } from "../react-pixi";
import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { useTick } from "../AppContext";

const SCROLL_CAPTURE_THRESHOLD = 10;

export interface VirtualizedListProps<Data> extends ContainerProps {
    interactionManager: InteractionManager;
    itemRenderer: (data: Data, index: number) => ReactNode;
    data: readonly Data[];
    itemHeight: number;
    overscroll?: number;
}

export const VirtualizedList = <Data extends any>({
    interactionManager,
    itemRenderer,
    data,
    itemHeight,
    overscroll = 0,
    ...props
}: VirtualizedListProps<Data>) => {
    const root = useRef<RefType<typeof Container>>(null);
    const itemContainer = useRef<RefType<typeof Container>>(null);
    const mask = useRef<RefType<typeof Graphics>>(null);

    const pointerDownAt = useRef<Point>();
    const scrollCaptured = useRef<boolean>(false);
    const targetPosition = useRef(0);
    const lastTimestamp = useRef(0);

    const [position, setPosition] = useState(0);
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
    }

    const getMaxScrollPosition = (height: number) =>
        Math.max(Math.ceil((data.length * itemHeight - height + overscroll) / itemHeight) * itemHeight, 0);

    const scrollToPositionImmediate = (pos: number) => {
        if (isNaN(height) || data.length === 0) {
            return;
        }
        pos = clamp(pos, getMaxScrollPosition(height), -overscroll);
        targetPosition.current = pos;
        anim.current = undefined;
        setPosition(pos);
    }

    const scrollToPosition = (pos: number) => {
        if (isNaN(height) || data.length === 0) {
            return;
        }
        targetPosition.current = clamp(pos, getMaxScrollPosition(height), -overscroll);
        if (position !== targetPosition.current) {
            const target = { position };
            anim.current = anime.timeline({
                autoplay: false,
                easing: "easeOutQuart",
                complete: () => {
                    anim.current = undefined;
                },
            }).add({
                targets: target,
                position: targetPosition.current,
                duration: 250,
                change: () => setPosition(target.position),
            });
            anim.current.tick(lastTimestamp.current);
        }
    }

    const scrollToIndexImmediate = (index: number) =>
        scrollToPositionImmediate(index * itemHeight);

    const scrollToIndex = (index: number) =>
        scrollToPosition(index * itemHeight);

    const onMousewheel = (value: number) => {
        scrollToPosition(Math.floor((targetPosition.current - (value * itemHeight)) / itemHeight) * itemHeight);
    };

    const onPointerdown = (e: InteractionEvent) => {
        pointerDownAt.current = e.data.global.clone();
        proxyInteraction("pointerdown", e);
    };

    const _pointerup = () => {
        if (scrollCaptured.current) {
            scrollCaptured.current = false;
            // Align closest item with top of list
            scrollToIndex(Math.round(position / itemHeight));
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
        interactive
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
