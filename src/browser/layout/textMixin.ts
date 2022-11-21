import { Text } from "@pixi/text";
import { ISize } from "@pixi/math";
import { MeasureMode } from "./FlexLayout";

const text = Text.prototype;

text.onLayoutMeasure = function (
    width: number,
    widthMeasureMode: MeasureMode,
    height: number,
    heightMeasureMode: MeasureMode
): ISize {
    this.style.wordWrapWidth = this.style.wordWrap && widthMeasureMode !== MeasureMode.Undefined
        ? width / this.scale.x
        : undefined;
    this.updateText(true);
    const bounds = this.getLocalBounds();
    const scale = this.scale;
    return this._lastMeasuredSize = {
        width: bounds.width * scale.x,
        height: bounds.height * scale.y,
    };
}
