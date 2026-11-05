/**
 * Sprite-sheet manifest. To swap in final art:
 *  1. Replace the PNG at `file` (keep the same size grid, or change frameWidth/frameHeight).
 *  2. If your sheet uses the standard layout (rows: down, left, right, up ·
 *     columns: idle, walk1, walk2, walk3) you're done. Otherwise adjust the frame
 *     numbers in `anims` (frames are counted left→right, top→bottom, starting at 0).
 *  3. Set `feet` to the pixel inside one frame where the character touches the ground.
 */

export type Direction = 'down' | 'left' | 'right' | 'up';
export const DIRECTIONS: readonly Direction[] = ['down', 'left', 'right', 'up'];

export interface SheetAnim {
  frames: number[];
  frameRate: number;
  /** -1 = loop forever (default), 0 = play once */
  repeat?: number;
}

export interface SpriteSheetDef {
  file: string;
  frameWidth: number;
  frameHeight: number;
  /** Pixel inside a frame where the sprite stands on the ground. */
  feet: { x: number; y: number };
  /** Animation name → frames. Walkers need `idle-<dir>` and `walk-<dir>` for all 4 directions. */
  anims: Record<string, SheetAnim>;
}

/** Standard layout: 4 rows (down, left, right, up) × 4 columns (idle, walk1, walk2, walk3). */
function fourDirections(walkFrameRate = 8): Record<string, SheetAnim> {
  const anims: Record<string, SheetAnim> = {};
  DIRECTIONS.forEach((dir, row) => {
    const first = row * 4;
    anims[`idle-${dir}`] = { frames: [first], frameRate: 1 };
    anims[`walk-${dir}`] = { frames: [first + 1, first + 2, first + 3, first + 2], frameRate: walkFrameRate };
  });
  return anims;
}

export const sprites = {
  // characters: 32×48 frames
  sonne: {
    file: 'assets/sprites/characters/sonne.png',
    frameWidth: 32,
    frameHeight: 48,
    feet: { x: 16, y: 46 },
    anims: fourDirections(),
  },
  isi: {
    file: 'assets/sprites/characters/isi.png',
    frameWidth: 32,
    frameHeight: 48,
    feet: { x: 16, y: 46 },
    anims: fourDirections(),
  },
  ninni: {
    file: 'assets/sprites/characters/ninni.png',
    frameWidth: 32,
    frameHeight: 48,
    feet: { x: 16, y: 46 },
    anims: fourDirections(),
  },

  // companions
  teddy: {
    file: 'assets/sprites/companions/teddy.png',
    frameWidth: 32,
    frameHeight: 32,
    feet: { x: 16, y: 30 },
    anims: fourDirections(10),
  },
  pauli: {
    file: 'assets/sprites/companions/pauli.png',
    frameWidth: 24,
    frameHeight: 24,
    feet: { x: 12, y: 22 },
    anims: fourDirections(12),
  },
  /** Kratzi's body (sits on the sled). The head is a separate sprite so it can pop off. */
  kratzi: {
    file: 'assets/sprites/companions/kratzi.png',
    frameWidth: 24,
    frameHeight: 24,
    feet: { x: 12, y: 22 },
    anims: fourDirections(6),
  },
  'kratzi-head': {
    file: 'assets/sprites/companions/kratzi-head.png',
    frameWidth: 16,
    frameHeight: 16,
    /** for the head, "feet" = the neck point that sits on the body */
    feet: { x: 8, y: 14 },
    anims: {
      'idle-down': { frames: [0], frameRate: 1 },
      'idle-left': { frames: [1], frameRate: 1 },
      'idle-right': { frames: [2], frameRate: 1 },
      'idle-up': { frames: [3], frameRate: 1 },
    },
  },
  sled: {
    file: 'assets/sprites/companions/sled.png',
    frameWidth: 32,
    frameHeight: 32,
    feet: { x: 16, y: 26 },
    anims: {
      side: { frames: [0], frameRate: 1 },
      front: { frames: [1], frameRate: 1 },
    },
  },
} satisfies Record<string, SpriteSheetDef>;

export type SpriteKey = keyof typeof sprites;

/** Where Kratzi's neck sits inside the body frame, per facing direction. */
export const kratziNeck: Record<Direction, { x: number; y: number }> = {
  down: { x: 12, y: 11 },
  left: { x: 11, y: 11 },
  right: { x: 13, y: 11 },
  up: { x: 12, y: 11 },
};
