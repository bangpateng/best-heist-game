// render.js — every pixel of Cat Burglar: The Amber Gallery.
// One canvas, one room per frame: marble floor, gold cases, vision cones,
// cameras, glowing loot, the alarm meter and the thief — all drawn here.

const FONT = (px, weight = 700) => `${weight} ${px}px "Trebuchet MS", Verdana, sans-serif`;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A vision cone wedge from (x, y) facing `angle`, range `range`. */
function conePath(ctx, x, y, angle, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

/** The whole frame: room first, then HUD, then any screen overlay. */
export function drawGame(ctx, G, t) {
  drawRoom(ctx, G, t);
  drawCones(ctx, G, t);
  drawWalls(ctx, G.level.walls);
  drawSmoke(ctx, G);
  drawCoin(ctx, G, t);
  drawLoot(ctx, G, t);
  G.cameras.forEach((c) => drawCamera(ctx, c));
  G.guards.forEach((g) => drawGuard(ctx, g, t));
  drawThief(ctx, G.thief, t);
  drawHud(ctx, G, t);
  drawBanners(ctx, G, t);
  if (G.screen === 'title') drawTitle(ctx, G, t);
  else if (G.screen === 'busted') drawBusted(ctx, G);
  else if (G.screen === 'clear') drawLevelClear(ctx, G);
  else if (G.screen === 'over') drawGameOver(ctx, G);
  else if (G.screen === 'win') drawWin(ctx, G);
}

// ---------------------------------------------------------------- the room

function drawRoom(ctx, G, t) {
  const L = G.level;
  // Marble floor: dark checker.
  ctx.fillStyle = '#101a2e';
  ctx.fillRect(0, 64, 1280, 656);
  const tile = 64;
  for (let y = 64; y < 720; y += tile) {
    for (let x = 0; x < 1280; x += tile) {
      if (((x / tile + y / tile) | 0) % 2 === 0) {
        ctx.fillStyle = '#13203a';
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  // Gold carpet runner down the middle of each room.
  ctx.fillStyle = 'rgba(201, 162, 39, 0.10)';
  ctx.fillRect(600, 64, 80, 656);

  // Shadow patches: dark floor where the thief is harder to spot.
  for (const s of L.shadows) {
    ctx.fillStyle = 'rgba(6, 22, 54, 0.55)';
    roundRect(ctx, s.x, s.y, s.w, s.h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(147, 197, 253, 0.65)';
    ctx.font = FONT(12, 600);
    ctx.textAlign = 'center';
    ctx.fillText('S H A D O W', s.x + s.w / 2, s.y + s.h / 2 + 4);
  }

  // Exit door: green when open, red padlock while the star is still inside.
  const e = L.exit;
  const open = G.starTaken;
  ctx.fillStyle = open ? '#14532d' : '#3f1d1d';
  roundRect(ctx, e.x, e.y, e.w, e.h, 6);
  ctx.fill();
  ctx.strokeStyle = open ? '#4ade80' : '#f87171';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = open ? '#bbf7d0' : '#fca5a5';
  ctx.font = FONT(14);
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT — GO!' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2 + 5);

  // Lasers: red beams that blink on and off.
  for (const lz of L.lasers) {
    const on = laserIsOn(lz, t);
    ctx.strokeStyle = on ? 'rgba(239, 68, 68, 0.95)' : 'rgba(239, 68, 68, 0.18)';
    ctx.lineWidth = on ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(lz.x, lz.y);
    ctx.lineTo(lz.x2, lz.y2);
    ctx.stroke();
    if (on) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(lz.x, lz.y, 5, 0, Math.PI * 2);
      ctx.arc(lz.x2, lz.y2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Display cases and planters (cover: block movement, not sight).
  for (const c of L.covers) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#0f172a';
      roundRect(ctx, c.x, c.y, c.w, c.h, 6);
      ctx.fill();
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      roundRect(ctx, c.x + 6, c.y + 6, c.w - 12, c.h - 12, 4);
      ctx.stroke();
      // A velvet rope across the front.
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x + 4, c.y + c.h + 8);
      ctx.quadraticCurveTo(c.x + c.w / 2, c.y + c.h + 18, c.x + c.w - 4, c.y + c.h + 8);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2 - 8, c.y + c.h / 2 - 6, 12, 0, Math.PI * 2);
      ctx.arc(c.x + c.w / 2 + 10, c.y + c.h / 2 + 4, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = '#2b3a55';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#43598a';
    ctx.fillRect(w.x, w.y, w.w, 3);
    ctx.fillStyle = '#1c2940';
    ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);
  }
}

/** True while a laser beam is live at clock time `t`. */
export function laserIsOn(lz, t) {
  return ((t + lz.phase) % lz.period) < lz.period * 0.6;
}

// ---------------------------------------------------------------- cones

function drawCones(ctx, G, t) {
  for (const c of G.cameras) {
    const hot = c.spotting;
    ctx.fillStyle = hot ? 'rgba(239, 68, 68, 0.30)' : 'rgba(239, 68, 68, 0.13)';
    conePath(ctx, c.x, c.y, c.angle, c.range, 0.42);
    ctx.fill();
    ctx.strokeStyle = hot ? 'rgba(239, 68, 68, 0.85)' : 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  for (const g of G.guards) {
    const hot = g.state === 'chase';
    const warm = g.state === 'suspicious' || g.suspicion > 55;
    ctx.fillStyle = hot
      ? 'rgba(239, 68, 68, 0.28)'
      : warm
        ? 'rgba(249, 115, 22, 0.22)'
        : 'rgba(250, 204, 21, 0.15)';
    conePath(ctx, g.x, g.y, g.angle, 230, 0.56);
    ctx.fill();
    ctx.strokeStyle = hot
      ? 'rgba(239, 68, 68, 0.8)'
      : warm
        ? 'rgba(249, 115, 22, 0.6)'
        : 'rgba(250, 204, 21, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// ---------------------------------------------------------------- actors

function drawGuard(ctx, g, t) {
  // Suspicion ring under the guard.
  if (g.suspicion > 5) {
    ctx.strokeStyle = g.suspicion >= 100 ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 21, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * g.suspicion) / 100);
    ctx.stroke();
  }
  // Body: navy uniform, cap, facing tick.
  ctx.fillStyle = '#1e3a5f';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#0f2440';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 15, g.angle - 1.1, g.angle + 1.1);
  ctx.lineTo(g.x, g.y);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.angle) * 17, g.y + Math.sin(g.angle) * 17, 3, 0, Math.PI * 2);
  ctx.fill();
  // "?" while uneasy, "!" while chasing.
  if (g.state === 'chase') {
    ctx.fillStyle = '#ef4444';
    ctx.font = FONT(22);
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 24);
  } else if (g.suspicion > 55) {
    ctx.fillStyle = '#f59e0b';
    ctx.font = FONT(20);
    ctx.textAlign = 'center';
    ctx.fillText('?', g.x, g.y - 24);
  }
}

function drawCamera(ctx, c) {
  ctx.fillStyle = '#334155';
  roundRect(ctx, c.x - 10, c.y - 7, 20, 14, 3);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = c.spotting ? '#ef4444' : '#f87171';
  ctx.beginPath();
  ctx.arc(c.x + Math.cos(c.angle) * 12, c.y + Math.sin(c.angle) * 12, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawThief(ctx, th, t) {
  // Footstep ring while running loud.
  if (th.noisePulse > 0) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 * (th.noisePulse / 0.35)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(th.x, th.y, 13 + (0.35 - th.noisePulse) * 60, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Body: dark teal, crouched lower while sneaking.
  const r = th.sneaking ? 11 : 13;
  ctx.fillStyle = '#0d9488';
  ctx.beginPath();
  ctx.arc(th.x, th.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5eead4';
  ctx.lineWidth = 2;
  ctx.stroke();
  // The mask: a dark band with two bright eyes.
  ctx.fillStyle = '#042f2e';
  ctx.beginPath();
  ctx.arc(th.x, th.y, r, th.angle - 1.2, th.angle + 1.2);
  ctx.lineTo(th.x, th.y);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  const ex = Math.cos(th.angle);
  const ey = Math.sin(th.angle);
  const px = -ey;
  const py = ex;
  ctx.beginPath();
  ctx.arc(th.x + ex * 6 + px * 4, th.y + ey * 6 + py * 4, 2.2, 0, Math.PI * 2);
  ctx.arc(th.x + ex * 6 - px * 4, th.y + ey * 6 - py * 4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  if (th.sneaking) {
    ctx.fillStyle = 'rgba(94, 234, 212, 0.9)';
    ctx.font = FONT(11, 600);
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', th.x, th.y - 18);
  }
}

function drawSmoke(ctx, G) {
  for (const c of G.smokeClouds) {
    const a = Math.min(0.75, (c.t / 0.6) * 0.75);
    ctx.fillStyle = `rgba(148, 163, 184, ${a})`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(226, 232, 240, ${a * 0.6})`;
    ctx.beginPath();
    ctx.arc(c.x - 22, c.y - 14, c.r * 0.5, 0, Math.PI * 2);
    ctx.arc(c.x + 24, c.y + 12, c.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoin(ctx, G, t) {
  if (!G.coin) return;
  const age = t - G.coin.born;
  ctx.strokeStyle = `rgba(250, 204, 21, ${Math.max(0, 0.8 - age)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(G.coin.x, G.coin.y, 6 + age * 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(G.coin.x, G.coin.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#713f12';
  ctx.font = FONT(9);
  ctx.textAlign = 'center';
  ctx.fillText('¢', G.coin.x, G.coin.y + 3);
}

function drawLoot(ctx, G, t) {
  const pulse = 0.55 + Math.sin(t * 3) * 0.25;
  for (const l of G.loot) {
    if (l.taken) continue;
    const glow = l.kind === 'star' ? 26 : 16;
    const grad = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, glow);
    grad.addColorStop(0, `rgba(250, 204, 21, ${pulse})`);
    grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(l.x, l.y, glow, 0, Math.PI * 2);
    ctx.fill();
    if (l.kind === 'star') {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 16);
      ctx.lineTo(l.x + 12, l.y);
      ctx.lineTo(l.x, l.y + 16);
      ctx.lineTo(l.x - 12, l.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff7cc';
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 9);
      ctx.lineTo(l.x + 6, l.y);
      ctx.lineTo(l.x, l.y + 9);
      ctx.lineTo(l.x - 6, l.y);
      ctx.closePath();
      ctx.fill();
    } else if (l.kind === 'gem') {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 10);
      ctx.lineTo(l.x + 9, l.y - 3);
      ctx.lineTo(l.x + 6, l.y + 9);
      ctx.lineTo(l.x - 6, l.y + 9);
      ctx.lineTo(l.x - 9, l.y - 3);
      ctx.closePath();
      ctx.fill();
    } else if (l.kind === 'gold') {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(l.x - 11, l.y - 5, 10, 8);
      ctx.fillRect(l.x + 1, l.y - 5, 10, 8);
      ctx.fillRect(l.x - 5, l.y - 12, 10, 8);
    } else {
      // Painting: a little framed canvas.
      ctx.fillStyle = '#78350f';
      ctx.fillRect(l.x - 13, l.y - 10, 26, 20);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(l.x - 10, l.y - 7, 20, 14);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(l.x - 10, l.y - 7, 20, 7);
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = FONT(11, 600);
    ctx.textAlign = 'center';
    ctx.fillText(l.label, l.x, l.y + (l.kind === 'star' ? 30 : 26));
  }
}

// ---------------------------------------------------------------- HUD

function drawHud(ctx, G, t) {
  const L = G.level;
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, 1280, 64);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, 62, 1280, 2);

  // Left: room name.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fbbf24';
  ctx.font = FONT(20);
  ctx.fillText(L.name, 18, 27);
  ctx.fillStyle = '#94a3b8';
  ctx.font = FONT(12, 500);
  ctx.fillText(`ROOM ${G.levelIndex + 1} / 3 · ${G.loot.filter((l) => l.taken).length}/${G.loot.length} LOOT`, 18, 47);

  // Centre: the alarm meter.
  const ax = 470;
  const aw = 340;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = FONT(13, 700);
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, 24);
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, ax, 32, aw, 18, 9);
  ctx.fill();
  const frac = G.alarm / 100;
  const col = G.alarm < 35 ? '#22c55e' : G.alarm < 70 ? '#f59e0b' : '#ef4444';
  if (frac > 0) {
    ctx.fillStyle = col;
    roundRect(ctx, ax, 32, aw * frac, 18, 9);
    ctx.fill();
  }
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  roundRect(ctx, ax, 32, aw, 18, 9);
  ctx.stroke();
  ctx.fillStyle = G.lockdown > 0 ? '#ef4444' : '#e2e8f0';
  ctx.font = FONT(13, 700);
  ctx.textAlign = 'left';
  ctx.fillText(
    G.lockdown > 0 ? `LOCKDOWN ${Math.ceil(G.lockdown)}s` : `${Math.round(G.alarm)}%`,
    ax + aw + 12,
    47,
  );

  // Right: score, lives, tools, time. On the win screen the score is final.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fbbf24';
  ctx.font = FONT(20);
  ctx.fillText(`$${G.screen === 'win' ? G.score : G.score + G.levelScore}`, 1262, 27);
  ctx.fillStyle = '#94a3b8';
  ctx.font = FONT(12, 600);
  ctx.fillText(
    `LIVES ${G.lives}   COIN ×${G.thief.coins}   SMOKE ×${G.thief.smoke}   ${fmtTime(G.levelTime)}`,
    1262,
    47,
  );

  // Star reminder until it is taken.
  if (!G.starTaken && G.screen === 'play') {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.95)';
    ctx.font = FONT(13, 700);
    ctx.textAlign = 'center';
    ctx.fillText('STEAL THE ★ THEN REACH THE EXIT', 640, 100);
  }
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- banners

function drawBanners(ctx, G, t) {
  if (G.spottedFlash > 0) {
    ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(0.28, G.spottedFlash * 0.2)})`;
    ctx.fillRect(0, 64, 1280, 656);
    ctx.fillStyle = '#ef4444';
    ctx.font = FONT(44);
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED!', 640, 170);
  }
  if (G.lockdown > 0) {
    ctx.fillStyle = '#ef4444';
    ctx.font = FONT(26);
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ LOCKDOWN — GET OUT OR GET CAUGHT ⚠`, 640, 120);
  }
  if (G.message) {
    ctx.fillStyle = 'rgba(11, 18, 32, 0.85)';
    const w = ctx.measureText(G.message).width + 36;
    roundRect(ctx, 640 - w / 2, 676, w, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.font = FONT(14, 600);
    ctx.textAlign = 'center';
    ctx.fillText(G.message, 640, 696);
  }
}

// ---------------------------------------------------------------- screens

function dim(ctx) {
  ctx.fillStyle = 'rgba(4, 8, 18, 0.72)';
  ctx.fillRect(0, 64, 1280, 656);
}

function panel(ctx, y, h) {
  ctx.fillStyle = 'rgba(11, 18, 32, 0.92)';
  roundRect(ctx, 290, y, 700, h, 16);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawTitle(ctx, G, t) {
  dim(ctx);
  panel(ctx, 150, 420);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = FONT(52);
  ctx.fillText('CAT BURGLAR', 640, 225);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = FONT(24);
  ctx.fillText('— THE AMBER GALLERY —', 640, 262);
  ctx.fillStyle = '#94a3b8';
  ctx.font = FONT(16, 500);
  ctx.fillText('One thief. Three rooms. One very shiny star.', 640, 300);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = FONT(15, 600);
  ctx.fillText('WASD / ARROWS — move      SHIFT — sneak (slow, silent)', 640, 350);
  ctx.fillText('E or CLICK — toss a coin to distract a guard', 640, 378);
  ctx.fillText('Q — smoke pellet (blinds guards & cameras)', 640, 406);
  ctx.fillText('Hide in SHADOW patches · dodge the cones · mind the ALARM', 640, 434);
  ctx.fillStyle = '#fbbf24';
  ctx.font = FONT(17, 600);
  ctx.fillText('Steal the ★, then reach the green EXIT. Three rooms, one getaway.', 640, 472);
  const blink = 0.6 + Math.sin(t * 4) * 0.4;
  ctx.fillStyle = `rgba(74, 222, 128, ${blink})`;
  ctx.font = FONT(22);
  ctx.fillText('PRESS ENTER OR CLICK TO START THE HEIST', 640, 530);
}

function drawBusted(ctx, G) {
  dim(ctx);
  panel(ctx, 220, 260);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ef4444';
  ctx.font = FONT(46);
  ctx.fillText('BUSTED!', 640, 300);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = FONT(17, 500);
  ctx.fillText('The guards dragged you out by the collar.', 640, 340);
  ctx.fillText(`Lives left: ${G.lives} · Score so far: $${G.score}`, 640, 372);
  ctx.fillStyle = '#4ade80';
  ctx.font = FONT(20);
  ctx.fillText('PRESS ENTER TO TRY THE ROOM AGAIN', 640, 432);
}

function drawLevelClear(ctx, G) {
  dim(ctx);
  panel(ctx, 180, 330);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4ade80';
  ctx.font = FONT(42);
  ctx.fillText('CLEAN GETAWAY!', 640, 252);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = FONT(17, 500);
  ctx.fillText(`${G.level.name} — loot $${G.levelScore}`, 640, 292);
  ctx.fillText(`Time bonus $${G.clearBonus.time} · Ghost bonus $${G.clearBonus.ghost}`, 640, 324);
  ctx.fillStyle = '#fbbf24';
  ctx.font = FONT(22);
  ctx.fillText(`Room total: $${G.clearBonus.total}`, 640, 362);
  ctx.fillStyle = '#4ade80';
  ctx.font = FONT(20);
  ctx.fillText(G.levelIndex + 1 < 3 ? 'PRESS ENTER FOR THE NEXT ROOM' : 'PRESS ENTER FOR THE FINAL SCORE', 640, 452);
}

function drawGameOver(ctx, G) {
  dim(ctx);
  panel(ctx, 200, 300);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ef4444';
  ctx.font = FONT(46);
  ctx.fillText('THE HEIST FAILED', 640, 280);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = FONT(17, 500);
  ctx.fillText('Three busts, no star, and a very cross museum director.', 640, 322);
  ctx.fillText(`Final score: $${G.score}`, 640, 354);
  ctx.fillStyle = '#4ade80';
  ctx.font = FONT(20);
  ctx.fillText('PRESS ENTER TO START OVER', 640, 440);
}

function drawWin(ctx, G) {
  dim(ctx);
  panel(ctx, 160, 380);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = FONT(46);
  ctx.fillText('THE GREAT ESCAPE!', 640, 235);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = FONT(18, 500);
  ctx.fillText('Three rooms. Three stars. One legend of the night.', 640, 280);
  ctx.fillStyle = '#fbbf24';
  ctx.font = FONT(30);
  ctx.fillText(`FINAL SCORE: $${G.score}`, 640, 340);
  ctx.fillStyle = '#94a3b8';
  ctx.font = FONT(16, 500);
  ctx.fillText('The Amber Gallery will be talking about this one for years.', 640, 380);
  ctx.fillText('Rank: ' + rankTitle(G.score), 640, 412);
  ctx.fillStyle = '#4ade80';
  ctx.font = FONT(20);
  ctx.fillText('PRESS ENTER TO STEAL IT ALL AGAIN', 640, 488);
}

/** A rank title for the final score. */
export function rankTitle(score) {
  if (score >= 3200) return 'MASTER THIEF';
  if (score >= 2600) return 'SHADOW ARTIST';
  if (score >= 2000) return 'SMOOTH OPERATOR';
  if (score >= 1400) return 'PICKPOCKET PRO';
  return 'AMATEUR BURGLAR';
}
