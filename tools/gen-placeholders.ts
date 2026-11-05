/**
 * Generates all placeholder PNGs (tileset, characters, companions, props).
 * Run: npm run gen:placeholders
 * Sheet layouts follow content/sprites.ts, prop sizes follow src/world/props.ts,
 * so final art can replace any file 1:1.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sprites, type Direction, DIRECTIONS } from '../content/sprites';
import { FARMHOUSE, props } from '../src/world/props';
import { TILE } from '../src/world/tiles';
import { hex, mulberry32, PixelCanvas, type RGBA } from './png';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

function save(rel: string, canvas: PixelCanvas): void {
  const path = join(PUBLIC, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, canvas.toPNG());
  console.log(`  ✓ ${rel} (${canvas.width}×${canvas.height})`);
}

// ---------------------------------------------------------------- palette
const C = {
  snow: hex('#eef3fa'),
  snowHi: hex('#ffffff'),
  snowShade: hex('#d9e3f0'),
  snowShade2: hex('#c5d3e6'),
  deep: hex('#f6f9fd'),
  path: hex('#dde0e6'),
  pathDark: hex('#c6cad2'),
  gravel: hex('#a89b8a'),
  ice: hex('#bfe0ee'),
  iceHi: hex('#e6f5fb'),
  iceCrack: hex('#97c3d8'),
  stalk: hex('#b59a6a'),
  stalkDark: hex('#8d7a55'),
  stone: hex('#8e949c'),
  stoneDark: hex('#6c727b'),
  stoneHi: hex('#adb3ba'),
  wood: hex('#8a5a34'),
  woodDark: hex('#5e3c22'),
  woodHi: hex('#b07a4a'),
  red: hex('#a3302a'),
  redDark: hex('#86261f'),
  redHi: hex('#b8443a'),
  trim: hex('#fdfcf7'),
  trimShade: hex('#dcdad2'),
  glow: hex('#ffd27a'),
  glowHi: hex('#fff0bf'),
  roofDark: hex('#4a3a3a'),
  icicle: hex('#dff1fb'),
  pine: hex('#2f5d50'),
  pineDark: hex('#1f3f37'),
  pineHi: hex('#3f7564'),
  trunk: hex('#5b3a24'),
  birch: hex('#f1efe8'),
  birchMark: hex('#2e2a28'),
  reed: hex('#9c8a5c'),
  ink: hex('#2b2420'),
  brick: hex('#8a3b2b'),
};

// ---------------------------------------------------------------- tileset
function snowBase(c: PixelCanvas, ox: number, oy: number, seed: number, specks = 10): void {
  const r = mulberry32(seed);
  c.rect(ox, oy, 32, 32, C.snow);
  for (let i = 0; i < specks; i++) c.px(ox + Math.floor(r() * 32), oy + Math.floor(r() * 32), C.snowShade);
  for (let i = 0; i < 4; i++) c.px(ox + Math.floor(r() * 32), oy + Math.floor(r() * 32), C.snowHi);
}

function drawTileset(): PixelCanvas {
  const c = new PixelCanvas(256, 64);
  const at = (id: number) => [(id % 8) * 32, Math.floor(id / 8) * 32] as const;

  for (const [id, seed] of [
    [TILE.snow, 1],
    [TILE.snow2, 2],
    [TILE.snow4, 4],
  ] as const) {
    const [x, y] = at(id);
    snowBase(c, x, y, seed);
  }
  {
    // soft drift curve
    const [x, y] = at(TILE.snow3);
    snowBase(c, x, y, 3, 6);
    for (let i = 0; i < 14; i++) c.px(x + 8 + i, y + 18 + Math.round(Math.sin(i / 2.2) * 1.5), C.snowShade);
  }
  for (const [id, seed] of [
    [TILE.deep, 5],
    [TILE.deep2, 6],
  ] as const) {
    // deep snow: brighter, with blue drift ripples
    const [x, y] = at(id);
    const r = mulberry32(seed);
    c.rect(x, y, 32, 32, C.deep);
    for (let row = 4; row < 32; row += 9) {
      const off = Math.floor(r() * 6);
      for (let i = 0; i < 18; i++) {
        const xx = x + off + i;
        const yy = y + row + Math.round(Math.sin((i + off) / 2.6) * 1.6);
        c.px(xx, yy, C.snowShade2);
        c.px(xx, yy - 1, C.snowHi);
      }
    }
  }
  for (const [id, seed] of [
    [TILE.path, 7],
    [TILE.path2, 8],
  ] as const) {
    const [x, y] = at(id);
    const r = mulberry32(seed);
    c.rect(x, y, 32, 32, C.path);
    // two cart tracks
    for (let yy = 0; yy < 32; yy++) {
      c.px(x + 9, y + yy, C.pathDark).px(x + 22, y + yy, C.pathDark);
    }
    for (let i = 0; i < 10; i++) c.px(x + Math.floor(r() * 32), y + Math.floor(r() * 32), C.gravel);
    for (let i = 0; i < 6; i++) c.px(x + Math.floor(r() * 32), y + Math.floor(r() * 32), C.snowHi);
  }
  for (const [id, seed] of [
    [TILE.ice, 9],
    [TILE.ice2, 10],
  ] as const) {
    const [x, y] = at(id);
    const r = mulberry32(seed);
    c.rect(x, y, 32, 32, C.ice);
    for (let i = 0; i < 3; i++) {
      const sx = Math.floor(r() * 24);
      const sy = Math.floor(r() * 30);
      for (let k = 0; k < 8; k++) c.px(x + sx + k, y + sy + Math.floor(k / 3), C.iceHi);
    }
    if (id === TILE.ice2) {
      let cx = 4;
      let cy = 6;
      for (let k = 0; k < 22; k++) {
        c.px(x + cx, y + cy, C.iceCrack);
        cx += 1;
        cy += r() < 0.5 ? 1 : 0;
      }
    }
  }
  {
    // field: snow with stubble rows poking through
    const [x, y] = at(TILE.field);
    snowBase(c, x, y, 11, 4);
    const r = mulberry32(12);
    for (let row = 3; row < 32; row += 7) {
      for (let col = 1 + (row % 2) * 2; col < 32; col += 4) {
        if (r() < 0.25) continue;
        c.px(x + col, y + row, C.stalk).px(x + col, y + row - 1, C.stalkDark);
        if (r() < 0.4) c.px(x + col + 1, y + row - 2, C.stalk);
      }
    }
  }
  {
    // stone wall (Småland gärdesgård of round boulders) with snow caps
    const [x, y] = at(TILE.wall);
    snowBase(c, x, y, 13, 4);
    const stones = [
      [0, 12, 12, 12],
      [10, 10, 13, 14],
      [21, 12, 11, 12],
      [4, 20, 11, 10],
      [15, 21, 12, 10],
      [25, 20, 8, 10],
    ];
    for (const [sx, sy, w, h] of stones) {
      c.ellipse(x + sx!, y + sy!, w!, h!, C.stoneDark);
      c.ellipse(x + sx!, y + sy! - 1, w! - 1, h! - 1, C.stone);
      c.px(x + sx! + 2, y + sy! + 2, C.stoneHi);
    }
    for (const [sx, sy, w] of stones.slice(0, 3)) c.ellipse(x + sx! + 1, y + sy! - 1, w! - 2, 5, C.snowHi);
  }
  {
    // fence, horizontal
    const [x, y] = at(TILE.fenceH);
    snowBase(c, x, y, 14, 5);
    c.rect(x, y + 14, 32, 3, C.wood).rect(x, y + 14, 32, 1, C.snowHi);
    c.rect(x, y + 21, 32, 3, C.wood).rect(x, y + 21, 32, 1, C.snowHi);
    for (const px of [4, 26]) {
      c.rect(x + px, y + 10, 3, 18, C.woodDark).rect(x + px, y + 10, 3, 2, C.snowHi);
    }
  }
  {
    // fence, vertical
    const [x, y] = at(TILE.fenceV);
    snowBase(c, x, y, 15, 5);
    c.rect(x + 13, y, 3, 32, C.wood).rect(x + 13, y, 1, 32, C.woodHi);
    for (const py of [6, 22]) c.rect(x + 11, y + py, 7, 5, C.woodDark).rect(x + 11, y + py, 7, 2, C.snowHi);
  }
  {
    // shore: snow with reeds
    const [x, y] = at(TILE.shore);
    snowBase(c, x, y, 16, 6);
    const r = mulberry32(17);
    for (let i = 0; i < 9; i++) {
      const rx = 2 + Math.floor(r() * 28);
      const ry = 10 + Math.floor(r() * 18);
      const h = 4 + Math.floor(r() * 5);
      for (let k = 0; k < h; k++) c.px(x + rx + (k > h - 2 ? 1 : 0), y + ry - k, C.reed);
    }
  }
  {
    // snow with little bird tracks
    const [x, y] = at(TILE.snowTracks);
    snowBase(c, x, y, 18, 6);
    for (let i = 0; i < 6; i++) {
      const tx = x + 6 + i * 4;
      const ty = y + 8 + i * 3;
      c.px(tx, ty, C.snowShade2).px(tx - 1, ty - 1, C.snowShade2).px(tx + 1, ty - 1, C.snowShade2).px(tx, ty + 1, C.snowShade2);
    }
  }
  return c;
}

// ---------------------------------------------------------------- characters
interface CharPalette {
  coat: RGBA;
  coatDark: RGBA;
  scarf: RGBA;
  scarfDark: RGBA;
  hat: RGBA;
  hatDark: RGBA;
  pom: RGBA;
  hair: RGBA;
  boots: RGBA;
}

const SKIN = hex('#f2c9a8');
const SKIN_SHADE = hex('#e0b08c');
const BLUSH = hex('#ec9a8c');
const EYE = hex('#2b2420');

const CHAR_PALETTES: Record<'sonne' | 'isi' | 'ninni', CharPalette> = {
  sonne: {
    coat: hex('#d79b3a'),
    coatDark: hex('#b07a25'),
    scarf: hex('#c8432f'),
    scarfDark: hex('#a3321f'),
    hat: hex('#e8b443'),
    hatDark: hex('#c99528'),
    pom: hex('#fff4d6'),
    hair: hex('#7a4a2a'),
    boots: hex('#4a3426'),
  },
  isi: {
    coat: hex('#3f6e5a'),
    coatDark: hex('#2f5546'),
    scarf: hex('#f1d46b'),
    scarfDark: hex('#d4b34a'),
    hat: hex('#3aa3a0'),
    hatDark: hex('#2c827f'),
    pom: hex('#ffffff'),
    hair: hex('#3b2a20'),
    boots: hex('#3a2e28'),
  },
  ninni: {
    coat: hex('#b0476b'),
    coatDark: hex('#8d3655'),
    scarf: hex('#7fb6e0'),
    scarfDark: hex('#5d96c2'),
    hat: hex('#e88aa8'),
    hatDark: hex('#c96d8b'),
    pom: hex('#ffffff'),
    hair: hex('#c98d4a'),
    boots: hex('#3a2e28'),
  },
};

/** Draws one 32×48 character frame facing down/left/up (right = mirrored left). */
function drawCharFrame(p: CharPalette, dir: Direction, frame: number): PixelCanvas {
  const c = new PixelCanvas(32, 48);
  const side = dir === 'left' || dir === 'right';
  const bob = frame === 2 ? -1 : 0;
  const stepA = frame === 1; // left/front foot forward
  const stepB = frame === 3;

  // boots
  if (side) {
    const front = stepA ? 9 : stepB ? 14 : 12;
    const back = stepA ? 17 : stepB ? 12 : 15;
    c.rect(back, 43, 5, 3, p.boots);
    c.rect(front, 43, 5, 3, p.boots);
  } else {
    c.rect(10, stepA ? 42 : 43, 5, 3, p.boots);
    c.rect(17, stepB ? 42 : 43, 5, 3, p.boots);
  }

  const y0 = bob;
  // coat
  for (let row = 0; row < 16; row++) {
    const inset = side ? 2 : row < 4 ? 1 : 0;
    const x1 = 8 + inset;
    const x2 = 23 - inset;
    c.rect(x1, y0 + 27 + row, x2 - x1 + 1, 1, p.coat);
    c.rect(x2 - 1, y0 + 27 + row, 2, 1, p.coatDark);
  }
  c.rect(8, y0 + 41, 16, 2, p.coatDark); // hem
  if (dir === 'down') for (const by of [31, 35, 39]) c.px(16, y0 + by, p.coatDark);

  // arms + mittens
  if (side) {
    const swing = stepA ? -2 : stepB ? 2 : 0;
    c.rect(14 + swing, y0 + 29, 4, 8, p.coatDark);
    c.rect(14 + swing, y0 + 37, 4, 3, p.scarf);
  } else {
    const sA = stepA ? -1 : stepB ? 1 : 0;
    c.rect(5, y0 + 29 + sA, 3, 8, p.coatDark).rect(5, y0 + 37 + sA, 3, 3, p.scarf);
    c.rect(24, y0 + 29 - sA, 3, 8, p.coatDark).rect(24, y0 + 37 - sA, 3, 3, p.scarf);
  }

  // head
  c.ellipse(9, y0 + 11, 14, 15, SKIN);
  c.rect(20, y0 + 16, 2, 7, SKIN_SHADE);
  // hair
  if (dir === 'up') {
    c.ellipse(9, y0 + 11, 14, 15, p.hair);
  } else if (side) {
    c.rect(15, y0 + 13, 8, 9, p.hair); // back of the head (left-facing: hair to the right)
    c.rect(10, y0 + 12, 12, 3, p.hair);
  } else {
    c.rect(10, y0 + 12, 12, 3, p.hair);
    c.rect(9, y0 + 14, 2, 7, p.hair).rect(21, y0 + 14, 2, 7, p.hair);
  }
  // face
  if (dir === 'down') {
    c.rect(12, y0 + 18, 2, 2, EYE).rect(18, y0 + 18, 2, 2, EYE);
    c.rect(11, y0 + 21, 2, 1, BLUSH).rect(19, y0 + 21, 2, 1, BLUSH);
    c.rect(15, y0 + 22, 2, 1, SKIN_SHADE);
  } else if (side) {
    c.rect(11, y0 + 18, 2, 2, EYE);
    c.rect(10, y0 + 21, 2, 1, BLUSH);
    c.px(8, y0 + 19, SKIN); // nose tip
  }

  // knitted hat with cuff and pompom
  c.ellipse(8, y0 + 4, 16, 14, p.hat);
  c.rect(8, y0 + 10, 16, 3, p.hatDark);
  for (let x = 9; x < 23; x += 3) c.px(x, y0 + 7, p.hatDark);
  c.ellipse(13, y0 + 0, 6, 6, p.pom);

  // scarf (+ tail)
  c.rect(9, y0 + 25, 14, 3, p.scarf);
  c.rect(9, y0 + 27, 14, 1, p.scarfDark);
  if (dir === 'down') c.rect(18, y0 + 27, 3, 6, p.scarf).rect(18, y0 + 32, 3, 1, p.scarfDark);
  if (side) {
    const flutter = frame % 2 === 0 ? 0 : 1;
    c.rect(21, y0 + 25 + flutter, 4, 3, p.scarf).rect(24, y0 + 27 + flutter, 2, 3, p.scarfDark);
  }
  if (dir === 'up') c.rect(13, y0 + 27, 3, 7, p.scarf);

  c.outline(hex('#2b2420', 220));
  return c;
}

