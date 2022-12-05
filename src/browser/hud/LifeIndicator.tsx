import { ComponentProps, useRef } from "react"
import { UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "../ui";
import { ContainerBackgroundShape } from "../layout";
import { LIVES } from "../../core";
import { createShipGeometry } from "../gameplay";
import { Container, Graphics, RefType } from "../react-pixi";
import { useApp, useGameEvent } from "../AppContext";
import { PopAnimation } from "../animations";
import { TickQueue } from "../../core/engine";

const SIZE = 36;

export type LifeIndicatorProps = ComponentProps<typeof Container>;

const baseIndicator = createShipGeometry(UI_FOREGROUND_COLOR, 3, SIZE).geometry;

export const LifeIndicator = (props: LifeIndicatorProps) => {
    const { queue } = useApp();
    const indicators: React.ReactNode[] = [];
    const indicatorRefs: React.MutableRefObject<RefType<typeof Graphics> | null>[] = [];
    const container = useRef<RefType<typeof Container>>(null);

    for (let i = 0; i < LIVES; i++) {
        // No this doesn't break rules of hooks since LIVES is constant
        indicatorRefs.push(useRef(null));
        indicators.push(
            <Graphics
                key={i}
                ref={indicatorRefs[i]}
                geometry={baseIndicator}
                cacheAsBitmap
                layoutStyle={{ originAtCenter: true, paddingX: 4 }}
            />
        );
    }

    useGameEvent("livesChanged", (lives) => {
        for (let i = 0; i < LIVES; i++) {
            const indicator = indicatorRefs[i].current!;
            if (i < LIVES - lives && indicator.alpha !== 0.25) {
                indicator.alpha = 0.25;
                container.current!.addChild(new LifeAnimation(queue, indicator));
            } else if (i >= LIVES - lives && indicator.alpha !== 1) {
                indicator.alpha = 1;
                container.current!.addChild(new LifeAnimation(queue, indicator));
            }
        }
    });

    useGameEvent("reset", () => {
        for (const { current: indicator } of indicatorRefs) {
            indicator!.alpha = 1;
        }
    });

    return <Container
        {...props}
        ref={container}
        flexContainer
        interactiveChildren={false}
        layoutStyle={{ ...props.layoutStyle, paddingX: 14, paddingY: 12}}
        backgroundStyle={{
            shape: ContainerBackgroundShape.Rectangle,
            cornerRadius: 12,
            cacheAsBitmap: true,
            fill: {
                color: UI_BACKGROUND_COLOR,
                alpha: UI_BACKGROUND_ALPHA,
                smooth: true,
            },
        }}
    >
        {indicators}
    </Container>
}

class LifeAnimation extends PopAnimation {
    constructor(queue: TickQueue, source: RefType<typeof Graphics>) {
        const target = source.clone();
        target.cacheAsBitmap = true;
        target.alpha = 0.8;
        super({
            queue,
            target,
            scale: 3,
            duration: 250,
        });
        this.layout.excluded = true;
        this.position.copyFrom(source);
    }
}
