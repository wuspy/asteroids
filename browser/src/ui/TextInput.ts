import { Renderer, ISize, utils } from "@pixi/core";
import { Container, IDestroyOptions } from "@pixi/display";
import { AlphaFilter } from "@pixi/filter-alpha";
import { ContainerBackgroundShape, MeasureMode } from "../layout";
import { PixiComponent, PixiContainerProps } from "../react-pixi/element";
import { applyDefaultProps } from "../react-pixi/props";
import { TEXT_INPUT_THEME, FONT_STYLE } from "./theme";

export type TextInputAlign = "left" | "right" | "center" | "inherit";

class DOMTextInput extends Container {
    readonly element: HTMLInputElement;
    private _inputAppended: boolean;
    private _fontSize: number;
    private _lastWorldAlpha: number;
    private _color: number;
    private _focusNextRender: boolean;

    /**
     * If this input should respect alpha adjustments made by AlphaFilter. Only set if needed, since
     * this adds a small overhead on each render call.
     */
    respectAlphaFilter: boolean;

    constructor(props: {
        fontSize: number,
        color: number,
    }) {
        super();
        this.respectAlphaFilter = false;
        this._lastWorldAlpha = 0;
        this._color = props.color;
        this._focusNextRender = false;
        this.element = document.createElement("input");
        this.element.type = "text";
        this.element.style.background = "none";
        this.element.style.position = "fixed";
        this.element.style.border = "none";
        this.element.style.outline = "none";
        this.element.style.textAlign = "inherit";
        this.setColor();
        this._inputAppended = false;
        this._fontSize = props.fontSize;

        this.addListener("layout", () => {
            // Set HTML input size
            this.element.style.width = `${this.layout.computedLayout.width * this.worldTransform.a}px`;
            this.element.style.fontSize = `${this._fontSize * this.worldTransform.d}px`;
        });
    }

    override render(renderer: Renderer): void {
        super.render(renderer);
        if (!this._inputAppended) {
            renderer.view.parentNode!.appendChild(this.element);
            this._inputAppended = true;
        }

        let alpha = this.worldAlpha;

        if (this.respectAlphaFilter) {
            let parent = this.parent;
            while (parent) {
                if (parent.filters) {
                    for (const filter of parent.filters) {
                        if (filter instanceof AlphaFilter) {
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

        const view = renderer.view as HTMLCanvasElement;
        this.element.style.left = `${this.worldTransform.tx + view.offsetLeft}px`;
        this.element.style.top = `${this.worldTransform.ty + view.offsetTop}px`;

        if (this._focusNextRender) {
            this.element.focus();
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

    // @ts-ignore
    override onLayoutMeasure(
        width: number,
        widthMeasureMode: MeasureMode,
        height: number,
        heightMeasureMode: MeasureMode
    ): ISize {
        return {
            width: 0,
            height: this.element.offsetHeight / this.worldTransform.d,
        };
    }

    override destroy(options?: boolean | IDestroyOptions): void {
        super.destroy(options);
        if (this._inputAppended) {
            this.element.parentNode!.removeChild(this.element);
            this._inputAppended = false;
        }
    }

    private setColor() {
        const rgb = (utils.hex2rgb(this._color) as number[]).map((x) => (x * 255).toFixed()).join(",");
        this.element.style.color = `rgba(${rgb},${this._lastWorldAlpha.toFixed(2)})`;
    }
}

export class PixiTextInput extends Container {
    private readonly _domInput: DOMTextInput;

    constructor(fontSize: number) {
        super();
        this._domInput = new DOMTextInput({
            color: TEXT_INPUT_THEME.textColor,
            fontSize,
        });
        this._domInput.alpha = TEXT_INPUT_THEME.textAlpha;
        this.fontFamily = FONT_STYLE.fontFamily;
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

    get color(): number {
        return this._domInput.color;
    }

    set color(color: number) {
        this._domInput.color = color;
    }

    get respectAlphaFilter(): boolean {
        return this._domInput.respectAlphaFilter;
    }

    set respectAlphaFilter(respectAlphaFilter: boolean) {
        this._domInput.respectAlphaFilter = respectAlphaFilter;
    }

    get fontFamily(): string {
        return this._domInput.element.style.fontFamily;
    }

    set fontFamily(fontFamily: string) {
        this._domInput.element.style.fontFamily = fontFamily;
    }

    get align(): TextInputAlign {
        return this._domInput.element.style.textAlign as TextInputAlign;
    }

    set align(align: TextInputAlign) {
        this._domInput.element.style.textAlign = align;
    }

    get type(): string {
        return this._domInput.element.type;
    }

    set type(type: string) {
        this._domInput.element.type = type;
    }

    get value(): string {
        return this._domInput.element.value;
    }

    set value(value: string) {
        this._domInput.element.value = value;
    }

    get placeholder(): string {
        return this._domInput.element.placeholder;
    }

    set placeholder(placeholder: string) {
        this._domInput.element.placeholder = placeholder;
    }

    get maxLength(): number {
        return this._domInput.element.maxLength;
    }

    set maxLength(maxLength: number) {
        this._domInput.element.maxLength = maxLength;
    }

    get disabled(): boolean {
        return this._domInput.element.disabled;
    }

    set disabled(disabled: boolean) {
        this._domInput.element.disabled = disabled;
    }

    focus() {
        this._domInput.focus();
    }

    addInputEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLInputElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void {
        this._domInput.element.addEventListener(type, listener, options);
    }

    removeInputEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLInputElement, ev: HTMLElementEventMap[K]) => any
    ): void {
        this._domInput.element.removeEventListener(type, listener);
    }
}

const setEventListener = <K extends keyof HTMLElementEventMap>(
    instance: PixiTextInput,
    type: K,
    updatePayload: [
        ((this: HTMLInputElement, ev: HTMLElementEventMap[K]) => any) | undefined,
        ((this: HTMLInputElement, ev: HTMLElementEventMap[K]) => any) | undefined,
    ] | undefined
) => {
    if (updatePayload) {
        const [oldValue, newValue] = updatePayload;
        if (typeof oldValue === "function") {
            instance.removeInputEventListener(type, oldValue);
        }
        if (typeof newValue === "function") {
            instance.addInputEventListener(type, newValue);
        }
    }
}

export interface TextInputProps extends Omit<PixiContainerProps<PixiTextInput>, "focus"> {
    fontSize: number;
    color?: number;
    fontFamily?: string;
    value?: string;
    align?: TextInputAlign;
    type?: string;
    placeholder?: string;
    maxLength?: number;
    disabled?: boolean;
    respectAlphaFilter?: boolean;
    focus?: boolean;
    keydown?: (this: HTMLElement, e: KeyboardEvent) => any;
    keyup?: (this: HTMLElement, e: KeyboardEvent) => void;
    beforeinput?: (this: HTMLElement, e: InputEvent) => void;
}

export const TextInput = PixiComponent<TextInputProps, PixiTextInput>("TextInput", {
    create: ({ fontSize }) => new PixiTextInput(fontSize),
    applyProps: (instance, updatePayload) => {
        const { keydown, keyup, beforeinput, focus, ...props } = updatePayload;
        applyDefaultProps(instance, props);
        setEventListener(instance, "keydown", keydown);
        setEventListener(instance, "keyup", keyup);
        setEventListener(instance, "beforeinput", beforeinput);
        if (focus && focus[1]) {
            instance.focus();
        }
    },
});