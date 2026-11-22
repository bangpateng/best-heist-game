// guards.js — the museum guards: patrol, suspicion, chase, investigate.
// A guard walks a waypoint loop, watches a vision cone, and remembers.
// Pure logic (no DOM), so the same code can be stepped by a test harness.

import { angleDiff, angleTo, clamp, dist, hasLineOfSight, inCone, resolveCircleVsRects } from './vision.js';

export const GUARD_RANGE = 230;
export const GUARD_HALF_ANGLE = 0.56; // ~32 degrees each side
export const GUARD_PATROL_SPEED = 60;
export const GUARD_CHASE_SPEED = 132;
export const GUARD_CATCH_DIST = 22;

/** Build a guard from a level definition. */
export function createGuard(def) {
  return {
    x: def.x,
    y: def.y,
    r: 15,
    angle: 0,
    speed: def.speed ?? GUARD_PATROL_SPEED,
    waypoints: def.waypoints.map((w) => ({ x: w.x, y: w.y })),
    wp: 1 % Math.max(1, def.waypoints.length),
    wait: 0,
    state: 'patrol', // patrol | suspicious | chase | investigate
    suspicion: 0,
    lastSeen: null,
    investigateTarget: null,
    investigateTimer: 0,
    chaseTimer: 0,
    sawThief: false,
    justSpotted: false,
  };
}

/**
 * Step one guard. `world` carries the thief, the walls, the smoke clouds and
 * the clock. Returns nothing; the guard's fields are the result. The caller
 * reads `caught` (guard touched the thief) and `sawThief` from the guard.
 */
export function updateGuard(g, dt, world) {
  const { thief, walls, smoke, time } = world;
  g.justSpotted = false;
  g.sawThief = false;

  // --- Can the guard see the thief right now? ---
  const thiefHiddenBySmoke = smoke.some((c) => dist(thief.x, thief.y, c.x, c.y) < c.r);
  const inRange = dist(g.x, g.y, thief.x, thief.y) <= GUARD_RANGE;
  const inSight =
    inRange &&
    !thiefHiddenBySmoke &&
    inCone(g.x, g.y, g.angle, GUARD_RANGE, GUARD_HALF_ANGLE, thief.x, thief.y) &&
    hasLineOfSight(g.x, g.y, thief.x, thief.y, walls);

  if (inSight) {
    g.sawThief = true;
    let rate = 46;
    if (thief.sneaking) rate *= 0.5;
    if (thief.inShadow) rate *= 0.5;
    const before = g.suspicion;
    g.suspicion = clamp(g.suspicion + rate * dt, 0, 100);
    if (before < 100 && g.suspicion >= 100) g.justSpotted = true;
    g.lastSeen = { x: thief.x, y: thief.y, t: time };
  } else {
    g.suspicion = clamp(g.suspicion - 12 * dt, 0, 100);
  }

  // Footsteps: a running thief close by makes the guard uneasy.
  if (!thief.sneaking && !inSight) {
    const d = dist(g.x, g.y, thief.x, thief.y);
    if (d < 130 && hasLineOfSight(g.x, g.y, thief.x, thief.y, walls)) {
      g.suspicion = clamp(g.suspicion + 9 * dt, 0, 60);
    }
  }

  // --- State machine ---
  if (g.suspicion >= 100) {
    if (g.state !== 'chase') {
      g.state = 'chase';
      g.chaseTimer = 6;
    }
  } else if (g.suspicion >= 55 && g.state === 'patrol') {
    g.state = 'suspicious';
  } else if (g.suspicion < 25 && g.state === 'suspicious') {
    g.state = 'patrol';
  }

  // A tossed coin pulls a patrolling guard off its route.
  if (world.coin && (g.state === 'patrol' || g.state === 'suspicious') && g.suspicion < 55) {
    const cd = dist(g.x, g.y, world.coin.x, world.coin.y);
    if (cd < 260) {
      g.state = 'investigate';
      g.investigateTarget = { x: world.coin.x, y: world.coin.y };
      g.investigateTimer = 4;
    }
  }

  // --- Movement (walls block guards too, so a chase never clips a wall) ---
  if (g.state === 'chase' && g.lastSeen) {
    g.chaseTimer -= dt;
    moveToward(g, g.lastSeen.x, g.lastSeen.y, GUARD_CHASE_SPEED, dt, walls);
    if (g.chaseTimer <= 0 && !g.sawThief) {
      g.state = 'suspicious';
      g.suspicion = 55;
    }
  } else if (g.state === 'suspicious' && g.lastSeen) {
    moveToward(g, g.lastSeen.x, g.lastSeen.y, g.speed * 0.75, dt, walls);
    if (dist(g.x, g.y, g.lastSeen.x, g.lastSeen.y) < 24) {
      g.state = 'patrol';
      g.suspicion = 20;
    }
  } else if (g.state === 'investigate' && g.investigateTarget) {
    g.investigateTimer -= dt;
    moveToward(g, g.investigateTarget.x, g.investigateTarget.y, g.speed * 1.15, dt, walls);
    if (dist(g.x, g.y, g.investigateTarget.x, g.investigateTarget.y) < 20 || g.investigateTimer <= 0) {
      g.state = 'patrol';
      g.investigateTarget = null;
      // Resume from the nearest waypoint.
      g.wp = nearestWaypoint(g);
    }
  } else if (g.state === 'patrol') {
    if (g.wait > 0) {
      g.wait -= dt;
    } else {
      const target = g.waypoints[g.wp];
      const d = dist(g.x, g.y, target.x, target.y);
      if (d < 6) {
        g.wp = (g.wp + 1) % g.waypoints.length;
        g.wait = 0.9;
      } else {
        moveToward(g, target.x, target.y, g.speed, dt, walls);
      }
    }
  }

  // Face the movement (or the thief, while suspicious/chasing).
  if (g.state === 'chase' || g.state === 'suspicious') {
    if (g.lastSeen) g.angle = angleTo(g.x, g.y, g.lastSeen.x, g.lastSeen.y);
  }
}

/** Walk toward a point, turning the guard to face it, never through a wall. */
function moveToward(g, tx, ty, speed, dt, walls) {
  const a = angleTo(g.x, g.y, tx, ty);
  g.angle = a;
  const next = resolveCircleVsRects(
    g.x + Math.cos(a) * speed * dt,
    g.y + Math.sin(a) * speed * dt,
    g.r,
    walls,
  );
  g.x = next.x;
  g.y = next.y;
}

/** Index of the waypoint nearest the guard. */
function nearestWaypoint(g) {
  let best = 0;
  let bestD = Infinity;
  g.waypoints.forEach((w, i) => {
    const d = dist(g.x, g.y, w.x, w.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** True when this guard has caught the thief (touching, while chasing). */
export function guardCaughtThief(g, thief) {
  return g.state === 'chase' && dist(g.x, g.y, thief.x, thief.y) <= GUARD_CATCH_DIST;
}
