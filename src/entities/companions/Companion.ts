import type { CompanionDef } from '../../../content/companions';
import type { Point } from '../../systems/Pathfinding';
import type { Trail } from '../../systems/trail';
import type { DiscoverySpots } from '../../world/DiscoverySpots';
import type { Interactable } from '../../world/Interactables';
import type { Player, WorldCtx } from '../Player';

/** Everything a companion needs each frame. */
export interface CompanionCtx extends WorldCtx {
  player: Player;
  trail: Trail;
  /** scene time in ms */
  time: number;
  spots: DiscoverySpots;
  /** let the world react (content/reactions.ts event) at a position */
  react(event: string, at: Point, force?: boolean): void;
  /** record a gag as witnessed */
  gag(id: string): void;
  /** true during scripted moments and right after entering a map: no spontaneous gags */
  calm: boolean;
}

export type GagId = 'kratzi-head-pop' | 'kratzi-notice' | 'pauli-stuck' | 'pauli-dig' | 'teddy-sniff';

export interface Companion {
  readonly def: CompanionDef;
  update(dt: number, ctx: CompanionCtx): void;
  /** Jump next to the player (after loading or if left far behind). */
  snapTo(x: number, y: number): void;
  /** World point above the companion's head (speech bubbles). */
  bubblePoint(): Point;
  /** Things you can tap on the companion right now (stuck Pauli, Kratzi's head …). */
  interactables(): Interactable[];
  /** Debug: make a gag happen right now, ignoring cooldowns. Returns false if not possible. */
  debugTrigger(gag: GagId, ctx: CompanionCtx): boolean;
}
