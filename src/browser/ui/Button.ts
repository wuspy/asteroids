import { GlowFilter } from "@pixi/filter-glow";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { TickQueue } from "@core/engine";
import { Text } from "./Text";
import { Align, ContainerBackground, ContainerBackgroundShape, drawContainerBackground, FlexDirection } from "../layout";
import { Image } from "./Image";
import { TickableContainer } from "./TickableContainer";
import { ButtonTheme, ButtonType, BUTTON_THEMES } from "./theme";

const TRANSITION_TIME = 0.25;

export class Button extends TickableContainer {
    private readonly _text: Text;
    private _image?: Image;
    private readonly _inactiveGraphics: Graphics;
    private readonly _activeGraphics: Graphics;
    private readonly _theme: ButtonTheme;
    private readonly _activeBackground: ContainerBackground;
    private readonly _inactiveBackground: ContainerBackground;
    private _glowFilter: GlowFilter;
    private _activeGlowFilter: GlowFilter;
    private _hover: boolean;
    private _active: boolean;

    onClick: () => void;

    constructor(params: {
        queue: TickQueue,
        type: ButtonType,
        text: string,
        imageResource?: string,
        onClick?: () => void,
    }) {
        super(params.queue);
        this._theme = BUTTON_THEMES[params.type];
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
            flexDirection: FlexDirection.Row,
            alignItems: Align.Center,
        });

        this.onClick = params.onClick ?? (() => { });
        this._inactiveGraphics = new Graphics();
        this._inactiveGraphics.layout.excluded = true;
        this._activeGraphics = new Graphics();
        this._activeGraphics.layout.excluded = true;
        this.addChild(this._inactiveGraphics, this._activeGraphics);

        if (params.imageResource) {
            this._image = new Image({
                queue: params.queue,
                resource: params.imageResource,
                tint: this._theme.textColor,
            });
            this._image.alpha = this._theme.textAlpha;
            this._image.layout.style({
                width: 20,
                height: 20,
                marginRight: 8,
            });
            this.addChild(this._image);
        }

        this._text = new Text(params.text, {
            fontSize: 20,
            fill: this._theme.textColor,
        });
        this._text.alpha = this._theme.textAlpha;
        this.addChild(this._text);

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
        this.interactive = true;
        this.buttonMode = true;
        this._text.cacheAsBitmap = true;

        this.on("mouseover", () => { this._hover = true; });
        this.on("mouseout", () => { this._hover = false; });
        this.on("mousedown", () => { this._active = true; });
        this.on("touchstart", () => { this._active = true; });
        this.on("mouseup", () => {
            this._active = false;
            this.onClick();
        });
        this.on("touchend", () => {
            this._active = false;
            this.onClick();
        });
        this.on("mouseupoutside", () => { this._active = false; });
        this.on("touchendoutside", () => { this._active = false; });
    }

    tick(timestamp: number, elapsed: number): void {
        const { width, height } = this.layout.computedLayout;
        const alphaDiff = elapsed / TRANSITION_TIME;
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
    }

    get text(): string {
        return this._text.text;
    }

    set text(text: string) {
        this._text.cacheAsBitmap = false;
        this._text.text = text;
        this._text.cacheAsBitmap = true;
    }
}
