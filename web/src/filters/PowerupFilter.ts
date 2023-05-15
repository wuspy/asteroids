import { GlitchFilter } from "@pixi/filter-glitch";

export class PowerupFilter extends GlitchFilter {
    private _elapsed: number;

    constructor(strength = 1) {
        super({
            slices: 8,
            offset: 4 * strength,
        });
        this._elapsed = 0;
    }

    tick(timestamp: number, elapsed: number): void {
        this._elapsed += elapsed;
        if (this._elapsed >= 0.06) {
            this.refresh();
            this._elapsed = this._elapsed - 0.06;
        }
    }
}
