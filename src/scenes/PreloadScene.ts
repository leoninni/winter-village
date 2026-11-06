import Phaser from 'phaser';
import { sprites } from '../../content/sprites';
import { MAPS, mapCacheKey, type MapKey } from '../world/maps';
import { props } from '../world/props';
import { INTERIOR_TILESET, TILESET } from '../world/tiles';

/** Loads all sprite sheets (from content/sprites.ts), props, tileset and map. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    for (const [key, def] of Object.entries(sprites)) {
      this.load.spritesheet(key, def.file, { frameWidth: def.frameWidth, frameHeight: def.frameHeight });
    }
    for (const [key, def] of Object.entries(props)) this.load.image(propTextureKey(key), def.file);
    this.load.image(TILESET.textureKey, TILESET.file);
    this.load.image(INTERIOR_TILESET.textureKey, INTERIOR_TILESET.file);
    for (const [key, info] of Object.entries(MAPS)) this.load.tilemapTiledJSON(mapCacheKey(key as MapKey), info.file);
  }

  create(): void {
    for (const [key, def] of Object.entries(sprites)) {
      for (const [name, anim] of Object.entries(def.anims)) {
        this.anims.create({
          key: `${key}:${name}`,
          frames: this.anims.generateFrameNumbers(key, { frames: anim.frames }),
          frameRate: anim.frameRate,
          repeat: 'repeat' in anim ? (anim.repeat as number) : -1,
        });
      }
    }
    this.game.events.emit('assets-ready');
    this.scene.start('Title');
  }
}

export function propTextureKey(type: string): string {
  return `prop-${type}`;
}
