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
    blurb:
      'Liebt Tee, dicke Bücher, Selleriesaft und Datteln. Sucht ständig ihre Lesebrille – ' +
      'meistens sitzt sie auf ihrem Kopf. Ihr Lieblingsplatz: der Sonnenpalast.',
  },
  {
    id: 'isi',
    name: 'Isi',
    blurb:
      'Herz in Wien, Fuß am Ball, Schläger in der Hand. Im Sommer Aperol Spritz, im Winter ' +
      'Glühwein. Spricht längst feinstes Wienerisch: „Na servas, is des leiwand do!“',
  },
  {
    id: 'ninni',
    name: 'Ninni',
    blurb:
      'Liebt schöne Dinge, gutes Design und alles, was neugierig macht. Denkt über jede ' +
      'Schneeflocke dreimal nach – und dann noch ein viertes Mal. Bester Freund: Pauli.',
  },
];
