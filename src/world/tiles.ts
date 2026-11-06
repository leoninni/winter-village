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

export type Surface = 'snow' | 'deep' | 'path' | 'ice' | 'field' | 'wood' | 'rug';

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

/** Interior tileset (Sonnenpalast and later rooms). */
export const INTERIOR_TILE = {
  floor: 0,
  floor2: 1,
  rug: 2,
  rug2: 3,
  wallpaper: 4,
  wainscot: 5,
  sideWall: 6,
  mat: 7,
  hearth: 8,
  frontWall: 9,
  floor3: 10,
} as const;

export const INTERIOR_TILE_PROPS: Record<number, { surface: Surface; collides?: true }> = {
  [INTERIOR_TILE.floor]: { surface: 'wood' },
  [INTERIOR_TILE.floor2]: { surface: 'wood' },
  [INTERIOR_TILE.floor3]: { surface: 'wood' },
  [INTERIOR_TILE.rug]: { surface: 'rug' },
  [INTERIOR_TILE.rug2]: { surface: 'rug' },
  [INTERIOR_TILE.mat]: { surface: 'rug' },
  [INTERIOR_TILE.hearth]: { surface: 'wood', collides: true },
  [INTERIOR_TILE.wallpaper]: { surface: 'wood', collides: true },
  [INTERIOR_TILE.wainscot]: { surface: 'wood', collides: true },
  [INTERIOR_TILE.sideWall]: { surface: 'wood', collides: true },
  [INTERIOR_TILE.frontWall]: { surface: 'wood', collides: true },
};

export const INTERIOR_TILESET = {
  name: 'interior',
  image: '../tiles/interior.png',
  textureKey: 'tiles-interior',
  file: 'assets/tiles/interior.png',
  columns: 8,
  tileCount: 16,
  tileSize: 32,
} as const;
