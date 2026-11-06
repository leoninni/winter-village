import Phaser from 'phaser';
import { settings } from '../../content/settings';
import { DEPTH, entityDepth } from './depth';
import { props, type GlowKind } from './props';
import type { VillageMap } from './VillageMap';

interface Glow {
  img: Phaser.GameObjects.Image;
  base: number;
  kind: GlowKind;
}

/**
 * The cozy layer. Outside: blue winter-evening light, warm glowing windows and
 * lanterns with light pooling on the snow, chimney smoke, falling snow.
 * Inside: warm dim light, a crackling fire with sparks, lamp light, teapot steam.
 */
export class Ambience {
  private tint: Phaser.GameObjects.Rectangle;
  private snow?: Phaser.GameObjects.Particles.ParticleEmitter;
  private glows: Glow[] = [];
  private fireGlows: Glow[] = [];
  private flareUntil = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly map: VillageMap,
  ) {
    // Evening light: multiply the world by a soft blue (outside) or warm amber (inside).
    const indoor = map.indoor;
    const s = indoor ? 0.38 : settings.world.duskStrength;
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xffffff),
      Phaser.Display.Color.ValueToColor(indoor ? 0x8a5a3a : 0x5466a8),
      100,
      Math.round(s * 100),
    );
    this.tint = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, Phaser.Display.Color.GetColor(c.r, c.g, c.b))
      .setOrigin(0)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(DEPTH.dusk);

    for (const p of map.props) {
      const def = props[p.type];
      for (const g of 'glows' in def ? def.glows : []) this.addGlow(p.x + g.x, p.y + g.y, g.kind, p.y);
      if ('chimney' in def) this.addSmoke(p.x + def.chimney.x, p.y + def.chimney.y);
      if ('fires' in def) for (const f of def.fires) this.addFire(p.x + f.x, p.y + f.y, p.y);
      if ('steam' in def) this.addSteam(p.x + def.steam.x, p.y + def.steam.y);
    }
    if (map.indoor) {
      // a gentle crackle: the fire light jumps a little, all the time
      scene.time.addEvent({ delay: 110, loop: true, callback: () => this.crackle() });
    }
    this.layout();
  }

  private addGlow(x: number, y: number, kind: GlowKind, groundY: number): void {
    const s = this.scene;
    const tex = kind === 'window' ? 'glow-window' : kind === 'fire' ? 'glow-fire' : 'glow-lantern';
    const glow = s.add.image(Math.round(x), Math.round(y), tex).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.glow).setAlpha(0.8);
    const poolY = kind === 'window' ? groundY + 10 : kind === 'fire' ? groundY + 14 : groundY + 2;
    const pool = s.add
      .image(Math.round(x), Math.round(poolY), kind === 'fire' ? 'glow-ground-big' : 'glow-ground')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.glow)
      .setAlpha(kind === 'fire' ? 0.85 : 0.7);
    for (const img of [glow, pool]) {
      const g: Glow = { img, base: img.alpha, kind };
      if (kind === 'fire') {
        this.fireGlows.push(g);
        continue;
      }
      this.glows.push(g);
      // a gentle, candle-like flicker – every light on its own rhythm
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

  private addFire(x: number, y: number, groundY: number): void {
    const s = this.scene;
    s.add
      .sprite(Math.round(x), Math.round(y), 'fire')
      .setOrigin(0.5, 1)
      .setDepth(entityDepth(groundY) + 0.5)
      .play({ key: 'fire:burn', startFrame: Phaser.Math.Between(0, 3) });
    s.add
      .particles(Math.round(x), Math.round(y - 10), 'spark', {
        lifespan: { min: 500, max: 1100 },
        speedY: { min: -40, max: -18 },
        speedX: { min: -10, max: 10 },
        alpha: { start: 1, end: 0 },
        frequency: 260,
      })
      .setDepth(DEPTH.glow + 1);
  }

  private addSteam(x: number, y: number): void {
    this.scene.add
      .particles(Math.round(x), Math.round(y), 'puff', {
        lifespan: 1800,
        speedY: { min: -10, max: -5 },
        speedX: { min: -3, max: 3 },
        scale: { start: 0.6, end: 1.6 },
        alpha: { start: 0.45, end: 0 },
        frequency: 380,
      })
      .setDepth(DEPTH.glow + 1);
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

  private crackle(): void {
    const flare = this.scene.time.now < this.flareUntil ? 1.3 : 1;
    for (const g of this.fireGlows) {
      g.img.setAlpha(Math.min(1, g.base * flare * Phaser.Math.FloatBetween(0.72, 1.05)));
      g.img.setScale(flare > 1 ? Phaser.Math.FloatBetween(1.15, 1.3) : Phaser.Math.FloatBetween(0.96, 1.06));
    }
  }

  /** The fire flares up for a moment (e.g. when Sonne arrives). */
  flare(ms = 2500): void {
    this.flareUntil = this.scene.time.now + ms;
  }

  /** Call on resize: the light layer and snowfall cover exactly the screen. */
  layout(): void {
    const { width, height } = this.scene.scale;
    this.tint.setSize(width, height);
    this.snow?.destroy();
    this.snow = undefined;
    if (this.map.indoor) return;
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
