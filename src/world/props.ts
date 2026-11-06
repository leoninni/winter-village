/**
 * World prop types (houses, trees, …). A prop in the Tiled "props" layer is a point
 * object whose `type` is one of these keys; the point is the prop's bottom-centre
 * (where it touches the ground). Pure data – no Phaser – so tools and tests can use it.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type GlowKind = 'window' | 'lantern' | 'fire' | 'lamp';

export interface PropDef {
  file: string;
  width: number;
  height: number;
  /** Solid ground area relative to the anchor (bottom-centre). Omit = walk-through. */
  footprint?: Rect;
  /** Warm light spots relative to the anchor. */
  glows?: { x: number; y: number; kind: GlowKind }[];
  /** Animated fire sprites (fireplace) relative to the anchor. */
  fires?: { x: number; y: number }[];
  /** Rising steam (teapot) relative to the anchor. */
  steam?: { x: number; y: number };
  /** Chimney top relative to the anchor (smoke rises from here). */
  chimney?: { x: number; y: number };
  /** Big props become see-through while you stand behind them. */
  fadeWhenBehind?: boolean;
}

/** Farmhouse window centres (shared with the placeholder-art generator). */
export const FARMHOUSE = {
  width: 160,
  height: 128,
  facadeTop: 62,
  windowTop: 76,
  windowXs: [26, 54, 106, 134],
  doorX: 80,
  chimney: { x: 112, y: 0, w: 12, h: 18 },
} as const;

const fhGlows = FARMHOUSE.windowXs.map((x) => ({
  x: x - FARMHOUSE.width / 2,
  y: FARMHOUSE.windowTop + 9 - FARMHOUSE.height,
  kind: 'window' as const,
}));

export const props = {
  farmhouse: {
    file: 'assets/sprites/props/farmhouse.png',
    width: FARMHOUSE.width,
    height: FARMHOUSE.height,
    footprint: { x: -76, y: -56, w: 152, h: 52 },
    glows: fhGlows,
    chimney: { x: FARMHOUSE.chimney.x + 6 - 80, y: -126 },
    fadeWhenBehind: true,
  },
  barn: {
    file: 'assets/sprites/props/barn.png',
    width: 128,
    height: 112,
    footprint: { x: -60, y: -50, w: 120, h: 46 },
    fadeWhenBehind: true,
  },
  shed: {
    file: 'assets/sprites/props/shed.png',
    width: 64,
    height: 56,
    footprint: { x: -28, y: -26, w: 56, h: 22 },
    fadeWhenBehind: true,
  },
  pine: {
    file: 'assets/sprites/props/pine.png',
    width: 40,
    height: 72,
    footprint: { x: -5, y: -8, w: 10, h: 6 },
    fadeWhenBehind: true,
  },
  'pine-small': {
    file: 'assets/sprites/props/pine-small.png',
    width: 28,
    height: 48,
    footprint: { x: -4, y: -6, w: 8, h: 5 },
  },
  birch: {
    file: 'assets/sprites/props/birch.png',
    width: 30,
    height: 64,
    footprint: { x: -3, y: -6, w: 6, h: 5 },
  },
  bush: {
    file: 'assets/sprites/props/bush.png',
    width: 28,
    height: 18,
    footprint: { x: -12, y: -8, w: 24, h: 7 },
  },
  rock: {
    file: 'assets/sprites/props/rock.png',
    width: 24,
    height: 16,
    footprint: { x: -10, y: -8, w: 20, h: 7 },
  },
  mailbox: {
    file: 'assets/sprites/props/mailbox.png',
    width: 16,
    height: 28,
    footprint: { x: -4, y: -5, w: 8, h: 4 },
  },
  well: {
    file: 'assets/sprites/props/well.png',
    width: 32,
    height: 36,
    footprint: { x: -14, y: -14, w: 28, h: 12 },
  },
  woodpile: {
    file: 'assets/sprites/props/woodpile.png',
    width: 36,
    height: 22,
    footprint: { x: -17, y: -12, w: 34, h: 10 },
  },
  lantern: {
    file: 'assets/sprites/props/lantern.png',
    width: 10,
    height: 34,
    footprint: { x: -2, y: -4, w: 4, h: 3 },
    glows: [{ x: 0, y: -28, kind: 'lantern' }],
  },
  coop: {
    file: 'assets/sprites/props/coop.png',
    width: 44,
    height: 38,
    footprint: { x: -20, y: -20, w: 40, h: 18 },
    glows: [{ x: 11, y: -15, kind: 'lantern' }],
  },

  // ---- Sonnenpalast (interior)
  fireplace: {
    file: 'assets/sprites/props/fireplace.png',
    width: 72,
    height: 72,
    footprint: { x: -34, y: -14, w: 68, h: 12 },
    fires: [
      { x: -7, y: -5 },
      { x: 7, y: -5 },
    ],
    glows: [{ x: 0, y: -14, kind: 'fire' }],
  },
  bookshelf: {
    file: 'assets/sprites/props/bookshelf.png',
    width: 48,
    height: 72,
    footprint: { x: -22, y: -14, w: 44, h: 12 },
  },
  'bookshelf-memories': {
    file: 'assets/sprites/props/bookshelf-memories.png',
    width: 48,
    height: 72,
    footprint: { x: -22, y: -14, w: 44, h: 12 },
  },
  armchair: {
    file: 'assets/sprites/props/armchair.png',
    width: 40,
    height: 40,
    footprint: { x: -17, y: -16, w: 34, h: 14 },
  },
  'side-table': {
    file: 'assets/sprites/props/side-table.png',
    width: 28,
    height: 30,
    footprint: { x: -10, y: -8, w: 20, h: 7 },
    steam: { x: -3, y: -28 },
  },
  'floor-lamp': {
    file: 'assets/sprites/props/floor-lamp.png',
    width: 14,
    height: 46,
    footprint: { x: -3, y: -4, w: 6, h: 3 },
    glows: [{ x: 0, y: -40, kind: 'lamp' }],
  },
  'wood-basket': {
    file: 'assets/sprites/props/wood-basket.png',
    width: 26,
    height: 18,
    footprint: { x: -11, y: -8, w: 22, h: 7 },
  },
  window: {
    file: 'assets/sprites/props/window.png',
    width: 36,
    height: 36,
  },
  'book-pile': {
    file: 'assets/sprites/props/book-pile.png',
    width: 20,
    height: 16,
    footprint: { x: -8, y: -6, w: 16, h: 5 },
  },
} satisfies Record<string, PropDef>;

export type PropType = keyof typeof props;

export function isPropType(t: string): t is PropType {
  return Object.hasOwn(props, t);
}
