import { Container } from "@pixi/display";
import { GlowFilter } from "@pixi/filter-glow";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Text } from "@pixi/text";
import { ComputedLayout, ContainerBackground, ContainerBackgroundShape, drawContainerBackground } from "../layout";
import { ButtonTheme, ButtonType, BUTTON_THEMES, FONT_FAMILY } from "../Theme";

const TRANSITION_TIME = 250;

export class Button extends Container {
    private readonly _text: Text;
    private readonly _inactiveGraphics: Graphics;
    private readonly _activeGraphics: Graphics;
    private readonly _theme: ButtonTheme;
    private readonly _activeBackground: ContainerBackground;
    private readonly _inactiveBackground: ContainerBackground;
    private _glowFilter: GlowFilter;
    private _activeGlowFilter: GlowFilter;
    private _onClick: () => void;
    private _hover: boolean;
    private _active: boolean;
    private _timestamp: number;

    constructor(type: ButtonType, text: string, onClick?: () => void) {
        super();
        this._theme = BUTTON_THEMES[type];
        this._activeBackground = {
            shape: ContainerBackgroundShape.Rectangle,
            cornerRadius: 8,
            fill: this._theme.active.fill,
            stroke: this._theme.active.stroke,
        };
        this._inactiveBackground = {
            shape: ContainerBackgroundShape.Rectangle,
            cornerRadius: 8,
            fill: this._theme.inactive.fill,
            stroke: this._theme.inactive.stroke,
        };

        this.flexContainer = true;
        this.layout.style({
            paddingHorizontal: 14,
            paddingVertical: 10,
        });
        this._text = new Text(text, {
            fontFamily: FONT_FAMILY,
            fontSize: 20,
            fill: this._theme.textColor,
        });
        this._text.alpha = this._theme.textAlpha;

        this._onClick = onClick ?? (() => { });
        this._inactiveGraphics = new Graphics();
        this._inactiveGraphics.layout.excluded = true;
        this._activeGraphics = new Graphics();
        this._activeGraphics.layout.excluded = true;
        this.addChild(this._inactiveGraphics, this._activeGraphics, this._text);

        this._inactiveGraphics.filters = [
            this._glowFilter = new GlowFilter({
                innerStrength: 0,
                outerStrength: 0,
                distance: 24,
                color: this._theme.inactive.glow,
            }),
        ];
        this._activeGraphics.filters = [
            this._activeGlowFilter = new GlowFilter({
                innerStrength: 0,
                outerStrength: 2,
                distance: 24,
                color: this._theme.active.glow,
            }),
        ];

        this._hover = false;
        this._active = false;
        this._activeGraphics.alpha = 0;
        this._activeGraphics.visible = false;
        this._timestamp = Date.now();
        this.interactive = true;
        this.buttonMode = true;

        this.on("click", () => this._onClick());
        this.on("mouseover", () => { this._hover = true; });
        this.on("mouseout", () => { this._hover = false; });
        this.on("mousedown", () => { this._active = true; });
        this.on("touchstart", () => { this._active = true; });
        this.on("mouseup", () => { this._active = false; });
        this.on("touchend", () => { this._active = false; });
        this.on("mouseupoutside", () => { this._active = false; });
        this.on("touchendoutside", () => { this._active = false; });
    }

    override onLayout(layout: ComputedLayout): void {
        super.onLayout(layout);
        const { width, height } = layout;
        const diff = Date.now() - this._timestamp;
        const alphaDiff = diff / TRANSITION_TIME;
        const glowDiff = alphaDiff * 2;
        
        if (!this._active && this._hover) {
            this._glowFilter.outerStrength = Math.min(2, this._glowFilter.outerStrength + glowDiff);
        } else if (this._glowFilter.outerStrength) {
            this._glowFilter.outerStrength = Math.max(0, this._glowFilter.outerStrength - glowDiff);
        }

        if (this._active) {
            this._activeGraphics.alpha = Math.min(1, this._activeGraphics.alpha + alphaDiff);
            this._activeGraphics.visible = true;
        } else if (this._activeGraphics.visible) {
            this._activeGraphics.alpha = Math.max(0, this._activeGraphics.alpha - alphaDiff);
            this._activeGraphics.visible = this._activeGraphics.alpha > 0;
        }

        this._inactiveGraphics.clear();
        drawContainerBackground(this._inactiveGraphics, this._inactiveBackground, width, height);
        if (this._activeGraphics.visible) {
            this._activeGraphics.clear();
            drawContainerBackground(this._activeGraphics, this._activeBackground, width, height);
        }
    
        this._timestamp += diff;
    }

    get text(): string {
        return this._text.text;
    }

    set text(text: string) {
        this._text.text = text;
    }

    set onClick(onClick: () => void) {
        this._onClick = onClick;
    }
}
