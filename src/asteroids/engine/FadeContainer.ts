import { AlphaFilter } from "@pixi/filter-alpha";
import { BlurFilter } from "@pixi/filter-blur";
import anime from "animejs";
import { TickQueue } from ".";
import { TickableContainer } from "./TickableContainer";

const BLUR = 10;

export class FadeContainer extends TickableContainer {
    private readonly _fadeAlphaFilter: AlphaFilter;
    private readonly _fadeBlurFilter: BlurFilter;
    private _fadeTimeline?: anime.AnimeInstance;
    fadeInDuration: number;
    fadeOutDuration: number;
    fadeOutExtraDelay: number;

    constructor(params: {
        queue: TickQueue,
        queuePriority?: number,
        initiallyVisible?: boolean,
        fadeInDuration: number,
        fadeOutDuration: number,
        fadeOutExtraDelay?: number,
    }) {
        super(params.queue, params.queuePriority);
        this.filters = [
            this._fadeAlphaFilter = new AlphaFilter(),
            this._fadeBlurFilter = new BlurFilter(),
        ];
        this.fadeInDuration = params.fadeInDuration;
        this.fadeOutDuration = params.fadeOutDuration;
        this.fadeOutExtraDelay = params.fadeOutExtraDelay || 0;
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

    fadeIn(complete: () => void): void {
        if (!this._fadeTimeline && !this.visible) {
            this.onFadeInStart();
            this.visible = true;
            this._fadeAlphaFilter.enabled = true;
            this._fadeBlurFilter.enabled = true;
            this._fadeTimeline = anime.timeline({
                autoplay: false,
                easing: "linear",
                duration: this.fadeInDuration,
                complete: () => {
                    this.show();
                    complete();
                },
            }).add({
                targets: this._fadeAlphaFilter,
                alpha: 1,
            }).add({
                targets: this._fadeBlurFilter,
                blur: 0,
            }, 0);
        }
    }

    fadeOut(complete: () => void): void {
        if (!this._fadeTimeline && this.visible) {
            this.onFadeOutStart();
            this._fadeAlphaFilter.enabled = true;
            this._fadeBlurFilter.enabled = true;
            this._fadeTimeline = anime.timeline({
                autoplay: false,
                duration: this.fadeOutDuration,
                easing: "linear",
                complete: () => {
                    this.hide();
                    complete();
                },
            }).add({
                targets: this._fadeAlphaFilter,
                alpha: 0,
            }).add({
                targets: this._fadeBlurFilter,
                blur: BLUR,
            }, 0).add({
                duration: this.fadeOutExtraDelay,
            });
        }
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
    }

    private _hide(): void {
        this._fadeTimeline = undefined;
        this._fadeAlphaFilter.enabled = false;
        this._fadeBlurFilter.enabled = false;
        this._fadeAlphaFilter.alpha = 0;
        this._fadeBlurFilter.blur = BLUR;
        this.visible = false;
    }
}
