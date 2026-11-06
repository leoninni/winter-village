/**
 * Minimal pixel canvas + PNG encoder (RGBA, no dependencies) for generating
 * placeholder art. Only used by the tools/ scripts, never shipped to the game.
 */
import { deflateSync } from 'node:zlib';
import { DIRECTIONS, type Direction } from '../content/sprites';

export type RGBA = [number, number, number, number];

export function hex(color: string, alpha = 255): RGBA {
  const c = color.replace('#', '');
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
    c.length === 8 ? parseInt(c.slice(6, 8), 16) : alpha,
  ];
}

export class PixelCanvas {
  readonly data: Uint8Array;
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = new Uint8Array(width * height * 4);
  }

  /** Alpha-blends one pixel (ignores out-of-bounds). */
  px(x: number, y: number, c: RGBA): this {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return this;
    const i = (y * this.width + x) * 4;
    const a = c[3] / 255;
    if (a >= 1) {
      this.data.set(c, i);
      return this;
    }
    const d = this.data;
    const da = (d[i + 3] ?? 0) / 255;
    const outA = a + da * (1 - a);
    if (outA === 0) return this;
    for (let k = 0; k < 3; k++) {
      d[i + k] = Math.round((c[k]! * a + (d[i + k] ?? 0) * da * (1 - a)) / outA);
    }
    d[i + 3] = Math.round(outA * 255);
    return this;
  }

  rect(x: number, y: number, w: number, h: number, c: RGBA): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.px(xx, yy, c);
    return this;
  }

  /** Filled ellipse inside the box (x, y, w, h), pixel-exact. */
  ellipse(x: number, y: number, w: number, h: number, c: RGBA): this {
    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        const dx = (xx + 0.5 - cx) / rx;
        const dy = (yy + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(xx, yy, c);
      }
    }
    return this;
  }

  /** Copies another canvas onto this one at (dx, dy). */
  blit(src: PixelCanvas, dx: number, dy: number): this {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const i = (y * src.width + x) * 4;
        const a = src.data[i + 3] ?? 0;
        if (a > 0) {
          this.px(dx + x, dy + y, [src.data[i]!, src.data[i + 1]!, src.data[i + 2]!, a]);
        }
      }
    }
    return this;
  }

  /** Adds a 1px outline of colour `c` around all opaque pixels. */
  outline(c: RGBA): this {
    const copy = new Uint8Array(this.data);
    const opaque = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < this.width && y < this.height && (copy[(y * this.width + x) * 4 + 3] ?? 0) > 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (opaque(x, y)) continue;
        if (opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1)) this.px(x, y, c);
      }
    }
    return this;
  }

  toPNG(): Buffer {
    const raw = Buffer.alloc((this.width * 4 + 1) * this.height);
    for (let y = 0; y < this.height; y++) {
      raw[y * (this.width * 4 + 1)] = 0; // filter: none
      Buffer.from(this.data.buffer, y * this.width * 4, this.width * 4).copy(
        raw,
        y * (this.width * 4 + 1) + 1,
      );
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // RGBA
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

export function mirror(src: PixelCanvas): PixelCanvas {
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
export function sheet(fw: number, fh: number, draw: (dir: Direction, frame: number) => PixelCanvas): PixelCanvas {
  const c = new PixelCanvas(fw * 4, fh * 4);
  DIRECTIONS.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      const f = dir === 'right' ? mirror(draw('left', frame)) : draw(dir, frame);
      c.blit(f, frame * fw, row * fh);
    }
  });
  return c;
}


/** Small deterministic RNG so generated art/maps are identical on every run. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
