import Phaser from 'phaser';
import { settings } from '../../content/settings';
import type { Surface } from './tiles';
import { DEPTH } from './depth';

export type PrintKind = 'boot' | 'paw' | 'sled';

/**
 * Footprints that slowly melt away. Pooled images, so walking for an hour
 * doesn't allocate anything new. No prints on ice; faint ones on trodden paths.
 */
export class Footprints {
  private pool: Phaser.GameObjects.Image[] = [];
  private live: { img: Phaser.GameObjects.Image; born: number; alpha: number }[] = [];
  private readonly lifetimeMs = settings.footprints.lifetime * 1000;

  constructor(private readonly scene: Phaser.Scene) {}

  /**
   * Leave a print at (x, y). `horizontal` = moving mostly left/right.
   * Returns false if the surface takes no prints.
   */
  stamp(kind: PrintKind, x: number, y: number, horizontal: boolean, surface: Surface): boolean {
    if (surface === 'ice' || surface === 'wood' || surface === 'rug') return false;
    let alpha = kind === 'sled' ? 0.4 : 0.5;
    if (surface === 'path') alpha *= 0.45;
    let texture: string;
    if (kind === 'sled') texture = horizontal ? 'print-sled-h' : 'print-sled-v';
    else if (surface === 'deep') texture = 'print-deep';
    else if (kind === 'paw') texture = 'print-paw';
    else texture = horizontal ? 'print-boot-h' : 'print-boot-v';

    let img = this.pool.pop();
    if (!img) {
      img = this.scene.add.image(0, 0, texture).setDepth(DEPTH.prints);
    }
    img.setTexture(texture).setPosition(Math.round(x), Math.round(y)).setAlpha(alpha).setVisible(true);
    this.live.push({ img, born: this.scene.time.now, alpha });

    if (this.live.length > settings.footprints.max) this.recycle(0);
    return true;
  }

  update(now: number): void {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i]!;
      const t = (now - p.born) / this.lifetimeMs;
      if (t >= 1) this.recycle(i);
      else if (t > 0.6) p.img.setAlpha(p.alpha * (1 - (t - 0.6) / 0.4));
    }
  }

  private recycle(index: number): void {
    const [p] = this.live.splice(index, 1);
    if (!p) return;
    p.img.setVisible(false);
    this.pool.push(p.img);
  }
}

/** Measures distance walked and fires a callback every `stride` pixels. */
export class StepCounter {
  private acc = 0;
  private foot = 1;
  constructor(private readonly stride: number) {}

  /** Returns +1 / -1 (alternating feet) when a step lands, else 0. */
  advance(distance: number, stride = this.stride): number {
    this.acc += distance;
    if (this.acc < stride) return 0;
    this.acc = 0;
    this.foot = -this.foot;
    return this.foot;
  }
}
