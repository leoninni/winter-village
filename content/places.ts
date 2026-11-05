/**
 * Named places in the village. The map's "areas" layer refers to these ids
 * (custom property `contentId`). The name pops up briefly when you walk in.
 */
export const places = {
  norrgarden: { name: 'Norrgården', subtitle: 'Der nördliche Hof' },
  mellangarden: { name: 'Mellangården', subtitle: 'Der mittlere Hof' },
  sodergarden: { name: 'Södergården', subtitle: 'Der südliche Hof' },
  granskogen: { name: 'Granskogen', subtitle: 'Der Tannenwald' },
  akrarna: { name: 'Die Felder', subtitle: 'Unter einer dicken Schneedecke' },
  lillsjon: { name: 'Lillsjön', subtitle: 'Der kleine See – fest zugefroren' },
  kalkbacken: { name: 'Kälkbacken', subtitle: 'Der Schlittenhügel' },
  bygatan: { name: 'Bygatan', subtitle: 'Die Dorfstraße' },
} as const satisfies Record<string, { name: string; subtitle: string }>;

export type PlaceId = keyof typeof places;
