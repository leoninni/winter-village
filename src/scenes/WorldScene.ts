import Phaser from 'phaser';
import { animals } from '../../content/animals';
import { companions } from '../../content/companions';
import { doors } from '../../content/dialogue';
import { discoveries } from '../../content/discoveries';
import { places } from '../../content/places';
import { reactions } from '../../content/reactions';
import { settings } from '../../content/settings';
import { sonnenpalast } from '../../content/sonnenpalast';
import type { Direction } from '../../content/sprites';
import { strings } from '../../content/strings';
import { villagers } from '../../content/villagers';
import { setDebugHooks } from '../debug/hooks';
import type { Companion, CompanionCtx, GagId } from '../entities/companions/Companion';
import { Dog } from '../entities/companions/Dog';
import { Kratzi } from '../entities/companions/Kratzi';
import { Bird, Cat, Chicken, Horse, Villager, type Npc } from '../entities/npcs';
import { Player, type WorldCtx } from '../entities/Player';
import { app } from '../game/App';
import { bus } from '../systems/EventBus';
import { remember } from '../systems/GameState';
import { NavGrid, PLAYER_BOX } from '../systems/NavGrid';
import { planPath, type Point } from '../systems/Pathfinding';
import { pickReactions, type Listener } from '../systems/Reactions';
import { parseSpeech } from '../systems/speech';
import { Trail } from '../systems/trail';
import type { DialogueLine } from '../ui/story';
import { ui } from '../ui/ui';
import { Ambience } from '../world/Ambience';
import {
  animalTalk,
  closedDoorTalk,
  discoveryCard,
  say,
  sonnenpalastArrival,
  SPEAKERS,
  thingTalk,
  villagerTalk,
} from '../world/conversations';
import { DEPTH, entityDepth } from '../world/depth';
import { DiscoverySpots, type Spot } from '../world/DiscoverySpots';
import { Footprints } from '../world/Footprints';
import { Interactables, type Interactable } from '../world/Interactables';
import { isMapKey, MAPS, mapCacheKey, type MapKey } from '../world/maps';
import { props } from '../world/props';
import { TapMarker } from '../world/TapMarker';
import type { TiledMap } from '../world/tiled';
import { areaAt, parseVillageMap, type VillageMap } from '../world/VillageMap';
import { propTextureKey } from './PreloadScene';

export interface WorldData {
  map?: MapKey;
  /** named spawn point to start at (e.g. after walking through a door) */
  spawn?: string;
  /** debug: a gag to trigger right after loading */
  debugGag?: GagId;
}

interface FadeProp {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  halfW: number;
  height: number;
}

/** After closing a dialogue, ignore the interact key briefly so it doesn't re-open. */
const INTERACT_COOLDOWN_MS = 250;

/** A map you walk around in (the village, or a room like the Sonnenpalast). */
export class WorldScene extends Phaser.Scene {
  private mapKey: MapKey = 'village';
  private map!: VillageMap;
  private ctx!: WorldCtx;
  private player!: Player;
  private companion!: Companion;
  private trail = new Trail(3);
  private marker!: TapMarker;
  private ambience!: Ambience;
  private spots!: DiscoverySpots;
  private npcs: Npc[] = [];
  private cat: Cat | null = null;
  private interactables = new Interactables();
  private staticInteractables: Interactable[] = [];
  private prompt!: Phaser.GameObjects.Image;
  private promptBob = { v: 0 };
  private fadeProps: FadeProp[] = [];
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'shift' | 'e' | 'space', Phaser.Input.Keyboard.Key>;
  private blockers = new Set<string>();
  private scripted = false;
  private unblockedAt = 0;
  private holding = false;
  private lastRetarget = 0;
  private lastPointer = { x: 0, y: 0 };
  private pending: Interactable | null = null;
  private currentArea: string | null = null;
  private areaCheck = 0;
  private saveTimer = 0;
  private movedSinceSave = false;
  private exitArmed = false;
  private leaving = false;
  private lastSpoke = new Map<string, number>();
  private lastTalk = new Map<string, string>();
  private runPastAt = 0;
  private interactRequested = false;
  /** E / Space come from a DOM listener: Phaser's JustDown misses presses shorter than a frame. */
  private readonly onInteractKey = (e: KeyboardEvent) => {
    if (!e.repeat && (e.key === 'e' || e.key === 'E' || e.key === ' ')) this.interactRequested = true;
  };
  private enteredAt = 0;
  private unsubscribers: (() => void)[] = [];

