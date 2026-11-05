/**
 * Tuning knobs in one place. Safe to change; the game re-reads them on reload.
 * Speeds are in art pixels per second (one tile = 32 px).
 */
export const settings = {
  movement: {
    walkSpeed: 82,
    runSpeed: 136,
    /** Speed multiplier in deep snow (Teddy ignores this – he bounds through). */
    deepSnowFactor: 0.6,
    /** Tapping further away than this (in tiles) makes your character jog. */
    tapRunDistanceTiles: 9,
  },

  footprints: {
    /** Seconds until a footprint has melted away. */
    lifetime: 9,
    /** Maximum footprints visible at once (keeps phones fast). */
    max: 220,
  },

  world: {
    /** How strongly the blue winter-evening light tints the village (0 = none, 1 = very). */
    duskStrength: 0.22,
    /** Snowflakes per second per 100 px of screen width. */
    snowfall: 9,
  },

  save: {
    /** How often your position is saved while walking (seconds). */
    positionEvery: 3,
  },
} as const;
