/**
 * Shows a frame of a game sprite sheet as a crisp, enlarged HTML element (for the
 * select screens), optionally animated. Uses the same manifest as the game, so
 * final art shows up here automatically.
 */
import { kratziNeck, sprites, type SpriteKey } from '../../content/sprites';

const sheetColumns = new Map<SpriteKey, number>();
const animated = new Set<{ el: HTMLElement; key: SpriteKey; frames: number[]; scale: number; i: number }>();
let ticker: ReturnType<typeof setInterval> | null = null;

function url(file: string): string {
  return `${import.meta.env.BASE_URL}${file}`;
}

function setFrame(el: HTMLElement, key: SpriteKey, frame: number, scale: number): void {
  const def = sprites[key];
  const cols = sheetColumns.get(key) ?? 4;
  const col = frame % cols;
  const row = Math.floor(frame / cols);
  el.style.backgroundPosition = `${-col * def.frameWidth * scale}px ${-row * def.frameHeight * scale}px`;
}

/** One sprite frame (or looping animation) at `scale`× size. */
export function spritePreview(key: SpriteKey, anim: string, scale: number, animate = false, frame?: number): HTMLElement {
  const def = sprites[key];
  const frames = frame !== undefined ? [frame] : ((def.anims as Record<string, { frames: number[] }>)[anim]?.frames ?? [0]);
  const el = document.createElement('div');
  el.className = 'sprite-preview';
  el.style.width = `${def.frameWidth * scale}px`;
  el.style.height = `${def.frameHeight * scale}px`;
  el.style.backgroundImage = `url("${url(def.file)}")`;

  const img = new Image();
  img.onload = () => {
    sheetColumns.set(key, Math.max(1, Math.round(img.naturalWidth / def.frameWidth)));
    el.style.backgroundSize = `${img.naturalWidth * scale}px ${img.naturalHeight * scale}px`;
    setFrame(el, key, frames[0] ?? 0, scale);
  };
  img.src = url(def.file);

  if (animate && frames.length > 1) {
    animated.add({ el, key, frames, scale, i: 0 });
    ticker ??= setInterval(tick, 130);
  }
  return el;
}

function tick(): void {
  for (const a of animated) {
    if (!a.el.isConnected) {
      animated.delete(a);
      continue;
    }
    a.i = (a.i + 1) % a.frames.length;
    setFrame(a.el, a.key, a.frames[a.i]!, a.scale);
  }
  if (animated.size === 0 && ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

/** Kratzi sitting on his sled (three layered sprites). */
export function kratziPreview(scale: number, animate = false): HTMLElement {
  const box = document.createElement('div');
  box.className = 'sprite-stack';
  const W = 32;
  const H = 38;
  box.style.width = `${W * scale}px`;
  box.style.height = `${H * scale}px`;
  const bump = animate ? 'walk-down' : 'idle-down';
  const layer = (key: SpriteKey, anim: string, feetX: number, feetY: number) => {
    const el = spritePreview(key, anim, scale, animate);
    const def = sprites[key];
    el.style.left = `${(feetX - def.feet.x) * scale}px`;
    el.style.top = `${(feetY - def.feet.y) * scale}px`;
    box.append(el);
  };
  const sledFeet = { x: 16, y: 36 };
  const bodyFeet = { x: sledFeet.x, y: sledFeet.y - 7 };
  const neck = kratziNeck.down;
  layer('sled', 'front', sledFeet.x, sledFeet.y);
  layer('kratzi', bump, bodyFeet.x, bodyFeet.y);
  layer('kratzi-head', 'idle-down', bodyFeet.x + neck.x - sprites.kratzi.feet.x, bodyFeet.y + neck.y - sprites.kratzi.feet.y);
  return box;
}
