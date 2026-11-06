/**
 * Reads a Tiled map into plain data the game logic needs (surfaces, solid tiles,
 * props, named areas, spawn). Pure – no Phaser – so it is unit-tested.
 */
import { isPropType, type PropType } from './props';
import { prop, type TiledMap, type TiledObjectLayer, type TiledTileLayer } from './tiled';
import type { Surface } from './tiles';

export interface PlacedProp {
  type: PropType;
  x: number;
  y: number;
  contentId?: string;
}

export interface Area {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A point object from one of the content layers (npcs, discoveries, things, doors). */
export interface MapPoint {
  layer: 'npcs' | 'discoveries' | 'things' | 'doors';
  /** object class in Tiled, e.g. 'villager' | 'animal' | 'discovery' | 'thing' | 'door' */
  type: string;
  contentId: string;
  x: number;
  y: number;
  /** other custom properties (e.g. wander, variant) */
  props: Record<string, string | number | boolean>;
}

export interface Exit {
  contentId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface VillageMap {
  cols: number;
  rows: number;
  tileSize: number;
  widthPx: number;
  heightPx: number;
  /** surface per tile (row-major) */
  surfaces: Surface[];
  /** solid tiles (stone walls, fences) */
  solid: boolean[];
  props: PlacedProp[];
  areas: Area[];
  /** default spawn */
  spawn: { x: number; y: number };
  /** named spawn points (marker name → position); 'default' is `spawn` */
  spawns: Record<string, { x: number; y: number }>;
  points: MapPoint[];
  exits: Exit[];
  indoor: boolean;
}

export class MapFormatError extends Error {}

export function parseVillageMap(tmj: TiledMap): VillageMap {
  if (tmj.orientation !== 'orthogonal') throw new MapFormatError('map must be orthogonal');
  const tileset = tmj.tilesets[0];
  if (!tileset) throw new MapFormatError('map has no tileset');
  if (tileset.source) throw new MapFormatError('tileset must be embedded in the map (Phaser cannot load external .tsx)');

  const ground = tmj.layers.find((l): l is TiledTileLayer => l.type === 'tilelayer' && l.name === 'ground');
  if (!ground) throw new MapFormatError('map needs a tile layer named "ground"');
  const objLayer = (name: string) =>
    tmj.layers.find((l): l is TiledObjectLayer => l.type === 'objectgroup' && l.name === name);

  // tile properties by local tile id
  const tileProps = new Map<number, { surface: Surface; collides: boolean }>();
  for (const t of tileset.tiles ?? []) {
    tileProps.set(t.id, {
      surface: (prop(t, 'surface') as Surface | undefined) ?? 'snow',
      collides: prop(t, 'collides') === true,
    });
  }

  const surfaces: Surface[] = [];
  const solid: boolean[] = [];
  for (const raw of ground.data) {
    // strip Tiled flip flags (top 3 bits)
    const gid = raw & 0x1fffffff;
    const info = gid > 0 ? tileProps.get(gid - tileset.firstgid) : undefined;
    surfaces.push(info?.surface ?? 'snow');
    solid.push(info?.collides ?? false);
  }

  const props: PlacedProp[] = [];
  for (const o of objLayer('props')?.objects ?? []) {
    if (!isPropType(o.type)) throw new MapFormatError(`unknown prop type "${o.type}" (object ${o.id})`);
    const contentId = prop(o, 'contentId');
    props.push({ type: o.type, x: o.x, y: o.y, ...(typeof contentId === 'string' ? { contentId } : {}) });
  }

  const areas: Area[] = (objLayer('areas')?.objects ?? []).map((o) => ({
    id: String(prop(o, 'contentId') ?? o.name),
    x: o.x,
    y: o.y,
    w: o.width,
    h: o.height,
  }));

  const spawns: Record<string, { x: number; y: number }> = {};
  const exits: Exit[] = [];
  for (const o of objLayer('markers')?.objects ?? []) {
    if (o.type === 'spawn') spawns[o.name || 'default'] = { x: o.x, y: o.y };
    if (o.type === 'exit') exits.push({ contentId: String(prop(o, 'contentId') ?? o.name), x: o.x, y: o.y, w: o.width, h: o.height });
  }
  const spawnPos = spawns.default ?? Object.values(spawns)[0];
  if (!spawnPos) throw new MapFormatError('map needs a "spawn" point in the "markers" layer');

  const points: MapPoint[] = [];
  for (const layer of ['npcs', 'discoveries', 'things', 'doors'] as const) {
    for (const o of objLayer(layer)?.objects ?? []) {
      const contentId = prop(o, 'contentId');
      if (typeof contentId !== 'string') throw new MapFormatError(`object ${o.id} in "${layer}" needs a contentId`);
      const extra: Record<string, string | number | boolean> = {};
      for (const p of o.properties ?? []) if (p.name !== 'contentId') extra[p.name] = p.value;
      points.push({ layer, type: o.type, contentId, x: o.x, y: o.y, props: extra });
    }
  }

  return {
    cols: tmj.width,
    rows: tmj.height,
    tileSize: tmj.tilewidth,
    widthPx: tmj.width * tmj.tilewidth,
    heightPx: tmj.height * tmj.tileheight,
    surfaces,
    solid,
    props,
    areas,
    spawn: spawnPos,
    spawns,
    points,
    exits,
    indoor: prop(tmj, 'indoor') === true,
  };
}

export function surfaceAt(map: VillageMap, x: number, y: number): Surface {
  const tx = Math.floor(x / map.tileSize);
  const ty = Math.floor(y / map.tileSize);
  if (tx < 0 || ty < 0 || tx >= map.cols || ty >= map.rows) return 'snow';
  return map.surfaces[ty * map.cols + tx] ?? 'snow';
}

/** First area containing the point (areas are ordered most-specific first). */
export function areaAt(map: VillageMap, x: number, y: number): string | null {
  for (const a of map.areas) if (x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h) return a.id;
  return null;
}
