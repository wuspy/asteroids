import { ITextStyle, TextStyle } from "@pixi/text";
import anime from "animejs";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Container, ContainerProps, RefType, Text } from "../react-pixi";
import { useTick } from "../AppContext";

export interface RevealTextProps extends ContainerProps {
    text: string;
    style: TextStyle | Partial<ITextStyle>;
    duration: number;
    revealed: boolean;
}

export const RevealText = ({ text, style, duration, revealed, ...props}: RevealTextProps) => {
    const textRef = useRef<RefType<typeof Text>>(null);
    const leftBracketRef = useRef<RefType<typeof Text>>(null);
    const rightBracketRef = useRef<RefType<typeof Text>>(null);
    const [anim, setAnim] = useState<anime.AnimeTimelineInstance>();
    const [wasRevealed, setWasRevealed] = useState(revealed);

    const onLayoutMeasure = () => {
        return {
            width: textRef.current!.width + leftBracketRef.current!.width + rightBracketRef.current!.width,
            height: textRef.current!.height,
        };
    };

    const getCenterline = () => leftBracketRef.current!.width + textRef.current!.width / 2;

    useLayoutEffect(() => {
        const center = getCenterline();
        textRef.current!.alpha = revealed ? 1 : 0;
        textRef.current!.x = leftBracketRef.current!.width;
        rightBracketRef.current!.x = revealed ? textRef.current!.width + textRef.current!.x : center;
        leftBracketRef.current!.x = revealed ? 0 : center - leftBracketRef.current!.width;
    }, []);

    useEffect(() => {
        if (revealed !== wasRevealed) {
            const center = getCenterline();
            setAnim(anime.timeline({
                autoplay: false,
                duration,
                easing: "easeOutExpo",
            }).add({
                targets: rightBracketRef.current!,
                x: revealed ? textRef.current!.width + textRef.current!.x : center,
            }, 0).add({
                targets: leftBracketRef.current!,
                x: revealed ? 0 : center - leftBracketRef.current!.width,
            }, 0).add({
                targets: textRef.current!,
                alpha: revealed ? 1 : 0,
            }, 0));

            setWasRevealed(revealed);
            return () => setAnim(undefined);
        }
    }, [revealed]);

    useTick("app", (timestamp) => anim!.tick(timestamp), !!anim);

    return (
        <Container {...props} flexContainer={false} onLayoutMeasure={onLayoutMeasure}>
            <Text ref={textRef} text={` ${text} `} style={style} />
            <Text ref={leftBracketRef} text={"["} style={style} />
            <Text ref={rightBracketRef} text={"]"} style={style} />
        </Container>
    );
};
