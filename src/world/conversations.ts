/**
 * Turns content (villagers, animals, things, doors, discoveries, Sonnenpalast)
 * into dialogue lines and discovery cards. Pure – unit-tested.
 */
import { animals } from '../../content/animals';
import { characters } from '../../content/characters';
import { companions } from '../../content/companions';
import { doors, things } from '../../content/dialogue';
import { discoveries, type DiscoveryDef } from '../../content/discoveries';
import { sonnenpalast } from '../../content/sonnenpalast';
import { ICON_ORDER } from '../../content/sprites';
import { strings } from '../../content/strings';
import { villagers } from '../../content/villagers';
import { fillIn, matchingLines, pickLine, type Line } from '../systems/conditions';
import type { GameState } from '../systems/GameState';
import { parseSpeech } from '../systems/speech';

export interface Said {
  speaker?: string;
  role?: string;
  text: string;
  action?: boolean;
}

export const SPEAKERS: readonly string[] = [...characters.map((c) => c.name), ...villagers.map((v) => v.name)];

function names(s: GameState) {
  return {
    name: characters.find((c) => c.id === s.character)?.name ?? '',
    companion: companions.find((c) => c.id === s.companion)?.name ?? '',
  };
}

/** Raw content text → a dialogue line ("Sonne: …" picks the speaker, "*…*" is an action). */
export function say(raw: string, s: GameState, speaker?: string, role?: string): Said {
  const p = parseSpeech(fillIn(raw, names(s)), SPEAKERS);
  const who = p.speaker ?? speaker;
  return {
    ...(who ? { speaker: who } : {}),
    ...(role && !p.speaker ? { role } : {}),
    text: p.text,
    ...(p.action ? { action: true } : {}),
  };
}

const sayAll = (lines: string[], s: GameState, speaker?: string, role?: string) => lines.map((l) => say(l, s, speaker, role));
const one = (lines: readonly Line[], s: GameState, avoid?: string) => pickLine(lines, s, Math.random, avoid);

/** Talking to a villager: their intro the first time, then one small-talk line. */
export function villagerTalk(id: string, s: GameState, first: boolean, avoid?: string): Said[] {
  const v = villagers.find((x) => x.id === id);
  if (!v) return [];
  if (first) return sayAll(matchingLines(v.intro, s), s, v.name, v.role);
  const line = one(v.smallTalk, s, avoid);
  return line ? [say(line, s, v.name, v.role)] : [];
}

export function animalTalk(id: string, s: GameState, avoid?: string): Said[] {
  const a = animals.find((x) => x.id === id);
  const line = a && one(a.lines, s, avoid);
  return a && line ? [say(line, s, a.name)] : [];
}

/** Looking at a thing (incl. the Sonnenpalast items, ids starting with "sp-"). */
export function thingTalk(id: string, s: GameState, rng: () => number = Math.random): Said[] {
  const sp = sonnenpalast;
  const pick = (lines: readonly Line[]) => {
    const l = pickLine(lines, s, rng);
    return l ? [say(l, s)] : [];
  };
  switch (id) {
    case 'sp-fireplace':
      return pick(sp.fireplace);
    case 'sp-bookshelf': {
      const books = [...sp.books].sort(() => rng() - 0.5).slice(0, 3);
      const out: Said[] = [{ text: `${sp.bookshelfIntro}\n${books.map((b) => `• ${b}`).join('\n')}` }];
      if (s.character === 'sonne') out.push(say(sp.bookshelfSonne, s));
      return out;
    }
    case 'sp-memories':
      return sayAll(matchingLines(sp.memoryShelf, s), s);
    case 'sp-teapot':
      return pick(sp.teapot);
    case 'sp-mug':
      return pick(sp.mug);
    case 'sp-armchair':
      return pick(sp.armchair);
    case 'sp-dates':
      return pick(sp.dates);
    case 'sp-window':
      return pick(sp.window);
  }
  const t = things[id];
  if (!t) return [];
  const l = pickLine(t.lines, s, rng);
  return l ? [say(l, s, t.name)] : [];
}

/** Knocking on a door that doesn't open (yet). */
export function closedDoorTalk(id: string, s: GameState, rng: () => number = Math.random): Said[] {
  const d = doors[id];
  const l = d?.closedLines && pickLine(d.closedLines, s, rng);
  return l ? [say(l, s, d.name)] : [];
}

export interface DiscoveryCard {
  title: string;
  text: string;
  extras: string[];
  iconFrame: number;
  count: string;
}

export function discoveryCard(def: DiscoveryDef, s: GameState): DiscoveryCard {
  const extras = matchingLines(def.extra ?? [], s).map((l) => fillIn(l, names(s)));
  return {
    title: def.title,
    text: fillIn(def.text, names(s)),
    extras,
    iconFrame: Math.max(0, ICON_ORDER.indexOf(def.icon)),
    count: strings.discoveryCount.replace('{n}', String(s.discoveries.length)).replace('{total}', String(discoveries.length)),
  };
}

/** Arriving in the Sonnenpalast: a scripted sequence the first time, a single line later. */
export function sonnenpalastArrival(s: GameState, first: boolean): { sequence: Said[]; bubble: string | null; companion: string | null } {
  const sp = sonnenpalast;
  const isSonne = s.character === 'sonne';
  const comp = pickLine(sp.companionInside, s);
  if (first) {
    const lines = matchingLines(isSonne ? sp.arrivalSonneFirst : sp.arrivalOtherFirst, s);
    return { sequence: sayAll(lines, s), bubble: null, companion: comp };
  }
  return { sequence: [], bubble: pickLine(isSonne ? sp.arrivalSonneAgain : sp.arrivalOtherAgain, s), companion: comp };
}
