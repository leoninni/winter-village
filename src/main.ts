import Phaser from 'phaser';
import { strings } from '../content/strings';
import { createGameConfig } from './config';
import { app } from './game/App';
import { bus } from './systems/EventBus';
import { debugEnabled } from './debug/hooks';
import type { GagId } from './entities/companions/Companion';
import { keepViewportFitted } from './systems/viewport';
import { mountOverlay } from './ui/overlay';
import './ui/styles.css';

document.title = strings.gameTitle;

// iOS Safari: stop pinch/double-tap gestures from zooming the page instead of playing.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

const game = new Phaser.Game(createGameConfig());
keepViewportFitted(game);

// --- scene flow (start screen ⇄ village), wired through the event bus
let assetsReady = false;
let wantWorld = false;
game.events.once('assets-ready', () => {
  assetsReady = true;
  if (wantWorld) enterWorld();
});

function enterWorld(): void {
  wantWorld = true;
  if (!assetsReady) return;
  wantWorld = false;
  game.scene.stop('Title');
  game.scene.start('World');
}

bus.on('flow:enter-world', enterWorld);
bus.on('flow:to-title', () => {
  game.scene.stop('World');
  game.scene.start('Title');
});

const uiRoot = document.getElementById('ui');
if (uiRoot) mountOverlay(uiRoot, app);

// ?debug=1 → testing panel (never shown without the flag)
if (debugEnabled()) {
  void import('./debug/DebugPanel').then(({ mountDebugPanel }) =>
    mountDebugPanel({
      restartWorld: (gag?: GagId) => {
        game.scene.stop('Title');
        game.scene.stop('World');
        game.scene.start('World', gag ? { debugGag: gag } : {});
      },
    }),
  );
  // handy in the browser console, too
  (window as unknown as { snobyn?: unknown }).snobyn = { game, app };
}
