import { GlitchFilter } from "@pixi/filter-glitch";
import { Tickable } from "@core/engine";

export class PowerupFilter extends GlitchFilter implements Tickable {
    private _elapsed: number;

    constructor() {
        super({
            slices: 8,
            offset: 4,
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
