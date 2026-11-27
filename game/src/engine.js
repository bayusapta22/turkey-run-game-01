// Turkey Run — the engine: states, physics, collisions, scoring.
// States: title -> playing -> caught | escaped, with pause and restart.
import { CFG, clamp, zoneAt } from './config.js';
import { createWorld, updateWorld, updateFarmer } from './world.js';
import * as sfx from './audio.js';

export function createGame() {
  return {
    state: 'title',
    time: 0,
    world: createWorld(),
    player: {
      x: 180, y: CFG.GROUND_Y, vy: 0, onGround: true, jumps: 0,
      sliding: false, slideTimer: 0, width: 52, height: 62,
    },
    farmer: { x: 46, y: CFG.GROUND_Y },
    lives: CFG.START_LIVES,
    corn: 0,
    score: 0,
    best: 0,
    featherTimer: 0,
    chiliTimer: 0,
    hitFlash: 0, // invulnerability window after a hit
    shake: 0,
    caughtReason: '',
    escapeTime: 0,
    alarmPlayed: false,
    stats: { jumps: 0, hits: 0, cornEaten: 0, knivesDodged: 0 },
    muted: false,
  };
}

export function startRun(g) {
  g.world = createWorld();
  g.player = {
    x: 180, y: CFG.GROUND_Y, vy: 0, onGround: true, jumps: 0,
    sliding: false, slideTimer: 0, width: 52, height: 62,
  };
  g.farmer = { x: 46, y: CFG.GROUND_Y };
  g.lives = CFG.START_LIVES;
  g.corn = 0;
  g.score = 0;
  g.featherTimer = 0;
  g.chiliTimer = 0;
  g.hitFlash = 0;
  g.shake = 0;
  g.caughtReason = '';
  g.alarmPlayed = false;
  g.stats = { jumps: 0, hits: 0, cornEaten: 0, knivesDodged: 0 };
  g.state = 'playing';
  g.time = 0;
  sfx.ensureAudio();
  sfx.startMusic();
  sfx.sfxGobble();
}

function endRun(g, escaped, reason) {
  g.state = escaped ? 'escaped' : 'caught';
  g.caughtReason = reason || '';
  g.escapeTime = g.world.elapsed;
  g.best = Math.max(g.best, Math.floor(g.score));
  sfx.stopMusic();
  if (escaped) sfx.sfxWin();
  else sfx.sfxLose();
}

function hurtPlayer(g, reason) {
  if (g.hitFlash > 0 || g.featherTimer > 0) return;
  g.lives -= 1;
  g.stats.hits += 1;
  g.hitFlash = 1.6;
  g.shake = 0.35;
  g.farmer.x = Math.min(g.farmer.x + 56, g.player.x - 42);
  sfx.sfxHurt();
  if (g.lives <= 0) endRun(g, false, reason);
}

// Axis-aligned overlap of the turkey (shrunk a touch for fairness) vs a box.
function overlaps(p, b) {
  const pw = p.sliding ? 56 : 40;
  const ph = p.sliding ? 30 : 52;
  const px = p.x - pw / 2;
  const py = p.y - ph;
  return px < b.x + b.w && px + pw > b.x && py < b.y + b.h && py + ph > b.y;
}

