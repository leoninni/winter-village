# Content – personalize the game here

Everything the game *says* lives in this folder: UI texts, dialogue, discoveries, calendar
surprises, reactions, the ending messages, and a few tunable numbers. Game logic lives in
`src/` and never contains player-facing text.

## How to edit
- Each file is a plain TypeScript data file. **Only change text inside quotes** `'like this'`.
- Keep the commas and brackets as they are. If you break something, `npm test` / `npm run build`
  tells you the file and line – the game won't deploy broken.
- Apostrophes inside text: use the typographic one `’` (e.g. `geht’s`), then you never have
  to escape anything.
- Check your change locally with `npm run dev` (or on your iPhone with `npm run dev:phone`,
  see the main README).

## Files
| File | What's in it |
|------|--------------|
| `strings.ts` | Titles, buttons, menu texts, the "saved on this device" note |
| `characters.ts` | Sonne, Isi, Ninni – names and the short text on the selection card |
| `companions.ts` | Teddy, Pauli, Kratzi – texts plus how closely they follow |
| `places.ts` | Names of the farms and places that pop up when you walk in |
| `villagers.ts` | Algot, Hulda, Valdemar, Torvald, Signe – first meeting + small talk |
| `animals.ts` | Klöver the horse, the chickens, the bullfinches, Smulan the cat |
| `discoveries.ts` | The 16 hidden discoveries (4 slots are yours to fill) |
| `sonnenpalast.ts` | Sonne's room: arrival scenes, fireplace, books, tea, armchair … |
| `dialogue.ts` | Things to look at (mailbox, well …) and doors |
| `reactions.ts` | How everyone reacts when something happens (Kratzi's head, Pauli stuck …) |
| `settings.ts` | Tuning knobs: walking speed, footprints, snowfall, evening light |
| `sprites.ts` | Which sprite sheet belongs to whom (for swapping in final art) |

_(More files arrive with each phase: calendar, letter, ending.)_

### Line tricks
- `'*Smulan schnurrt.*'` – stars around the whole line = an action (shown in italics)
- `'Sonne: Endlich.'` – a name and a colon at the start = that person speaks
- `{ text: '…', when: { character: 'isi' } }` – only for Isi. Also: `companion: 'pauli'`,
  `found: ['old-sled']` (after that discovery), `visited: ['sonnenpalast']`
- `{name}` and `{companion}` are replaced with the chosen character / companion

## TODO Leonie – checklist
Every place where only you can add something personal is marked in the code with
`// TODO Leonie: <hint>`. A test keeps this list in sync with the code: when you've filled one in,
delete the `// TODO Leonie` comment **and** its line below (the test reminds you if you forget).

<!-- TODO-CHECKLIST:START -->
- [ ] `content/discoveries.ts` — persönliche Entdeckung 1 – ein Familien-Insider (Gegenstand + kurze Geschichte)
- [ ] `content/discoveries.ts` — persönliche Entdeckung 2 – eine gemeinsame Erinnerung (Urlaub, frühere Weihnachten …)
- [ ] `content/discoveries.ts` — persönliche Entdeckung 3 – etwas Lustiges, das nur ihr drei versteht
- [ ] `content/discoveries.ts` — persönliche Entdeckung 4 – ein Lieblingsding von Sonne, Isi oder Ninni
- [ ] `content/sonnenpalast.ts` — persönliche Zeile für Sonnes erste Ankunft im Sonnenpalast
- [ ] `content/sonnenpalast.ts` — echte Lieblingsbücher von Sonne (Titel, gern mit kleinem Kommentar)
- [ ] `content/sonnenpalast.ts` — Gegenstände im Erinnerungsregal (Fotos, Andenken, kleine Insider)
- [ ] `content/sonnenpalast.ts` — Sonnes Lieblingstasse beschreiben (Farbe, Spruch, Geschichte)
<!-- TODO-CHECKLIST:END -->
