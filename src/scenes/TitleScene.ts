import Phaser from 'phaser';
import { COLORS } from '../theme';
import { integerZoom } from '../systems/zoom';

/** Logical "stage" of the teaser scene in art pixels. */
const STAGE_W = 320;
const STAGE_H = 180;
const GROUND_Y = 120;

/**
 * Backdrop for the start and select screens: three red farmhouses in the snow at night.
 */
export class TitleScene extends Phaser.Scene {
  private snow?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super('Title');
  }

  create(): void {
    this.drawLandscape();
    this.layout();

    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });
  }

  private drawLandscape(): void {
    const g = this.add.graphics();
    // sky and snowy ground extend far beyond the stage so tall/wide screens are covered
    g.fillStyle(COLORS.night, 1).fillRect(-2000, -2000, 4000 + STAGE_W, 2000 + GROUND_Y);
    g.fillStyle(COLORS.snow, 1).fillRect(-2000, GROUND_Y, 4000 + STAGE_W, 2000);
    g.fillStyle(COLORS.snowShadow, 1).fillRect(-2000, GROUND_Y, 4000 + STAGE_W, 2);

    // a few stars (deterministic, so they don't jump around on resize)
    const rng = new Phaser.Math.RandomDataGenerator(['winter-village']);
    g.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 40; i++) g.fillRect(rng.between(-60, STAGE_W + 60), rng.between(-80, 70), 1, 1);

    // forest edge in the back, then North, Middle and South farm in a row
    for (let x = -40; x < STAGE_W + 40; x += 14) {
      this.add.image(x, GROUND_Y - 8 + ((x * 7) % 5), 'pine').setOrigin(0.5, 1).setTint(0xbfcbe0);
    }
    for (const x of [70, 160, 250]) {
      this.add.image(x, GROUND_Y + 14, 'farmhouse').setOrigin(0.5, 1);
    }
    for (const x of [22, 115, 205, 298]) {
      this.add.image(x, GROUND_Y + 22, 'pine').setOrigin(0.5, 1);
    }
  }

  /** Integer zoom + centering; called on start and on every resize/rotation. */
  private layout(): void {
    const { width, height } = this.scale.gameSize;
    const cam = this.cameras.main;
    cam.setSize(width, height);
    cam.setZoom(integerZoom(width, height, STAGE_W, STAGE_H));
    cam.centerOn(STAGE_W / 2, STAGE_H / 2);

    // Recreate the snowfall so it covers exactly the visible area.
    const visW = width / cam.zoom;
    const visH = height / cam.zoom;
    const left = STAGE_W / 2 - visW / 2;
    const top = STAGE_H / 2 - visH / 2;
    this.snow?.destroy();
    this.snow = this.add.particles(0, 0, 'flake', {
      x: { min: left - 20, max: left + visW + 20 },
      y: top - 4,
      lifespan: ((visH + 10) / 18) * 1000,
      speedY: { min: 14, max: 26 },
      speedX: { min: -6, max: 6 },
      scale: { min: 0.5, max: 1 },
      alpha: { min: 0.6, max: 1 },
      frequency: Math.max(20, 9000 / visW),
    });
    this.snow.setDepth(10);
    this.snow.fastForward(((visH + 10) / 18) * 1000);
  }
}
