import { describe, expect, it } from 'vitest';
import { fillIn, matches, matchingLines, pickLine, type Line } from '../src/systems/conditions';
import { Cooldown, startRoll, stepRoll, ZoomMeter } from '../src/systems/gags';
import { migrate, newGameState, remember, SAVE_VERSION } from '../src/systems/GameState';

const state = (patch: Partial<ReturnType<typeof newGameState>> = {}) => ({
  ...newGameState(),
  character: 'isi' as const,
  companion: 'pauli' as const,
  ...patch,
});

describe('conditions', () => {
  it('matches character, companion and progress', () => {
    const s = state({ discoveries: ['old-sled'], visited: ['sonnenpalast'] });
    expect(matches({ character: 'isi' }, s)).toBe(true);
    expect(matches({ character: ['sonne', 'ninni'] }, s)).toBe(false);
    expect(matches({ companion: 'pauli', found: ['old-sled'] }, s)).toBe(true);
    expect(matches({ notFound: ['old-sled'] }, s)).toBe(false);
    expect(matches({ visited: ['sonnenpalast'] }, s)).toBe(true);
    expect(matches({ notVisited: ['sonnenpalast'] }, s)).toBe(false);
    expect(matches({ gagSeen: ['pauli-stuck'] }, s)).toBe(false);
  });

  it('only picks lines whose conditions hold', () => {
    const lines: Line[] = [
      { text: 'Nur für Sonne', when: { character: 'sonne' } },
      { text: 'Nur mit Teddy', when: { companion: 'teddy' } },
      'Für alle',
    ];
    for (let i = 0; i < 20; i++) expect(pickLine(lines, state())).toBe('Für alle');
  });

  it('prefers personal lines but still varies', () => {
    const lines: Line[] = ['a', 'b', { text: 'Servus!', when: { character: 'isi' } }];
    let personal = 0;
    for (let i = 0; i < 300; i++) if (pickLine(lines, state()) === 'Servus!') personal++;
    expect(personal).toBeGreaterThan(110); // weight 2.5 of 4.5 → ~55 %
    expect(personal).toBeLessThan(250);
  });

  it('avoids repeating the last line when there is a choice', () => {
    for (let i = 0; i < 20; i++) expect(pickLine(['x', 'y'], state(), Math.random, 'x')).toBe('y');
    expect(pickLine(['x'], state(), Math.random, 'x')).toBe('x');
    expect(pickLine([{ text: 'nope', when: { character: 'sonne' } }], state())).toBeNull();
  });

  it('keeps scripted order and fills in names', () => {
    const lines: Line[] = ['1', { text: '2', when: { character: 'sonne' } }, '3'];
    expect(matchingLines(lines, state())).toEqual(['1', '3']);
    expect(fillIn('Hej {name}, wo ist {companion}?', { name: 'Isi', companion: 'Pauli' })).toBe('Hej Isi, wo ist Pauli?');
  });
});

describe('save migration v1 → v2', () => {
  it('keeps character, companion and position, and adds the new lists', () => {
    const v1 = { version: 1, character: 'ninni', companion: 'pauli', player: { x: 10, y: 20, facing: 'up' }, playTimeMs: 5000, createdAt: 'x' };
    const s = migrate(v1)!;
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.player).toEqual({ map: 'village', x: 10, y: 20, facing: 'up' });
    expect(s.discoveries).toEqual([]);
    expect(s.talkedTo).toEqual([]);
    expect(s.playTimeMs).toBe(5000);
  });

  it('cleans up the progress lists', () => {
    const s = migrate({ version: 2, discoveries: ['a', 'a', 3, 'b'], talkedTo: 'nope' })!;
    expect(s.discoveries).toEqual(['a', 'b']);
    expect(s.talkedTo).toEqual([]);
  });

  it('remember() adds once and reports novelty', () => {
    const s = newGameState();
    expect(remember(s, 'discoveries', 'x')).toBe(true);
    expect(remember(s, 'discoveries', 'x')).toBe(false);
    expect(s.discoveries).toEqual(['x']);
  });
});

describe('Kratzi zoom meter', () => {
  it('pops after running long enough, not before', () => {
    const m = new ZoomMeter(4, 120);
    let t = 0;
    let popped = false;
    for (; t < 3.9; t += 0.1) popped ||= m.update(0.1, true, t);
    expect(popped).toBe(false);
    for (; t < 4.5; t += 0.1) popped ||= m.update(0.1, true, t);
    expect(popped).toBe(true);
  });

  it('respects the cooldown, even if you keep running', () => {
    const m = new ZoomMeter(4, 120);
    let pops = 0;
    for (let t = 0; t < 100; t += 0.1) if (m.update(0.1, true, t)) pops++;
    expect(pops).toBe(1);
    for (let t = 100; t < 123.9; t += 0.1) if (m.update(0.1, true, t)) pops++;
    expect(pops).toBe(1); // still cooling down
    for (let t = 123.9; t < 130; t += 0.1) if (m.update(0.1, true, t)) pops++;
    expect(pops).toBe(2); // after the cooldown it pops again (after a little more running)
  });

  it('walking lets the meter drain again', () => {
    const m = new ZoomMeter(4, 0);
    for (let i = 0; i < 30; i++) m.update(0.1, true, i * 0.1);
    for (let i = 0; i < 60; i++) m.update(0.1, false, 3 + i * 0.1);
    expect(m.level).toBe(0);
  });

  it('cooldown helper', () => {
    const c = new Cooldown(10);
    expect(c.ready(0)).toBe(true);
    c.trigger(0);
    expect(c.ready(9.9)).toBe(false);
    expect(c.ready(10)).toBe(true);
  });
});

describe('head roll', () => {
  const run = (isFree: (x: number, y: number) => boolean) => {
    let s = startRoll(100, 100, 1, 0, () => 0.5);
    let t = 0;
    let bounced = 0;
    while (!s.resting && t < 10) {
      s = stepRoll(s, 1 / 60, isFree);
      if (s.landed) bounced++;
      t += 1 / 60;
    }
    return { s, t, bounced };
  };

  it('bounces a few times, rolls a bit and comes to rest', () => {
    const { s, t, bounced } = run(() => true);
    expect(s.resting).toBe(true);
    expect(t).toBeLessThan(4);
    expect(bounced).toBeGreaterThanOrEqual(2);
    const dist = Math.hypot(s.x - 100, s.y - 100);
    expect(dist).toBeGreaterThan(30);
    expect(dist).toBeLessThan(160);
  });

  it('bounces back off a wall and never ends inside it', () => {
    const wallX = 130;
    const { s } = run((x) => x < wallX);
    expect(s.x).toBeLessThan(wallX);
    expect(s.resting).toBe(true);
  });
});
