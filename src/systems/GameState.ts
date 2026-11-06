/**
 * Everything that gets saved. Changing this shape? Bump SAVE_VERSION, add a step
 * to `migrate`, and add a test (CLAUDE.md golden rule 8). Never break saves.
 */
import type { CharacterId } from '../../content/characters';
import type { CompanionId } from '../../content/companions';
import type { Direction } from '../../content/sprites';

export const SAVE_VERSION = 2;

export interface GameState {
  version: typeof SAVE_VERSION;
  character: CharacterId | null;
  companion: CompanionId | null;
  /** Last known position (null = the village spawn). `map` is a key of src/world/maps.ts. */
  player: { map: string; x: number; y: number; facing: Direction } | null;
  /** Discovery ids found (content/discoveries.ts). */
  discoveries: string[];
  /** Villager / animal ids you've talked to at least once. */
  talkedTo: string[];
  /** Companion gags witnessed at least once (e.g. 'kratzi-head-pop'). */
  gagsSeen: string[];
  /** Places & rooms visited at least once (e.g. 'sonnenpalast'). */
  visited: string[];
  playTimeMs: number;
  createdAt: string;
}

export function newGameState(now: Date = new Date()): GameState {
  return {
    version: SAVE_VERSION,
    character: null,
    companion: null,
    player: null,
    discoveries: [],
    talkedTo: [],
    gagsSeen: [],
    visited: [],
    playTimeMs: 0,
    createdAt: now.toISOString(),
  };
}

const CHARACTERS: readonly string[] = ['sonne', 'isi', 'ninni'];
const COMPANIONS: readonly string[] = ['teddy', 'pauli', 'kratzi'];
const DIRS: readonly string[] = ['down', 'left', 'right', 'up'];

const stringList = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : [];

/**
 * Turns whatever was stored into a valid current GameState, or null if it's
 * unusable (corrupt, or from a *newer* game version we don't understand).
 * Unknown/invalid fields fall back to defaults instead of throwing away the save.
 */
export function migrate(raw: unknown): GameState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = { ...(raw as Record<string, unknown>) };
  const version = typeof r.version === 'number' ? r.version : 0;
  if (version > SAVE_VERSION || version < 1) return null;

  // v1 → v2: position gets a map; progress lists are new
  if (version === 1) {
    if (r.player && typeof r.player === 'object') r.player = { map: 'village', ...(r.player as object) };
  }

  const base = newGameState();
  const p = r.player as Record<string, unknown> | null | undefined;
  const player =
    p && typeof p === 'object' && Number.isFinite(p.x) && Number.isFinite(p.y)
      ? {
          map: typeof p.map === 'string' ? p.map : 'village',
          x: p.x as number,
          y: p.y as number,
          facing: (DIRS.includes(p.facing as string) ? p.facing : 'down') as Direction,
        }
      : null;

  return {
    version: SAVE_VERSION,
    character: CHARACTERS.includes(r.character as string) ? (r.character as CharacterId) : null,
    companion: COMPANIONS.includes(r.companion as string) ? (r.companion as CompanionId) : null,
    player,
    discoveries: stringList(r.discoveries),
    talkedTo: stringList(r.talkedTo),
    gagsSeen: stringList(r.gagsSeen),
    visited: stringList(r.visited),
    playTimeMs: Number.isFinite(r.playTimeMs) ? Math.max(0, r.playTimeMs as number) : 0,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : base.createdAt,
  };
}

/** A save is "in progress" once character and companion are chosen. */
export function hasProgress(s: GameState): boolean {
  return s.character !== null && s.companion !== null;
}

/** Adds `id` to one of the progress lists. Returns true if it was new. */
export function remember(
  s: GameState,
  list: 'discoveries' | 'talkedTo' | 'gagsSeen' | 'visited',
  id: string,
): boolean {
  if (s[list].includes(id)) return false;
  s[list].push(id);
  return true;
}
