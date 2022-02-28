import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Tickable } from "../core/engine";
import { IProjectileDisplay, Projectile, PROJECTILE_LIFETIME, UFO, Ship } from "../core";
import { GameTheme } from "./GameTheme";
import { IDestroyOptions } from "@pixi/display";

const GEOMETRY = (() => {
    const graphics = new Graphics();
    graphics.beginFill(0xffffff, 1, true);
    graphics.drawCircle(0, 0, 5);
    graphics.endFill();
    return graphics.geometry;
})();

export class ProjectileDisplay extends Graphics implements IProjectileDisplay, Tickable {
    // private readonly _timeline: anime.AnimeTimelineInstance;
    private readonly _projectile: Projectile;

    constructor(projectile: Projectile, theme: GameTheme) {
        super(GEOMETRY);
        projectile.display = this;
        this._projectile = projectile;
        this._projectile.queue.add(100, this);
        this.tint = projectile.from instanceof UFO
            ? theme.ufoColor
            : projectile.from instanceof Ship && projectile.from.powerupRemaining
                ? theme.powerupColor
                : theme.foregroundColor;

        this.position.copyFrom(projectile.position);
        this.rotation = projectile.rotation;

        // TODO keep this or not?
        // this.filters = [
        //     new GlowFilter({
        //         outerStrength: 2,
        //         distance: 10,
        //         color: this._projectile.color,
        //     })
        // ];
        // this._timeline = anime.timeline({
        //     autoplay: false,
        //     loop: true,
        //     direction: "alternate",
        // }).add({
        //     targets: this.filters![0],
        //     outerStrength: 6,
        //     duration: 50,
        //     easing: "linear",
        // });
    }

    tick(timestamp: number, elapsed: number): void {
        // this._timeline.tick(timestamp);
        this.alpha = Math.min(1, (PROJECTILE_LIFETIME - this._projectile.life) / (PROJECTILE_LIFETIME * 0.2));
    }

    gameObjectDestroyed(): void {
        this.destroy({ children: true });
    }

    override destroy(options?: boolean | IDestroyOptions): void {
        this._projectile.queue.remove(100, this);
        this._projectile.display = undefined;
        super.destroy(options);
    }
}
