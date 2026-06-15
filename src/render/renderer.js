import { drawParticles } from './particles.js';
import { TOWERS } from '../data/towers.js';
import { SPELLS } from '../systems/spells.js';
import { cellOf, cellKey, cellCenter } from '../systems/grid.js';

function drawOnePath(ctx, path) {
  ctx.strokeStyle = '#caa472'; ctx.lineWidth = 34; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
  ctx.strokeStyle = '#a4d3ad'; ctx.lineWidth = 26;
  ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
}

function drawTerrain(ctx, map) {
  ctx.fillStyle = '#cfe3c4'; ctx.fillRect(0, 0, map.width, map.height);
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
  ctx.fillStyle = '#5b5546';
  ctx.fillRect(t.x - 13, t.y - 13, 26, 26);
  if (t.kind === 'barracks') {
    // 旗幟方塊 + 小旗
    ctx.fillStyle = t.color;
    ctx.fillRect(t.x - 9, t.y - 8, 18, 14);
    ctx.fillStyle = '#c9522a';
    ctx.beginPath();
    ctx.moveTo(t.x - 5, t.y - 9);
    ctx.lineTo(t.x + 7, t.y - 4);
    ctx.lineTo(t.x - 5, t.y + 1);
    ctx.closePath(); ctx.fill();
    // 集結點虛線標記
    if (t.rally) {
      ctx.strokeStyle = 'rgba(201,194,168,0.5)'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.rally.x, t.rally.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(201,194,168,0.7)';
      ctx.beginPath(); ctx.arc(t.rally.x, t.rally.y, 4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (t.kind === 'banner') {
    // 號令旗：底座 + 三角旗
    ctx.fillStyle = t.color;
    ctx.fillRect(t.x - 9, t.y - 8, 18, 14);
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.moveTo(t.x - 5, t.y - 9);
    ctx.lineTo(t.x + 7, t.y - 4);
    ctx.lineTo(t.x - 5, t.y + 1);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(t.x - 5, t.y - 9);
    ctx.lineTo(t.x + 7, t.y - 4);
    ctx.lineTo(t.x - 5, t.y + 1);
    ctx.closePath(); ctx.stroke();
  } else {
    ctx.fillStyle = t.color;
    ctx.beginPath(); ctx.arc(t.x, t.y, 11, 0, Math.PI * 2); ctx.fill();
  }
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
  drawTerrain(ctx, state.map);
  drawBuildGrid(ctx, state, mouse);
  for (const t of state.towers) drawTower(ctx, t);
  drawMinesAndAuras(ctx, state.towers);
  drawSoldiers(ctx, state.towers);
  for (const e of state.enemies) if (e.alive) drawEnemy(ctx, e);
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
}
