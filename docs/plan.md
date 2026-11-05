# Winter Village: plan (revision 2)

## Context
This is a cozy 2D top-down browser game, a Christmas gift for your mom and sister. It's set in a snowy 1920s Småland village with three red farmhouses (North, Middle and South farm). The player picks a character (Sonne, Isi or Ninni) and a companion (Teddy, Pauli or Kratzi), then explores freely and does optional activities. Each one opens an advent-calendar door and gets a funny reaction from the world. The player triggers Christmas Eve whenever they like, and the ending reflects what they did.

It runs on desktop (keyboard) and iPhone Safari (tap). It deploys to GitHub Pages. All content lives in data files, in German with Swedish touches.

**Decided:**
- Repo: public `leoninni/winter-village`, served at `https://leoninni.github.io/winter-village/`.
- Language: German with Swedish touches.
- Test phone: iPhone only.
- No timelines. Phases are an order of work, and we move on once a phase is playable, deployed and checked.

**Environment (checked):**
- macOS 26.5 on Apple Silicon, Homebrew installed, Tiled not installed yet. To install it: `brew install --cask tiled`
- git 2.51 and gh 2.87 (logged in as leoninni with the repo and workflow scopes), Node 22.

---

## 1. Architecture (unchanged unless noted)
- **Stack:** Phaser (latest stable, pinned) + TypeScript (strict) + Vite + Vitest, with Tiled `.tmj` maps that have tilesets embedded.
- **Rendering:** Phaser draws the world and mini-games. A thin HTML/CSS overlay (no framework) draws the menus, dialogue box, calendar and letter writer. The letter uses a real `<textarea>` so the iOS keyboard works.
- **Crisp pixels (new):** Phaser config uses `pixelArt: true` and `roundPixels: true`, and the camera zoom is always a whole number. The game uses `Scale.RESIZE`, and the zoom is the largest integer that shows about 12–14 tiles on the short side of the screen. Default sizes are 32 px tiles and 32×48 characters.
- **EventBus:** gameplay only emits events. `ReactionSystem`, `AdventCalendar`, `SaveSystem`, `WorldState` and the mailbox reply timer each listen independently.
- **GameState:** a single versioned, serializable object with migrations, stored under localStorage key `winter-village:save` (wrapped in try/catch). It also records total **play time**, used for the North Pole reply. "Neu anfangen" (start over) clears it after a confirmation.
- **Content as typed data** in `content/*.ts`. Conditions on lines look like `when: {character, companion, done, notDone, after:'ending'}`.
- **Sprite manifest** in `content/sprites.ts`: 4 rows (down, left, right, up), with idle plus 3 walk frames per row. Swapping art means replacing the PNG and adjusting the manifest.
- **Input:**
  - Keyboard: WASD or arrows to walk, Shift to run, Space or E to interact, C for the calendar, Esc for the menu.
  - Tap: tap to move (A* over the collision grid), tap far away to jog, tap an object or person to walk there and interact.
- **Companions** follow a breadcrumb trail of the player's recent positions, each with its own gags:
  - **Teddy:** sniffs out secrets, isn't slowed by deep snow, steals cookies (once baking exists).
  - **Pauli:** almost invisible in the snow, digs things up, gets stuck in drifts.
  - **Kratzi:** rides a sled. A zoom meter fills while running, and when it is full Kratzi's head pops off and the player puts it back. The threshold and cooldown live in `content/companions.ts`.
- **Activity interface (new: built so the ending extends itself).** Each activity module registers:
  - `id`
  - its calendar triggers
  - a world-changes hook
  - **`endingContribution(state)`**, which returns the props, positions and German caption lines it adds to the Christmas Eve scene, or nothing if it wasn't done

  The ending scene loops over every registered activity, so bonus activities (snowman, cookies, birds…) show up automatically without anyone rewriting the ending.
- **Config (new):** `content/settings.ts` holds all values a non-coder might want to change in one place:
  - the Formspree endpoint
  - the North Pole reply delay
  - Kratzi's meter values
  - Pauli's stuck cooldown
  - the sound default

