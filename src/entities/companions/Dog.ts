import Phaser from 'phaser';
import type { CompanionDef } from '../../../content/companions';
import { settings } from '../../../content/settings';
import type { Direction } from '../../../content/sprites';
import { Cooldown } from '../../systems/gags';
import { facingFrom } from '../../systems/movement';
import type { FeetBox } from '../../systems/NavGrid';
import { planPath, type Point } from '../../systems/Pathfinding';
import { entityDepth } from '../../world/depth';
import type { Spot } from '../../world/DiscoverySpots';
import { StepCounter } from '../../world/Footprints';
import type { Interactable } from '../../world/Interactables';
import { surfaceAt } from '../../world/VillageMap';
import { placeOrigin } from '../Player';
import type { Companion, CompanionCtx, GagId } from './Companion';

export interface DogStyle {
  /** Teddy: bounces through deep snow and sniffs out hidden things. */
  teddy?: boolean;
  /** Pauli: sinks into deep snow, digs things up, sometimes gets stuck. */
  pauli?: boolean;
}

const DOG_BOX: FeetBox = { hw: 4, hh: 2 };
const rand = (a: number, b: number) => a + Math.random() * (b - a);

type Mode = 'follow' | 'go' | 'work' | 'wait' | 'stuck' | 'dig';

/** A dog that trots along your trail – Teddy or Pauli – with their own little habits. */
export class Dog implements Companion {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly spray: Phaser.GameObjects.Particles.ParticleEmitter;
  private x: number;
  private y: number;
  private facing: Direction = 'down';
  private steps = new StepCounter(7);
  private bounce = 0;
  private mode: Mode = 'follow';
  private timer = 0;
  private waypoints: Point[] = [];
  private target: Spot | null = null;
  private readonly sense = new Cooldown(settings.gags.senseCooldown);
  private readonly stuckCooldown = new Cooldown(settings.gags.pauliStuckCooldown);
  private nextRandomDig = rand(...settings.gags.pauliRandomDig);
  private idleFor = 0;
  private idleReacted = false;
  private wherePauliAt = 0;
  private readonly rescue: Interactable;

  constructor(
    private readonly scene: Phaser.Scene,
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
    this.spray = scene.add
      .particles(0, 0, 'puff', {
        emitting: false,
        lifespan: 450,
        speed: { min: 30, max: 70 },
        angle: { min: 200, max: 340 },
        gravityY: 160,
        scale: { start: 1, end: 0.4 },
        alpha: { start: 1, end: 0 },
      })
      .setDepth(entityDepth(y) + 2);
    this.rescue = {
      key: 'pauli-stuck',
      x,
      y,
      range: 36,
      hitW: 30,
      hitH: 22,
      promptY: 18,
      enabled: false,
      interact: () => this.rescueMe(),
    };
  }

  private ctxRef: CompanionCtx | null = null;

  snapTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  private pos(): Point {
    return { x: this.x, y: this.y };
  }

  bubblePoint(): Point {
    return { x: this.x, y: this.y - (this.mode === 'stuck' ? 12 : this.sprite.frame.height - 2) };
  }

  interactables(): Interactable[] {
    this.rescue.x = this.x;
    this.rescue.y = this.y;
    this.rescue.enabled = this.mode === 'stuck';
    return [this.rescue];
  }

