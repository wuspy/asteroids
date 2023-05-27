declare namespace GlobalMixins
{
    interface DisplayObjectEvents {
        layout: [computedLayout: import("@pixi/core").Rectangle];
    }

    interface DisplayObject {
        _layout?: import("./FlexLayout").default;
        get layout(): import("./FlexLayout").default;
        get isLayoutChild(): boolean;
        onLayoutMeasure(
            width: number,
            widthMeasureMode: import("./FlexLayout").MeasureMode,
            height: number,
            heightMeasureMode: import("./FlexLayout").MeasureMode,
        ): import("@pixi/core").ISize;
    }

    interface Container {
        _flexContainer: boolean;
        _backgroundGraphics?: import("@pixi/graphics-smooth").SmoothGraphics;
        _backgroundStyle?: import("./containerMixin").ContainerBackground;
        _backgroundSize?: import("@pixi/core").ISize;
        _backgroundGraphicsHandler: (layout: import("@pixi/core").Rectangle) => void;
        _debugGraphics?: import("@pixi/graphics-smooth").SmoothGraphics;
        _debugGraphicsHandler: (layout: import("@pixi/core").Rectangle) => void;
        set backgroundStyle(background: import("./containerMixin").ContainerBackground | undefined);
        get debugLayout(): boolean;
        set debugLayout(debugLayout: boolean);
        get flexContainer(): boolean;
        set flexContainer(flexContainer: boolean);
        get isLayoutRoot(): boolean;
    }
}
