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
  // villagers: 32×48 frames, standard layout
  algot: { file: 'assets/sprites/villagers/algot.png', frameWidth: 32, frameHeight: 48, feet: { x: 16, y: 46 }, anims: fourDirections(6) },
  hulda: { file: 'assets/sprites/villagers/hulda.png', frameWidth: 32, frameHeight: 48, feet: { x: 16, y: 46 }, anims: fourDirections(7) },
  valdemar: { file: 'assets/sprites/villagers/valdemar.png', frameWidth: 32, frameHeight: 48, feet: { x: 16, y: 46 }, anims: fourDirections(8) },
  torvald: { file: 'assets/sprites/villagers/torvald.png', frameWidth: 32, frameHeight: 48, feet: { x: 16, y: 46 }, anims: fourDirections(6) },
  signe: { file: 'assets/sprites/villagers/signe.png', frameWidth: 32, frameHeight: 48, feet: { x: 16, y: 46 }, anims: fourDirections(10) },

  // animals
  cat: {
    file: 'assets/sprites/animals/cat.png',
    frameWidth: 24,
    frameHeight: 24,
    feet: { x: 12, y: 22 },
    anims: {
      ...fourDirections(8),
      sleep: { frames: [16, 17], frameRate: 1.2 },
      sit: { frames: [18], frameRate: 1 },
    },
  },
  horse: {
    file: 'assets/sprites/animals/horse.png',
    frameWidth: 64,
    frameHeight: 48,
    feet: { x: 32, y: 45 },
    anims: {
      'idle-left': { frames: [0, 0, 1, 0, 3, 0], frameRate: 2 },
      'eat-left': { frames: [2], frameRate: 1 },
      'idle-right': { frames: [4, 4, 5, 4, 7, 4], frameRate: 2 },
      'eat-right': { frames: [6], frameRate: 1 },
    },
  },
  chicken: {
    file: 'assets/sprites/animals/chicken.png',
    frameWidth: 16,
    frameHeight: 16,
    feet: { x: 8, y: 15 },
    anims: {
      'idle-left': { frames: [0], frameRate: 1 },
      'peck-left': { frames: [0, 1, 0, 1, 0], frameRate: 6 },
      'walk-left': { frames: [2, 3], frameRate: 8 },
      'idle-right': { frames: [4], frameRate: 1 },
      'peck-right': { frames: [4, 5, 4, 5, 4], frameRate: 6 },
      'walk-right': { frames: [6, 7], frameRate: 8 },
      'b-idle-left': { frames: [8], frameRate: 1 },
      'b-peck-left': { frames: [8, 9, 8, 9, 8], frameRate: 6 },
      'b-walk-left': { frames: [10, 11], frameRate: 8 },
      'b-idle-right': { frames: [12], frameRate: 1 },
      'b-peck-right': { frames: [12, 13, 12, 13, 12], frameRate: 6 },
      'b-walk-right': { frames: [14, 15], frameRate: 8 },
    },
  },
  bird: {
    file: 'assets/sprites/animals/bullfinch.png',
    frameWidth: 12,
    frameHeight: 12,
    feet: { x: 6, y: 11 },
    anims: {
      'sit-left': { frames: [0], frameRate: 1 },
      'hop-left': { frames: [1, 0], frameRate: 6, repeat: 0 },
      'fly-left': { frames: [2, 3], frameRate: 12 },
      'sit-right': { frames: [4], frameRate: 1 },
      'hop-right': { frames: [5, 4], frameRate: 6, repeat: 0 },
      'fly-right': { frames: [6, 7], frameRate: 12 },
    },
  },

  // discovery icons (16×16; frame order in tools/art-phase2.ts ICON_ORDER) and fire
  icons: { file: 'assets/sprites/icons.png', frameWidth: 16, frameHeight: 16, feet: { x: 8, y: 15 }, anims: {} },
  fire: { file: 'assets/sprites/props/fire.png', frameWidth: 16, frameHeight: 20, feet: { x: 8, y: 19 }, anims: { burn: { frames: [0, 1, 2, 3], frameRate: 9 } } },

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

/** Frame index of each discovery icon in icons.png (order matters). */
export const ICON_ORDER = [
  'mitten', 'angel', 'fish', 'nest', 'sled', 'horseshoe', 'glasses', 'jar',
  'door', 'tracks', 'postcard', 'snowflake', 'gift', 'heart', 'star', 'letter',
] as const;

/** Where Kratzi's neck sits inside the body frame, per facing direction. */
export const kratziNeck: Record<Direction, { x: number; y: number }> = {
  down: { x: 12, y: 11 },
  left: { x: 11, y: 11 },
  right: { x: 13, y: 11 },
  up: { x: 12, y: 11 },
};
