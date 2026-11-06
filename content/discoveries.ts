/**
 * Small hidden discoveries. Where they are is decided by the maps (layer "discoveries",
 * property contentId = id below); WHAT they are lives here.
 *
 *  look: 'visible' – you can see it lying there
 *        'glint'   – a little sparkle appears when you (or your companion) get close
 *        'buried'  – under the snow; your companion sniffs/digs it out, or it glints up close
 *  extra: added below the text, e.g. only for Sonne / Isi / Ninni or a companion
 *  icon:  picture on the discovery card (see the icon list in tools/gen-placeholders.ts)
 */
import type { Line } from '../src/systems/conditions';

export type DiscoveryIcon =
  | 'mitten'
  | 'angel'
  | 'fish'
  | 'nest'
  | 'sled'
  | 'horseshoe'
  | 'glasses'
  | 'jar'
  | 'door'
  | 'tracks'
  | 'postcard'
  | 'snowflake'
  | 'gift'
  | 'heart'
  | 'star'
  | 'letter';

export interface DiscoveryDef {
  id: string;
  title: string;
  text: string;
  extra?: Line[];
  icon: DiscoveryIcon;
  look: 'visible' | 'glint' | 'buried';
}

export const discoveries: DiscoveryDef[] = [
  {
    id: 'lost-mitten',
    title: 'Ein einsamer Fäustling',
    text: 'Jemand hat ihn ordentlich auf den Zaunpfahl gesteckt, damit sein Besitzer ihn wiederfindet. Er wartet geduldig. Seit Oktober.',
    extra: [
      { text: 'Ninni fragt sich, ob er einsam ist. Und ob Fäustlinge Gefühle haben. Und wie man das herausfinden könnte. … Sie streichelt ihn kurz. Sicher ist sicher.', when: { character: 'ninni' } },
      { text: '„Oida, der arme Hascherl.“', when: { character: 'isi' } },
      { text: 'Sonne nickt verständnisvoll. Sie weiß, wie es ist, wenn etwas verlegt wird.', when: { character: 'sonne' } },
    ],
    icon: 'mitten',
    look: 'visible',
  },
  {
    id: 'snow-angel',
    title: 'Ein Schneeengel',
    text: 'Ein perfekter Schneeengel im unberührten Schnee. Ganz frisch. Ringsherum: keine einzige Fußspur. Wie ist der bloß hierhergekommen?',
    extra: [
      { text: 'Ninni hat drei Theorien. Dann sieben. Dann beschließt sie, dass manche Dinge einfach schön sein dürfen.', when: { character: 'ninni' } },
      { text: 'Teddy legt sich daneben und macht einen Schneehund.', when: { companion: 'teddy' } },
    ],
    icon: 'angel',
    look: 'glint',
  },
  {
    id: 'frozen-pike',
    title: 'Ein eingefrorener Hecht',
    text: 'Unter dem Eis schaut ein Hecht nach oben. Er sieht aus, als hätte er etwas sehr Wichtiges vergessen. Vermutlich das Auftauen.',
    extra: [
      { text: 'Sonne sucht ihre Lesebrille, um ihn genauer anzusehen. Sie sitzt auf ihrem Kopf.', when: { character: 'sonne' } },
      { text: '„Na servas, Herr Fisch. Eh ois guat?“', when: { character: 'isi' } },
    ],
    icon: 'fish',
    look: 'visible',
  },
  {
    id: 'pinecone-nest',
    title: 'Ein Nest voller Tannenzapfen',
    text: 'In der Birke sitzt ein altes Vogelnest. Darin liegen drei Tannenzapfen, so ordentlich wie Eier. Irgendein Vogel hat da etwas sehr falsch verstanden. Oder sehr richtig.',
    extra: [{ text: 'Kratzi betrachtet die Zapfen. Er hätte sie genauso hingelegt.', when: { companion: 'kratzi' } }],
    icon: 'nest',
    look: 'glint',
  },
  {
    id: 'old-sled',
    title: 'Ein uralter Holzschlitten',
    text: 'Unter dem Schnee steckt ein Schlitten, viel älter als du. In die Kufe sind Buchstaben geritzt: „A. N. 1903“.',
    extra: [{ text: 'Kratzi betrachtet den Schlitten mit großem Respekt. Ein Kollege.', when: { companion: 'kratzi' } }],
    icon: 'sled',
    look: 'buried',
  },
  {
    id: 'horseshoe',
    title: 'Ein Hufeisen',
    text: 'Ein altes Hufeisen. Du hältst es mit der Öffnung nach oben – damit das Glück nicht herausfällt.',
    extra: [{ text: '„Bringt’s Glück? Dann nehm i’s gern.“', when: { character: 'isi' } }],
    icon: 'horseshoe',
    look: 'buried',
  },
  {
    id: 'reading-glasses',
    title: 'Sonnes Lesebrille',
    text: 'Zwischen den Sesselkissen steckt eine Lesebrille. Sie gehört eindeutig Sonne. Wahrscheinlich ist es die siebte, die hier schon gefunden wurde.',
    extra: [
      { text: 'Sonne strahlt: „Da ist sie ja!“ … Dann tastet sie nach ihrem Kopf. Dort sitzt die andere. Jetzt hat sie zwei.', when: { character: 'sonne' } },
      { text: '„Geh bitte, die Sonne und ihre Brillen.“', when: { character: 'isi' } },
      { text: 'Ninni legt die Brille gut sichtbar auf den Tisch. Genau in die Mitte. Dann rückt sie sie noch zweimal zurecht.', when: { character: 'ninni' } },
    ],
    icon: 'glasses',
    look: 'glint',
  },
  {
    id: 'cloudberry-jam',
    title: 'Moltebeermarmelade',
    text: 'Jemand hat ein Glas Moltebeermarmelade im Schnee kalt gestellt – und vergessen. Auf dem Etikett steht in Kinderschrift: „NICHT ESSEN. Signe.“',
    extra: [{ text: 'Teddy leckt sich vorsorglich schon mal die Lippen.', when: { companion: 'teddy' } }],
    icon: 'jar',
    look: 'buried',
  },
  {
    id: 'tomte-door',
    title: 'Eine winzige Tür',
    text: 'Unten an einer alten Tanne ist eine Tür, kaum größer als deine Hand. Davor liegt ein Krümel Haferbrei. Hier wohnt jemand. Jemand sehr Kleines.',
    extra: [
      { text: 'Ninni bewundert die Türklinke. Handgeschnitzt, perfekte Proportionen. Sie hat Fragen. Sehr viele Fragen.', when: { character: 'ninni' } },
      { text: 'Pauli schnüffelt am Türspalt. Von drinnen niest jemand.', when: { companion: 'pauli' } },
    ],
    icon: 'door',
    look: 'glint',
  },
  {
    id: 'moose-tracks',
    title: 'Elchspuren',
    text: 'Riesige Spuren führen aus dem Wald direkt auf den Zaun zu. Dort laufen sie eine Weile im Kreis. Dann gehen sie zurück. Der Elch hat sich das wohl anders vorgestellt.',
    extra: [{ text: 'Teddy folgt den Spuren drei Meter weit. Dann beschließt er, dass Elche überbewertet sind.', when: { companion: 'teddy' } }],
    icon: 'tracks',
    look: 'glint',
  },
  {
    id: 'vienna-postcard',
    title: 'Eine Postkarte aus Wien',
    text: 'Halb im Schnee liegt eine Postkarte mit dem Stephansdom. „An den freundlichsten Hof in Småland. Grüße aus Wien!“ Abgestempelt 1919. Die Post braucht hier manchmal etwas länger.',
    extra: [{ text: 'Isi hält die Karte ganz fest. „Na geh, a Grußerl aus Wien! Des is ja leiwand!“', when: { character: 'isi' } }],
    icon: 'postcard',
    look: 'glint',
  },
  {
    id: 'perfect-snowflake',
    title: 'Die perfekte Schneeflocke',
    text: 'Auf dem Brunnenrand liegt eine einzelne Schneeflocke. Sechs Arme, jeder exakt gleich lang. Die Natur hat heute sehr ordentlich gearbeitet.',
    extra: [
      { text: 'Ninni hält den Atem an. Endlich etwas, über das man nicht nachdenken muss – es ist einfach perfekt. … Ist der linke Arm minimal länger? Nein. Doch? Nein.', when: { character: 'ninni' } },
    ],
    icon: 'snowflake',
    look: 'glint',
  },

  // ---------- personal slots: replace title + text with something only you three know ----------
  {
    id: 'personal-1',
    // TODO Leonie: persönliche Entdeckung 1 – ein Familien-Insider (Gegenstand + kurze Geschichte)
    title: 'Etwas sehr Vertrautes',
    text: 'Halb unter dem Schnee liegt etwas, das dir merkwürdig bekannt vorkommt. Als hätte es jemand nur für dich hier versteckt.',
    icon: 'gift',
    look: 'glint',
  },
  {
    id: 'personal-2',
    // TODO Leonie: persönliche Entdeckung 2 – eine gemeinsame Erinnerung (Urlaub, frühere Weihnachten …)
    title: 'Eine alte Erinnerung',
    text: 'Ein kleines Ding mit einer großen Geschichte. Du musst lächeln, ohne genau zu wissen, warum.',
    icon: 'heart',
    look: 'buried',
  },
  {
    id: 'personal-3',
    // TODO Leonie: persönliche Entdeckung 3 – etwas Lustiges, das nur ihr drei versteht
    title: 'Ein Rätsel im Schnee',
    text: 'Das hier ergibt eigentlich keinen Sinn. Und trotzdem musst du lachen.',
    icon: 'star',
    look: 'glint',
  },
  {
    id: 'personal-4',
    // TODO Leonie: persönliche Entdeckung 4 – ein Lieblingsding von Sonne, Isi oder Ninni
    title: 'Ein Brief ohne Absender',
    text: 'Ein Umschlag, auf dem nur steht: „Für dich.“ Was drin ist, verrät er noch nicht.',
    icon: 'letter',
    look: 'buried',
  },
];
