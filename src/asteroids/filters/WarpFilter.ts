import vertex from "./glsl/vertex.glsl";
import fragment from "./glsl/warp.glsl";
import { Filter } from "@pixi/core";

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
}
