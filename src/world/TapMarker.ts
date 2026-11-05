import Phaser from 'phaser';
import { DEPTH } from './depth';

/**
 * Clear feedback for tap-to-move: a little snow puff where you tapped, and a
 * pulsing red-and-white ring on the spot you're walking to until you get there.
 */
export class TapMarker {
  private ring: Phaser.GameObjects.Sprite;
  private puff: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(private readonly scene: Phaser.Scene) {
    this.ring = scene.add.sprite(0, 0, 'tap-ring', 0).setDepth(DEPTH.marker).setVisible(false);
    this.puff = scene.add
      .particles(0, 0, 'puff', {
        emitting: false,
        lifespan: 380,
        speed: { min: 18, max: 46 },
        angle: { min: 180, max: 360 },
        gravityY: 120,
        alpha: { start: 0.9, end: 0 },
        scale: { start: 1, end: 0.5 },
      })
      .setDepth(DEPTH.marker);
  }

  /** `pop` = a fresh tap (puff + bounce); false = retargeting while dragging. */
  show(x: number, y: number, pop: boolean): void {
    const rx = Math.round(x);
    const ry = Math.round(y - 2);
    this.scene.tweens.killTweensOf(this.ring);
    this.ring.setPosition(rx, ry).setVisible(true).setAlpha(1);
    if (!this.ring.anims.isPlaying) this.ring.play('tap-ring:pulse');
    if (pop) {
      this.puff.explode(7, rx, ry);
      this.ring.setY(ry - 5);
      this.scene.tweens.add({ targets: this.ring, y: ry, duration: 140, ease: 'Back.easeOut' });
    }
  }

  hide(): void {
    if (!this.ring.visible) return;
    this.scene.tweens.add({
      targets: this.ring,
      alpha: 0,
      duration: 180,
      onComplete: () => {
        this.ring.setVisible(false).stop();
      },
    });
  }
}
