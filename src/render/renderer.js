import { drawParticles, drawScreenEffects } from './particles.js';
import { rgba, lighten } from './colors.js';
import { hasBossForm, drawBossForm } from './bossForms.js';
import { ELEMENT_INFO } from '../data/attackMatrix.js';
import { getTowerArt } from './towerArt.js';
import { TOWERS } from '../data/towers.js';
import { SPELLS } from '../systems/spells.js';
import { cellOf, cellKey, cellCenter } from '../systems/grid.js';

// 預設地形主題（沿用原本墨紫色調）；每張地圖可用 map.theme 覆蓋成專屬地形
const DEFAULT_THEME = {
  top: '#1f2735', bottom: '#141a26',          // 地面漸層
  pathOuter: '#4a4358', pathInner: '#332e42', // 路徑石板內外層
  dash: 'rgba(180,170,205,0.30)',             // 路徑虛線
  mote: '95,211,178',                         // 玉光游塵 RGB
};

function drawOnePath(ctx, path, th) {
  const trace = () => { ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); };
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = th.pathOuter; ctx.lineWidth = 34; trace();
  ctx.strokeStyle = th.pathInner; ctx.lineWidth = 26; trace();
  ctx.strokeStyle = th.dash; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); trace(); ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(180,170,205,0.12)'; ctx.lineWidth = 4; trace();
}

// 地形障礙（湖/熔岩/深淵/石柱/餐桌…）：純裝飾繪製（佔格邏輯在 blockedCells）
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function drawObstacle(ctx, o, now) {
  const w = o.w, h = o.h, x = o.x - w / 2, y = o.y - h / 2, rad = Math.min(12, w / 2, h / 2);
  if (o.type === 'solid') { // 石柱/金堆/餐桌/念晶：實體塊，擋路又佔位
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; roundRect(ctx, x + 2, y + 5, w, h, rad); ctx.fill();
    ctx.fillStyle = o.color || '#5a5468'; roundRect(ctx, x, y, w, h, rad); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.08)'; roundRect(ctx, x + 3, y + 3, w - 6, h * 0.42, rad * 0.6); ctx.fill();
    if (o.glow) { ctx.strokeStyle = o.glow.replace('ALPHA', '0.5'); ctx.lineWidth = 1.5; roundRect(ctx, x, y, w, h, rad); ctx.stroke(); }
  } else { // 液體(lake/lava/void/毒沼)：呼吸光暈池
    const pulse = 0.5 + 0.5 * Math.sin((now || 0) * 1.5 + o.x * 0.05);
    ctx.fillStyle = o.color || 'rgba(60,120,200,0.5)';
    ctx.beginPath(); ctx.ellipse(o.x, o.y, w / 2, h / 2, 0, 0, 7); ctx.fill();
    if (o.glow) { ctx.strokeStyle = o.glow.replace('ALPHA', (0.2 + pulse * 0.3).toFixed(2)); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(o.x, o.y, w / 2, h / 2, 0, 0, 7); ctx.stroke(); }
  }
}

// 終點黑洞：旋轉吸積環 + 純黑核心，讓玩家一眼看出路徑終點(基地)在哪
function drawBlackHole(ctx, x, y, now) {
  const t = now || 0;
  const halo = ctx.createRadialGradient(x, y, 2, x, y, 24);
  halo.addColorStop(0, 'rgba(0,0,0,1)');
  halo.addColorStop(0.5, 'rgba(22,8,34,0.92)');
  halo.addColorStop(1, 'rgba(120,60,200,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.fill();
  // 旋轉吸積光環
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = 'rgba(170,110,240,' + (0.4 - i * 0.1) + ')';
    ctx.lineWidth = 3 - i;
    ctx.beginPath(); ctx.arc(x, y, 15 + i * 4, t * 2.2 + i * 1.3, t * 2.2 + i * 1.3 + Math.PI * 1.4); ctx.stroke();
  }
  // 純黑核心 + 內緣亮環
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(200,150,255,0.65)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, 9.5, 0, Math.PI * 2); ctx.stroke();
}

