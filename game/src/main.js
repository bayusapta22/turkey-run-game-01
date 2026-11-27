// Turkey Run — bootstrap: canvas, loop, clicks and mute.
import { CFG } from './config.js';
import { createGame, update, startRun } from './engine.js';
import { render, screenButtons } from './render.js';
import { createInput, hitButton } from './input.js';
import { installShotsHook } from './shots.js';
import { ensureAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CFG.W;
canvas.height = CFG.H;

const game = createGame();

const input = createInput(canvas, {
  onMute: () => {
    game.muted = toggleMute();
  },
});

// Canvas clicks: buttons first (start / play again), otherwise a flap-jump.
// Buttons are checked here so a click on START never also jumps.
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * CFG.W;
  const y = ((e.clientY - r.top) / r.height) * CFG.H;
  for (const b of screenButtons(game.state)) {
    if (hitButton(x, y, b.rect)) {
      input.clicked = false; // swallow: the button handles this click
      ensureAudio();
      if (b.id === 'start' && game.state === 'title') startRun(game);
      else if (b.id === 'again' && (game.state === 'caught' || game.state === 'escaped')) startRun(game);
      return;
    }
  }
});

installShotsHook(game, input);

let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000;
  last = now;
  update(game, input, dt);
  render(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// First interaction unlocks audio (browsers require a gesture).
window.addEventListener('pointerdown', () => ensureAudio(), { once: true });
window.addEventListener('keydown', () => ensureAudio(), { once: true });
