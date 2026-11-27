// Turkey Run — rendering: the scene, the HUD and every screen.
// Buttons are canvas rects; main.js asks screenButtons() where they are.
import { CFG, clamp, zoneAt } from './config.js';
import {
  drawSky, drawHills, drawGround, drawTurkey, drawFarmer, drawOven,
  drawKnife, drawCleaver, drawCorn, drawPumpkin, drawHay, drawFence,
  drawGrate, drawHeart,
} from './art.js';

export const BTN_START = { x: 360, y: 420, w: 240, h: 56 };
export const BTN_AGAIN = { x: 380, y: 428, w: 200, h: 56 };
export const BTN_HOW = { x: 380, y: 486, w: 200, h: 36 };

export function screenButtons(state) {
  if (state === 'title') return [{ id: 'start', rect: BTN_START }];
  if (state === 'caught' || state === 'escaped') return [{ id: 'again', rect: BTN_AGAIN }];
  return [];
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function button(ctx, rect, label, sub) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, rect.x + 3, rect.y + 4, rect.w, rect.h, 12);
  ctx.fill();
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, '#ffb347');
  g.addColorStop(1, '#e07b2a');
  ctx.fillStyle = g;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#fff3c4';
  ctx.lineWidth = 2;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.stroke();
  ctx.fillStyle = '#4a2400';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + (sub ? -7 : 1));
  if (sub) {
    ctx.font = '13px Georgia, serif';
    ctx.fillText(sub, rect.x + rect.w / 2, rect.y + rect.h / 2 + 15);
  }
}

