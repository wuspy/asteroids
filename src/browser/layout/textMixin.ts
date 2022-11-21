import { Text } from "@pixi/text";
import { ISize } from "@pixi/math";
import { MeasureMode } from "./FlexLayout";

const text = Text.prototype;

const _super = {
    onLayoutMeasure: text.onLayoutMeasure,
};

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
    return _super.onLayoutMeasure.call(this, width, widthMeasureMode, height, heightMeasureMode);
}
