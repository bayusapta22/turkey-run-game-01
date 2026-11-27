// Turkey Run — keyboard + mouse input. One shared state object; the engine
// reads it every frame. Clicking a button never also triggers a jump.
export function createInput(canvas, callbacks) {
  const keys = new Set();
  const state = {
    keys,
    left: false,
    right: false,
    jumpPressed: false, // edge-triggered: consumed by the engine
    slideHeld: false,
    pausePressed: false,
    restartPressed: false,
    anyPressed: false,
    pointerX: 0,
    pointerY: 0,
    clicked: false, // edge-triggered canvas click (jump)
  };

  function onKeyDown(e) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    keys.add(e.code);
    state.anyPressed = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') state.jumpPressed = true;
    if (e.code === 'KeyP' || e.code === 'Escape') state.pausePressed = true;
    if (e.code === 'KeyR') state.restartPressed = true;
    if (e.code === 'KeyM') callbacks.onMute();
    refresh();
  }

  function onKeyUp(e) {
    keys.delete(e.code);
    refresh();
  }

  function refresh() {
    state.left = keys.has('ArrowLeft') || keys.has('KeyA');
    state.right = keys.has('ArrowRight') || keys.has('KeyD');
    state.slideHeld = keys.has('ArrowDown') || keys.has('KeyS');
  }

  function onPointerDown(e) {
    const r = canvas.getBoundingClientRect();
    state.pointerX = ((e.clientX - r.left) / r.width) * 960;
    state.pointerY = ((e.clientY - r.top) / r.height) * 540;
    state.clicked = true;
    state.anyPressed = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return state;
}

// Buttons are drawn on the canvas; this maps a click to a named button rect.
export function hitButton(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
