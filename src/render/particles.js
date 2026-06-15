const pool = [];
const active = [];
const sparks = [];
const texts = [];
const flashes = [];
const flashesScreen = [];
const shocks = [];

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

// 金色淨化游塵：向上飄動
export function motes(x, y) {
  for (let i = 0; i < 8; i++) {
    const p = obtain();
    p.x = x + (Math.random() * 20 - 10);
    p.y = y + (Math.random() * 10 - 5);
    p.vx = (Math.random() * 24 - 12);
    p.vy = -(18 + Math.random() * 28); // 向上
    p.life = 0.55 + Math.random() * 0.3; p.maxLife = p.life;
    p.color = '#ffe09a'; p.r = 1.5 + Math.random() * 1.5;
    p.isMote = true; // 低重力旗標
    active.push(p);
  }
}

export function floatText(x, y, text, color, size) {
  texts.push({ x: x + (Math.random() * 8 - 4), y, text, color, life: 0.8, vy: -34, size: size || 14 });
}
export function flash(x, y, color, r = 14) {
  flashes.push({ x, y, color, r, life: 0.18, maxLife: 0.18 });
}

export function screenFlash(color, alpha) {
  flashesScreen.push({ color, alpha, life: 0.35, maxLife: 0.35 });
}

export function shockwave(x, y, color, maxR) {
  shocks.push({ x, y, color, r: 8, maxR, life: 0.5, maxLife: 0.5 });
}

export function updateParticles(dt) {
  for (let i = active.length - 1; i >= 0; i--) {
    const p = active[i];
    p.life -= dt;
    if (p.life <= 0) { active.splice(i, 1); pool.push(p); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    // 游塵低重力；普通粒子正常重力
    p.vy += (p.isMote ? 18 : 140) * dt;
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].life -= dt;
    if (sparks[i].life <= 0) sparks.splice(i, 1);
  }
  for (let i = texts.length - 1; i >= 0; i--) { const t = texts[i]; t.life -= dt; t.y += t.vy * dt; if (t.life <= 0) texts.splice(i, 1); }
  for (let i = flashes.length - 1; i >= 0; i--) { flashes[i].life -= dt; if (flashes[i].life <= 0) flashes.splice(i, 1); }
  for (let i = flashesScreen.length - 1; i >= 0; i--) { flashesScreen[i].life -= dt; if (flashesScreen[i].life <= 0) flashesScreen.splice(i, 1); }
  for (let i = shocks.length - 1; i >= 0; i--) { shocks[i].life -= dt; if (shocks[i].life <= 0) shocks.splice(i, 1); }
}

export function drawParticles(ctx) {
  // 加法混合：burst 粒子 + flash 圓
  ctx.globalCompositeOperation = 'lighter';
  for (const p of active) {
    const lifeRatio = p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, lifeRatio);
    // 接近消逝時白熱化
    ctx.fillStyle = lifeRatio < 0.4 ? '#fff' : p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  for (const f of flashes) {
    const k = f.life / f.maxLife;
    ctx.globalAlpha = k * 0.8;
    ctx.fillStyle = f.color;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.4 - k), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // 火花（source-over）
  for (const s of sparks) {
    ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
    ctx.strokeStyle = s.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // 傷害數字：襯線字體 + 陰影
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.life / 0.4);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4;
    ctx.fillStyle = t.color;
    ctx.font = '700 ' + (t.size || 14) + 'px "Cinzel","Noto Serif TC",serif';
    ctx.textAlign = 'center'; ctx.fillText(t.text, t.x, t.y);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'start';
}

export function drawScreenEffects(ctx, w, h) {
  // Shockwave rings
  for (const s of shocks) {
    const progress = 1 - s.life / s.maxLife;
    ctx.globalAlpha = (s.life / s.maxLife) * 0.6;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r + progress * s.maxR, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  // Full-canvas flash
  for (const f of flashesScreen) {
    ctx.globalAlpha = f.alpha * (f.life / f.maxLife);
    ctx.fillStyle = f.color;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
