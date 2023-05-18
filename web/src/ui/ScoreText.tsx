import { Container } from "@pixi/display";
import { ITextStyle, Text } from "@pixi/text";
import { TickQueue } from "@wuspy/asteroids-core";
import { Show, createEffect, splitProps } from "solid-js";
import { useApp } from "../AppContext";
import { PopAnimation } from "../animations";
import { ContainerProps } from "../solid-pixi";

const DIGITS = 7;

export interface ScoreTextProps extends ContainerProps {
    animate?: boolean;
    score: number;
    zeroAlpha: number;
    style?: Partial<ITextStyle>;
}

export const ScoreText = (_props: ScoreTextProps) => {
    const [props, childProps] = splitProps(_props, ["animate", "score", "zeroAlpha", "style"]);

    const { queue } = useApp();
    let container!: Container;
    let text!: Text;
    const scoreString = () => props.score.toFixed();
    const scoreLength = () => scoreString().length;

    createEffect(() => {
        if (props.animate && props.score > 0) {
            // The reason we need to update the layout manually here is so we can position the animation
            // in case the number of digits, and therefore the score position, has changed
            container.layout.update();
            container.addChild(new ScoreAnimation(queue, text));
        }
    });

    return (
        <container {...childProps} ref={container} flexContainer>
            <Show when={DIGITS > scoreLength()}>
                <text text={Array(DIGITS - scoreLength()).fill("0").join("")} style={props.style} alpha={props.zeroAlpha} />
            </Show>
            <text ref={text} text={scoreString()} style={props.style} />
        </container>
    );
}

class ScoreAnimation extends PopAnimation {
    constructor(queue: TickQueue, source: Text) {
        super({
            queue,
            texture: source.texture,
            scale: 2,
            duration: 250,
        });
        this.anchor.set(0.5);
        this.alpha = 0.8;
        this.layout.style.excluded = true;
        this.position.set(
            source.x + source.width / 2,
            source.y + source.height / 2
        );
    }
}
