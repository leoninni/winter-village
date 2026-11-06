/**
 * Placeholder art added in Phase 2: animals, discovery icons, fire, the
 * Sonnenpalast interior (tiles + furniture) and the chicken coop.
 * Used by tools/gen-placeholders.ts.
 */
import { ICON_ORDER, type Direction } from '../content/sprites';
import { hex, mirror, mulberry32, PixelCanvas, type RGBA } from './png';

const INK = hex('#2b2420', 200);
const SNOW = hex('#ffffff');
const SNOW_SHADE = hex('#d9e3f0');

// ---------------------------------------------------------------- cat (Smulan)
const CAT = { fur: hex('#8a8f99'), dark: hex('#666b75'), light: hex('#f1f1ef'), nose: hex('#e08a8a'), eye: hex('#3f7f4a') };

function catFrame(dir: Direction, frame: number): PixelCanvas {
  const c = new PixelCanvas(24, 24);
  const step = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  if (dir === 'left') {
    c.ellipse(6, 11, 14, 8, CAT.fur);
    for (const x of [9, 12, 15]) c.rect(x, 11, 1, 4, CAT.dark);
    c.rect(7, 17, 2, 4 + step, CAT.dark).rect(16, 17, 2, 4 - step, CAT.dark);
    c.rect(19, 8 + step, 2, 6, CAT.fur).rect(20, 6, 2, 3, CAT.dark); // tail up
    c.ellipse(1, 6, 9, 8, CAT.fur);
    c.rect(2, 4, 2, 3, CAT.fur).rect(6, 4, 2, 3, CAT.fur);
    c.px(2, 9, CAT.eye).px(0, 11, CAT.nose);
    c.rect(3, 12, 4, 2, CAT.light);
  } else if (dir === 'down') {
    c.ellipse(6, 10, 12, 11, CAT.fur);
    c.ellipse(9, 13, 6, 7, CAT.light);
    c.rect(8, 19 + Math.min(0, step), 2, 3, CAT.dark).rect(14, 19 + Math.min(0, -step), 2, 3, CAT.dark);
    c.ellipse(6, 3, 12, 10, CAT.fur);
    c.rect(6, 1, 3, 4, CAT.fur).rect(15, 1, 3, 4, CAT.fur);
    c.px(7, 2, CAT.nose).px(16, 2, CAT.nose);
    c.rect(9, 7, 2, 2, CAT.eye).rect(13, 7, 2, 2, CAT.eye);
    c.px(11, 9, CAT.nose).px(12, 9, CAT.nose);
    for (const x of [8, 11, 14]) c.px(x, 4, CAT.dark);
  } else {
    c.ellipse(6, 9, 12, 12, CAT.fur);
    for (const y of [12, 15, 18]) c.rect(9, y, 6, 1, CAT.dark);
    c.rect(11 + step, 19, 2, 5, CAT.fur);
    c.ellipse(6, 3, 12, 9, CAT.fur);
    c.rect(6, 1, 3, 4, CAT.fur).rect(15, 1, 3, 4, CAT.fur);
  }
  c.outline(INK);
  return c;
}

function catSleep(breath: number): PixelCanvas {
  const c = new PixelCanvas(24, 24);
  c.ellipse(3, 11 - breath, 18, 11 + breath, CAT.fur);
  for (const x of [7, 11, 15]) c.rect(x, 12 - breath, 1, 4, CAT.dark);
  c.ellipse(2, 15, 10, 7, CAT.fur); // head tucked in
  c.rect(3, 13, 2, 3, CAT.fur).rect(8, 13, 2, 3, CAT.fur);
  c.rect(4, 18, 2, 1, CAT.dark).rect(7, 18, 2, 1, CAT.dark); // closed eyes
  c.rect(10, 19, 12, 2, CAT.dark); // tail wrapped round
  c.outline(INK);
  return c;
}

