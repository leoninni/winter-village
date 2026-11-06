import Phaser from 'phaser';
import type { Direction, SpriteKey } from '../../content/sprites';
import { facingFrom, moveWithCollision } from '../systems/movement';
import type { FeetBox, NavGrid } from '../systems/NavGrid';
import { planPath, type Point } from '../systems/Pathfinding';
import { entityDepth } from '../world/depth';
import { placeOrigin } from './Player';

export interface NpcCtx {
  grid: NavGrid;
  player: { x: number; y: number; running: boolean; moving: boolean };
  time: number;
}

/** Anything living in the world you can talk to. */
export interface Npc {
  readonly id: string;
  readonly kind: 'villager' | 'animal';
  x: number;
  y: number;
  /** interaction distance from the feet */
  readonly range: number;
  /** tap box (centred on x, standing on y) */
  readonly hitW: number;
  readonly hitH: number;
  /** height of the head above the feet (speech bubbles, prompt) */
  readonly headY: number;
  update(dt: number, ctx: NpcCtx): void;
  setTalking(on: boolean, towards?: Point): void;
  /** something startling happened at (x, y) */
  scare?(x: number, y: number): void;
}

const VILLAGER_BOX: FeetBox = { hw: 5, hh: 3 };
const rand = (a: number, b: number) => a + Math.random() * (b - a);

// ---------------------------------------------------------------- villagers
export class Villager implements Npc {
  readonly kind = 'villager' as const;
  readonly range = 36;
  readonly hitW = 28;
  readonly hitH = 48;
  readonly headY: number;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Image;
  private facing: Direction = 'down';
  private waypoints: Point[] = [];
  private pause = rand(1, 4);
  private talking = false;
  private readonly home: Point;

  constructor(
    scene: Phaser.Scene,
    readonly id: string,
    private readonly key: SpriteKey,
    public x: number,
    public y: number,
    private readonly wander: number,
    private readonly speed = 34,
    kid = false,
  ) {
    this.home = { x, y };
    this.headY = kid ? 42 : 50;
    this.shadow = scene.add.image(x, y, 'shadow');
    this.sprite = scene.add.sprite(x, y, key);
    placeOrigin(this.sprite, key);
    this.sync(false);
  }

  setTalking(on: boolean, towards?: Point): void {
    this.talking = on;
    if (on) {
      this.waypoints = [];
      if (towards) this.facing = facingFrom(towards.x - this.x, towards.y - this.y, this.facing);
    }
  }

  update(dt: number, ctx: NpcCtx): void {
    let moving = false;
    const near = Math.hypot(ctx.player.x - this.x, ctx.player.y - this.y) < 56;
    if (this.talking || (near && !this.waypoints.length)) {
      // polite: look at whoever is close
      if (near || this.talking) this.facing = facingFrom(ctx.player.x - this.x, ctx.player.y - this.y, this.facing);
    } else if (this.waypoints.length) {
      const wp = this.waypoints[0]!;
      const dx = wp.x - this.x;
      const dy = wp.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 1) this.waypoints.shift();
      else {
        const step = Math.min(d, this.speed * dt);
        const next = moveWithCollision(ctx.grid, this, (dx / d) * step, (dy / d) * step, VILLAGER_BOX);
        moving = Math.hypot(next.x - this.x, next.y - this.y) > 0.01;
        if (!moving) this.waypoints = [];
        this.x = next.x;
        this.y = next.y;
        this.facing = facingFrom(dx, dy, this.facing);
      }
      if (!this.waypoints.length) this.pause = rand(2.5, 7);
    } else if (this.wander > 0) {
      this.pause -= dt;
      if (this.pause <= 0) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * this.wander;
        const plan = planPath(ctx.grid, this, { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r }, VILLAGER_BOX);
        if (plan && plan.length < this.wander * 2.5) this.waypoints = plan.waypoints;
        this.pause = rand(2, 5);
      }
    }
    this.sync(moving);
  }

  private sync(moving: boolean): void {
    this.sprite.play(`${this.key}:${moving ? 'walk' : 'idle'}-${this.facing}`, true);
    this.sprite.setPosition(this.x, this.y).setDepth(entityDepth(this.y));
    this.shadow.setPosition(this.x, this.y).setDepth(entityDepth(this.y) - 0.5);
  }
}

