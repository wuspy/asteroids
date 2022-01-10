import { Renderer } from "@pixi/core";
import { Container } from "@pixi/display";
import { IFillStyleOptions, ILineStyleOptions, SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Rectangle } from "@pixi/math";

export interface LayoutBackground {
    shape: "rectangle" | "ellipse",
    fillStyle?: IFillStyleOptions,
    lineStyle?: ILineStyleOptions;
    cornerRadius?: number;
}

export type LayoutSizeSpec = number | "matchContent" | "matchParent";

export abstract class Layout extends Container {
    private _backgroundGraphics?: Graphics;
    private _debugGraphics?: Graphics;
    private _backgroundStyle?: LayoutBackground;
    private _widthSpec!: LayoutSizeSpec;
    private _heightSpec!: LayoutSizeSpec;
    protected readonly layoutBounds: Rectangle;
    private _backgroundWidth: number;
    private _backgroundHeight: number;

    constructor(width?: LayoutSizeSpec, height?: LayoutSizeSpec) {
        super();
        this.layoutBounds = new Rectangle(0, 0, 0, 0);
        this._widthSpec = width || 0;
        this._heightSpec = height || 0;
        this._backgroundWidth = this._backgroundHeight = 0;
    }

    abstract update(): void;

    override render(renderer: Renderer): void {
        this.update();
        if (this._backgroundGraphics && this._backgroundStyle && this._backgroundWidth !== this.width && this._backgroundHeight !== this.height) {
            this._backgroundGraphics.clear();
            this._backgroundWidth = this.width;
            this._backgroundHeight = this.height;
            const { shape, fillStyle, lineStyle, cornerRadius } = this._backgroundStyle;
            if (fillStyle) {
                this._backgroundGraphics.beginTextureFill(fillStyle);
            }
            if (lineStyle) {
                this._backgroundGraphics.lineStyle(lineStyle);
            }
            if (shape === "rectangle") {
                if (cornerRadius) {
                    this._backgroundGraphics.drawRoundedRect(0, 0, this.width, this.height, cornerRadius);
                } else {
                    this._backgroundGraphics.drawRect(0, 0, this.width, this.height);
                }
            } else if (shape === "ellipse") {
                this._backgroundGraphics.drawEllipse(this.width / 2, this.height / 2, this.width, this.height);
            }
            if (fillStyle) {
                this._backgroundGraphics.endFill();
            }
        }
        if (this._debugGraphics) {
            this._debugGraphics.clear();
            this._debugGraphics.lineStyle({
                width: 1,
                color: 0x00ff00,
                alpha: 0.5,
            });
            this._debugGraphics.drawRect(0, 0, this.width, this.height);
            for (const child of this.children.filter((child) => child instanceof Container) as Container[]) {
                this._debugGraphics.drawRect(child.position.x, child.position.y, child.width, child.height);
            }
        }
        super.render(renderer);
    }

    get backgroundStyle(): LayoutBackground | undefined {
        this._backgroundWidth = this._backgroundHeight = 0;
        return this._backgroundStyle;
    }

    set backgroundStyle(background: LayoutBackground | undefined) {
        this._backgroundStyle = background;
        this._backgroundWidth = this._backgroundHeight = 0;
        if (background && !this._backgroundGraphics) {
            this._backgroundGraphics = new Graphics();
            super.addChildAt(this._backgroundGraphics, 0);
        } else if (!background && this._backgroundGraphics) {
            super.removeChild(this._backgroundGraphics);
            this._backgroundGraphics.destroy();
            this._backgroundGraphics = undefined;
        }
    }

    get debug(): boolean {
        return !!this._debugGraphics;
    }

    set debug(debug: boolean) {
        if (debug && !this._debugGraphics) {
            this._debugGraphics = new Graphics();
            this._debugGraphics.zIndex = 999999;
            super.addChildAt(this._debugGraphics, 0);
        } else if (!debug && this._debugGraphics) {
            super.removeChild(this._debugGraphics);
            this._debugGraphics.destroy();
            this._debugGraphics = undefined;
        }
    }

    override get width(): number {
        return this.layoutBounds.width;
    }

    override set width(width: number) {
        this.widthSpec = width;
    }

    override get height(): number {
        return this.layoutBounds.height;
    }

    override set height(height: number) {
        this.heightSpec = height;
    }

    get widthSpec(): LayoutSizeSpec {
        return this._widthSpec;
    }

    set widthSpec(spec: LayoutSizeSpec) {
        this._widthSpec = spec;
        this.layoutBounds.width = typeof (spec) === "number" ? spec : 0;
    }

    get heightSpec(): LayoutSizeSpec {
        return this._heightSpec;
    }

    set heightSpec(spec: LayoutSizeSpec) {
        this._heightSpec = spec;
        this.layoutBounds.height = typeof (spec) === "number" ? spec : 0;
    }
}
