// Turkey Run — every sprite is drawn with canvas paths. No image files.
// The turkey Pip, Farmer Bram, the oven, knives, corn and the autumn scenery
// are all original art made for this game.
import { CFG, clamp, lerp } from './config.js';

export function drawSky(ctx, zone, t) {
  const g = ctx.createLinearGradient(0, 0, 0, CFG.H);
  g.addColorStop(0, zone.sky[0]);
  g.addColorStop(0.62, zone.sky[1]);
  g.addColorStop(1, '#8a5a3b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  // Sun / kitchen lamp glow
  const sx = 800;
  const sy = zone.name === 'THE KITCHEN' ? 90 : 84;
  const sg = ctx.createRadialGradient(sx, sy, 6, sx, sy, 90);
  sg.addColorStop(0, 'rgba(255,244,190,0.95)');
  sg.addColorStop(0.35, 'rgba(255,220,120,0.55)');
  sg.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(sx - 95, sy - 95, 190, 190);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sx, sy, 30, 0, Math.PI * 2);
  ctx.fill();
  // Drifting clouds / kitchen steam puffs
  ctx.fillStyle = zone.name === 'THE KITCHEN' ? 'rgba(230,220,210,0.25)' : 'rgba(255,250,235,0.85)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 260 + t * (12 + i * 4)) % (CFG.W + 220)) - 110;
    const cy = 52 + i * 26;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 34, cy + 5, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawHills(ctx, zone, scroll) {
  ctx.fillStyle = zone.far;
  ctx.beginPath();
  ctx.moveTo(0, 330);
  for (let x = 0; x <= CFG.W; x += 40) {
    ctx.lineTo(x, 300 + Math.sin((x + scroll * 0.25) * 0.012) * 26);
  }
  ctx.lineTo(CFG.W, CFG.H);
  ctx.lineTo(0, CFG.H);
  ctx.fill();
  ctx.fillStyle = zone.hill;
  ctx.beginPath();
  ctx.moveTo(0, 380);
  for (let x = 0; x <= CFG.W; x += 40) {
    ctx.lineTo(x, 356 + Math.sin((x + scroll * 0.5) * 0.02 + 2) * 18);
  }
  ctx.lineTo(CFG.W, CFG.H);
  ctx.lineTo(0, CFG.H);
  ctx.fill();
  // Barn silhouette in the farmyard, corn stalks in the field, oven glow at home
  if (zone.name === 'THE FARMYARD') {
    const bx = 690 - ((scroll * 0.5) % 1400);
    drawBarn(ctx, bx, 268);
  } else if (zone.name === 'THE CORNFIELD') {
    ctx.strokeStyle = '#7a5c14';
    ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
      const x = ((i * 120 - scroll * 0.7) % (CFG.W + 120) + CFG.W + 120) % (CFG.W + 120) - 60;
      const h = 70 + (i % 3) * 18;
      ctx.beginPath();
      ctx.moveTo(x, 400);
      ctx.lineTo(x + 6, 400 - h);
      ctx.stroke();
      ctx.fillStyle = '#e8b93c';
      ctx.beginPath();
      ctx.ellipse(x + 8, 400 - h + 18, 7, 16, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBarn(ctx, x, y) {
  ctx.fillStyle = '#a33327';
  ctx.fillRect(x, y, 120, 90);
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x + 60, y - 44);
  ctx.lineTo(x + 128, y);
  ctx.closePath();
  ctx.fillStyle = '#7e241b';
  ctx.fill();
  ctx.fillStyle = '#f3e2c7';
  ctx.fillRect(x + 44, y + 44, 32, 46);
  ctx.strokeStyle = '#5d1a12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 44, y + 44);
  ctx.lineTo(x + 76, y + 90);
  ctx.moveTo(x + 76, y + 44);
  ctx.lineTo(x + 44, y + 90);
  ctx.stroke();
}

export function drawGround(ctx, zone, scroll, t) {
  const g = ctx.createLinearGradient(0, CFG.GROUND_Y, 0, CFG.H);
  g.addColorStop(0, zone.name === 'THE KITCHEN' ? '#8a6a52' : '#b98a4e');
  g.addColorStop(1, zone.name === 'THE KITCHEN' ? '#4a3428' : '#7d5a30');
  ctx.fillStyle = g;
  ctx.fillRect(0, CFG.GROUND_Y, CFG.W, CFG.H - CFG.GROUND_Y);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, CFG.GROUND_Y, CFG.W, 4);
  // Fence posts / floor tiles scrolling past
  if (zone.name === 'THE KITCHEN') {
    ctx.strokeStyle = 'rgba(40,20,14,0.5)';
    ctx.lineWidth = 2;
    for (let x = -((scroll % 90) + 90) % 90; x < CFG.W; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, CFG.GROUND_Y);
      ctx.lineTo(x - 24, CFG.H);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(CFG.W, 500);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#6e4a22';
    for (let x = -((scroll % 110) + 110) % 110; x < CFG.W; x += 110) {
      ctx.fillRect(x, CFG.GROUND_Y + 14, 8, 26);
      ctx.fillRect(x + 2, CFG.GROUND_Y + 8, 4, 8);
    }
    ctx.fillStyle = 'rgba(255,220,140,0.35)';
    for (let i = 0; i < 14; i++) {
      const x = ((i * 173 - scroll * 1.0) % (CFG.W + 40) + CFG.W + 40) % (CFG.W + 40) - 20;
      ctx.beginPath();
      ctx.ellipse(x, CFG.GROUND_Y + 62 + (i % 3) * 12, 9, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Heat shimmer over the kitchen floor
  if (zone.name === 'THE KITCHEN') {
    ctx.fillStyle = `rgba(255,120,40,${0.05 + 0.03 * Math.sin(t * 5)})`;
    ctx.fillRect(0, CFG.GROUND_Y, CFG.W, 30);
  }
}

// Pip the turkey. flap: 0..1 wing cycle, sliding: low profile, feather: golden glow.
export function drawTurkey(ctx, x, y, flap, sliding, feather, t, facing = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  if (feather > 0) {
    const glow = ctx.createRadialGradient(0, -20, 4, 0, -20, 62);
    glow.addColorStop(0, 'rgba(255,215,80,0.55)');
    glow.addColorStop(1, 'rgba(255,215,80,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-62, -82, 124, 124);
  }
  const bob = sliding ? 0 : Math.sin(t * 14) * 2;
  // Tail fan
  ctx.fillStyle = '#8a5a2b';
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(-26, -26 + bob);
    ctx.rotate(i * 0.42);
    ctx.beginPath();
    ctx.ellipse(-16, 0, 17, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = i % 2 ? '#a06a33' : '#7a4a22';
    ctx.restore();
  }
  // Body
  ctx.fillStyle = '#a06a33';
  ctx.beginPath();
  ctx.ellipse(0, -22 + bob, 26, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c08a4a';
  ctx.beginPath();
  ctx.ellipse(2, -16 + bob, 18, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing (flaps)
  const wa = Math.sin(flap * Math.PI * 2) * 0.9 - 0.2;
  ctx.save();
  ctx.translate(-4, -26 + bob);
  ctx.rotate(wa);
  ctx.fillStyle = '#7a4a22';
  ctx.beginPath();
  ctx.ellipse(-14, 0, 18, 9, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c88a';
  ctx.beginPath();
  ctx.ellipse(-20, 2, 9, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Neck + head
  ctx.fillStyle = '#a06a33';
  ctx.beginPath();
  ctx.ellipse(20, -46 + bob, 9, 16, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d98a7a';
  ctx.beginPath();
  ctx.arc(26, -60 + bob, 11, 0, Math.PI * 2);
  ctx.fill();
  // Beak, wattle, snood
  ctx.fillStyle = '#f7b733';
  ctx.beginPath();
  ctx.moveTo(34, -62 + bob);
  ctx.lineTo(46, -58 + bob);
  ctx.lineTo(34, -55 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(30, -50 + bob, 4, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(29, -63 + bob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(30.5, -63 + bob, 2, 0, Math.PI * 2);
  ctx.fill();
  // Legs (running scissor, or tucked while sliding)
  ctx.strokeStyle = '#e07b39';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  if (sliding) {
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(8, 0);
    ctx.moveTo(6, -4);
    ctx.lineTo(18, 0);
    ctx.stroke();
  } else {
    const s1 = Math.sin(t * 16) * 9;
    const s2 = Math.sin(t * 16 + Math.PI) * 9;
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(-6 + s1, 0);
    ctx.moveTo(6, -4);
    ctx.lineTo(6 + s2, 0);
    ctx.stroke();
  }
  ctx.restore();
}

// Farmer Bram: straw hat, red shirt, overalls, butterfly net, very determined.
export function drawFarmer(ctx, x, y, t, urgent) {
  const run = Math.sin(t * (urgent ? 18 : 12));
  ctx.save();
  ctx.translate(x, y);
  // Legs
  ctx.strokeStyle = '#3b4a6b';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -34);
  ctx.lineTo(-6 + run * 8, 0);
  ctx.moveTo(6, -34);
  ctx.lineTo(6 - run * 8, 0);
  ctx.stroke();
  // Overalls + shirt
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(0, -52, 17, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b4a6b';
  ctx.fillRect(-13, -48, 26, 18);
  ctx.fillStyle = '#f7dc6f';
  ctx.fillRect(-13, -48, 26, 4);
  // Arm reaching out with the net
  ctx.strokeStyle = '#e8b88a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(10, -58);
  ctx.lineTo(34, -66 + run * 3);
  ctx.stroke();
  ctx.strokeStyle = '#8a6a3b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(34, -66 + run * 3);
  ctx.lineTo(56, -78 + run * 3);
  ctx.stroke();
  ctx.strokeStyle = '#dfe9f5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(64, -84 + run * 3, 15, 12, -0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(223,233,245,0.7)';
  ctx.beginPath();
  ctx.moveTo(52, -92 + run * 3);
  ctx.lineTo(76, -76 + run * 3);
  ctx.moveTo(76, -92 + run * 3);
  ctx.lineTo(52, -76 + run * 3);
  ctx.stroke();
  // Head + hat
  ctx.fillStyle = '#e8b88a';
  ctx.beginPath();
  ctx.arc(2, -76, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f3e2c7';
  ctx.beginPath();
  ctx.ellipse(2, -84, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8d28a';
  ctx.beginPath();
  ctx.ellipse(2, -88, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Moustache + angry eye
  ctx.fillStyle = '#5d4030';
  ctx.fillRect(-4, -72, 13, 3);
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(8, -78, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// The oven: a big farmhouse range with a glowing door and a "THANKSGIVING" plaque.
export function drawOven(ctx, x, y, w, h, t) {
  ctx.fillStyle = '#2c2c34';
  ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = '#3d3d46';
  ctx.fillRect(x + 6, y - h + 6, w - 12, 26);
  const flick = 0.6 + 0.3 * Math.sin(t * 9) + 0.12 * Math.sin(t * 23);
  const fg = ctx.createRadialGradient(x + w / 2, y - h / 2, 4, x + w / 2, y - h / 2, 60);
  fg.addColorStop(0, `rgba(255,190,60,${0.85 * flick})`);
  fg.addColorStop(0.6, `rgba(255,90,20,${0.55 * flick})`);
  fg.addColorStop(1, 'rgba(120,20,0,0.1)');
  ctx.fillStyle = fg;
  ctx.fillRect(x + 12, y - h + 40, w - 24, h - 52);
  ctx.strokeStyle = '#15151a';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 12, y - h + 40, w - 24, h - 52);
  ctx.fillStyle = '#f7dc6f';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('OVEN', x + w / 2, y - h + 24);
  // Heat waves
  ctx.strokeStyle = `rgba(255,140,50,${0.35 * flick})`;
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const hx = x + 14 + i * ((w - 28) / 2);
    ctx.beginPath();
    ctx.moveTo(hx, y - h - 4);
    ctx.quadraticCurveTo(hx + 6, y - h - 14, hx, y - h - 24);
    ctx.stroke();
  }
}

// A carving knife, falling blade-first with a glint.
export function drawKnife(ctx, x, y, rot, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#5d4030';
  ctx.fillRect(-5, -34, 10, 18);
  ctx.fillStyle = '#d7dee8';
  ctx.beginPath();
  ctx.moveTo(-6, -16);
  ctx.lineTo(6, -16);
  ctx.lineTo(4, 26);
  ctx.lineTo(0, 34);
  ctx.lineTo(-4, 26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a97a8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(0, 28);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -10);
  ctx.lineTo(1, 12);
  ctx.stroke();
  ctx.restore();
}

// A swinging cleaver on a chain from the kitchen ceiling.
export function drawCleaver(ctx, x, yTop, y, swing) {
  ctx.strokeStyle = '#2c2c34';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, yTop);
  ctx.lineTo(x + Math.sin(swing) * 40, y);
  ctx.stroke();
  ctx.save();
  ctx.translate(x + Math.sin(swing) * 40, y);
  ctx.rotate(Math.sin(swing) * 0.5);
  ctx.fillStyle = '#c8d2de';
  ctx.beginPath();
  ctx.moveTo(-26, -14);
  ctx.lineTo(26, -14);
  ctx.lineTo(22, 10);
  ctx.quadraticCurveTo(0, 20, -22, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5d4030';
  ctx.fillRect(-26, -20, 52, 8);
  ctx.restore();
}

export function drawCorn(ctx, x, y, t, golden) {
  const bobY = Math.sin(t * 4 + x * 0.05) * 4;
  ctx.save();
  ctx.translate(x, y + bobY);
  if (golden) {
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    glow.addColorStop(0, 'rgba(255,215,80,0.8)');
    glow.addColorStop(1, 'rgba(255,215,80,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-26, -26, 52, 52);
  }
  ctx.rotate(0.5);
  ctx.fillStyle = golden ? '#ffd94d' : '#f7c531';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = golden ? '#fff0a0' : '#ffe27a';
  for (let r = -1; r <= 1; r++) {
    for (let c = -1; c <= 1; c++) {
      ctx.beginPath();
      ctx.arc(r * 5, c * 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#4e8a2f';
  ctx.beginPath();
  ctx.moveTo(-8, 12);
  ctx.lineTo(0, 26);
  ctx.lineTo(8, 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawPumpkin(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#e07b2a';
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b85a14';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(i * r * 0.45, 0, r * 0.5, r * 0.85, 0, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#4e8a2f';
  ctx.fillRect(-3, -r - 8, 6, 10);
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(-4, -1);
  ctx.lineTo(-10, 3);
  ctx.closePath();
  ctx.moveTo(10, -6);
  ctx.lineTo(4, -1);
  ctx.lineTo(10, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawHay(ctx, x, y, w, h) {
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a87c22';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y, (w / 2) * (0.3 + i * 0.16), (h / 2) * (0.3 + i * 0.16), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a6a1d';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y - h * 0.28, 6, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFence(ctx, x, y, w, h) {
  ctx.fillStyle = '#8a5a2b';
  for (let i = 0; i < 3; i++) {
    const px = x + (i * w) / 2;
    ctx.fillRect(px - 3, y - h, 6, h);
    ctx.beginPath();
    ctx.moveTo(px - 3, y - h);
    ctx.lineTo(px, y - h - 8);
    ctx.lineTo(px + 3, y - h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(x - 4, y - h + 10, w + 8, 7);
  ctx.fillRect(x - 4, y - h + 30, w + 8, 7);
}

// A glowing oven grate on the kitchen floor — do not stand on it.
export function drawGrate(ctx, x, y, w, t) {
  const pulse = 0.55 + 0.35 * Math.sin(t * 6 + x);
  ctx.fillStyle = '#1e1a18';
  ctx.fillRect(x, y - 10, w, 10);
  const g = ctx.createLinearGradient(x, y - 10, x, y);
  g.addColorStop(0, `rgba(255,120,30,${pulse})`);
  g.addColorStop(1, 'rgba(180,40,0,0.25)');
  ctx.fillStyle = g;
  ctx.fillRect(x + 3, y - 8, w - 6, 6);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * i) / 5, y - 10);
    ctx.lineTo(x + (w * i) / 5, y);
    ctx.stroke();
  }
}

export function drawHeart(ctx, x, y, filled, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = filled ? '#e63946' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -6);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 6);
  ctx.fill();
  ctx.restore();
}

export { clamp, lerp };
