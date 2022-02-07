import { MAX_PLAYER_NAME_LENGTH, MIN_PLAYER_NAME_LENGTH } from "@core/api";

type CodePointRange = [number, (number | null)?, boolean?, string?];

const CODE_POINT_WHITELIST: CodePointRange[] = [
    [0x0021, null, true, "i"],      // !
    [0x0022, 0x0023, true],         // "#
    [0x0024, null, true, "s"],      // $
    [0x0025, null, true],           // %
    [0x0026, null, true, "a"],      // &
    [0x0027, 0x002F, true],         // '()*+,-./
    [0x0030, null, true, "o"],      // 0
    [0x0031, null, true, "i"],      // 1
    [0x0032, 0x003F, true],         // 2-9:;<=>?
    [0x0040, null, true, "a"],      // @
    [0x0041, 0x005A],               // A-Z
    [0x005B, 0x0060, true],         // [\]^_`
    [0x0061, 0x007A],               // a-z
    [0x007B, 0x007E, true],         // {|}~
    // [0x00A1, null, true, "i"],      // ¡
    // [0x00A2, null, true, "c"],      // ¢
    // [0x00A3, null, true, "f"],      // £
    // [0x00A5, null, true, "y"],      // ¥
    // [0x00A9, null, true, "c"],      // ©
    // [0x00AE, null, true, "r"],      // ®
    // [0x00B1, 0x00B3, true],         // ±²³
    // [0x00BC, 0x00BF, true],         // ¼½¾¿
    // [0x00C0, 0x00C5, false, "a"],
    // [0x00C6, null, false, "ae"],
    // [0x00C7, null, false, "c"],
    // [0x00C8, 0x00CB, false, "e"],
    // [0x00CC, 0x00CF, false, "i"],
    // [0x00D0, null, false, "d"],
    // [0x00D1, null, false, "n"],
    // [0x00D2, 0x00D6, false, "o"],
    // [0x00D7, null, true, "x"],      // ×
    // [0x00D8, null, false, "o"],
    // [0x00D9, 0x00DC, false, "u"],
    // [0x00DD, null, false, "y"],
    // [0x00DE, null, false, "p"],
    // [0x00DF, null, false, "b"],
    // [0x00E0, 0x00E5, false, "a"],
    // [0x00E6, null, false, "ae"],
    // [0x00E7, null, false, "c"],
    // [0x00E8, 0x00EB, false, "e"],
    // [0x00EC, 0x00EF, false, "i"],
    // [0x00F0, null, false, "d"],
    // [0x00F1, null, false, "n"],
    // [0x00F1, null, false, "n"],
    // [0x00F2, 0x00F6, false, "o"],
    // [0x00F7, null, true],           // ÷
    // [0x00F8, null, false, "o"],
    // [0x00F9, 0x00FC, false, "u"],
    // [0x00FD, null, false, "y"],
    // [0x00FE, null, false, "p"],
    // [0x00FF, null, false, "y"],
    // [0x0100, 0x0105, false, "a"],
    // [0x0106, 0x010D, false, "c"],
    // [0x010E, 0x0111, false, "d"],
    // [0x0112, 0x011B, false, "e"],
    // [0x011C, 0x0123, false, "g"],
    // [0x0124, 0x0127, false, "h"],
    // [0x0124, 0x0127, false, "h"],
];

const isValidCodePoint = (code: number): boolean => {
    for (const [start, end] of CODE_POINT_WHITELIST) {
        if (!end && code === start) {
            return true;
        } else if (end && start <= code && code <= end) {
            return true;
        }
    }
    return false;
}

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

    for (const char of name) {
        if (!isValidCodePoint(char.codePointAt(0)!)) {
            return DEFAULT_ERROR;
        }
    }
}
