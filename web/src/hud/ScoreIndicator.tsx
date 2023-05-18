import { createSignal } from "solid-js";
import { onGameEvent, useApp } from "../AppContext";
import { ContainerBackgroundShape } from "../layout";
import { ContainerProps } from "../solid-pixi";
import { ScoreText, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR } from "../ui";

export type ScoreIndicatorProps = ContainerProps;

export const ScoreIndicator = (props: ScoreIndicatorProps) => {
    const { game } = useApp();
    const [currentScore, setCurrentScore] = createSignal(game.state.score);

    onGameEvent("scoreChanged", setCurrentScore);
    onGameEvent("reset", () => setCurrentScore(0));

    return (
        <container
            {...props}
            interactiveChildren={false}
            flexContainer
            yg:paddingX={12}
            yg:paddingY={8}
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
            <ScoreText animate score={currentScore()} zeroAlpha={0.25} style={{ fontSize: 48 }} yg:marginBottom={-2} />
        </container>
    );
};
