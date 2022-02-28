import { Renderer } from "@pixi/core";
import { Container, IDestroyOptions } from "@pixi/display";
import { ISize } from "@pixi/math";
import { hex2rgb } from "@pixi/utils";
import { ContainerBackgroundShape, ComputedLayout, MeasureMode } from "../layout";
import { TEXT_INPUT_THEME, FONT_FAMILY } from "./theme";

class _DOMTextInput extends Container {
    readonly _element: HTMLInputElement;
    private _inputAppended: boolean;
    private _fontSize: number;
    private _lastWorldAlpha: number;
    private _color: number;
    private _lastElementHeight: number;
    private _focusNextRender: boolean;

    /**
     * If this input should respect alpha adjustments made by AlphaFilter. Only set if needed, since
     * this adds a small overhead on each render call.
     */
    respectAlphaFilter: boolean;

    constructor(params: {
        fontFamily?: string,
        fontSize: number,
        color: number,
    }) {
        super();
        this.respectAlphaFilter = false;
        this._lastWorldAlpha = 0;
        this._color = params.color;
        this._lastElementHeight = 0;
        this._focusNextRender = false;
        this._element = document.createElement("input");
        this._element.type = "text";
        if (params.fontFamily) {
            this._element.style.fontFamily = params.fontFamily;
        }
        this._element.style.background = "none";
        this._element.style.position = "fixed";
        this._element.style.border = "none";
        this._element.style.outline = "none";
        this._element.style.textAlign = "inherit";
        this.setColor();
        this._inputAppended = false;
        this._fontSize = params.fontSize;
    }

    override render(renderer: Renderer): void {
        super.render(renderer);
        if (!this._inputAppended) {
            renderer.view.parentNode!.appendChild(this._element);
            this._inputAppended = true;
        }

        let alpha = this.worldAlpha;

        if (this.respectAlphaFilter) {
            let parent = this.parent;
            while (parent) {
                if (parent.filters) {
                    for (const filter of parent.filters) {
                        // @ts-expect-error
                        if ("alpha" in filter && typeof filter.alpha == "number") {
                            // @ts-expect-error
                            alpha *= filter.alpha;
                        }
                    }
                }
                parent = parent.parent;
            }
        }

        if (alpha !== this._lastWorldAlpha) {
            this._lastWorldAlpha = alpha;
            this.setColor();
        }

        this._element.style.left = `${this.worldTransform.tx + renderer.view.offsetLeft}px`;
        this._element.style.top = `${this.worldTransform.ty + renderer.view.offsetTop}px`;

        if (this._focusNextRender) {
            this._element.focus();
            this._focusNextRender = false;
        }
    }

    get color(): number {
        return this._color;
    }

    set color(color: number) {
        this._color = color;
        this.setColor();
    }

    focus() {
        this._focusNextRender = true;
    }

    override onLayout(layout: ComputedLayout): void {
        // Calculate world scale
        const scale = { x: this.scale.x, y: this.scale.y };
        let parent = this.parent;
        while (parent) {
            scale.x *= parent.scale.x;
            scale.y *= parent.scale.y;
            parent = parent.parent;
        }
        // Set HTML input size
        this._element.style.width = `${Math.round(this.layout.computedLayout.width * scale.x)}px`;
        this._element.style.fontSize = `${this._fontSize * scale.y}px`;
    }

    override isLayoutMeasurementDirty(): boolean {
        return this.getElementHeight() !== this._lastElementHeight;
    }

    override onLayoutMeasure(
        width: number,
        widthMeasureMode: MeasureMode,
        height: number,
        heightMeasureMode: MeasureMode
    ): ISize {
        const elementHeight = this.getElementHeight();
        this._lastElementHeight = elementHeight;
        return { width: 0, height: elementHeight };
    }

    override destroy(options?: boolean | IDestroyOptions): void {
        super.destroy(options);
        if (this._inputAppended) {
            this._element.parentNode!.removeChild(this._element);
            this._inputAppended = false;
        }
    }

    private getElementHeight(): number {
        // Calculate world vertical scale
        let scale = this.scale.y;
        let parent = this.parent;
        while (parent) {
            scale *= parent.scale.y;
            parent = parent.parent;
        }
        return this._element.offsetHeight / scale;
    }

    private setColor() {
        const rgb = (hex2rgb(this._color) as number[]).map((x) => (x * 255).toFixed()).join(",");
        this._element.style.color = `rgba(${rgb},${this._lastWorldAlpha.toFixed(2)})`;
    }
}

export type TextInputAlign = "left" | "right" | "center" | "inherit";

export class TextInput extends Container {
    private readonly _domInput: _DOMTextInput;

    constructor(fontSize: number) {
        super();
        this._domInput = new _DOMTextInput({
            fontFamily: FONT_FAMILY,
            color: TEXT_INPUT_THEME.textColor,
            fontSize,
        });
        this._domInput.alpha = TEXT_INPUT_THEME.textAlpha;
        this.flexContainer = true;
        this.layout.padding = 8;
        this.backgroundStyle = {
            shape: ContainerBackgroundShape.Rectangle,
            cornerRadius: 8,
            fill: TEXT_INPUT_THEME.fill,
            stroke: TEXT_INPUT_THEME.stroke,
        };
        this._domInput.layout.width = "100%";
        this._domInput.respectAlphaFilter = true;
        this.addChild(this._domInput);
    }

    get align(): TextInputAlign {
        return this._domInput._element.style.textAlign as TextInputAlign;
    }

    set align(align: TextInputAlign) {
        this._domInput._element.style.textAlign = align;
    }

    get type(): string {
        return this._domInput._element.type;
    }

    set type(type: string) {
        this._domInput._element.type = type;
    }

    get value(): string {
        return this._domInput._element.value;
    }

    set value(value: string) {
        this._domInput._element.value = value;
    }

    get placeholder(): string {
        return this._domInput._element.placeholder;
    }

    set placeholder(placeholder: string) {
        this._domInput._element.placeholder = placeholder;
    }

    get maxLength(): number {
        return this._domInput._element.maxLength;
    }

    set maxLength(maxLength: number) {
        this._domInput._element.maxLength = maxLength;
    }

    get disabled(): boolean {
        return this._domInput._element.disabled;
    }

    set disabled(disabled: boolean) {
        this._domInput._element.disabled = disabled;
    }

    focus() {
        this._domInput.focus();
    }

    addEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLInputElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void {
        this._domInput._element.addEventListener(type, listener, options);
    }
}
