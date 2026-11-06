/**
 * Generates the first version of the village map (public/assets/maps/village.tmj).
 * After that, the .tmj file is the source of truth – edit it in Tiled.
 * Re-running refuses to overwrite an existing map unless you pass --force.
 *
 *   npm run gen:map            # only if the map doesn't exist yet
 *   npm run gen:map -- --force # regenerate (overwrites Tiled edits!)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { props, type PropType } from '../src/world/props';
import type { TiledMap, TiledObject, TiledProperty } from '../src/world/tiled';
import { TILE, TILE_PROPS, TILESET } from '../src/world/tiles';
import { mulberry32 } from './png';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'maps', 'village.tmj');
const W = 64;
const H = 48;
const T = 32;

if (existsSync(OUT) && !process.argv.includes('--force')) {
  console.log(`${OUT} already exists – it's edited in Tiled now. Use --force to overwrite.`);
  process.exit(0);
}

const rng = mulberry32(1925);
const ground: number[] = new Array(W * H).fill(TILE.snow);
const set = (x: number, y: number, t: number) => {
  if (x >= 0 && y >= 0 && x < W && y < H) ground[y * W + x] = t;
};
const get = (x: number, y: number) => ground[y * W + x];

// --- base snow with a little variety
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const r = rng();
    set(x, y, r < 0.12 ? TILE.snow2 : r < 0.2 ? TILE.snow3 : r < 0.27 ? TILE.snow4 : r < 0.285 ? TILE.snowTracks : TILE.snow);
  }
}

// --- rectangles we must keep free of trees and clutter
const reserved: { x: number; y: number; w: number; h: number }[] = [];
const reserve = (x: number, y: number, w: number, h: number) => reserved.push({ x, y, w, h });
const isReserved = (tx: number, ty: number) =>
  reserved.some((r) => tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h);

// --- frozen lake (Lillsjön)
const LAKE = { cx: 48, cy: 35, rx: 9.5, ry: 6.2 };
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const d = Math.hypot((x + 0.5 - LAKE.cx) / LAKE.rx, (y + 0.5 - LAKE.cy) / LAKE.ry);
    if (d < 1) set(x, y, rng() < 0.18 ? TILE.ice2 : TILE.ice);
    else if (d < 1.18) set(x, y, rng() < 0.55 ? TILE.shore : TILE.snow);
  }
}
reserve(37, 27, 23, 17);

// --- sled hill (Kälkbacken): a mound of deep snow
for (let y = 0; y < 14; y++) {
  for (let x = 48; x < W; x++) {
    const d = Math.hypot((x + 0.5 - 56) / 6.5, (y + 0.5 - 6.5) / 5);
    if (d < 1) set(x, y, rng() < 0.5 ? TILE.deep : TILE.deep2);
  }
}
reserve(49, 1, 15, 12);

// --- fields with Småland stone walls (with gaps to walk through)
const F = { x0: 36, y0: 8, x1: 57, y1: 21 };
for (let y = F.y0 + 1; y < F.y1; y++) for (let x = F.x0 + 1; x < F.x1; x++) set(x, y, TILE.field);
const wallGaps = new Set(['45,21', '46,21', '36,14', '36,15', '50,8', '51,8', '57,13', '57,14', '46,10', '46,11', '46,17', '46,18']);
const wall = (x: number, y: number) => {
  if (!wallGaps.has(`${x},${y}`)) set(x, y, TILE.wall);
};
for (let x = F.x0; x <= F.x1; x++) {
  wall(x, F.y0);
  wall(x, F.y1);
}
for (let y = F.y0; y <= F.y1; y++) {
  wall(F.x0, y);
  wall(F.x1, y);
  wall(46, y);
}
reserve(F.x0, F.y0, F.x1 - F.x0 + 1, F.y1 - F.y0 + 1);

// --- deep snow drifts here and there
const drifts = [
  [8, 20, 3.2, 2.2],
  [14, 42, 4, 2],
  [34, 41, 3, 2],
  [40, 24, 3, 1.6],
  [58, 25, 3, 2.5],
  [26, 44, 3, 1.5],
  [5, 33, 2.5, 3],
];
for (const [cx, cy, rx, ry] of drifts) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (Math.hypot((x + 0.5 - cx!) / rx!, (y + 0.5 - cy!) / ry!) < 1 && get(x, y)! <= TILE.snow3) {
        set(x, y, rng() < 0.5 ? TILE.deep : TILE.deep2);
      }
    }
  }
}

// --- roads and paths (Bygatan + branches)
const path = (x: number, y: number) => set(x, y, rng() < 0.3 ? TILE.path2 : TILE.path);
for (let y = 1; y < H - 1; y++) {
  path(30, y);
  path(31, y);
}
reserve(28, 0, 6, H);
for (let x = 32; x <= 44; x++) {
  path(x, 24);
  path(x, 25);
}
for (let y = 26; y <= 28; y++) {
  path(43, y);
  path(44, y);
}
for (let x = 32; x <= 50; x++) path(x, 5);
reserve(32, 23, 14, 4);
reserve(32, 4, 20, 3);

// --- the three farms (house door rows 12, 24, 36)
type LayerName = 'props' | 'markers' | 'areas' | 'npcs' | 'discoveries' | 'things' | 'doors';
const objects: { layer: LayerName; obj: Omit<TiledObject, 'id'> }[] = [];
const str = (name: string, value: string): TiledProperty => ({ name, type: 'string', value });
const int = (name: string, value: number): TiledProperty => ({ name, type: 'int', value });
/** A point in one of the content layers (npcs, discoveries, things, doors, markers). */
const marker = (layer: LayerName, type: string, px: number, py: number, properties: TiledProperty[] = [], name = '') =>
  objects.push({
    layer,
    obj: { name, type, x: Math.round(px), y: Math.round(py), width: 0, height: 0, rotation: 0, visible: true, point: true, properties },
  });
