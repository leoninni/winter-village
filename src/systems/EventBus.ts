/**
 * Tiny typed event bus. Gameplay only *emits* events; calendar, reactions,
 * saving etc. *listen*. Keeps systems decoupled (see CLAUDE.md, golden rule 3).
 */
export type Handler<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private handlers = new Map<keyof Events, Set<Handler<never>>>();

  /** Subscribe. Returns an unsubscribe function. */
  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as Handler<never>);
    return () => this.off(type, handler);
  }

  off<K extends keyof Events>(type: K, handler: Handler<Events[K]>): void {
    this.handlers.get(type)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof Events>(
    type: K,
    ...args: Events[K] extends undefined ? [] : [Events[K]]
  ): void {
    const set = this.handlers.get(type);
    if (!set) return;
    // copy so handlers may unsubscribe while being called
    for (const handler of [...set]) (handler as Handler<unknown>)(args[0]);
  }

  clear(): void {
    this.handlers.clear();
  }
}

/** All game events and their payloads. Grows with each phase. */
export type GameEvents = {
  /** Leave the start/select screens and enter the village. */
  'flow:enter-world': undefined;
  /** Back to the start screen (after "Neu anfangen"). */
  'flow:to-title': undefined;
  /** Something on the HTML layer opened/closed that pauses world input (menu, dialogue, card). */
  'ui:blocking': { id: string; open: boolean };
  /** The player walked into a named place (content/places.ts id). */
  'world:area-entered': { id: string };
  /** A discovery was found for the first time (content/discoveries.ts id). */
  'world:discovery-found': { id: string };
  /** You talked to a villager or animal (`first` = the very first time). */
  'world:talked': { id: string; first: boolean };
  /** A companion gag happened (`first` = first time ever witnessed). */
  'world:gag': { id: string; first: boolean };
  /** A place or room was visited (`first` = first time ever). */
  'world:visited': { id: string; first: boolean };
};

export const bus = new EventBus<GameEvents>();