function catSit(): PixelCanvas {
  const c = new PixelCanvas(24, 24);
  c.ellipse(6, 10, 12, 13, CAT.fur);
  c.ellipse(9, 13, 6, 8, CAT.light);
  c.rect(17, 18, 5, 2, CAT.fur);
  c.ellipse(6, 1, 12, 10, CAT.fur);
  c.rect(6, 0, 3, 3, CAT.fur).rect(15, 0, 3, 3, CAT.fur);
  c.rect(9, 5, 2, 2, CAT.eye).rect(13, 5, 2, 2, CAT.eye);
  c.px(11, 7, CAT.nose).px(12, 7, CAT.nose);
  c.outline(INK);
  return c;
}

/** 4×5 sheet: standard 4 directions + row 5: sleep, sleep (breathing), sit. */
export function drawCatSheet(): PixelCanvas {
  const c = new PixelCanvas(96, 120);
  (['down', 'left', 'right', 'up'] as Direction[]).forEach((dir, row) => {
    for (let f = 0; f < 4; f++) {
      const frame = dir === 'right' ? mirror(catFrame('left', f)) : catFrame(dir, f);
      c.blit(frame, f * 24, row * 24);
    }
  });
  c.blit(catSleep(0), 0, 96);
  c.blit(catSleep(1), 24, 96);
  c.blit(catSit(), 48, 96);
  return c;
}

// ---------------------------------------------------------------- horse (Klöver)
const HORSE = { coat: hex('#8a5a3a'), dark: hex('#6a4229'), mane: hex('#3a2a20'), light: hex('#a8774f'), hoof: hex('#2b2420'), blaze: hex('#f4efe6') };

function horseFrame(frame: number): PixelCanvas {
  // side view facing left; frame 0 idle, 1 tail swish, 2 head down (eating), 3 ear flick
  const c = new PixelCanvas(64, 48);
  c.ellipse(16, 16, 36, 18, HORSE.coat);
  c.rect(20, 26, 26, 4, HORSE.dark);
  for (const x of [20, 26, 40, 46]) c.rect(x, 30, 4, 14, HORSE.dark).rect(x, 42, 4, 3, HORSE.hoof);
  // tail
  const tx = frame === 1 ? 54 : 51;
  c.rect(50, 16, 4, 4, HORSE.mane).rect(tx, 19, 4, 14, HORSE.mane);
  // neck + head
  if (frame === 2) {
    c.rect(10, 18, 10, 12, HORSE.coat);
    c.ellipse(2, 26, 14, 12, HORSE.coat);
    c.rect(4, 32, 4, 4, HORSE.light);
    c.px(8, 28, HORSE.hoof);
    c.rect(14, 16, 6, 10, HORSE.mane);
    c.ellipse(3, 37, 10, 5, hex('#c9b27a')); // hay in front
  } else {
    c.rect(10, 8, 10, 16, HORSE.coat);
    c.ellipse(2, 2, 16, 12, HORSE.coat);
    c.rect(1, 8, 6, 5, HORSE.light);
    c.rect(5, 2, 2, 7, HORSE.blaze);
    c.px(7, 5, HORSE.hoof);
    c.rect(12, frame === 3 ? -1 : 0, 3, 4, HORSE.dark);
    c.rect(14, 2, 6, 18, HORSE.mane);
  }
  c.rect(16, 13, 14, 2, hex('#c8432f')); // a red blanket edge, cosy
  c.rect(16, 15, 14, 8, hex('#a3321f'));
  c.rect(16, 15, 14, 1, hex('#e8c64a'));
  c.outline(INK);
  return c;
}

/** 4×2 sheet: row 0 facing left (idle, swish, eat, ear), row 1 the same facing right. */
export function drawHorseSheet(): PixelCanvas {
  const c = new PixelCanvas(256, 96);
  for (let f = 0; f < 4; f++) {
    const left = horseFrame(f);
    c.blit(left, f * 64, 0);
    c.blit(mirror(left), f * 64, 48);
  }
  return c;
}

