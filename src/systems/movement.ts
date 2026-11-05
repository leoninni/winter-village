/** Collision-aware movement: axis-separated so you slide along walls and fences. */
import type { FeetBox, NavGrid } from './NavGrid';
import type { Point } from './Pathfinding';

export function moveWithCollision(grid: NavGrid, pos: Point, dx: number, dy: number, box: FeetBox): Point {
  // sub-step so fast movement never tunnels through a 16 px cell
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
  let { x, y } = pos;
  for (let i = 0; i < steps; i++) {
    const sx = dx / steps;
    const sy = dy / steps;
    if (sx !== 0 && grid.isBoxFree(x + sx, y, box)) x += sx;
    if (sy !== 0 && grid.isBoxFree(x, y + sy, box)) y += sy;
  }
  return { x, y };
}

export type Facing = 'down' | 'left' | 'right' | 'up';

/** Facing from a movement vector (dominant axis; keeps `current` when not moving). */
export function facingFrom(dx: number, dy: number, current: Facing): Facing {
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return current;
  if (Math.abs(dx) > Math.abs(dy) * 1.05) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}
