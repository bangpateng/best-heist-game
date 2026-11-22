// shots.js — staged scenes for the entry's screenshots.
// Each shot loads a room, places the thief, the guards and the cameras at a
// chosen moment, and freezes the clock, so the render is one exact frame
// of the game's own code. ?shot=cover|play|alarm|win in the page URL.

import { cameraAngleAt } from './cameras.js';

/** Aim every camera at the middle of its sweep for a lively frame. */
function setCamerasMidSweep(G) {
  for (const c of G.cameras) {
    c.phase = 0;
    c.angle = cameraAngleAt(c, G.frozenT);
  }
}

export function stageShot(G, api, name) {
  if (name === 'cover') {
    // Title screen over Room 1: the thief below the title panel, guards
    // with their cones at the corners, the Amber Star glowing, alarm warm.
    api.loadLevel(0);
    G.screen = 'title';
    G.thief.x = 640;
    G.thief.y = 640;
    G.thief.angle = -Math.PI / 2;
    G.guards[0].x = 180;
    G.guards[0].y = 620;
    G.guards[0].angle = -0.9;
    G.guards[1].x = 1100;
    G.guards[1].y = 150;
    G.guards[1].angle = 2.4;
    G.guards[1].suspicion = 30;
    G.alarm = 34;
    G.maxAlarm = 34;
    G.levelScore = 0;
    setCamerasMidSweep(G);
  } else if (name === 'play') {
    // Mid-heist: the thief sneaks past a display case while a guard's
    // cone passes close, a coin already tossed, one painting pocketed.
    api.loadLevel(0);
    G.screen = 'play';
    G.thief.x = 470;
    G.thief.y = 300;
    G.thief.angle = 0;
    G.thief.sneaking = true;
    G.thief.coins = 2;
    G.guards[0].x = 350;
    G.guards[0].y = 280;
    G.guards[0].angle = 0.35;
    G.guards[0].suspicion = 68;
    G.guards[0].state = 'suspicious';
    G.guards[1].x = 1000;
    G.guards[1].y = 200;
    G.guards[1].angle = Math.PI / 2;
    G.loot[1].taken = true;
    G.levelScore = 150;
    G.coin = { x: 700, y: 320, born: G.frozenT - 0.4 };
    G.coinT = 3;
    G.alarm = 58;
    G.maxAlarm = 58;
    G.levelTime = 41;
    setCamerasMidSweep(G);
  } else if (name === 'alarm') {
    // The worst moment: alarm at 92, a guard chasing, a camera spotting,
    // the thief sprinting for the vault corridor's exit with the star.
    api.loadLevel(1);
    G.screen = 'play';
    G.thief.x = 700;
    G.thief.y = 520;
    G.thief.angle = -Math.PI / 2;
    G.thief.coins = 1;
    G.thief.smoke = 1;
    G.guards[1].x = 760;
    G.guards[1].y = 430;
    G.guards[1].angle = Math.PI / 2;
    G.guards[1].state = 'chase';
    G.guards[1].suspicion = 100;
    G.guards[1].lastSeen = { x: 700, y: 520, t: G.frozenT };
    G.guards[0].x = 600;
    G.guards[0].y = 150;
    G.guards[0].angle = Math.PI / 2;
    G.guards[2].x = 300;
    G.guards[2].y = 470;
    G.guards[2].angle = 0;
    G.cameras[1].spotting = true;
    G.loot[0].taken = true;
    G.loot[3].taken = true;
    G.starTaken = true;
    G.levelScore = 750;
    G.alarm = 92;
    G.maxAlarm = 92;
    G.spottedFlash = 1.0;
    G.levelTime = 63;
    setCamerasMidSweep(G);
  } else if (name === 'win') {
    // The getaway: all three rooms cleared, final score on the board.
    api.loadLevel(2);
    G.screen = 'win';
    G.score = 2890;
    G.levelScore = 1050;
    setCamerasMidSweep(G);
  }
}
