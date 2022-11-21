import { GlowFilter } from "@pixi/filter-glow";
import { Graphics } from "@pixi/graphics";
import { TickQueue } from "../../core/engine";
import { Text } from "./Text";
import { Align, ContainerBackground, ContainerBackgroundShape, drawContainerBackground, FlexDirection, PositionType } from "../layout";
import { Image } from "./Image";
import { TickableContainer } from "./TickableContainer";
import { ButtonTheme, ButtonType, BUTTON_THEMES } from "./theme";
import { LoadingAnimation } from "./LoadingAnimation";

const TRANSITION_TIME = 0.25;

export class Button extends TickableContainer {
    private readonly _text: Text;
    private readonly _type: ButtonType;
    private _image?: Image;
    private readonly _inactiveGraphics: Graphics;
    private readonly _activeGraphics: Graphics;
    private readonly _theme: ButtonTheme;
    private readonly _activeBackground: ContainerBackground;
    private readonly _inactiveBackground: ContainerBackground;
    private _glowFilter: GlowFilter;
    private _activeGlowFilter: GlowFilter;
    private _loader?: LoadingAnimation;
    private _hover: boolean;
    private _active: boolean;
    private _lastWidth: number;
    private _lastHeight: number;

    enabled: boolean;

    onClick: () => void;

    constructor(params: {
        queue: TickQueue,
        type: ButtonType,
        text: string,
        imageUrl?: string,
        enabled?: boolean,
        onClick?: () => void,
    }) {
        super(params.queue);
        this._type = params.type;
        this._theme = BUTTON_THEMES[params.type];
        this.enabled = params.enabled ?? true;
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

        if (params.imageUrl) {
            this._image = new Image({
                queue: params.queue,
                url: params.imageUrl,
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
        this._lastWidth = 0;
        this._lastHeight = 0;
        this._activeGraphics.alpha = 0;
        this._activeGraphics.visible = false;
        this.interactive = true;
        this.cursor = "pointer";

        this.on("pointerover", () => { this._hover = true; });
        this.on("pointerout", () => { this._hover = false; });
        this.on("pointerdown", () => { this._active = this.enabled && !this.loading; });
        this.on("pointerup", () => { this._active = false; });
        this.on("pointerupoutside", () => { this._active = false; });
        this.on("pointertap", () => {
            if (this.enabled && !this.loading) {
                this.onClick();
            }
        });
    }

    tick(timestamp: number, elapsed: number): void {
        const { width, height } = this.layout.computedLayout;
        const alphaDiff = elapsed / TRANSITION_TIME;
        const glowDiff = alphaDiff * 2;

        let needsBackgroundRedraw = width !== this._lastWidth || height !== this._lastHeight;

        if (!this._active && this._hover) {
            this._glowFilter.outerStrength = Math.min(2, this._glowFilter.outerStrength + glowDiff);
            needsBackgroundRedraw = true;
        } else if (this._glowFilter.outerStrength) {
            this._glowFilter.outerStrength = Math.max(0, this._glowFilter.outerStrength - glowDiff);
            needsBackgroundRedraw = true;
        }

        if (this._active) {
            this._activeGraphics.alpha = Math.min(1, this._activeGraphics.alpha + alphaDiff);
            this._activeGraphics.visible = true;
            needsBackgroundRedraw = true;
        } else if (this._activeGraphics.visible) {
            this._activeGraphics.alpha = Math.max(0, this._activeGraphics.alpha - alphaDiff);
            this._activeGraphics.visible = this._activeGraphics.alpha > 0;
            needsBackgroundRedraw = true;
        }

        if (needsBackgroundRedraw) {
            this._inactiveGraphics.clear();
            drawContainerBackground(this._inactiveGraphics, this._inactiveBackground, width, height);
            if (this._activeGraphics.visible) {
                this._activeGraphics.clear();
                drawContainerBackground(this._activeGraphics, this._activeBackground, width, height);
            }
            this._lastWidth = width;
            this._lastHeight = height;
        }
    }

    get loading(): boolean {
        return !!this._loader;
    }

    set loading(loading: boolean) {
        if (loading && !this._loader) {
            this._loader = new LoadingAnimation({
                queue: this.queue,
                diameter: 24,
                color: this._theme.textColor,
            });
            this._loader.alpha = this._theme.textAlpha;
            this._loader.layout.style({
                position: PositionType.Absolute,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            });
            this.addChild(this._loader);
            this._text.renderable = false;
        } else if (!loading && this._loader) {
            this._loader.destroy({ children: true });
            this._loader = undefined;
            this._text.renderable = true;
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

    get type(): ButtonType {
        return this._type;
    }
}
