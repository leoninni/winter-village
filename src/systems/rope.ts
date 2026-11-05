/** Rope + sled physics for Kratzi: a simple distance constraint with visible sag. */
import type { Point } from './Pathfinding';

/** Pulls the sled towards the anchor so it's never further away than `length`. */
export function constrainToRope(sled: Point, anchor: Point, length: number): Point {
  const dx = sled.x - anchor.x;
  const dy = sled.y - anchor.y;
  const d = Math.hypot(dx, dy);
  if (d <= length || d === 0) return { x: sled.x, y: sled.y };
  const k = length / d;
  return { x: anchor.x + dx * k, y: anchor.y + dy * k };
}

/**
 * Integer pixel points along a sagging rope from a to b (a quadratic curve whose
 * middle hangs lower the slacker the rope is). Drawn 1 px at a time for crisp pixel art.
 */
export function ropePixels(a: Point, b: Point, length: number, maxSag = 7): Point[] {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  const slack = Math.max(0, length - d);
  const sag = Math.min(maxSag, 1 + slack * 0.5);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + sag };
  const steps = Math.max(2, Math.ceil(d + sag * 2));
  const out: Point[] = [];
  let last = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = Math.round(u * u * a.x + 2 * u * t * mid.x + t * t * b.x);
    const y = Math.round(u * u * a.y + 2 * u * t * mid.y + t * t * b.y);
    const key = `${x},${y}`;
    if (key !== last) out.push({ x, y });
    last = key;
  }
  return out;
}
