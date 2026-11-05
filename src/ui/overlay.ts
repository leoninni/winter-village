import { strings } from '../../content/strings';
import { bus } from '../systems/EventBus';

/**
 * HTML overlay on top of the Phaser canvas: crisp text on retina screens, native
 * inputs for iOS. Phase 0 shows the title card and one test button.
 */
export function mountOverlay(root: HTMLElement): void {
  root.innerHTML = '';

  const card = el('div', 'title-card');
  card.append(
    el('h1', 'title', strings.gameTitle),
    el('p', 'subtitle', strings.gameSubtitle),
    el('p', 'coming-soon', strings.comingSoon),
  );

  const button = el('button', 'btn', strings.snowButton) as HTMLButtonElement;
  button.type = 'button';
  button.addEventListener('click', () => bus.emit('ui:snow-burst'));
  card.append(button, el('p', 'save-note', strings.saveNote));

  root.append(card);
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