function mirror(src: PixelCanvas): PixelCanvas {
  const out = new PixelCanvas(src.width, src.height);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const i = (y * src.width + x) * 4;
      const j = (y * src.width + (src.width - 1 - x)) * 4;
      out.data.set(src.data.subarray(i, i + 4), j);
    }
  }
  return out;
}

/** Builds a standard 4×4 sheet from a frame-drawing function (right = mirrored left). */
function sheet(fw: number, fh: number, draw: (dir: Direction, frame: number) => PixelCanvas): PixelCanvas {
  const c = new PixelCanvas(fw * 4, fh * 4);
  DIRECTIONS.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      const f = dir === 'right' ? mirror(draw('left', frame)) : draw(dir, frame);
      c.blit(f, frame * fw, row * fh);
    }
  });
  return c;
}

// ---------------------------------------------------------------- dogs
interface DogPalette {
  fur: RGBA;
  dark: RGBA;
  light: RGBA;
  nose: RGBA;
  outline: RGBA;
  collar?: RGBA;
  tongue?: RGBA;
}

/** Dog frame drawn on a 32-unit grid, scaled by `s` (1 = 32px frame, 0.75 = 24px). */
function drawDogFrame(p: DogPalette, dir: Direction, frame: number, s: number): PixelCanvas {
  const size = Math.round(32 * s);
  const c = new PixelCanvas(size, size);
  const R = (x: number, y: number, w: number, h: number, col: RGBA) =>
    c.rect(Math.round(x * s), Math.round(y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)), col);
  const E = (x: number, y: number, w: number, h: number, col: RGBA) =>
    c.ellipse(Math.round(x * s), Math.round(y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)), col);
  const lift = (leg: number) => (frame === 1 && leg % 2 === 0) || (frame === 3 && leg % 2 === 1) ? -2 : 0;
  const wag = frame % 2 === 0 ? 0 : 2;

  if (dir === 'left') {
    E(8, 14, 19, 12, p.fur);
    E(10, 19, 14, 6, p.light);
    [9, 12, 20, 23].forEach((lx, i) => R(lx, 24 + lift(i), 3, 6, p.dark));
    R(25, 12 - wag / 2, 5, 3, p.fur); // tail
    E(2, 6, 12, 12, p.fur); // head
    E(0, 12, 6, 5, p.light); // snout
    R(0, 12, 2, 2, p.nose);
    R(8, 7, 4, 9, p.dark); // ear
    R(5, 10, 2, 2, p.nose); // eye
    if (p.collar) R(10, 16, 3, 5, p.collar);
  } else if (dir === 'down') {
    E(9, 15, 14, 14, p.fur);
    E(12, 20, 8, 8, p.light);
    R(12, 25 + lift(0), 3, 5, p.dark);
    R(18, 25 + lift(1), 3, 5, p.dark);
    E(10, 6, 12, 12, p.fur);
    R(8, 8, 3, 9, p.dark);
    R(21, 8, 3, 9, p.dark);
    R(13, 11, 2, 2, p.nose);
    R(18, 11, 2, 2, p.nose);
    E(13, 13, 6, 5, p.light);
    R(15, 14, 3, 2, p.nose);
    if (p.tongue && frame !== 0) R(15, 17, 2, 2, p.tongue);
    if (p.collar) R(11, 18, 10, 2, p.collar);
  } else {
    // up: back view
    R(15 + (wag ? 1 : -1), 26, 3, 5, p.fur); // tail
    E(9, 10, 14, 18, p.fur);
    E(11, 14, 10, 10, p.dark);
    E(11, 14, 10, 9, p.fur);
    R(12, 25 + lift(0), 3, 5, p.dark);
    R(18, 25 + lift(1), 3, 5, p.dark);
    E(11, 3, 10, 10, p.fur);
    R(9, 5, 3, 7, p.dark);
    R(20, 5, 3, 7, p.dark);
    if (p.collar) R(12, 11, 8, 2, p.collar);
  }
  c.outline(p.outline);
  return c;
}

