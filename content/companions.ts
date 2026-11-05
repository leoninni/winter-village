/** The three companions. Texts can be changed freely; numbers are tuning knobs. */
export type CompanionId = 'teddy' | 'pauli' | 'kratzi';

export interface CompanionDef {
  id: CompanionId;
  name: string;
  /** Short text on the companion-select card. */
  blurb: string;
  /** How far (in pixels of path) the companion trots behind you. */
  followDistance: number;
  /** Top speed in pixels per second (a bit faster than you, so it catches up). */
  speed: number;
}

export const companions: CompanionDef[] = [
  {
    id: 'teddy',
    name: 'Teddy',
    blurb:
      'Blonder Labrador mit Supernase. Schnüffelt Geheimnisse auf, hüpft durch Tiefschnee ' +
      'wie ein Delfin – und Kekse sind bei ihm nie ganz sicher.',
    followDistance: 30,
    speed: 135,
  },
  {
    id: 'pauli',
    name: 'Pauli',
    blurb:
      'Kleiner weißer Hund. Im Schnee praktisch unsichtbar („Wo ist Pauli?“). ' +
      'Buddelt alles aus und bleibt gern mal in einer Schneewehe stecken.',
    followDistance: 24,
    speed: 140,
  },
  {
    id: 'kratzi',
    name: 'Kratzi',
    blurb:
      'Ein sehr alter, sehr würdevoller Teddybär. Fährt auf dem Schlitten mit, den du ziehst. ' +
      'Wenn du zu lange rennst … verliert er ein bisschen den Kopf.',
    followDistance: 26, // rope length
    speed: 0, // pulled by the rope, not walking
  },
];
