/**
 * localStorage persistence. Every access is guarded: iOS private mode, full
 * storage or disabled cookies must never crash the game – it just won't remember.
 */
import { migrate, type GameState } from './GameState';

export const SAVE_KEY = 'winter-village:save';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class SaveSystem {
  constructor(
    private readonly storage: KeyValueStorage | null,
    private readonly key = SAVE_KEY,
  ) {}

  get available(): boolean {
    return this.storage !== null;
  }

  load(): GameState | null {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(this.key);
      return raw ? migrate(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  /** Returns false if saving failed (e.g. storage full). */
  save(state: GameState): boolean {
    if (!this.storage) return false;
    try {
      this.storage.setItem(this.key, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    try {
      this.storage?.removeItem(this.key);
    } catch {
      /* ignore */
    }
  }
}

/** The browser's localStorage, or null if it isn't usable. */
export function browserStorage(): KeyValueStorage | null {
  try {
    const s = window.localStorage;
    const probe = '__winter-village-probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}
