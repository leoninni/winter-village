/**
 * Walkability grid in 16 px cells, built from solid tiles + prop footprints.
 * Used for collision (box vs. blocked cells) and tap-to-move pathfinding.
 */
import { props as propDefs, type PropDef } from '../world/props';
import type { VillageMap } from '../world/VillageMap';

export const CELL = 16;

/** Feet collision box: centred on x, spanning [y - 2*hh, y]. */
export interface FeetBox {
  hw: number;
  hh: number;
}

export const PLAYER_BOX: FeetBox = { hw: 5, hh: 3 };

export class NavGrid {
  readonly blocked: Uint8Array;
  /** connected-component label per cell (0 = blocked) */
  private components?: Int32Array;

  constructor(
    readonly cols: number,
    readonly rows: number,
  ) {
    this.blocked = new Uint8Array(cols * rows);
  }

  static fromMap(map: VillageMap): NavGrid {
    const grid = new NavGrid(Math.ceil(map.widthPx / CELL), Math.ceil(map.heightPx / CELL));
    // solid tiles
    for (let ty = 0; ty < map.rows; ty++) {
      for (let tx = 0; tx < map.cols; tx++) {
        if (map.solid[ty * map.cols + tx]) {
          grid.blockRect(tx * map.tileSize, ty * map.tileSize, map.tileSize, map.tileSize);
        }
      }
    }
    // prop footprints
    for (const p of map.props) {
      const def: PropDef = propDefs[p.type];
      if (def.footprint) {
        grid.blockRect(p.x + def.footprint.x, p.y + def.footprint.y, def.footprint.w, def.footprint.h);
      }
    }
    return grid;
  }

  /** Blocks every cell the rectangle overlaps. */
  blockRect(x: number, y: number, w: number, h: number): void {
    const c0 = Math.max(0, Math.floor(x / CELL));
    const r0 = Math.max(0, Math.floor(y / CELL));
    const c1 = Math.min(this.cols - 1, Math.floor((x + w - 0.001) / CELL));
    const r1 = Math.min(this.rows - 1, Math.floor((y + h - 0.001) / CELL));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) this.blocked[r * this.cols + c] = 1;
    this.components = undefined;
  }

  inBounds(c: number, r: number): boolean {
    return c >= 0 && r >= 0 && c < this.cols && r < this.rows;
  }

  isBlockedCell(c: number, r: number): boolean {
    return !this.inBounds(c, r) || this.blocked[r * this.cols + c] === 1;
  }

  isBlockedAt(x: number, y: number): boolean {
    return this.isBlockedCell(Math.floor(x / CELL), Math.floor(y / CELL));
  }

  /** True if a feet box standing at (x, y) touches no blocked cell. */
  isBoxFree(x: number, y: number, box: FeetBox): boolean {
    const c0 = Math.floor((x - box.hw) / CELL);
    const c1 = Math.floor((x + box.hw - 0.001) / CELL);
    const r0 = Math.floor((y - box.hh * 2) / CELL);
    const r1 = Math.floor((y - 0.001) / CELL);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (this.isBlockedCell(c, r)) return false;
    return true;
  }

  cellOf(x: number, y: number): { c: number; r: number } {
    return { c: Math.floor(x / CELL), r: Math.floor((y - 1) / CELL) };
  }

  /** Feet position used when standing in a cell (box fits inside the cell). */
  standPoint(c: number, r: number): { x: number; y: number } {
    return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 + 4 };
  }

  componentOf(c: number, r: number): number {
    if (!this.components) this.labelComponents();
    return this.isBlockedCell(c, r) ? 0 : this.components![r * this.cols + c]!;
  }

  private labelComponents(): void {
    const labels = new Int32Array(this.cols * this.rows);
    let next = 1;
    const queue: number[] = [];
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] !== 0 || this.blocked[i] === 1) continue;
      labels[i] = next;
      queue.length = 0;
      queue.push(i);
      while (queue.length) {
        const cur = queue.pop()!;
        const c = cur % this.cols;
        const r = (cur - c) / this.cols;
        for (const [dc, dr] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nc = c + dc;
          const nr = r + dr;
          if (!this.inBounds(nc, nr)) continue;
          const ni = nr * this.cols + nc;
          if (labels[ni] === 0 && this.blocked[ni] === 0) {
            labels[ni] = next;
            queue.push(ni);
          }
        }
      }
      next++;
    }
    this.components = labels;
  }
}
