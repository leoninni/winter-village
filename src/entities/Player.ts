import Phaser from 'phaser';
import { settings } from '../../content/settings';
import { sprites, type Direction, type SpriteKey } from '../../content/sprites';
import { facingFrom, moveWithCollision } from '../systems/movement';
import { PLAYER_BOX, type NavGrid } from '../systems/NavGrid';
import type { Point } from '../systems/Pathfinding';
import { entityDepth } from '../world/depth';
import { StepCounter, type Footprints } from '../world/Footprints';
import { surfaceAt, type VillageMap } from '../world/VillageMap';

export interface WorldCtx {
  grid: NavGrid;
  map: VillageMap;
  footprints: Footprints;
}

/** Sets a sprite's origin to the manifest's "feet" point. */
export function placeOrigin(sprite: Phaser.GameObjects.Sprite, key: SpriteKey): void {
  const def = sprites[key];
  sprite.setOrigin(def.feet.x / def.frameWidth, def.feet.y / def.frameHeight);
}

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Image;
  x: number;
  y: number;
  facing: Direction;
  moving = false;
  running = false;
  /** px moved this frame */
  lastStep = 0;
  private waypoints: Point[] = [];
  private pathRun = false;
  private stuckFor = 0;
  private steps = new StepCounter(10);
  /** called when a tap-path finishes (to hide the marker) */
  onArrive?: () => void;

  constructor(
    scene: Phaser.Scene,
    private readonly key: SpriteKey,
    x: number,
    y: number,
    facing: Direction,
  ) {
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.shadow = scene.add.image(x, y, 'shadow');
    this.sprite = scene.add.sprite(x, y, key);
    placeOrigin(this.sprite, key);
    this.sprite.play(`${key}:idle-${facing}`);
    this.sync();
  }

  get hasPath(): boolean {
    return this.waypoints.length > 0;
  }

  setPath(waypoints: Point[], run: boolean): void {
    this.waypoints = waypoints.slice();
    this.pathRun = run;
    this.stuckFor = 0;
  }

  clearPath(): void {
    if (this.waypoints.length) {
      this.waypoints = [];
      this.onArrive?.();
    }
  }

  /** `keys` = keyboard direction (-1..1 each), `runKey` = Shift held. */
  update(dt: number, ctx: WorldCtx, keys: { x: number; y: number }, runKey: boolean): void {
    let dx = 0;
    let dy = 0;
    const keyboard = keys.x !== 0 || keys.y !== 0;
    if (keyboard) {
      this.clearPath();
      const len = Math.hypot(keys.x, keys.y);
      dx = keys.x / len;
      dy = keys.y / len;
      this.running = runKey;
    } else if (this.waypoints.length) {
      const wp = this.waypoints[0]!;
      const ddx = wp.x - this.x;
      const ddy = wp.y - this.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist < 1) {
        this.waypoints.shift();
        if (!this.waypoints.length) this.onArrive?.();
      } else {
        dx = ddx / dist;
        dy = ddy / dist;
      }
      this.running = this.pathRun || runKey;
    }

    const surface = surfaceAt(ctx.map, this.x, this.y);
    let speed = this.running ? settings.movement.runSpeed : settings.movement.walkSpeed;
    if (surface === 'deep') speed *= settings.movement.deepSnowFactor;

    this.lastStep = 0;
    if (dx !== 0 || dy !== 0) {
      let stepX = dx * speed * dt;
      let stepY = dy * speed * dt;
      // don't overshoot the next waypoint
      if (!keyboard && this.waypoints[0]) {
        const rem = Math.hypot(this.waypoints[0].x - this.x, this.waypoints[0].y - this.y);
        const len = Math.hypot(stepX, stepY);
        if (len > rem) {
          stepX *= rem / len;
          stepY *= rem / len;
        }
      }
      const next = moveWithCollision(ctx.grid, this, stepX, stepY, PLAYER_BOX);
      this.lastStep = Math.hypot(next.x - this.x, next.y - this.y);
      // following a path but not getting anywhere (someone moved a tree?) → give up gracefully
      if (!keyboard && this.lastStep < speed * dt * 0.2) {
        this.stuckFor += dt;
        if (this.stuckFor > 0.35) this.clearPath();
      } else this.stuckFor = 0;
      this.x = next.x;
      this.y = next.y;
      this.facing = facingFrom(dx, dy, this.facing);
    }
    this.moving = this.lastStep > 0.01;

    // footprints, alternating left/right of the walking line
    if (this.moving) {
      const foot = this.steps.advance(this.lastStep, this.running ? 13 : 10);
      if (foot !== 0) {
        const horizontal = Math.abs(dx) > Math.abs(dy);
        const ox = horizontal ? 0 : foot * 3;
        const oy = horizontal ? foot * 2 : 0;
        ctx.footprints.stamp('boot', this.x + ox, this.y - 1 + oy, horizontal, surface);
      }
    }

    const anim = this.moving ? 'walk' : 'idle';
    this.sprite.play(`${this.key}:${anim}-${this.facing}`, true);
    this.sprite.anims.timeScale = this.moving ? speed / settings.movement.walkSpeed : 1;
    this.sync();
  }

  private sync(): void {
    this.sprite.setPosition(this.x, this.y).setDepth(entityDepth(this.y));
    this.shadow.setPosition(this.x, this.y).setDepth(entityDepth(this.y) - 0.5);
  }
}