// ---------------------------------------------------------------- chicken
function chickenFrame(frame: number, brown: boolean): PixelCanvas {
  // facing left: 0 idle, 1 peck, 2 walk1, 3 walk2
  const c = new PixelCanvas(16, 16);
  const body = brown ? hex('#b5763a') : hex('#f4f1ea');
  const wing = brown ? hex('#8a5426') : hex('#d9d4c8');
  c.ellipse(4, 6, 10, 8, body);
  c.rect(12, 4, 3, 4, wing); // tail
  c.ellipse(6, 8, 6, 4, wing);
  const leg = hex('#e0a030');
  if (frame === 2) c.rect(6, 14, 1, 2, leg).rect(9, 13, 1, 3, leg);
  else if (frame === 3) c.rect(6, 13, 1, 3, leg).rect(9, 14, 1, 2, leg);
  else c.rect(6, 14, 1, 2, leg).rect(9, 14, 1, 2, leg);
  const hy = frame === 1 ? 7 : 2;
  const hx = frame === 1 ? 0 : 2;
  c.ellipse(hx, hy, 6, 6, body);
  c.rect(hx + 2, hy - 1, 3, 2, hex('#d9443a')); // comb
  c.rect(hx - 1, hy + 2, 2, 1, leg); // beak
  c.px(hx + 1, hy + 2, hex('#1e1e22'));
  c.outline(INK);
  return c;
}

/** 4×4 sheet: rows: white-left, white-right, brown-left, brown-right. */
export function drawChickenSheet(): PixelCanvas {
  const c = new PixelCanvas(64, 64);
  [false, true].forEach((brown, i) => {
    for (let f = 0; f < 4; f++) {
      const left = chickenFrame(f, brown);
      c.blit(left, f * 16, i * 32);
      c.blit(mirror(left), f * 16, i * 32 + 16);
    }
  });
  return c;
}

// ---------------------------------------------------------------- bullfinch
function birdFrame(frame: number): PixelCanvas {
  // facing left: 0 sit, 1 hop, 2 wings up, 3 wings down
  const c = new PixelCanvas(12, 12);
  const y = frame === 1 ? -1 : 0;
  c.ellipse(2, 3 + y, 8, 7, hex('#7d8794')); // grey back
  c.ellipse(2, 5 + y, 6, 5, hex('#d9534f')); // red breast
  c.ellipse(1, 1 + y, 6, 5, hex('#1e1e22')); // black cap
  c.px(0, 4 + y, hex('#2b2b2b'));
  c.rect(9, 6 + y, 3, 2, hex('#1e1e22')); // tail
  if (frame === 2) c.rect(4, 0, 5, 2, hex('#3a3f48'));
  if (frame === 3) c.rect(4, 7, 5, 2, hex('#3a3f48'));
  if (frame < 2) c.px(4, 10, hex('#5a4030')).px(6, 10, hex('#5a4030'));
  c.outline(hex('#2b2420', 150));
  return c;
}

export function drawBirdSheet(): PixelCanvas {
  const c = new PixelCanvas(48, 24);
  for (let f = 0; f < 4; f++) {
    const left = birdFrame(f);
    c.blit(left, f * 12, 0);
    c.blit(mirror(left), f * 12, 12);
  }
  return c;
}

// ---------------------------------------------------------------- discovery icons (16×16)