  update(dt: number, ctx: CompanionCtx): void {
    this.ctxRef = ctx;
    const now = ctx.time / 1000;
    const { player } = ctx;
    let moved = 0;
    let speedUsed = 0;

    switch (this.mode) {
      case 'follow': {
        const target = ctx.trail.pointBehind(player, this.def.followDistance);
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 320) this.snapTo(target.x, target.y);
        speedUsed = Math.min(this.def.speed, dist * 6);
        const step = Math.min(dist, speedUsed * dt);
        if (dist > 0.5 && step > 0.05) {
          this.x += (dx / dist) * step;
          this.y += (dy / dist) * step;
          moved = step;
          this.facing = facingFrom(dx, dy, this.facing);
        } else if (!player.moving) {
          this.facing = facingFrom(player.x - this.x, player.y - this.y, this.facing);
        }
        if (!ctx.calm) this.checkHabits(dt, ctx, now, moved);
        break;
      }
      case 'go': {
        if (Math.hypot(player.x - this.x, player.y - this.y) > 300 || !this.target) {
          this.mode = 'follow';
          break;
        }
        const wp = this.waypoints[0];
        if (!wp) {
          this.startWork(ctx);
          break;
        }
        const dx = wp.x - this.x;
        const dy = wp.y - this.y;
        const d = Math.hypot(dx, dy);
        speedUsed = this.def.speed;
        const step = Math.min(d, speedUsed * dt);
        if (d < 1) this.waypoints.shift();
        else {
          this.x += (dx / d) * step;
          this.y += (dy / d) * step;
          moved = step;
          this.facing = facingFrom(dx, dy, this.facing);
        }
        break;
      }
      case 'work':
      case 'dig': {
        this.timer -= dt;
        if (this.style.pauli && Math.random() < dt * 14) this.spray.explode(2, this.x + (this.facing === 'left' ? 4 : -4), this.y - 3);
        if (this.style.teddy) this.facing = Math.floor(ctx.time / 220) % 2 ? 'left' : 'right'; // sniffing around
        if (this.timer <= 0) {
          if (this.mode === 'work' && this.target) {
            ctx.spots.reveal(this.target, !!this.style.pauli);
            this.mode = 'wait';
            this.timer = 7;
          } else this.mode = 'follow';
        }
        break;
      }
      case 'wait': {
        this.timer -= dt;
        this.facing = facingFrom(player.x - this.x, player.y - this.y, this.facing);
        if (this.timer <= 0 || Math.hypot(player.x - this.x, player.y - this.y) < 44) this.mode = 'follow';
        break;
      }
      case 'stuck': {
        this.facing = 'down';
        if (this.wherePauliAt && ctx.time > this.wherePauliAt) {
          this.wherePauliAt = 0;
          ctx.react('where-is-pauli', player, true);
        }
        break;
      }
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
    if (this.mode === 'stuck') crop = 13;
    else if (surface === 'deep' && moving) {
      if (this.style.teddy) {
        this.bounce += dt * 13;
        offsetY = -Math.round(Math.abs(Math.sin(this.bounce)) * 5);
      }
      if (this.style.pauli) crop = 6;
    } else this.bounce = 0;
    if (this.mode === 'work' && this.style.teddy) offsetY = -Math.round(Math.abs(Math.sin(ctx.time / 90)) * 2);

    const busy = this.mode === 'work' || this.mode === 'dig';
    this.sprite.play(`${this.def.id}:${moving || busy ? 'walk' : 'idle'}-${this.facing}`, true);
    this.sprite.anims.timeScale = moving ? Math.max(0.6, speedUsed / 90) : busy ? 1.8 : 1;
    if (crop) this.sprite.setCrop(0, 0, this.sprite.frame.width, this.sprite.frame.height - crop);
    else if (this.sprite.isCropped) this.sprite.setCrop();
    this.sprite.setPosition(this.x, this.y + offsetY + crop).setDepth(entityDepth(this.y));
    this.shadow.setPosition(this.x, this.y).setDepth(entityDepth(this.y) - 0.5).setVisible(crop === 0);
    this.spray.setDepth(entityDepth(this.y) + 2);
  }

