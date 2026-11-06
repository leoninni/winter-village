/**
 * How the world reacts when something happens. For each event:
 *  - chance:  how likely anyone reacts at all (0–1)
 *  - speakers: who may react and what they might say. Villagers and animals only react
 *    if they are near enough to see it; 'companion' is always there.
 *    Speaker keys: 'companion', 'player' (you), villager ids (algot, hulda, valdemar, torvald, signe),
 *    animal ids (klover, chickens, bullfinches, smulan).
 * Lines starting with * are actions (italics). One line is picked per speaker,
 * at most two speakers react at once.
 */
import type { Line } from '../src/systems/conditions';

export interface ReactionDef {
  chance: number;
  speakers: Record<string, Line[]>;
}

export const reactions: Record<string, ReactionDef> = {
  'kratzi-head-pop': {
    chance: 0.85,
    speakers: {
      companion: ['*Kratzi sitzt sehr würdevoll da. Nur eben ohne Kopf.*', '*Kratzis Körper winkt dem Kopf hinterher.*'],
      algot: ['Hab ich schon schlimmer gesehen. 1902.', 'Hm. Kommt vor.'],
      hulda: ['Ach herrje! Ich hol Nadel und Faden!', 'Fang ihn, bevor er in den Teig rollt!'],
      valdemar: ['Das muss ich sofort allen erzählen!', 'Ich sag ja nichts, aber … DER KOPF!'],
      torvald: ['„Ein Kopf, der rollt durch Schnee …“ – oh, das wird ein Gedicht!'],
      signe: ['DARF ICH DEN BEHALTEN?', 'Nochmal! Nochmal!'],
      klover: ['*Klöver wiehert. Es klingt verdächtig nach Lachen.*'],
      chickens: ['*Die Hühner flattern empört auseinander.*', '*GACK!*'],
      bullfinches: ['*Die Gimpel flattern auf und landen kopfschüttelnd wieder.*'],
      smulan: ['*Smulan öffnet beide Augen. Das passiert sonst nie.*'],
    },
  },
  'kratzi-head-back': {
    chance: 1,
    speakers: {
      companion: [
        '*Kratzi räuspert sich würdevoll.* Danke. Das passiert mir sonst nie. … Seit Dienstag.',
        '*Klick.* Sitzt. Kratzi tut so, als wäre nichts gewesen.',
        '*Kratzi blinzelt mit seinen Knopfaugen.* Nicht so schnell, bitte. Ich bin 104.',
        { text: '*Kratzi seufzt.* Sonne, du hast nicht zufällig auch meine Brille gesehen?', when: { character: 'sonne' } },
        { text: '*Kratzi schaut Isi an.* „Passt scho“, sagt man bei dir, oder? Passt scho.', when: { character: 'isi' } },
        { text: '*Kratzi bemerkt, dass Ninni den Kopf dreimal zurechtrückt, bis er perfekt gerade sitzt. Er ist gerührt.*', when: { character: 'ninni' } },
      ],
    },
  },
  'pauli-stuck': {
    chance: 1,
    speakers: {
      companion: ['*Irgendwo im Schnee: ein empörtes, gedämpftes „Wuff!“*', '*Zwei schwarze Augen und eine Nase ragen aus der Schneewehe.*'],
      hulda: ['Da steckt was Weißes im Schnee! Ach – das ist Pauli.'],
      valdemar: ['Ich sag ja nichts, aber dein Hund steckt fest.'],
      signe: ['Pauli spielt Eisberg!'],
      algot: ['Der Hund. Im Schnee. Hm. Wie immer.'],
      torvald: ['Klein, weiß, verloren im Weiß … wie poetisch. Soll ich helfen?'],
    },
  },
  'where-is-pauli': {
    chance: 1,
    speakers: {
      player: [
        'Wo ist Pauli?',
        'Pauli? … PAULI?',
        'Hat jemand einen kleinen weißen Hund gesehen? Sehr weiß. Sehr klein.',
        { text: 'Pauli, wo bist du? … Ach, da. Direkt vor mir.', when: { character: 'ninni' } },
        { text: 'Heast, Pauli, wo steckst’n?', when: { character: 'isi' } },
      ],
    },
  },
  'pauli-rescued': {
    chance: 1,
    speakers: {
      companion: [
        '*Pauli schüttelt sich. Jetzt bist du voller Schnee. Er nicht mehr.*',
        '*Pauli hüpft dreimal im Kreis vor Dankbarkeit.*',
        { text: '*Pauli leckt Ninni einmal quer übers Gesicht. Beste Freunde.*', when: { character: 'ninni' } },
      ],
    },
  },
  'pauli-dig': {
    chance: 1,
    speakers: {
      companion: ['*Pauli buddelt wie verrückt. Der Schnee fliegt in alle Richtungen … er hat etwas gefunden!*', '*Pauli gräbt und gräbt – und schaut dann sehr stolz zu dir hoch.*'],
    },
  },
  'pauli-dig-nothing': {
    chance: 1,
    speakers: {
      companion: [
        '*Pauli buddelt begeistert ein Loch. Darin: ein Stock. Pauli ist sehr stolz.*',
        '*Pauli gräbt nach etwas. Er findet: mehr Schnee. Er ist trotzdem glücklich.*',
        { text: '*Pauli bringt Ninni einen Tannenzapfen. Ein Geschenk. Das Beste, was er hat.*', when: { character: 'ninni' } },
      ],
    },
  },
  'teddy-sniff': {
    chance: 1,
    speakers: {
      companion: ['*Teddy hält die Nase in den Schnee. Schnüffel, schnüffel … WUFF!*', '*Teddy wedelt so schnell, dass er fast abhebt. Da ist was!*'],
    },
  },
  'kratzi-notice': {
    chance: 1,
    speakers: {
      companion: ['*Kratzi legt den Kopf schief. Da drüben ist doch was?*', '*Kratzi deutet mit der Pfote. Würdevoll, aber bestimmt.*'],
    },
  },
  'discovery-found': {
    chance: 0.7,
    speakers: {
      companion: [
        { text: '*Teddy bellt begeistert und will es unbedingt apportieren.*', when: { companion: 'teddy' } },
        { text: '*Pauli tanzt um dich herum. Gute Arbeit, Team!*', when: { companion: 'pauli' } },
        { text: '*Kratzi nickt anerkennend.*', when: { companion: 'kratzi' } },
      ],
      signe: ['Glitzert das? Dann gehört es MIR!'],
      valdemar: ['Was hast du da? Erzähl! … Ich sag’s auch nicht weiter.'],
      hulda: ['Fein gemacht! Dafür gibt’s einen Keks.'],
      algot: ['Hm. Gut gefunden.'],
      torvald: ['Jedes Ding hat eine Geschichte. Deine hat jetzt eine mehr.'],
      klover: ['*Klöver schnaubt anerkennend.*'],
    },
  },
  'running-past': {
    chance: 0.25,
    speakers: {
      hulda: ['Nicht so schnell, sonst fliegt das Mehl!'],
      algot: ['Rennen. Bei dem Wetter. Hm.'],
      valdemar: ['Wohin so eilig? Neuigkeiten?'],
      torvald: ['Wie ein Reh im Schnee!'],
      signe: ['Ich krieg dich!'],
      chickens: ['*Die Hühner stieben gackernd auseinander.*'],
      bullfinches: ['*Die Gimpel flattern auf.*'],
    },
  },
  'enter:lillsjon': {
    chance: 0.5,
    speakers: {
      companion: [
        { text: '*Teddy testet das Eis mit einer Pfote. Dann mit allen vieren. Dann rutscht er auf dem Bauch.*', when: { companion: 'teddy' } },
        { text: '*Auf dem Eis sieht man Pauli endlich! Ein weißer Fleck auf Hellblau.*', when: { companion: 'pauli' } },
        { text: '*Kratzi mag das Eis nicht. Zu glatt für seine Würde.*', when: { companion: 'kratzi' } },
      ],
    },
  },
  'enter:granskogen': {
    chance: 0.5,
    speakers: {
      companion: [
        { text: '*Teddy schnüffelt an jedem einzelnen Baum. Es sind sehr viele Bäume.*', when: { companion: 'teddy' } },
        { text: '*Zwischen den dunklen Tannen sieht man Pauli wieder. Endlich!*', when: { companion: 'pauli' } },
        { text: '*Kratzi schaut in den Wald, als würde er sich an etwas erinnern.*', when: { companion: 'kratzi' } },
      ],
    },
  },
  'enter:kalkbacken': {
    chance: 0.5,
    speakers: {
      companion: [
        { text: '*Teddy will den Hügel hochrennen. Und runter. Und hoch. Und runter.*', when: { companion: 'teddy' } },
        { text: '*Pauli ist im Tiefschnee verschwunden. Nur ein Schwanz wedelt heraus.*', when: { companion: 'pauli' } },
        { text: '*Kratzi sieht den Hügel. Dann dich. Dann wieder den Hügel. Er ahnt etwas.*', when: { companion: 'kratzi' } },
      ],
    },
  },
  'enter:akrarna': {
    chance: 0.35,
    speakers: {
      companion: [
        { text: '*Teddy springt über die Steinmauer. Und zurück. Und wieder hin.*', when: { companion: 'teddy' } },
        { text: '*Ein weißer Hund auf einem weißen Feld. Viel Glück.*', when: { companion: 'pauli' } },
        { text: '*Kratzi betrachtet die Felder mit der Ruhe eines sehr alten Bären.*', when: { companion: 'kratzi' } },
      ],
    },
  },
  idle: {
    chance: 0.6,
    speakers: {
      companion: [
        { text: '*Teddy setzt sich hin und schaut dich erwartungsvoll an. Gehen wir weiter? Gibt es Kekse?*', when: { companion: 'teddy' } },
        { text: '*Teddy legt dir eine Schnauze voll Schnee vor die Füße. Ein Geschenk.*', when: { companion: 'teddy' } },
        { text: '*Pauli rollt sich im Schnee und ist sofort unsichtbar.*', when: { companion: 'pauli' } },
        { text: '*Pauli schaut Ninni an, als wäre sie der wichtigste Mensch der Welt. Ist sie auch.*', when: { companion: 'pauli', character: 'ninni' } },
        { text: '*Kratzi sitzt ganz still und lauscht dem Schnee.*', when: { companion: 'kratzi' } },
        { text: '*Kratzi gähnt. Vorsichtig. Wegen des Kopfes.*', when: { companion: 'kratzi' } },
      ],
    },
  },
};
