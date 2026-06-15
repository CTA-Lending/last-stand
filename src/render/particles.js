const pool = [];
const active = [];

function obtain() { return pool.pop() || {}; }

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

export function updateParticles(dt) {
  for (let i = active.length - 1; i >= 0; i--) {
    const p = active[i];
    p.life -= dt;
    if (p.life <= 0) { active.splice(i, 1); pool.push(p); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt;
  }
}

export function drawParticles(ctx) {
  for (const p of active) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