## 2. Folder structure
```
winter-village/
├─ .github/workflows/deploy.yml     # npm ci → test → build → Pages
├─ index.html  vite.config.ts  tsconfig.json  package.json
├─ CLAUDE.md  README.md  .gitignore
├─ content/                         # all text & tunables (German)
│  ├─ README.md                     # editing guide + TODO-Leonie checklist (kept current)
│  ├─ settings.ts                   # formspree endpoint, timings, tunables
│  ├─ characters.ts companions.ts villagers.ts dialogue.ts reactions.ts
│  ├─ discoveries.ts activities.ts calendar.ts letter.ts ending.ts strings.ts sprites.ts
├─ public/assets/{sprites,tiles,maps,audio}/
├─ src/
│  ├─ main.ts config.ts
│  ├─ scenes/     Boot Preload Select World Interior ChristmasEve
│  ├─ entities/   Player Npc Interactable companions/{Companion,Teddy,Pauli,Kratzi}
│  ├─ systems/    EventBus GameState SaveSystem Input Pathfinding Dialogue
│  │              Reactions AdventCalendar Discoveries conditions activityRegistry
│  ├─ activities/ letter/ decorate/ (bonus: baking/ snowman/ sledding/ tomte/ …)
│  ├─ services/   formspree.ts      # the only network code
│  └─ ui/         overlay SelectView DialogueBox CalendarView LetterView MenuView styles.css
├─ tools/         gen-placeholders.ts gen-village-map.ts
└─ tests/         conditions gameState calendar kratziMeter pathfinding formspree content-integrity
```

## 3. Content rules (new)
- I'll draft **all filler content** in German with Swedish touches: villager small talk, generic reactions, most calendar surprises, discovery descriptions and UI text.
- Anything only you can write gets a placeholder and a comment `// TODO Leonie: <hint>`. This covers inside jokes, personal discoveries, the 3 ending messages, special Sonnenpalast lines and some calendar surprises. `content/README.md` keeps a checklist of every TODO with its file and line hint. A small test checks that every TODO in the content files appears in the checklist, so the checklist can't fall out of date.
- **Villagers:** 4–5 invented 1920s Swedish characters, each with a strong personality. Examples (working names, all original):
  - a gruff-but-soft old farmer at the North farm
  - a farm wife at the Middle farm who bakes non-stop
  - a gossiping postman on a kick-sled
  - a dreamy farmhand who talks to the horse
  - a cheeky kid from the South farm

  Plus animals: a cat, a horse, chickens and birds.
- **The ending message differs per character** (Sonne, Isi, Ninni). I'll write three warm placeholder versions, each marked TODO Leonie.

## 4. Advent calendar (revised)
- Doors only unlock through actions; there is no real-date locking. Each **trigger** fires once and opens the next door. The player taps the glowing door to open it with an animation and see its surprise.
- There is a fine-grained trigger catalog in `content/calendar.ts`. Triggers include:
  - first talk with each villager (5) and first pat of each animal (3)
  - entering each farmhouse (3) and the first Sonnenpalast visit (1)
  - each tree decorated, counted separately (4)
  - each discovery (about 16)
  - letter sent (1) and reply read (1)
  - each companion gag seen once (2–3 for the chosen companion)
  - bonus activities later (each counts as one or more triggers)
- The content-integrity test checks there are **at least 30 triggers reachable for each companion** (so gags of companions you didn't pick don't count), and that all 24 doors have a surprise.
- **At Christmas Eve, every closed door opens as a gift** during the ending, one after another.

## 5. Letter to Santa (revised: Formspree, no mailto)
- The endpoint `https://formspree.io/f/meaadprg` lives only in `content/settings.ts`. `src/services/formspree.ts` is the only code that uses it.
- `fetch` sends a POST with `Accept: application/json` and a JSON body containing:
  - `letter`, `character`, `companion` and `timestamp` (ISO)
  - `_subject: "Brief an den Weihnachtsmann von <Name>"`
  - `_gotcha: ""` (honeypot field; it is also a hidden input in the form)
- States, with German text in `content/letter.ts`:
  - **Writing:** the draft auto-saves.
  - **Sending:** a reindeer animation runs and the button is disabled.
  - **Success:** "Dein Brief ist unterwegs zum Nordpol!" (your letter is on its way to the North Pole). The save gets `letter.sentAt`, and the mailbox flag goes up.
  - **Error or offline:** "Die Rentiere haben sich verlaufen…" (the reindeer got lost…), with "Nochmal versuchen" (try again) and "Text kopieren" (copy text). The letter is never lost.