function drawTerrain(ctx, map, now = 0) {
  const th = map.theme || DEFAULT_THEME;
  const grad = ctx.createLinearGradient(0, 0, 0, map.height);
  grad.addColorStop(0, th.top); grad.addColorStop(1, th.bottom);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, map.width, map.height);
  // 點綴游塵（散點呼吸明滅）
  for (let gx = 16; gx < map.width; gx += 46) for (let gy = 22; gy < map.height; gy += 46) {
    const ox = (gx * 13 % 17) - 8, oy = (gy * 7 % 19) - 9;
    const a = Math.max(0, 0.06 + 0.04 * Math.sin(now * 0.5 + gx * 0.1 + gy * 0.07));
    ctx.fillStyle = 'rgba(' + th.mote + ',' + a + ')';
    ctx.beginPath(); ctx.arc(gx + ox, gy + oy, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  if (map.obstacles) for (const o of map.obstacles) drawObstacle(ctx, o, now);
  for (const path of map.paths) drawOnePath(ctx, path, th);
  if (map.base) drawBlackHole(ctx, map.base.x, map.base.y, now); // 終點黑洞
}

// 建造模式下：淡顯所有可蓋格，並把滑鼠所在格標綠(可蓋)/紅(不可)
function drawBuildGrid(ctx, state, mouse) {
  if (!state.selectedTowerType) return;
  const tile = state.map.tile;
  ctx.fillStyle = 'rgba(95,211,178,0.08)';
  for (const key of state.buildableCells) {
    if (state.occupiedCells.has(key)) continue;
    const [col, row] = key.split(',').map(Number);
    ctx.fillRect(col * tile + 2, row * tile + 2, tile - 4, tile - 4);
  }
  const { col, row } = cellOf(mouse.x, mouse.y, tile);
  const key = cellKey(col, row);
  const ok = state.buildableCells.has(key) && !state.occupiedCells.has(key);
  ctx.fillStyle = ok ? 'rgba(95,211,178,0.45)' : 'rgba(230,70,70,0.4)';
  ctx.fillRect(col * tile + 1, row * tile + 1, tile - 2, tile - 2);
}

function drawTower(ctx, t) {
  // 陰影
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(t.x, t.y + 11, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  const art = getTowerArt(t.type);
  if (art) {
    // 精美 IP 圖（圓形烘焙）：開火時沿瞄準反方向小幅後座
    const sz = 44, rec = t.recoil > 0 ? Math.min(3, t.recoil * 2.2) : 0;
    const dx = Math.cos(t.aimAngle || 0) * -rec, dy = Math.sin(t.aimAngle || 0) * -rec;
    ctx.drawImage(art, t.x - sz / 2 + dx, t.y - sz / 2 - 2 + dy, sz, sz);
  } else {
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
    // 射擊塔：石座 + 陣營專屬造型
    ctx.fillStyle = '#6b6456'; ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a3528'; ctx.lineWidth = 2; ctx.stroke();
    const fac = (TOWERS[t.type] && TOWERS[t.type].faction) || '';
    const a = t.aimAngle || 0;
    const c = t.color;
    ctx.save(); ctx.translate(t.x, t.y);
    if (fac === 'mage' || fac === 'god') {
      // 法球：發光 orb（神族加光芒）
      if (fac === 'god') {
        ctx.strokeStyle = rgba(c, 0.7); ctx.lineWidth = 1.5;
        for (let k = 0; k < 8; k++) { const g = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(g) * 11, Math.sin(g) * 11); ctx.lineTo(Math.cos(g) * 15, Math.sin(g) * 15); ctx.stroke(); }
      }
      ctx.fillStyle = rgba(c, 0.45); ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = c; ctx.shadowBlur = 12;
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = lighten(c, 80); ctx.beginPath(); ctx.arc(-2, -2, 2.6, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.rotate(a);
      const recoil = t.recoil > 0 ? t.recoil : 0;
      if (recoil > 0) ctx.translate(-recoil * 3, 0);
      if (fac === 'dwarf') {
        ctx.fillStyle = '#33302a'; ctx.fillRect(2, -4.5, 16, 9);
        ctx.fillStyle = '#16140f'; ctx.beginPath(); ctx.arc(18, 0, 4, -Math.PI / 2, Math.PI / 2); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
      } else if (fac === 'elf') {
        ctx.strokeStyle = c; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(1, 0, 11, -2.0, 2.0); ctx.stroke();
        ctx.strokeStyle = 'rgba(231,221,201,0.45)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(1 + Math.cos(-2.0) * 11, Math.sin(-2.0) * 11); ctx.lineTo(1 + Math.cos(2.0) * 11, Math.sin(2.0) * 11); ctx.stroke();
        ctx.strokeStyle = '#e8e0c0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(15, 0); ctx.stroke();
      } else if (fac === 'human') {
        ctx.fillStyle = '#5a4a32'; ctx.fillRect(-2, -2, 18, 4);
        ctx.strokeStyle = c; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(6, -9); ctx.lineTo(6, 9); ctx.stroke();
        ctx.strokeStyle = 'rgba(231,221,201,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(6, -9); ctx.lineTo(16, 0); ctx.lineTo(6, 9); ctx.stroke();
      } else if (fac === 'dragon') {
        ctx.fillStyle = rgba('#ffcc55', 0.55); ctx.beginPath(); ctx.arc(17, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(17, 0); ctx.lineTo(2, 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#33302a'; ctx.fillRect(2, -3.5, 15, 7);
        ctx.fillStyle = c; ctx.fillRect(13, -2.5, 5, 5);
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
  } // end 向量 fallback（無精美圖時）
  // 等級點 + 專精金點
  for (let i = 0; i <= (t.level || 0); i++) { ctx.fillStyle = '#ffe08a'; ctx.fillRect(t.x - 11 + i * 6, t.y + 13, 4, 3); }
  if (t.branch != null) { ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.arc(t.x + 10, t.y - 10, 3, 0, Math.PI * 2); ctx.fill(); }
  // 升級施工進度環
  if (t.upgrading > 0 && t.upgradingMax) {
    const prog = 1 - t.upgrading / t.upgradingMax;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(t.x, t.y, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffe09a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(t.x, t.y, 16, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke();
    ctx.lineCap = 'butt';
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

function drawEnemy(ctx, e, now) {
  // 死亡彈跳：放大淡出的圓體
  if (!e.alive && e.deathT > 0) {
    const prog = 1 - e.deathT / 0.14; // 0→1 as it dies
    const scale = 1 + prog * 0.4;
    const alpha = e.deathT / 0.14;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius * scale, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  const bob = Math.sin((now || 0) * 6 + e.id) * 1.5;
  const spawnScale = e.spawnT > 0 ? (1 - e.spawnT / 0.12 * 0.6) : 1;
  const y = e.y + bob, r = e.radius * spawnScale;
  // 受擊擠壓回彈（橫向略壓扁，物理凹陷感）
  const hitK = e.hitFlash > 0 ? Math.min(1, e.hitFlash / 0.12) : 0;
  const bossForm = e.boss && hasBossForm(e);
  ctx.save();
  if (hitK > 0) { ctx.translate(e.x, y); ctx.scale(1 + 0.12 * hitK, 1 - 0.14 * hitK); ctx.translate(-e.x, -y); }
  // 陰影
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.7, r * 0.9, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  // Boss 脈動光環
  if (e.boss) {
    const p = 0.5 + 0.5 * Math.sin((now || 0) * 4);
    ctx.shadowColor = '#ffd35a'; ctx.shadowBlur = 10;
    ctx.strokeStyle = rgba('#ffd35a', 0.4 + 0.3 * p); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, y, r + 5 + p * 2, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  // Boss 骨角(從身體後方探出；有專屬剪影者不畫，避免破壞輪廓)
  if (e.boss && !bossForm) {
    ctx.fillStyle = '#e6dabd';
    ctx.beginPath(); ctx.moveTo(e.x - r * 0.55, y - r * 0.55); ctx.lineTo(e.x - r * 0.95, y - r * 1.3); ctx.lineTo(e.x - r * 0.2, y - r * 0.82); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(e.x + r * 0.55, y - r * 0.55); ctx.lineTo(e.x + r * 0.95, y - r * 1.3); ctx.lineTo(e.x + r * 0.2, y - r * 0.82); ctx.closePath(); ctx.fill();
  }
  // 身體
  const flashAmt = e.hitFlash > 0 ? Math.min(80, e.hitFlash / 0.12 * 80) : 0;
  const bodyColor = e.hitFlash > 0 ? lighten(e.color, flashAmt) : e.color;
  const suppressFace = bossForm && (e.form === 'dread' || e.form === 'psyche');
  if (bossForm) {
    drawBossForm(ctx, e, e.x, y, r, bodyColor, now || 0);
  } else {
    ctx.fillStyle = bodyColor;
    ctx.beginPath(); ctx.arc(e.x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.hitFlash > 0 ? lighten(e.color, flashAmt) : lighten(e.color, 40);
    ctx.beginPath(); ctx.arc(e.x, y - r * 0.35, r * 0.55, 0, Math.PI * 2); ctx.fill(); // 上方加亮
  }
  // 重甲護板：土/金 元素(厚重/堅硬)顯示甲條（boss 專屬剪影不畫）
  if ((e.armorType === 'earth' || e.armorType === 'metal') && !bossForm) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(e.x - r * 0.82, y + r * 0.16, r * 1.64, r * 0.34); }
  // 眼睛 + 眉（自帶臉的剪影 dread/psyche 跳過）
  const ex = r * 0.34, ey = -r * 0.06;
  if (!suppressFace) {
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(e.x - ex, y + ey, r * 0.22, 0, Math.PI * 2); ctx.arc(e.x + ex, y + ey, r * 0.22, 0, Math.PI * 2); ctx.fill();
  if (e.boss) { ctx.shadowColor = '#ff5a4a'; ctx.shadowBlur = 6; }
  ctx.fillStyle = e.boss ? '#ff5a4a' : '#1a1320';
  ctx.beginPath(); ctx.arc(e.x - ex, y + ey, r * 0.11, 0, Math.PI * 2); ctx.arc(e.x + ex, y + ey, r * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // 凶惡眉毛
  ctx.strokeStyle = '#1a1320'; ctx.lineWidth = Math.max(1.4, r * 0.13); ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(e.x - ex - r * 0.26, y + ey - r * 0.34); ctx.lineTo(e.x - ex + r * 0.16, y + ey - r * 0.1);
  ctx.moveTo(e.x + ex + r * 0.26, y + ey - r * 0.34); ctx.lineTo(e.x + ex - r * 0.16, y + ey - r * 0.1);
  ctx.stroke(); ctx.lineCap = 'butt';
  }
  // Boss 獠牙嘴（自帶臉的跳過）
  if (e.boss && !suppressFace) {
    ctx.strokeStyle = '#1a1320'; ctx.lineWidth = Math.max(1.4, r * 0.1);
    ctx.beginPath(); ctx.moveTo(e.x - r * 0.3, y + r * 0.36); ctx.lineTo(e.x - r * 0.08, y + r * 0.26); ctx.lineTo(e.x + r * 0.12, y + r * 0.4); ctx.lineTo(e.x + r * 0.32, y + r * 0.28); ctx.stroke();
  }
  // 飛行翼影
  if (e.flying) {
    ctx.strokeStyle = 'rgba(231,221,201,0.45)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(e.x, y, r + 4, 0, Math.PI * 2); ctx.stroke();
  }
  // 減速/凍結圈、毒點
  if (e.slowUntil > 0 && e.slowFactor < 1) {
    ctx.strokeStyle = e.slowFactor === 0 ? '#bfe9ff' : '#7fc7ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.x, y, r + 3, 0, Math.PI * 2); ctx.stroke();
  }
  if (e.dots && e.dots.length) { ctx.fillStyle = '#7fe04a'; ctx.beginPath(); ctx.arc(e.x + r, y - r, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore(); // 結束受擊擠壓變形（血條不跟著壓）
  // 血條(圓角細條)
  const w = r * 2, ratio = Math.max(0, e.hp / e.maxHp), by = e.y - r - 9;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - w / 2, by, w, 4);
  ctx.fillStyle = ratio > 0.5 ? '#5fd35f' : ratio > 0.25 ? '#f0c419' : '#e24b4a';
  ctx.fillRect(e.x - w / 2, by, w * ratio, 4);
  // 五行元素色點（血條左端，標示護甲屬性）
  const ei = ELEMENT_INFO[e.armorType];
  if (ei) {
    ctx.fillStyle = ei.color;
    ctx.beginPath(); ctx.arc(e.x - w / 2 - 4, by + 2, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(e.x - w / 2 - 4, by + 2, 2.6, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawProjectile(ctx, p) {
  // 拖尾殘影
  if (p.trail && p.trail.length > 0) {
    for (let i = 0; i < p.trail.length; i++) {
      const tr = p.trail[i];
      const alpha = (i / p.trail.length) * 0.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(tr.x, tr.y, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // 光暈外圈
  ctx.fillStyle = rgba(p.color, 0.3);
  ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
  // 白熱核心（發光）
  ctx.shadowColor = p.color; ctx.shadowBlur = 10;
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
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
  ctx.fillStyle = 'rgba(95,211,178,0.06)';
  ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(232,200,122,0.6)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
}

export function render(ctx, state, mouse) {
  ctx.save();
  if (state.shake > 0.3) ctx.translate((Math.random() * 2 - 1) * state.shake, (Math.random() * 2 - 1) * state.shake);
  drawTerrain(ctx, state.map, state.now);
  drawBuildGrid(ctx, state, mouse);
  for (const t of state.towers) drawTower(ctx, t);
  drawMinesAndAuras(ctx, state.towers);
  drawSoldiers(ctx, state.towers);
  for (const e of state.enemies) if (e.alive || e.deathT > 0) drawEnemy(ctx, e, state.now);
  for (const p of state.projectiles) if (p.alive) drawProjectile(ctx, p);
  drawParticles(ctx);
  // 暗角壓框
  const w = state.map.width, h = state.map.height;
  const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.75);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(8,6,14,0.45)');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
  drawScreenEffects(ctx, w, h);
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
      ctx.strokeStyle = 'rgba(232,200,122,0.75)'; ctx.lineWidth = 1.5;
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
