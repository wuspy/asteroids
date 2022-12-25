import { IRenderer, Texture, DEG_TO_RAD } from "@pixi/core";
import { Container, IDestroyOptions } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { urandom, TickQueue } from "../../core/engine";
import { createDropShadowTexture } from "../util";
import { Sprite } from "@pixi/sprite";
import anime from "animejs";

interface Particle {
    sprite: Sprite;
    x: number;
    y: number;
    radius: number;
    endX: number;
    endY: number;
}

const TEXTURE_CACHE = new WeakMap<IRenderer, Texture>();

const TEXTURE_RADIUS = 10;

const generateTextureCache = (renderer: IRenderer) => {
    const graphics = new Graphics();
    graphics.beginFill(0xffffff, 1, true);
    graphics.drawCircle(0, 0, TEXTURE_RADIUS);
    graphics.endFill();

    const texture = createDropShadowTexture(renderer, renderer.generateTexture(graphics));
    texture.defaultAnchor.set(0.5);
    TEXTURE_CACHE.set(renderer, texture);
}

export interface ExplosionProps {
    queue: TickQueue;
    diameter: number;
    maxDuration: number;
    color: number;
    renderer: IRenderer;
}

export class Explosion extends Container {
    private readonly _timeline: anime.AnimeTimelineInstance;
    private readonly _queue: TickQueue;

    constructor({ queue, diameter, maxDuration, color, renderer }: ExplosionProps) {
        super();
        this._queue = queue;

        if (!TEXTURE_CACHE.has(renderer)) {
            generateTextureCache(renderer);
        }
        const texture = TEXTURE_CACHE.get(renderer)!;
        const particles: Particle[] = [];
        const particleCount = diameter / 6;
        for (let i = 0; i < particleCount; i++) {
            const angle = urandom(0, 360) * DEG_TO_RAD;
            const [sin, cos] = [Math.sin(angle), Math.cos(angle)];
            const startRadius = urandom(diameter / 50, diameter / 10);
            const endRadius = urandom(diameter / 6, diameter / 2);
            const radius = urandom(diameter / 36, diameter / 18);

            const sprite = new Sprite(texture);
            sprite.position.set(startRadius * sin, startRadius * -cos);
            sprite.scale.set(radius / TEXTURE_RADIUS);
            sprite.tint = color;
            this.addChild(sprite);

            particles.push({
                sprite,
                x: sprite.x,
                y: sprite.y,
                radius,
                endX: endRadius * sin,
                endY: endRadius * -cos,
            });
        }
        this._timeline = anime.timeline({
            autoplay: false,
            duration: urandom(maxDuration / 1.5, maxDuration),
            complete: () => this.destroy({ children: true }),
        }).add({
            targets: particles,
            x: (p: Particle) => p.endX,
            y: (p: Particle) => p.endY,
            radius: 0,
            easing: "easeOutExpo",
            change: () => {
                for (const particle of particles) {
                    if (particle.radius < 0.2) {
                        if (!particle.sprite.destroyed) {
                            particle.sprite.destroy();
                        }
                    } else {
                        particle.sprite.position.set(particle.x, particle.y);
                        particle.sprite.scale.set(particle.radius / TEXTURE_RADIUS);
                    }
                }
            },
        });

        queue.add(100, this._timeline.tick, this._timeline);
    }

    override destroy(options?: boolean | IDestroyOptions) {
        super.destroy(options);
        this._queue.remove(this._timeline.tick, this._timeline);
    }
}
