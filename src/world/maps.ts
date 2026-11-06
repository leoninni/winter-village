/** All maps of the game. Keys are stored in saves – don't rename them. */
import { INTERIOR_TILESET, TILESET } from './tiles';

export interface MapInfo {
  file: string;
  tileset: { name: string; textureKey: string };
}

export const MAPS = {
  village: { file: 'assets/maps/village.tmj', tileset: TILESET },
  sonnenpalast: { file: 'assets/maps/sonnenpalast.tmj', tileset: INTERIOR_TILESET },
} satisfies Record<string, MapInfo>;

export type MapKey = keyof typeof MAPS;

export function isMapKey(k: string): k is MapKey {
  return Object.hasOwn(MAPS, k);
}

export const mapCacheKey = (k: MapKey) => `map-${k}`;