function drawScene(ctx, g, showActors = true) {
  const w = g.world;
  const zone = zoneAt(w.distance);
  const t = g.time;
  ctx.save();
  if (g.shake > 0) {
    ctx.translate((Math.random() - 0.5) * g.shake * 30, (Math.random() - 0.5) * g.shake * 30);
  }
  drawSky(ctx, zone, t);
  drawHills(ctx, zone, w.scroll);
  drawGround(ctx, zone, w.scroll, t);

  // Knife telegraph shadows on the ground.
  for (const h of w.hazards) {
    if (h.kind === 'knife' && h.state === 'telegraph') {
      const a = 0.25 + 0.45 * (h.t / 0.85);
      ctx.fillStyle = `rgba(20,0,0,${a.toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(h.x, CFG.GROUND_Y + 6, 16 + h.t * 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(200,30,30,${(a * 0.9).toFixed(2)})`;
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', h.x, CFG.GROUND_Y - 52);
    }
  }

  // Pickups.
  for (const p of w.pickups) {
    if (p.kind === 'corn') drawCorn(ctx, p.x, p.y, g.time, false);
    else if (p.kind === 'feather') drawCorn(ctx, p.x, p.y, g.time, true);
    else if (p.kind === 'chili') {
      ctx.save();
      ctx.translate(p.x, p.y + Math.sin(g.time * 4) * 4);
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 18, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4e8a2f';
      ctx.fillRect(-2, -22, 4, 8);
      ctx.restore();
    }
  }

  // Hazards.
  for (const h of w.hazards) {
    if (h.kind === 'hay') drawHay(ctx, h.x - h.w / 2, CFG.GROUND_Y, h.w, h.h);
    else if (h.kind === 'fence') drawFence(ctx, h.x - h.w / 2, CFG.GROUND_Y, h.w, h.h);
    else if (h.kind === 'pumpkin') drawPumpkin(ctx, h.x, h.y, 26, h.rot);
    else if (h.kind === 'knife') {
      if (h.state === 'falling' || h.state === 'stuck') drawKnife(ctx, h.x, h.y + 34, 0);
    } else if (h.kind === 'cleaver') {
      drawCleaver(ctx, h.x, 60, h.y + Math.sin(h.t * 2.2) * 12, h.t * 2.2);
    } else if (h.kind === 'oven') drawOven(ctx, h.x - h.w / 2, CFG.GROUND_Y, h.w, h.h, g.time);
    else if (h.kind === 'grate') drawGrate(ctx, h.x, CFG.GROUND_Y, h.w, g.time);
  }

  // Farmer Bram, hot on Pip's tail (skipped on end screens: drawEnd stages them).
  if (showActors) {
    const urgent = g.player.x - g.farmer.x < 110;
    drawFarmer(ctx, g.farmer.x, CFG.GROUND_Y, g.time, urgent);

    // Pip, flashing while invulnerable after a hit.
    const p = g.player;
    const blink = g.hitFlash > 0 && Math.floor(g.time * 12) % 2 === 0;
    if (!blink) {
      drawTurkey(ctx, p.x, p.y, g.time, p.sliding, g.featherTimer, g.time, 1);
    }

    // Golden feather shield ring.
    if (g.featherTimer > 0) {
      ctx.strokeStyle = 'rgba(255,215,80,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 30, 52 + Math.sin(g.time * 6) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawHud(ctx, g) {
  const w = g.world;
  const zone = zoneAt(w.distance);
  // Top bar.
  ctx.fillStyle = 'rgba(30,18,8,0.55)';
  roundRect(ctx, 12, 10, CFG.W - 24, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('SCORE ' + Math.floor(g.score), 26, 40);
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = '#ffd94d';
  ctx.fillText(Math.floor(w.distance) + ' m / ' + CFG.FINISH_M + ' m', 26, 64);
  // Hearts.
  for (let i = 0; i < CFG.START_LIVES; i++) {
    drawHeart(ctx, 560 + i * 30, 34, i < g.lives);
  }
  // Zone + progress.
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(zone.name, 700, 30);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 600, 40, 200, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#7ee081';
  const pw = 200 * clamp(w.distance / CFG.FINISH_M, 0, 1);
  if (pw > 0) {
    roundRect(ctx, 600, 40, pw, 10, 5);
    ctx.fill();
  }
  ctx.fillStyle = '#fff3c4';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('ESCAPE', 700, 66);
  // Corn count.
  ctx.textAlign = 'right';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillStyle = '#ffd94d';
  ctx.fillText('🌽 ' + g.corn, 936, 40);
  // Danger meter: how close is Bram?
  const gap = clamp((g.player.x - g.farmer.x) / 260, 0, 1);
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillStyle = gap < 0.35 ? '#ff6b5e' : '#fff3c4';
  ctx.fillText('FARMER', 26, 96);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  roundRect(ctx, 92, 86, 150, 12, 6);
  ctx.fill();
  ctx.fillStyle = gap < 0.35 ? '#ff3b2f' : '#ffb347';
  roundRect(ctx, 92, 86, 150 * (1 - gap), 12, 6);
  ctx.fill();
  // Power-up timers.
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillStyle = '#ffd94d';
  if (g.featherTimer > 0) ctx.fillText('GOLDEN FEATHER ' + g.featherTimer.toFixed(1) + 's', 260, 96);
  if (g.chiliTimer > 0) ctx.fillText('CHILI DASH!', 260, 96);
  // Controls hint, on a dark pill at the bottom so it reads over any sky.
  ctx.fillStyle = 'rgba(30,18,8,0.55)';
  roundRect(ctx, 208, 512, 544, 22, 11);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,243,196,0.9)';
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('← → move · SPACE jump ×2 flap · ↓ slide · P pause · M mute', 480, 527);
}

function drawTitle(ctx, g) {
  const zone = CFG.ZONES[0];
  const t = g.time;
  drawSky(ctx, zone, t);
  drawHills(ctx, zone, t * 30);
  drawGround(ctx, zone, t * 30, t);
  drawTurkey(ctx, 200, CFG.GROUND_Y, t, false, 0, t, 1);
  drawFarmer(ctx, 90, CFG.GROUND_Y, t, false);
  // Title card.
  ctx.fillStyle = 'rgba(30,18,8,0.45)';
  roundRect(ctx, 300, 60, 560, 250, 18);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('TURKEY RUN', 580, 140);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'italic bold 24px Georgia, serif';
  ctx.fillText('Pip escapes Thanksgiving dinner!', 580, 180);
  ctx.fillStyle = '#fff3c4';
  ctx.font = '18px Georgia, serif';
  ctx.fillText('Farmer Bram is behind you. Dodge the oven,', 580, 222);
  ctx.fillText('duck the carving knives, grab the corn —', 580, 248);
  ctx.fillText('and run 2000 m to the woods.', 580, 274);
  button(ctx, BTN_START, '▶  START THE RUN', 'or press SPACE');
  ctx.fillStyle = 'rgba(255,243,196,0.85)';
  ctx.font = '14px Georgia, serif';
  ctx.textAlign = 'center';
  if (g.best > 0) ctx.fillText('Best score so far: ' + g.best, 480, 512);
  ctx.fillText('A tiny original game · keyboard + mouse · sound on for gobbles', 480, 530);
}

function drawEnd(ctx, g, escaped) {
  ctx.fillStyle = escaped ? 'rgba(20,60,25,0.55)' : 'rgba(40,8,8,0.6)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  // Pip, free or caught, centre stage.
  if (escaped) drawTurkey(ctx, 480, 330, g.time, false, 1, g.time, 1);
  else {
    drawTurkey(ctx, 420, 400, g.time, true, 0, g.time, 1);
    drawFarmer(ctx, 330, CFG.GROUND_Y - 52, g.time, false);
  }
  ctx.fillStyle = escaped ? '#b8f7b0' : '#ffb3a7';
  ctx.font = 'bold 58px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', 480, 130);
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText(
    escaped
      ? 'Pip made it to the woods — no Thanksgiving dinner this year!'
      : g.caughtReason || 'Farmer Bram got you!',
    480, 170,
  );
  ctx.font = '20px Georgia, serif';
  const mins = Math.floor(g.escapeTime / 60);
  const secs = Math.floor(g.escapeTime % 60).toString().padStart(2, '0');
  ctx.fillText(
    `Score ${Math.floor(g.score)}  ·  Distance ${Math.floor(g.world.distance)} m  ·  Corn ${g.corn}  ·  Time ${mins}:${secs}`,
    480, 210,
  );
  ctx.fillText(
    `Jumps ${g.stats.jumps}  ·  Dodges ${g.stats.knivesDodged}  ·  Hits taken ${g.stats.hits}`,
    480, 240,
  );
  button(ctx, BTN_AGAIN, '↻  RUN AGAIN', 'or press SPACE / R');
  ctx.fillStyle = 'rgba(255,243,196,0.85)';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('Best score: ' + g.best, 480, 512);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20,12,6,0.6)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 48px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 480, 250);
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Press P to keep running · R to restart', 480, 290);
}

export function render(ctx, g) {
  ctx.clearRect(0, 0, CFG.W, CFG.H);
  if (g.state === 'title') {
    drawTitle(ctx, g);
  } else if (g.state === 'caught' || g.state === 'escaped') {
    drawScene(ctx, g, false); // backdrop only; drawEnd stages Pip and Bram
    drawEnd(ctx, g, g.state === 'escaped');
  } else {
    drawScene(ctx, g);
    drawHud(ctx, g);
    if (g.state === 'paused') drawPaused(ctx);
  }
}
