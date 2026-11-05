/**
 * Tap-to-move pathfinding: A* on the NavGrid (8 directions, no corner cutting),
 * snapping unreachable taps to the nearest reachable cell, then smoothing the
 * path into a few straight segments so walking looks natural.
 */
import { type FeetBox, type NavGrid } from './NavGrid';

export interface Point {
  x: number;
  y: number;
}

const SQRT2 = Math.SQRT2;
const NEIGHBOURS = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
] as const;

/** Binary min-heap keyed by f-score. */
class Heap {
  private items: number[] = [];
  constructor(private readonly score: Float64Array) {}
  get size(): number {
    return this.items.length;
  }
  push(i: number): void {
    const a = this.items;
    a.push(i);
    let k = a.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (this.score[a[p]!]! <= this.score[a[k]!]!) break;
      [a[p], a[k]] = [a[k]!, a[p]!];
      k = p;
    }
  }
  pop(): number {
    const a = this.items;
    const top = a[0]!;
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < a.length && this.score[a[l]!]! < this.score[a[m]!]!) m = l;
        if (r < a.length && this.score[a[r]!]! < this.score[a[m]!]!) m = r;
        if (m === k) break;
        [a[m], a[k]] = [a[k]!, a[m]!];
        k = m;
      }
    }
    return top;
  }
}

/** A* between two cells. Returns the cell indices from start to goal, or null. */
export function astar(grid: NavGrid, sc: number, sr: number, gc: number, gr: number): number[] | null {
  if (grid.isBlockedCell(sc, sr) || grid.isBlockedCell(gc, gr)) return null;
  const n = grid.cols * grid.rows;
  const g = new Float64Array(n).fill(Infinity);
  const f = new Float64Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const start = sr * grid.cols + sc;
  const goal = gr * grid.cols + gc;
  const h = (c: number, r: number) => {
    const dx = Math.abs(c - gc);
    const dy = Math.abs(r - gr);
    return dx + dy + (SQRT2 - 2) * Math.min(dx, dy);
  };
  g[start] = 0;
  f[start] = h(sc, sr);
  const open = new Heap(f);
  open.push(start);

  while (open.size) {
    const cur = open.pop();
    if (cur === goal) {
      const out: number[] = [];
      for (let k = cur; k !== -1; k = from[k]!) out.push(k);
      return out.reverse();
    }
    if (closed[cur]) continue;
    closed[cur] = 1;
    const c = cur % grid.cols;
    const r = (cur - c) / grid.cols;
    for (const [dc, dr, cost] of NEIGHBOURS) {
      const nc = c + dc;
      const nr = r + dr;
      if (grid.isBlockedCell(nc, nr)) continue;
      if (dc !== 0 && dr !== 0 && (grid.isBlockedCell(c + dc, r) || grid.isBlockedCell(c, r + dr))) continue;
      const ni = nr * grid.cols + nc;
      if (closed[ni]) continue;
      const ng = g[cur]! + cost;
      if (ng < g[ni]!) {
        g[ni] = ng;
        f[ni] = ng + h(nc, nr);
        from[ni] = cur;
        open.push(ni);
      }
    }
  }
  return null;
}

/**
 * Nearest free cell to (tc, tr) that lies in the same connected region as
 * (sc, sr) – so tapping a house or a lake island still walks you somewhere sensible.
 */
export function nearestReachableCell(
  grid: NavGrid,
  sc: number,
  sr: number,
  tc: number,
  tr: number,
  maxRadius = 40,
): { c: number; r: number } | null {
  const comp = grid.componentOf(sc, sr);
  if (comp === 0) return null;
  tc = Math.max(0, Math.min(grid.cols - 1, tc));
  tr = Math.max(0, Math.min(grid.rows - 1, tr));
  if (grid.componentOf(tc, tr) === comp) return { c: tc, r: tr };
  for (let radius = 1; radius <= maxRadius; radius++) {
    let best: { c: number; r: number; d: number } | null = null;
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== radius) continue;
        const c = tc + dc;
        const r = tr + dr;
        if (!grid.inBounds(c, r) || grid.componentOf(c, r) !== comp) continue;
        const d = dc * dc + dr * dr;
        if (!best || d < best.d) best = { c, r, d };
      }
    }
    if (best) return { c: best.c, r: best.r };
  }
  return null;
}

/** True if a feet box can slide in a straight line from a to b. */
export function canWalkStraight(grid: NavGrid, a: Point, b: Point, box: FeetBox): boolean {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(1, Math.ceil(dist / 3));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (!grid.isBoxFree(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, box)) return false;
  }
  return true;
}

/** Greedy string-pulling: keep only the waypoints needed to avoid obstacles. */
export function smoothPath(grid: NavGrid, points: Point[], box: FeetBox): Point[] {
  if (points.length <= 2) return points.slice();
  const out: Point[] = [points[0]!];
  let anchor = 0;
  while (anchor < points.length - 1) {
    let next = anchor + 1;
    for (let j = points.length - 1; j > anchor + 1; j--) {
      if (canWalkStraight(grid, points[anchor]!, points[j]!, box)) {
        next = j;
        break;
      }
    }
    out.push(points[next]!);
    anchor = next;
  }
  return out;
}

export interface PlannedPath {
  /** waypoints to walk, excluding the start position */
  waypoints: Point[];
  /** where the path ends (may differ from the tap if that spot was blocked) */
  target: Point;
  length: number;
}

/** Full tap-to-move planning from feet position `from` towards tap point `to`. */
export function planPath(grid: NavGrid, from: Point, to: Point, box: FeetBox): PlannedPath | null {
  const s = grid.cellOf(from.x, from.y);
  let start = s;
  if (grid.isBlockedCell(s.c, s.r)) {
    // standing on a blocked edge cell (e.g. touching a fence): start from the closest free one
    const free = nearestFreeCell(grid, s.c, s.r);
    if (!free) return null;
    start = free;
  }
  const tc = Math.floor(to.x / 16);
  const tr = Math.floor((to.y - 1) / 16);
  const goal = nearestReachableCell(grid, start.c, start.r, tc, tr);
  if (!goal) return null;

  // exact tap point if the box fits there and it's in our region, else the cell's stand point
  const exactOk =
    goal.c === tc && goal.r === tr && grid.isBoxFree(to.x, to.y, box) && grid.componentOf(tc, tr) !== 0;
  const target = exactOk ? { x: to.x, y: to.y } : grid.standPoint(goal.c, goal.r);

  if (canWalkStraight(grid, from, target, box)) {
    return { waypoints: [target], target, length: Math.hypot(target.x - from.x, target.y - from.y) };
  }
  const cells = astar(grid, start.c, start.r, goal.c, goal.r);
  if (!cells) return null;
  const pts: Point[] = [from, ...cells.slice(1, -1).map((i) => grid.standPoint(i % grid.cols, Math.floor(i / grid.cols))), target];
  const smooth = smoothPath(grid, pts, box).slice(1);
  let length = 0;
  let prev = from;
  for (const p of smooth) {
    length += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return { waypoints: smooth, target, length };
}

function nearestFreeCell(grid: NavGrid, c: number, r: number): { c: number; r: number } | null {
  for (let radius = 1; radius < 6; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (!grid.isBlockedCell(c + dc, r + dr)) return { c: c + dc, r: r + dr };
      }
    }
  }
  return null;
}
