# Winter Village ❄️

A small, cozy 2D top-down browser game: a snowy Swedish village in the 1920s, three red
farmhouses, a forest and a frozen lake – in the days before Christmas.
Made as a Christmas gift.

**Play:** https://leoninni.github.io/winter-village/ (desktop with keyboard, iPhone with tap)

> Progress is saved in the browser on the device you play on. A different phone or computer
> starts a fresh village.

## Tech
[Phaser](https://phaser.io/) + TypeScript + Vite, maps made in [Tiled](https://www.mapeditor.org/),
tests with Vitest. Every push to `main` is tested, built and deployed to GitHub Pages by
GitHub Actions (`.github/workflows/deploy.yml`).

## Commands
| Command | What it does |
|---------|--------------|
| `npm install` | Install dependencies (once, after cloning) |
| `npm run dev` | Local dev server at http://localhost:5173 |
| `npm run dev:phone` | Dev server reachable from your iPhone (see below) |
| `npm test` | Run all tests (logic + content checks) |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Serve the production build locally |

### Testing on your iPhone without deploying
1. Make sure the Mac and the iPhone are on the **same Wi-Fi**.
2. Run `npm run dev:phone`. Vite prints two addresses, e.g.
   ```
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.178.23:5173/
   ```
3. On the iPhone, open **Safari** and type the **Network** address (with `http://`, including
   the `:5173`).
4. If macOS asks *"Do you want the application node to accept incoming network connections?"* →
   **Allow**.
5. Every time you save a file, the page on the phone reloads by itself.

Doesn't load? Check that both devices really are on the same network (guest/hotel/office Wi-Fi
often blocks device-to-device traffic) and that the macOS firewall
(System Settings → Network → Firewall) isn't blocking `node`.

## Personalizing
All texts and personal details live in [`content/`](content/) – see
[`content/README.md`](content/README.md) for how to edit them and the **TODO Leonie**
checklist of places only you can fill in.

## Maps (Tiled)
Install the free Tiled editor on macOS with:
```sh
brew install --cask tiled
```
Maps live in `public/assets/maps/*.tmj`. Tilesets must stay **embedded** in the map (Phaser
can't load external tileset files).

## Art
Placeholder art for now; final sprite sheets can be swapped in later via `content/sprites.ts`
(4 rows: down, left, right, up × idle + 3 walk frames).

All names, texts and art in this game are original.
