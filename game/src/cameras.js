// cameras.js — wall-mounted security cameras: sweep, spot, raise the alarm.
// Pure logic (no DOM): a camera pans back and forth and watches its cone.

import { dist, hasLineOfSight, inCone } from './vision.js';

export const CAMERA_RANGE = 260;
export const CAMERA_HALF_ANGLE = 0.42; // ~24 degrees each side

/** Build a camera from a level definition. */
export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    range: def.range ?? CAMERA_RANGE,
    speed: def.speed ?? 0.6,
    phase: Math.random() * Math.PI * 2,
    angle: def.baseAngle,
    spotting: false,
  };
}

/** Current sweep angle of a camera at clock time `t`. */
export function cameraAngleAt(cam, t) {
  return cam.baseAngle + Math.sin(t * cam.speed + cam.phase) * cam.sweep;
}

/** Step a camera: recompute its angle for this frame. */
export function updateCamera(cam, t) {
  cam.angle = cameraAngleAt(cam, t);
}

/**
 * True when the camera can see the thief: inside its cone, line of sight
 * clear, and the thief not hidden inside a smoke cloud.
 */
export function cameraSeesThief(cam, thief, walls, smoke) {
  if (dist(cam.x, cam.y, thief.x, thief.y) > cam.range) return false;
  if (smoke.some((c) => dist(thief.x, thief.y, c.x, c.y) < c.r)) return false;
  return (
    inCone(cam.x, cam.y, cam.angle, cam.range, CAMERA_HALF_ANGLE, thief.x, thief.y) &&
    hasLineOfSight(cam.x, cam.y, thief.x, thief.y, walls)
  );
}
