/**
 * Tiny condition language used by content files, e.g.
 *   { text: 'Servus!', when: { character: 'isi' } }
 *   { text: '…', when: { companion: 'pauli', found: ['old-sled'] } }
 * All listed conditions must hold. Pure – unit-tested.
 */
import type { CharacterId } from '../../content/characters';
import type { CompanionId } from '../../content/companions';
import type { GameState } from './GameState';

export interface Condition {
  character?: CharacterId | CharacterId[];
  companion?: CompanionId | CompanionId[];
  /** all of these discoveries found */
  found?: string[];
  /** none of these discoveries found */
  notFound?: string[];
  talkedTo?: string[];
  visited?: string[];
  notVisited?: string[];
  gagSeen?: string[];
}

/** A line of text, optionally only for certain situations. Lines starting with "*" are actions. */
export type Line = string | { text: string; when?: Condition; weight?: number };

const asList = <T>(v: T | T[] | undefined): T[] | undefined => (v === undefined ? undefined : Array.isArray(v) ? v : [v]);

export function matches(cond: Condition | undefined, s: GameState): boolean {
  if (!cond) return true;
  const chars = asList(cond.character);
  if (chars && (!s.character || !chars.includes(s.character))) return false;
  const comps = asList(cond.companion);
  if (comps && (!s.companion || !comps.includes(s.companion))) return false;
  if (cond.found && !cond.found.every((id) => s.discoveries.includes(id))) return false;
  if (cond.notFound && cond.notFound.some((id) => s.discoveries.includes(id))) return false;
  if (cond.talkedTo && !cond.talkedTo.every((id) => s.talkedTo.includes(id))) return false;
  if (cond.visited && !cond.visited.every((id) => s.visited.includes(id))) return false;
  if (cond.notVisited && cond.notVisited.some((id) => s.visited.includes(id))) return false;
  if (cond.gagSeen && !cond.gagSeen.every((id) => s.gagsSeen.includes(id))) return false;
  return true;
}

/** How specific a condition is – specific lines (e.g. just for Isi) win more often. */
function specificity(cond: Condition | undefined): number {
  return cond ? Object.keys(cond).length : 0;
}

export function lineText(line: Line): string {
  return typeof line === 'string' ? line : line.text;
}

/**
 * Picks one matching line at random. Lines with conditions get a higher weight
 * (they're personal), and `avoid` (e.g. the last line said) is skipped if possible.
 */
export function pickLine(lines: readonly Line[], s: GameState, rng: () => number = Math.random, avoid?: string): string | null {
  const pool = lines
    .filter((l) => typeof l === 'string' || matches(l.when, s))
    .map((l) => ({
      text: lineText(l),
      w: (typeof l === 'string' ? 1 : (l.weight ?? 1)) * (1 + 1.5 * specificity(typeof l === 'string' ? undefined : l.when)),
    }));
  const choices = pool.length > 1 && avoid ? pool.filter((p) => p.text !== avoid) : pool;
  if (choices.length === 0) return null;
  const total = choices.reduce((a, c) => a + c.w, 0);
  let r = rng() * total;
  for (const c of choices) {
    r -= c.w;
    if (r <= 0) return c.text;
  }
  return choices[choices.length - 1]!.text;
}

/** All matching lines in order (for scripted sequences). */
export function matchingLines(lines: readonly Line[], s: GameState): string[] {
  return lines.filter((l) => typeof l === 'string' || matches(l.when, s)).map(lineText);
}

/** Replaces {name} and {companion} placeholders. */
export function fillIn(text: string, names: { name: string; companion: string }): string {
  return text.replaceAll('{name}', names.name).replaceAll('{companion}', names.companion);
}
