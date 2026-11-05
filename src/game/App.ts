/**
 * The running game session: current GameState + saving. Scenes and UI read and
 * update the state through here; nothing else talks to localStorage.
 */
import type { CharacterId } from '../../content/characters';
import type { CompanionId } from '../../content/companions';
import { bus } from '../systems/EventBus';
import { hasProgress, newGameState, type GameState } from '../systems/GameState';
import { browserStorage, SaveSystem } from '../systems/SaveSystem';

class App {
  readonly saves = new SaveSystem(browserStorage());
  state: GameState = this.saves.load() ?? newGameState();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  /** The village sets this so every save includes your exact current position. */
  beforeSave: (() => void) | null = null;

  constructor() {
    // Phones may kill a backgrounded tab without warning – save when it's hidden.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.saveNow();
    });
    window.addEventListener('pagehide', () => this.saveNow());
  }

  get hasProgress(): boolean {
    return hasProgress(this.state);
  }

  startNewGame(character: CharacterId, companion: CompanionId): void {
    this.state = { ...newGameState(), character, companion };
    this.saveNow();
    bus.emit('flow:enter-world');
  }

  continueGame(): void {
    if (this.hasProgress) bus.emit('flow:enter-world');
  }

  /** "Neu anfangen": wipe the save and go back to the start screen. */
  startOver(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.saves.clear();
    this.state = newGameState();
    bus.emit('flow:to-title');
  }

  /** Debounced save – call as often as you like. */
  requestSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => this.saveNow(), 800);
  }

  saveNow(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (!this.hasProgress) return;
    this.beforeSave?.();
    this.saves.save(this.state);
  }
}

export const app = new App();
