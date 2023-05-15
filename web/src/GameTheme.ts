import { urandom } from "@wuspy/asteroids-core";

export interface GameTheme {
    background: string;
    backgroundColor: number;
    backgroundAlpha: number;
    foregroundColor: number;
    foregroundContrastColor: number
    foregroundAlpha: number;
    ufoColor: number;
    powerupColor: number;
    fireColor: number;
}

const DEFAULTS = {
    backgroundColor: 0xffffff,
    backgroundAlpha: 0.05,
    foregroundColor: 0xffffff,
    foregroundContrastColor: 0x000000,
    foregroundAlpha: 0.9,
    ufoColor: 0xffff00,
    powerupColor: 0xff023a,
    fireColor: 0xfa7850,
} as const;

export const GAME_THEMES: readonly GameTheme[] = [
    {
        ...DEFAULTS,
        background: "linear-gradient(90deg, #00394c, #006a54)",
    },
    {
        ...DEFAULTS,
        background: "radial-gradient(circle at center, #235b76, #202a4e)",
    },
    {
        ...DEFAULTS,
        background: "linear-gradient(0deg, #633446, #370f43)",
    },
    {
        ...DEFAULTS,
        background: "linear-gradient(75deg, #572771, #44091f)",
    },
    {
        ...DEFAULTS,
        background: "radial-gradient(circle at center, #1d182e, #262a6a)",
    },
    {
        ...DEFAULTS,
        background: "radial-gradient(circle at center, #570900, #2f023d)",
    },
    {
        ...DEFAULTS,
        background: "linear-gradient(0deg, #4d250b, #1f1025)",
    },
    {
        ...DEFAULTS,
        background: "linear-gradient(90deg, #235f7b, #202950)",
    },
    {
        ...DEFAULTS,
        background: "linear-gradient(120deg, #37093a, #083957)",
    },
    {
        ...DEFAULTS,
        background: "linear-gradient(30deg, #1d0002, #2a0c3e)",
    },
] as const;

export const getRandomTheme = () => GAME_THEMES[urandom(0, GAME_THEMES.length - 1)];