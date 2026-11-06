import Phaser from 'phaser';
import type { CompanionDef } from '../../../content/companions';
import { settings } from '../../../content/settings';
import { strings } from '../../../content/strings';
import { kratziNeck, sprites, type Direction } from '../../../content/sprites';
import { Cooldown, startRoll, stepRoll, ZoomMeter, type RollState } from '../../systems/gags';
import { facingFrom } from '../../systems/movement';
import type { Point } from '../../systems/Pathfinding';
import { constrainToRope, ropePixels } from '../../systems/rope';
import { ui } from '../../ui/ui';
import { DEPTH, entityDepth } from '../../world/depth';
import type { Spot } from '../../world/DiscoverySpots';
import { StepCounter } from '../../world/Footprints';
import type { Interactable } from '../../world/Interactables';
import { surfaceAt } from '../../world/VillageMap';
import { placeOrigin } from '../Player';
import type { Companion, CompanionCtx, GagId } from './Companion';

const ROPE = 0xf0d9a0;
const ROPE_SHADOW = 0x5a4128;

type HeadState = 'on' | 'rolling' | 'lying' | 'returning';

/**
 * Kratzi rides a little wooden sled that you pull on a rope. Run for too long and
 * his (very old, very loose) head pops off and bounces away – go and put it back.
 */
export class Kratzi implements Companion {
  private readonly sled: Phaser.GameObjects.Sprite;
  private readonly body: Phaser.GameObjects.Sprite;
  private readonly head: Phaser.GameObjects.Sprite;
  private readonly headShadow: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly rope: Phaser.GameObjects.Graphics;
  private readonly stars: Phaser.GameObjects.Particles.ParticleEmitter;
  private x: number;
  private y: number;
  private facing: Direction = 'down';
  private orientation: 'side' | 'front' = 'front';
  private flip = false;
  private tracks = new StepCounter(4);
  private wobble = 0;
  private headState: HeadState = 'on';
  private roll: RollState | null = null;
  private tilt = 0;
  private readonly meter = new ZoomMeter(settings.gags.kratziRunSeconds, settings.gags.kratziCooldown);
  private readonly sense = new Cooldown(settings.gags.senseCooldown);
  private readonly pickUp: Interactable;
  private ctxRef: CompanionCtx | null = null;
  private travel = { x: 0, y: 1 };

  /** Set by the world: world point → CSS pixels (for the bubble that follows the rolling head). */
  project: (p: Point) => { x: number; y: number } | null = () => null;

  constructor(
    private readonly scene: Phaser.Scene,
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
    this.headShadow = scene.add.image(x, y, 'shadow-small').setVisible(false);
    this.head = scene.add.sprite(x, y, 'kratzi-head');
    placeOrigin(this.head, 'kratzi-head');
    this.rope = scene.add.graphics();
    this.stars = scene.add
      .particles(0, 0, 'star', {
        emitting: false,
        lifespan: 650,
        speed: { min: 40, max: 90 },
        angle: { min: 0, max: 360 },
        alpha: { start: 1, end: 0 },
        scale: { start: 1, end: 0.6 },
      })
      .setDepth(DEPTH.marker);
    this.pickUp = {
      key: 'kratzi-head',
      x,
      y,
      range: 30,
      hitW: 26,
      hitH: 24,
      promptY: 18,
      enabled: false,
      interact: () => this.putHeadBack(),
    };
  }

  snapTo(x: number, y: number): void {
    this.x = x;
    this.y = y - this.def.followDistance;
  }

  bubblePoint(): Point {
    if (this.roll && this.headState !== 'on') return { x: this.roll.x, y: this.roll.y - this.roll.z - 16 };
    return { x: this.x, y: this.y - 30 };
  }

  interactables(): Interactable[] {
    if (this.roll) {
      this.pickUp.x = this.roll.x;
      this.pickUp.y = this.roll.y;
    }
    this.pickUp.enabled = this.headState === 'rolling' || this.headState === 'lying';
    return [this.pickUp];
  }

  update(dt: number, ctx: CompanionCtx): void {
    this.ctxRef = ctx;
    const { player } = ctx;
    const now = ctx.time / 1000;
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
      this.orientation = Math.abs(mx) > Math.abs(my) ? 'side' : 'front';
      this.flip = mx > 0;
      this.travel = { x: mx / moved, y: my / moved };
      this.facing = facingFrom(player.x - this.x, player.y - this.y, this.facing);
      if (this.tracks.advance(moved) !== 0) {
        ctx.footprints.stamp('sled', this.x, this.y - 2, this.orientation === 'side', surfaceAt(ctx.map, this.x, this.y));
      }
      this.wobble += dt * 18;
    }

    // the zoom meter: run too long and … plopp!
    const fast = player.running && player.lastStep > 0.4;
    if (this.headState === 'on' && this.meter.update(dt, fast, now)) this.popHead(ctx);

    // notice hidden things: a dignified head tilt
    if (!ctx.calm && this.headState === 'on' && this.tilt <= 0 && this.sense.ready(now)) {
      const spot = ctx.spots.nearestHidden(this.x, this.y, settings.gags.senseRadius.kratzi);
      if (spot) {
        this.sense.trigger(now);
        this.noticeSpot(spot, ctx);
      }
    }
    if (this.tilt > 0) this.tilt -= dt;

