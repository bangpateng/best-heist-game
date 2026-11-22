// main.js — Cat Burglar: The Amber Gallery.
// Boots the canvas, runs the loop, owns the alarm, the loot, the lockdown
// and the screens. The rules live here; the seeing lives in guards.js and
// cameras.js, the drawing in render.js.

import { buildLevels } from './levels.js';
import { createGuard, updateGuard, guardCaughtThief } from './guards.js';
import { createCamera, updateCamera, cameraSeesThief } from './cameras.js';
import { createThief, updateThief, coinLanding, SMOKE_RADIUS, SMOKE_DURATION } from './player.js';
import { createInput } from './input.js';
import { drawGame, laserIsOn } from './render.js';
import { sfx, ensureAudio, startAlarmLoop, stopAlarmLoop, setMuted } from './audio.js';
import { stageShot } from './shots.js';
import { dist } from './vision.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const LEVELS = buildLevels();

/** The whole game state, one object, so the renderer and the shots see it. */
const G = {
  screen: 'title', // title | play | busted | clear | over | win
  levelIndex: 0,
  level: LEVELS[0],
  thief: null,
  guards: [],
  cameras: [],
  loot: [],
  alarm: 0,
  lockdown: 0,
  lives: 3,
  score: 0,
  levelScore: 0,
  levelTime: 0,
  starTaken: false,
  maxAlarm: 0,
  smokeClouds: [],
  coin: null,
  coinT: 0,
  spottedFlash: 0,
  message: '',
  messageT: 0,
  clearBonus: { time: 0, ghost: 0, total: 0 },
  frozen: false,
  frozenT: 2.4,
  muted: false,
  stepTimer: 0,
  laserHitAt: 0,
};

/** Set up a room fresh: guards, cameras, loot, thief, alarm, timers. */
export function loadLevel(i) {
  const def = LEVELS[i];
  G.levelIndex = i;
  G.level = def;
  G.thief = createThief(def.start);
  G.guards = def.guards.map(createGuard);
  G.cameras = def.cameras.map(createCamera);
  G.loot = def.loot.map((l) => ({ ...l, taken: false }));
  G.alarm = 0;
  G.lockdown = 0;
  G.levelScore = 0;
  G.levelTime = 0;
  G.starTaken = false;
  G.maxAlarm = 0;
  G.smokeClouds = [];
  G.coin = null;
  G.spottedFlash = 0;
  G.message = '';
  G.messageT = 0;
  G.laserHitAt = -10;
}

function showMessage(text, secs = 3) {
  G.message = text;
  G.messageT = secs;
}

/** One frame of play: move, watch, alarm, loot, lasers, exit, caught. */
function update(dt, input, clock) {
  G.levelTime += dt;
  G.spottedFlash = Math.max(0, G.spottedFlash - dt);
  G.messageT = Math.max(0, G.messageT - dt);
  if (G.messageT === 0) G.message = '';

  const solids = [...G.level.walls, ...G.level.covers];
  updateThief(G.thief, dt, input, solids, G.level.shadows);

  // Footstep tick while running loud.
  if (G.thief.moving && !G.thief.sneaking) {
    G.stepTimer -= dt;
    if (G.stepTimer <= 0) {
      G.stepTimer = 0.38;
      sfx.step();
    }
  }

  // Tools: coin toss, smoke pellet.
  if (input.coinQueued && G.thief.coins > 0) {
    const target = input.coinTarget ?? { x: G.thief.x + 100, y: G.thief.y };
    const at = coinLanding(G.thief, target.x, target.y);
    G.coin = { x: at.x, y: at.y, born: clock };
    G.coinT = 3;
    G.thief.coins -= 1;
    sfx.coin();
    showMessage('Coin tossed — a guard goes to look.', 2);
  }
  if (input.smokeQueued && G.thief.smoke > 0) {
    G.smokeClouds.push({ x: G.thief.x, y: G.thief.y, r: SMOKE_RADIUS, t: SMOKE_DURATION });
    G.thief.smoke -= 1;
    sfx.smoke();
    showMessage('Smoke! No one can see through it.', 2);
  }
  G.coinT = Math.max(0, G.coinT - dt);
  if (G.coinT === 0) G.coin = null;
  G.smokeClouds = G.smokeClouds.filter((c) => (c.t -= dt) > 0);

  const world = {
    thief: G.thief,
    walls: G.level.walls,
    smoke: G.smokeClouds,
    coin: G.coinT > 0 ? G.coin : null,
    time: clock,
  };

  // Guards patrol, suspect, chase.
  let anyoneSees = false;
  let anyoneChases = false;
  for (const g of G.guards) {
    updateGuard(g, dt, world);
    if (g.sawThief) anyoneSees = true;
    if (g.state === 'chase') anyoneChases = true;
    if (g.justSpotted) {
      G.spottedFlash = 1.4;
      sfx.spotted();
      showMessage('SPOTTED! Break line of sight!', 2.5);
    }
    if (guardCaughtThief(g, G.thief)) return busted();
  }

  // Cameras sweep and spot.
  for (const c of G.cameras) {
    updateCamera(c, clock);
    c.spotting = cameraSeesThief(c, G.thief, G.level.walls, G.smokeClouds);
    if (c.spotting) {
      anyoneSees = true;
      G.alarm = Math.min(100, G.alarm + 30 * dt);
    }
  }

  // The alarm climbs while seen or chased, and cools off in the dark.
  if (anyoneSees || anyoneChases) {
    G.alarm = Math.min(100, G.alarm + (anyoneChases ? 22 : 10) * dt);
  } else {
    G.alarm = Math.max(0, G.alarm - 6 * dt);
  }
  G.maxAlarm = Math.max(G.maxAlarm, G.alarm);

  // The alarm loop wails while the meter is high.
  if (G.alarm > 70) startAlarmLoop();
  else if (G.alarm < 50) stopAlarmLoop();

  // Lockdown at full alarm: the exit seals and every guard converges.
  if (G.alarm >= 100 && G.lockdown <= 0) {
    G.lockdown = 8;
    showMessage('LOCKDOWN! The exit is sealed — survive 8 seconds!', 3);
    for (const g of G.guards) {
      g.state = 'chase';
      g.suspicion = 100;
      g.lastSeen = { x: G.thief.x, y: G.thief.y, t: clock };
      g.chaseTimer = 8;
    }
  }
  if (G.lockdown > 0) {
    G.lockdown -= dt;
    G.alarm = 100;
    if (G.lockdown <= 0) {
      G.alarm = 40;
      showMessage('Lockdown lifted — the alarm cools. Move!', 3);
    }
  }

  // Lasers: crossing a live beam stings the alarm.
  for (const lz of G.level.lasers) {
    if (!laserIsOn(lz, clock)) continue;
    if (clock - G.laserHitAt < 0.5) continue;
    if (distToSegment(G.thief.x, G.thief.y, lz.x, lz.y, lz.x2, lz.y2) < G.thief.r + 2) {
      G.alarm = Math.min(100, G.alarm + 25);
      G.laserHitAt = clock;
      sfx.spotted();
      showMessage('Laser tripped! +25 alarm.', 2);
    }
  }

  // Loot: walk over it to pocket it.
  for (const l of G.loot) {
    if (l.taken) continue;
    if (dist(G.thief.x, G.thief.y, l.x, l.y) < 28) {
      l.taken = true;
      G.levelScore += l.value;
      if (l.kind === 'star') {
        G.starTaken = true;
        sfx.star();
        showMessage(`${l.label} SECURED — get to the green EXIT!`, 3.5);
      } else {
        sfx.pickup();
        showMessage(`${l.label} pocketed — $${l.value}.`, 2);
      }
    }
  }

  // Exit: open only once the star is taken.
  const e = G.level.exit;
  if (
    G.starTaken &&
    G.thief.x > e.x && G.thief.x < e.x + e.w &&
    G.thief.y > e.y && G.thief.y < e.y + e.h
  ) {
    levelClear();
  }
}

