/**
 * Named places in the village. The map's "areas" layer refers to these ids
 * (custom property `contentId`). The name pops up briefly when you walk in.
 */
export const places = {
  norrhagen: { name: 'Norrhagen', subtitle: 'Der nördliche Hof' },
  mitthagen: { name: 'Mitthagen', subtitle: 'Der mittlere Hof' },
  soderhagen: { name: 'Söderhagen', subtitle: 'Der südliche Hof' },
  granskogen: { name: 'Granskogen', subtitle: 'Der Tannenwald' },
  akrarna: { name: 'Die Felder', subtitle: 'Unter einer dicken Schneedecke' },
  lillsjon: { name: 'Lillsjön', subtitle: 'Der kleine See – fest zugefroren' },
  kalkbacken: { name: 'Kälkbacken', subtitle: 'Der Schlittenhügel' },
  bygatan: { name: 'Bygatan', subtitle: 'Die Dorfstraße' },
} as const satisfies Record<string, { name: string; subtitle: string }>;

export type PlaceId = keyof typeof places;
