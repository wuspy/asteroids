import { MAX_PLAYER_NAME_LENGTH, MIN_PLAYER_NAME_LENGTH, isValidPlayerNameCodePoint } from "@core/api";

const DEFAULT_ERROR = "Enter another name.";

export const validatePlayerName = (name: any): string | undefined => {
    if (typeof name !== "string") {
        return DEFAULT_ERROR;
    }
    if (name.length < MIN_PLAYER_NAME_LENGTH) {
        return "Enter a longer name.";
    }
    if (name.length > MAX_PLAYER_NAME_LENGTH) {
        return "Enter a shorter name.";
    }

    let isWhitespace = true;
    for (const char of name) {
        const code = char.codePointAt(0)!;
        if (!isValidPlayerNameCodePoint(code)) {
            return DEFAULT_ERROR;
        }
        isWhitespace &&= code === 0x0020;
    }

    if (isWhitespace) {
        return DEFAULT_ERROR;
    }
}
