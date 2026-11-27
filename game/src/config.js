// Turkey Run — tuning and world constants.
// The turkey "Pip" flees Farmer Bram's farm on Thanksgiving morning.
// Three zones: Farmyard -> Cornfield -> Kitchen. Reach 2000 m to escape.
export const CFG = {
  W: 960,
  H: 540,
  GROUND_Y: 452,
  GRAVITY: 2400,
  JUMP_V: -880,
  DOUBLE_JUMP_V: -780,
  SLIDE_TIME: 0.55,
  BASE_SPEED: 250,
  MAX_SPEED: 470,
  SPEED_RAMP: 6.5, // px/s gained per second of running
  FINISH_M: 2000,
  START_LIVES: 3,
  CORN_SCORE: 25,
  FEATHER_TIME: 4,
  CHILI_TIME: 1.1,
  ZONES: [
    { name: 'THE FARMYARD', from: 0, to: 600, sky: ['#ffd98e', '#ff9d5c'], hill: '#7fae5a', far: '#a8c686' },
    { name: 'THE CORNFIELD', from: 600, to: 1300, sky: ['#ffe6a3', '#f7b733'], hill: '#c98f2e', far: '#e0aa3e' },
    { name: 'THE KITCHEN', from: 1300, to: 2000, sky: ['#3a2b3f', '#7a3b2e'], hill: '#5d3a2e', far: '#6e4636' },
  ],
  // Spawn pacing (seconds between hazard groups), tightens with distance.
  SPAWN_MIN: 0.95,
  SPAWN_MAX: 1.7,
};

export function zoneAt(meters) {
  for (const z of CFG.ZONES) if (meters >= z.from && meters < z.to) return z;
  return CFG.ZONES[CFG.ZONES.length - 1];
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function rand(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

export function randInt(lo, hi) {
  return Math.floor(rand(lo, hi + 1));
}

export function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