const point = (type: PropType | 'spawn', px: number, py: number, properties?: TiledProperty[]) =>
  objects.push({
    layer: type === 'spawn' ? 'markers' : 'props',
    obj: { name: '', type, x: px, y: py, width: 0, height: 0, rotation: 0, visible: true, point: true, properties },
  });

const farms = [
  { id: 'norrhagen', doorRow: 12, shed: true, barn: false },
  { id: 'mitthagen', doorRow: 24, shed: false, barn: true },
  { id: 'soderhagen', doorRow: 36, shed: true, barn: false },
];
for (const farm of farms) {
  const by = farm.doorRow * T;
  point('farmhouse', 22 * T, by, [{ name: 'contentId', type: 'string', value: farm.id }]);
  for (let x = 21; x <= 29; x++) path(x, farm.doorRow);
  path(22, farm.doorRow + 1);
  reserve(18, farm.doorRow - 4, 12, 6);
  if (farm.shed) {
    point('shed', 15 * T, by - 32);
    point('woodpile', 15 * T + 2, by + 20);
    reserve(13, farm.doorRow - 3, 5, 5);
  }
  if (farm.barn) {
    point('barn', 13 * T + 16, by);
    reserve(10, farm.doorRow - 4, 8, 6);
  }
  // snowy bushes along the house front, a fence piece for the yard
  point('bush', 18 * T + 8, by + 10);
  point('bush', 26 * T + 16, by + 10);
  for (let x = 17; x <= 20; x++) set(x, farm.doorRow + 3, TILE.fenceH);
  for (let x = 24; x <= 27; x++) set(x, farm.doorRow + 3, TILE.fenceH);
}
point('well', 25 * T + 16, 28 * T + 8);
point('mailbox', 28 * T + 20, 24 * T - 6);
reserve(24, 26, 4, 4);

// Klöver's paddock below the barn
for (let x = 10; x <= 15; x++) {
  set(x, 26, TILE.fenceH);
  set(x, 30, TILE.fenceH);
}
for (let y = 27; y <= 29; y++) {
  set(10, y, TILE.fenceV);
  set(15, y, TILE.fenceV);
}
reserve(9, 25, 8, 7);
// chicken coop at Söderhagen
point('coop', 28 * T, 35 * T + 4);
reserve(26, 33, 4, 4);
// a birch for the pinecone nest, a big pine for the tomte door
point('birch', 53 * T, 40 * T + 4);
point('pine', 6 * T, 12 * T);

// lanterns along Bygatan
for (const row of [8, 17, 29, 41]) point('lantern', 32 * T + 20, row * T + 24);

