/**
 * Story UI on the HTML layer: dialogue box, speech bubbles above people & animals,
 * discovery cards and title cards. Real <button>s everywhere a tap is needed, so
 * iOS Safari reliably delivers taps (it ignores clicks on plain divs).
 */
import { strings } from '../../content/strings';
import { bus } from '../systems/EventBus';
import { spritePreview } from './spritePreview';

export interface DialogueLine {
  speaker?: string;
  role?: string;
  text: string;
  action?: boolean;
}

type Anchor = () => { x: number; y: number } | null;

const isTouch = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Tells the world to pause input while something is open. */
function blocking(id: string, open: boolean): void {
  bus.emit('ui:blocking', { id, open });
}

// ---------------------------------------------------------------- dialogue
export class DialogueBox {
  private layer = el('div', 'layer layer-dialogue');
  private active = false;
  private advance: (() => void) | null = null;

  constructor(root: HTMLElement) {
    root.append(this.layer);
    document.addEventListener('keydown', (e) => {
      if (!this.active || e.repeat) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        this.advance?.();
      }
    });
  }

  get open(): boolean {
    return this.active;
  }

  /** Shows the lines one after another. Resolves when the last one is dismissed. */
  async show(lines: DialogueLine[]): Promise<void> {
    if (!lines.length) return;
    // only one dialogue at a time: queue behind the current one
    while (this.active) await new Promise((r) => setTimeout(r, 120));
    this.active = true;
    blocking('dialogue', true);

    // A full-screen transparent button catches every tap (iOS-safe), the panel sits on top.
    const catcher = el('button', 'dialogue-catcher');
    catcher.type = 'button';
    catcher.setAttribute('aria-label', strings.tapToContinue);
    const panel = el('div', 'dialogue');
    const name = el('div', 'dialogue-name');
    const role = el('span', 'dialogue-role');
    const body = el('p', 'dialogue-text');
    const hint = el('div', 'dialogue-hint', isTouch() ? strings.tapToContinue : strings.keyToContinue);
    panel.append(name, body, hint);
    catcher.append(panel);
    this.layer.replaceChildren(catcher);
    // ignore the tap that opened us (iOS sends click after touchend)
    const openedAt = performance.now();

    for (const line of lines) {
      name.replaceChildren(document.createTextNode(line.speaker ?? ''), role);
      role.textContent = line.role ? ` · ${line.role}` : '';
      name.style.visibility = line.speaker ? 'visible' : 'hidden';
      body.classList.toggle('action', !!line.action);
      await this.type(body, line.text, catcher, openedAt);
    }
    this.layer.replaceChildren();
    this.advance = null;
    this.active = false;
    blocking('dialogue', false);
  }

  private type(body: HTMLElement, text: string, catcher: HTMLButtonElement, openedAt: number): Promise<void> {
    return new Promise((resolve) => {
      let shown = 0;
      body.textContent = '';
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const timer = setInterval(() => {
        shown = Math.min(text.length, shown + 2);
        body.textContent = text.slice(0, shown);
        if (shown >= text.length) clearInterval(timer);
      }, reduce ? 1 : 28);
      const next = () => {
        if (performance.now() - openedAt < 250) return;
        if (shown < text.length) {
          shown = text.length;
          body.textContent = text;
          clearInterval(timer);
          return;
        }
        catcher.removeEventListener('click', next);
        resolve();
      };
      this.advance = next;
      catcher.addEventListener('click', next);
    });
  }
}

// ---------------------------------------------------------------- bubbles
interface Bubble {
  el: HTMLElement;
  anchor: Anchor;
  until: number;
}

export class Bubbles {
  private layer = el('div', 'layer layer-bubbles');
  private list: Bubble[] = [];

  constructor(root: HTMLElement) {
    root.append(this.layer);
  }

  /** `anchor` returns the CSS-pixel point above the speaker's head (or null if gone). */
  show(anchor: Anchor, text: string, action: boolean, ms?: number): void {
    const b = el('div', `bubble${action ? ' action' : ''}`, text);
    this.layer.append(b);
    const duration = ms ?? Math.min(6500, 2200 + text.length * 45);
    this.list.push({ el: b, anchor, until: performance.now() + duration });
    while (this.list.length > 4) this.remove(0);
    this.tick();
  }

