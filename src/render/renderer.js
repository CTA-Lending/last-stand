import { drawParticles } from './particles.js';
import { rgba, lighten } from './colors.js';
import { TOWERS } from '../data/towers.js';
import { SPELLS } from '../systems/spells.js';
import { cellOf, cellKey, cellCenter } from '../systems/grid.js';

function drawOnePath(ctx, path) {
  ctx.strokeStyle = '#caa472'; ctx.lineWidth = 34; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
  ctx.strokeStyle = '#a4d3ad'; ctx.lineWidth = 26;
  ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,95,60,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
  ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
}

function drawTerrain(ctx, map) {
  ctx.fillStyle = '#cfe3c4'; ctx.fillRect(0, 0, map.width, map.height);
  // 草地點綴(靜態散點，用座標決定不閃動)
  ctx.fillStyle = 'rgba(140,180,130,0.18)';
  for (let gx = 16; gx < map.width; gx += 46) for (let gy = 22; gy < map.height; gy += 46) {
    const ox = (gx * 13 % 17) - 8, oy = (gy * 7 % 19) - 9;
    ctx.beginPath(); ctx.arc(gx + ox, gy + oy, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  for (const path of map.paths) drawOnePath(ctx, path);
}

// 建造模式下：淡顯所有可蓋格，並把滑鼠所在格標綠(可蓋)/紅(不可)
function drawBuildGrid(ctx, state, mouse) {
  if (!state.selectedTowerType) return;
  const tile = state.map.tile;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (const key of state.buildableCells) {
    if (state.occupiedCells.has(key)) continue;
    const [col, row] = key.split(',').map(Number);
    ctx.fillRect(col * tile + 2, row * tile + 2, tile - 4, tile - 4);
  }
  const { col, row } = cellOf(mouse.x, mouse.y, tile);
  const key = cellKey(col, row);
  const ok = state.buildableCells.has(key) && !state.occupiedCells.has(key);
  ctx.fillStyle = ok ? 'rgba(90,220,120,0.4)' : 'rgba(230,70,70,0.4)';
  ctx.fillRect(col * tile + 1, row * tile + 1, tile - 2, tile - 2);
}

function drawTower(ctx, t) {
  // 陰影
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(t.x, t.y + 11, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  // 發光環
  ctx.fillStyle = rgba(t.color, 0.16);
  ctx.beginPath(); ctx.arc(t.x, t.y, 18, 0, Math.PI * 2); ctx.fill();

  if (t.kind === 'barracks' || t.kind === 'banner') {
    // 石座
    ctx.fillStyle = '#6b6456'; ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a3528'; ctx.lineWidth = 2; ctx.stroke();
    // 旗桿+三角旗
    ctx.strokeStyle = '#cfc8b0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(t.x - 4, t.y + 6); ctx.lineTo(t.x - 4, t.y - 11); ctx.stroke();
    ctx.fillStyle = t.color;
    ctx.beginPath(); ctx.moveTo(t.x - 4, t.y - 11); ctx.lineTo(t.x + 9, t.y - 7); ctx.lineTo(t.x - 4, t.y - 3); ctx.closePath(); ctx.fill();
    if (t.kind === 'barracks' && t.rally) {
      ctx.strokeStyle = 'rgba(201,194,168,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.rally.x, t.rally.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(201,194,168,0.7)'; ctx.beginPath(); ctx.arc(t.rally.x, t.rally.y, 4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (t.kind === 'mine') {
    // 工程台
    ctx.fillStyle = '#6b6456'; ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a3528'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(t.x, t.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(t.x - 5, t.y - 1, 10, 3);
  } else {
    // 射擊塔：石座 + 核心 + 瞄準砲管
    ctx.fillStyle = '#6b6456'; ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a3528'; ctx.lineWidth = 2; ctx.stroke();
    const a = t.aimAngle || 0;
    ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(a);
    ctx.fillStyle = '#33302a'; ctx.fillRect(2, -3.5, 15, 7);
    ctx.fillStyle = t.color; ctx.fillRect(13, -2.5, 5, 5);
    ctx.restore();
    ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(t.x, t.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lighten(t.color, 60); ctx.beginPath(); ctx.arc(t.x - 2, t.y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  // 等級點 + 專精金點
  for (let i = 0; i <= (t.level || 0); i++) { ctx.fillStyle = '#ffe08a'; ctx.fillRect(t.x - 11 + i * 6, t.y + 13, 4, 3); }
  if (t.branch != null) { ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.arc(t.x + 10, t.y - 10, 3, 0, Math.PI * 2); ctx.fill(); }
}

function drawSoldiers(ctx, towers) {
  for (const t of towers) {
    if (t.kind !== 'barracks' || !t.soldiers) continue;
    for (const s of t.soldiers) {
      if (!s.alive) continue;
      ctx.fillStyle = '#d8d2bc';
      ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a8568'; ctx.lineWidth = 1.5; ctx.stroke();
      const w = 14, ratio = Math.max(0, s.hp / s.maxHp);
      ctx.fillStyle = '#000'; ctx.fillRect(s.x - w / 2, s.y - 12, w, 3);
      ctx.fillStyle = '#5fd35f'; ctx.fillRect(s.x - w / 2, s.y - 12, w * ratio, 3);
    }
  }
}

function drawEnemy(ctx, e, now) {
  const bob = Math.sin((now || 0) * 6 + e.id) * 1.5;
  const y = e.y + bob, r = e.radius;
  // 陰影
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.7, r * 0.9, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  // Boss 脈動光環
  if (e.boss) {
    const p = 0.5 + 0.5 * Math.sin((now || 0) * 4);
    ctx.strokeStyle = rgba('#ffd35a', 0.4 + 0.3 * p); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, y, r + 5 + p * 2, 0, Math.PI * 2); ctx.stroke();
  }
  // 身體
  ctx.fillStyle = e.hitFlash > 0 ? '#fff' : e.color;
  ctx.beginPath(); ctx.arc(e.x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = e.hitFlash > 0 ? '#fff' : lighten(e.color, 40);
  ctx.beginPath(); ctx.arc(e.x, y - r * 0.35, r * 0.55, 0, Math.PI * 2); ctx.fill(); // 上方加亮
  // 眼睛
  const ex = r * 0.34, ey = -r * 0.1;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(e.x - ex, y + ey, r * 0.22, 0, Math.PI * 2); ctx.arc(e.x + ex, y + ey, r * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1320';
  ctx.beginPath(); ctx.arc(e.x - ex, y + ey, r * 0.1, 0, Math.PI * 2); ctx.arc(e.x + ex, y + ey, r * 0.1, 0, Math.PI * 2); ctx.fill();
  // 飛行翼影
  if (e.armorType === 'flying') {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(e.x, y, r + 4, 0, Math.PI * 2); ctx.stroke();
  }
  // 減速/凍結圈、毒點
  if (e.slowUntil > 0 && e.slowFactor < 1) {
    ctx.strokeStyle = e.slowFactor === 0 ? '#bfe9ff' : '#7fc7ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.x, y, r + 3, 0, Math.PI * 2); ctx.stroke();
  }
  if (e.dots && e.dots.length) { ctx.fillStyle = '#7fe04a'; ctx.beginPath(); ctx.arc(e.x + r, y - r, 3, 0, Math.PI * 2); ctx.fill(); }
  // 血條(圓角細條)
  const w = r * 2, ratio = Math.max(0, e.hp / e.maxHp), by = e.y - r - 9;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - w / 2, by, w, 4);
  ctx.fillStyle = ratio > 0.5 ? '#5fd35f' : ratio > 0.25 ? '#f0c419' : '#e24b4a';
  ctx.fillRect(e.x - w / 2, by, w * ratio, 4);
}

function drawProjectile(ctx, p) {
  ctx.fillStyle = rgba(p.color, 0.3);
  ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill();
}

function drawMinesAndAuras(ctx, towers) {
  for (const t of towers) {
    if (t.kind === 'mine' && t.mines) for (const m of t.mines) {
      ctx.fillStyle = '#8a6a2a'; ctx.beginPath(); ctx.arc(m.x, m.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff5a2a'; ctx.beginPath(); ctx.arc(m.x, m.y, 2, 0, Math.PI * 2); ctx.fill();
    }
    if (t.kind === 'banner') {
      ctx.strokeStyle = 'rgba(232,217,138,0.25)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2); ctx.stroke();
    }
  }
}

function drawRangePreview(ctx, state, mouse) {
  if (!state.selectedTowerType) return;
  const def = TOWERS[state.selectedTowerType];
  const r = def.levels[0].range;
  if (!r) return; // barracks has no range ring
  const { col, row } = cellOf(mouse.x, mouse.y, state.map.tile);
  const c = cellCenter(col, row, state.map.tile);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
}

export function render(ctx, state, mouse) {
  ctx.save();
  if (state.shake > 0.3) ctx.translate((Math.random() * 2 - 1) * state.shake, (Math.random() * 2 - 1) * state.shake);
  drawTerrain(ctx, state.map);
  drawBuildGrid(ctx, state, mouse);
  for (const t of state.towers) drawTower(ctx, t);
  drawMinesAndAuras(ctx, state.towers);
  drawSoldiers(ctx, state.towers);
  for (const e of state.enemies) if (e.alive) drawEnemy(ctx, e, state.now);
  for (const p of state.projectiles) if (p.alive) drawProjectile(ctx, p);
  drawParticles(ctx);
  drawRangePreview(ctx, state, mouse);
  if (state.selectedTower) {
    const t = state.selectedTower;
    if (t.kind === 'barracks') {
      // 兵營選取：顯示 engageRange 圓（集結點為圓心）
      if (t.rally) {
        ctx.strokeStyle = 'rgba(201,194,168,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(t.rally.x, t.rally.y, t.engageRange, 0, Math.PI * 2); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = 'rgba(255,255,0,0.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2); ctx.stroke();
    }
  }
  // 火雨點地預覽圓
  if (state.castMode === 'firerain') {
    ctx.strokeStyle = 'rgba(255,80,20,0.7)';
    ctx.fillStyle = 'rgba(255,80,20,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, SPELLS.firerain.radius, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
