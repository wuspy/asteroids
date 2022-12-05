import { ComponentProps, useLayoutEffect, useMemo, useRef } from "react";
import { Container, RefType, Text } from "../react-pixi";
import { ITextStyle, TextStyle, Text as PixiText } from "@pixi/text";
import "@pixi/mixin-cache-as-bitmap";
import { TickQueue } from "../../core/engine";
import { PopAnimation } from "../animations";
import { useApp } from "../AppContext";
import { Sprite } from "@pixi/sprite";

const DIGITS = 7;

export interface ScoreTextProps extends ComponentProps<typeof Container> {
    animate?: boolean;
    score: number;
    zeroAlpha: number;
    style?: TextStyle | Partial<ITextStyle>;
}

export const ScoreText = ({ animate, score, zeroAlpha, style, ...props }: ScoreTextProps) => {
    const scoreString = score.toFixed();
    const { queue } = useApp();
    const container = useRef<RefType<typeof Container>>(null);
    const text = useRef<RefType<typeof Text>>(null);
    const zeros = useMemo(() => Array(DIGITS - scoreString.length).fill("0").join(""), [scoreString.length]);

    useLayoutEffect(() => {
        if (animate && score > 0) {
            // The reason we need to update the layout manually here is so we can position the animation
            // in case the number of digits, and therefore the score position, has changed
            container.current!.layout.update();
            container.current!.addChild(new ScoreAnimation(queue, text.current!));
        }
    }, [score]);

    return (
        <Container {...props} ref={container} flexContainer>
            <Text text={zeros} style={style} alpha={zeroAlpha} visible={!!zeros} />
            <Text ref={text} text={scoreString} style={style} />
        </Container>
    );
}

class ScoreAnimation extends PopAnimation {
    constructor(queue: TickQueue, source: PixiText) {
        const sprite = new Sprite(source.texture);
        sprite.anchor.set(0.5);
        sprite.alpha = 0.8;

        super({
            queue,
            target: sprite,
            scale: 2,
            duration: 250,
        });
        this.layout.excluded = true;
        this.position.set(
            source.x + source.width / 2,
            source.y + source.height / 2
        );
    }
}
