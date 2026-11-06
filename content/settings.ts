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

  gags: {
    /** Kratzi: seconds of running in a row until his head pops off … */
    kratziRunSeconds: 4,
    /** … and then at most once every this many seconds. */
    kratziCooldown: 120,
    /** Pauli: earliest time between two "stuck in a snowdrift" moments (seconds). */
    pauliStuckCooldown: 180,
    /** Pauli: chance per second (while walking in deep snow) to get stuck once allowed. */
    pauliStuckChance: 0.12,
    /** Pauli: seconds between random "dig for nothing" moments (min, max). */
    pauliRandomDig: [80, 150],
    /** How close (px) a companion must be to sense a hidden discovery: Teddy, Pauli, Kratzi. */
    senseRadius: { teddy: 170, pauli: 140, kratzi: 110 },
    /** Seconds between two companion "I found something" moments. */
    senseCooldown: 18,
    /** Seconds standing still before the companion does something cute. */
    idleSeconds: 18,
  },

  nearby: {
    /** How close (px) you must be to see a hidden discovery glint yourself. */
    glintRadius: 60,
    /** How far (px) villagers and animals notice things happening. */
    hearing: 230,
    /** Seconds before the same villager/animal may react again. */
    speakerCooldown: 10,
  },

  save: {
    /** How often your position is saved while walking (seconds). */
    positionEvery: 3,
  },
} as const;
