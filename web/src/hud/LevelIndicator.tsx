import { urandom } from "@wuspy/asteroids-core";
import { createSignal } from "solid-js";
import { onTick, useApp } from "../AppContext";
import { TextProps } from "../solid-pixi";

const MAX_DIGITS = 3;
const ANIMATION_DURATION = 1;

const CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export type LevelIndicatorProps = Omit<TextProps, "text" | "style">;

export const LevelIndicator = (props: LevelIndicatorProps) => {
    const { game, theme } = useApp();
    const [text, setText] = createSignal("");

    let lastLevel = -1;
    let countdown = 0;

    onTick("app", (timestamp, elapsed) => {
        if (game.state.level !== lastLevel) {
            countdown = ANIMATION_DURATION;
            lastLevel = game.state.level;
        } else if (countdown) {
            let text = "LVL ";
            countdown = Math.max(0, countdown - elapsed);
            if ((countdown * 1000) % 50 < 25) {
                for (let i = 0; i < MAX_DIGITS; i++) {
                    if ((ANIMATION_DURATION - countdown) * MAX_DIGITS / ANIMATION_DURATION >= i + 1) {
                        text += lastLevel.toFixed().padStart(MAX_DIGITS, "0")[i];
                    } else {
                        text += CHARS[urandom(0, CHARS.length - 1)];
                    }
                }
                setText(text);
            }
        }
    });

    return <text
        {...props}
        text={text()}
        style:fontSize={28}
        style:fill={theme().foregroundColor}
    />;
}
