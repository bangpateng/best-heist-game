// input.js — keyboard and mouse for the heist.
// WASD / arrows move, Shift sneaks, E tosses a coin toward the mouse,
// Q pops smoke, Enter confirms, R restarts, M mutes. A mouse click on the
// room also tosses a coin toward the click point.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    mx: 0,
    my: 0,
    sneak: false,
    mouseX: 0,
    mouseY: 0,
    coinQueued: false,
    coinTarget: null,
    smokeQueued: false,
    confirmQueued: false,
    restartQueued: false,
    muteQueued: false,
    anyKey: false,
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  function canvasPoint(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * 1280,
      y: ((clientY - r.top) / r.height) * 720,
    };
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    state.anyKey = true;
    if (e.code === 'KeyE') {
      state.coinQueued = true;
      state.coinTarget = { x: state.mouseX, y: state.mouseY };
    }
    if (e.code === 'KeyQ') state.smokeQueued = true;
    if (e.code === 'Enter' || e.code === 'Space') state.confirmQueued = true;
    if (e.code === 'KeyR') state.restartQueued = true;
    if (e.code === 'KeyM') state.muteQueued = true;
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const p = canvasPoint(e.clientX, e.clientY);
    state.mouseX = p.x;
    state.mouseY = p.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = canvasPoint(e.clientX, e.clientY);
    state.mouseX = p.x;
    state.mouseY = p.y;
    state.coinQueued = true;
    state.coinTarget = { x: p.x, y: p.y };
    state.anyKey = true;
  });

  /** Read the movement vector for this frame. */
  function poll() {
    let mx = 0;
    let my = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
    state.mx = mx;
    state.my = my;
    state.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
    return state;
  }

  /** Clear the one-shot queues after the frame consumed them. */
  function consume() {
    state.coinQueued = false;
    state.coinTarget = null;
    state.smokeQueued = false;
    state.confirmQueued = false;
    state.restartQueued = false;
    state.muteQueued = false;
    state.anyKey = false;
  }

  return { state, poll, consume };
}
