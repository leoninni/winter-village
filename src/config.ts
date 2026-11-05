import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';
import { computeViewport } from './systems/viewport';
import { COLORS } from './theme';

/** World tile size in art pixels. */
export const TILE_SIZE = 32;

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  const view = computeViewport();
  return {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: COLORS.night,
    // Crisp pixel art: no antialiasing, whole-pixel rendering. The canvas is
    // enlarged by a whole-number CSS zoom (systems/viewport.ts), the camera never zooms.
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.NONE,
      width: view.width,
      height: view.height,
      zoom: view.zoom,
    },
    input: { activePointers: 2 },
    scene: [BootScene, PreloadScene, TitleScene, WorldScene],
  };
}
