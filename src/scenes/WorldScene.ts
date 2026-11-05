import Phaser from 'phaser';
import { companions } from '../../content/companions';
import { settings } from '../../content/settings';
import type { Direction } from '../../content/sprites';
import { Dog } from '../entities/companions/Dog';
import type { Companion } from '../entities/companions/Companion';
import { Kratzi } from '../entities/companions/Kratzi';
import { Player, type WorldCtx } from '../entities/Player';
import { app } from '../game/App';
import { bus } from '../systems/EventBus';
import { NavGrid, PLAYER_BOX } from '../systems/NavGrid';
import { planPath } from '../systems/Pathfinding';
import { Trail } from '../systems/trail';
import { Ambience } from '../world/Ambience';
import { DEPTH, entityDepth } from '../world/depth';
import { Footprints } from '../world/Footprints';
import { props } from '../world/props';
import { TapMarker } from '../world/TapMarker';
import type { TiledMap } from '../world/tiled';
import { TILESET } from '../world/tiles';
import { areaAt, parseVillageMap, type VillageMap } from '../world/VillageMap';
import { MAP_KEY, propTextureKey } from './PreloadScene';

interface FadeProp {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  halfW: number;
  height: number;
}

/** The village: walking around with your companion. */
export class WorldScene extends Phaser.Scene {
  private map!: VillageMap;
  private ctx!: WorldCtx;
  private player!: Player;
  private companion!: Companion;
  private trail = new Trail(3);
  private marker!: TapMarker;
  private ambience!: Ambience;
  private fadeProps: FadeProp[] = [];
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'shift', Phaser.Input.Keyboard.Key>;
  private locked = false;
  private holding = false;
  private lastRetarget = 0;
  private lastPointer = { x: 0, y: 0 };
  private currentArea: string | null = null;
  private areaCheck = 0;
  private saveTimer = 0;
  private movedSinceSave = false;
  private unsubscribers: (() => void)[] = [];

  constructor() {
    super('World');
  }

  create(): void {
    const state = app.state;
    if (!state.character || !state.companion) {
      bus.emit('flow:to-title');
      return;
    }
    this.locked = false;
    this.fadeProps = [];
    this.trail = new Trail(3);
    this.currentArea = null;

    // --- map
    this.map = parseVillageMap(this.cache.tilemap.get(MAP_KEY).data as TiledMap);
    const tilemap = this.make.tilemap({ key: MAP_KEY });
    const tileset = tilemap.addTilesetImage(TILESET.name, TILESET.textureKey);
    if (!tileset) throw new Error('tileset missing');
    tilemap.createLayer('ground', tileset)?.setDepth(DEPTH.ground);
    const grid = NavGrid.fromMap(this.map);
    this.ctx = { grid, map: this.map, footprints: new Footprints(this) };

    for (const p of this.map.props) {
      const def = props[p.type];
      const img = this.add.image(p.x, p.y, propTextureKey(p.type)).setOrigin(0.5, 1).setDepth(entityDepth(p.y));
      if ('fadeWhenBehind' in def && def.fadeWhenBehind) {
        this.fadeProps.push({ img, x: p.x, y: p.y, halfW: def.width / 2, height: def.height });
      }
    }
    this.ambience = new Ambience(this, this.map);
    this.marker = new TapMarker(this);

    // --- player + companion (restore last position if it's still walkable)
    let start = this.map.spawn;
    let facing: Direction = 'down';
    if (state.player && grid.isBoxFree(state.player.x, state.player.y, PLAYER_BOX)) {
      start = { x: state.player.x, y: state.player.y };
      facing = state.player.facing;
    }
    this.player = new Player(this, state.character, start.x, start.y, facing);
    this.player.onArrive = () => this.marker.hide();
    this.trail.reset(this.player);
    const def = companions.find((c) => c.id === state.companion)!;
    const behind = { x: start.x, y: start.y - 20 };
    this.companion =
      def.id === 'kratzi'
        ? new Kratzi(this, def, behind.x, behind.y)
        : new Dog(this, def, def.id === 'teddy' ? { bouncesInDeepSnow: true } : { sinksInDeepSnow: true }, behind.x, behind.y);
    this.companion.snapTo(start.x, start.y);

    // --- camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.map.widthPx, this.map.heightPx);
    cam.startFollow(this.player.sprite, true, 0.14, 0.14);
    cam.setRoundPixels(true);
    cam.fadeIn(450, 29, 42, 68);

    this.setupInput();
    app.beforeSave = () => this.savePosition();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.unsubscribers.push(bus.on('ui:menu', ({ open }) => this.setLocked(open)));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: kb.addKey(K.UP),
      down: kb.addKey(K.DOWN),
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      w: kb.addKey(K.W),
      a: kb.addKey(K.A),
      s: kb.addKey(K.S),
      d: kb.addKey(K.D),
      shift: kb.addKey(K.SHIFT),
    };