export function update(g, input, dt) {
  dt = Math.min(dt, 0.033);
  g.time += dt;
  if (g.shake > 0) g.shake -= dt;
  if (g.hitFlash > 0) g.hitFlash -= dt;
  if (g.featherTimer > 0) g.featherTimer -= dt;
  if (g.chiliTimer > 0) g.chiliTimer -= dt;

  // --- title screen ---
  if (g.state === 'title') {
    if (input.jumpPressed || input.clicked) {
      input.jumpPressed = false;
      input.clicked = false;
      startRun(g);
      return;
    }
    input.jumpPressed = false;
    input.clicked = false;
    return;
  }

  // --- end screens ---
  if (g.state === 'caught' || g.state === 'escaped') {
    if (input.restartPressed || input.jumpPressed || input.clicked) {
      input.restartPressed = false;
      input.jumpPressed = false;
      input.clicked = false;
      startRun(g);
    }
    input.restartPressed = false;
    input.jumpPressed = false;
    input.clicked = false;
    return;
  }

  // --- pause ---
  if (input.pausePressed) {
    input.pausePressed = false;
    g.state = g.state === 'paused' ? 'playing' : 'paused';
    if (g.state === 'paused') sfx.stopMusic();
    else sfx.startMusic();
    return;
  }
  if (g.state === 'paused') {
    if (input.restartPressed) {
      input.restartPressed = false;
      startRun(g);
    }
    return;
  }

  // --- playing ---
  const p = g.player;
  const w = g.world;

  // Horizontal movement: run ahead to pull away, drift back to catch breath.
  let speed = w.speed;
  if (input.right) {
    p.x += 150 * dt;
    speed *= 1.12;
  }
  if (input.left) {
    p.x -= 150 * dt;
    speed *= 0.9;
  }
  p.x = clamp(p.x, 84, 430);
  if (g.chiliTimer > 0) speed *= 1.35;

  // Jump / double-jump flap. Clicking the canvas also flaps.
  if (input.jumpPressed || input.clicked) {
    input.jumpPressed = false;
    input.clicked = false;
    if (p.onGround) {
      p.vy = CFG.JUMP_V;
      p.onGround = false;
      p.jumps = 1;
      g.stats.jumps += 1;
      sfx.sfxJump();
    } else if (p.jumps < 2) {
      p.vy = CFG.DOUBLE_JUMP_V;
      p.jumps = 2;
      g.stats.jumps += 1;
      sfx.sfxFlap();
    }
  }
  input.jumpPressed = false;
  input.clicked = false;

  // Slide under the cleaver.
  if (input.slideHeld && p.onGround) {
    if (!p.sliding) p.slideTimer = CFG.SLIDE_TIME;
    p.sliding = true;
  }
  if (p.sliding) {
    p.slideTimer -= dt;
    if (p.slideTimer <= 0 || !input.slideHeld) p.sliding = false;
  }

  // Gravity.
  p.vy += CFG.GRAVITY * dt;
  p.y += p.vy * dt;
  if (p.y >= CFG.GROUND_Y) {
    p.y = CFG.GROUND_Y;
    p.vy = 0;
    p.onGround = true;
    p.jumps = 0;
  }

  // World + farmer.
  const events = [];
  updateWorld(w, dt, speed, events);
  for (const e of events) if (e.type === 'knifeLand') sfx.sfxKnife();

  const caught = updateFarmer(g.farmer, dt, speed, p.x, g.hitFlash);
  if (caught) {
    endRun(g, false, 'Farmer Bram caught Pip by the tail feathers!');
    return;
  }

  // Farmer closing in? Sound the alarm once per approach.
  const gap = p.x - g.farmer.x;
  if (gap < 90 && !g.alarmPlayed) {
    g.alarmPlayed = true;
    sfx.sfxAlarm();
  } else if (gap > 150) {
    g.alarmPlayed = false;
  }

  // Pickups.
  for (const pk of w.pickups) {
    if (pk.dead) continue;
    const dx = pk.x - p.x;
    const dy = pk.y - (p.y - 30);
    if (Math.abs(dx) < 36 && Math.abs(dy) < 42) {
      pk.dead = true;
      if (pk.kind === 'corn') {
        g.corn += 1;
        g.stats.cornEaten += 1;
        g.score += CFG.CORN_SCORE;
        g.farmer.x = Math.max(46, g.farmer.x - 22);
        sfx.sfxCorn();
      } else if (pk.kind === 'feather') {
        g.featherTimer = CFG.FEATHER_TIME;
        g.score += 50;
        sfx.sfxFeather();
      } else if (pk.kind === 'chili') {
        g.chiliTimer = CFG.CHILI_TIME;
        g.score += 30;
        sfx.sfxChili();
      }
    }
  }
  w.pickups = w.pickups.filter((pk) => !pk.dead);

  // Hazards.
  for (const h of w.hazards) {
    if (h.dead) continue;
    if (h.kind === 'knife' && h.state !== 'stuck') {
      // A falling knife only hurts once it sticks in the ground.
      if (h.state === 'falling') {
        const dx = Math.abs(h.x - p.x);
        if (dx < 26 && p.y > h.y && p.y < h.y + h.h + 40 && g.hitFlash <= 0 && g.featherTimer <= 0) {
          hurtPlayer(g, 'A carving knife nearly made Pip the main course!');
          h.dead = true;
        }
      }
      continue;
    }
    if (h.kind === 'knife' && h.state === 'stuck') {
      if (overlaps(p, { x: h.x - 8, y: CFG.GROUND_Y - 62, w: 16, h: 62 })) {
        hurtPlayer(g, 'Pip tripped over a carving knife!');
      }
      continue;
    }
    if (h.kind === 'cleaver') {
      const cx = h.x + Math.sin(h.t * 2.2) * 40;
      const box = { x: cx - 26, y: h.y - 10, w: 52, h: 60 };
      if (!p.sliding && overlaps(p, box)) {
        hurtPlayer(g, 'The cleaver caught Pip mid-stride!');
      } else if (p.sliding && overlaps(p, box)) {
        g.stats.knivesDodged += 1;
      }
      continue;
    }
    if (h.kind === 'grate') {
      if (p.onGround && p.x > h.x && p.x < h.x + h.w) {
        hurtPlayer(g, 'Pip stood on a glowing hot oven grate!');
      }
      continue;
    }
    if (h.kind === 'oven') {
      if (overlaps(p, { x: h.x + 8, y: CFG.GROUND_Y - h.h, w: h.w - 16, h: h.h })) {
        hurtPlayer(g, 'Pip bumped straight into the oven!');
      }
      continue;
    }
    // hay / fence / pumpkin: jump them, or take the hit.
    const box = h.kind === 'pumpkin'
      ? { x: h.x - 24, y: h.y - 24, w: 48, h: 48 }
      : { x: h.x - h.w / 2, y: CFG.GROUND_Y - h.h, w: h.w, h: h.h };
    if (overlaps(p, box)) {
      // Feet above the obstacle's top (with a small grace margin) = cleared it.
      const cleared = p.y < CFG.GROUND_Y - h.h + 14;
      if (cleared) {
        g.stats.knivesDodged += 1;
      } else {
        hurtPlayer(g, h.kind === 'pumpkin'
          ? 'A runaway pumpkin bowled Pip over!'
          : 'Pip crashed into a ' + (h.kind === 'hay' ? 'hay bale!' : 'fence!'));
        h.dead = true;
      }
    }
  }
  w.hazards = w.hazards.filter((h) => !h.dead);

  // Score: distance plus bonuses.
  g.score += speed * dt * 0.12;
  if (g.featherTimer > 0) g.score += dt * 20;

  // Escape!
  if (w.distance >= CFG.FINISH_M) {
    endRun(g, true, '');
  }
}

export function zoneName(g) {
  return zoneAt(g.world.distance).name;
}

export function progress(g) {
  return clamp(g.world.distance / CFG.FINISH_M, 0, 1);
}