  constructor() {
    super('World');
  }

  create(data: WorldData = {}): void {
    const state = app.state;
    if (!state.character || !state.companion) {
      bus.emit('flow:to-title');
      return;
    }
    this.resetFields();
    this.enteredAt = this.time.now;
    const saved = state.player && isMapKey(state.player.map) ? state.player.map : 'village';
    this.mapKey = data.map ?? saved;

    // --- map
    this.map = parseVillageMap(this.cache.tilemap.get(mapCacheKey(this.mapKey)).data as TiledMap);
    const tilemap = this.make.tilemap({ key: mapCacheKey(this.mapKey) });
    const ts = MAPS[this.mapKey].tileset;
    const tileset = tilemap.addTilesetImage(ts.name, ts.textureKey);
    if (!tileset) throw new Error(`tileset ${ts.name} missing`);
    tilemap.createLayer('ground', tileset)?.setDepth(DEPTH.ground);
    const grid = NavGrid.fromMap(this.map);
    this.ctx = { grid, map: this.map, footprints: new Footprints(this) };

    for (const p of this.map.props) {
      const def = props[p.type];
      const img = this.add.image(p.x, p.y, propTextureKey(p.type)).setOrigin(0.5, 1).setDepth(entityDepth(p.y));
      if (p.type === 'window') img.setDepth(entityDepth(0)); // on the wall, always behind
      if ('fadeWhenBehind' in def && def.fadeWhenBehind) this.fadeProps.push({ img, x: p.x, y: p.y, halfW: def.width / 2, height: def.height });
    }
    this.ambience = new Ambience(this, this.map);
    this.marker = new TapMarker(this);
    this.spots = new DiscoverySpots(this, this.map.points, state.discoveries);
    this.prompt = this.add.image(0, 0, 'prompt').setDepth(DEPTH.marker).setVisible(false);
    this.promptBob = { v: 0 };
    this.tweens.add({ targets: this.promptBob, v: -2, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    for (const e of this.map.exits) {
      const arrow = this.add.image(e.x + e.w / 2, e.y + 2, 'exit-arrow').setDepth(DEPTH.marker).setAlpha(0.85);
      this.tweens.add({ targets: arrow, y: '+=3', duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.spawnNpcs();

    // --- player + companion
    let start = this.map.spawn;
    let facing: Direction = data.spawn ? 'up' : 'down';
    if (data.spawn && this.map.spawns[data.spawn]) start = this.map.spawns[data.spawn]!;
    else if (!data.map && state.player && state.player.map === this.mapKey && grid.isBoxFree(state.player.x, state.player.y, PLAYER_BOX)) {
      start = { x: state.player.x, y: state.player.y };
      facing = state.player.facing;
    }
    this.player = new Player(this, state.character, start.x, start.y, facing);
    this.player.onArrive = () => this.marker.hide();
    this.trail.reset(this.player);
    const def = companions.find((c) => c.id === state.companion)!;
    if (def.id === 'kratzi') {
      const k = new Kratzi(this, def, start.x, start.y + 20);
      k.project = (p) => this.project(p);
      this.companion = k;
    } else this.companion = new Dog(this, def, def.id === 'teddy' ? { teddy: true } : { pauli: true }, start.x, start.y + 20);
    this.companion.snapTo(start.x, start.y + (data.spawn ? 30 : 0));
    this.exitArmed = !this.map.exits.some((e) => this.inRect(start, e));
    this.buildInteractables();

    // --- camera
    this.setupCamera();
    const sonneHome = this.mapKey === 'sonnenpalast' && state.character === 'sonne';
    if (sonneHome) this.cameras.main.fadeIn(900, 60, 32, 12);
    else this.cameras.main.fadeIn(450, 29, 42, 68);

    this.setupInput();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.game.events.on(Phaser.Core.Events.POST_RENDER, this.tickBubbles, this);
    this.unsubscribers.push(
      bus.on('ui:blocking', ({ id, open }) => {
        if (open) {
          this.blockers.add(id);
          this.stopWalking();
        } else {
          this.blockers.delete(id);
          this.unblockedAt = this.time.now;
        }
      }),
    );
    app.beforeSave = () => this.savePosition();
    this.savePosition();
    this.registerDebug();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());

    const firstVisit = remember(state, 'visited', this.mapKey);
    bus.emit('world:visited', { id: this.mapKey, first: firstVisit });
    if (this.mapKey === 'sonnenpalast') void this.arriveSonnenpalast(firstVisit);
    if (data.debugGag) this.time.delayedCall(700, () => this.companion.debugTrigger(data.debugGag!, this.companionCtx()));
  }

  private resetFields(): void {
    this.fadeProps = [];
    this.npcs = [];
    this.cat = null;
    this.trail = new Trail(3);
    this.blockers.clear();
    this.scripted = false;
    this.pending = null;
    this.currentArea = null;
    this.leaving = false;
    this.lastSpoke = new Map();
    this.holding = false;
  }

  // ------------------------------------------------------------------ setup
  private spawnNpcs(): void {
    for (const p of this.map.points) {
      if (p.layer !== 'npcs') continue;
      const wander = Number(p.props.wander ?? 0);
      if (p.type === 'villager') {
        const v = villagers.find((x) => x.id === p.contentId);
        if (v) this.npcs.push(new Villager(this, v.id, v.sprite, p.x, p.y, wander, v.id === 'valdemar' ? 58 : 34, v.id === 'signe'));
      } else {
        const a = animals.find((x) => x.id === p.contentId);
        if (!a) continue;
        if (a.kind === 'horse') this.npcs.push(new Horse(this, a.id, p.x, p.y));
        if (a.kind === 'chicken') this.npcs.push(new Chicken(this, a.id, p.x, p.y, wander, p.props.variant === 'brown'));
        if (a.kind === 'bird') this.npcs.push(new Bird(this, a.id, p.x, p.y, wander));
        if (a.kind === 'cat') {
          this.cat = new Cat(this, a.id, p.x, p.y);
          this.npcs.push(this.cat);
        }
      }
    }
  }

  private buildInteractables(): void {
    const list: Interactable[] = [];
    for (const npc of this.npcs) {
      list.push({
        key: `npc:${npc.id}`,
        get x() {
          return npc.x;
        },
        get y() {
          return npc.y;
        },
        range: npc.range,
        hitW: npc.hitW,
        hitH: npc.hitH,
        promptY: npc.headY + 6,
        enabled: true,
        interact: () => void this.talkTo(npc),
      });
    }
    for (const p of this.map.points) {
      if (p.layer === 'things') {
        list.push({ key: `thing:${p.contentId}`, x: p.x, y: p.y, range: 34, hitW: 30, hitH: 30, promptY: 30, enabled: true, interact: () => void this.lookAt(p.contentId) });
      }
      if (p.layer === 'doors') {
        list.push({ key: `door:${p.contentId}`, x: p.x, y: p.y + 4, range: 30, hitW: 22, hitH: 36, promptY: 40, enabled: true, interact: () => void this.useDoor(p.contentId) });
      }
    }
    for (const spot of this.spots.spots) {
      list.push({
        key: `disc:${spot.def.id}`,
        x: spot.x,
        y: spot.y,
        range: 30,
        hitW: 26,
        hitH: 26,
        promptY: 22,
        // found "visible" things can be looked at again; hidden ones only once they sparkle
        get enabled() {
          return spot.found ? spot.def.look === 'visible' : spot.glint.visible;
        },
        interact: () => void this.findDiscovery(spot),
      });
    }
    this.staticInteractables = list;
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setRoundPixels(true);
    cam.setBackgroundColor(this.map.indoor ? 0x2a1a10 : 0x1d2a44);
    this.fitCameraBounds();
    cam.startFollow(this.player.sprite, true, 0.14, 0.14);
  }

  /** Small rooms are centred on screen; big maps scroll within their edges. */
  private fitCameraBounds(): void {
    const cam = this.cameras.main;
    const { width, height } = this.scale;
    const w = this.map.widthPx;
    const h = this.map.heightPx;
    const x = w < width ? -Math.floor((width - w) / 2) : 0;
    const y = h < height ? -Math.floor((height - h) / 2) : 0;
    cam.setBounds(x, y, Math.max(w, width), Math.max(h, height));
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
      // E/Space are only registered so the browser doesn't scroll; presses are read via DOM
      e: kb.addKey(K.E),
      space: kb.addKey(K.SPACE),
    };

    // Tap-to-move reacts on pointer DOWN (not up) so movement starts instantly.
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      if (this.locked()) return;
      this.holding = true;
      this.lastPointer = { x: p.x, y: p.y };
      const hit = this.interactables.hitTest(p.worldX, p.worldY);
      if (hit) this.approach(hit);
      else {
        this.pending = null;
        this.walkTo(p.worldX, p.worldY, true);
      }
    });
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      if (this.locked() || !this.holding || !p.isDown) return;
      if (this.time.now - this.lastRetarget < 90) return;
      if (Math.hypot(p.x - this.lastPointer.x, p.y - this.lastPointer.y) < 10) return;
      this.lastPointer = { x: p.x, y: p.y };
      this.pending = null;
      this.walkTo(p.worldX, p.worldY, false);
    });
    window.addEventListener('keydown', this.onInteractKey);
    const release = () => (this.holding = false);
    this.input.on(Phaser.Input.Events.POINTER_UP, release);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, release);
  }

  private locked(): boolean {
    return this.blockers.size > 0 || this.scripted || this.leaving;
  }

  private stopWalking(): void {
    this.holding = false;
    this.pending = null;
    this.player?.clearPath();
  }

  private walkTo(x: number, y: number, freshTap: boolean): void {
    this.lastRetarget = this.time.now;
    const plan = planPath(this.ctx.grid, this.player, { x, y }, PLAYER_BOX);
    if (!plan) return;
    const run = freshTap ? plan.length > settings.movement.tapRunDistanceTiles * 32 : this.player.running;
    this.player.setPath(plan.waypoints, run);
    this.marker.show(plan.target.x, plan.target.y, freshTap);
  }

  /** Tapped something: walk over, then interact on arrival. */
  private approach(it: Interactable): void {
    if (Math.hypot(this.player.x - it.x, this.player.y - it.y) <= it.range) {
      this.player.clearPath();
      this.interact(it);
      return;
    }
    this.pending = it;
    this.walkTo(it.x, it.y, true);
  }

  private interact(it: Interactable): void {
    this.pending = null;
    this.marker.hide();
    this.player.facing = facingTowards(this.player, it);
    it.interact();
  }

  // ------------------------------------------------------------------ update
  update(time: number, deltaMs: number): void {
    if (!this.player) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    const locked = this.locked();

    let kx = 0;
    let ky = 0;
    const k = this.keys;
    // consumed every frame, so a key press that closed a dialogue can't re-open it later
    const interactPressed = this.interactRequested;
    this.interactRequested = false;
    if (!locked) {
      kx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
      ky = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
      if (kx || ky) this.pending = null;
    }
    this.player.update(dt, this.ctx, { x: kx, y: ky }, !locked && k.shift.isDown);
    this.trail.push(this.player);
    this.companion.update(dt, this.companionCtx());
    for (const npc of this.npcs) npc.update(dt, { grid: this.ctx.grid, player: this.player, time });
    this.spots.update(this.player.x, this.player.y);
    this.interactables.set([...this.staticInteractables, ...this.companion.interactables()]);
    this.ctx.footprints.update(time);
    this.updateFades(dt);

    // interactions
    const canAct = !locked && time - this.unblockedAt > INTERACT_COOLDOWN_MS;
    if (this.pending) {
      const d = Math.hypot(this.player.x - this.pending.x, this.player.y - this.pending.y);
      if (!this.pending.enabled) this.pending = null;
      else if (d <= this.pending.range && canAct) {
        this.player.clearPath();
        this.interact(this.pending);
      } else if (!this.player.hasPath) {
        // couldn't get all the way (fence, water …): close enough still counts
        if (d <= this.pending.range + 28 && canAct) this.interact(this.pending);
        else this.pending = null;
      }
    }
    const near = locked ? null : this.interactables.nearest(this.player.x, this.player.y, 6);
    if (interactPressed && near && canAct) this.interact(near);
    // the "…" prompt bobs above whatever you could talk to
    if (near) this.prompt.setVisible(true).setPosition(Math.round(near.x), Math.round(near.y - near.promptY - 4 + this.promptBob.v));
    else this.prompt.setVisible(false);

    // running past people and animals
    if (this.player.running && this.player.moving && time - this.runPastAt > 4000) {
      const someone = this.npcs.find((n) => Math.hypot(n.x - this.player.x, n.y - this.player.y) < 64);
      if (someone) {
        this.runPastAt = time;
        this.react('running-past', this.player);
      }
    }

    // exits (walk onto the door mat)
    if (!this.leaving) {
      const inside = this.map.exits.find((e) => this.inRect(this.player, e));
      if (!inside) this.exitArmed = true;
      else if (this.exitArmed) {
        const to = doors[inside.contentId]?.leadsTo;
        if (to && isMapKey(to.map)) this.goTo(to.map, to.spawn);
      }
    }

    if (this.player.moving) this.movedSinceSave = true;
    if (!locked) app.state.playTimeMs += deltaMs;
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
        const firstArea = this.currentArea === null;
        this.currentArea = area;
        bus.emit('world:area-entered', { id: area });
        if (!firstArea) this.react(`enter:${area}`, this.player);
      }
    }
  }

  private tickBubbles(): void {
    ui().bubbles.tick();
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

  // ------------------------------------------------------------------ talking & looking
  private async dialogue(lines: DialogueLine[]): Promise<void> {
    if (lines.length) await ui().dialogue.show(lines);
  }

  private async talkTo(npc: Npc): Promise<void> {
    const s = app.state;
    const first = remember(s, 'talkedTo', npc.id);
    npc.setTalking(true, this.player);
    const lines = npc.kind === 'villager' ? villagerTalk(npc.id, s, first, this.lastTalk.get(npc.id)) : animalTalk(npc.id, s, this.lastTalk.get(npc.id));
    const last = lines[lines.length - 1];
    if (last) this.lastTalk.set(npc.id, last.text);
    bus.emit('world:talked', { id: npc.id, first });
    app.requestSave();
    await this.dialogue(lines);
    npc.setTalking(false);
  }

  private async lookAt(id: string): Promise<void> {
    await this.dialogue(thingTalk(id, app.state));
    if (id === 'sp-armchair' && app.state.character === 'sonne') this.ambience.flare(3000);
    if (id === 'sp-fireplace') this.ambience.flare(1200);
  }

  private async useDoor(id: string): Promise<void> {
    const door = doors[id];
    if (!door) return;
    if (door.leadsTo && isMapKey(door.leadsTo.map)) {
      this.goTo(door.leadsTo.map, door.leadsTo.spawn);
      return;
    }
    await this.dialogue(closedDoorTalk(id, app.state));
  }

  private async findDiscovery(spot: Spot): Promise<void> {
    const s = app.state;
    if (spot.found) {
      await this.dialogue([{ text: strings.alreadyFound.replace('{title}', spot.def.title) }]);
      return;
    }
    this.spots.markFound(spot);
    remember(s, 'discoveries', spot.def.id);
    app.saveNow();
    bus.emit('world:discovery-found', { id: spot.def.id });
    await ui().cards.discovery(discoveryCard(spot.def, s));
    this.react('discovery-found', spot);
  }

  /** Walk through a door into another map. */
  private goTo(map: MapKey, spawn: string): void {
    if (this.leaving) return;
    this.leaving = true;
    this.stopWalking();
    ui().bubbles.clear();
    const cam = this.cameras.main;
    cam.fadeOut(320, 20, 14, 10);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({ map, spawn } satisfies WorldData);
    });
  }

  private async arriveSonnenpalast(first: boolean): Promise<void> {
    const s = app.state;
    const isSonne = s.character === 'sonne';
    const a = sonnenpalastArrival(s, first);
    this.scripted = first;
    if (isSonne) {
      this.ambience.flare(first ? 5000 : 2500);
      this.cat?.wake(first ? 6 : 3);
    }
    await wait(this, isSonne ? 700 : 400);
    ui().cards.title(sonnenpalast.title, sonnenpalast.subtitle, isSonne);
    await wait(this, 500);
    if (a.sequence.length) await this.dialogue(a.sequence);
    else if (a.bubble) this.bubble('player', a.bubble);
    this.scripted = false;
    if (a.companion) {
      await wait(this, 1400);
      this.bubble('companion', a.companion);
    }
  }

  // ------------------------------------------------------------------ reactions
  private companionCtx(): CompanionCtx {
    return {
      ...this.ctx,
      player: this.player,
      trail: this.trail,
      time: this.time.now,
      spots: this.spots,
      react: (event, at, force) => this.react(event, at, force),
      gag: (id) => this.gag(id),
      calm: this.locked() || this.time.now - this.enteredAt < 5000,
    };
  }

  private gag(id: string): void {
    const first = remember(app.state, 'gagsSeen', id);
    bus.emit('world:gag', { id, first });
    app.requestSave();
  }

  /** Who is around to react? (one listener per id: the closest chicken speaks for all) */
  private listeners(at: Point): Listener[] {
    const out: Listener[] = [
      { id: 'companion', ...this.companion.bubblePoint() },
      { id: 'player', x: this.player.x, y: this.player.y },
    ];
    const byId = new Map<string, Npc>();
    for (const n of this.npcs) {
      const cur = byId.get(n.id);
      if (!cur || Math.hypot(n.x - at.x, n.y - at.y) < Math.hypot(cur.x - at.x, cur.y - at.y)) byId.set(n.id, n);
    }
    for (const [id, n] of byId) out.push({ id, x: n.x, y: n.y });
    return out;
  }

  private react(event: string, at: Point, force = false): void {
    const def = reactions[event];
    if (!def) return;
    // big moments startle the animals nearby
    if (event === 'kratzi-head-pop' || event === 'pauli-stuck') {
      for (const n of this.npcs) if (Math.hypot(n.x - at.x, n.y - at.y) < settings.nearby.hearing) n.scare?.(at.x, at.y);
    }
    const picks = pickReactions(def, this.listeners(at), app.state, {
      at,
      hearing: settings.nearby.hearing,
      now: this.time.now / 1000,
      lastSpoke: this.lastSpoke,
      speakerCooldown: settings.nearby.speakerCooldown,
      force,
    });
    picks.forEach((p, i) => {
      const show = () => this.bubble(p.id, p.text);
      if (i === 0) show();
      else this.time.delayedCall(650 * i, show);
    });
  }

  /** Speech bubble above someone: 'player', 'companion' or a villager/animal id. */
  private bubble(who: string, raw: string): void {
    const line = say(raw, app.state);
    const parsed = parseSpeech(raw, SPEAKERS);
    const anchor = (): Point | null => {
      if (who === 'player') return { x: this.player.x, y: this.player.y - 50 };
      if (who === 'companion') return this.companion.bubblePoint();
      let best: Npc | null = null;
      for (const n of this.npcs) {
        if (n.id !== who) continue;
        if (!best || Math.hypot(n.x - this.player.x, n.y - this.player.y) < Math.hypot(best.x - this.player.x, best.y - this.player.y)) best = n;
      }
      return best ? { x: best.x, y: best.y - best.headY - 2 } : null;
    };
    ui().bubbles.show(
      () => {
        const p = anchor();
        return p ? this.project(p) : null;
      },
      line.text,
      !!parsed.action,
    );
  }

  /** World point → CSS pixels on the page. */
  private project(p: Point): { x: number; y: number } | null {
    if (!this.scene.isActive()) return null;
    const cam = this.cameras.main;
    const z = this.scale.zoom;
    return { x: (p.x - cam.worldView.x) * z, y: (p.y - cam.worldView.y) * z };
  }

  // ------------------------------------------------------------------ misc
  private inRect(p: Point, r: { x: number; y: number; w: number; h: number }): boolean {
    return p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
  }

  private savePosition(): void {
    if (!this.player) return;
    this.movedSinceSave = false;
    app.state.player = { map: this.mapKey, x: Math.round(this.player.x), y: Math.round(this.player.y), facing: this.player.facing };
  }

  private onResize(): void {
    this.cameras.main.setSize(this.scale.width, this.scale.height);
    this.fitCameraBounds();
    this.ambience.layout();
  }

  private registerDebug(): void {
    setDebugHooks({
      targets: () => [
        ...(this.mapKey === 'village' ? Object.keys(places) : ['village']),
        ...(this.mapKey !== 'sonnenpalast' ? ['sonnenpalast'] : []),
        ...this.spots.spots.map((s) => `disc:${s.def.id}`),
      ],
      teleport: (target) => {
        if (target === 'sonnenpalast') return this.goTo('sonnenpalast', 'entrance');
        if (target === 'village') return this.goTo('village', 'norrhagen-door');
        let p: Point | null = null;
        if (target.startsWith('disc:')) p = this.spots.spots.find((s) => `disc:${s.def.id}` === target) ?? null;
        const area = this.map.areas.find((a) => a.id === target);
        if (area) p = { x: area.x + area.w / 2, y: area.y + area.h / 2 };
        if (!p) return;
        const plan = planPath(this.ctx.grid, this.map.spawn, p, PLAYER_BOX);
        const dest = plan?.target ?? this.map.spawn;
        this.player.x = dest.x;
        this.player.y = dest.y;
        this.player.clearPath();
        this.trail.reset(this.player);
        this.companion.snapTo(dest.x, dest.y);
        this.cameras.main.centerOn(dest.x, dest.y);
      },
      gag: (id) => {
        const ok = this.companion.debugTrigger(id, this.companionCtx());
        if (!ok) console.info(`[debug] ${id} not possible right now`);
      },
      showSpots: (on) => this.spots.showAll(on),
      info: () => {
        const area = areaAt(this.map, this.player.x, this.player.y);
        return `${this.mapKey} · ${Math.round(this.player.x)},${Math.round(this.player.y)} · ${area ?? '–'} · ${Math.round(this.game.loop.actualFps)} fps · ${app.state.discoveries.length}/${discoveries.length} Entdeckungen`;
      },
    });
  }

  private teardown(): void {
    // (Phaser clears this scene's input listeners itself on shutdown)
    app.beforeSave = null;
    setDebugHooks(null);
    window.removeEventListener('keydown', this.onInteractKey);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.game.events.off(Phaser.Core.Events.POST_RENDER, this.tickBubbles, this);
    for (const off of this.unsubscribers) off();
    this.unsubscribers = [];
    ui().bubbles.clear();
  }
}

function facingTowards(from: Point & { facing: Direction }, to: Point): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return from.facing;
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
}

function wait(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((r) => scene.time.delayedCall(ms, r));
}
