import { AlphaFilter } from "@pixi/filter-alpha";
import { KawaseBlurFilter } from "@pixi/filter-kawase-blur";
import { TickQueue } from "@core/engine";
import anime from "animejs";
import { TickableContainer } from "./TickableContainer";

const BLUR = 8;

export class FadeContainer extends TickableContainer {
    private readonly _fadeAlphaFilter: AlphaFilter;
    private readonly _fadeBlurFilter: KawaseBlurFilter;
    private _fadeTimeline?: anime.AnimeInstance;
    fadeInDuration: number;
    fadeOutDuration: number;
    fadeOutExtraDelay: number;
    keepVisible: boolean;
    private _fadingIn: boolean;
    private _fadingOut: boolean;

    constructor(params: {
        queue: TickQueue,
        queuePriority?: number,
        initiallyVisible?: boolean,
        fadeInDuration: number,
        fadeOutDuration: number,
        fadeOutExtraDelay?: number,
        keepVisible?: boolean,
    }) {
        super(params.queue, params.queuePriority);
        this.filters = [
            this._fadeAlphaFilter = new AlphaFilter(),
            this._fadeBlurFilter = new KawaseBlurFilter(),
        ];
        this.fadeInDuration = params.fadeInDuration;
        this.fadeOutDuration = params.fadeOutDuration;
        this.fadeOutExtraDelay = params.fadeOutExtraDelay || 0;
        this.keepVisible = params.keepVisible ?? false;
        this._fadingIn = this._fadingOut = false;
        if (params.initiallyVisible) {
            this._show();
        } else {
            this._hide();
        }
    }

    show(): void {
        if (!this.visible || this._fadeTimeline) {
            this._show();
            this.onShown();
        }
    }

    hide(): void {
        if (this.visible) {
            this._hide();
            this.onHidden();
        }
    }

    fadeIn(): Promise<void> {
        return new Promise((resolve) => {
            if (!this._fadingIn) {
                this.onFadeInStart();
                this.visible = true;
                this._fadingIn = true;
                this._fadingOut = false;
                this._fadeAlphaFilter.enabled = true;
                this._fadeBlurFilter.enabled = true;
                this._fadeTimeline = anime.timeline({
                    autoplay: false,
                    easing: "linear",
                    duration: this.fadeInDuration,
                    complete: () => {
                        this._fadingIn = false;
                        this.show();
                        resolve();
                    },
                }).add({
                    targets: this._fadeAlphaFilter,
                    alpha: 1,
                }).add({
                    targets: this._fadeBlurFilter,
                    blur: 0,
                }, 0);
            }
        });
    }

    fadeOut(amount = 1): Promise<void> {
        return new Promise((resolve) => {
            if (!this._fadingOut) {
                this.onFadeOutStart();
                this.interactiveChildren = false;
                this._fadeAlphaFilter.enabled = true;
                this._fadeBlurFilter.enabled = true;
                this._fadingIn = false;
                this._fadingOut = true;
                this._fadeTimeline = anime.timeline({
                    autoplay: false,
                    duration: this.fadeOutDuration,
                    endDelay: this.fadeOutExtraDelay,
                    easing: "linear",
                    complete: () => {
                        this._fadingOut = false;
                        if (amount === 1) {
                            this.hide();
                        }
                        resolve();
                    },
                }).add({
                    targets: this._fadeAlphaFilter,
                    alpha: 1 - amount,
                }).add({
                    targets: this._fadeBlurFilter,
                    blur: BLUR * amount,
                }, 0);
            }
        });
    }

    tick(timestamp: number, elapsed: number): void {
        this._fadeTimeline?.tick(timestamp);
    }

    protected onFadeInStart(): void { }
    protected onFadeOutStart(): void { }
    protected onShown(): void { }
    protected onHidden(): void { }

    private _show(): void {
        this._fadeTimeline = undefined;
        this._fadeAlphaFilter.enabled = false;
        this._fadeBlurFilter.enabled = false;
        this._fadeAlphaFilter.alpha = 1;
        this._fadeBlurFilter.blur = 0;
        this.visible = true;
        this.interactiveChildren = true;
    }

    private _hide(): void {
        this._fadeTimeline = undefined;
        this._fadeAlphaFilter.enabled = false;
        this._fadeBlurFilter.enabled = false;
        this._fadeAlphaFilter.alpha = 0;
        this._fadeBlurFilter.blur = BLUR;
        this.interactiveChildren = false;
        if (!this.keepVisible) {
            this.visible = false;
        }
    }
}
