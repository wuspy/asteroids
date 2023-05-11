import { Container } from "@pixi/display";
import { Sprite } from "@pixi/sprite";
import { LIVES, TickQueue } from "@wuspy/asteroids-core";
import { JSX, createSignal } from "solid-js";
import { onGameEvent, useApp } from "../AppContext";
import { PopAnimation } from "../animations";
import { createShipTexture } from "../gameplay";
import { ContainerBackgroundShape } from "../layout";
import { ContainerProps } from "../solid-pixi";
import { UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "../ui";

const SIZE = 36;

export type LifeIndicatorProps = ContainerProps;

export const LifeIndicator = (props: LifeIndicatorProps) => {
    const { queue, renderer } = useApp();
    const [lives, setLives] = createSignal(LIVES);

    const shipTexture = createShipTexture(renderer, 3, SIZE);

    let container!: Container;
    const children: JSX.Element[] = [];
    const indicators: Sprite[] = [];

    for (let i = LIVES - 1; i >= 0; i--) {
        children.push(
            <sprite
                ref={indicators[i]}
                texture={shipTexture}
                tint={UI_FOREGROUND_COLOR}
                alpha={lives() > i ? 1 : 0.25}
                anchor={0.5}
                yg:originAtCenter
                yg:paddingX={5}
            />
        );
    }

    onGameEvent("livesChanged", lives => {
        setLives(lives);
        container.addChild(new LifeAnimation(queue, indicators[lives]));
    });

    onGameEvent("reset", () => setLives(LIVES));

    return (
        <container
            {...props}
            ref={container}
            interactiveChildren={false}
            flexContainer
            yg:paddingX={14}
            yg:paddingY={12}
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
            {children}
        </container>
    );
}

class LifeAnimation extends PopAnimation {
    constructor(queue: TickQueue, source: Sprite) {
        super({
            queue,
            texture: source.texture,
            scale: 3,
            duration: 250,
        });
        this.anchor.set(0.5);
        this.alpha = 0.8;
        this.tint = UI_FOREGROUND_COLOR;
        this.layout.style.excluded = true;
        this.position.copyFrom(source);
    }
}
