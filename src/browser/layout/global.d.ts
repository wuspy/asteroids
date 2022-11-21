declare namespace GlobalMixins
{
    type FlexLayout = import("./FlexLayout").default;
    type ComputedLayout = import ("./FlexLayout").ComputedLayout;
    type MeasureMode = import ("./FlexLayout").MeasureMode;
    type ISize = import ("@pixi/math").ISize;
    type ContainerBackground = import("./containerMixin").ContainerBackground;
    type BackgroundGraphics = import("@pixi/graphics").Graphics;

    interface DisplayObject {
        _lastMeasuredSize: ISize;
        _layout?: FlexLayout;
        get layout(): FlexLayout;
        get isLayoutChild(): boolean;
        isLayoutMeasurementDirty(): boolean;
        onLayoutMeasure(
            width: number,
            widthMeasureMode: MeasureMode,
            height: number,
            heightMeasureMode: MeasureMode,
        ): ISize;
        onLayoutChange(layout: ComputedLayout): void;
    }

    interface Container {
        _flexContainer: boolean;
        _backgroundGraphics?: BackgroundGraphics;
        _debugGraphics?: BackgroundGraphics;
        _backgroundStyle?: ContainerBackground;
        _backgroundWidth: number;
        _backgroundHeight: number;
        set backgroundStyle(background: ContainerBackground | undefined);
        get debugLayout(): boolean;
        set debugLayout(debugLayout: boolean);
        get flexContainer(): boolean;
        set flexContainer(flexContainer: boolean);
        get isLayoutRoot(): boolean;
    }
}

