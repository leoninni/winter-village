/**
 * The people of Snöbyn. Each villager has:
 *  - intro: what happens the first time you talk to them (shown in order)
 *  - smallTalk: one line is picked each time you talk to them afterwards
 * A line can be just 'text', or { text, when } to show it only in some situations
 * (e.g. when: { character: 'isi' } or when: { companion: 'pauli' }).
 * Lines starting with * are actions (shown in italics).
 * Their reactions to things happening nearby live in reactions.ts.
 */
import type { Line } from '../src/systems/conditions';
import type { SpriteKey } from './sprites';

export interface VillagerDef {
  id: string;
  name: string;
  /** shown under the name in the dialogue box */
  role: string;
  sprite: SpriteKey;
  intro: Line[];
  smallTalk: Line[];
}

export const villagers: VillagerDef[] = [
  {
    id: 'algot',
    name: 'Algot',
    role: 'Bauer auf Norrhagen',
    sprite: 'algot',
    intro: [
      '*Ein alter Mann mit weißem Bart schaut von seinem Schnitzmesser auf.*',
      'Hm. Noch jemand, der bei dem Wetter draußen herumläuft.',
      'Algot. Norrhagen. Seit dreiundsechzig Wintern.',
      '*Er schnitzt weiter. Ganz kurz sieht es aus, als würde er lächeln.*',
    ],
    smallTalk: [
      'Früher lag der Schnee höher. Und die Winter waren länger. Und ich jünger.',
      '*schnitzt an einem kleinen Holzpferd* Ist für niemand Bestimmtes. Nur so.',
      'Im Sonnenpalast brennt schon wieder das Feuer. Da sitzt bestimmt jemand mit einem Buch.',
      'Wenn der Wind von Lillsjön kommt, gibt es morgen noch mehr Schnee. Hm. Gut so.',
      { text: 'Sonne. Deine Brille. Sie sitzt auf deinem Kopf. Wie immer. Hm.', when: { character: 'sonne' } },
      { text: 'Du redest so … musikalisch. Wien, ja? Hm. Klingt warm.', when: { character: 'isi' } },
      { text: 'Du schaust dir mein Holzpferd an, als würdest du lange drüber nachdenken. Lass. Es ist ein Pferd.', when: { character: 'ninni' } },
      { text: 'Dein Hund hat meinen Handschuh geklaut. Sag ihm, er darf ihn behalten.', when: { companion: 'teddy' } },
      { text: 'Hast du einen Hund dabei? Ich seh nur Schnee mit Augen.', when: { companion: 'pauli' } },
      { text: 'Ein Bär auf dem Schlitten. So einen hatte ich auch mal. Der war aber nicht so … würdevoll.', when: { companion: 'kratzi' } },
      { text: 'Den alten Schlitten hast du gefunden? A. N. – das bin ich. 1903. Erzähl’s keinem.', when: { found: ['old-sled'] } },
    ],
  },
  {
    id: 'hulda',
    name: 'Hulda',
    role: 'Bäckerin auf Mitthagen',
    sprite: 'hulda',
    intro: [
      '*Eine Frau mit Mehl bis zu den Ellbogen winkt dir fröhlich zu.*',
      'Hej hej! Ich bin Hulda. Du kommst genau richtig – oder genau falsch, je nachdem, ob du Teig magst.',
      'Ich backe seit Montag. Heute ist … welcher Tag ist heute?',
    ],
    smallTalk: [
      'Kardamom! Man kann nie genug Kardamom haben. Außer Algot. Der sagt, er niest davon.',
      '*klopft sich Mehl von der Schürze. Es wird nicht weniger.*',
      'Bald backen wir Pfefferkuchen. Ich zähle schon die Herzen.',
      'Ich wollte nur ein Blech backen. Es wurden sieben. Das passiert mir jedes Jahr.',
      'Wer friert, bekommt eine Zimtschnecke. Wer nicht friert, auch.',
      { text: 'Sonne! Ich hab dir Dattelkekse gemacht. Ohne Datteln – die hast ja du alle.', when: { character: 'sonne' } },
      { text: 'Glühwein? Bei uns heißt das Glögg. Aber ich mach dir gern einen mit Wiener Akzent.', when: { character: 'isi' } },
      { text: 'Ninni, sind meine Zimtschnecken symmetrisch genug? Du schaust immer so prüfend.', when: { character: 'ninni' } },
      { text: 'Teddy, nein. NEIN. … Na gut. Ein Krümel.', when: { companion: 'teddy' } },
      { text: 'Ist das Pauli? Oder ein sehr lebendiger Schneeball?', when: { companion: 'pauli' } },
      { text: 'Soll ich Kratzi ein Mützchen stricken? Damit der Kopf besser hält?', when: { companion: 'kratzi' } },
      { text: 'Du hast Signes Moltebeermarmelade gefunden? Pssst. Davon weiß ich nichts.', when: { found: ['cloudberry-jam'] } },
    ],
  },
  {
    id: 'valdemar',
    name: 'Valdemar',
    role: 'Briefträger (und Neuigkeitenträger)',
    sprite: 'valdemar',
    intro: [
      '*Ein Mann in blauer Uniform bremst mit seinem Tretschlitten direkt vor deinen Füßen.*',
      'Valdemar! Post und Neuigkeiten. Meistens mehr Neuigkeiten.',
      'Ich sag ja nichts, aber … nein. Ich sag nichts. Noch nicht.',
    ],
    smallTalk: [
      'Ich sag ja nichts, aber Hulda hat gestern elf Bleche Kekse gebacken. Elf!',
      'Der Briefkasten an der Straße klemmt. Er mag keine Rechnungen.',
      'Weißt du, was Algot schnitzt? Ich weiß es. Ich sag’s aber nicht. … Ein Pferd. Hab ich nichts gesagt.',
      'Im Wald soll ein Wichtel wohnen. Ich hab ihn noch nie gesehen. Er mich aber bestimmt.',
      'Torvald liest dem Pferd Gedichte vor. Das Pferd findet sie gut. Ich sag ja nichts.',
      { text: 'Für den Sonnenpalast hab ich wieder ein Paket. Rechteckig. Schwer. Ich tippe auf … Bücher.', when: { character: 'sonne' } },
      { text: 'Post aus Wien kommt hier selten an. Und wenn, dann riecht sie nach Kaffee.', when: { character: 'isi' } },
      { text: 'Ninni, du hast wieder diesen Blick. Als würdest du über drei Sachen gleichzeitig nachdenken.', when: { character: 'ninni' } },
      { text: 'Ich hätte deinen Hund fast überfahren! Er ist schneefarben!', when: { companion: 'pauli' } },
      { text: 'Ist der Bär auf dem Schlitten eigentlich versichert?', when: { companion: 'kratzi' } },
      { text: 'Die Postkarte aus Wien? Die lag seit 1919 in meinem Sack. Ich hab sie … verlegt.', when: { found: ['vienna-postcard'] } },
    ],
  },
  {
    id: 'torvald',
    name: 'Torvald',
    role: 'Knecht auf Mitthagen – und Dichter',
    sprite: 'torvald',
    intro: [
      '*Ein junger Mann lehnt am Zaun und flüstert dem Pferd etwas ins Ohr.*',
      'Oh! Entschuldigung. Ich hab Klöver gerade ein Gedicht vorgelesen.',
      'Torvald. Knecht auf Mitthagen. Und Dichter, wenn keiner zuhört.',
    ],
    smallTalk: [
      '„Schnee fällt leise / auf das Dach der Scheune. / Klöver kaut Heu.“ … Zu kurz?',
      'Klöver mag Möhren, Mondschein und traurige Lieder.',
      'Manchmal glaube ich, die Sterne über Lillsjön blinzeln uns zu.',
      'Ich übe ein Liebesgedicht. Für wen, verrate ich nicht. Es reimt sich auf … nein.',
      { text: 'Du siehst die Welt in schönen Ecken und Linien, oder? Darf ich das in ein Gedicht schreiben?', when: { character: 'ninni' } },
      { text: 'Wie sagt man in Wien zu Schnee? Auch Schnee? Oh. Schade.', when: { character: 'isi' } },
      { text: 'Sonne, hast du ein Buch mit Pferdegedichten? Für Klöver. Sie ist anspruchsvoll.', when: { character: 'sonne' } },
      { text: 'Teddy und Klöver sind Freunde. Er bringt ihr Stöckchen. Sie isst sie.', when: { companion: 'teddy' } },
      { text: 'Kratzi hat so ein ehrwürdiges Gesicht. Wie ein Bär, der schon alles gelesen hat.', when: { companion: 'kratzi' } },
      { text: 'Das Hufeisen! Mit der Öffnung nach oben, ja? Damit das Glück nicht herausfällt.', when: { found: ['horseshoe'] } },
    ],
  },
  {
    id: 'signe',
    name: 'Signe',
    role: 'Acht Jahre, Söderhagen, gefährlich',
    sprite: 'signe',
    intro: [
      '*Ein Schneeball fliegt knapp an deinem Ohr vorbei.*',
      'Daneben! Absichtlich! Ich bin Signe, ich bin acht, und das hier ist mein Revier.',
      'Wenn du was Glitzerndes findest, gehört es mir. Ist ein Gesetz. Glaub ich.',
    ],
    smallTalk: [
      'Im Wald gibt es eine winzige Tür. Für Wichtel. Oder für sehr dünne Leute.',
      'Die Hühner sind meine Armee. Sie wissen es nur noch nicht.',
      'Wenn du schnell rennst, kann ich dich nicht treffen. Also renn bitte langsam.',
      'Mein Schneemann hatte einen Kopf. Jetzt nicht mehr. Ermittlungen laufen.',
      { text: 'Du redest wie aus dem Radio! Sag nochmal „leiwand“!', when: { character: 'isi' } },
      { text: 'Warum guckst du so nachdenklich? Wegen dem Schneeball? Der war für dich. Mit Liebe.', when: { character: 'ninni' } },
      { text: 'Sonne, liest du mir was vor? Aber nur Spannendes. Mit Drachen. Oder Hühnern.', when: { character: 'sonne' } },
      { text: 'Teddy! Hol den Schneeball! … Er hat ihn gegessen.', when: { companion: 'teddy' } },
      { text: 'Ich spiele Verstecken mit Pauli. Er gewinnt. Immer. Er muss sich nicht mal verstecken.', when: { companion: 'pauli' } },
      { text: 'Darf ich Kratzis Kopf mal halten? Nur kurz. Ich geb ihn auch wieder. Vielleicht.', when: { companion: 'kratzi' } },
      { text: 'DU hast meine Marmelade gefunden?! … Na gut. Du darfst probieren. Einen Löffel. Einen kleinen.', when: { found: ['cloudberry-jam'] } },
    ],
  },
];