  /** While following: sense hidden things, get stuck, dig for fun, be cute when you wait. */
  private checkHabits(dt: number, ctx: CompanionCtx, now: number, moved: number): void {
    const { player } = ctx;
    // 1) sense something hidden nearby
    if (this.sense.ready(now)) {
      const radius = this.style.teddy ? settings.gags.senseRadius.teddy : settings.gags.senseRadius.pauli;
      const spot = ctx.spots.nearestHidden(this.x, this.y, radius);
      if (spot && this.goTo(spot, ctx)) {
        this.sense.trigger(now);
        return;
      }
    }
    // 2) Pauli: stuck in a snowdrift
    if (this.style.pauli && moved > 0 && surfaceAt(ctx.map, this.x, this.y) === 'deep' && this.stuckCooldown.ready(now)) {
      if (Math.random() < settings.gags.pauliStuckChance * dt) {
        this.getStuck(ctx);
        return;
      }
    }
    // 3) Pauli: dig for nothing in particular
    if (this.style.pauli && now > this.nextRandomDig && !player.moving && !ctx.map.indoor) {
      this.nextRandomDig = now + rand(...settings.gags.pauliRandomDig);
      this.mode = 'dig';
      this.timer = 1.4;
      this.facing = 'left';
      ctx.react('pauli-dig-nothing', this.pos(), true);
      ctx.gag('pauli-dig');
      return;
    }
    // 4) be cute while you stand still
    if (!player.moving) {
      this.idleFor += dt;
      if (!this.idleReacted && this.idleFor > settings.gags.idleSeconds) {
        this.idleReacted = true;
        ctx.react('idle', this.pos());
      }
    } else {
      this.idleFor = 0;
      this.idleReacted = false;
    }
  }

  private goTo(spot: Spot, ctx: CompanionCtx): boolean {
    const plan = planPath(ctx.grid, this.pos(), spot, DOG_BOX);
    if (!plan || plan.length > 400) return false;
    this.target = spot;
    this.waypoints = plan.waypoints;
    this.mode = 'go';
    return true;
  }

  private startWork(ctx: CompanionCtx): void {
    this.mode = 'work';
    this.timer = 1.7;
    this.facing = 'down';
    if (this.style.teddy) {
      ctx.react('teddy-sniff', this.pos(), true);
      ctx.gag('teddy-sniff');
    } else {
      ctx.react('pauli-dig', this.pos(), true);
      ctx.gag('pauli-dig');
    }
  }

  private getStuck(ctx: CompanionCtx): void {
    this.mode = 'stuck';
    this.spray.explode(10, this.x, this.y - 2);
    ctx.react('pauli-stuck', this.pos(), true);
    ctx.gag('pauli-stuck');
    this.wherePauliAt = ctx.time + 2600;
  }

  private rescueMe(): void {
    const ctx = this.ctxRef;
    if (!ctx || this.mode !== 'stuck') return;
    this.mode = 'follow';
    this.stuckCooldown.trigger(ctx.time / 1000);
    this.wherePauliAt = 0;
    this.spray.explode(18, this.x, this.y - 4);
    this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 10, duration: 160, yoyo: true, repeat: 2, ease: 'Quad.easeOut' });
    ctx.react('pauli-rescued', this.pos(), true);
  }

  debugTrigger(gag: GagId, ctx: CompanionCtx): boolean {
    this.ctxRef = ctx;
    if (gag === 'pauli-stuck' && this.style.pauli) {
      this.getStuck(ctx);
      return true;
    }
    if ((gag === 'pauli-dig' && this.style.pauli) || (gag === 'teddy-sniff' && this.style.teddy)) {
      const spot = ctx.spots.nearestHidden(this.x, this.y, 700);
      if (spot && this.goTo(spot, ctx)) return true;
      // nothing hidden nearby: do it on the spot
      if (this.style.pauli) {
        this.mode = 'dig';
        this.timer = 1.4;
        ctx.react('pauli-dig-nothing', this.pos(), true);
      } else {
        this.mode = 'dig';
        this.timer = 1.4;
        ctx.react('teddy-sniff', this.pos(), true);
      }
      ctx.gag(gag);
      return true;
    }
    return false;
  }
}
