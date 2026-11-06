/**
 * Generates the first version of the interior maps (currently: the Sonnenpalast).
 * After that, the .tmj files are the source of truth – edit them in Tiled.
 * Refuses to overwrite existing maps unless you pass --force.
 *
 *   npm run gen:interiors
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PropType } from '../src/world/props';
import type { TiledMap, TiledObject, TiledProperty } from '../src/world/tiled';
import { INTERIOR_TILE as I, INTERIOR_TILE_PROPS, INTERIOR_TILESET } from '../src/world/tiles';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'maps');
const T = 32;

type LayerName = 'props' | 'markers' | 'npcs' | 'discoveries' | 'things' | 'doors';
const str = (name: string, value: string): TiledProperty => ({ name, type: 'string', value });

function sonnenpalast(): TiledMap {
  const W = 12;
  const H = 10;
  const ground: number[] = new Array(W * H).fill(I.floor);
  const set = (x: number, y: number, t: number) => (ground[y * W + x] = t);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x === 0 || x === W - 1) set(x, y, I.sideWall);
      else if (y === 0) set(x, y, I.wallpaper);
      else if (y === 1) set(x, y, I.wainscot);
      else if (y === H - 1) set(x, y, x === 5 || x === 6 ? I.mat : I.frontWall);
      else set(x, y, (x + y) % 3 === 0 ? I.floor2 : (x * 7 + y) % 5 === 0 ? I.floor3 : I.floor);
    }
  }
  for (let y = 4; y <= 7; y++) for (let x = 3; x <= 8; x++) set(x, y, y % 2 === 0 ? I.rug : I.rug2);
  set(5, 2, I.hearth);
  set(6, 2, I.hearth);

  const objects: { layer: LayerName; obj: Omit<TiledObject, 'id'> }[] = [];
  const pt = (layer: LayerName, type: string, x: number, y: number, properties: TiledProperty[] = [], name = '') =>
    objects.push({ layer, obj: { name, type, x, y, width: 0, height: 0, rotation: 0, visible: true, point: true, properties } });
  const prop = (type: PropType, x: number, y: number) => pt('props', type, x, y);

  prop('window', 104, 58);
  prop('window', 280, 58);
  prop('fireplace', 192, 86);
  prop('bookshelf', 60, 88);
  prop('bookshelf-memories', 324, 88);
  prop('wood-basket', 252, 106);
  prop('side-table', 74, 178);
  prop('armchair', 128, 182);
  prop('floor-lamp', 330, 176);
  prop('book-pile', 296, 250);

  // things to look at (texts in content/sonnenpalast.ts)
  const thing = (id: string, x: number, y: number) => pt('things', 'thing', x, y, [str('contentId', id)]);
  thing('sp-fireplace', 192, 102);
  thing('sp-mug', 230, 102);
  thing('sp-bookshelf', 60, 102);
  thing('sp-memories', 324, 102);
  thing('sp-dates', 104, 84);
  thing('sp-window', 280, 84);
  thing('sp-teapot', 74, 188);
  thing('sp-armchair', 120, 190);

  pt('npcs', 'animal', 192, 150, [str('contentId', 'smulan'), str('variant', 'sleeping')]);
  pt('discoveries', 'discovery', 156, 192, [str('contentId', 'reading-glasses')]);
  pt('markers', 'spawn', 192, 284, [], 'entrance');
  objects.push({
    layer: 'markers',
    obj: {
      name: 'exit',
      type: 'exit',
      x: 160,
      y: 300,
      width: 64,
      height: 20,
      rotation: 0,
      visible: true,
      properties: [str('contentId', 'exit-sonnenpalast')],
    },
  });

  let nextId = 1;
  const layer = (id: number, name: LayerName) => ({
    id,
    name,
    type: 'objectgroup' as const,
    draworder: 'topdown' as const,
    x: 0,
    y: 0,
    opacity: 1,
    visible: true,
    objects: objects.filter((o) => o.layer === name).map((o) => ({ id: nextId++, ...o.obj })),
  });

  const map: TiledMap = {
    type: 'map',
    version: '1.10',
    tiledversion: '1.11.0',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    width: W,
    height: H,
    tilewidth: T,
    tileheight: T,
    infinite: false,
    nextlayerid: 8,
    nextobjectid: 0,
    properties: [{ name: 'indoor', type: 'bool', value: true }],
    layers: [
      { id: 1, name: 'ground', type: 'tilelayer', width: W, height: H, x: 0, y: 0, opacity: 1, visible: true, data: ground.map((t) => t + 1) },
      layer(2, 'props'),
      layer(3, 'markers'),
      layer(4, 'npcs'),
      layer(5, 'discoveries'),
      layer(6, 'things'),
      layer(7, 'doors'),
    ],
    tilesets: [
      {
        firstgid: 1,
        name: INTERIOR_TILESET.name,
        image: INTERIOR_TILESET.image,
        imagewidth: INTERIOR_TILESET.columns * T,
        imageheight: (INTERIOR_TILESET.tileCount / INTERIOR_TILESET.columns) * T,
        tilewidth: T,
        tileheight: T,
        tilecount: INTERIOR_TILESET.tileCount,
        columns: INTERIOR_TILESET.columns,
        margin: 0,
        spacing: 0,
        tiles: Object.entries(INTERIOR_TILE_PROPS).map(([id, p]) => ({
          id: Number(id),
          properties: [
            ...(p.collides ? [{ name: 'collides', type: 'bool' as const, value: true }] : []),
            { name: 'surface', type: 'string' as const, value: p.surface },
          ],
        })),
      },
    ],
  };
  map.nextobjectid = nextId;
  return map;
}

const maps: Record<string, () => TiledMap> = { sonnenpalast };
mkdirSync(DIR, { recursive: true });
for (const [name, build] of Object.entries(maps)) {
  const out = join(DIR, `${name}.tmj`);
  if (existsSync(out) && !process.argv.includes('--force')) {
    console.log(`${name}.tmj already exists – edit it in Tiled. Use --force to overwrite.`);
    continue;
  }
  writeFileSync(out, JSON.stringify(build()));
  console.log(`✓ wrote ${out}`);
}
