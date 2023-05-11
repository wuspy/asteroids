import vertex from "./glsl/vertex.glsl";
import fragment from "./glsl/chromatic-abberation.glsl";
import { Filter } from "@pixi/core";

export class ChromaticAbberationFilter extends Filter
{
    constructor(maxDisplacement?: number, exponent?: number, swapDirection?: boolean)
    {
        super(vertex, fragment);
        this.maxDisplacement = maxDisplacement ?? 2;
        this.exponent = exponent ?? 1;
        this.swapDirection = swapDirection ?? false;
    }

    get maxDisplacement(): number
    {
        return this.uniforms.maxDisplacement;
    }

    set maxDisplacement(value: number)
    {
        this.uniforms.maxDisplacement = value;
    }

    get exponent(): number
    {
        return this.uniforms.exponent;
    }

    set exponent(exponent: number)
    {
        this.uniforms.exponent = exponent;
    }

    get swapDirection(): boolean
    {
        return this.uniforms.swap;
    }

    set swapDirection(swap: boolean)
    {
        this.uniforms.swap = swap;
    }
}