// ---------------------------------------------------------------- horse
export class Horse implements Npc {
  readonly kind = 'animal' as const;
  readonly range = 80;
  readonly hitW = 64;
  readonly hitH = 46;
  readonly headY = 46;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private side: 'left' | 'right' = 'left';
  private eatTimer = rand(6, 12);
  private eating = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly id: string,
    public x: number,
    public y: number,
  ) {
    scene.add.image(x, y + 1, 'shadow').setScale(3, 1.4).setDepth(entityDepth(y) - 0.5);
    this.sprite = scene.add.sprite(x, y, 'horse');
    placeOrigin(this.sprite, 'horse');
    this.sprite.setDepth(entityDepth(y));
  }

  setTalking(on: boolean, towards?: Point): void {
    if (on && towards) this.side = towards.x > this.x ? 'right' : 'left';
    if (on) this.eating = 0;
  }

  update(dt: number, ctx: NpcCtx): void {
    if (Math.hypot(ctx.player.x - this.x, ctx.player.y - this.y) < 140) this.side = ctx.player.x > this.x ? 'right' : 'left';
    if (this.eating > 0) this.eating -= dt;
    else if ((this.eatTimer -= dt) <= 0) {
      this.eating = rand(2, 4);
      this.eatTimer = rand(8, 16);
    }
    this.sprite.play(`horse:${this.eating > 0 ? 'eat' : 'idle'}-${this.side}`, true);
  }

  scare(): void {
    this.eating = 0;
    this.scene.tweens.add({ targets: this.sprite, y: this.y - 4, duration: 110, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  }
}

// ---------------------------------------------------------------- chickens
export class Chicken implements Npc {
  readonly kind = 'animal' as const;
  readonly range = 30;
  readonly hitW = 20;
  readonly hitH = 18;
  readonly headY = 18;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
  private mode: 'idle' | 'peck' | 'walk' | 'flee' = 'idle';
  private timer = rand(0.5, 3);
  private target: Point | null = null;
  private readonly home: Point;
  private readonly prefix: string;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly id: string,
    public x: number,
    public y: number,
    private readonly wander: number,
    brown: boolean,
  ) {
    this.home = { x, y };
    this.prefix = brown ? 'b-' : '';
    this.sprite = scene.add.sprite(x, y, 'chicken');
    placeOrigin(this.sprite, 'chicken');
  }

  setTalking(on: boolean, towards?: Point): void {
    if (on) {
      this.mode = 'idle';
      this.target = null;
      if (towards) this.side = towards.x > this.x ? 'right' : 'left';
    }
  }

  update(dt: number, ctx: NpcCtx): void {
    if (ctx.player.running && Math.hypot(ctx.player.x - this.x, ctx.player.y - this.y) < 40) this.scare(ctx.player.x, ctx.player.y);
    this.timer -= dt;
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const d = Math.hypot(dx, dy);
      const speed = this.mode === 'flee' ? 95 : 24;
      if (d < 1 || this.timer <= 0) this.target = null;
      else {
        const step = Math.min(d, speed * dt);
        const nx = this.x + (dx / d) * step;
        const ny = this.y + (dy / d) * step;
        if (!ctx.grid.isBlockedAt(nx, ny)) {
          this.x = nx;
          this.y = ny;
        } else this.target = null;
        if (Math.abs(dx) > 0.5) this.side = dx > 0 ? 'right' : 'left';
      }
    } else if (this.timer <= 0) {
      const r = Math.random();
      if (r < 0.45) {
        this.mode = 'peck';
        this.timer = rand(0.8, 1.6);
      } else if (r < 0.8 && this.wander > 0) {
        this.mode = 'walk';
        this.target = { x: this.home.x + rand(-this.wander, this.wander), y: this.home.y + rand(-this.wander / 2, this.wander / 2) };
        this.timer = 3;
      } else {
        this.mode = 'idle';
        this.timer = rand(1, 3);
      }
    }
    const anim = this.target ? 'walk' : this.mode === 'peck' ? 'peck' : 'idle';
    this.sprite.play(`chicken:${this.prefix}${anim}-${this.side}`, true);
    this.sprite.setPosition(this.x, this.y).setDepth(entityDepth(this.y));
  }

  scare(fx: number, fy: number): void {
    if (this.mode === 'flee' && this.target) return;
    const a = Math.atan2(this.y - fy, this.x - fx) + rand(-0.6, 0.6);
    this.mode = 'flee';
    this.target = { x: this.x + Math.cos(a) * 46, y: this.y + Math.sin(a) * 30 };
    this.timer = 0.8;
    this.scene.tweens.add({ targets: this.sprite, scaleY: 1.2, duration: 80, yoyo: true, repeat: 2 });
  }
}

