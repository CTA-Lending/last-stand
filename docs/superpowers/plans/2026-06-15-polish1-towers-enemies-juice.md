# 視覺打磨 #1：塔/怪重畫 + 打擊感 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 把佔位的圓圈方塊升級為精緻扁平向量：塔（石座＋陣營核心＋會瞄準目標的砲管＋發光環）、怪（身體＋眼睛＋待機浮動＋Boss 脈動光環）、投射物發光、打擊感（開火閃光、漂浮傷害數字、震屏、強化死亡爆裂）。純 Canvas，零依賴。

**Architecture:** 重寫 `render/renderer.js` 的 drawTower/drawEnemy/drawProjectile/drawTerrain。`render/particles.js` 加漂浮傷害數字與開火閃光。`entities/tower.js` 開火時記 `aimAngle`。`main.js` 加震屏(state.shake)、命中噴傷害數字。`render/colors.js` 小工具(hex→rgba)。視覺以截圖驗證(控制器負責)。

**Tech Stack:** 同前。**不影響玩法/測試**(只動繪圖)。

---

## Task 1：顏色工具 + 塔開火記角度 + 震屏狀態

**Files:** Create `src/render/colors.js`; Modify `src/entities/tower.js`, `src/state/gameState.js`

- [ ] **Step 1: src/render/colors.js**
```js
// '#rrggbb' + alpha → 'rgba(...)'；並提供加亮
export function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
export function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + amt), g = Math.min(255, ((n >> 8) & 255) + amt), b = Math.min(255, (n & 255) + amt);
  return `rgb(${r},${g},${b})`;
}
```

- [ ] **Step 2: tower.js updateTower 記 aimAngle**
在 `const target = selectTarget(...)` 之後、發射前加：
```js
  t.aimAngle = Math.atan2(target.y - t.y, target.x - t.x);
```
（恐懼略過射擊那行不動；其餘不變。）

- [ ] **Step 3: gameState.js 加 shake**
return 物件加 `shake: 0,`。

- [ ] **Step 4: 驗證** `npm test` 全綠；`node --check`。Commit：`git add -A && git commit -m "polish: 顏色工具 + 塔瞄準角度 + 震屏狀態"`

---

## Task 2：particles.js 加傷害數字 + 開火閃光

**Files:** Modify `src/render/particles.js`

- [ ] **Step 1: 加 floatText 與 flash**（併入既有 update/draw）
檔頂加 `const texts = []; const flashes = [];`
新增 export：
```js
export function floatText(x, y, text, color) {
  texts.push({ x: x + (Math.random() * 8 - 4), y, text, color, life: 0.8, vy: -34 });
}
export function flash(x, y, color, r = 14) {
  flashes.push({ x, y, color, r, life: 0.18, maxLife: 0.18 });
}
```
`updateParticles(dt)` 末端追加：
```js
  for (let i = texts.length - 1; i >= 0; i--) { const t = texts[i]; t.life -= dt; t.y += t.vy * dt; if (t.life <= 0) texts.splice(i, 1); }
  for (let i = flashes.length - 1; i >= 0; i--) { flashes[i].life -= dt; if (flashes[i].life <= 0) flashes.splice(i, 1); }
```
`drawParticles(ctx)` 末端(globalAlpha=1 之前)追加：
```js
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
```

- [ ] **Step 2: 驗證** `node --check src/render/particles.js`；Commit：`git add -A && git commit -m "polish(fx): 漂浮傷害數字 + 開火閃光粒子"`

---

## Task 3：renderer 重畫塔/怪/投射物/地形 + 震屏

**Files:** Modify `src/render/renderer.js`

