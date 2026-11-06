/**
 * Picks who reacts to an event and what they say (pure, unit-tested).
 * The world tells us who is around; content/reactions.ts says who may say what.
 */
import type { ReactionDef } from '../../content/reactions';
import { pickLine } from './conditions';
import type { GameState } from './GameState';

export interface Listener {
  /** 'companion', a villager id or an animal id */
  id: string;
  x: number;
  y: number;
}

export interface ReactionPick {
  id: string;
  text: string;
}

export interface PickOptions {
  at: { x: number; y: number };
  hearing: number;
  now: number;
  /** id → time of their last reaction */
  lastSpoke: Map<string, number>;
  speakerCooldown: number;
  maxSpeakers?: number;
  /** ignore `chance` (debug, or must-react events) */
  force?: boolean;
  rng?: () => number;
}

export function pickReactions(def: ReactionDef | undefined, listeners: Listener[], s: GameState, o: PickOptions): ReactionPick[] {
  if (!def) return [];
  const rng = o.rng ?? Math.random;
  if (!o.force && rng() > def.chance) return [];
  const candidates = listeners
    .filter((l) => def.speakers[l.id])
    .filter((l) => l.id === 'companion' || Math.hypot(l.x - o.at.x, l.y - o.at.y) <= o.hearing)
    .filter((l) => o.now - (o.lastSpoke.get(l.id) ?? -Infinity) >= o.speakerCooldown)
    .map((l) => ({ l, text: pickLine(def.speakers[l.id]!, s, rng), d: Math.hypot(l.x - o.at.x, l.y - o.at.y) }))
    .filter((c): c is { l: Listener; text: string; d: number } => c.text !== null);

  // the companion first (it's always with you), then the closest others – with a little randomness
  candidates.sort((a, b) => (a.l.id === 'companion' ? -1 : b.l.id === 'companion' ? 1 : a.d - b.d + (rng() - 0.5) * 80));
  const picks = candidates.slice(0, o.maxSpeakers ?? 2).map((c) => ({ id: c.l.id, text: c.text }));
  for (const p of picks) o.lastSpoke.set(p.id, o.now);
  return picks;
}