// --- trees: dense Granskogen in the west, a border all around, birches by the lake
const trees: { x: number; y: number }[] = [];
const tryTree = (type: PropType, tx: number, ty: number, minDist: number) => {
  const px = Math.round(tx * T);
  const py = Math.round(ty * T);
  if (isReserved(Math.floor(tx), Math.floor(ty))) return;
  const g = get(Math.floor(tx), Math.floor(ty));
  if (g === undefined || g === TILE.ice || g === TILE.ice2 || TILE_PROPS[g]?.collides) return;
  if (trees.some((t) => Math.hypot(t.x - px, t.y - py) < minDist)) return;
  trees.push({ x: px, y: py });
  point(type, px, py);
};
for (let i = 0; i < 900; i++) {
  const tx = 0.5 + rng() * 11;
  const ty = 1 + rng() * (H - 1.5);
  tryTree(rng() < 0.75 ? 'pine' : 'pine-small', tx, ty, 34);
}
for (let i = 0; i < 700; i++) {
  // border strips: top, bottom, right
  const side = rng();
  const tx = side < 0.4 ? rng() * W : side < 0.75 ? rng() * W : W - 2.5 + rng() * 2;
  const ty = side < 0.4 ? 0.8 + rng() * 2.4 : side < 0.75 ? H - 2.6 + rng() * 2.2 : rng() * H;
  tryTree(rng() < 0.7 ? 'pine' : 'pine-small', tx, ty, 34);
}
for (let i = 0; i < 40; i++) tryTree('birch', 34 + rng() * 26, 25 + rng() * 20, 60);
for (let i = 0; i < 14; i++) tryTree('pine-small', 12 + rng() * 22, 2 + rng() * 44, 70);
// boulders in the fields and here and there
for (let i = 0; i < 9; i++) {
  const tx = F.x0 + 2 + rng() * (F.x1 - F.x0 - 4);
  const ty = F.y0 + 2 + rng() * (F.y1 - F.y0 - 4);
  if (Math.abs(tx - 46) > 1.5) point('rock', Math.round(tx * T), Math.round(ty * T));
}
for (const [tx, ty] of [
  [13, 30],
  [35, 30],
  [26, 42],
  [12, 7],
]) {
  point('rock', tx! * T, ty! * T);
}

// --- spawn points: default (new game) and in front of the Norrhagen door (back from the Sonnenpalast)
marker('markers', 'spawn', 22 * T, 24 * T + 22, [], 'default');
marker('markers', 'spawn', 22 * T, 12 * T + 22, [], 'norrhagen-door');

// --- doors (interact to enter or knock)
for (const [id, row] of [
  ['door-norrhagen', 12],
  ['door-mitthagen', 24],
  ['door-soderhagen', 36],
] as const) {
  marker('doors', 'door', 22 * T, row * T + 4, [str('contentId', id)]);
}

// --- things to look at (content/dialogue.ts)
marker('things', 'thing', 28 * T + 20, 24 * T - 4, [str('contentId', 'mailbox')]);
marker('things', 'thing', 25 * T + 16, 28 * T + 10, [str('contentId', 'well')]);
marker('things', 'thing', 15 * T + 2, 12 * T + 22, [str('contentId', 'woodpile')]);
marker('things', 'thing', 15 * T + 2, 36 * T + 22, [str('contentId', 'woodpile')]);
marker('things', 'thing', 13 * T + 16, 24 * T + 2, [str('contentId', 'barn')]);

// --- villagers & animals (wander = how far they stroll from home, px)
marker('npcs', 'villager', 17 * T, 13 * T + 8, [str('contentId', 'algot'), int('wander', 44)]);
marker('npcs', 'villager', 25 * T, 26 * T, [str('contentId', 'hulda'), int('wander', 40)]);
marker('npcs', 'villager', 31 * T, 18 * T, [str('contentId', 'valdemar'), int('wander', 220)]);
marker('npcs', 'villager', 16 * T + 20, 28 * T + 8, [str('contentId', 'torvald'), int('wander', 20)]);
marker('npcs', 'villager', 22 * T, 40 * T + 10, [str('contentId', 'signe'), int('wander', 80)]);
marker('npcs', 'animal', 14 * T, 29 * T, [str('contentId', 'klover'), int('wander', 0)]);
for (const [x, y, brown] of [
  [26.2, 37.4, false],
  [27.3, 37.9, true],
  [28.4, 37.3, false],
  [29.2, 38.2, true],
] as const) {
  marker('npcs', 'animal', x * T, y * T, [str('contentId', 'chickens'), int('wander', 36), str('variant', brown ? 'brown' : 'white')]);
}
for (const [x, y] of [
  [24.2, 29.7],
  [24.9, 30.1],
  [23.5, 30.3],
] as const) {
  marker('npcs', 'animal', x * T, y * T, [str('contentId', 'bullfinches'), int('wander', 24)]);
}