function icon(name: (typeof ICON_ORDER)[number]): PixelCanvas {
  const c = new PixelCanvas(16, 16);
  const red = hex('#c8432f');
  const wood = hex('#8a5a34');
  const gold = hex('#e8b443');
  switch (name) {
    case 'mitten':
      c.ellipse(4, 2, 9, 11, red).ellipse(1, 6, 5, 5, red).rect(4, 12, 9, 3, hex('#f4f1ea'));
      c.px(7, 6, hex('#f4f1ea')).px(9, 8, hex('#f4f1ea'));
      break;
    case 'angel':
      c.rect(0, 0, 16, 16, hex('#cfdcee'));
      c.ellipse(5, 1, 6, 5, SNOW).ellipse(1, 5, 14, 6, SNOW).ellipse(4, 8, 8, 8, SNOW);
      break;
    case 'fish':
      c.rect(0, 0, 16, 16, hex('#bfe0ee'));
      c.ellipse(2, 5, 11, 6, hex('#6f8a5a')).rect(12, 5, 3, 6, hex('#58704a'));
      c.px(4, 7, hex('#1e1e22')).rect(3, 9, 2, 1, hex('#3f4f35'));
      break;
    case 'nest':
      c.ellipse(1, 7, 14, 8, hex('#7a5a3a')).ellipse(3, 7, 10, 4, hex('#4a3626'));
      for (const x of [3, 7, 10]) c.ellipse(x, 4, 4, 5, hex('#9a6a3a')).px(x + 1, 5, hex('#6a4626'));
      break;
    case 'sled':
      c.rect(2, 7, 12, 3, wood).rect(1, 12, 14, 2, hex('#5e3c22')).rect(3, 10, 2, 2, hex('#5e3c22')).rect(11, 10, 2, 2, hex('#5e3c22'));
      c.rect(0, 10, 2, 3, hex('#5e3c22')).rect(2, 7, 12, 1, SNOW);
      break;
    case 'horseshoe':
      c.ellipse(2, 2, 12, 13, hex('#7d8794'));
      for (let y = 3; y < 15; y++) for (let x = 5; x < 11; x++) c.data.fill(0, (y * 16 + x) * 4, (y * 16 + x) * 4 + 4);
      c.px(3, 6, hex('#2b2b2b')).px(12, 6, hex('#2b2b2b')).px(3, 10, hex('#2b2b2b')).px(12, 10, hex('#2b2b2b'));
      break;
    case 'glasses':
      c.ellipse(0, 5, 7, 7, hex('#3a2a20')).ellipse(9, 5, 7, 7, hex('#3a2a20'));
      c.ellipse(1, 6, 5, 5, hex('#d8ecf5')).ellipse(10, 6, 5, 5, hex('#d8ecf5'));
      c.rect(6, 7, 4, 1, hex('#3a2a20')).px(2, 7, SNOW).px(11, 7, SNOW);
      break;
    case 'jar':
      c.rect(3, 4, 10, 11, hex('#e8963a')).rect(3, 4, 10, 1, hex('#f4c27a'));
      c.rect(2, 2, 12, 3, hex('#c8432f')).rect(5, 8, 6, 4, hex('#f4f1ea')).rect(6, 9, 4, 1, hex('#6b4a2a'));
      break;
    case 'door':
      c.ellipse(0, 0, 16, 16, hex('#5b3a24'));
      c.ellipse(4, 3, 8, 13, hex('#a86a3a')).rect(4, 9, 8, 7, hex('#a86a3a'));
      c.rect(8, 4, 1, 12, hex('#7a4a28')).px(10, 10, gold);
      break;
    case 'tracks':
      c.rect(0, 0, 16, 16, hex('#eef3fa'));
      for (const [x, y] of [[2, 1], [8, 6], [3, 11]] as const) c.ellipse(x, y, 3, 4, hex('#8597b8')).ellipse(x + 3, y, 3, 4, hex('#8597b8'));
      break;
    case 'postcard':
      c.rect(0, 3, 16, 11, hex('#f4ead2')).rect(11, 4, 4, 4, red).rect(12, 5, 2, 2, gold);
      c.rect(2, 6, 6, 1, hex('#8a7a6a')).rect(2, 9, 7, 1, hex('#8a7a6a')).rect(2, 11, 5, 1, hex('#8a7a6a'));
      c.rect(9, 6, 1, 7, hex('#cbb894'));
      break;
    case 'snowflake': {
      const b = hex('#7fb6e0');
      c.rect(7, 1, 2, 14, b).rect(1, 7, 14, 2, b);
      for (let i = 0; i < 5; i++) c.px(3 + i * 2, 3 + i * 2, b).px(12 - i * 2, 3 + i * 2, b);
      c.px(5, 1, b).px(10, 1, b).px(5, 14, b).px(10, 14, b);
      break;
    }
    case 'gift':
      c.rect(2, 5, 12, 10, red).rect(7, 5, 2, 10, gold).rect(2, 8, 12, 2, gold);
      c.ellipse(3, 1, 5, 5, gold).ellipse(8, 1, 5, 5, gold);
      break;
    case 'heart':
      c.ellipse(1, 2, 8, 8, red).ellipse(7, 2, 8, 8, red);
      for (let y = 7; y < 15; y++) c.rect(1 + (y - 7), y, 14 - 2 * (y - 7), 1, red);
      c.px(4, 4, hex('#f08a7a'));
      break;
    case 'star':
      c.rect(7, 1, 2, 14, gold).rect(1, 6, 14, 3, gold).rect(4, 3, 8, 9, gold);
      c.rect(3, 11, 3, 3, gold).rect(10, 11, 3, 3, gold);
      break;
    case 'letter':
      c.rect(1, 3, 14, 10, hex('#f4ead2'));
      for (let i = 0; i < 7; i++) c.px(1 + i, 3 + i, hex('#cbb894')).px(14 - i, 3 + i, hex('#cbb894'));
      c.ellipse(6, 8, 4, 4, red);
      break;
  }
  c.outline(hex('#2b2420', 170));
  return c;
}

