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
| `settings.ts` | Tuning knobs: walking speed, footprints, snowfall, evening light |
| `sprites.ts` | Which sprite sheet belongs to whom (for swapping in final art) |

_(More files arrive with each phase: villagers, dialogue, reactions, discoveries, calendar,
letter, ending.)_

## TODO Leonie – checklist
Every place where only you can add something personal is marked in the code with
`// TODO Leonie: <hint>`. A test keeps this list in sync with the code: when you've filled one in,
delete the `// TODO Leonie` comment **and** its line below (the test reminds you if you forget).

<!-- TODO-CHECKLIST:START -->
- [ ] `content/characters.ts` — Sonnes Kurzbeschreibung persönlicher machen (Eigenheiten, Lieblingsdinge)
- [ ] `content/characters.ts` — Isis Kurzbeschreibung (Eigenheiten, Lieblingsdinge, ein kleiner Insider)
- [ ] `content/characters.ts` — Ninnis Kurzbeschreibung (Eigenheiten, Lieblingsdinge, ein kleiner Insider)
<!-- TODO-CHECKLIST:END -->
