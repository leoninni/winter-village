import { describe, expect, it } from 'vitest';
import { hasProgress, migrate, newGameState, SAVE_VERSION } from '../src/systems/GameState';
import { SaveSystem, type KeyValueStorage } from '../src/systems/SaveSystem';

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('GameState', () => {
  it('starts empty, without progress', () => {
    const s = newGameState(new Date('2026-12-01T10:00:00Z'));
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.character).toBeNull();
    expect(hasProgress(s)).toBe(false);
  });

  it('repairs invalid fields instead of throwing the save away', () => {
    const s = migrate({ version: 1, character: 'sonne', companion: 'dragon', player: { x: 'a' }, playTimeMs: -5 });
    expect(s).not.toBeNull();
    expect(s!.character).toBe('sonne');
    expect(s!.companion).toBeNull();
    expect(s!.player).toBeNull();
    expect(s!.playTimeMs).toBe(0);
  });

  it('refuses saves from a newer game version and garbage', () => {
    expect(migrate({ version: SAVE_VERSION + 1 })).toBeNull();
    expect(migrate('hello')).toBeNull();
    expect(migrate(null)).toBeNull();
  });
});

describe('SaveSystem', () => {
  it('round-trips a game', () => {
    const store = memoryStorage();
    const saves = new SaveSystem(store);
    const s = { ...newGameState(), character: 'isi' as const, companion: 'kratzi' as const, player: { x: 10, y: 20, facing: 'left' as const } };
    expect(saves.save(s)).toBe(true);
    expect(saves.load()).toEqual(s);
  });

  it('survives corrupt JSON', () => {
    const store = memoryStorage();
    store.setItem('winter-village:save', '{not json');
    expect(new SaveSystem(store).load()).toBeNull();
  });

  it('never throws when storage is broken (iOS private mode, quota)', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    const saves = new SaveSystem(broken);
    expect(saves.load()).toBeNull();
    expect(saves.save(newGameState())).toBe(false);
    expect(() => saves.clear()).not.toThrow();
    expect(new SaveSystem(null).load()).toBeNull();
  });

  it('clear() removes the save (start over)', () => {
    const store = memoryStorage();
    const saves = new SaveSystem(store);
    saves.save(newGameState());
    saves.clear();
    expect(saves.load()).toBeNull();
  });
});
