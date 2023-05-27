import { ITextStyle, Text, TextStyle } from "@pixi/text";
import anime from "animejs";
import { createEffect, createSignal, onMount, splitProps } from "solid-js";
import { onTick } from "../AppContext";
import { ContainerProps } from "../solid-pixi";

export interface RevealTextProps extends ContainerProps {
    text: string;
    style: TextStyle | Partial<ITextStyle>;
    duration: number;
    revealed: boolean;
    initiallyRevealed?: boolean;
}

export const RevealText = (_props: RevealTextProps) => {
    const [props, childProps] = splitProps(_props, ["text", "style", "duration", "revealed", "initiallyRevealed"]);

    let text!: Text;
    let leftBracket!: Text;
    let rightBracket!: Text;

    const [anim, setAnim] = createSignal<anime.AnimeTimelineInstance>();
    // eslint-disable-next-line solid/reactivity
    let wasRevealed = props.initiallyRevealed ?? props.revealed;

    const onLayoutMeasure = () => {
        return {
            width: text.width + leftBracket.width + rightBracket.width,
            height: text.height,
        };
    };

    const getCenterline = () => leftBracket.width + text.width / 2;

    onMount(() => {
        const center = getCenterline();
        text.alpha = wasRevealed ? 1 : 0;
        text.x = leftBracket.width;
        rightBracket.x = wasRevealed ? text.width + text.x : center;
        leftBracket.x = wasRevealed ? 0 : center - leftBracket.width;
    });

    createEffect(() => {
        if (props.revealed !== wasRevealed) {
            const center = getCenterline();
            setAnim(anime.timeline({
                autoplay: false,
                duration: props.duration,
                easing: "easeOutExpo",
                complete: () => setAnim(undefined),
            }).add({
                targets: rightBracket,
                x: props.revealed ? text.width + text.x : center,
            }, 0).add({
                targets: leftBracket,
                x: props.revealed ? 0 : center - leftBracket.width,
            }, 0).add({
                targets: text,
                alpha: props.revealed ? 1 : 0,
            }, 0));

            wasRevealed = props.revealed;
        }
    });

    // eslint-disable-next-line solid/reactivity
    onTick("app", timestamp => anim()!.tick(timestamp), anim);

    return (
        <container {...childProps} flexContainer={false} onLayoutMeasure={onLayoutMeasure}>
            <text ref={text} text={` ${props.text} `} style={props.style} />
            <text ref={leftBracket} text={"["} style={props.style} />
            <text ref={rightBracket} text={"]"} style={props.style} />
        </container>
    );
};
