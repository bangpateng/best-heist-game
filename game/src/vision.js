// vision.js — sight math for Cat Burglar: The Amber Gallery.
// Pure geometry, no DOM: line of sight, vision cones, angles, distances.

export const TAU = Math.PI * 2;

/** Clamp a number into [lo, hi]. */
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Euclidean distance between two points. */
export function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.hypot(dx, dy);
}

/** Angle from (x1, y1) to (x2, y2). */
export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/** Smallest signed difference between two angles, in (-PI, PI]. */
export function angleDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d <= -Math.PI) d += TAU;
  return d;
}

/** True when (tx, ty) sits inside the cone from (ox, oy) facing `angle`. */
export function inCone(ox, oy, angle, range, halfAngle, tx, ty) {
  const d = dist(ox, oy, tx, ty);
  if (d > range) return false;
  if (d < 1) return true;
  return Math.abs(angleDiff(angleTo(ox, oy, tx, ty), angle)) <= halfAngle;
}

/**
 * True when the segment (x1, y1)-(x2, y2) touches the axis-aligned rect.
 * Slab method: the segment is clipped against the rect's four planes.
 */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  // X slab.
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let ta = (r.x - x1) / dx;
    let tb = (r.x + r.w - x1) / dx;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  // Y slab.
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let ta = (r.y - y1) / dy;
    let tb = (r.y + r.h - y1) / dy;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}

/** True when no wall rect blocks the sight line between the two points. */
export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

/** True when the point sits inside any rect of the list. */
export function pointInRects(x, y, rects) {
  for (const r of rects) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  }
  return false;
}

/**
 * Push a circle (cx, cy, radius) out of every rect it overlaps.
 * Returns the corrected position. Walls and covers both block movement.
 */
export function resolveCircleVsRects(cx, cy, radius, rects) {
  let x = cx;
  let y = cy;
  for (const r of rects) {
    const nx = clamp(x, r.x, r.x + r.w);
    const ny = clamp(y, r.y, r.y + r.h);
    const dx = x - nx;
    const dy = y - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 >= radius * radius) continue;
    if (d2 > 0.0001) {
      const d = Math.sqrt(d2);
      x = nx + (dx / d) * radius;
      y = ny + (dy / d) * radius;
    } else {
      // Centre inside the rect: shove out along the smallest penetration.
      const left = x - r.x;
      const right = r.x + r.w - x;
      const top = y - r.y;
      const bottom = r.y + r.h - y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) x = r.x - radius;
      else if (m === right) x = r.x + r.w + radius;
      else if (m === top) y = r.y - radius;
      else y = r.y + r.h + radius;
    }
  }
  return { x, y };
}
