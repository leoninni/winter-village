/**
 * Animals of Snöbyn. Tap or talk to them and one of their lines is picked.
 * Their reactions to things happening nearby live in reactions.ts.
 */
import type { Line } from '../src/systems/conditions';

export type AnimalKind = 'horse' | 'chicken' | 'bird' | 'cat';

export interface AnimalDef {
  id: string;
  kind: AnimalKind;
  name: string;
  lines: Line[];
}

export const animals: AnimalDef[] = [
  {
    id: 'klover',
    kind: 'horse',
    name: 'Klöver',
    lines: [
      '*Klöver schnaubt dir warm ins Gesicht. Es riecht nach Heu.*',
      '*Klöver stupst deine Manteltasche an. Sie sucht Möhren.*',
      '*Klöver schüttelt die Mähne. Schnee rieselt auf dich.*',
      { text: '*Klöver und Teddy beschnuppern sich. Sehr gründlich. Sehr lange.*', when: { companion: 'teddy' } },
      { text: '„Na, du Fiakerpferd!“ *Klöver wirkt geschmeichelt.*', when: { character: 'isi' } },
      { text: '*Klöver beäugt Kratzi auf dem Schlitten. Dann den Schlitten. Sie überlegt, ob sie ziehen soll.*', when: { companion: 'kratzi' } },
    ],
  },
  {
    id: 'chickens',
    kind: 'chicken',
    name: 'Die Hühner',
    lines: [
      '*Gack.*',
      '*Die Hühner beraten sich. Ergebnis: Gack.*',
      '*Ein Huhn beäugt dich, als hättest du ihm etwas versprochen.*',
      '*Das kleinste Huhn pickt an deinem Schnürsenkel. Probeweise.*',
      { text: '*Die Hühner zählen durch. Wo ist der kleine weiße Hund? Er ist überall und nirgends. Panik.*', when: { companion: 'pauli' } },
    ],
  },
  {
    id: 'bullfinches',
    kind: 'bird',
    name: 'Die Gimpel',
    lines: [
      '*Ein Gimpel plustert sich auf, bis er fast kugelrund ist.*',
      '*Tschüp!*',
      '*Die Gimpel sitzen in einer Reihe wie kleine rote Christbaumkugeln.*',
      { text: '*Ninni bewundert das Rot. Exakt das richtige Rot. Wer hat das ausgesucht?*', when: { character: 'ninni' } },
    ],
  },
  {
    id: 'smulan',
    kind: 'cat',
    name: 'Smulan',
    lines: [
      '*Smulan schnurrt im Schlaf. Ein Ohr zuckt.*',
      '*Smulan öffnet ein Auge, beurteilt dich und schläft weiter.*',
      '*Smulan streckt eine Pfote aus. Genau so weit, dass sie dich gerade nicht erreicht.*',
      { text: '*Smulan rollt sich auf den Rücken. Das macht sie nur für dich.*', when: { character: 'sonne' } },
      { text: '*Smulan und Pauli liegen Rücken an Rücken. Sie würde es nie zugeben.*', when: { companion: 'pauli' } },
    ],
  },
];
