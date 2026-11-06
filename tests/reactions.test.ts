import { describe, expect, it } from 'vitest';
import type { ReactionDef } from '../content/reactions';
import { newGameState } from '../src/systems/GameState';
import { pickReactions, type Listener } from '../src/systems/Reactions';
import { parseSpeech } from '../src/systems/speech';

const s = { ...newGameState(), character: 'sonne' as const, companion: 'kratzi' as const };
const def: ReactionDef = {
  chance: 1,
  speakers: {
    companion: ['*nickt*'],
    hulda: ['Ach herrje!'],
    signe: ['Nochmal!'],
    algot: [{ text: 'Nur für Isi', when: { character: 'isi' } }],
  },
};
const opts = (patch = {}) => ({ at: { x: 0, y: 0 }, hearing: 200, now: 100, lastSpoke: new Map<string, number>(), speakerCooldown: 10, rng: () => 0.3, ...patch });

describe('reaction picker', () => {
  const listeners: Listener[] = [
    { id: 'companion', x: 5, y: 0 },
    { id: 'hulda', x: 50, y: 0 },
    { id: 'signe', x: 900, y: 0 }, // too far away to see it
    { id: 'algot', x: 20, y: 0 }, // has no line for Sonne
  ];

  it('lets the companion and nearby villagers react, nobody far away', () => {
    const picks = pickReactions(def, listeners, s, opts());
    expect(picks.map((p) => p.id)).toEqual(['companion', 'hulda']);
  });

  it('respects per-speaker cooldowns', () => {
    const lastSpoke = new Map([['companion', 95]]);
    const picks = pickReactions(def, listeners, s, opts({ lastSpoke }));
    expect(picks.map((p) => p.id)).toEqual(['hulda']);
  });

  it('sometimes nobody reacts (chance), unless forced', () => {
    const rare = { ...def, chance: 0.1 };
    expect(pickReactions(rare, listeners, s, opts({ rng: () => 0.9 }))).toEqual([]);
    expect(pickReactions(rare, listeners, s, opts({ rng: () => 0.9, force: true })).length).toBeGreaterThan(0);
  });

  it('caps the number of speakers', () => {
    expect(pickReactions(def, listeners, s, opts({ maxSpeakers: 1 })).length).toBe(1);
  });
});

describe('speech lines', () => {
  it('recognises speakers and actions', () => {
    expect(parseSpeech('Sonne: Endlich.', ['Sonne'])).toEqual({ speaker: 'Sonne', text: 'Endlich.', action: false });
    expect(parseSpeech('*Smulan schnurrt.*', ['Sonne'])).toEqual({ text: 'Smulan schnurrt.', action: true });
    expect(parseSpeech('Hinweis: kein Sprecher', ['Sonne'])).toEqual({ text: 'Hinweis: kein Sprecher', action: false });
    // mixed action + speech stays as text
    expect(parseSpeech('*Klick.* Sitzt.', []).action).toBe(false);
  });
});
