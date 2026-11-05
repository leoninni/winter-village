/** Draw order. Everything standing in the world is sorted by its feet y (ENTITY + y). */
export const DEPTH = {
  ground: 0,
  prints: 1,
  entity: 10, // + feet y
  dusk: 50_000,
  glow: 50_100,
  smoke: 50_200,
  marker: 50_300,
  snow: 50_400,
} as const;

export const entityDepth = (feetY: number) => DEPTH.entity + feetY;