export function drawIconSheet(): PixelCanvas {
  const c = new PixelCanvas(128, 32);
  ICON_ORDER.forEach((name, i) => c.blit(icon(name), (i % 8) * 16, Math.floor(i / 8) * 16));
  return c;
}

// ---------------------------------------------------------------- fire (16×20, 4 frames)
export function drawFireSheet(): PixelCanvas {
  const c = new PixelCanvas(64, 20);
  for (let f = 0; f < 4; f++) {
    const r = mulberry32(40 + f);
    const ox = f * 16;
    const flame = (x: number, w: number, h: number, col: RGBA) => {
      for (let row = 0; row < h; row++) {
        const t = row / h;
        const half = Math.max(0, Math.round((w / 2) * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.1))));
        const sway = Math.round(Math.sin(t * 3 + f) * 1);
        c.rect(ox + x - half + sway, 19 - row, half * 2 || 1, 1, col);
      }
    };
    flame(8, 14, 12 + Math.floor(r() * 4), hex('#d9532f'));
    flame(8 + (f % 2 ? 1 : -1), 10, 10 + Math.floor(r() * 4), hex('#f08a2f'));
    flame(8, 6, 7 + Math.floor(r() * 3), hex('#ffd25a'));
    flame(8 + (f > 1 ? 1 : 0), 2, 4, hex('#fff4c0'));
    c.rect(ox + 1, 17, 14, 3, hex('#5b3a24')).rect(ox + 3, 16, 10, 1, hex('#7a4a28'));
  }
  return c;
}

