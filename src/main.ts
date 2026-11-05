import Phaser from 'phaser';
import { strings } from '../content/strings';
import { createGameConfig } from './config';
import { app } from './game/App';
import { bus } from './systems/EventBus';
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

// for debugging in the browser console
(window as unknown as { snobyn?: unknown }).snobyn = { game, app };
