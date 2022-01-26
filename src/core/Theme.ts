export interface Theme {
    background: string;
    foregroundColor: number;
    foregroundContrastColor: number
    foregroundAlpha: number;
    ufoColor: number;
    backgroundAsteroidColor: number;
    backgroundAsteroidAlpha: number;
}

const DEFAULTS = {
    foregroundColor: 0xffffff,
    foregroundContrastColor: 0x000000,
    foregroundAlpha: 0.9,
    ufoColor: 0xffff00,
    backgroundAsteroidColor: 0xffffff,
    backgroundAsteroidAlpha: 0.05,
} as const;

export const THEMES: readonly Theme[] = [
    {
        ...DEFAULTS,
        background: "linear-gradient(90deg, #00394c, #006a54)",
    },
    {
        ...DEFAULTS,
        background: "linear-gradient(120deg, #0e4035, #000128)",
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
] as const;