    // sled + rider
    const depth = entityDepth(this.y);
    this.sled.play(`sled:${this.orientation}`, true).setFlipX(this.orientation === 'side' && this.flip);
    this.sled.setPosition(this.x, this.y).setDepth(depth);
    this.shadow.setPosition(this.x, this.y + 1).setDepth(depth - 0.5);

    const bump = moving ? Math.round(Math.abs(Math.sin(this.wobble)) * 1) : 0;
    const bodyX = this.x;
    const bodyY = this.y - 7 - bump;
    this.body.play(`kratzi:idle-${this.facing}`, true).setPosition(bodyX, bodyY).setDepth(depth + 0.1);
    this.updateHead(dt, ctx, bodyX, bodyY, depth);
    this.drawRope(player.x, player.y);
  }

  private neckPoint(bodyX: number, bodyY: number): Point {
    const neck = kratziNeck[this.facing];
    const k = sprites.kratzi;
    return { x: bodyX + neck.x - k.feet.x, y: bodyY + neck.y - k.feet.y };
  }

  private updateHead(dt: number, ctx: CompanionCtx, bodyX: number, bodyY: number, depth: number): void {
    const neck = this.neckPoint(bodyX, bodyY);
    if (this.headState === 'on') {
      this.head.play(`kratzi-head:idle-${this.facing}`, true).setPosition(neck.x, neck.y).setDepth(depth + 0.2);
      this.head.setAngle(this.tilt > 0 ? (this.facing === 'left' ? -18 : 18) : 0);
      return;
    }
    if (this.headState === 'returning' || !this.roll) return; // the tween is in charge
    if (this.headState === 'rolling') {
      const free = (x: number, y: number) => !ctx.grid.isBlockedAt(x, y);
      this.roll = stepRoll(this.roll, dt, free);
      if (this.roll.landed) {
        // cartoony squash on every bounce
        this.head.setScale(1.3, 0.7);
        this.scene.tweens.add({ targets: this.head, scaleX: 1, scaleY: 1, duration: 160, ease: 'Back.easeOut' });
      }
      if (this.roll.resting) {
        this.headState = 'lying';
        this.head.play('kratzi-head:idle-down', true);
      }
    }
    const r = this.roll;
    this.head.setPosition(r.x, r.y - r.z).setRotation(r.angle).setDepth(entityDepth(r.y) + 0.2);
    const s = Math.max(0.4, 1 - r.z / 40);
    this.headShadow.setVisible(true).setPosition(r.x, r.y + 1).setScale(s).setDepth(entityDepth(r.y) - 0.5);
  }

  private popHead(ctx: CompanionCtx): void {
    const start = this.neckPoint(this.x, this.y - 7);
    // fly off in the direction the sled is going, a bit to the side
    const roll = startRoll(start.x, this.y + 2, this.travel.x || 0.3, this.travel.y || 1);
    roll.z = this.y + 2 - start.y;
    this.roll = roll;
    this.headState = 'rolling';
    this.stars.explode(14, start.x, start.y);
    this.head.setScale(1.3);
    ui().bubbles.show(() => (this.roll ? this.project({ x: this.roll.x, y: this.roll.y - this.roll.z - 14 }) : null), strings.kratziPop, false, 1400);
    ctx.react('kratzi-head-pop', { x: start.x, y: this.y });
    ctx.gag('kratzi-head-pop');
  }

  private putHeadBack(): void {
    const ctx = this.ctxRef;
    if (!ctx || !this.roll || this.headState === 'on' || this.headState === 'returning') return;
    this.headState = 'returning';
    this.headShadow.setVisible(false);
    const from = { x: this.head.x, y: this.head.y, rot: this.head.rotation };
    const counter = { t: 0 };
    this.scene.tweens.add({
      targets: counter,
      t: 1,
      duration: 480,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const to = this.neckPoint(this.x, this.y - 7);
        const t = counter.t;
        this.head
          .setPosition(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t - Math.sin(Math.PI * t) * 26)
          .setRotation(from.rot * (1 - t) + Math.PI * 2 * t)
          .setDepth(entityDepth(this.y) + 0.2);
      },
      onComplete: () => {
        this.headState = 'on';
        this.roll = null;
        this.head.setRotation(0).setScale(1.25, 0.8);
        this.scene.tweens.add({ targets: this.head, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
        this.stars.explode(6, this.head.x, this.head.y - 6);
        ctx.react('kratzi-head-back', { x: this.x, y: this.y }, true);
      },
    });
  }

  private noticeSpot(spot: Spot, ctx: CompanionCtx): void {
    this.tilt = 2.2;
    this.facing = facingFrom(spot.x - this.x, spot.y - this.y, this.facing);
    ctx.spots.reveal(spot);
    ctx.react('kratzi-notice', { x: this.x, y: this.y }, true);
    ctx.gag('kratzi-notice');
  }

  debugTrigger(gag: GagId, ctx: CompanionCtx): boolean {
    this.ctxRef = ctx;
    if (gag === 'kratzi-head-pop') {
      if (this.headState !== 'on') return false;
      this.popHead(ctx);
      return true;
    }
    if (gag === 'kratzi-notice') {
      const spot = ctx.spots.nearestHidden(this.x, this.y, 900);
      if (spot) this.noticeSpot(spot, ctx);
      else {
        this.tilt = 2.2;
        ctx.react('kratzi-notice', { x: this.x, y: this.y }, true);
        ctx.gag('kratzi-notice');
      }
      return true;
    }
    return false;
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
