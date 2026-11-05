/** The three playable characters. Only change the texts inside the quotes. */
export type CharacterId = 'sonne' | 'isi' | 'ninni';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  /** Short text on the character-select card. */
  blurb: string;
}

export const characters: CharacterDef[] = [
  {
    id: 'sonne',
    name: 'Sonne',
    // TODO Leonie: Sonnes Kurzbeschreibung persönlicher machen (Eigenheiten, Lieblingsdinge)
    blurb:
      'Liebt dicke Bücher, heißen Tee und das Knistern im Kamin. ' +
      'Hat im Dorf einen ganz besonderen Lieblingsplatz: den Sonnenpalast.',
  },
  {
    id: 'isi',
    name: 'Isi',
    // TODO Leonie: Isis Kurzbeschreibung (Eigenheiten, Lieblingsdinge, ein kleiner Insider)
    blurb:
      'Hat immer eine Idee und meistens auch einen Plan B. ' +
      'Findet, dass man Schneeballschlachten gar nicht früh genug anfangen kann.',
  },
  {
    id: 'ninni',
    name: 'Ninni',
    // TODO Leonie: Ninnis Kurzbeschreibung (Eigenheiten, Lieblingsdinge, ein kleiner Insider)
    blurb:
      'Entdeckt Dinge, an denen alle anderen vorbeilaufen. ' +
      'Hat stets ein Pfefferkuchen-Krümelchen in der Manteltasche.',
  },
];
