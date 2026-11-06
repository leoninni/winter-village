import { describe, expect, it } from 'vitest';
import { discoveries } from '../content/discoveries';
import { newGameState } from '../src/systems/GameState';
import {
  animalTalk,
  closedDoorTalk,
  discoveryCard,
  say,
  sonnenpalastArrival,
  thingTalk,
  villagerTalk,
} from '../src/world/conversations';

const as = (character: 'sonne' | 'isi' | 'ninni', companion: 'teddy' | 'pauli' | 'kratzi' = 'teddy') => ({
  ...newGameState(),
  character,
  companion,
});

describe('conversations', () => {
  it('villagers introduce themselves first, then make small talk', () => {
    const intro = villagerTalk('hulda', as('isi'), true);
    expect(intro.length).toBeGreaterThan(1);
    expect(intro.every((l) => l.speaker === 'Hulda')).toBe(true);
    expect(intro[0]?.action).toBe(true);
    const talk = villagerTalk('hulda', as('isi'), false);
    expect(talk).toHaveLength(1);
  });

  it('every villager, animal, thing and door has something to say for every character', () => {
    for (const c of ['sonne', 'isi', 'ninni'] as const) {
      for (const comp of ['teddy', 'pauli', 'kratzi'] as const) {
        const s = as(c, comp);
        for (const v of ['algot', 'hulda', 'valdemar', 'torvald', 'signe']) expect(villagerTalk(v, s, false).length, v).toBe(1);
        for (const a of ['klover', 'chickens', 'bullfinches', 'smulan']) expect(animalTalk(a, s).length, a).toBe(1);
        for (const t of ['mailbox', 'well', 'woodpile', 'barn', 'sp-fireplace', 'sp-bookshelf', 'sp-memories', 'sp-teapot', 'sp-mug', 'sp-armchair', 'sp-dates', 'sp-window']) {
          expect(thingTalk(t, s).length, `${t} for ${c}`).toBeGreaterThan(0);
        }
        for (const d of ['door-mitthagen', 'door-soderhagen']) expect(closedDoorTalk(d, s).length, d).toBe(1);
      }
    }
  });

  it('recognises who is speaking in scripted lines', () => {
    expect(say('Sonne: Endlich.', as('sonne'))).toEqual({ speaker: 'Sonne', text: 'Endlich.' });
    expect(say('*Klöver schnaubt.*', as('isi'), 'Klöver')).toEqual({ speaker: 'Klöver', text: 'Klöver schnaubt.', action: true });
  });

  it('the bookshelf shows three titles, plus a line from Sonne for Sonne', () => {
    const forIsi = thingTalk('sp-bookshelf', as('isi'));
    expect(forIsi).toHaveLength(1);
    expect(forIsi[0]!.text.split('\n').filter((l) => l.startsWith('•'))).toHaveLength(3);
    expect(thingTalk('sp-bookshelf', as('sonne'))).toHaveLength(2);
  });

  it('Sonne gets her own arrival, the others a "this is Sonne’s place" reaction', () => {
    const sonne = sonnenpalastArrival(as('sonne'), true);
    expect(sonne.sequence.some((l) => l.speaker === 'Sonne')).toBe(true);
    for (const c of ['isi', 'ninni'] as const) {
      const other = sonnenpalastArrival(as(c), true);
      expect(other.sequence.length).toBeGreaterThan(1);
      expect(other.sequence.map((l) => l.text).join(' ')).toMatch(/Sonne/);
    }
    expect(sonnenpalastArrival(as('isi'), false).bubble).toBeTruthy();
    expect(sonnenpalastArrival(as('sonne', 'pauli'), false).companion).toMatch(/Pauli/);
  });

  it('discovery cards add character-specific extras', () => {
    const glasses = discoveries.find((d) => d.id === 'reading-glasses')!;
    expect(discoveryCard(glasses, as('sonne')).extras.join(' ')).toMatch(/zwei/);
    expect(discoveryCard(glasses, as('isi')).extras.join(' ')).toMatch(/Geh bitte/);
    const card = discoveryCard(glasses, { ...as('ninni'), discoveries: ['a', 'b'] });
    expect(card.count).toBe(`2 von ${discoveries.length} Entdeckungen`);
  });
});
