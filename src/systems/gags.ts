/**
 * Pure logic behind the companion gags (unit-tested):
 *  - ZoomMeter: Kratzi's head pops off after running too long – threshold + cooldown,
 *    so it's funny, not annoying.
 *  - Cooldown: generic "at most once every N seconds".
 *  - Head roll: a bouncy, rolling, cartoony head with fake height (z) and wall bounces.
 */

export class Cooldown {
  private last = -Infinity;
  constructor(public seconds: number) {}
  ready(now: number): boolean {
    return now - this.last >= this.seconds;
  }
  trigger(now: number): void {
    this.last = now;
  }
  reset(): void {
    this.last = -Infinity;
  }
}

export class ZoomMeter {
  /** seconds of (recent) running */
  level = 0;
  readonly cooldown: Cooldown;

  constructor(
    private readonly threshold: number,
    cooldownSeconds: number,
    private readonly drainPerSecond = 0.7,
  ) {
    this.cooldown = new Cooldown(cooldownSeconds);
  }

  /** Call every frame. Returns true at the moment the head should pop. */
  update(dt: number, fast: boolean, now: number): boolean {
    if (fast) this.level += dt;
    else this.level = Math.max(0, this.level - dt * this.drainPerSecond);
    if (this.level >= this.threshold && this.cooldown.ready(now)) {
      this.level = 0;
      this.cooldown.trigger(now);
      return true;
    }
    // during cooldown, don't let it build up into an instant pop afterwards
    if (!this.cooldown.ready(now)) this.level = Math.min(this.level, this.threshold * 0.5);
    return false;
  }
}

export interface RollState {
  x: number;
  y: number;
  /** height above the ground */
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** rotation in radians (for drawing the roll) */
  angle: number;
  bounces: number;
  resting: boolean;
  /** true on the frame it touched the ground (for a squash effect) */
  landed: boolean;
}

export const ROLL = {
  gravity: 520,
  restitution: 0.58,
  groundFriction: 3.2,
  airDrag: 0.9,
  radius: 7,
} as const;

/** Starts a head roll from (x, y) heading roughly along (dirX, dirY). */
export function startRoll(x: number, y: number, dirX: number, dirY: number, rng: () => number = Math.random): RollState {
  const len = Math.hypot(dirX, dirY) || 1;
  const nx = dirX / len;
  const ny = dirY / len;
  const speed = 62 + rng() * 30;
  const side = (rng() - 0.5) * 40;
  return {
    x,
    y,
    z: 14,
    vx: nx * speed - ny * side,
    vy: ny * speed + nx * side,
    vz: 170 + rng() * 40,
    angle: 0,
    bounces: 0,
    resting: false,
    landed: false,
  };
}

/** Advances the roll by dt. `isFree(x, y)` says whether the head may be there. */
export function stepRoll(s: RollState, dt: number, isFree: (x: number, y: number) => boolean): RollState {
  if (s.resting) return { ...s, landed: false };
  let { x, y, z, vx, vy, vz, angle, bounces } = s;
  let landed = false;

  vz -= ROLL.gravity * dt;
  z += vz * dt;
  if (z <= 0) {
    z = 0;
    if (vz < -40) {
      vz = -vz * ROLL.restitution;
      bounces++;
      landed = true;
    } else vz = 0;
  }
  {
    const f = Math.exp(-(z === 0 ? ROLL.groundFriction : ROLL.airDrag) * dt);
    vx *= f;
    vy *= f;
  }

  // bounce off walls, trees, houses
  const nx = x + vx * dt;
  const ny = y + vy * dt;
  if (isFree(nx, y)) x = nx;
  else vx = -vx * 0.6;
  if (isFree(x, ny)) y = ny;
  else vy = -vy * 0.6;

  const speed = Math.hypot(vx, vy);
  angle += ((vx >= 0 ? 1 : -1) * speed * dt) / ROLL.radius;
  const resting = z === 0 && vz === 0 && speed < 8;
  return { x, y, z, vx, vy, vz, angle: resting ? 0 : angle, bounces, resting, landed };
}
