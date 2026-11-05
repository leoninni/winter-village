import Phaser from 'phaser';
import { gameConfig } from './config';
import { mountOverlay } from './ui/overlay';
import './ui/styles.css';

// iOS Safari: stop pinch-zoom gestures from zooming the page instead of playing.
document.addEventListener('gesturestart', (e) => e.preventDefault());

const uiRoot = document.getElementById('ui');
if (uiRoot) mountOverlay(uiRoot);

new Phaser.Game(gameConfig);
