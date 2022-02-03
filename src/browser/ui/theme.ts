import { IFillStyleOptions, ILineStyleOptions } from "@pixi/graphics-smooth";
import { ContainerBackground, ContainerBackgroundShape } from "../layout";

// UI theme is constant and does not change with game theme

export const FONT_FAMILY = "Consolas, Monaco, Noto Sans Mono, Roboto Mono, monospace";
export const UI_FOREGROUND_COLOR = 0xffffff;
export const UI_BACKGROUND_COLOR = 0;
export const UI_BACKGROUND_ALPHA = 0.6;
export const MODAL_BACKGROUND: ContainerBackground = {
    shape: ContainerBackgroundShape.Rectangle,
    cornerRadius: 12,
    fill: {
        color: 0,
        alpha: 0.8,
    },
    stroke: {
        color: 0xffffff,
        alpha: 0.5,
        width: 2,
    }
};

export const TEXT_INPUT_THEME = {
    textColor: UI_FOREGROUND_COLOR,
    textAlpha: 0.8,
    glow: 0x606060,
    fill: {
        color: 0x363636,
        alpha: 0.5,
    },
    stroke: {},
};

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
}

// Shared between all buttons
const BUTTON_ACTIVE_THEME = {
    glow: 0xfeff35,
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
        textColor: UI_FOREGROUND_COLOR,
        textAlpha: 0.8,
        inactive: {
            glow: 0x6fae3c,
            fill: {
                color: 0x6fae3c,
                alpha: 0.8,
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
        textColor: UI_FOREGROUND_COLOR,
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
        textColor: UI_FOREGROUND_COLOR,
        textAlpha: 0.8,
        inactive: {
            glow: 0xae523b,
            fill: {
                color: 0xae523b,
                alpha: 0.8,
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