/** Distance from a point to a line segment. */
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let k = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  k = Math.max(0, Math.min(1, k));
  return dist(px, py, x1 + dx * k, y1 + dy * k);
}

/** Caught: lose a life, or the run ends. */
function busted() {
  stopAlarmLoop();
  sfx.busted();
  G.lives -= 1;
  G.screen = G.lives <= 0 ? 'over' : 'busted';
}

/** Room cleared: time and ghost bonuses, then the next room. */
function levelClear() {
  stopAlarmLoop();
  sfx.clear();
  const timeBonus = Math.max(0, Math.round((G.level.par - G.levelTime) * 4));
  const ghostBonus = G.maxAlarm <= 50 ? 400 : 0;
  G.clearBonus = { time: timeBonus, ghost: ghostBonus, total: G.levelScore + timeBonus + ghostBonus };
  G.score += G.clearBonus.total;
  G.screen = 'clear';
}

/** Advance past a screen on Enter / click. */
function advance() {
  ensureAudio();
  sfx.click();
  if (G.screen === 'title') {
    G.score = 0;
    G.lives = 3;
    loadLevel(0);
    G.screen = 'play';
  } else if (G.screen === 'busted') {
    loadLevel(G.levelIndex);
    G.screen = 'play';
  } else if (G.screen === 'clear') {
    if (G.levelIndex + 1 < LEVELS.length) {
      loadLevel(G.levelIndex + 1);
      G.screen = 'play';
    } else {
      G.screen = 'win';
    }
  } else if (G.screen === 'over' || G.screen === 'win') {
    G.score = 0;
    G.lives = 3;
    loadLevel(0);
    G.screen = 'title';
  }
}

// ---------------------------------------------------------------- boot

const input = createInput(canvas);
let clock = 0;
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.033, Math.max(0, (now - last) / 1000));
  last = now;
  if (!G.frozen) clock += dt;
  const t = G.frozen ? G.frozenT : clock;
  const polled = input.poll();

  if (G.screen === 'play') {
    if (polled.restartQueued) {
      loadLevel(G.levelIndex);
      showMessage('Room restarted.', 2);
    } else if (!G.frozen) {
      update(dt, polled, clock);
    }
  } else if (polled.confirmQueued || polled.anyKey) {
    advance();
  }
  if (polled.muteQueued) {
    G.muted = !G.muted;
    setMuted(G.muted);
    showMessage(G.muted ? 'Sound off (M to turn back on).' : 'Sound on.', 2);
  }
  input.consume();

  drawGame(ctx, G, t);
  requestAnimationFrame(frame);
}

loadLevel(0);

// A staged scene for screenshots: ?shot=cover|play|alarm|win freezes the
// world at a fixed clock so every render is the same frame.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  stageShot(G, { loadLevel }, shot);
  G.frozen = true;
}

requestAnimationFrame(frame);

// For play-testing from the console or an automation harness.
window.__heist = G;
