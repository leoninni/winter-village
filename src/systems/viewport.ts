/**
 * Pixel-perfect viewport. Phaser 4's `roundPixels` only snaps sprites when the
 * camera is NOT zoomed, so instead of zooming the camera we render the game at a
 * smaller size and let the Scale Manager enlarge the whole canvas by a whole
 * number (`scale.zoom`). Every art pixel becomes an exact block of screen pixels.
 */
import type Phaser from 'phaser';
import { integerZoom } from './zoom';

/** At least this many art pixels stay visible on the short side (~12 tiles). */
export const MIN_VISIBLE = 12 * 32;

export interface ViewportSize {
  width: number;
  height: number;
  zoom: number;
}

export function computeViewport(cssWidth = window.innerWidth, cssHeight = window.innerHeight): ViewportSize {
  const zoom = integerZoom(cssWidth, cssHeight, MIN_VISIBLE, MIN_VISIBLE);
  return { width: Math.ceil(cssWidth / zoom), height: Math.ceil(cssHeight / zoom), zoom };
}

/** Keeps the game fitted to the window through resizes and phone rotations. */
export function keepViewportFitted(game: Phaser.Game): void {
  let pending = 0;
  const apply = () => {
    pending = 0;
    const v = computeViewport();
    if (game.scale.zoom !== v.zoom) game.scale.setZoom(v.zoom);
    if (game.scale.width !== v.width || game.scale.height !== v.height) game.scale.resize(v.width, v.height);
  };
  const schedule = () => {
    if (!pending) pending = requestAnimationFrame(apply);
  };
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', () => setTimeout(schedule, 120));
  window.visualViewport?.addEventListener('resize', schedule);
}
