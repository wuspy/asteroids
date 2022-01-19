import { IFillStyleOptions, ILineStyleOptions } from "@pixi/graphics-smooth";

// UI theme is constant and does not change with game theme

export const FONT_FAMILY = "Consolas, Monaco, Noto Sans Mono, Roboto Mono, Liberation Mono, monospace";
export const UI_FOREGROUND_COLOR = 0xffffff;
export const UI_BACKGROUND_COLOR = 0;
export const UI_BACKGROUND_ALPHA = 0.6;

export interface ButtonTheme {
    textColor: number,
    textAlpha: number,
    inactive: {
        glow: number,
        fill?: IFillStyleOptions,
        stroke?: ILineStyleOptions,
    },
    active: {
        glow: number,
        fill?: IFillStyleOptions,
        stroke?: ILineStyleOptions,
    },
}

export const enum ButtonType {
    Primary,
    Secondary,
    Danger
};

// Shared between all buttons
const BUTTON_ACTIVE_THEME = {
    glow: 0xfeff35, //0x97ff38
    fill: {
        color: 0xfeff35,
    },
    stroke: {
        color: 0xffffff,
        width: 2,
        alpha: 0.5,
    },
};

export const BUTTON_THEMES: { [Key in ButtonType]: ButtonTheme } = {
    [ButtonType.Primary]: {
        textColor: 0xffffff,
        textAlpha: 0.9,
        inactive: {
            glow: 0x6fae3c,
            fill: {
                color: 0x6fae3c,
                alpha: 0.9,
            },
            stroke: {
                color: 0xffffff,
                width: 2,
                alpha: 0.6,
            },
        },
        active: BUTTON_ACTIVE_THEME,
    },
    [ButtonType.Secondary]: {
        textColor: 0xffffff,
        textAlpha: 0.8,
        inactive: {
            glow: 0x606060,
            fill: {
                color: 0x363636,
                alpha: 0.5,
            },
            stroke: {
                color: 0xffffff,
                width: 2,
                alpha: 0.5,
            },
        },
        active: BUTTON_ACTIVE_THEME,
    },
    [ButtonType.Danger]: {
        textColor: 0xffffff,
        textAlpha: 0.9,
        inactive: {
            glow: 0xae523b,
            fill: {
                color: 0xae523b,
                alpha: 0.9,
            },
            stroke: {
                color: 0xffffff,
                width: 2,
                alpha: 0.6,
            },
        },
        active: BUTTON_ACTIVE_THEME,
    },
};

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