- [ ] **Step 1: import 與簽章**
頂部加 `import { rgba, lighten } from './colors.js';`
`drawEnemy(ctx, e)` 改為 `drawEnemy(ctx, e, now)`；`render` 內呼叫傳 `state.now`。
`render(ctx, state, mouse)` 開頭加震屏位移：
```js
export function render(ctx, state, mouse) {
  ctx.save();
  if (state.shake > 0.3) ctx.translate((Math.random() * 2 - 1) * state.shake, (Math.random() * 2 - 1) * state.shake);
  drawTerrain(ctx, state.map);
  // ...其餘繪製不變...
  // (函式結尾)
  ctx.restore();
}
```
（注意：把原本 render 主體包進 save/translate…restore；火雨點地預覽等都包含在內。）

- [ ] **Step 2: drawTerrain 加質感**
```js
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
```
drawOnePath 末端加中線虛線：
```js
  ctx.strokeStyle = 'rgba(120,95,60,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
  ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
```

- [ ] **Step 3: drawTower 重畫（射擊塔石座+核心+瞄準砲管+發光；barracks/banner/mine 保留特殊但加陰影/發光）**
把現有 drawTower 改為：
```js
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
```

- [ ] **Step 4: drawEnemy 重畫（身體+眼睛+待機浮動+Boss 脈動光環+飛行浮影）**
```js
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
```

- [ ] **Step 5: drawProjectile 發光**
```js
function drawProjectile(ctx, p) {
  ctx.fillStyle = rgba(p.color, 0.3);
  ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill();
}
```

- [ ] **Step 6: render 內 drawEnemy 呼叫補 now**：`for (const e of state.enemies) if (e.alive) drawEnemy(ctx, e, state.now);`

- [ ] **Step 7: 驗證** `npm test` 全綠；`node --check src/render/renderer.js`；控制器瀏覽器截圖驗證。

- [ ] **Step 8: Commit** `git add -A && git commit -m "polish(render): 塔石座+瞄準砲管/怪身體眼睛浮動/Boss光環/投射物發光/地形質感+震屏"`

---

## Task 4：main 串接傷害數字 + 開火閃光 + 震屏觸發

**Files:** Modify `src/main.js`

- [ ] **Step 1: import** `import { updateParticles, burst, spark, floatText, flash } from './render/particles.js';`
- [ ] **Step 2: 震屏衰減**：update() 內 `s.now += dt;` 後加 `s.shake *= 0.86; if (s.shake < 0.3) s.shake = 0;`
- [ ] **Step 3: 命中傷害數字 + 強化爆裂**：投射物命中區塊，`burst(hit.x, hit.y, p.color, 7)` 後加 `floatText(hit.x, hit.y - 6, '' + Math.round(p.damage), p.color);`
- [ ] **Step 4: 開火閃光**：在塔開火處……簡化作法——投射物剛生成時於塔位閃光不易取得塔位；改為命中閃光：命中時 `flash(hit.x, hit.y, p.color, 16);`
- [ ] **Step 5: 死亡爆裂 + Boss 震屏**：敵人死亡(非漏怪)區塊：boss 死亡 `s.shake = 9;` 並 `flash(e.x, e.y, e.color, 26);`（一般敵已有 burst）。
- [ ] **Step 6: 驗證** `npm test` 全綠；`node --check src/main.js`；控制器截圖驗證打擊感。
- [ ] **Step 7: Commit** `git add -A && git commit -m "polish(juice): 命中傷害數字+閃光 + Boss死亡震屏"`

---

## 完成定義（視覺打磨 #1 Done）
- 塔有石座/陣營核心/瞄準砲管/發光；怪有身體/眼睛/待機浮動/Boss脈動光環；投射物發光；地形有質感；命中有傷害數字+閃光；Boss 死亡震屏。
- 不影響玩法/測試(全綠)。控制器截圖確認精緻度提升。

## Self-Review
- 只動繪圖與粒子，玩法/數值不變，測試應全綠。
- 用 colors.js 由 hex 算 rgba/加亮，避免 gradient 串流閃爍。
- 震屏包在 render 的 save/translate…restore；UI 為 DOM 不受影響。
- 草地散點用座標決定(非 random)避免每幀跳動。
