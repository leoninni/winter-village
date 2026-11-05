/**
 * UI texts (buttons, menus, notes). Only change the text inside the quotes.
 * German with a Swedish sprinkle.
 */
export const strings = {
  gameTitle: 'Snöbyn',
  gameSubtitle: 'Ein kleines Dorf in Småland, kurz vor Weihnachten',

  // start screen
  newGame: 'Los geht’s!',
  continueGame: 'Weiterspielen',
  welcomeBack: 'Välkommen tillbaka – willkommen zurück!',
  /** {character} and {companion} are replaced with the names */
  continueAs: 'als {character} mit {companion}',
  startOver: 'Neu anfangen',

  // character & companion select
  chooseCharacter: 'Wer bist du?',
  chooseCompanion: 'Wer kommt mit?',
  back: 'Zurück',
  next: 'Weiter',
  enterVillage: 'Ab ins Dorf!',

  // in the village
  menuButton: 'Menü',
  menuTitle: 'Kurze Pause',
  resume: 'Weiterspielen',
  confirmStartOverTitle: 'Wirklich neu anfangen?',
  confirmStartOverText:
    'Figur, Begleiter und alles, was im Dorf passiert ist, werden zurückgesetzt. ' +
    'Das lässt sich nicht rückgängig machen.',
  confirmYes: 'Ja, neu anfangen',
  confirmNo: 'Lieber nicht',

  controlsTouch: 'Tippe irgendwo hin, um dorthin zu laufen. Weit weg tippen = rennen. Finger gedrückt halten und ziehen = lenken.',
  controlsKeyboard: 'Laufen: Pfeiltasten oder WASD · Rennen: Shift · Menü: Esc · oder einfach hinklicken',

  /** Shown on the start screen and in the menu (saves are per browser & device) */
  saveNote:
    'Dein Spielstand wird automatisch in diesem Browser auf diesem Gerät gespeichert. ' +
    'Auf einem anderen Handy oder Computer beginnt das Dorf von vorn.',
  noStorageNote:
    'Hinweis: Dieser Browser kann gerade nichts speichern (privater Modus?). ' +
    'Spielen geht trotzdem – nur merkt sich das Dorf nichts.',
} as const;
