import Phaser from 'phaser';
import { COLORS } from '../theme';

/**
 * Generates small textures in code: title-screen houses, light glows, footprints,
 * the tap marker, smoke puffs and snowflakes. (Sprite sheets come from PNGs.)
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.makeFlake();
    this.makeFarmhouse();
    this.makePine();
    this.makeGlows();
    this.makePrints();
    this.makeMisc();
    this.scene.start('Preload');
  }

  private gen(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
    const g = this.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeFlake(): void {
    this.gen('flake', 2, 2, (g) => g.fillStyle(COLORS.snow, 1).fillRect(0, 0, 2, 2));
  }

  /** Stepped (pixel-art) radial glows; drawn with ADD blending in the world. */
  private makeGlows(): void {
    const rings = (g: Phaser.GameObjects.Graphics, cx: number, cy: number, radii: number[], color: number, alpha: number) => {
      for (const r of radii) g.fillStyle(color, alpha).fillCircle(cx, cy, r);
    };
    this.gen('glow-window', 48, 48, (g) => rings(g, 24, 24, [22, 17, 12, 8], 0xffb84d, 0.13));
    this.gen('glow-lantern', 40, 40, (g) => rings(g, 20, 20, [18, 13, 9, 5], 0xffc266, 0.16));
    this.gen('glow-ground', 56, 20, (g) => {
      for (const [w, h] of [
        [56, 20],
        [42, 14],
        [28, 9],
      ] as const) {
        g.fillStyle(0xffb84d, 0.1).fillEllipse(28, 10, w, h);
      }
    });
    this.gen('glow-fire', 96, 80, (g) => {
      for (const [w, h, a] of [
        [96, 80, 0.08],
        [76, 62, 0.09],
        [56, 46, 0.1],
        [36, 30, 0.12],
      ] as const) {
        g.fillStyle(0xff9a3c, a).fillEllipse(48, 40, w, h);
      }
    });
    this.gen('glow-ground-big', 120, 40, (g) => {
      for (const [w, h] of [
        [120, 40],
        [90, 28],
        [60, 18],
      ] as const) {
        g.fillStyle(0xff9a3c, 0.09).fillEllipse(60, 20, w, h);
      }
    });
    this.gen('shadow', 16, 6, (g) => g.fillStyle(0x24324f, 0.22).fillEllipse(8, 3, 16, 6));
    this.gen('shadow-small', 12, 5, (g) => g.fillStyle(0x24324f, 0.22).fillEllipse(6, 2.5, 12, 5));
  }

  private makePrints(): void {
    const ink = 0x8597b8;
    // boot prints, for walking up/down (v) and left/right (h)
    this.gen('print-boot-v', 3, 5, (g) => g.fillStyle(ink, 1).fillRect(0, 0, 3, 3).fillRect(0, 4, 3, 1));
    this.gen('print-boot-h', 5, 3, (g) => g.fillStyle(ink, 1).fillRect(0, 0, 3, 3).fillRect(4, 0, 1, 3));
    this.gen('print-paw', 3, 3, (g) => g.fillStyle(ink, 1).fillRect(1, 1, 2, 2).fillRect(0, 0, 1, 1).fillRect(2, 0, 1, 1));
    // sled runner marks
    this.gen('print-sled-h', 4, 7, (g) => g.fillStyle(ink, 1).fillRect(0, 0, 4, 1).fillRect(0, 6, 4, 1));
    this.gen('print-sled-v', 19, 4, (g) => g.fillStyle(ink, 1).fillRect(0, 0, 1, 4).fillRect(18, 0, 1, 4));
    // deep-snow holes are bigger
    this.gen('print-deep', 5, 5, (g) => g.fillStyle(ink, 1).fillRect(1, 0, 3, 5).fillRect(0, 1, 5, 3));
  }

  private makeMisc(): void {
    this.gen('spark', 2, 2, (g) => g.fillStyle(0xffc04a, 1).fillRect(0, 0, 2, 2));
    this.gen('star', 5, 5, (g) => g.fillStyle(0xffe27a, 1).fillRect(2, 0, 1, 5).fillRect(0, 2, 5, 1).fillStyle(0xffffff, 1).fillRect(2, 2, 1, 1));
    this.gen('zzz', 5, 5, (g) => g.fillStyle(0xf4f7fb, 1).fillRect(0, 0, 5, 1).fillRect(3, 1, 1, 1).fillRect(2, 2, 1, 1).fillRect(1, 3, 1, 1).fillRect(0, 4, 5, 1));
    this.gen('hole', 12, 6, (g) => g.fillStyle(0x8597b8, 0.55).fillEllipse(6, 3, 12, 6).fillStyle(0x5f6f90, 0.5).fillEllipse(6, 3, 7, 3));
    this.gen('exit-arrow', 9, 7, (g) => g.fillStyle(0xfdfcf7, 1).fillTriangle(0, 0, 9, 0, 4.5, 7).fillStyle(0xd94b3d, 1).fillTriangle(2, 1, 7, 1, 4.5, 5));
    // "…" prompt bubble over things you can talk to
    this.gen('prompt', 13, 11, (g) => {
      g.fillStyle(0x2b2420, 1).fillRect(1, 0, 11, 8).fillRect(0, 1, 13, 6).fillRect(5, 8, 3, 1).fillRect(6, 9, 1, 1);
      g.fillStyle(0xfdfcf7, 1).fillRect(2, 1, 9, 6).fillRect(1, 2, 11, 4).fillRect(6, 7, 1, 1);
      g.fillStyle(0x2b2420, 1).fillRect(3, 4, 1, 1).fillRect(6, 4, 1, 1).fillRect(9, 4, 1, 1);
    });
    // discovery glint: 2-frame sparkle (7×7 each)
    this.gen('glint', 14, 7, (g) => {
      g.fillStyle(0xffffff, 1).fillRect(3, 0, 1, 7).fillRect(0, 3, 7, 1).fillStyle(0xffe27a, 1).fillRect(3, 3, 1, 1);
      g.fillStyle(0xffffff, 1).fillRect(10, 2, 1, 3).fillRect(9, 3, 3, 1).fillStyle(0xffe27a, 0.8).fillRect(8, 1, 1, 1).fillRect(12, 5, 1, 1);
    });
    const glint = this.textures.get('glint');
    glint.add(0, 0, 0, 0, 7, 7);
    glint.add(1, 0, 7, 0, 7, 7);
    this.anims.create({ key: 'glint:sparkle', frames: [0, 1, 0, 1, 1].map((frame) => ({ key: 'glint', frame })), frameRate: 4, repeat: -1 });

    this.gen('puff', 4, 4, (g) => g.fillStyle(0xffffff, 1).fillRect(1, 0, 2, 4).fillRect(0, 1, 4, 2));
    // tap marker: 4 frames of a pulsing ring, 16×10 each
    const ring = (g: Phaser.GameObjects.Graphics, ox: number, w: number, h: number) => {
      g.fillStyle(0xd94b3d, 1).fillEllipse(ox + 8, 5, w, h);
      g.fillStyle(0xffffff, 1).fillEllipse(ox + 8, 5, w - 4, h - 3);
      g.fillStyle(0xd94b3d, 1).fillRect(ox + 7, 4, 2, 2);
    };
    this.gen('tap-ring', 64, 10, (g) => {
      ring(g, 0, 16, 10);
      ring(g, 16, 14, 9);
      ring(g, 32, 12, 8);
      ring(g, 48, 14, 9);
    });
    const tex = this.textures.get('tap-ring');
    for (let i = 0; i < 4; i++) tex.add(i, 0, i * 16, 0, 16, 10);
    this.anims.create({
      key: 'tap-ring:pulse',
      frames: [0, 1, 2, 3].map((frame) => ({ key: 'tap-ring', frame })),
      frameRate: 8,
      repeat: -1,
    });
  }

  /** Small red farmhouse for the title backdrop. 56×48 art pixels. */
  private makeFarmhouse(): void {
    this.gen('farmhouse', 56, 48, (g) => {
      const W = 56;
      g.fillStyle(COLORS.farmRed, 1).fillRect(4, 18, W - 8, 30);
      g.fillStyle(COLORS.farmRedDark, 1).fillRect(4, 46, W - 8, 2);
      g.fillStyle(COLORS.trim, 1)
        .fillRect(4, 18, 3, 30)
        .fillRect(W - 7, 18, 3, 30)
        .fillRect(4, 18, W - 8, 2);
      for (let row = 0; row < 9; row++) {
        const half = 6 + row * 3;
        g.fillStyle(row === 8 ? COLORS.snowShadow : COLORS.snow, 1);
        g.fillRect(W / 2 - half, row * 2, half * 2, 2);
      }
      for (const x of [11, 37]) {
        g.fillStyle(COLORS.trim, 1).fillRect(x - 1, 24, 10, 10);
        g.fillStyle(COLORS.windowGlow, 1).fillRect(x, 25, 8, 8);
        g.fillStyle(COLORS.trim, 1).fillRect(x + 3, 25, 2, 8).fillRect(x, 28, 8, 2);
      }
      g.fillStyle(COLORS.trim, 1).fillRect(24, 31, 9, 17);
      g.fillStyle(COLORS.farmRedDark, 1).fillRect(25, 32, 7, 16);
      g.fillStyle(COLORS.windowGlow, 1).fillRect(30, 40, 1, 1);
    });
  }

  /** Snow-dusted pine for the title backdrop. 20×32 art pixels. */
  private makePine(): void {
    this.gen('pine', 20, 32, (g) => {
      g.fillStyle(0x5b3a24, 1).fillRect(8, 26, 4, 6);
      for (const { y, half } of [
        { y: 18, half: 10 },
        { y: 10, half: 8 },
        { y: 3, half: 5 },
      ]) {
        for (let r = 0; r < 8; r++) {
          const w = Math.max(1, Math.round((half * (r + 1)) / 8));
          g.fillStyle(r < 2 ? COLORS.snow : r % 3 === 0 ? COLORS.pineDark : COLORS.pine, 1);
          g.fillRect(10 - w, y + r, w * 2, 1);
        }
      }
    });
  }
}