// ---------------------------------------------------------------- Kratzi
const BEAR = {
  fur: hex('#8a5a3c'),
  dark: hex('#6e4630'),
  light: hex('#b88a66'),
  patch: hex('#6b8f5a'),
  stitch: hex('#2f2018'),
  outline: hex('#3b2618'),
};

function drawKratziBody(dir: Direction, frame: number): PixelCanvas {
  const c = new PixelCanvas(24, 24);
  const b = frame === 2 ? -1 : 0;
  if (dir === 'left') {
    c.ellipse(7, 10 + b, 11, 12, BEAR.fur);
    c.rect(3, 18 + b, 7, 4, BEAR.dark); // legs stretched forward
    c.rect(2, 19 + b, 2, 3, BEAR.light);
    c.rect(9, 13 + b, 4, 6, BEAR.dark); // arm
  } else if (dir === 'down') {
    c.ellipse(6, 10 + b, 12, 12, BEAR.fur);
    c.ellipse(9, 13 + b, 6, 7, BEAR.light);
    c.rect(10, 14 + b, 4, 4, BEAR.patch);
    c.px(10, 14 + b, BEAR.stitch).px(13, 17 + b, BEAR.stitch).px(10, 17 + b, BEAR.stitch).px(13, 14 + b, BEAR.stitch);
    c.rect(4, 12 + b, 3, 6, BEAR.dark).rect(17, 12 + b, 3, 6, BEAR.dark);
    c.rect(6, 19 + b, 4, 3, BEAR.dark).rect(14, 19 + b, 4, 3, BEAR.dark);
    c.rect(7, 20 + b, 2, 2, BEAR.light).rect(15, 20 + b, 2, 2, BEAR.light);
  } else {
    c.ellipse(6, 10 + b, 12, 12, BEAR.fur);
    c.rect(8, 12 + b, 3, 3, BEAR.patch); // patched back
    c.rect(4, 12 + b, 3, 6, BEAR.dark).rect(17, 12 + b, 3, 6, BEAR.dark);
  }
  c.outline(BEAR.outline);
  return c;
}