    // Tap-to-move reacts on pointer DOWN (not up) so movement starts instantly.
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      if (this.locked) return;
      this.holding = true;
      this.lastPointer = { x: p.x, y: p.y };
      this.walkTo(p.worldX, p.worldY, true);
    });
    // Keep the finger down and drag to steer.
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      if (this.locked || !this.holding || !p.isDown) return;
      if (this.time.now - this.lastRetarget < 90) return;
      if (Math.hypot(p.x - this.lastPointer.x, p.y - this.lastPointer.y) < 6) return;
      this.lastPointer = { x: p.x, y: p.y };
      this.walkTo(p.worldX, p.worldY, false);
    });
    const release = () => (this.holding = false);
    this.input.on(Phaser.Input.Events.POINTER_UP, release);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, release);
  }

  private walkTo(x: number, y: number, freshTap: boolean): void {
    this.lastRetarget = this.time.now;
    const plan = planPath(this.ctx.grid, this.player, { x, y }, PLAYER_BOX);
    if (!plan) return;
    const run = freshTap ? plan.length > settings.movement.tapRunDistanceTiles * 32 : this.player.running;
    this.player.setPath(plan.waypoints, run);
    this.marker.show(plan.target.x, plan.target.y, freshTap);
  }

  private setLocked(locked: boolean): void {
    this.locked = locked;
    this.holding = false;
    if (locked) {
      this.player.clearPath();
      this.savePosition();
      app.saveNow();
    }
  }

  update(time: number, deltaMs: number): void {
    if (!this.player) return;
    const dt = Math.min(deltaMs, 50) / 1000; // clamp: no giant jumps after a hiccup

    let kx = 0;
    let ky = 0;
    if (!this.locked) {
      const k = this.keys;
      kx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
      ky = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
    }
    this.player.update(dt, this.ctx, { x: kx, y: ky }, !this.locked && this.keys.shift.isDown);
    this.trail.push(this.player);
    this.companion.update(dt, { ...this.ctx, player: this.player, trail: this.trail, time });
    this.ctx.footprints.update(time);
    this.updateFades(dt);

    if (this.player.moving) this.movedSinceSave = true;
    if (!this.locked) app.state.playTimeMs += deltaMs;

    this.saveTimer += dt;
    if (this.saveTimer >= settings.save.positionEvery) {
      this.saveTimer = 0;
      if (this.movedSinceSave) this.savePosition();
      app.requestSave();
    }

    this.areaCheck -= dt;
    if (this.areaCheck <= 0) {
      this.areaCheck = 0.25;
      const area = areaAt(this.map, this.player.x, this.player.y);
      if (area && area !== this.currentArea) {
        this.currentArea = area;
        bus.emit('world:area-entered', { id: area });
      }
    }
  }

  /** Houses and big trees turn see-through while you're behind them. */
  private updateFades(dt: number): void {
    const { x, y } = this.player;
    for (const f of this.fadeProps) {
      const behind = y < f.y - 2 && y > f.y - f.height + 8 && Math.abs(x - f.x) < f.halfW - 2;
      const target = behind ? 0.55 : 1;
      const a = f.img.alpha;
      if (a !== target) f.img.setAlpha(Math.abs(a - target) < 0.02 ? target : a + (target - a) * Math.min(1, dt * 10));
    }
  }

  private savePosition(): void {
    this.movedSinceSave = false;
    app.state.player = { x: Math.round(this.player.x), y: Math.round(this.player.y), facing: this.player.facing };
  }

  private onResize(): void {
    this.cameras.main.setSize(this.scale.width, this.scale.height);
    this.ambience.layout();
  }

  private teardown(): void {
    // (Phaser clears this scene's input listeners itself on shutdown)
    app.beforeSave = null;
    this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    for (const off of this.unsubscribers) off();
    this.unsubscribers = [];
  }
}
