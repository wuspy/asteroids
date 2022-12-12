import { ComponentProps, useState } from "react"
import { FONT_STYLE, ScoreText, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR } from "../ui";
import { ContainerBackgroundShape } from "../layout";
import { Container } from "../react-pixi";
import { useApp, useGameEvent } from "../AppContext";

export type ScoreIndicatorProps = ComponentProps<typeof Container>;

export const ScoreIndicator = (props: ScoreIndicatorProps) => {
    const { game } = useApp();
    const [currentScore, setCurrentScore] = useState(game.state.score);

    useGameEvent("scoreChanged", (score) => {
        setCurrentScore(score);
    });

    useGameEvent("reset", () => setTimeout(() => setCurrentScore(0)));

    return <Container
        {...props}
        flexContainer
        interactiveChildren={false}
        layoutStyle={{ ...props.layoutStyle, paddingX: 12, paddingY: 8 }}
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
        <ScoreText animate score={currentScore} zeroAlpha={0.25} style={{ ...FONT_STYLE, fontSize: 48 }} />
    </Container>
};
