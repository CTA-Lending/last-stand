const pool = [];
const active = [];
const sparks = [];
const texts = [];
const flashes = [];

function obtain() { return pool.pop() || {}; }

export function spark(x1, y1, x2, y2, color) {
  sparks.push({ x1, y1, x2, y2, color, life: 0.18, maxLife: 0.18 });
}

export function burst(x, y, color, count = 8, speed = 90) {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const p = obtain();
    p.x = x; p.y = y; p.vx = Math.cos(a) * speed * (0.5 + Math.random());
    p.vy = Math.sin(a) * speed * (0.5 + Math.random());
    p.life = 0.4 + Math.random() * 0.3; p.maxLife = p.life;
    p.color = color; p.r = 2 + Math.random() * 2;
    active.push(p);
  }
}

export function floatText(x, y, text, color) {
  texts.push({ x: x + (Math.random() * 8 - 4), y, text, color, life: 0.8, vy: -34 });
}
export function flash(x, y, color, r = 14) {
  flashes.push({ x, y, color, r, life: 0.18, maxLife: 0.18 });
}

export function updateParticles(dt) {
  for (let i = active.length - 1; i >= 0; i--) {
    const p = active[i];
    p.life -= dt;
    if (p.life <= 0) { active.splice(i, 1); pool.push(p); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt;
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].life -= dt;
    if (sparks[i].life <= 0) sparks.splice(i, 1);
  }
  for (let i = texts.length - 1; i >= 0; i--) { const t = texts[i]; t.life -= dt; t.y += t.vy * dt; if (t.life <= 0) texts.splice(i, 1); }
  for (let i = flashes.length - 1; i >= 0; i--) { flashes[i].life -= dt; if (flashes[i].life <= 0) flashes.splice(i, 1); }
}

export function drawParticles(ctx) {
  for (const p of active) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  for (const s of sparks) {
    ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
    ctx.strokeStyle = s.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
  }
  for (const f of flashes) {
    const k = f.life / f.maxLife;
    ctx.globalAlpha = k * 0.8;
    ctx.fillStyle = f.color;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.4 - k), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.life / 0.4);
    ctx.fillStyle = t.color; ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center'; ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'start';
}
