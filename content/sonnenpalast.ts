/**
 * The Sonnenpalast – Sonne's favourite room in Norrhagen: fire, books, tea, a sleeping cat.
 * Everyone may visit, but it's clearly Sonne's place.
 * Sequences (arrival*First) are shown line by line; *Again lines: one is picked.
 * Lines whose text starts with "Sonne:" etc. are shown as that person speaking.
 */
import type { Line } from '../src/systems/conditions';

export const sonnenpalast = {
  title: 'Sonnenpalast',
  subtitle: 'Sonnes Lieblingsplatz',

  /** Sonne's very first visit */
  arrivalSonneFirst: [
    '*Die Tür knarrt – ein vertrautes, freundliches Knarren.*',
    '*Im Kamin flackert das Feuer auf, als hätte es auf dich gewartet.*',
    'Sonne: Endlich. Mein Sonnenpalast.',
    '*Smulan hebt den Kopf, blinzelt dich an und schnurrt einmal laut. Willkommen zuhause.*',
    // TODO Leonie: persönliche Zeile für Sonnes erste Ankunft im Sonnenpalast
    'Sonne: Tee, ein dickes Buch, das Knistern im Kamin … und irgendwo hier liegt bestimmt meine Lesebrille.',
  ] satisfies Line[],

  /** Sonne coming back */
  arrivalSonneAgain: [
    'Ah. Zuhause.',
    '*Das Feuer knistert zur Begrüßung.*',
    'Wo war ich stehengeblieben? Seite 312? Oder 213?',
    '*Smulan schnurrt, ohne aufzuwachen.*',
    'Erst Tee. Dann alles andere.',
  ] satisfies Line[],

  /** Anyone else's first visit */
  arrivalOtherFirst: [
    { text: '*Isi bleibt in der Tür stehen.*', when: { character: 'isi' } },
    { text: 'Isi: Oida. Des is ja da Sonnenpalast.', when: { character: 'isi' } },
    { text: 'Isi: Bücher, Tee, Kamin … und a Sessel mit ana eindeutigen Sonne-Kuhle. I setz mi do liaba ned hin.', when: { character: 'isi' } },
    { text: '*Ninni betritt den Raum auf Zehenspitzen.*', when: { character: 'ninni' } },
    { text: 'Ninni: Die Farben der Buchrücken, das warme Licht, der Kamin … das ist eindeutig Sonnes Reich.', when: { character: 'ninni' } },
    { text: '*Ninni überlegt, ob man hier ohne Einladung atmen darf. Dann, ob schon das Nachdenken darüber unhöflich ist. Dann setzt sie sich ganz vorsichtig auf die äußerste Kante des Teppichs.*', when: { character: 'ninni' } },
    '*Smulan öffnet ein Auge. Es sagt: Benimm dich, das ist Sonnes Zimmer.*',
  ] satisfies Line[],

  /** Anyone else coming back */
  arrivalOtherAgain: [
    '*Du schleichst leise hinein. Für ein paar Minuten darf man bestimmt.*',
    '*Smulan wacht nicht auf. Ein gutes Zeichen.*',
    { text: 'Leiwand warm is’ do.', when: { character: 'isi' } },
    { text: '*Ninni rückt ein Buch gerade, das schief stand. Dann noch eins.*', when: { character: 'ninni' } },
  ] satisfies Line[],

  /** What the companion does once inside */
  companionInside: [
    { text: '*Teddy legt sich vor den Kamin und seufzt tief und glücklich.*', when: { companion: 'teddy' } },
    { text: '*Pauli kuschelt sich an Smulan. Smulan duldet es. Gerade so.*', when: { companion: 'pauli' } },
    { text: '*Kratzi bestand darauf, samt Schlitten hereinzukommen. Er wirkt sehr zufrieden.*', when: { companion: 'kratzi' } },
  ] satisfies Line[],

  fireplace: [
    '*Das Feuer knistert. Für einen Moment sieht eine Flamme aus wie ein kleiner tanzender Bär.*',
    '*Ein Scheit knackt laut. Smulan zuckt mit einem Ohr.*',
    { text: '*Du wärmst dir die Hände. Genau so muss sich Dezember anfühlen.*', when: { character: 'sonne' } },
    { text: '*Kratzi hält respektvoll Abstand. Er ist schließlich aus Wolle.*', when: { companion: 'kratzi' } },
  ] satisfies Line[],

  bookshelfIntro: 'Das Regal biegt sich unter den Büchern. Ein paar Titel springen dir ins Auge:',
  // TODO Leonie: echte Lieblingsbücher von Sonne (Titel, gern mit kleinem Kommentar)
  books: [
    '„Die Kunst, eine Lesebrille wiederzufinden“ (Band 1 bis 7)',
    '„Tee für Fortgeschrittene“',
    '„Hundert Arten, Datteln zu genießen“',
    '„Selleriesaft – eine Liebesgeschichte“',
    '„Ein Winter in Småland“ (mit Eselsohren)',
    '„Das Buch, das man immer wieder von vorn anfängt“',
  ],
  bookshelfSonne: 'Sonne: Die habe ich alle gelesen. Manche zweimal. Eins davon siebenmal.',

  // TODO Leonie: Gegenstände im Erinnerungsregal (Fotos, Andenken, kleine Insider)
  memoryShelf: [
    '*Auf dem obersten Brett: ein gerahmtes Foto, eine kleine Holzfigur und eine Muschel, die so gar nicht nach Småland passt.*',
    '*Daneben ein Zettel: „Nicht abstauben – das ist Erinnerung, kein Staub.“*',
  ] satisfies Line[],

  teapot: [
    { text: '*Du gießt dir eine Tasse ein. Der Duft allein ist schon ein halber Feierabend.*', when: { character: 'sonne' } },
    { text: '„Tee? Na guat. Aber eigentlich wär jetzt Glühwein-Wetter.“', when: { character: 'isi' } },
    { text: '*Eine Kanne Tee, noch warm. Daneben ein Glas Selleriesaft. Sehr grün. Sehr gesund. Sehr Sonne.*', when: { character: 'ninni' } },
  ] satisfies Line[],

  // TODO Leonie: Sonnes Lieblingstasse beschreiben (Farbe, Spruch, Geschichte)
  mug: [
    '*Sonnes Lieblingstasse. Ein bisschen angeschlagen, sehr geliebt. Niemand sonst trinkt daraus. Niemand.*',
  ] satisfies Line[],

  armchair: [
    { text: '*Du sinkst in den Sessel. Tee. Buch. Feuer. Perfekt.*', when: { character: 'sonne' } },
    { text: '*Im Sessel ist eine Kuhle in exakt Sonnes Form. Du setzt dich lieber nicht.*', when: { character: 'isi' } },
    { text: '*Ninni betrachtet den Sessel. Gutes Design. Aber man setzt sich nicht in Sonnes Sessel. Oder doch? Nein. Nein!*', when: { character: 'ninni' } },
  ] satisfies Line[],

  dates: [
    '*Eine Schale Datteln. Daneben ein Zettel: „Gezählt. – S.“*',
    { text: '*Du nimmst eine Dattel. Und noch eine. Den Zettel korrigierst du später.*', when: { character: 'sonne' } },
  ] satisfies Line[],

  window: [
    '*Draußen fällt der Schnee auf die Felder. Drinnen ist es warm. Die allerbeste Art, Schnee anzuschauen.*',
  ] satisfies Line[],
};
