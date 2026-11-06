/**
 * The world talks to the HTML layer through this small interface
 * (set up once by mountOverlay in overlay.ts).
 */
import type { Bubbles, Cards, DialogueBox } from './story';

export interface UI {
  dialogue: DialogueBox;
  bubbles: Bubbles;
  cards: Cards;
}

let current: UI | null = null;

export function setUI(ui: UI): void {
  current = ui;
}

export function ui(): UI {
  if (!current) throw new Error('UI not mounted yet');
  return current;
}
