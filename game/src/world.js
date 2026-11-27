// Turkey Run — the world: hazard and pickup spawning, difficulty ramp,
// and the farmer's chase. The world scrolls; the turkey stays near x=180.
import { CFG, rand, randInt, choice, clamp } from './config.js';

export function createWorld() {
  return {
    distance: 0, // meters run
    scroll: 0, // px scrolled, for parallax
    speed: CFG.BASE_SPEED,
    spawnTimer: 1.2,
    knifeTimer: 3.5,
    hazards: [], // {kind, x, y, w, h, vx, vy, rot, t, state}
    pickups: [], // {kind, x, y, t}
    clouds: [],
    elapsed: 0,
  };
}

// Difficulty: spawn gap shrinks and speeds rise as the run goes on.
export function spawnGap(distance) {
  const d = clamp(distance / CFG.FINISH_M, 0, 1);
  return rand(CFG.SPAWN_MIN + 0.5 * (1 - d), CFG.SPAWN_MAX - 0.55 * d);
}

function hazardKinds(distance) {
  const kinds = ['hay', 'fence', 'pumpkin', 'knife'];
  if (distance > 250) kinds.push('knife', 'pumpkin');
  if (distance > 650) kinds.push('cleaver');
  if (distance > 1300) kinds.push('oven', 'grate', 'cleaver', 'knife');
  return kinds;
}

// Spawn one hazard group at the right edge. Groups are fair: a jumpable
// obstacle never overlaps a falling knife's landing spot at the same time.
export function spawnHazard(world) {
  const x = CFG.W + 60;
  const kind = choice(hazardKinds(world.distance));
  const gy = CFG.GROUND_Y;
  if (kind === 'hay') {
    world.hazards.push({ kind, x, y: gy, w: 74, h: 52, vx: 0, vy: 0, rot: 0, t: 0 });
  } else if (kind === 'fence') {
    world.hazards.push({ kind, x, y: gy, w: 84, h: 62, vx: 0, vy: 0, rot: 0, t: 0 });
  } else if (kind === 'pumpkin') {
    world.hazards.push({ kind, x, y: gy - 24, w: 52, h: 48, vx: -70, vy: 0, rot: 0, t: 0 });
  } else if (kind === 'knife') {
    // Telegraph first: a shadow grows on the ground, then the blade drops.
    const lx = rand(CFG.W * 0.45, CFG.W * 0.95);
    world.hazards.push({ kind: 'knife', x: lx, y: -40, w: 16, h: 68, vx: 0, vy: 0, rot: 0, t: 0, state: 'telegraph', landX: lx });
  } else if (kind === 'cleaver') {
    world.hazards.push({ kind: 'cleaver', x: rand(CFG.W * 0.6, CFG.W * 0.95), y: 150, w: 56, h: 90, vx: 0, vy: 0, rot: 0, t: rand(0, 6), state: 'swing' });
  } else if (kind === 'oven') {
    world.hazards.push({ kind: 'oven', x, y: gy, w: 110, h: 150, vx: 0, vy: 0, rot: 0, t: 0 });
  } else if (kind === 'grate') {
    world.hazards.push({ kind: 'grate', x, y: gy, w: randInt(90, 150), h: 10, vx: 0, vy: 0, rot: 0, t: 0 });
  }
  // Corn often trails a jumpable hazard so a good jump pays off.
  if (kind === 'hay' || kind === 'fence' || kind === 'pumpkin') {
    const n = randInt(2, 3);
    for (let i = 0; i < n; i++) {
      world.pickups.push({ kind: 'corn', x: x + 30 + i * 34, y: gy - 120 - (i % 2) * 24, t: 0 });
    }
  }
}

export function spawnPickupRow(world) {
  const gy = CFG.GROUND_Y;
  const kind = Math.random() < 0.12 ? 'feather' : Math.random() < 0.22 ? 'chili' : 'corn';
  const baseX = CFG.W + 80;
  if (kind === 'corn') {
    const n = randInt(3, 5);
    const arc = Math.random() < 0.5;
    for (let i = 0; i < n; i++) {
      world.pickups.push({
        kind,
        x: baseX + i * 36,
        y: arc ? gy - 70 - Math.sin((i / (n - 1)) * Math.PI) * 70 : gy - 60,
        t: 0,
      });
    }
  } else {
    world.pickups.push({ kind, x: baseX, y: gy - 110, t: 0 });
  }
}

// Move hazards/pickups with the world. Returns events the engine acts on:
// knives that just landed (sound), hazards that left the screen.
export function updateWorld(world, dt, speed, events) {
  world.elapsed += dt;
  world.distance += (speed * dt) / 28; // ~28 px per meter
  world.scroll += speed * dt;
  world.speed = Math.min(CFG.MAX_SPEED, CFG.BASE_SPEED + world.elapsed * CFG.SPEED_RAMP);

  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    if (Math.random() < 0.62) spawnHazard(world);
    else spawnPickupRow(world);
    world.spawnTimer = spawnGap(world.distance);
  }

  for (const h of world.hazards) {
    h.t += dt;
    if (h.kind === 'pumpkin') {
      h.x += h.vx * dt - speed * dt;
      h.rot += dt * 4;
    } else if (h.kind === 'knife') {
      if (h.state === 'telegraph') {
        h.x = h.landX - speed * dt * 0.25; // shadow drifts slowly with the world
        h.landX = h.x;
        if (h.t > 0.85) {
          h.state = 'falling';
          h.y = -40;
        }
      } else if (h.state === 'falling') {
        h.vy += 2600 * dt;
        h.y += h.vy * dt;
        if (h.y >= CFG.GROUND_Y - h.h) {
          h.y = CFG.GROUND_Y - h.h;
          h.state = 'stuck';
          h.t = 0;
          events.push({ type: 'knifeLand', x: h.x });
        }
      } else if (h.state === 'stuck') {
        h.x -= speed * dt;
        if (h.t > 1.6) h.dead = true;
      }
    } else if (h.kind === 'cleaver') {
      h.x -= speed * dt;
    } else {
      h.x -= speed * dt;
    }
    if (h.x < -220) h.dead = true;
  }
  world.hazards = world.hazards.filter((h) => !h.dead);

  for (const p of world.pickups) {
    p.t += dt;
    p.x -= speed * dt;
    if (p.x < -40) p.dead = true;
  }
  world.pickups = world.pickups.filter((p) => !p.dead);
}

// The farmer gains when Pip dawdles or gets hit, loses ground when Pip
// runs fast and eats corn. He moves relative to the scrolling world: at
// Pip's pace he holds his ground; slower and he closes in. Returns true
// the moment he catches Pip.
export function updateFarmer(farmer, dt, speed, playerX, hitFlash) {
  const gap = playerX - farmer.x;
  const pressure = 1 - clamp(gap / 260, 0, 1);
  // Factor 1.0 means "holds station"; above 1.0 he gains, below he drops back.
  let factor = 0.86 + pressure * 0.3;
  if (hitFlash > 0) factor += 0.35;
  farmer.x += (factor - 1) * speed * dt + 8 * dt; // slow creep: dawdling is death
  farmer.x = clamp(farmer.x, 46, playerX - 40);
  return farmer.x >= playerX - 46;
}
