# Snöbyn (winter-village) – CLAUDE.md

Cozy 2D top-down browser game (a cozy Christmas game). Phaser 4 +
TypeScript + Vite, Tiled maps, deployed to GitHub Pages:
https://leoninni.github.io/winter-village/ · Test devices: desktop + **iPhone (Safari)**.
Approved plan: `docs/plan.md` (phases 0–4 = complete game,
then bonus phases B1–B7).

## Commands
- `npm run dev` – local dev server · `npm run dev:phone` – same, reachable on the LAN (iPhone)
- `npm test` – Vitest (logic + content integrity)
- `npm run build` – `tsc --noEmit` + Vite build
- `npm run gen:placeholders` – regenerate placeholder PNGs (from Phase 1)
- Tiled on macOS: `brew install --cask tiled`

## Golden rules
1. All player-facing text and tunables live in `content/` (German, Swedish touches). None in `src/`.
2. Personal content only Leonie can write → warm placeholder + `// TODO Leonie: <hint>`, and add
   the line "`content/<file>` — <hint>" to the checklist in `content/README.md`
   (`tests/content-todos.test.ts` enforces this both ways).
3. Gameplay talks via the EventBus (`src/systems/EventBus.ts`); activities never call
   calendar/save/reactions directly.
4. Every activity implements `Activity` incl. `endingContribution()` – never hardcode activities
   into the ChristmasEve scene. The ending has a progress-independent base layer and must feel
   warm and complete on an empty save; never phrase anything as "missed"/"you didn't".
5. Advent calendar: triggers open doors only until the ending / all 24 are open; after that a
   trigger plays a small reaction (`afterChristmas` pool) instead.
6. No failure states, nothing required, no punishing timers.
7. Every feature works tap-only (iPhone Safari) and keyboard-only.
8. GameState shape change → bump `version` + migration + test. Never break saves.
9. Original names/text/art only; nothing from Astrid Lindgren's works.
10. Small commits; `npm test && npm run build` must pass before every push.
11. End of each phase: give Leonie a short desktop + iPhone test checklist and the current
    TODO-Leonie list.
12. No Co-Authored-By, Claude-Session or 'Generated with Claude Code' lines in commits or PRs.
    (Enforced via `attribution` in `.claude/settings.json`.)

## Gotchas
- Vite `base` is `/winter-village/` when `GITHUB_ACTIONS` is set → load assets with relative
  paths (`assets/...`), never a leading `/`.
- Phaser: `pixelArt: true`, `roundPixels: true`, **integer camera zoom only**
  (`src/systems/zoom.ts`). Phaser 4 is imported as `import Phaser from 'phaser'`.
- Pure logic (no Phaser import) lives in `src/systems/*` so Vitest can run it in Node.
- Tiled tilesets must be embedded in `.tmj`; objects reference content via a `contentId` property.
- Santa letter: real DOM `<textarea>`; disable Phaser keyboard capture while it's focused.
- Formspree endpoint only in `content/settings.ts`, used only by `src/services/formspree.ts`.
  POST JSON with `Accept: application/json`, `_gotcha` honeypot, `_subject`. reCAPTCHA must be
  off in the Formspree dashboard for AJAX. Guard against double-send; never lose the letter.
- localStorage access wrapped in try/catch (iOS private mode). Saves are per browser/device.
- iOS: audio only after first user gesture; `100dvh`; `touch-action: none` on the canvas;
  buttons ≥ 44px tall with `touch-action: manipulation`.
- Sprites: 4 rows (down, left, right, up) × [idle, walk1-3]; mapping in `content/sprites.ts`.
- Headless Chrome has a ~500px minimum window width – to screenshot a phone layout, load the
  game inside a 390×844 iframe.

## Architecture map
`src/scenes/` Phaser scenes · `src/entities/` Player, Npc, companions · `src/systems/` EventBus,
GameState, SaveSystem, Dialogue, Reactions, AdventCalendar, conditions, Pathfinding, zoom ·
`src/activities/` one folder per activity · `src/services/` network (Formspree) ·
`src/ui/` HTML overlay views + styles · `content/` all text & tunables · `tools/` generators ·
`tests/` Vitest
