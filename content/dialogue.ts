/**
 * Things you can look at, and doors. The maps place them (layers "things" / "doors",
 * property contentId); the texts live here. Each interaction shows ONE picked line
 * (or, for `sequence`, all matching lines in order).
 */
import type { Line } from '../src/systems/conditions';

export interface ThingDef {
  /** small title in the dialogue box */
  name: string;
  lines: Line[];
}

export const things: Record<string, ThingDef> = {
  mailbox: {
    name: 'Briefkasten',
    lines: [
      'Der Briefkasten an der Dorfstraße. Die Klappe klemmt ein bisschen. Valdemar sagt, sie mag keine Rechnungen.',
      '*Du klopfst an den Briefkasten. Er klingt leer. Und ein bisschen erwartungsvoll.*',
      { text: '„Heast, a Postkastl! Wia z’Haus.“', when: { character: 'isi' } },
    ],
  },
  well: {
    name: 'Brunnen',
    lines: [
      'Du rufst „Hallo!“ in den Brunnen. Das Echo antwortet „…llo“. Etwas maulfaul.',
      'Ganz unten im Brunnen glitzert Eis wie ein kleiner Mond.',
    ],
  },
  woodpile: {
    name: 'Holzstapel',
    lines: [
      'Perfekt gestapeltes Holz. Algot hat jeden Scheit einzeln begrüßt.',
      { text: 'Ninni betrachtet den Stapel. Endlich mal jemand, der Ordnung versteht.', when: { character: 'ninni' } },
    ],
  },
  barn: {
    name: 'Stall',
    lines: [
      'Aus dem Stall riecht es warm nach Heu. Drinnen schnarcht etwas Großes. Hoffentlich eine Kuh.',
      '*Durch die Ritzen fällt warmes Licht. Jemand summt da drin ein Lied.*',
    ],
  },
  // --- inside the Sonnenpalast (texts in sonnenpalast.ts are used for the special things)
};

export interface DoorDef {
  name: string;
  /** If set, the door leads somewhere (a map key from src/world/maps.ts + spawn name). */
  leadsTo?: { map: string; spawn: string };
  /** Shown when the door doesn't open (yet). */
  closedLines?: Line[];
}

export const doors: Record<string, DoorDef> = {
  'door-norrhagen': {
    name: 'Norrhagen',
    leadsTo: { map: 'sonnenpalast', spawn: 'entrance' },
  },
  'door-mitthagen': {
    name: 'Mitthagen',
    closedLines: [
      '*Die Tür ist zu. Drinnen duftet es nach Kardamom.* Ein Zettel hängt dran: „Bin im Hof. Nicht naschen! – Hulda“',
      '*Durch das Schlüsselloch siehst du Bleche. Viele Bleche. Sehr viele Bleche.*',
    ],
  },
  'door-soderhagen': {
    name: 'Söderhagen',
    closedLines: [
      'An der Tür hängt ein Schild in krakeliger Kinderschrift: „Betreten nur mit Passwort.“ Darunter, kleiner: „Das Passwort ist: bitte.“',
      '*Du sagst „bitte“. Von irgendwo ruft Signe: „FALSCH! Ach nee, doch richtig. Aber trotzdem zu!“*',
    ],
  },
  'exit-sonnenpalast': {
    name: 'Hinaus',
    leadsTo: { map: 'village', spawn: 'norrhagen-door' },
  },
};
