import { describe, expect, it } from 'vitest';
import { moveWithCollision, facingFrom } from '../src/systems/movement';
import { NavGrid, PLAYER_BOX } from '../src/systems/NavGrid';
import { astar, canWalkStraight, nearestReachableCell, planPath } from '../src/systems/Pathfinding';

/** 20×12 cells with a vertical wall at column 8 that has a gap at row 10. */
function walledGrid(): NavGrid {
  const g = new NavGrid(20, 12);
  for (let r = 0; r < 12; r++) if (r !== 10) g.blockRect(8 * 16, r * 16, 16, 16);
  return g;
}

describe('A* pathfinding', () => {
  it('finds a way around a wall through the gap', () => {
    const g = walledGrid();
    const path = astar(g, 2, 2, 14, 2);
    expect(path).not.toBeNull();
    const cells = path!.map((i) => ({ c: i % 20, r: Math.floor(i / 20) }));
    expect(cells.some((p) => p.c === 8 && p.r === 10)).toBe(true);
    expect(cells.every((p) => !g.isBlockedCell(p.c, p.r))).toBe(true);
  });

  it('returns null when the goal is walled in', () => {
    const g = new NavGrid(10, 10);
    for (const [c, r] of [
      [4, 4],
      [5, 4],
      [6, 4],
      [4, 5],
      [6, 5],
      [4, 6],
      [5, 6],
      [6, 6],
    ] as const)
      g.blockRect(c * 16, r * 16, 16, 16);
    expect(astar(g, 0, 0, 5, 5)).toBeNull();
  });

  it('never cuts diagonally between two blocked cells', () => {
    const g = new NavGrid(4, 4);
    g.blockRect(16, 0, 16, 16); // (1,0)
    g.blockRect(0, 16, 16, 16); // (0,1)
    expect(astar(g, 0, 0, 1, 1)).toBeNull();
  });
});

describe('tap targets', () => {
  it('snaps a tap inside a building to the nearest reachable cell', () => {
    const g = new NavGrid(20, 20);
    g.blockRect(5 * 16, 5 * 16, 6 * 16, 6 * 16);
    const near = nearestReachableCell(g, 0, 0, 8, 8);
    expect(near).not.toBeNull();
    expect(g.isBlockedCell(near!.c, near!.r)).toBe(false);
    expect(g.componentOf(near!.c, near!.r)).toBe(g.componentOf(0, 0));
  });

  it('plans a smoothed path whose straight segments are all walkable', () => {
    const g = walledGrid();
    const from = g.standPoint(2, 2);
    const plan = planPath(g, from, g.standPoint(14, 3), PLAYER_BOX);
    expect(plan).not.toBeNull();
    let prev = from;
    for (const p of plan!.waypoints) {
      expect(canWalkStraight(g, prev, p, PLAYER_BOX)).toBe(true);
      prev = p;
    }
    expect(plan!.waypoints.length).toBeLessThan(6); // smoothed, not cell-by-cell
    expect(plan!.length).toBeGreaterThan(Math.hypot(12 * 16, 16));
  });

  it('walks straight when nothing is in the way', () => {
    const g = new NavGrid(20, 20);
    const plan = planPath(g, { x: 40, y: 40 }, { x: 200, y: 100 }, PLAYER_BOX);
    expect(plan?.waypoints).toEqual([{ x: 200, y: 100 }]);
  });
});

describe('movement', () => {
  it('slides along a wall instead of stopping dead', () => {
    const g = new NavGrid(10, 10);
    g.blockRect(5 * 16, 0, 16, 160); // wall at x 80..96
    const start = { x: 70, y: 50 };
    const end = moveWithCollision(g, start, 20, 20, PLAYER_BOX);
    expect(end.x).toBeLessThanOrEqual(80 - PLAYER_BOX.hw);
    expect(end.y).toBeCloseTo(70);
  });

  it('does not tunnel through thin obstacles at high speed', () => {
    const g = new NavGrid(10, 4);
    g.blockRect(5 * 16, 0, 16, 64);
    const end = moveWithCollision(g, { x: 40, y: 40 }, 200, 0, PLAYER_BOX);
    expect(end.x).toBeLessThan(80);
  });

  it('picks the dominant axis for facing', () => {
    expect(facingFrom(5, 1, 'down')).toBe('right');
    expect(facingFrom(-1, -5, 'down')).toBe('up');
    expect(facingFrom(0, 0, 'left')).toBe('left');
  });
});
