// levels.js — the three rooms of Cat Burglar: The Amber Gallery.
// Every room is one screen: the thief crosses it, guards patrol it, cameras
// sweep it, loot glints in it. Coordinates are canvas pixels; the play area
// runs x 0..1280, y 64..720 (a 64px HUD bar sits on top).

export const PLAY = { x: 0, y: 64, w: 1280, h: 656 };
export const WALL = 14; // outer wall thickness

/** Outer border walls around the play area. */
function borderWalls() {
  return [
    { x: 0, y: PLAY.y, w: 1280, h: WALL },
    { x: 0, y: PLAY.y + PLAY.h - WALL, w: 1280, h: WALL },
    { x: 0, y: PLAY.y, w: WALL, h: PLAY.h },
    { x: 1280 - WALL, y: PLAY.y, w: WALL, h: PLAY.h },
  ];
}

/** Room 1 — the museum hall where the Amber Star hangs. */
function galleryLevel() {
  return {
    name: 'THE AMBER GALLERY',
    sub: 'Room 1 of 3 — steal the Amber Star, then slip out the south door.',
    walls: [
      ...borderWalls(),
      { x: 400, y: 170, w: 16, h: 150 },
      { x: 400, y: 380, w: 16, h: 150 },
      { x: 760, y: 430, w: 260, h: 16 },
      { x: 940, y: 150, w: 16, h: 170 },
    ],
    covers: [
      { x: 180, y: 220, w: 110, h: 60, kind: 'case' },
      { x: 180, y: 470, w: 110, h: 60, kind: 'case' },
      { x: 620, y: 180, w: 130, h: 60, kind: 'case' },
      { x: 1080, y: 480, w: 110, h: 60, kind: 'case' },
      { x: 560, y: 620, w: 90, h: 50, kind: 'planter' },
      { x: 1180, y: 200, w: 90, h: 50, kind: 'planter' },
    ],
    shadows: [
      { x: 520, y: 110, w: 180, h: 120 },
      { x: 60, y: 560, w: 200, h: 110 },
      { x: 1000, y: 110, w: 170, h: 100 },
    ],
    guards: [
      {
        x: 300, y: 150, speed: 62,
        waypoints: [
          { x: 300, y: 150 }, { x: 300, y: 600 },
          { x: 600, y: 600 }, { x: 600, y: 150 },
        ],
      },
      {
        x: 900, y: 130, speed: 58,
        waypoints: [
          { x: 900, y: 130 }, { x: 1150, y: 130 },
          { x: 1150, y: 600 }, { x: 1050, y: 600 }, { x: 1050, y: 130 },
        ],
      },
    ],
    cameras: [
      { x: 640, y: 80, baseAngle: Math.PI / 2, sweep: 0.9, range: 260, speed: 0.55 },
      { x: 1264, y: 400, baseAngle: Math.PI, sweep: 0.8, range: 250, speed: 0.7 },
    ],
    lasers: [],
    loot: [
      { x: 1140, y: 300, kind: 'star', label: 'AMBER STAR', value: 500 },
      { x: 230, y: 140, kind: 'painting', label: 'MOONLIT CANAL', value: 150 },
      { x: 700, y: 580, kind: 'gem', label: 'SAPPHIRE EGG', value: 250 },
      { x: 1180, y: 600, kind: 'painting', label: 'THE DUCHESS', value: 150 },
    ],
    start: { x: 90, y: 120 },
    exit: { x: 1150, y: 662, w: 100, h: 40 },
    par: 75,
  };
}

/** Room 2 — the vault corridor, lasers humming across the gaps. */
function vaultLevel() {
  return {
    name: 'THE VAULT CORRIDOR',
    sub: 'Room 2 of 3 — lasers blink on and off. Cross them dark, or pay the alarm.',
    walls: [
      ...borderWalls(),
      { x: 150, y: 280, w: 380, h: 16 },
      { x: 750, y: 280, w: 380, h: 16 },
      { x: 640, y: 280, w: 16, h: 220 },
      { x: 250, y: 520, w: 300, h: 16 },
      { x: 950, y: 430, w: 16, h: 180 },
    ],
    covers: [
      { x: 60, y: 540, w: 100, h: 55, kind: 'case' },
      { x: 820, y: 120, w: 120, h: 55, kind: 'case' },
      { x: 1080, y: 200, w: 100, h: 55, kind: 'case' },
      { x: 700, y: 560, w: 110, h: 50, kind: 'planter' },
      { x: 330, y: 620, w: 100, h: 50, kind: 'planter' },
    ],
    shadows: [
      { x: 60, y: 120, w: 190, h: 120 },
      { x: 560, y: 560, w: 180, h: 110 },
      { x: 1060, y: 560, w: 170, h: 110 },
    ],
    guards: [
      {
        x: 120, y: 150, speed: 66,
        waypoints: [{ x: 120, y: 150 }, { x: 1200, y: 150 }],
      },
      {
        x: 700, y: 350, speed: 60,
        waypoints: [
          { x: 700, y: 350 }, { x: 700, y: 650 },
          { x: 1100, y: 650 }, { x: 1100, y: 350 },
        ],
      },
      {
        x: 200, y: 600, speed: 56,
        waypoints: [
          { x: 200, y: 600 }, { x: 200, y: 380 },
          { x: 480, y: 380 }, { x: 480, y: 470 }, { x: 200, y: 470 },
        ],
      },
    ],
    cameras: [
      { x: 500, y: 80, baseAngle: Math.PI / 2, sweep: 0.9, range: 260, speed: 0.6 },
      { x: 1264, y: 250, baseAngle: Math.PI, sweep: 0.8, range: 250, speed: 0.75 },
      { x: 500, y: 704, baseAngle: -Math.PI / 2, sweep: 0.9, range: 250, speed: 0.5 },
    ],
    lasers: [
      { x: 530, y: 290, x2: 750, y2: 290, period: 2.4, phase: 0 },
      { x: 700, y: 610, x2: 950, y2: 610, period: 2.4, phase: 1.2 },
    ],
    loot: [
      { x: 1100, y: 180, kind: 'star', label: 'VAULT HEART', value: 500 },
      { x: 850, y: 600, kind: 'gold', label: 'GOLD BARS', value: 250 },
      { x: 120, y: 620, kind: 'painting', label: 'THE COUNTESS', value: 150 },
      { x: 350, y: 150, kind: 'gem', label: 'RUBY TEAR', value: 250 },
    ],
    start: { x: 90, y: 110 },
    exit: { x: 60, y: 662, w: 110, h: 40 },
    par: 90,
  };
}