function drawKratziHead(dir: Direction): PixelCanvas {
  const c = new PixelCanvas(16, 16);
  if (dir === 'left') {
    c.ellipse(8, 1, 5, 5, BEAR.dark);
    c.ellipse(2, 3, 12, 12, BEAR.fur);
    c.ellipse(1, 8, 6, 5, BEAR.light);
    c.rect(1, 9, 2, 1, BEAR.stitch);
    c.rect(5, 6, 2, 2, BEAR.stitch);
  } else if (dir === 'down') {
    c.ellipse(1, 1, 5, 5, BEAR.dark).ellipse(10, 1, 5, 5, BEAR.dark);
    c.ellipse(2, 3, 12, 12, BEAR.fur);
    c.ellipse(5, 8, 6, 5, BEAR.light);
    c.rect(4, 6, 2, 2, BEAR.stitch).rect(10, 6, 2, 2, BEAR.stitch); // button eyes
    c.rect(7, 9, 2, 1, BEAR.stitch);
    c.px(10, 4, BEAR.stitch).px(11, 4, BEAR.light); // a worn stitch over one eye
  } else {
    c.ellipse(1, 1, 5, 5, BEAR.dark).ellipse(10, 1, 5, 5, BEAR.dark);
    c.ellipse(2, 3, 12, 12, BEAR.fur);
    c.rect(6, 10, 4, 1, BEAR.dark); // seam
  }
  c.outline(BEAR.outline);
  return c;
}

