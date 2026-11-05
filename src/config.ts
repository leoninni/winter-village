import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { COLORS } from './theme';

/** World tile size in art pixels. Sprites/tiles are drawn at this scale. */
export const TILE_SIZE = 32;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: COLORS.night,
  // Crisp pixel art: nearest-neighbour scaling, whole-pixel positions.
  // Camera zoom is always an integer (see systems/zoom.ts).
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  input: { activePointers: 2 },
  scene: [BootScene, TitleScene],
};
