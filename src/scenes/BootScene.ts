import Phaser from 'phaser';
import { COLORS } from '../theme';

/**
 * Generates tiny placeholder textures in code so Phase 0 needs no image files.
 * (From Phase 1 on, placeholder PNGs come from tools/gen-placeholders.ts.)
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.makeFlake();
    this.makeFarmhouse();
    this.makePine();
    this.scene.start('Title');
  }

  private makeFlake(): void {
    const g = this.add.graphics();
    g.fillStyle(COLORS.snow, 1).fillRect(0, 0, 2, 2);
    g.generateTexture('flake', 2, 2);
    g.destroy();
  }

  /** Red Småland farmhouse with white trim and a snowy roof. 56×48 art pixels. */
  private makeFarmhouse(): void {
    const g = this.add.graphics();
    const W = 56;
    // walls
    g.fillStyle(COLORS.farmRed, 1).fillRect(4, 18, W - 8, 30);
    g.fillStyle(COLORS.farmRedDark, 1).fillRect(4, 46, W - 8, 2);
    // white corner boards + band under the roof
    g.fillStyle(COLORS.trim, 1)
      .fillRect(4, 18, 3, 30)
      .fillRect(W - 7, 18, 3, 30)
      .fillRect(4, 18, W - 8, 2);
    // stepped snowy roof (pixel-art staircase instead of an anti-aliased triangle)
    for (let row = 0; row < 9; row++) {
      const half = 6 + row * 3;
      g.fillStyle(row === 8 ? COLORS.snowShadow : COLORS.snow, 1);
      g.fillRect(W / 2 - half, row * 2, half * 2, 2);
    }
    // glowing windows with white frames
    for (const x of [11, 37]) {
      g.fillStyle(COLORS.trim, 1).fillRect(x - 1, 24, 10, 10);
      g.fillStyle(COLORS.windowGlow, 1).fillRect(x, 25, 8, 8);
      g.fillStyle(COLORS.trim, 1).fillRect(x + 3, 25, 2, 8).fillRect(x, 28, 8, 2);
    }
    // door
    g.fillStyle(COLORS.trim, 1).fillRect(24, 31, 9, 17);
    g.fillStyle(COLORS.farmRedDark, 1).fillRect(25, 32, 7, 16);
    g.fillStyle(COLORS.windowGlow, 1).fillRect(30, 40, 1, 1);
    g.generateTexture('farmhouse', W, 48);
    g.destroy();
  }

  /** Snow-dusted pine. 20×32 art pixels. */
  private makePine(): void {
    const g = this.add.graphics();
    g.fillStyle(0x5b3a24, 1).fillRect(8, 26, 4, 6);
    const tiers = [
      { y: 18, half: 10 },
      { y: 10, half: 8 },
      { y: 3, half: 5 },
    ];
    for (const { y, half } of tiers) {
      for (let r = 0; r < 8; r++) {
        const w = Math.max(1, Math.round((half * (r + 1)) / 8));
        g.fillStyle(r < 2 ? COLORS.snow : r % 3 === 0 ? COLORS.pineDark : COLORS.pine, 1);
        g.fillRect(10 - w, y + r, w * 2, 1);
      }
    }
    g.generateTexture('pine', 20, 32);
    g.destroy();
  }
}
