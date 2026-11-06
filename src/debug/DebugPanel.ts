/**
 * Testing helper – only exists with ?debug=1 in the URL (never otherwise).
 * Teleport, trigger companion gags instantly (no cooldowns), reveal all discovery
 * spots, switch character/companion, reset the save.
 * Not player-facing, so labels live here instead of content/.
 */
import { characters, type CharacterId } from '../../content/characters';
import { companions, type CompanionId } from '../../content/companions';
import type { GagId } from '../entities/companions/Companion';
import { app } from '../game/App';
import { debugHooks } from './hooks';

const GAGS: { id: GagId; label: string; companion: CompanionId }[] = [
  { id: 'kratzi-head-pop', label: 'Kratzi: Kopf ab', companion: 'kratzi' },
  { id: 'kratzi-notice', label: 'Kratzi: bemerkt was', companion: 'kratzi' },
  { id: 'pauli-stuck', label: 'Pauli: steckt fest', companion: 'pauli' },
  { id: 'pauli-dig', label: 'Pauli: buddelt', companion: 'pauli' },
  { id: 'teddy-sniff', label: 'Teddy: schnüffelt', companion: 'teddy' },
];

export interface DebugActions {
  /** restart the village with the current save (e.g. after switching companion) */
  restartWorld(gag?: GagId): void;
}

export function mountDebugPanel(actions: DebugActions): void {
  const root = document.createElement('div');
  root.className = 'debug';
  root.innerHTML = `
    <button type="button" class="debug-toggle" aria-label="Debug">🐞</button>
    <div class="debug-panel" hidden>
      <div class="debug-info">–</div>
      <label>Teleport <select class="debug-tp"></select></label>
      <div class="debug-row debug-gags"></div>
      <div class="debug-row">
        <label><input type="checkbox" class="debug-spots"> Entdeckungen zeigen</label>
      </div>
      <div class="debug-row">
        <select class="debug-char">${characters.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
        <select class="debug-comp">${companions.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
        <button type="button" class="debug-switch">Wechseln</button>
      </div>
      <div class="debug-row">
        <button type="button" class="debug-reset">Spielstand löschen</button>
      </div>
    </div>`;
  document.body.append(root);
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const panel = $<HTMLDivElement>('.debug-panel');
  const info = $<HTMLDivElement>('.debug-info');
  const tp = $<HTMLSelectElement>('.debug-tp');
  const charSel = $<HTMLSelectElement>('.debug-char');
  const compSel = $<HTMLSelectElement>('.debug-comp');

  $<HTMLButtonElement>('.debug-toggle').addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    refresh();
  });

  for (const g of GAGS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = g.label;
    b.addEventListener('click', () => {
      if (!debugHooks()) return;
      if (app.state.companion !== g.companion) {
        app.state.companion = g.companion;
        app.saveNow();
        actions.restartWorld(g.id);
      } else debugHooks()?.gag(g.id);
    });
    $<HTMLDivElement>('.debug-gags').append(b);
  }

  tp.addEventListener('change', () => {
    if (tp.value) debugHooks()?.teleport(tp.value);
    tp.value = '';
  });
  $<HTMLInputElement>('.debug-spots').addEventListener('change', (e) => debugHooks()?.showSpots((e.target as HTMLInputElement).checked));
  $<HTMLButtonElement>('.debug-switch').addEventListener('click', () => {
    if (!app.hasProgress) return;
    app.state.character = charSel.value as CharacterId;
    app.state.companion = compSel.value as CompanionId;
    app.saveNow();
    actions.restartWorld();
  });
  $<HTMLButtonElement>('.debug-reset').addEventListener('click', () => {
    if (!confirm('Spielstand wirklich löschen?')) return;
    app.saves.clear();
    window.location.reload();
  });

  function refresh(): void {
    const h = debugHooks();
    info.textContent = h ? h.info() : 'nicht im Dorf';
    if (app.state.character) charSel.value = app.state.character;
    if (app.state.companion) compSel.value = app.state.companion;
    const targets = h?.targets() ?? [];
    if (tp.dataset.targets !== targets.join(',')) {
      tp.dataset.targets = targets.join(',');
      tp.innerHTML = `<option value="">— wohin? —</option>${targets.map((t) => `<option value="${t}">${t}</option>`).join('')}`;
    }
  }
  setInterval(() => !panel.hidden && refresh(), 500);
}