function drawSled(): PixelCanvas {
  const c = new PixelCanvas(64, 32);
  // frame 0: side view, front curl on the left
  c.rect(5, 18, 24, 3, C.woodHi).rect(5, 20, 24, 1, C.wood);
  for (const sx of [8, 16, 24]) c.rect(sx, 21, 2, 3, C.woodDark);
  c.rect(3, 24, 27, 2, C.woodDark);
  c.rect(1, 21, 2, 3, C.woodDark).rect(2, 20, 2, 1, C.woodDark);
  // frame 1: front/back view (seen from above), runners left/right
  const ox = 32;
  c.rect(ox + 8, 9, 16, 16, C.woodHi);
  for (let y = 11; y < 25; y += 4) c.rect(ox + 8, y, 16, 1, C.wood);
  c.rect(ox + 6, 7, 2, 21, C.woodDark).rect(ox + 24, 7, 2, 21, C.woodDark);
  c.rect(ox + 6, 6, 20, 1, C.woodDark);
  return c;
}

// ---------------------------------------------------------------- props
function snowCap(c: PixelCanvas, x: number, y: number, w: number, h: number): void {
  c.ellipse(x, y, w, h, C.snowHi);
  c.rect(x + 1, y + h - 2, w - 2, 1, C.snowShade);
}

