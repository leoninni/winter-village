/**
 * Integer camera zoom keeps pixel art crisp: every art pixel becomes an exact
 * whole number of screen pixels. Returns the largest whole zoom (min 1) at which
 * at least `minVisibleW × minVisibleH` world pixels are still visible.
 */
export function integerZoom(
  viewWidth: number,
  viewHeight: number,
  minVisibleW: number,
  minVisibleH: number,
): number {
  if (viewWidth <= 0 || viewHeight <= 0) return 1;
  const fit = Math.min(viewWidth / minVisibleW, viewHeight / minVisibleH);
  return Math.max(1, Math.floor(fit));
}