- **No double sending:** there is an in-flight guard, and once `sentAt` is set the desk shows "already sent" with the option to read the letter again.
- **Reply:** about 5 minutes of *play time* after sending (set in `settings.ts`), a character-specific reply from the North Pole appears in the mailbox. Reading it triggers a calendar door.
- Tests mock `fetch` to cover success, an error status, a network failure and the double-send guard.
- Two Formspree settings to check in its dashboard:
  - leave reCAPTCHA off, because AJAX submissions fail with it on
  - optionally restrict allowed domains to `leoninni.github.io`

## 6. Phases (an order of work only)
Each phase ends playable and deployed, with `npm test` and the build passing before every push. At the end of each phase I'll give you a short **desktop + iPhone checklist** and the **current TODO-Leonie list**.

**Phase 0: Repo, scaffold and deploy**
1. `git init -b main`, then `.gitignore`, `README.md` and `CLAUDE.md`.
2. Scaffold Vite + TS by hand. Install phaser, typescript, vite, vitest and tsx.
3. Boot scene: snowfall over "Winter Village – bald!", plus an HTML overlay test button. The Phaser config already has the pixel-art and integer-zoom settings.
4. `vite.config.ts`: `base` is `/winter-village/` when `GITHUB_ACTIONS` is set, otherwise `/`.
5. `deploy.yml`: checkout → setup-node 22 → `npm ci` → `npm test` → `npm run build` → upload-pages-artifact → deploy-pages.
6. Create the repo, enable Pages and deploy:
   - `gh repo create leoninni/winter-village --public --source . --push`
   - `gh api -X POST repos/leoninni/winter-village/pages -f build_type=workflow`
   - Watch the run with `gh run watch`.
7. ✅ The URL loads on desktop and iPhone.

**Phase 1: Walk around, with character and companion select**
- Generated placeholder art and the generated `village.tmj`: the 3 farmhouses, fields, forest, frozen lake, sled hill and mailbox, with collision.
- Select screens, movement (keyboard plus tap with A*), camera, running and deep snow.
- All three companions follow (Kratzi on a sled). The sprite manifest is in place.
- Saving and restoring, and "Neu anfangen" (start over).

**Phase 2: A living village**
- EventBus, dialogue box, the conditions evaluator and reactions.
- 4–5 villagers and the animals. About 16 discoveries.
- Companion gags: Teddy sniffs, Pauli digs and gets stuck, "Wo ist Pauli?", and Kratzi's head-pop.
- The Sonnenpalast interior with Sonne's unique sequence.
- **Pixel-art trial:** I'll ask for your reference images and draw simple pixel-art versions of all six characters and companions, to swap in for your decision.

**Phase 3: Advent calendar, the letter and decorating**
- The calendar UI and trigger catalog.
- The letter via Formspree, including the North Pole reply.
- Decorating the 4 trees: dragging ornaments by mouse or touch, saved, and drawn in the world.

**Phase 4: Christmas Eve ending (simple but complete) → the game is GIFTABLE**
- Ring the farm bell, or go to bed and confirm. A dusk transition leads into the evening gathering at the Middle farm.
- The scene is built from `endingContribution()` of every registered activity: decorated trees with their real ornaments, the letter and its reply, discoveries found, the companion's moment.
- All closed calendar doors open as a gift, then the per-character message plays, then gentle credits listing what they did.
- "Weiterspielen" (keep playing) continues with `endingSeen` set, which unlocks post-Christmas lines.

**Bonus phases (in this order, each one feeds into the ending automatically)**
- **B1 Pepparkakor baking:** a cute mini-game where nothing can fail. Cookies appear in the world, and Teddy steals them.
- **B2 Snowman:** roll the snowballs, stack them, dress it up. It stays in the world.
- **B3 Sledding:** a ride down the sled hill. **With Kratzi, a fast run always pops the head off**, as long as the cooldown has passed (the run itself fills the zoom meter). There's a funny chase at the bottom.
- **B4 Porridge for the tomte:** leave a bowl out, and the tomte's thank-you gift appears the next time the player comes back.
- **B5 Extras:** julkärve (oat sheaf) for the birds, skating on the lake, candles in the windows, a julbock (straw goat).
- **B6 Sound:** CC0 sleigh bells, crunching snow, crackling fire and Kratzi's "boing", with a mute toggle in the menu (and in `settings.ts`). Audio unlocks on the first tap for iOS.
- **B7 Final art swap and a polish pass.**