function drawRoof(c: PixelCanvas, x: number, y: number, w: number, h: number, seed: number): void {
  const r = mulberry32(seed);
  // snow layer: bright near the ridge, bluish towards the eave so it reads against snowy ground
  c.rect(x, y, w, h, hex('#e3eaf4'));
  c.rect(x, y, w, Math.round(h * 0.35), hex('#f4f8fc'));
  c.rect(x, y + Math.round(h * 0.7), w, Math.round(h * 0.3), hex('#d3deec'));
  for (let i = 0; i < w / 5; i++) {
    const bx = x + 2 + Math.floor(r() * (w - 10));
    const by = y + 4 + Math.floor(r() * (h - 10));
    c.rect(bx, by, 6, 1, C.snowShade2);
    c.rect(bx + 1, by - 1, 4, 1, C.snowHi);
  }
  // dark roof boards visible at the gable ends, ridge and eave
  c.rect(x, y, 3, h, C.roofDark).rect(x + w - 3, y, 3, h, C.roofDark);
  c.rect(x, y, w, 2, hex('#7d8aa0'));
  c.rect(x, y + h - 3, w, 3, C.roofDark);
  c.rect(x + 3, y + h - 5, w - 6, 2, hex('#b9c7da'));
  for (let ix = x + 4; ix < x + w - 3; ix += 7) c.rect(ix, y + h, 1, 2 + Math.floor(r() * 3), C.icicle);
}

function drawFacade(c: PixelCanvas, x: number, y: number, w: number, h: number): void {
  c.rect(x, y, w, h, C.red);
  for (let bx = x + 3; bx < x + w; bx += 5) c.rect(bx, y, 1, h, C.redDark);
  c.rect(x, y, 4, h, C.trim).rect(x + w - 4, y, 4, h, C.trim);
  c.rect(x, y, w, 3, C.trim);
  c.rect(x, y + h - 4, w, 4, C.stone).rect(x, y + h - 4, w, 1, C.stoneHi);
}

function drawWindow(c: PixelCanvas, cx: number, top: number): void {
  c.rect(cx - 8, top, 16, 18, C.trim);
  c.rect(cx - 6, top + 2, 12, 14, C.glow);
  c.rect(cx - 6, top + 2, 12, 3, C.glowHi);
  c.rect(cx - 1, top + 2, 2, 14, C.trim).rect(cx - 6, top + 8, 12, 2, C.trim);
  c.rect(cx - 9, top + 17, 18, 2, C.trimShade); // sill
  c.rect(cx - 9, top + 16, 18, 1, C.snowHi); // snow on the sill
}

function drawFarmhouse(): PixelCanvas {
  const { width: W, height: H, facadeTop, windowTop, windowXs, doorX, chimney } = FARMHOUSE;
  const c = new PixelCanvas(W, H);
  drawFacade(c, 6, facadeTop, W - 12, H - facadeTop - 2);
  drawRoof(c, 1, 8, W - 2, facadeTop - 8, 21);
  // chimney
  c.rect(chimney.x, chimney.y + 2, chimney.w, chimney.h, C.brick);
  c.rect(chimney.x, chimney.y + 6, chimney.w, 1, C.redDark);
  c.rect(chimney.x - 1, chimney.y, chimney.w + 2, 3, C.snowHi);
  for (const wx of windowXs) drawWindow(c, wx, windowTop);
  // door with steps
  c.rect(doorX - 9, facadeTop + 22, 18, H - facadeTop - 24, C.trim);
  c.rect(doorX - 7, facadeTop + 24, 14, H - facadeTop - 26, C.redDark);
  c.rect(doorX - 5, facadeTop + 26, 4, 6, C.glow);
  c.rect(doorX + 1, facadeTop + 26, 4, 6, C.glow);
  c.px(doorX + 4, facadeTop + 42, C.glowHi);
  c.rect(doorX - 11, H - 3, 22, 3, C.stoneHi);
  // snow drifts at the base
  c.ellipse(4, H - 6, 22, 7, C.snowHi).ellipse(W - 30, H - 7, 26, 8, C.snowHi);
  return c;
}

