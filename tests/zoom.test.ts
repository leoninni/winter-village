import { describe, expect, it } from 'vitest';
import { integerZoom } from '../src/systems/zoom';

describe('integerZoom', () => {
  it('always returns a whole number', () => {
    for (const [w, h] of [
      [390, 844],
      [844, 390],
      [1440, 900],
      [1920, 1080],
      [1023, 767],
    ] as const) {
      expect(Number.isInteger(integerZoom(w, h, 320, 180))).toBe(true);
    }
  });

  it('never goes below 1, even on tiny screens', () => {
    expect(integerZoom(200, 100, 320, 180)).toBe(1);
    expect(integerZoom(0, 0, 320, 180)).toBe(1);
  });

  it('picks the largest zoom that still shows the minimum area', () => {
    expect(integerZoom(1920, 1080, 320, 180)).toBe(6);
    expect(integerZoom(1919, 1080, 320, 180)).toBe(5);
    // iPhone portrait: 13 tiles of 32px across the short side → zoom 1
    expect(integerZoom(390, 844, 32 * 12, 32 * 12)).toBe(1);
  });
});
