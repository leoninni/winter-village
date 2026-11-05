import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { characters } from '../content/characters';
import { companions } from '../content/companions';
import { places } from '../content/places';
import { DIRECTIONS, sprites } from '../content/sprites';
import { NavGrid, PLAYER_BOX } from '../src/systems/NavGrid';
import { planPath } from '../src/systems/Pathfinding';
import { props } from '../src/world/props';
import type { TiledMap } from '../src/world/tiled';
import { parseVillageMap } from '../src/world/VillageMap';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));

/** Width/height from a PNG header. */
function pngSize(file: string): { w: number; h: number } {
  const b = readFileSync(join(PUBLIC, file));
  expect(b.subarray(1, 4).toString('ascii'), `${file} is not a PNG`).toBe('PNG');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const tmj = JSON.parse(readFileSync(join(PUBLIC, 'assets/maps/village.tmj'), 'utf8')) as TiledMap;
const map = parseVillageMap(tmj);
const grid = NavGrid.fromMap(map);

describe('sprites manifest', () => {
  it('has a sheet for every character and companion (+ Kratzi head and sled)', () => {
    for (const id of [...characters.map((c) => c.id), ...companions.map((c) => c.id), 'kratzi-head', 'sled']) {
      expect(sprites, `missing sprite "${id}" in content/sprites.ts`).toHaveProperty(id);
    }
  });

  it('every walker has idle + walk animations for all 4 directions', () => {
    for (const id of [...characters.map((c) => c.id), ...companions.map((c) => c.id)]) {
      for (const dir of DIRECTIONS) {
        expect(sprites[id].anims, `${id}: idle-${dir}`).toHaveProperty(`idle-${dir}`);
        expect(sprites[id].anims, `${id}: walk-${dir}`).toHaveProperty(`walk-${dir}`);
      }
    }
  });

  it('animation frames exist in the PNG and feet lie inside the frame', () => {
    for (const [id, def] of Object.entries(sprites)) {
      const { w, h } = pngSize(def.file);
      expect(w % def.frameWidth, `${id}: width not a multiple of frameWidth`).toBe(0);
      expect(h % def.frameHeight, `${id}: height not a multiple of frameHeight`).toBe(0);
      const frames = (w / def.frameWidth) * (h / def.frameHeight);
      for (const [name, anim] of Object.entries(def.anims)) {
        for (const f of anim.frames) expect(f, `${id}.${name} frame ${f}`).toBeLessThan(frames);
      }
      expect(def.feet.x).toBeLessThanOrEqual(def.frameWidth);
      expect(def.feet.y).toBeLessThanOrEqual(def.frameHeight);
    }
  });
});

describe('props', () => {
  it('every prop image has the size declared in props.ts', () => {
    for (const [id, def] of Object.entries(props)) {
      expect(pngSize(def.file), id).toEqual({ w: def.width, h: def.height });
    }
  });
});

describe('village map', () => {
  it('has an embedded tileset and the required layers', () => {
    expect(tmj.tilesets[0]?.source).toBeUndefined();
    for (const name of ['ground', 'props', 'areas', 'markers']) {
      expect(tmj.layers.map((l) => l.name)).toContain(name);
    }
  });

  it('only refers to places that exist in content/places.ts', () => {
    for (const a of map.areas) expect(places, `area "${a.id}"`).toHaveProperty(a.id);
  });

  it('has three farmhouses: Norrgården, Mellangården, Södergården', () => {
    const farms = map.props.filter((p) => p.type === 'farmhouse').map((p) => p.contentId);
    expect(farms.sort()).toEqual(['mellangarden', 'norrgarden', 'sodergarden']);
  });

  it('spawn point is walkable', () => {
    expect(grid.isBoxFree(map.spawn.x, map.spawn.y, PLAYER_BOX)).toBe(true);
  });

  it('every named place and every farmhouse door can be reached on foot from the spawn', () => {
    const targets = [
      ...map.areas.map((a) => ({ name: a.id, x: a.x + a.w / 2, y: a.y + a.h / 2 })),
      ...map.props.filter((p) => p.type === 'farmhouse').map((p) => ({ name: `door ${p.contentId}`, x: p.x, y: p.y + 14 })),
    ];
    for (const t of targets) {
      const plan = planPath(grid, map.spawn, t, PLAYER_BOX);
      expect(plan, `cannot walk to ${t.name}`).not.toBeNull();
      // the end point must be close to where we wanted to go (not snapped across the map)
      expect(Math.hypot(plan!.target.x - t.x, plan!.target.y - t.y), t.name).toBeLessThan(5 * 32);
    }
  });

  it('the three yards, the fields and the lake are one connected walkable world', () => {
    const spawnCell = grid.cellOf(map.spawn.x, map.spawn.y);
    const comp = grid.componentOf(spawnCell.c, spawnCell.r);
    let free = 0;
    let reachable = 0;
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (grid.isBlockedCell(c, r)) continue;
        free++;
        if (grid.componentOf(c, r) === comp) reachable++;
      }
    }
    // a few pockets between trees are fine, but almost everything must be reachable
    expect(reachable / free).toBeGreaterThan(0.97);
  });
});
