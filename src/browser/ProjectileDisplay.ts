import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Tickable } from "@core/engine";
import { IProjectileDisplay, Projectile, PROJECTILE_LIFETIME } from "@core";

const GEOMETRY = (() => {
    const graphics = new Graphics();
    graphics.beginFill(0xffffff, 1, true);
    graphics.drawCircle(0, 0, 5);
    graphics.endFill();
    return graphics.geometry;
})();

export class ProjectileDisplay extends Graphics implements IProjectileDisplay, Tickable {
    private readonly _projectile: Projectile;

    constructor(projectile: Projectile) {
        super(GEOMETRY);
        projectile.display = this;
        this._projectile = projectile;
        this._projectile.queue.add(100, this);
        this.tint = this._projectile.color;
        this.position.copyFrom(projectile.position);
        this.rotation = projectile.rotation;
    }

    tick(timestamp: number, elapsed: number): void {
        this.alpha = Math.min(1, (PROJECTILE_LIFETIME - this._projectile.traveled) / (PROJECTILE_LIFETIME * 0.2));
    }

    override destroy(): void {
        this._projectile.queue.remove(100, this);
        this._projectile.display = undefined;
        super.destroy();
    }
}