// ---------------------------------------------------------------- bullfinches
export class Bird implements Npc {
  readonly kind = 'animal' as const;
  readonly range = 32;
  readonly hitW = 18;
  readonly hitH = 16;
  readonly headY = 14;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
  private hopTimer = rand(1, 4);
  private away = 0;
  private flying = false;
  private readonly home: Point;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly id: string,
    public x: number,
    public y: number,
    private readonly wander: number,
  ) {
    this.home = { x, y };
    this.sprite = scene.add.sprite(x, y, 'bird');
    placeOrigin(this.sprite, 'bird');
    this.sprite.setDepth(entityDepth(y));
  }

  setTalking(on: boolean, towards?: Point): void {
    if (on && towards) this.side = towards.x > this.x ? 'right' : 'left';
  }

  update(dt: number, ctx: NpcCtx): void {
    if (this.flying) {
      this.away -= dt;
      if (this.away <= 0) this.land();
      return;
    }
    const d = Math.hypot(ctx.player.x - this.x, ctx.player.y - this.y);
    if ((ctx.player.running && d < 56) || d < 14) {
      this.scare(ctx.player.x);
      return;
    }
    if ((this.hopTimer -= dt) <= 0) {
      this.hopTimer = rand(1.2, 4);
      const nx = Phaser.Math.Clamp(this.x + rand(-10, 10), this.home.x - this.wander, this.home.x + this.wander);
      if (!ctx.grid.isBlockedAt(nx, this.y)) {
        this.side = nx > this.x ? 'right' : 'left';
        this.x = nx;
        this.sprite.play(`bird:hop-${this.side}`);
        this.scene.tweens.add({ targets: this.sprite, x: this.x, duration: 160 });
      }
    } else if (!this.sprite.anims.isPlaying) this.sprite.play(`bird:sit-${this.side}`, true);
  }

  scare(fx: number): void {
    if (this.flying) return;
    this.flying = true;
    this.away = rand(6, 10);
    this.side = fx > this.x ? 'left' : 'right';
    this.sprite.play(`bird:fly-${this.side}`);
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.x + (this.side === 'left' ? -1 : 1) * rand(70, 120),
      y: this.y - rand(70, 110),
      alpha: 0,
      duration: 1200,
      ease: 'Quad.easeIn',
    });
  }

  private land(): void {
    this.flying = false;
    this.x = this.home.x + rand(-this.wander, this.wander);
    this.y = this.home.y;
    this.sprite.setPosition(this.x - 40, this.y - 60).setAlpha(0).play(`bird:fly-right`);
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.x,
      y: this.y,
      alpha: 1,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => this.sprite.play(`bird:sit-${this.side}`),
    });
  }
}

// ---------------------------------------------------------------- cat
export class Cat implements Npc {
  readonly kind = 'animal' as const;
  readonly range = 36;
  readonly hitW = 28;
  readonly hitH = 22;
  readonly headY = 22;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly zzz: Phaser.GameObjects.Particles.ParticleEmitter;
  private awake = 0;

  constructor(
    scene: Phaser.Scene,
    readonly id: string,
    public x: number,
    public y: number,
  ) {
    scene.add.image(x, y, 'shadow').setDepth(entityDepth(y) - 0.5);
    this.sprite = scene.add.sprite(x, y, 'cat');
    placeOrigin(this.sprite, 'cat');
    this.sprite.setDepth(entityDepth(y)).play('cat:sleep');
    this.zzz = scene.add
      .particles(x + 6, y - 14, 'zzz', {
        lifespan: 2200,
        speedY: { min: -9, max: -6 },
        speedX: { min: 2, max: 5 },
        alpha: { start: 0.9, end: 0 },
        frequency: 1800,
      })
      .setDepth(entityDepth(y) + 1);
  }

  setTalking(on: boolean): void {
    if (on) this.wake(1.5);
  }

  /** Lifts her head and sits up for a moment. */
  wake(seconds = 3.5): void {
    this.awake = seconds;
    this.sprite.play('cat:sit', true);
    this.zzz.stop();
  }

  update(dt: number): void {
    if (this.awake > 0 && (this.awake -= dt) <= 0) {
      this.sprite.play('cat:sleep', true);
      this.zzz.start();
    }
  }

  scare(): void {
    this.wake(2.5);
  }
}
