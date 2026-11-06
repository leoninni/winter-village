/** What the debug panel (?debug=1) can ask the running world to do. */
import type { GagId } from '../entities/companions/Companion';

export interface DebugHooks {
  /** teleport targets: place ids, 'sonnenpalast', 'disc:<id>' */
  targets(): string[];
  teleport(target: string): void;
  gag(id: GagId): void;
  showSpots(on: boolean): void;
  info(): string;
}

let hooks: DebugHooks | null = null;
export const setDebugHooks = (h: DebugHooks | null) => (hooks = h);
export const debugHooks = () => hooks;

export const debugEnabled = () => new URLSearchParams(window.location.search).get('debug') === '1';
