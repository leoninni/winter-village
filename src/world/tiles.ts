/**
 * Ground tile ids of the `winter` tileset (0-based, as shown in Tiled).
 * The map generator writes these properties into the embedded tileset; the game
 * then reads them back from the .tmj, so editing properties in Tiled works too.
 */
export const TILE = {
  snow: 0,
  snow2: 1,
  snow3: 2,
  deep: 3,
  path: 4,
  ice: 5,
  ice2: 6,
  field: 7,
  wall: 8,
  fenceH: 9,
  fenceV: 10,
  shore: 11,
  snowTracks: 12,
  path2: 13,
  deep2: 14,
  snow4: 15,
} as const;

export type Surface = 'snow' | 'deep' | 'path' | 'ice' | 'field';

export const TILE_PROPS: Record<number, { surface: Surface; collides?: true }> = {
  [TILE.snow]: { surface: 'snow' },
  [TILE.snow2]: { surface: 'snow' },
  [TILE.snow3]: { surface: 'snow' },
  [TILE.snow4]: { surface: 'snow' },
  [TILE.snowTracks]: { surface: 'snow' },
  [TILE.shore]: { surface: 'snow' },
  [TILE.deep]: { surface: 'deep' },
  [TILE.deep2]: { surface: 'deep' },
  [TILE.path]: { surface: 'path' },
  [TILE.path2]: { surface: 'path' },
  [TILE.ice]: { surface: 'ice' },
  [TILE.ice2]: { surface: 'ice' },
  [TILE.field]: { surface: 'field' },
  [TILE.wall]: { surface: 'snow', collides: true },
  [TILE.fenceH]: { surface: 'snow', collides: true },
  [TILE.fenceV]: { surface: 'snow', collides: true },
};

export const TILESET = {
  name: 'winter',
  image: '../tiles/winter.png',
  textureKey: 'tiles-winter',
  file: 'assets/tiles/winter.png',
  columns: 8,
  tileCount: 16,
  tileSize: 32,
} as const;
