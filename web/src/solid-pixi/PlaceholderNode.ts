import { DisplayObject } from "@pixi/display";
import { SolidPixiInstance } from "./element";

/**
 * A DisplayObject that does absolutely nothing, used as a text node placeholder in SolidJS.
 * See `createTextNode` in render.ts for why this is needed.
 */
export class PlaceholderNode extends DisplayObject implements SolidPixiInstance<DisplayObject> {
    override visible = false;
    override renderable = false;
    sortDirty = false;

    __solidpixi = {
        create() { return new PlaceholderNode(); },
        setProp() { },
        didMount() { },
        willUnmount() { return { }; },
    };

    calculateBounds() { }
    removeChild() { }
    render() { }
}
