import vertex from "./glsl/vertex.glsl";
import fragment from "./glsl/warp.glsl";
import { Filter, ISize } from "@pixi/core";

export class WarpFilter extends Filter
{
    constructor(warpAmount?: number)
    {
        super(vertex, fragment);
        this.warpAmount = warpAmount ?? 10;
    }

    get warpAmount(): number {
        return this.uniforms.warpAmount * 100;
    }

    set warpAmount(amount: number) {
        this.uniforms.warpAmount = amount / 100;
    }

    /**
     * Calculates the displacement that this filter would apply to a coorinate
     */
    getDisplacement(filterArea: ISize, x: number, y: number):  [number, number]
    {
        x = x / filterArea.width * 2 - 1;
        y = y / filterArea.height * 2 - 1;

        x = x / (1 + (y * y) * this.uniforms.warpAmount);
        y = y / (1 + (x * x) * this.uniforms.warpAmount);

        return [
            (x * 0.5 + 0.5) * filterArea.width,
            (y * 0.5 + 0.5) * filterArea.height,
        ];
    }
}
