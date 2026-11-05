import Phaser from 'phaser';
import type { CompanionDef } from '../../../content/companions';
import type { Direction } from '../../../content/sprites';
import { facingFrom } from '../../systems/movement';
import { entityDepth } from '../../world/depth';
import { StepCounter } from '../../world/Footprints';
import { surfaceAt } from '../../world/VillageMap';
import { placeOrigin } from '../Player';
import type { Companion, CompanionCtx } from './Companion';

export interface DogStyle {
  /** Teddy: bounces happily through deep snow like a dolphin. */
  bouncesInDeepSnow?: boolean;
  /** Pauli: sinks in so only the head pokes out. */
  sinksInDeepSnow?: boolean;
}

/** A dog that trots along the player's trail (Teddy, Pauli). */
export class Dog implements Companion {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Image;
  private x: number;
  private y: number;
  private facing: Direction = 'down';
  private steps = new StepCounter(7);
  private bounce = 0;

  constructor(
    scene: Phaser.Scene,
    readonly def: CompanionDef,
    private readonly style: DogStyle,
    x: number,
    y: number,
  ) {
    this.x = x;
    this.y = y;
    this.shadow = scene.add.image(x, y, 'shadow-small');
    this.sprite = scene.add.sprite(x, y, def.id);
    placeOrigin(this.sprite, def.id);
  }

  snapTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  update(dt: number, ctx: CompanionCtx): void {
    const { player } = ctx;
    const target = ctx.trail.pointBehind(player, this.def.followDistance);
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 320) this.snapTo(target.x, target.y);

    // ease in: fast when far behind, gentle when close
    const speed = Math.min(this.def.speed, dist * 6);
    const step = Math.min(dist, speed * dt);
    let moved = 0;
    if (dist > 0.5 && step > 0.05) {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      moved = step;
      this.facing = facingFrom(dx, dy, this.facing);
    } else if (!player.moving) {
      // waiting: look at your human
      this.facing = facingFrom(player.x - this.x, player.y - this.y, this.facing);
    }
    const moving = moved > 0.02;
    const surface = surfaceAt(ctx.map, this.x, this.y);

    if (moving) {
      const foot = this.steps.advance(moved);
      if (foot !== 0) {
        const horizontal = this.facing === 'left' || this.facing === 'right';
        ctx.footprints.stamp('paw', this.x + (horizontal ? 0 : foot * 2), this.y - 1 + (horizontal ? foot : 0), horizontal, surface);
      }
    }

    // personality in deep snow
    let offsetY = 0;
    let crop = 0;
    if (surface === 'deep' && moving) {
      if (this.style.bouncesInDeepSnow) {
        this.bounce += dt * 13;
        offsetY = -Math.round(Math.abs(Math.sin(this.bounce)) * 5);
      }
      if (this.style.sinksInDeepSnow) crop = 6;
    } else this.bounce = 0;

    this.sprite.play(`${this.def.id}:${moving ? 'walk' : 'idle'}-${this.facing}`, true);
    this.sprite.anims.timeScale = moving ? Math.max(0.6, speed / 90) : 1;
    const frameH = this.sprite.frame.height;
    if (crop) this.sprite.setCrop(0, 0, this.sprite.frame.width, frameH - crop);
    else if (this.sprite.isCropped) this.sprite.setCrop();
    this.sprite.setPosition(this.x, this.y + offsetY + crop).setDepth(entityDepth(this.y));
    this.shadow.setPosition(this.x, this.y).setDepth(entityDepth(this.y) - 0.5).setVisible(crop === 0);
  }
}
