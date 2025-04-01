import { Color, ColorSource, ISize, Renderer } from "@pixi/core";
import { Container, IDestroyOptions } from "@pixi/display";
import { AlphaFilter } from "@pixi/filter-alpha";
import {
    DisplayObjectEventProps,
    PixiContainerProps,
    WithPrefix,
    displayObjectSetProp,
    registerPixiComponent
} from "../solid-pixi";

export type DOMTextInputAlign = "left" | "right" | "center" | "inherit";

export class DOMTextInput extends Container {
    readonly element: HTMLInputElement;
    private _inputAppended: boolean;
    private _lastWorldAlpha: number;
    private readonly _color: Color;
    private _focusNextRender: boolean;

    fontSize: number;
    padding: number;

    /**
     * If this input should respect alpha adjustments made by AlphaFilter. Only set if needed, since
     * this adds a small overhead on each render call.
     */
    respectAlphaFilter: boolean;

    constructor() {
        super();
        this.respectAlphaFilter = false;
        this.padding = 0;
        this.fontSize = 0;
        this._lastWorldAlpha = 0;
        this._color = new Color(0);
        this._focusNextRender = false;
        this.element = document.createElement("input");
        this.element.type = "text";
        this.element.style.background = "none";
        this.element.style.position = "fixed";
        this.element.style.border = "none";
        this.element.style.outline = "none";
        this.element.style.textAlign = "inherit";
        this._inputAppended = false;
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
            this.updateColor();
        }

        const view = renderer.view as HTMLCanvasElement;
        this.element.style.left = `${this.worldTransform.tx + view.offsetLeft + this.padding * this.worldTransform.a}px`;
        this.element.style.top = `${this.worldTransform.ty + view.offsetTop + this.padding * this.worldTransform.d}px`;
        this.element.style.width = `${(this.yoga.computedLayout.width - this.padding * 2) * this.worldTransform.a}px`;
        this.element.style.fontSize = `${this.fontSize * this.worldTransform.d}px`;

        if (this._focusNextRender) {
            this.element.focus();
            this._focusNextRender = false;
        }
    }

    get color(): ColorSource {
        return this._color.toNumber();
    }

    set color(color: ColorSource) {
        this._color.setValue(color);
        this.updateColor();
    }

    get fontFamily(): string {
        return this.element.style.fontFamily;
    }

    set fontFamily(fontFamily: string) {
        this.element.style.fontFamily = fontFamily;
    }

    get align(): DOMTextInputAlign {
        return this.element.style.textAlign as DOMTextInputAlign;
    }

    set align(align: DOMTextInputAlign) {
        this.element.style.textAlign = align;
    }

    get type(): string {
        return this.element.type;
    }

    set type(type: string) {
        this.element.type = type;
    }

    get value(): string {
        return this.element.value;
    }

    set value(value: string) {
        this.element.value = value;
    }

    get placeholder(): string {
        return this.element.placeholder;
    }

    set placeholder(placeholder: string) {
        this.element.placeholder = placeholder;
    }

    get maxLength(): number {
        return this.element.maxLength;
    }

    set maxLength(maxLength: number) {
        this.element.maxLength = maxLength;
    }

    get disabled(): boolean {
        return this.element.disabled;
    }

    set disabled(disabled: boolean) {
        this.element.disabled = disabled;
    }

    addInputEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLInputElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void {
        this.element.addEventListener(type, listener, options);
    }

    removeInputEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLInputElement, ev: HTMLElementEventMap[K]) => any
    ): void {
        this.element.removeEventListener(type, listener);
    }

    focus() {
        this._focusNextRender = true;
    }

    // @ts-ignore
    override onLayoutMeasure(): ISize {
        return {
            width: 0,
            height: this.element.offsetHeight / this.worldTransform.d + this.padding * 2,
        };
    }

    override destroy(options?: boolean | IDestroyOptions): void {
        super.destroy(options);
        if (this._inputAppended) {
            this.element.parentNode!.removeChild(this.element);
            this._inputAppended = false;
        }
    }

    private updateColor() {
        const rgb = this._color.toUint8RgbArray().join(",");
        const a = (this._lastWorldAlpha * this._color.alpha).toFixed(2);
        this.element.style.color = `rgba(${rgb},${a})`;
    }
}

export type InputProps = Omit<PixiContainerProps<DOMTextInput>, keyof DisplayObjectEventProps | "focus"> & {
    focus?: boolean;
} & WithPrefix<"on", {
    [P in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[P]) => void;
}>;

declare module "solid-js" {
    namespace JSX {
        interface IntrinsicElements {
            input: InputProps,
        }
    }
}

registerPixiComponent<InputProps, DOMTextInput>("input", {
    create() {
        return new DOMTextInput();
    },
    setProp(instance, prop, newValue, oldValue) {
        if (prop.startsWith("on:")) {
            const event = prop.substring(3) as keyof HTMLElementEventMap;
            if (typeof oldValue === "function") {
                instance.removeInputEventListener(event, oldValue as any);
            }
            if (typeof newValue === "function") {
                instance.addInputEventListener(event, newValue as any);
            }
        } else if (prop === "focus") {
            if (newValue) {
                instance.focus();
            }
        } else {
            displayObjectSetProp(instance, prop, newValue, oldValue);
        }
    },
});
