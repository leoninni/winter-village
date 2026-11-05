import { describe, expect, it } from 'vitest';
import { constrainToRope, ropePixels } from '../src/systems/rope';
import { Trail } from '../src/systems/trail';

describe('companion trail', () => {
  it('returns the point a given path-distance behind the head', () => {
    const t = new Trail(1);
    t.reset({ x: 0, y: 0 });
    for (let x = 1; x <= 100; x++) t.push({ x, y: 0 });
    const p = t.pointBehind({ x: 100, y: 0 }, 30);
    expect(p.x).toBeCloseTo(70);
    expect(p.y).toBeCloseTo(0);
  });

  it('follows the bend of the path, not a straight line', () => {
    const t = new Trail(1);
    t.reset({ x: 0, y: 0 });
    for (let x = 1; x <= 50; x++) t.push({ x, y: 0 }); // east…
    for (let y = 1; y <= 50; y++) t.push({ x: 50, y }); // …then south
    const p = t.pointBehind({ x: 50, y: 50 }, 60);
    expect(p.y).toBeCloseTo(0);
    expect(p.x).toBeCloseTo(40);
  });

  it('falls back to the oldest point when the trail is short', () => {
    const t = new Trail(1);
    t.reset({ x: 10, y: 10 });
    expect(t.pointBehind({ x: 12, y: 10 }, 100)).toEqual({ x: 10, y: 10 });
  });
});

describe('Kratzi rope', () => {
  it('keeps the sled within rope length', () => {
    const s = constrainToRope({ x: 100, y: 0 }, { x: 0, y: 0 }, 26);
    expect(Math.hypot(s.x, s.y)).toBeCloseTo(26);
  });

  it('leaves a slack sled where it is', () => {
    expect(constrainToRope({ x: 10, y: 5 }, { x: 0, y: 0 }, 26)).toEqual({ x: 10, y: 5 });
  });

  it('draws a connected rope of whole pixels that sags when slack', () => {
    const tight = ropePixels({ x: 0, y: 0 }, { x: 26, y: 0 }, 26);
    const slack = ropePixels({ x: 0, y: 0 }, { x: 10, y: 0 }, 26);
    for (const pts of [tight, slack]) {
      for (const p of pts) expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
      for (let i = 1; i < pts.length; i++) {
        expect(Math.abs(pts[i]!.x - pts[i - 1]!.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(pts[i]!.y - pts[i - 1]!.y)).toBeLessThanOrEqual(1);
      }
    }
    const maxY = (pts: { y: number }[]) => Math.max(...pts.map((p) => p.y));
    expect(maxY(slack)).toBeGreaterThan(maxY(tight));
  });
});
