/**
 * Everything you can talk to, look at or pick up. The world asks this registry
 * which one is nearest (keyboard E/Space) or which one was tapped (touch).
 */
export interface Interactable {
  key: string;
  /** feet / anchor position */
  x: number;
  y: number;
  /** how close you must be (px) */
  range: number;
  /** tap box, centred on x, standing on y */
  hitW: number;
  hitH: number;
  /** where to show the "…" prompt above it */
  promptY: number;
  enabled: boolean;
  interact(): void;
}

/** Extra tap margin: fingers are bigger than mouse pointers. */
const TAP_PAD = 10;

export class Interactables {
  private items: Interactable[] = [];

  set(items: Interactable[]): void {
    this.items = items;
  }

  all(): readonly Interactable[] {
    return this.items;
  }

  /** The closest enabled one within its range of (x, y). */
  nearest(x: number, y: number, extra = 0): Interactable | null {
    let best: Interactable | null = null;
    let bestD = Infinity;
    for (const it of this.items) {
      if (!it.enabled) continue;
      const d = Math.hypot(it.x - x, it.y - y);
      if (d <= it.range + extra && d < bestD) {
        best = it;
        bestD = d;
      }
    }
    return best;
  }

  /** The front-most enabled one whose (padded) tap box contains the world point. */
  hitTest(wx: number, wy: number): Interactable | null {
    let best: Interactable | null = null;
    for (const it of this.items) {
      if (!it.enabled) continue;
      const inX = Math.abs(wx - it.x) <= it.hitW / 2 + TAP_PAD;
      const inY = wy <= it.y + TAP_PAD && wy >= it.y - it.hitH - TAP_PAD;
      if (inX && inY && (!best || it.y > best.y)) best = it;
    }
    return best;
  }
}