// --- discoveries (content/discoveries.ts)
const disc = (id: string, x: number, y: number) => marker('discoveries', 'discovery', x * T, y * T, [str('contentId', id)]);
disc('lost-mitten', 19.5, 16.05);
disc('snow-angel', 40, 27.2);
disc('frozen-pike', 49, 36);
disc('pinecone-nest', 53.4, 40.5);
disc('old-sled', 57, 9);
disc('horseshoe', 17.2, 25.6);
disc('cloudberry-jam', 30.6, 34.4);
disc('tomte-door', 6.1, 12.4);
disc('moose-tracks', 34.6, 12);
disc('vienna-postcard', 27.2, 23.6);
disc('perfect-snowflake', 25.5, 28.9);
disc('personal-1', 8, 40);
disc('personal-2', 54, 17);
disc('personal-3', 38, 43.2);
disc('personal-4', 12, 4);

// --- named areas (first match wins, so specific places come first)
const area = (id: string, x: number, y: number, w: number, h: number) =>
  objects.push({
    layer: 'areas',
    obj: {
      name: id,
      type: 'area',
      x: x * T,
      y: y * T,
      width: w * T,
      height: h * T,
      rotation: 0,
      visible: true,
      properties: [{ name: 'contentId', type: 'string', value: id }],
    },
  });
area('norrhagen', 12, 6, 17, 10);
area('mitthagen', 10, 16, 19, 14);
area('soderhagen', 12, 30, 17, 10);
area('bygatan', 29, 0, 4, H);
area('kalkbacken', 49, 0, 15, 13);
area('akrarna', 34, 6, 25, 17);
area('lillsjon', 35, 26, 27, 20);
area('granskogen', 0, 0, 12, H);

// --- assemble the .tmj
let nextId = 1;
const layerObjects = (name: string) =>
  objects.filter((o) => o.layer === name).map((o) => ({ id: nextId++, ...o.obj }));

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
  nextlayerid: 9,
  nextobjectid: 0,
  layers: [
    { id: 1, name: 'ground', type: 'tilelayer', width: W, height: H, x: 0, y: 0, opacity: 1, visible: true, data: ground.map((t) => t + 1) },
    { id: 2, name: 'props', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: layerObjects('props') },
    { id: 3, name: 'areas', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 0.4, visible: true, objects: layerObjects('areas') },
    { id: 4, name: 'markers', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: layerObjects('markers') },
    { id: 5, name: 'npcs', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: layerObjects('npcs') },
    { id: 6, name: 'discoveries', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: layerObjects('discoveries') },
    { id: 7, name: 'things', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: layerObjects('things') },
    { id: 8, name: 'doors', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: layerObjects('doors') },
  ],
  tilesets: [
    {
      firstgid: 1,
      name: TILESET.name,
      image: TILESET.image,
      imagewidth: TILESET.columns * T,
      imageheight: (TILESET.tileCount / TILESET.columns) * T,
      tilewidth: T,
      tileheight: T,
      tilecount: TILESET.tileCount,
      columns: TILESET.columns,
      margin: 0,
      spacing: 0,
      tiles: Object.entries(TILE_PROPS).map(([id, p]) => ({
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

// sanity: every prop type exists
for (const l of map.layers) {
  if (l.type === 'objectgroup' && l.name === 'props') {
    for (const o of l.objects) if (!(o.type in props)) throw new Error(`unknown prop ${o.type}`);
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(map));
console.log(`✓ wrote ${OUT} (${W}×${H} tiles, ${nextId - 1} objects, ${trees.length} trees)`);
