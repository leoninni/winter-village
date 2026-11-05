import type { CompanionDef } from '../../../content/companions';
import type { Player, WorldCtx } from '../Player';
import type { Trail } from '../../systems/trail';

/** Everything a companion needs each frame. */
export interface CompanionCtx extends WorldCtx {
  player: Player;
  trail: Trail;
  time: number;
}

export interface Companion {
  readonly def: CompanionDef;
  update(dt: number, ctx: CompanionCtx): void;
  /** Jump next to the player (after loading or if left far behind). */
  snapTo(x: number, y: number): void;
}
