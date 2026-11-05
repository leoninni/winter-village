/**
 * Everything that gets saved. Changing this shape? Bump SAVE_VERSION, add a step
 * to `migrate`, and add a test (CLAUDE.md golden rule 8). Never break saves.
 */
import type { CharacterId } from '../../content/characters';
import type { CompanionId } from '../../content/companions';
import type { Direction } from '../../content/sprites';

export const SAVE_VERSION = 1;

export interface GameState {
  version: typeof SAVE_VERSION;
  character: CharacterId | null;
  companion: CompanionId | null;
  /** Last known feet position in the village (null = use the map's spawn). */
  player: { x: number; y: number; facing: Direction } | null;
  playTimeMs: number;
  createdAt: string;
}

export function newGameState(now: Date = new Date()): GameState {
  return {
    version: SAVE_VERSION,
    character: null,
    companion: null,
    player: null,
    playTimeMs: 0,
    createdAt: now.toISOString(),
  };
}

const CHARACTERS: readonly string[] = ['sonne', 'isi', 'ninni'];
const COMPANIONS: readonly string[] = ['teddy', 'pauli', 'kratzi'];
const DIRS: readonly string[] = ['down', 'left', 'right', 'up'];

/**
 * Turns whatever was stored into a valid current GameState, or null if it's
 * unusable (corrupt, or from a *newer* game version we don't understand).
 * Unknown/invalid fields fall back to defaults instead of throwing away the save.
 */
export function migrate(raw: unknown): GameState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const version = typeof r.version === 'number' ? r.version : 0;
  if (version > SAVE_VERSION || version < 1) return null;

  // (future: if (version === 1) { …upgrade to 2… })

  const base = newGameState();
  const p = r.player as Record<string, unknown> | null | undefined;
  const player =
    p && typeof p === 'object' && Number.isFinite(p.x) && Number.isFinite(p.y)
      ? {
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
    playTimeMs: Number.isFinite(r.playTimeMs) ? Math.max(0, r.playTimeMs as number) : 0,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : base.createdAt,
  };
}

/** A save is "in progress" once character and companion are chosen. */
export function hasProgress(s: GameState): boolean {
  return s.character !== null && s.companion !== null;
}
