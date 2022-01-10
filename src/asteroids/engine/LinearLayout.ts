import { Container } from "@pixi/display";
import { Layout } from "./Layout";

export type LinearLayoutDirection = "row" | "column";

export class LinearLayout extends Layout {
    private _direction: LinearLayoutDirection;
    private _spacing: number;

    constructor(direction?: LinearLayoutDirection, spacing?: number) {
        super();
        this._direction = direction || "row";
        this._spacing = spacing || 0;
    }

    update(): void {
        const positionableChildren = this.children.filter((child) => child instanceof Container) as Container[];
        const maxOffAxisSize = positionableChildren.reduce((size, child) => Math.max(size, this.getOffAxisSize(child)), 0);

        let onAxis = 0;
        for (const child of positionableChildren) {
            this.setChildPosition(child, onAxis, (maxOffAxisSize - this.getOffAxisSize(child)) / 2);
            onAxis += this._spacing + this.getOnAxisSize(child);
        }
    }

    set direction(direction: LinearLayoutDirection) {
        this._direction = direction;
    }

    set spacing(spacing: number) {
        this._spacing = spacing;
    }

    private getOnAxisSize(child: Container): number {
        return this._direction === "row" ? child.width : child.height;
    }

    private getOffAxisSize(child: Container): number {
        return this._direction === "row" ? child.height : child.width;
    }

    private setChildPosition(child: Container, onAxis: number, offAxis: number): void {
        if (this._direction === "row") {
            child.position.set(onAxis, offAxis);
        } else {
            child.position.set(offAxis, onAxis);
        }
    }
}