// ---------------------------------------------------------------- interior tileset (8×2 × 32 px)
/** Tile ids of the interior tileset. Keep in sync with src/world/tiles.ts (INTERIOR_TILE). */
export function drawInteriorTileset(): PixelCanvas {
  const c = new PixelCanvas(256, 64);
  const at = (id: number) => [(id % 8) * 32, Math.floor(id / 8) * 32] as const;
  const board = (id: number, seed: number) => {
    const [x, y] = at(id);
    const r = mulberry32(seed);
    c.rect(x, y, 32, 32, hex('#a87648'));
    for (let row = 0; row < 32; row += 8) {
      c.rect(x, y + row, 32, 1, hex('#8a5e38'));
      const joint = Math.floor(r() * 28);
      c.rect(x + joint, y + row, 1, 8, hex('#8a5e38'));
      for (let k = 0; k < 3; k++) c.rect(x + Math.floor(r() * 28), y + row + 3 + Math.floor(r() * 3), 4, 1, hex('#b98656'));
    }
  };
  board(0, 1);
  board(1, 2);
  // 2,3: trasmatta – the striped Swedish rag rug
  const rug = (id: number, offset: number) => {
    const [x, y] = at(id);
    const stripes = ['#c8432f', '#f1e4c8', '#3f6e8a', '#f1e4c8', '#e8b443', '#f1e4c8', '#6b8f5a', '#f1e4c8'];
    for (let row = 0; row < 32; row += 4) c.rect(x, y + row, 32, 4, hex(stripes[((row / 4) + offset) % stripes.length]!));
    for (let row = 0; row < 32; row += 2) for (let col = (row / 2) % 2; col < 32; col += 4) c.px(x + col, y + row, hex('#00000018'));
  };
  rug(2, 0);
  rug(3, 4);
  {
    // 4: wallpaper (top wall)
    const [x, y] = at(4);
    c.rect(x, y, 32, 32, hex('#efe2c4'));
    for (let col = 2; col < 32; col += 8) {
      c.rect(x + col, y, 2, 32, hex('#d9c49a'));
      for (let row = 4; row < 32; row += 10) c.rect(x + col + 4, y + row, 2, 3, hex('#b8543a')).px(x + col + 5, y + row - 1, hex('#6b8f5a'));
    }
  }
  {
    // 5: wainscot (lower wall) with skirting
    const [x, y] = at(5);
    c.rect(x, y, 32, 32, hex('#7a4f30'));
    c.rect(x, y, 32, 3, hex('#5e3c22'));
    c.rect(x + 3, y + 6, 26, 20, hex('#8a5e38')).rect(x + 4, y + 7, 24, 18, hex('#7a4f30'));
    c.rect(x, y + 28, 32, 4, hex('#4a2e1a'));
  }
  {
    // 6: side wall (dark timber)
    const [x, y] = at(6);
    c.rect(x, y, 32, 32, hex('#4a2e1a'));
    c.rect(x + 12, y, 8, 32, hex('#5e3c22'));
  }
  {
    // 7: doormat
    const [x, y] = at(7);
    board(7, 3);
    c.rect(x + 2, y + 6, 28, 22, hex('#8a6a3a')).rect(x + 4, y + 8, 24, 18, hex('#a8844a'));
    for (let row = 9; row < 26; row += 3) c.rect(x + 5, y + row, 22, 1, hex('#8a6a3a'));
  }
  {
    // 8: hearth stones
    const [x, y] = at(8);
    c.rect(x, y, 32, 32, hex('#7d7a78'));
    for (let row = 0; row < 32; row += 8) for (let col = (row / 8) % 2 ? 0 : 8; col < 32; col += 16) c.rect(x + col, y + row, 15, 7, hex('#94908c'));
  }
  {
    // 9: bottom wall edge (front)
    const [x, y] = at(9);
    c.rect(x, y, 32, 32, hex('#2e1d12'));
    c.rect(x, y, 32, 4, hex('#5e3c22'));
  }
  board(10, 4);
  return c;
}

// ---------------------------------------------------------------- interior furniture
export function drawFireplace(): PixelCanvas {
  const W = 72;
  const H = 72;
  const c = new PixelCanvas(W, H);
  const stone = hex('#8e8a86');
  const stoneDark = hex('#6c6864');
  c.rect(14, 0, 44, 30, hex('#a8a29c')); // chimney breast
  for (let row = 2; row < 30; row += 6) for (let col = (row / 6) % 2 ? 14 : 18; col < 56; col += 9) c.rect(col, row, 7, 4, hex('#b9b3ac'));
  c.rect(4, 28, 64, 6, hex('#6b4a2a')).rect(4, 28, 64, 2, hex('#8a6038')); // mantel
  // greenery + candles on the mantel
  for (let x = 6; x < 66; x += 3) c.rect(x, 25 + ((x / 3) % 2), 3, 3, hex('#2f5d50'));
  for (const x of [10, 60]) c.rect(x, 18, 3, 8, hex('#f4ead2')).rect(x + 1, 15, 1, 3, hex('#ffd25a'));
  c.ellipse(32, 22, 8, 6, hex('#c8432f')); // a red bauble
  c.rect(6, 34, 60, 34, stone);
  for (let row = 36; row < 68; row += 6) for (let col = (row / 6) % 2 ? 6 : 10; col < 64; col += 10) c.rect(col, row, 8, 4, hex('#a29e98'));
  c.ellipse(18, 40, 36, 30, stoneDark);
  c.rect(18, 54, 36, 14, stoneDark);
  c.ellipse(20, 42, 32, 26, hex('#2a1c16'));
  c.rect(20, 55, 32, 13, hex('#2a1c16'));
  // stockings
  c.rect(12, 34, 6, 10, hex('#c8432f')).rect(10, 41, 6, 4, hex('#c8432f')).rect(12, 34, 6, 2, SNOW);
  c.rect(54, 34, 6, 10, hex('#3f6e5a')).rect(56, 41, 6, 4, hex('#3f6e5a')).rect(54, 34, 6, 2, SNOW);
  c.rect(0, 68, W, 4, hex('#6c6864'));
  return c;
}

