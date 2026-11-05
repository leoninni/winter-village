import Phaser from 'phaser';
import type { CompanionDef } from '../../../content/companions';
import { kratziNeck, sprites, type Direction } from '../../../content/sprites';
import { facingFrom } from '../../systems/movement';
import { constrainToRope, ropePixels } from '../../systems/rope';
import { entityDepth } from '../../world/depth';
import { StepCounter } from '../../world/Footprints';
import { surfaceAt } from '../../world/VillageMap';
import { placeOrigin } from '../Player';
import type { Companion, CompanionCtx } from './Companion';

const ROPE = 0xf0d9a0;
const ROPE_SHADOW = 0x5a4128;

/**
 * Kratzi rides a little wooden sled that you pull on a rope. The sled trails
 * behind (rope constraint), swings round corners and leaves runner tracks.
 * The head is a separate sprite – in Phase 2 it gets to pop off.
 */
export class Kratzi implements Companion {
  private readonly sled: Phaser.GameObjects.Sprite;
  private readonly body: Phaser.GameObjects.Sprite;
  private readonly head: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly rope: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;
  private facing: Direction = 'down';
  private orientation: 'side' | 'front' = 'front';
  private flip = false;
  private tracks = new StepCounter(4);
  private wobble = 0;

  constructor(
    scene: Phaser.Scene,
    readonly def: CompanionDef,
    x: number,
    y: number,
  ) {
    this.x = x;
    this.y = y;
    this.shadow = scene.add.image(x, y, 'shadow');
    this.sled = scene.add.sprite(x, y, 'sled');
    placeOrigin(this.sled, 'sled');
    this.body = scene.add.sprite(x, y, 'kratzi');
    placeOrigin(this.body, 'kratzi');
    this.head = scene.add.sprite(x, y, 'kratzi-head');
    placeOrigin(this.head, 'kratzi-head');
    this.rope = scene.add.graphics();
  }

  snapTo(x: number, y: number): void {
    this.x = x;
    this.y = y - this.def.followDistance;
  }

  update(dt: number, ctx: CompanionCtx): void {
    const { player } = ctx;
    const before = { x: this.x, y: this.y };
    const pos = constrainToRope({ x: this.x, y: this.y }, player, this.def.followDistance);
    if (Math.hypot(pos.x - player.x, pos.y - player.y) > 200) this.snapTo(player.x, player.y);
    else {
      this.x = pos.x;
      this.y = pos.y;
    }
    const mx = this.x - before.x;
    const my = this.y - before.y;
    const moved = Math.hypot(mx, my);
    const moving = moved > 0.05;

    if (moving) {
      // the sled points along its travel direction; Kratzi faces forward (towards you)
      this.orientation = Math.abs(mx) > Math.abs(my) ? 'side' : 'front';
      this.flip = mx > 0;
      this.facing = facingFrom(player.x - this.x, player.y - this.y, this.facing);
      if (this.tracks.advance(moved) !== 0) {
        ctx.footprints.stamp('sled', this.x, this.y - 2, this.orientation === 'side', surfaceAt(ctx.map, this.x, this.y));
      }
      this.wobble += dt * 18;
    }

    // sled + rider
    const depth = entityDepth(this.y);
    this.sled.play(`sled:${this.orientation}`, true).setFlipX(this.orientation === 'side' && this.flip);
    this.sled.setPosition(this.x, this.y).setDepth(depth);
    this.shadow.setPosition(this.x, this.y + 1).setDepth(depth - 0.5);

    const bump = moving ? Math.round(Math.abs(Math.sin(this.wobble)) * 1) : 0;
    const bodyX = this.x;
    const bodyY = this.y - 7 - bump;
    this.body.play(`kratzi:idle-${this.facing}`, true).setPosition(bodyX, bodyY).setDepth(depth + 0.1);
    const neck = kratziNeck[this.facing];
    const k = sprites.kratzi;
    this.head
      .play(`kratzi-head:idle-${this.facing}`, true)
      .setPosition(bodyX + neck.x - k.feet.x, bodyY + neck.y - k.feet.y)
      .setDepth(depth + 0.2);

    this.drawRope(player.x, player.y);
  }

  /** Pixel rope from the player's hand to the front of the sled, sagging when slack. */
  private drawRope(px: number, py: number): void {
    const towardsPlayerX = Math.sign(px - this.x) || 1;
    const towardsPlayerY = Math.sign(py - this.y) || 1;
    // the hand holding the rope: at your side, towards the sled
    const hand = { x: px + (this.x < px - 4 ? -6 : this.x > px + 4 ? 6 : 5), y: py - 13 };
    const front =
      this.orientation === 'side'
        ? { x: this.x + towardsPlayerX * 14, y: this.y - 6 }
        : { x: this.x, y: this.y + (towardsPlayerY > 0 ? 0 : -18) };
    const pts = ropePixels(front, hand, this.def.followDistance + 4);
    const g = this.rope;
    g.clear();
    g.fillStyle(ROPE_SHADOW, 1);
    for (const p of pts) g.fillRect(p.x, p.y + 1, 1, 1);
    g.fillStyle(ROPE, 1);
    for (const p of pts) g.fillRect(p.x, p.y, 1, 1);
    // between the two: behind you when the sled trails behind, over you when it's in front
    g.setDepth(entityDepth(Math.min(py, this.y)) + 0.3);
  }
}