function drawBarn(): PixelCanvas {
  const W = 128;
  const H = 112;
  const c = new PixelCanvas(W, H);
  drawFacade(c, 4, 54, W - 8, H - 56);
  drawRoof(c, 0, 6, W, 48, 22);
  // big double door with white X braces
  c.rect(42, 64, 44, 44, C.trim);
  c.rect(44, 66, 19, 42, C.redDark).rect(65, 66, 19, 42, C.redDark);
  for (let i = 0; i < 19; i++) {
    c.px(44 + i, 66 + Math.round((i * 42) / 19), C.trim);
    c.px(62 - i, 66 + Math.round((i * 42) / 19), C.trim);
    c.px(65 + i, 66 + Math.round((i * 42) / 19), C.trim);
    c.px(83 - i, 66 + Math.round((i * 42) / 19), C.trim);
  }
  c.rect(14, 66, 14, 12, C.trim).rect(16, 68, 10, 8, hex('#3a3040'));
  c.ellipse(W - 34, H - 8, 30, 9, C.snowHi);
  return c;
}

function drawShed(): PixelCanvas {
  const c = new PixelCanvas(64, 56);
  drawFacade(c, 3, 26, 58, 28);
  drawRoof(c, 0, 4, 64, 22, 23);
  c.rect(10, 34, 14, 20, C.trim).rect(12, 36, 10, 18, C.redDark);
  // stacked log ends
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const lx = 32 + col * 6 + (row % 2) * 3;
      const ly = 36 + row * 5;
      c.ellipse(lx, ly, 6, 5, C.woodHi);
      c.px(lx + 2, ly + 2, C.wood);
    }
  }
  return c;
}

function drawPine(w: number, h: number, seed: number): PixelCanvas {
  const c = new PixelCanvas(w, h);
  const r = mulberry32(seed);
  const cx = Math.floor(w / 2);
  const trunkH = Math.round(h * 0.16);
  c.rect(cx - 2, h - trunkH, 4, trunkH, C.trunk);
  const tiers = 4;
  const top = 2;
  const bottom = h - trunkH + 2;
  const tierH = (bottom - top) / tiers;
  for (let t = 0; t < tiers; t++) {
    const ty = Math.round(top + t * tierH * 0.85);
    const th = Math.round(tierH * 1.3);
    const maxHalf = Math.round((w / 2 - 1) * (0.45 + (0.55 * (t + 1)) / tiers));
    for (let row = 0; row < th; row++) {
      const half = Math.max(1, Math.round((maxHalf * (row + 1)) / th));
      const y = ty + row;
      c.rect(cx - half, y, half * 2, 1, C.pine);
      c.rect(cx + Math.floor(half / 3), y, Math.ceil(half * 0.66), 1, C.pineDark);
      c.rect(cx - half, y, Math.max(1, Math.floor(half / 3)), 1, C.pineHi);
      if (row < 2 || (row === th - 1 && r() < 0.5)) c.rect(cx - half, y, half * 2, 1, C.snowHi);
    }
    for (let k = 0; k < 3; k++) {
      const sx = cx - maxHalf + 2 + Math.floor(r() * (maxHalf * 2 - 4));
      c.rect(sx, ty + th - 2, 3, 1, C.snowHi);
    }
  }
  c.outline(hex('#1a2e29', 140));
  return c;
}

function drawBirch(): PixelCanvas {
  const c = new PixelCanvas(30, 64);
  c.rect(13, 10, 4, 54, C.birch);
  for (let y = 14; y < 62; y += 6) c.rect(13 + ((y / 6) % 2), y, 2, 1, C.birchMark);
  const branch = (x0: number, y0: number, dx: number, len: number) => {
    for (let i = 0; i < len; i++) {
      const x = x0 + dx * i;
      const y = y0 - Math.floor(i * 0.8);
      c.px(x, y, hex('#6b5a50'));
      if (i % 3 === 0) c.px(x, y - 1, C.snowHi);
    }
  };
  branch(13, 26, -1, 10);
  branch(16, 22, 1, 10);
  branch(13, 16, -1, 7);
  branch(16, 13, 1, 8);
  branch(15, 10, 0, 6);
  c.outline(hex('#2b2420', 90));
  return c;
}

function drawBush(): PixelCanvas {
  const c = new PixelCanvas(28, 18);
  c.ellipse(1, 5, 26, 13, C.pineDark);
  c.ellipse(3, 5, 20, 10, C.pine);
  snowCap(c, 2, 2, 24, 8);
  return c;
}

function drawRock(): PixelCanvas {
  const c = new PixelCanvas(24, 16);
  c.ellipse(1, 4, 22, 12, C.stoneDark);
  c.ellipse(2, 3, 19, 10, C.stone);
  snowCap(c, 3, 1, 17, 7);
  return c;
}

