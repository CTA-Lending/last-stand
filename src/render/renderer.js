import { drawParticles } from './particles.js';
import { TOWERS } from '../data/towers.js';
import { SPELLS } from '../systems/spells.js';
import { cellOf, cellKey, cellCenter } from '../systems/grid.js';

function drawTerrain(ctx, map) {
  ctx.fillStyle = '#cfe3c4'; ctx.fillRect(0, 0, map.width, map.height);
  // 路徑
  ctx.strokeStyle = '#caa472'; ctx.lineWidth = 34;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  map.path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.stroke();
  ctx.strokeStyle = '#a4d3ad'; ctx.lineWidth = 26;
  ctx.beginPath();
  map.path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.stroke();
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
  ctx.fillStyle = '#5b5546';
  ctx.fillRect(t.x - 13, t.y - 13, 26, 26);
  ctx.fillStyle = t.color;
  ctx.beginPath(); ctx.arc(t.x, t.y, 11, 0, Math.PI * 2); ctx.fill();
  // 等級點
  for (let i = 0; i <= t.level; i++) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(t.x - 12 + i * 7, t.y + 14, 4, 4);
  }
  if (t.branch != null) {
    ctx.fillStyle = '#ffd35a';
    ctx.fillRect(t.x + 9, t.y - 13, 5, 5);
  }
}

function drawEnemy(ctx, e) {
  if (e.boss) {
    ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 6, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = e.hitFlash > 0 ? '#fff' : e.color;
  ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
  if (e.armorType === 'flying') {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 4, 0, Math.PI * 2); ctx.stroke();
  }
  // 減速/凍結外圈
  if (e.slowUntil > 0 && e.slowFactor < 1) {
    ctx.strokeStyle = e.slowFactor === 0 ? '#bfe9ff' : '#7fc7ff';
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI * 2); ctx.stroke();
  }
  // 持續傷害綠點
  if (e.dots && e.dots.length) {
    ctx.fillStyle = '#7fe04a'; ctx.beginPath(); ctx.arc(e.x + e.radius, e.y - e.radius, 3, 0, Math.PI * 2); ctx.fill();
  }
  // 血條
  const w = e.radius * 2, ratio = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = '#000'; ctx.fillRect(e.x - w / 2, e.y - e.radius - 8, w, 4);
  ctx.fillStyle = ratio > 0.5 ? '#5fd35f' : ratio > 0.25 ? '#f0c419' : '#e24b4a';
  ctx.fillRect(e.x - w / 2, e.y - e.radius - 8, w * ratio, 4);
}

function drawProjectile(ctx, p) {
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
}

function drawRangePreview(ctx, state, mouse) {
  if (!state.selectedTowerType) return;
  const r = TOWERS[state.selectedTowerType].levels[0].range;
  const { col, row } = cellOf(mouse.x, mouse.y, state.map.tile);
  const c = cellCenter(col, row, state.map.tile);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
}

export function render(ctx, state, mouse) {
  drawTerrain(ctx, state.map);
  drawBuildGrid(ctx, state, mouse);
  for (const t of state.towers) drawTower(ctx, t);
  for (const e of state.enemies) if (e.alive) drawEnemy(ctx, e);
  for (const p of state.projectiles) if (p.alive) drawProjectile(ctx, p);
  drawParticles(ctx);
  drawRangePreview(ctx, state, mouse);
  if (state.selectedTower) {
    const t = state.selectedTower;
    ctx.strokeStyle = 'rgba(255,255,0,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2); ctx.stroke();
  }
  // 火雨點地預覽圓
  if (state.castMode === 'firerain') {
    ctx.strokeStyle = 'rgba(255,80,20,0.7)';
    ctx.fillStyle = 'rgba(255,80,20,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, SPELLS.firerain.radius, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
}