/** Room 3 — the penthouse, open floor, four cameras, one guarded prize. */
function penthouseLevel() {
  return {
    name: 'THE PENTHOUSE',
    sub: 'Room 3 of 3 — the Crown Jewel sits in the laser gap. Take it and vanish.',
    walls: [
      ...borderWalls(),
      { x: 350, y: 250, w: 40, h: 40 },
      { x: 900, y: 250, w: 40, h: 40 },
      { x: 350, y: 520, w: 40, h: 40 },
      { x: 900, y: 520, w: 40, h: 40 },
      { x: 560, y: 150, w: 16, h: 140 },
      { x: 560, y: 430, w: 16, h: 140 },
    ],
    covers: [
      { x: 180, y: 300, w: 100, h: 55, kind: 'case' },
      { x: 1000, y: 300, w: 100, h: 55, kind: 'case' },
      { x: 180, y: 620, w: 100, h: 50, kind: 'planter' },
      { x: 1000, y: 620, w: 100, h: 50, kind: 'planter' },
      { x: 880, y: 200, w: 120, h: 50, kind: 'case' },
    ],
    shadows: [
      { x: 60, y: 560, w: 200, h: 110 },
      { x: 1020, y: 110, w: 180, h: 110 },
      { x: 700, y: 560, w: 180, h: 110 },
    ],
    guards: [
      {
        x: 200, y: 150, speed: 70,
        waypoints: [
          { x: 200, y: 150 }, { x: 500, y: 150 },
          { x: 500, y: 600 }, { x: 200, y: 600 },
        ],
      },
      {
        x: 780, y: 150, speed: 70,
        waypoints: [
          { x: 780, y: 150 }, { x: 1100, y: 150 },
          { x: 1100, y: 600 }, { x: 780, y: 600 },
        ],
      },
      {
        x: 640, y: 150, speed: 58,
        waypoints: [{ x: 640, y: 150 }, { x: 640, y: 600 }],
      },
    ],
    cameras: [
      { x: 320, y: 80, baseAngle: Math.PI / 2, sweep: 0.9, range: 260, speed: 0.65 },
      { x: 960, y: 80, baseAngle: Math.PI / 2, sweep: 0.9, range: 260, speed: 0.55 },
      { x: 16, y: 400, baseAngle: 0, sweep: 0.8, range: 250, speed: 0.7 },
      { x: 1264, y: 400, baseAngle: Math.PI, sweep: 0.8, range: 250, speed: 0.6 },
    ],
    lasers: [
      { x: 640, y: 300, x2: 640, y2: 430, period: 2.2, phase: 0 },
      { x: 200, y: 380, x2: 350, y2: 380, period: 2.2, phase: 1.1 },
    ],
    loot: [
      { x: 640, y: 380, kind: 'star', label: 'CROWN JEWEL', value: 500 },
      { x: 120, y: 150, kind: 'painting', label: 'SUNSET HARBOUR', value: 150 },
      { x: 1160, y: 200, kind: 'painting', label: 'THE ADMIRAL', value: 150 },
      { x: 640, y: 640, kind: 'gem', label: 'OPAL EYE', value: 250 },
      { x: 1140, y: 620, kind: 'gold', label: 'GOLD BARS', value: 250 },
    ],
    start: { x: 90, y: 110 },
    exit: { x: 1150, y: 662, w: 100, h: 40 },
    par: 100,
  };
}

/** The three rooms, in order. */
export function buildLevels() {
  return [galleryLevel(), vaultLevel(), penthouseLevel()];
}
