// player.js — the thief: movement, sneaking, and the two tools.
// Pure logic (no DOM): the thief moves on WASD/arrows, sneaks on Shift,
// tosses a coin with E (or a mouse click), and pops smoke with Q.

import { clamp, dist, pointInRects, resolveCircleVsRects } from './vision.js';

export const THIEF_RADIUS = 13;
export const THIEF_RUN_SPEED = 175;
export const THIEF_SNEAK_SPEED = 96;
export const COIN_RANGE = 170;
export const COIN_COUNT = 3;
export const SMOKE_COUNT = 2;
export const SMOKE_RADIUS = 95;
export const SMOKE_DURATION = 3.5;

/** Build the thief at the level's start point. */
export function createThief(start) {
  return {
    x: start.x,
    y: start.y,
    r: THIEF_RADIUS,
    angle: 0,
    moving: false,
    sneaking: false,
    inShadow: false,
    coins: COIN_COUNT,
    smoke: SMOKE_COUNT,
    noisePulse: 0, // seconds left of the footstep ring shown after running
  };
}

/**
 * Step the thief. `input` is {mx, my} movement (-1..1) plus flags; `solids`
 * are the rects that block movement; `shadows` are the dark floor patches.
 */
export function updateThief(t, dt, input, solids, shadows) {
  const mag = Math.hypot(input.mx, input.my);
  t.sneaking = !!input.sneak;
  t.moving = mag > 0.01;
  if (t.moving) {
    const nx = input.mx / Math.max(1, mag);
    const ny = input.my / Math.max(1, mag);
    const speed = t.sneaking ? THIEF_SNEAK_SPEED : THIEF_RUN_SPEED;
    t.angle = Math.atan2(ny, nx);
    const next = resolveCircleVsRects(
      t.x + nx * speed * dt,
      t.y + ny * speed * dt,
      t.r,
      solids,
    );
    t.x = clamp(next.x, 16 + t.r, 1280 - 16 - t.r);
    t.y = clamp(next.y, 64 + 16 + t.r, 720 - 16 - t.r);
    if (!t.sneaking) t.noisePulse = 0.35;
  }
  t.noisePulse = Math.max(0, t.noisePulse - dt);
  t.inShadow = pointInRects(t.x, t.y, shadows);
}

/** Where a tossed coin lands: toward (tx, ty), at most COIN_RANGE away. */
export function coinLanding(t, tx, ty) {
  const d = dist(t.x, t.y, tx, ty);
  if (d < 1) return { x: t.x, y: t.y };
  const k = Math.min(1, COIN_RANGE / d);
  return { x: t.x + (tx - t.x) * k, y: t.y + (ty - t.y) * k };
}