function drawMailbox(): PixelCanvas {
  const c = new PixelCanvas(16, 28);
  c.rect(7, 10, 3, 18, C.woodDark);
  c.rect(2, 5, 12, 8, hex('#3f6e5a')).rect(2, 11, 12, 2, hex('#2f5546'));
  c.rect(2, 3, 12, 2, C.snowHi);
  c.rect(13, 8, 3, 2, hex('#d04545')); // little red flag (down)
  c.outline(hex('#2b2420', 160));
  return c;
}

function drawWell(): PixelCanvas {
  const c = new PixelCanvas(32, 36);
  c.rect(5, 6, 2, 20, C.woodDark).rect(25, 6, 2, 20, C.woodDark);
  c.rect(2, 2, 28, 6, C.wood);
  c.rect(1, 0, 30, 3, C.snowHi);
  c.rect(14, 8, 1, 10, hex('#6b5a50'));
  c.rect(12, 17, 5, 4, C.woodHi);
  c.ellipse(2, 20, 28, 16, C.stoneDark);
  c.ellipse(3, 20, 26, 12, C.stone);
  c.ellipse(7, 22, 18, 7, hex('#3a4252'));
  c.ellipse(3, 19, 26, 5, C.snowHi);
  return c;
}

function drawWoodpile(): PixelCanvas {
  const c = new PixelCanvas(36, 22);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6 - row; col++) {
      const lx = 1 + col * 6 + row * 3;
      const ly = 15 - row * 5;
      c.ellipse(lx, ly, 6, 6, C.woodHi);
      c.px(lx + 2, ly + 2, C.wood).px(lx + 3, ly + 3, C.wood);
    }
  }
  c.ellipse(6, 2, 24, 6, C.snowHi);
  c.outline(hex('#2b2420', 120));
  return c;
}

function drawLantern(): PixelCanvas {
  const c = new PixelCanvas(10, 34);
  c.rect(4, 10, 2, 24, hex('#2e2a2b'));
  c.rect(1, 2, 8, 9, hex('#2e2a2b'));
  c.rect(2, 4, 6, 6, C.glow).rect(3, 5, 4, 3, C.glowHi);
  c.rect(0, 0, 10, 2, C.snowHi);
  return c;
}

// ---------------------------------------------------------------- main
function main(): void {
  console.log('Generating placeholder art …');
  save('assets/tiles/winter.png', drawTileset());

  for (const id of ['sonne', 'isi', 'ninni'] as const) {
    const def = sprites[id];
    save(def.file, sheet(def.frameWidth, def.frameHeight, (d, f) => drawCharFrame(CHAR_PALETTES[id], d, f)));
  }

  const teddy: DogPalette = {
    fur: hex('#e3b86f'),
    dark: hex('#c4914a'),
    light: hex('#f3d79e'),
    nose: hex('#3a2a20'),
    outline: hex('#6b4a26', 200),
    tongue: hex('#e5737f'),
  };
  const pauli: DogPalette = {
    fur: hex('#ffffff'),
    dark: hex('#eaeef3'),
    light: hex('#ffffff'),
    nose: hex('#1e1e22'),
    outline: hex('#dfe6ee'), // barely there – Pauli is nearly invisible in the snow
    collar: hex('#d04545'),
  };
  save(sprites.teddy.file, sheet(32, 32, (d, f) => drawDogFrame(teddy, d, f, 1)));
  save(sprites.pauli.file, sheet(24, 24, (d, f) => drawDogFrame(pauli, d, f, 0.75)));
  save(sprites.kratzi.file, sheet(24, 24, drawKratziBody));

  const head = new PixelCanvas(64, 16);
  head.blit(drawKratziHead('down'), 0, 0);
  head.blit(drawKratziHead('left'), 16, 0);
  head.blit(mirror(drawKratziHead('left')), 32, 0);
  head.blit(drawKratziHead('up'), 48, 0);
  save(sprites['kratzi-head'].file, head);
  save(sprites.sled.file, drawSled());

  const propArt: Record<keyof typeof props, () => PixelCanvas> = {
    farmhouse: drawFarmhouse,
    barn: drawBarn,
    shed: drawShed,
    pine: () => drawPine(props.pine.width, props.pine.height, 31),
    'pine-small': () => drawPine(props['pine-small'].width, props['pine-small'].height, 32),
    birch: drawBirch,
    bush: drawBush,
    rock: drawRock,
    mailbox: drawMailbox,
    well: drawWell,
    woodpile: drawWoodpile,
    lantern: drawLantern,
  };
  for (const [key, draw] of Object.entries(propArt)) {
    const def = props[key as keyof typeof props];
    const art = draw();
    if (art.width !== def.width || art.height !== def.height) {
      throw new Error(`${key}: art is ${art.width}×${art.height}, props.ts says ${def.width}×${def.height}`);
    }
    save(def.file, art);
  }
  console.log('Done.');
}

main();
