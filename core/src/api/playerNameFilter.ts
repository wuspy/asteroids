export const MIN_PLAYER_NAME_LENGTH = 3;
export const MAX_PLAYER_NAME_LENGTH = 15;

export const PLAYER_NAME_CODE_POINT_WHITELIST = [
    [0x0020],           // space
    [0x0027],           // '
    [0x0030, 0x0039],   // 0-9
    [0x0041, 0x0059],   // A-Z
    [0x0061, 0x007A],   // a-z
    [0x00C0, 0x00F6],   // latin-1 sup
    [0x00F8, 0x017F],   // latin-1 sup & extended-A
    [0x0400, 0x045F],   // cyrillic
] as const;

export const isValidPlayerNameCodePoint = (code: number): boolean => {
    for (const [start, end] of PLAYER_NAME_CODE_POINT_WHITELIST) {
        if ((!end && code === start) || (end && start <= code && code <= end)) {
            return true;
        }
    }
    return false;
}
