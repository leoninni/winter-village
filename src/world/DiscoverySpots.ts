import Phaser from 'phaser';
import { discoveries, type DiscoveryDef } from '../../content/discoveries';
import { settings } from '../../content/settings';
import { ICON_ORDER } from '../../content/sprites';
import { DEPTH, entityDepth } from './depth';
import type { MapPoint } from './VillageMap';

export interface Spot {
  def: DiscoveryDef;
  x: number;
  y: number;
  found: boolean;
  revealed: boolean;
  icon?: Phaser.GameObjects.Image;
  glint: Phaser.GameObjects.Sprite;
  hole?: Phaser.GameObjects.Image;
  label?: Phaser.GameObjects.Text;
}

/**
 * Discovery spots on the current map. Visible ones show their object, hidden ones
 * sparkle when you (or your companion) get close; buried ones need digging/sniffing
 * or standing right next to them.
 */
export class DiscoverySpots {
  readonly spots: Spot[] = [];
  private debugAll = false;

  constructor(
    private readonly scene: Phaser.Scene,
    points: MapPoint[],
    found: readonly string[],
  ) {
    for (const p of points) {
      if (p.layer !== 'discoveries') continue;
      const def = discoveries.find((d) => d.id === p.contentId);
      if (!def) continue;
      const isFound = found.includes(def.id);
      const glint = scene.add.sprite(p.x, p.y - 6, 'glint').setDepth(DEPTH.glow + 1).setVisible(false);
      glint.play('glint:sparkle');
      const spot: Spot = { def, x: p.x, y: p.y, found: isFound, revealed: false, glint };
      if (def.look === 'visible') {
        const frame = ICON_ORDER.indexOf(def.icon);
        spot.icon = scene.add.image(p.x, p.y, 'icons', frame).setOrigin(0.5, 1).setDepth(entityDepth(p.y) - 1);
        if (def.icon === 'fish') spot.icon.setAlpha(0.55).setTint(0xaed6ea); // under the ice
      }
      this.spots.push(spot);
    }
  }

  /** The closest spot that is still hidden from you (for companions to sense). */
  nearestHidden(x: number, y: number, radius: number): Spot | null {
    let best: Spot | null = null;
    let bestD = radius;
    for (const s of this.spots) {
      if (s.found || s.revealed) continue;
      const d = Math.hypot(s.x - x, s.y - y);
      if (d <= bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  reveal(spot: Spot, dug = false): void {
    spot.revealed = true;
    if (dug && !spot.hole) {
      spot.hole = this.scene.add.image(spot.x, spot.y, 'hole').setDepth(DEPTH.prints + 0.5);
    }
  }

  markFound(spot: Spot): void {
    spot.found = true;
    spot.glint.setVisible(false);
  }

  update(px: number, py: number): void {
    const r = settings.nearby.glintRadius;
    for (const s of this.spots) {
      if (s.found) {
        s.glint.setVisible(false);
        continue;
      }
      const d = Math.hypot(s.x - px, s.y - py);
      const close = s.def.look === 'buried' ? d < r * 0.55 : d < r;
      s.glint.setVisible(this.debugAll || s.revealed || close || s.def.look === 'visible');
    }
  }

  /** Debug: show every spot with its id. */
  showAll(on: boolean): void {
    this.debugAll = on;
    for (const s of this.spots) {
      if (on && !s.label) {
        s.label = this.scene.add
          .text(s.x, s.y - 18, s.def.id, { fontFamily: 'monospace', fontSize: '8px', color: '#b00', backgroundColor: '#ffffffcc' })
          .setOrigin(0.5, 1)
          .setDepth(DEPTH.snow + 1);
      }
      s.label?.setVisible(on);
    }
  }
}