  clear(): void {
    while (this.list.length) this.remove(0);
  }

  /** Called every frame by the world to keep bubbles above their speakers – stacked, never overlapping. */
  tick(): void {
    const now = performance.now();
    const placed: { l: number; r: number; t: number; b: number }[] = [];
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i]!;
      if (now > b.until || !b.anchor()) this.remove(i);
    }
    // oldest first keeps its spot; newer bubbles move up out of the way
    for (const b of this.list) {
      const p = b.anchor()!;
      const w = b.el.offsetWidth;
      const h = b.el.offsetHeight + 8; // + tail
      const x = Math.max(w / 2 + 6, Math.min(window.innerWidth - w / 2 - 6, p.x));
      let y = p.y;
      for (let guard = 0; guard < 6; guard++) {
        const hit = placed.find((r) => x - w / 2 < r.r && x + w / 2 > r.l && y - h < r.b && y > r.t);
        if (!hit) break;
        y = hit.t - 2;
      }
      placed.push({ l: x - w / 2, r: x + w / 2, t: y - h, b: y });
      b.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
      b.el.classList.toggle('fading', b.until - now < 400);
    }
  }

  private remove(i: number): void {
    const [b] = this.list.splice(i, 1);
    b?.el.remove();
  }
}

// ---------------------------------------------------------------- cards
export interface DiscoveryCardData {
  title: string;
  text: string;
  extras: string[];
  iconFrame: number;
  count: string;
}

export class Cards {
  private layer = el('div', 'layer layer-cards');
  private titleEl = el('div', 'title-banner');

  constructor(root: HTMLElement) {
    root.append(this.layer, this.titleEl);
  }

  discovery(d: DiscoveryCardData): Promise<void> {
    return new Promise((resolve) => {
      blocking('card', true);
      const backdrop = el('div', 'backdrop');
      const card = el('div', 'card discovery-card');
      const pic = el('div', 'discovery-pic');
      pic.append(spritePreview('icons', '', 5, false, d.iconFrame));
      card.append(el('div', 'discovery-header', strings.discoveryHeader), pic, el('h2', 'discovery-title', d.title), el('p', 'discovery-text', d.text));
      for (const x of d.extras) card.append(el('p', 'discovery-extra', x));
      card.append(el('p', 'discovery-count', d.count));
      const close = el('button', 'btn btn-primary', strings.discoveryClose);
      close.type = 'button';
      const done = () => {
        document.removeEventListener('keydown', onKey);
        this.layer.replaceChildren();
        blocking('card', false);
        resolve();
      };
      const onKey = (e: KeyboardEvent) => {
        if (!e.repeat && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || e.key === 'e')) {
          e.preventDefault();
          done();
        }
      };
      close.addEventListener('click', done);
      const actions = el('div', 'actions');
      actions.append(close);
      card.append(actions);
      backdrop.append(card);
      this.layer.replaceChildren(backdrop);
      // let the key press that found it pass before listening
      setTimeout(() => document.addEventListener('keydown', onKey), 200);
      close.focus({ preventScroll: true });
    });
  }

  /** Banner at the top, e.g. when entering the Sonnenpalast. `special` = golden with sparkles. */
  title(title: string, subtitle: string, special = false): void {
    this.titleEl.className = `title-banner${special ? ' special' : ''}`;
    this.titleEl.replaceChildren(el('strong', '', title), el('span', '', subtitle));
    if (special) for (let i = 0; i < 9; i++) {
      const s = el('i', 'sparkle');
      s.style.left = `${8 + i * 10.5}%`;
      s.style.animationDelay = `${(i % 4) * 0.35}s`;
      this.titleEl.append(s);
    }
    void this.titleEl.offsetWidth; // restart the animation
    this.titleEl.classList.add('show');
    setTimeout(() => this.titleEl.classList.remove('show'), special ? 4200 : 2800);
  }
}
