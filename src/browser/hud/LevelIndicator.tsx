import { ComponentProps, useRef } from "react";
import { urandom } from "../../core/engine";
import { RefType, Text } from "../react-pixi";
import { FONT_STYLE } from "../ui";
import { useApp, useTick } from "../AppContext";

const FONT_SIZE = 28;
const MAX_DIGITS = 3;
const ANIMATION_DURATION = 1;

const CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export type LevelIndicatorProps = Omit<ComponentProps<typeof Text>, "text" | "style" | "ref">;

export const LevelIndicator = (props: LevelIndicatorProps) => {
    const { game, theme } = useApp();
    const lastLevel = useRef(-1);
    const countdown = useRef(0);
    const textRef = useRef<RefType<typeof Text>>(null);

    useTick("app", (timestamp, elapsed) => {
        if (game.state.level !== lastLevel.current) {
            countdown.current = ANIMATION_DURATION;
            lastLevel.current = game.state.level;
        } else if (countdown.current) {
            let text = "LVL ";
            countdown.current = Math.max(0, countdown.current - elapsed);
            if ((countdown.current * 1000) % 50 < 25) {
                for (let i = 0; i < MAX_DIGITS; i++) {
                    if ((ANIMATION_DURATION - countdown.current) * MAX_DIGITS / ANIMATION_DURATION >= i + 1) {
                        text += lastLevel.current.toFixed().padStart(MAX_DIGITS, "0")[i];
                    } else {
                        text += CHARS[urandom(0, CHARS.length - 1)];
                    }
                }
                textRef.current!.text = text;
            }
        }
    });

    return <Text
        {...props}
        ref={textRef}
        style={{ ...FONT_STYLE, fontSize: FONT_SIZE, fill: theme.foregroundColor }}
    />;
}
