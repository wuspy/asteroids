import { ComponentProps, useMemo, useRef } from "react"
import { UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "../ui";
import { ContainerBackgroundShape } from "../layout";
import { LIVES } from "../../core";
import { createShipTexture } from "../gameplay";
import { Container, RefType, Sprite } from "../react-pixi";
import { Sprite as PixiSprite } from "@pixi/sprite";
import { useApp, useGameEvent } from "../AppContext";
import { PopAnimation } from "../animations";
import { TickQueue } from "../../core/engine";

const SIZE = 36;

export type LifeIndicatorProps = ComponentProps<typeof Container>;

export const LifeIndicator = (props: LifeIndicatorProps) => {
    const { queue, renderer } = useApp();
    const shipTexture = useMemo(() => createShipTexture(renderer, 3, SIZE), [renderer]);
    const indicators: React.ReactNode[] = [];
    const indicatorRefs: React.MutableRefObject<PixiSprite | null>[] = [];
    const container = useRef<RefType<typeof Container>>(null);

    for (let i = 0; i < LIVES; i++) {
        // No this doesn't break rules of hooks since LIVES is constant
        indicatorRefs.push(useRef(null));
        indicators.push(
            <Sprite
                key={i}
                ref={indicatorRefs[i]}
                texture={shipTexture}
                tint={UI_FOREGROUND_COLOR}
                anchor={0.5}
                layoutStyle={{ originAtCenter: true, paddingX: 5 }}
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
        layoutStyle={{ ...props.layoutStyle, paddingX: 14, paddingY: 12 }}
        backgroundStyle={{
            shape: ContainerBackgroundShape.Rectangle,
            cornerRadius: 12,
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
    constructor(queue: TickQueue, source: PixiSprite) {
        super({
            queue,
            texture: source.texture,
            scale: 3,
            duration: 250,
        });
        this.anchor.set(0.5);
        this.alpha = 0.8;
        this.tint = UI_FOREGROUND_COLOR;
        this.layout.excluded = true;
        this.position.copyFrom(source);
    }
}
