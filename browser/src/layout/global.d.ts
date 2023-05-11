declare namespace GlobalMixins
{
    type FlexLayout = import("./FlexLayout").default;
    type FlexLayoutProps = import("./FlexLayout").FlexLayoutProps;
    type ComputedLayout = import ("./FlexLayout").ComputedLayout;
    type MeasureMode = import ("./FlexLayout").MeasureMode;
    type ISize = import ("@pixi/core").ISize;
    type ContainerBackground = import("./containerMixin").ContainerBackground;
    type BackgroundGraphics = import("@pixi/graphics-smooth").SmoothGraphics;

    interface DisplayObjectEvents {
        layout: [computedLayout: ComputedLayout];
    }

    interface DisplayObject {
        _layout?: FlexLayout;
        get layout(): FlexLayout;
        get isLayoutChild(): boolean;
        set layoutStyle(layoutStyle: Partial<FlexLayoutProps>);
        onLayoutMeasure(
            width: number,
            widthMeasureMode: MeasureMode,
            height: number,
            heightMeasureMode: MeasureMode,
        ): ISize;
    }

    interface Container {
        _flexContainer: boolean;
        _backgroundGraphics?: BackgroundGraphics;
        _backgroundStyle?: ContainerBackground;
        _backgroundSize?: ISize;
        _backgroundGraphicsHandler: (layout: ComputedLayout) => void;
        _debugGraphics?: BackgroundGraphics;
        _debugGraphicsHandler: (layout: ComputedLayout) => void;
        set backgroundStyle(background: ContainerBackground | undefined);
        get debugLayout(): boolean;
        set debugLayout(debugLayout: boolean);
        get flexContainer(): boolean;
        set flexContainer(flexContainer: boolean);
        get isLayoutRoot(): boolean;
    }
}
