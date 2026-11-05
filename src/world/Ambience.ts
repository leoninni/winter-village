import Phaser from 'phaser';
import { settings } from '../../content/settings';
import { DEPTH } from './depth';
import { props } from './props';
import type { VillageMap } from './VillageMap';

/**
 * The cozy layer: blue winter-evening light over the village, warm glowing
 * windows and lanterns (with light pooling on the snow), chimney smoke, and
 * gently falling snow.
 */
export class Ambience {
  private dusk: Phaser.GameObjects.Rectangle;
  private snow?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(
    private readonly scene: Phaser.Scene,
    map: VillageMap,
  ) {
    // Evening light: multiply the world by a soft blue. Lights sit above it so they glow.
    const s = settings.world.duskStrength;
    const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xffffff),
      Phaser.Display.Color.ValueToColor(0x5466a8),
      100,
      Math.round(s * 100),
    );
    this.dusk = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b))
      .setOrigin(0)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(DEPTH.dusk);

    for (const p of map.props) {
      const def = props[p.type];
      for (const g of 'glows' in def ? def.glows : []) this.addGlow(p.x + g.x, p.y + g.y, g.kind, p.y);
      if ('chimney' in def) this.addSmoke(p.x + def.chimney.x, p.y + def.chimney.y);
    }
    this.layout();
  }

  private addGlow(x: number, y: number, kind: 'window' | 'lantern', groundY: number): void {
    const s = this.scene;
    const glow = s.add
      .image(Math.round(x), Math.round(y), kind === 'window' ? 'glow-window' : 'glow-lantern')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.glow)
      .setAlpha(0.8);
    const pool = s.add
      .image(Math.round(x), Math.round(kind === 'window' ? groundY + 10 : groundY + 2), 'glow-ground')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.glow)
      .setAlpha(0.7);
    // a gentle, candle-like flicker – every light on its own rhythm
    for (const img of [glow, pool]) {
      s.tweens.add({
        targets: img,
        alpha: { from: img.alpha, to: img.alpha * 0.72 },
        duration: Phaser.Math.Between(900, 1800),
        delay: Phaser.Math.Between(0, 1500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private addSmoke(x: number, y: number): void {
    this.scene.add
      .particles(Math.round(x), Math.round(y), 'puff', {
        lifespan: 4200,
        speedY: { min: -14, max: -7 },
        speedX: { min: 2, max: 7 },
        scale: { start: 1, end: 2.5 },
        alpha: { start: 0.55, end: 0 },
        tint: 0xe9edf5,
        frequency: 420,
      })
      .setDepth(DEPTH.smoke);
  }

  /** Call on resize: the dusk overlay and snowfall cover exactly the screen. */
  layout(): void {
    const { width, height } = this.scene.scale;
    this.dusk.setSize(width, height);
    this.snow?.destroy();
    const lifespan = ((height + 20) / 26) * 1000;
    this.snow = this.scene.add
      .particles(0, 0, 'flake', {
        x: { min: -20, max: width + 20 },
        y: -4,
        lifespan,
        speedY: { min: 18, max: 34 },
        speedX: { min: -9, max: 5 },
        scale: { min: 0.5, max: 1 },
        alpha: { min: 0.55, max: 1 },
        frequency: 1000 / Math.max(1, (settings.world.snowfall * width) / 100),
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.snow);
    this.snow.fastForward(lifespan);
  }
}