function books(c: PixelCanvas, x: number, y: number, w: number, h: number, seed: number, density = 1): void {
  const r = mulberry32(seed);
  const cols = ['#c8432f', '#3f6e8a', '#e8b443', '#6b8f5a', '#7a4a6a', '#d98a5a', '#2f4a7a', '#f1e4c8', '#8a3b2b'];
  let bx = x;
  while (bx < x + w - 1) {
    const bw = 2 + Math.floor(r() * 3);
    const bh = Math.max(4, h - Math.floor(r() * 4));
    if (r() < density) {
      c.rect(bx, y + h - bh, bw, bh, hex(cols[Math.floor(r() * cols.length)]!));
      c.rect(bx, y + h - bh + 2, bw, 1, hex('#00000030'));
    }
    bx += bw;
  }
}

export function drawBookshelf(memories: boolean): PixelCanvas {
  const c = new PixelCanvas(48, 72);
  const wood = hex('#6b4a2a');
  c.rect(2, 4, 44, 66, wood).rect(4, 6, 40, 62, hex('#3a2616'));
  const shelves = [6, 22, 38, 54];
  shelves.forEach((sy, i) => {
    c.rect(4, sy + 14, 40, 2, wood);
    if (memories && i === 0) {
      c.rect(8, sy + 3, 9, 11, hex('#c8a43a')).rect(9, sy + 4, 7, 9, hex('#9fb6c8')); // framed photo
      c.ellipse(22, sy + 7, 6, 7, hex('#a87648')); // wooden figure
      c.ellipse(32, sy + 9, 8, 5, hex('#f4d9c8')).px(35, sy + 10, hex('#e0b0a0')); // shell
    } else if (memories && i === 1) {
      books(c, 5, sy, 18, 14, 70 + i);
      c.ellipse(28, sy + 6, 10, 8, hex('#e8b443')); // a jar of dates
      c.rect(29, sy + 4, 8, 2, hex('#c8432f'));
    } else books(c, 5, sy, 38, 14, 60 + i + (memories ? 20 : 0));
  });
  // overflowing: books stacked on top and leaning
  if (!memories) {
    books(c, 6, 0, 18, 6, 90);
    c.rect(26, 2, 14, 3, hex('#3f6e8a')).rect(27, 0, 12, 2, hex('#c8432f'));
  } else c.rect(6, 1, 30, 3, hex('#e8b443'));
  return c;
}

export function drawArmchair(): PixelCanvas {
  const c = new PixelCanvas(40, 40);
  const velvet = hex('#3f6e5a');
  const dark = hex('#2f5546');
  c.ellipse(2, 2, 36, 22, velvet); // back
  c.rect(2, 12, 36, 20, velvet);
  c.ellipse(0, 14, 10, 20, dark).ellipse(30, 14, 10, 20, dark); // arms
  c.ellipse(8, 18, 24, 14, hex('#4a8068')); // seat cushion with a Sonne-shaped dip
  c.ellipse(13, 21, 14, 7, hex('#3a6a54'));
  // knitted blanket over one arm
  for (let y = 10; y < 32; y++) c.rect(28, y, 9, 1, hex(y % 4 < 2 ? '#c8432f' : '#f1e4c8'));
  c.rect(4, 34, 3, 5, hex('#4a2e1a')).rect(33, 34, 3, 5, hex('#4a2e1a'));
  c.outline(hex('#2b2420', 140));
  return c;
}

export function drawSideTable(): PixelCanvas {
  const c = new PixelCanvas(28, 30);
  c.rect(12, 14, 4, 14, hex('#5e3c22')).rect(7, 27, 14, 3, hex('#5e3c22'));
  c.ellipse(1, 10, 26, 8, hex('#8a5e38')).ellipse(2, 10, 24, 6, hex('#a87648'));
  // teapot
  c.ellipse(6, 3, 10, 9, hex('#f4ead2')).rect(15, 5, 3, 2, hex('#f4ead2')).rect(4, 5, 2, 3, hex('#f4ead2'));
  c.rect(9, 1, 4, 2, hex('#c8432f')).px(8, 7, hex('#3f6e8a')).px(12, 6, hex('#3f6e8a'));
  // celery juice glass + dates
  c.rect(19, 4, 4, 7, hex('#9ccb5a')).rect(19, 4, 4, 1, hex('#d8f0b0'));
  c.ellipse(15, 11, 7, 3, hex('#7a4a28'));
  return c;
}

