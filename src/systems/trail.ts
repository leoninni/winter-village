/**
 * Breadcrumb trail of the player's recent positions. Companions walk to the point
 * a fixed path-distance behind the player, so they follow the exact route around
 * houses and trees without any pathfinding of their own.
 */
import type { Point } from './Pathfinding';

export class Trail {
  private points: Point[] = [];

  constructor(
    private readonly spacing = 3,
    private readonly maxPoints = 200,
  ) {}

  reset(p: Point): void {
    this.points = [{ x: p.x, y: p.y }];
  }

  /** Record the player's current position (ignores tiny moves). */
  push(p: Point): void {
    const last = this.points[this.points.length - 1];
    if (last && Math.hypot(p.x - last.x, p.y - last.y) < this.spacing) return;
    this.points.push({ x: p.x, y: p.y });
    if (this.points.length > this.maxPoints) this.points.shift();
  }

  /**
   * Point `distance` px behind `head` measured along the trail.
   * Returns the oldest point if the trail is shorter.
   */
  pointBehind(head: Point, distance: number): Point {
    let remaining = distance;
    let prev = head;
    for (let i = this.points.length - 1; i >= 0; i--) {
      const p = this.points[i]!;
      const seg = Math.hypot(prev.x - p.x, prev.y - p.y);
      if (seg >= remaining && seg > 0) {
        const t = remaining / seg;
        return { x: prev.x + (p.x - prev.x) * t, y: prev.y + (p.y - prev.y) * t };
      }
      remaining -= seg;
      prev = p;
    }
    return { x: prev.x, y: prev.y };
  }

  get length(): number {
    return this.points.length;
  }
}