## 6b. Additions (approved)
1. **An empty ending still feels complete.** The ChristmasEve scene always has a base layer that doesn't depend on progress: candles, the gathered villagers, the companion's moment, snowfall, the opened calendar and the character's message. Each `endingContribution()` only *adds* to that base. The scene never says what was missed, and its lines never use "you didn't…" wording. A test runs the ending composer on an empty save and checks that the base scene and the message are present and that no line mentions missing things.
2. **After the ending, triggers give reactions instead of doors.** Once `endingSeen` is set (or all 24 doors are open), a trigger plays a small cute reaction from `reactions.ts` (`afterChristmas` pool) instead of opening a door. This is covered by a test.
3. **`npm run dev:phone`** runs `vite --host`. The README explains how to open it on your iPhone: same Wi-Fi, open the `Network:` URL in Safari, and allow the macOS firewall prompt if it appears. No deploy needed for quick checks.
4. **Saves are per device.** A friendly note on the start screen and in the menu, with its text in `content/strings.ts`, says the progress is saved in this browser on this device.

## 7. Draft CLAUDE.md
```markdown
# Winter Village – CLAUDE.md
Cozy 2D top-down browser game (Christmas gift). Phaser + TypeScript + Vite, Tiled maps,
GitHub Pages: https://leoninni.github.io/winter-village/  ·  Test devices: desktop + iPhone (Safari).

## Commands
`npm run dev` · `npm test` (Vitest: logic + content integrity) · `npm run build` (tsc + vite)
· `npm run gen:placeholders` · Tiled on macOS: `brew install --cask tiled`

## Golden rules
1. All player-facing text and tunables live in `content/` (German, Swedish touches). None in src/.
2. Personal content I can't write → placeholder + `// TODO Leonie: <hint>`, and add it to the
   checklist in `content/README.md` (a test enforces this).
3. Gameplay talks via the EventBus; activities never call calendar/save/reactions directly.
4. Every activity implements `Activity` incl. `endingContribution()` – never hardcode activities
   into the ChristmasEve scene.
5. No failure states, nothing required, no punishing timers.
6. Every feature works tap-only (iPhone Safari) and keyboard-only.
7. GameState shape change → bump `version` + migration + test. Never break saves.
8. Original names/text/art only; nothing from Astrid Lindgren's works.
9. Small commits; `npm test && npm run build` must pass before every push.
10. End of each phase: give Leonie a desktop + iPhone test checklist and the TODO-Leonie list.

## Gotchas
- Vite base is `/winter-village/` in CI → load assets with relative paths (`assets/...`).
- Phaser: `pixelArt: true`, `roundPixels: true`, integer camera zoom only.
- Tiled tilesets must be embedded in .tmj; objects reference content via `contentId`.
- Santa letter: DOM <textarea>; disable Phaser keyboard capture while focused.
- Formspree endpoint only in `content/settings.ts`; POST JSON with `Accept: application/json`,
  `_gotcha` honeypot, `_subject`. reCAPTCHA must be off in Formspree for AJAX. Guard double-send.
- localStorage wrapped in try/catch (iOS private mode). iOS: audio after first gesture,
  `100dvh`, `touch-action: none` on canvas.
- Sprites: 4 rows (down,left,right,up) × [idle, walk1-3]; mapping in `content/sprites.ts`.
```

## 8. Remaining open questions (none block Phase 0)
1. Reference images for the six characters and companions: send them before the end of Phase 2.
2. Spoilers: the repo is public, so the TODO-Leonie texts will be readable on GitHub once filled in. You could fill in the most personal ones in the last commit before giving the gift.

## Verification
- **Every push:** `npm test` and `npm run build` pass locally, and the GitHub Actions run is green.
- **Every phase:** check the live URL on desktop (keyboard) and iPhone Safari (tap only). Reload to confirm the save restores. Check that "Neu anfangen" (start over) resets everything.
- **Phase 3:** send a real test letter from the iPhone and confirm it reaches your inbox through Formspree. Then test the error path in airplane mode: the letter stays saved, and "Nochmal versuchen" (try again) and "Text kopieren" (copy text) both work.
- **Phase 4:** play a short session, trigger Christmas Eve, and check that the scene shows exactly what was done, the remaining doors open, the right character's message appears, and "Weiterspielen" (keep playing) works.