export function drawFloorLamp(): PixelCanvas {
  const c = new PixelCanvas(14, 46);
  c.rect(6, 12, 2, 32, hex('#3a2a20')).rect(3, 43, 8, 3, hex('#3a2a20'));
  for (let y = 0; y < 12; y++) {
    const half = 3 + Math.floor(y / 3);
    c.rect(7 - half, y, half * 2, 1, hex(y < 2 ? '#f4d68a' : '#e8b85a'));
  }
  c.rect(1, 11, 12, 1, hex('#c8943a'));
  return c;
}

export function drawWoodBasket(): PixelCanvas {
  const c = new PixelCanvas(26, 18);
  c.rect(1, 6, 24, 12, hex('#9a7a4a'));
  for (let x = 2; x < 25; x += 3) c.rect(x, 6, 1, 12, hex('#7a5a32'));
  for (const [x, y] of [[3, 2], [9, 0], [15, 2], [8, 4]] as const) c.ellipse(x, y, 8, 5, hex('#b07a4a')).px(x + 3, y + 2, hex('#7a4a28'));
  c.outline(hex('#2b2420', 120));
  return c;
}

export function drawRoomWindow(): PixelCanvas {
  const c = new PixelCanvas(36, 36);
  c.rect(2, 2, 32, 30, hex('#fdfcf7'));
  c.rect(5, 5, 26, 24, hex('#1d2a44'));
  const r = mulberry32(77);
  for (let i = 0; i < 18; i++) c.px(5 + Math.floor(r() * 26), 5 + Math.floor(r() * 18), SNOW);
  c.rect(5, 23, 26, 6, SNOW_SHADE).rect(5, 22, 26, 1, SNOW);
  c.rect(17, 5, 2, 24, hex('#fdfcf7')).rect(5, 16, 26, 2, hex('#fdfcf7'));
  // curtains
  c.rect(0, 0, 6, 34, hex('#c8432f')).rect(30, 0, 6, 34, hex('#c8432f'));
  for (let y = 0; y < 34; y += 3) c.px(2, y, hex('#e86a5a')).px(33, y, hex('#e86a5a'));
  c.rect(0, 32, 36, 4, hex('#f4ead2'));
  c.rect(8, 30, 6, 2, hex('#6b8f5a')).rect(10, 27, 2, 3, hex('#c8432f')); // a little poinsettia on the sill
  return c;
}

export function drawBookPile(): PixelCanvas {
  const c = new PixelCanvas(20, 16);
  const cols = ['#c8432f', '#3f6e8a', '#e8b443', '#6b8f5a'];
  cols.forEach((col, i) => c.rect(2 + (i % 2) * 2, 12 - i * 3, 15 - (i % 2) * 3, 3, hex(col)).rect(2 + (i % 2) * 2, 12 - i * 3, 15 - (i % 2) * 3, 1, hex('#f4ead2')));
  c.outline(hex('#2b2420', 120));
  return c;
}

export function drawCoop(): PixelCanvas {
  const c = new PixelCanvas(44, 38);
  c.rect(4, 14, 36, 22, hex('#a3302a'));
  for (let x = 7; x < 40; x += 5) c.rect(x, 14, 1, 22, hex('#86261f'));
  c.rect(17, 22, 10, 14, hex('#3a2616')).rect(17, 22, 10, 1, hex('#fdfcf7'));
  c.rect(2, 4, 40, 12, hex('#e3eaf4')).rect(2, 14, 40, 2, hex('#4a3a3a')).rect(2, 4, 40, 2, hex('#7d8aa0'));
  c.rect(10, 34, 26, 4, hex('#c9b27a')); // straw
  c.rect(30, 20, 6, 5, hex('#fdfcf7')).rect(31, 21, 4, 3, hex('#ffd27a'));
  return c;
}
