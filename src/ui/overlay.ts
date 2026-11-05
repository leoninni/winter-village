/**
 * HTML overlay above the canvas: start screen, character & companion select,
 * the in-village HUD (menu button, place names, controls hint) and dialogs.
 * Crisp text on retina phones and real buttons for iOS. All texts from content/.
 */
import { characters, type CharacterId } from '../../content/characters';
import { companions, type CompanionId } from '../../content/companions';
import { places } from '../../content/places';
import { strings } from '../../content/strings';
import { bus } from '../systems/EventBus';
import { kratziPreview, spritePreview } from './spritePreview';

interface AppLike {
  readonly hasProgress: boolean;
  readonly state: { character: CharacterId | null; companion: CompanionId | null };
  readonly saves: { available: boolean };
  startNewGame(c: CharacterId, k: CompanionId): void;
  continueGame(): void;
  startOver(): void;
}

const isTouch = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label: string, kind: 'primary' | 'secondary' | 'danger', onClick: () => void): HTMLButtonElement {
  const b = el('button', `btn btn-${kind}`, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

class Overlay {
  private screen = el('div', 'layer layer-screen');
  private hud = el('div', 'layer layer-hud');
  private toastEl = el('div', 'toast');
  private hintEl = el('div', 'hint');
  private modal = el('div', 'layer layer-modal');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private hintShown = false;
  private menuOpen = false;

  constructor(
    root: HTMLElement,
    private readonly app: AppLike,
  ) {
    root.innerHTML = '';
    root.append(this.screen, this.hud, this.modal);
    // Esc is handled here, not in Phaser: Phaser 4's keyboard queue can deliver a
    // single Esc press twice in one frame (seen right after arrow keys), which
    // would open and instantly close the menu.
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || e.repeat) return;
      const inWorld = this.hud.childElementCount > 0;
      if (inWorld) this.toggleMenu();
      else if (this.modal.childElementCount) this.closeModal();
    });
  }

  // ------------------------------------------------------------ start screen
  showStart(): void {
    this.hud.replaceChildren();
    this.closeModal();
    const card = el('div', 'card title-card');
    card.append(el('h1', 'title', strings.gameTitle), el('p', 'subtitle', strings.gameSubtitle));

    const actions = el('div', 'actions');
    const { character, companion } = this.app.state;
    if (this.app.hasProgress && character && companion) {
      const who = strings.continueAs
        .replace('{character}', characters.find((c) => c.id === character)?.name ?? '')
        .replace('{companion}', companions.find((c) => c.id === companion)?.name ?? '');
      card.append(el('p', 'welcome', strings.welcomeBack), el('p', 'who', who));
      actions.append(
        button(strings.continueGame, 'primary', () => this.app.continueGame()),
        button(strings.startOver, 'secondary', () => this.confirmStartOver()),
      );
    } else {
      actions.append(button(strings.newGame, 'primary', () => this.showCharacterSelect()));
    }
    card.append(actions, el('p', 'save-note', this.app.saves.available ? strings.saveNote : strings.noStorageNote));
    this.screen.replaceChildren(card);
    this.screen.classList.add('active');
    actions.querySelector('button')?.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------ select screens
  private showCharacterSelect(selected: CharacterId | null = null): void {
    let choice = selected;
    const card = el('div', 'card select-card');
    card.append(el('h2', 'select-title', strings.chooseCharacter));
    const list = el('div', 'choices');
    const next = button(strings.next, 'primary', () => choice && this.showCompanionSelect(choice));
    next.disabled = !choice;

    const render = () => {
      list.replaceChildren(
        ...characters.map((c) =>
          this.choiceCard(c.name, c.blurb, spritePreview(c.id, choice === c.id ? 'walk-down' : 'idle-down', 3, choice === c.id), choice === c.id, () => {
            choice = c.id;
            next.disabled = false;
            render();
          }),
        ),
      );
    };
    render();
    const actions = el('div', 'actions');
    actions.append(button(strings.back, 'secondary', () => this.showStart()), next);
    card.append(list, actions);
    this.screen.replaceChildren(card);
  }

  private showCompanionSelect(character: CharacterId): void {
    let choice: CompanionId | null = null;
    const card = el('div', 'card select-card');
    card.append(el('h2', 'select-title', strings.chooseCompanion));
    const list = el('div', 'choices');
    const go = button(strings.enterVillage, 'primary', () => choice && this.app.startNewGame(character, choice));
    go.disabled = true;

    const render = () => {
      list.replaceChildren(
        ...companions.map((c) => {
          const active = choice === c.id;
          const preview = c.id === 'kratzi' ? kratziPreview(3, active) : spritePreview(c.id, active ? 'walk-down' : 'idle-down', 3, active);
          return this.choiceCard(c.name, c.blurb, preview, active, () => {
            choice = c.id;
            go.disabled = false;
            render();
          });
        }),
      );
    };
    render();
    const actions = el('div', 'actions');
    actions.append(button(strings.back, 'secondary', () => this.showCharacterSelect(character)), go);
    card.append(list, actions);
    this.screen.replaceChildren(card);
  }

  private choiceCard(name: string, blurb: string, preview: HTMLElement, active: boolean, onPick: () => void): HTMLElement {
    const b = el('button', `choice${active ? ' active' : ''}`);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(active));
    const pic = el('div', 'choice-pic');
    pic.append(preview);
    const text = el('div', 'choice-text');
    text.append(el('span', 'choice-name', name), el('span', 'choice-blurb', blurb));
    b.append(pic, text);
    b.addEventListener('click', onPick);
    return b;
  }

  // ------------------------------------------------------------ in the village
  showWorld(): void {
    this.screen.replaceChildren();
    this.screen.classList.remove('active');
    this.closeModal();
    const menuBtn = el('button', 'btn hud-menu', strings.menuButton);
    menuBtn.type = 'button';
    menuBtn.addEventListener('click', () => this.toggleMenu());
    this.toastEl.classList.remove('show');
    this.hud.replaceChildren(menuBtn, this.toastEl, this.hintEl);
    if (!this.hintShown) {
      this.hintShown = true;
      this.hintEl.textContent = isTouch() ? strings.controlsTouch : strings.controlsKeyboard;
      this.hintEl.classList.add('show');
      setTimeout(() => this.hintEl.classList.remove('show'), 7000);
    }
  }

  placeToast(id: string): void {
    const place = (places as Record<string, { name: string; subtitle: string }>)[id];
    if (!place) return;
    this.toastEl.replaceChildren(el('strong', '', place.name), el('span', '', place.subtitle));
    this.toastEl.classList.add('show');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 2600);
  }

  toggleMenu(): void {
    if (this.menuOpen) this.closeModal();
    else this.openMenu();
  }

  private openMenu(): void {
    const card = el('div', 'card menu-card');
    card.append(
      el('h2', 'select-title', strings.menuTitle),
      el('p', 'menu-hint', isTouch() ? strings.controlsTouch : strings.controlsKeyboard),
    );
    const actions = el('div', 'actions actions-stack');
    actions.append(
      button(strings.resume, 'primary', () => this.closeModal()),
      button(strings.startOver, 'secondary', () => this.confirmStartOver()),
    );
    card.append(actions, el('p', 'save-note', this.app.saves.available ? strings.saveNote : strings.noStorageNote));
    this.openModal(card, true);
  }

  private confirmStartOver(): void {
    const card = el('div', 'card menu-card');
    card.append(el('h2', 'select-title', strings.confirmStartOverTitle), el('p', 'confirm-text', strings.confirmStartOverText));
    const actions = el('div', 'actions actions-stack');
    const wasInWorld = this.menuOpen || this.hud.childElementCount > 0;
    actions.append(
      button(strings.confirmNo, 'primary', () => (wasInWorld ? this.openMenu() : this.closeModal())),
      button(strings.confirmYes, 'danger', () => {
        this.closeModal();
        this.app.startOver();
      }),
    );
    card.append(actions);
    this.openModal(card, wasInWorld);
  }

  private openModal(card: HTMLElement, isMenu: boolean): void {
    const backdrop = el('div', 'backdrop');
    backdrop.append(card);
    this.modal.replaceChildren(backdrop);
    if (isMenu && !this.menuOpen) {
      this.menuOpen = true;
      bus.emit('ui:menu', { open: true });
    }
    card.querySelector('button')?.focus({ preventScroll: true });
  }

  private closeModal(): void {
    this.modal.replaceChildren();
    if (this.menuOpen) {
      this.menuOpen = false;
      bus.emit('ui:menu', { open: false });
    }
  }
}

export function mountOverlay(root: HTMLElement, app: AppLike): void {
  const ui = new Overlay(root, app);
  ui.showStart();
  bus.on('flow:enter-world', () => ui.showWorld());
  bus.on('flow:to-title', () => ui.showStart());
  bus.on('world:area-entered', ({ id }) => ui.placeToast(id));
}
