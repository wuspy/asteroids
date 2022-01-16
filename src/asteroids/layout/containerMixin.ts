import { Renderer } from "@pixi/core";
import { Container, DisplayObject } from "@pixi/display";
import { IFillStyleOptions, ILineStyleOptions, SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { ComputedLayout } from "./FlexLayout";

declare module "@pixi/display"
{
    export interface Container {
        set backgroundStyle(background: ContainerBackground);
        get debugLayout(): boolean;
        set debugLayout(debugLayout: boolean);
        get flexContainer(): boolean;
        set flexContainer(flexContainer: boolean);
        get isLayoutRoot(): boolean;
    }
}

interface ContainerPrivate extends Container {
    _flexContainer: boolean;
    _backgroundGraphics?: Graphics;
    _debugGraphics?: Graphics;
    _backgroundStyle?: ContainerBackground;
    _backgroundWidth: number;
    _backgroundHeight: number;
    createBackgroundGraphics(): void;
    destroyBackgroundGraphics(): void;
    createDebugGraphics(): void;
    destroyDebugGraphics(): void;
}

export type ContainerBackground = ((graphics: Graphics, width: number, height: number) => void) | {
    shape: "rectangle" | "ellipse",
    fill?: IFillStyleOptions,
    stroke?: ILineStyleOptions;
    cornerRadius?: number;
    cacheAsBitmap?: boolean;
}

const container = Container.prototype as ContainerPrivate;

container._flexContainer = false;
container._backgroundWidth = 0;
container._backgroundHeight = 0;

const _super = {
    render: container.render,
    addChild: container.addChild,
    addChildAt: container.addChildAt,
    removeChild: container.removeChild,
    removeChildAt: container.removeChildAt,
    removeChildren: container.removeChildren,
    swapChildren: container.swapChildren,
    sortChildren: container.sortChildren,
    onLayout: container.onLayout,
};

Object.defineProperties(container, {
    flexContainer: {
        get(this: ContainerPrivate): boolean {
            return this._flexContainer;
        },
        set(this: ContainerPrivate, flexContainer: boolean) {
            if (flexContainer && !this._flexContainer) {
                // Add all children's layout nodes to our node
                for (const child of this.children) {
                    this.layout.appendChild(child.layout);
                }
                if (this._backgroundStyle) {
                    this.createBackgroundGraphics();
                }
                this._debugGraphics?.clear();
            } else if (!flexContainer && this._flexContainer) {
                // Remove child nodes
                for (const child of this.children) {
                    this.layout.removeChild(child.layout);
                }
                this.destroyBackgroundGraphics();
                this.destroyDebugGraphics();
            }
            this._flexContainer = flexContainer;
        },
    },
    isLayoutRoot: {
        get(this: ContainerPrivate): boolean {
            return this._flexContainer && (!this.parent || !this.parent.flexContainer);
        },
    },
    debugLayout: {
        get(this: ContainerPrivate): boolean {
            return !!this._debugGraphics;
        },
        set(this: ContainerPrivate, debugLayout: boolean) {
            if (process.env.NODE_ENV === "development") {
                if (debugLayout && this._flexContainer) {
                    this.createDebugGraphics();
                } else {
                    this.destroyDebugGraphics();
                }
            }
        },
    },
    backgroundStyle: {
        get(this: ContainerPrivate): ContainerBackground | undefined {
            return this._backgroundStyle;
        },
        set(this: ContainerPrivate, background?: ContainerBackground) {
            if (background) {
                this.createBackgroundGraphics();
            } else {
                this.destroyBackgroundGraphics();
            }
            this._backgroundStyle = background;
            this._backgroundWidth = 0;
            this._backgroundHeight = 0;
        },
    },
});

container.addChild = function <T extends DisplayObject[]>(this: ContainerPrivate, ...children: T): T[0] {
    const result = _super.addChild.call(this, ...children);
    if (this._flexContainer) {
        for (const child of children) {
            this.layout.appendChild(child.layout);
        }
    }
    return result;
}

container.addChildAt = function <T extends DisplayObject>(this: ContainerPrivate, child: T, index: number): T {
    const result = _super.addChildAt.call(this, child, index) as T;
    if (this._flexContainer) {
        this.layout.insertChild(child.layout, index);
    }
    return result;
}

container.removeChild = function <T extends DisplayObject[]>(this: ContainerPrivate, ...children: T): T[0] {
    const result = _super.removeChild.call(this, ...children);
    if (this._flexContainer) {
        for (const child of children) {
            this.layout.removeChild(child.layout);
        }
    }
    return result;
}

container.removeChildAt = function (this: ContainerPrivate, index: number): DisplayObject {
    const result = _super.removeChildAt.call(this, index);
    if (this._flexContainer) {
        this.layout.removeChild(result.layout);
    }
    return result;
}

container.swapChildren = function (this: ContainerPrivate, child: DisplayObject, child2: DisplayObject): void {
    _super.swapChildren.call(this, child, child2);
    if (this._flexContainer) {
        this.layout.removeChild(child.layout);
        this.layout.removeChild(child2.layout);
        let firstChild = undefined, secondChild = undefined;
        let i1 = -1, i2 = -1;
        for (let i = 0; i < this.children.length; i++) {
            const currentChild = this.children[i];
            if (currentChild === child || currentChild === child2) {
                if (i1 === -1) {
                    firstChild = currentChild;
                    i1 = i;
                } else {
                    secondChild = currentChild;
                    i2 = i;
                    break;
                }
            }
        }
        this.layout.insertChild(firstChild!.layout, i1);
        this.layout.insertChild(secondChild!.layout, i2);
    }
}

container.sortChildren = function (this: ContainerPrivate): void {
    _super.sortChildren.call(this);
    if (this._flexContainer) {
        // Remove and re-add all children in the new order
        for (const child of this.children) {
            this.layout.removeChild(child.layout);
        }
        for (const child of this.children) {
            this.layout.appendChild(child.layout);
        }
    }
}

container.render = function (this: ContainerPrivate, renderer: Renderer) {
    if (this.isLayoutRoot) {
        this.layout.update();
        this.updateTransform();
    }
    _super.render.call(this, renderer);
}

container.onLayout = function (this: ContainerPrivate, layout: ComputedLayout): void {
    _super.onLayout.call(this, layout);
    const { width, height } = layout;
    if (this._backgroundGraphics && this._backgroundStyle && (width !== this._backgroundWidth || height !== this._backgroundHeight)) {
        this._backgroundGraphics.clear();
        if (typeof (this._backgroundStyle) === "function") {
            this._backgroundStyle(this._backgroundGraphics, width, height);
        } else {
            const cache = this._backgroundStyle.cacheAsBitmap && "cacheAsBitmap" in this._backgroundGraphics;
            if (cache) {
                (this._backgroundGraphics as any).cacheAsBitmap = false;
            }
            const { shape, fill, stroke, cornerRadius } = this._backgroundStyle;
            if (fill) {
                this._backgroundGraphics.beginTextureFill(fill);
            }
            if (stroke) {
                this._backgroundGraphics.lineStyle(stroke);
            }
            if (shape === "rectangle") {
                if (cornerRadius) {
                    this._backgroundGraphics.drawRoundedRect(0, 0, width, height, cornerRadius);
                } else {
                    this._backgroundGraphics.drawRect(0, 0, width, height);
                }
            } else if (shape === "ellipse") {
                this._backgroundGraphics.drawEllipse(width / 2, height / 2, width, height);
            }
            if (fill) {
                this._backgroundGraphics.endFill();
            }
            if (cache) {
                (this._backgroundGraphics as any).cacheAsBitmap = true;
            }
        }
        this._backgroundWidth = width;
        this._backgroundHeight = height;
    }
    if (process.env.NODE_ENV === "development" && this._debugGraphics) {
        // Draw container padding, and the margin and border for all children
        this._debugGraphics.clear();
        const padding = this.layout.computedPadding;

        // Draw padding
        this._debugGraphics.beginFill(0x3300ff, 0.125, false);
        if (padding.top) {
            this._debugGraphics.drawRect(0, 0, width, padding.top);
        }
        if (padding.bottom) {
            this._debugGraphics.drawRect(0, height - padding.bottom, width, padding.bottom);
        }
        if (padding.left) {
            this._debugGraphics.drawRect(0, padding.top, padding.left, height - padding.top - padding.bottom);
        }
        if (padding.right) {
            this._debugGraphics.drawRect(width - padding.right, padding.top, padding.right, height - padding.top - padding.bottom);
        }
        this._debugGraphics.endFill();

        for (const child of this.children) {
            if (child.layout.excluded) {
                continue;
            }
            const border = child.layout.computedBorder;
            const margin = child.layout.computedMargin;

            const { left: childLeft, top: childTop, width: childWidth, height: childHeight } = child.layout.computedLayout;

            // Draw margin
            this._debugGraphics.beginFill(0xffff00, 0.125, false);
            if (margin.top) {
                this._debugGraphics.drawRect(childLeft, childTop - margin.top, childWidth, margin.top);
            }
            if (margin.bottom) {
                this._debugGraphics.drawRect(childLeft, childTop + childHeight, childWidth, margin.bottom);
            }
            if (margin.left) {
                this._debugGraphics.drawRect(childLeft - margin.left, childTop - margin.top, margin.left, childHeight + margin.top + margin.bottom);
            }
            if (margin.right) {
                this._debugGraphics.drawRect(childLeft + childWidth, childTop - margin.top, margin.right, childHeight + margin.top + margin.bottom);
            }
            this._debugGraphics.endFill();

            // Draw border
            this._debugGraphics.lineStyle({
                color: 0,
                alpha: 1,
                width: Math.max(2, border.top),
                smooth: false,
            });
            this._debugGraphics.moveTo(childLeft - border.left / 2, childTop - border.top / 2);
            this._debugGraphics.lineTo(childLeft + childWidth + border.right / 2, childTop - border.top / 2);
            this._debugGraphics.lineStyle({
                color: 0,
                alpha: 1,
                width: Math.max(2, border.right),
                smooth: false,
            });
            this._debugGraphics.lineTo(childLeft + childWidth + border.right / 2, childTop + childHeight + border.bottom / 2);
            this._debugGraphics.lineStyle({
                color: 0,
                alpha: 1,
                width: Math.max(2, border.bottom),
                smooth: false,
            });
            this._debugGraphics.lineTo(childLeft - border.left / 2, childTop + childHeight + border.bottom / 2);
            this._debugGraphics.lineStyle({
                color: 0,
                alpha: 1,
                width: Math.max(2, border.left),
                smooth: false,
            });
            this._debugGraphics.lineTo(childLeft - border.left / 2, childTop - border.top / 2);
            this._debugGraphics.lineStyle({ width: 0 });
        }
    }
}

container.createBackgroundGraphics = function (this: ContainerPrivate): void {
    if (this._flexContainer && !this._backgroundGraphics) {
        this._backgroundGraphics = new Graphics();
        this._backgroundGraphics.layout.excluded = true;
        this.addChildAt(this._backgroundGraphics, 0);
    }
}

container.destroyBackgroundGraphics = function (this: ContainerPrivate): void {
    if (this._backgroundGraphics) {
        this._backgroundGraphics.destroy();
        this._backgroundGraphics = undefined;
    }
}

if (process.env.NODE_ENV === "development") {
    container.createDebugGraphics = function (this: ContainerPrivate): void {
        if (this._flexContainer && !this._debugGraphics) {
            this._debugGraphics = new Graphics();
            this._debugGraphics.layout.excluded = true;
            this._debugGraphics.zIndex = Number.MAX_SAFE_INTEGER;
            this.addChild(this._debugGraphics);
        }
    }

    container.destroyDebugGraphics = function (this: ContainerPrivate): void {
        if (this._debugGraphics) {
            this._debugGraphics.destroy();
            this._debugGraphics = undefined;
        }
    }
}
