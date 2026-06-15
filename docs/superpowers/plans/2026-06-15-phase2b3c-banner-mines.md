# Phase 2b-3c：號令旗光環 + 地雷 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 補完塔陣容最後兩座特殊塔：🚩人類號令旗(buff 光環，提升範圍內塔的傷害與射速)、💣矮人地雷(在射程內路徑佈雷，敵人踩到爆 AoE)。皆走科技樹(都需兵營/火砲)與 2 階+分支。

**Architecture:** 號令旗 `kind:'banner'` 不開火，每幀由 `systems/aura.js` 計算各塔 buff 倍率(純函式 TDD)，updateTower/spawnProjectile 套用。地雷 `kind:'mine'` 不開火，建造時用 `grid.pathSlots` 算出射程內路徑佈雷點(純函式 TDD)，`systems/mines.js` 補雷/偵測踩雷/引爆 AoE。主迴圈依 kind 分流。

**Tech Stack:** 同前。

---

## Task 1：光環 buff（aura，TDD）

**Files:** Create `src/systems/aura.js`, `tests/aura.test.js`; Modify `src/entities/tower.js`, `src/entities/projectile.js`

`buffMultFor(tower, towers)`：累乘所有「在其光環範圍內、kind==='banner'」的 buff。`applyAuras(towers)`：對每個非 banner 塔寫入 `buffDmg`/`buffRate`。

- [ ] **Step 1: 失敗測試** `tests/aura.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buffMultFor, applyAuras } from '../src/systems/aura.js';

const banner = (x) => ({ kind: 'banner', x, y: 0, range: 100, buffDamage: 1.25, buffFireRate: 1.2 });
const tower = (x) => ({ x, y: 0 });

test('範圍內塔取得 buff', () => {
  const m = buffMultFor(tower(50), [banner(0)]);
  assert.equal(m.dmg, 1.25); assert.equal(m.rate, 1.2);
});
test('範圍外不 buff', () => {
  const m = buffMultFor(tower(300), [banner(0)]);
  assert.equal(m.dmg, 1); assert.equal(m.rate, 1);
});
test('兩面旗疊乘', () => {
  const m = buffMultFor(tower(50), [banner(0), banner(60)]);
  assert.ok(Math.abs(m.dmg - 1.25 * 1.25) < 1e-9);
});
test('applyAuras 寫入 buffDmg/buffRate；banner 自身略過', () => {
  const t = tower(50), b = banner(0);
  applyAuras([t, b]);
  assert.equal(t.buffDmg, 1.25);
  assert.equal(b.buffDmg, undefined); // banner 不被 buff
});
```

- [ ] **Step 2: 跑測試確認失敗** `cd last-stand && node --test tests/aura.test.js`

- [ ] **Step 3: 實作 `src/systems/aura.js`**
```js
import { dist } from '../core/geometry.js';

export function buffMultFor(tower, towers) {
  let dmg = 1, rate = 1;
  for (const b of towers) {
    if (b.kind !== 'banner' || b === tower) continue;
    if (dist(tower.x, tower.y, b.x, b.y) <= b.range) { dmg *= b.buffDamage; rate *= b.buffFireRate; }
  }
  return { dmg, rate };
}

export function applyAuras(towers) {
  for (const t of towers) {
    if (t.kind === 'banner') continue;
    const m = buffMultFor(t, towers);
    t.buffDmg = m.dmg; t.buffRate = m.rate;
  }
}
```

- [ ] **Step 4: 套用 buff** — `src/entities/tower.js` `updateTower` 冷卻改：
`t.cooldown = 1 / (t.fireRate * (t.buffRate || 1));`
`src/entities/projectile.js` `spawnProjectile` 傷害改：
`damage: tower.damage * (tower.buffDmg || 1),`

- [ ] **Step 5: 跑測試確認通過** `node --test tests/aura.test.js`（4）；`npm test` 全綠

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(aura): 號令旗光環 buff 計算與套用"`

---

## Task 2：路徑佈雷點（pathSlots，TDD）

**Files:** Modify `src/systems/grid.js`, `tests/grid.test.js`

- [ ] **Step 1: grid.test.js 加測試**
```js
import { pathSlots } from '../src/systems/grid.js';
test('pathSlots 回射程內的路徑取樣點', () => {
  const slots = pathSlots({ x: 50, y: 0 }, 60, [{ x: 0, y: 0 }, { x: 200, y: 0 }], 20);
  assert.ok(slots.length >= 2);
  assert.ok(slots.every(s => Math.hypot(s.x - 50, s.y - 0) <= 60));
});
```

- [ ] **Step 2: grid.js 加 `pathSlots`**
```js
export function pathSlots(center, range, path, spacing) {
  const slots = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.floor(segLen / spacing));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      if (Math.hypot(x - center.x, y - center.y) <= range) slots.push({ x, y });
    }
  }
  return slots;
}
```

- [ ] **Step 3: 驗證** `node --test tests/grid.test.js`；`npm test` 全綠

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(grid): pathSlots 射程內路徑取樣點"`

---

## Task 3：地雷系統 + 兩塔資料 + 建造/分流/渲染

**Files:** Create `src/systems/mines.js`; Modify `src/data/towers.js`, `src/entities/tower.js`, `src/main.js`, `src/render/renderer.js`

- [ ] **Step 1: mines.js**（補雷 + 踩雷引爆 AoE，回傳引爆點供粒子）
```js
import { dist } from '../core/geometry.js';
import { computeDamage } from '../systems/combat.js';

export function updateMines(t, enemies, dt) {
  const dets = [];
  // 補雷
  t.mineCd -= dt;
  if (t.mineCd <= 0 && t.mines.length < t.maxMines && t.mineSlots.length) {
    const free = t.mineSlots.filter(s => !t.mines.some(m => m.x === s.x && m.y === s.y));
    if (free.length) { t.mines.push({ x: free[0].x, y: free[0].y }); t.mineCd = t.mineRate; }
  }
  // 偵測踩雷(地面敵)
  for (let i = t.mines.length - 1; i >= 0; i--) {
    const m = t.mines[i];
    const trig = enemies.find(e => e.alive && !e.reachedEnd && e.armorType !== 'flying' && dist(m.x, m.y, e.x, e.y) <= 14);
    if (!trig) continue;
    for (const e of enemies) if (e.alive && dist(m.x, m.y, e.x, e.y) <= t.splash) {
      e.hp -= computeDamage(t.damage, 'siege', e.armorType); e.hitFlash = 0.12;
    }
    t.mines.splice(i, 1);
    dets.push({ x: m.x, y: m.y });
  }
  return dets;
}
```

- [ ] **Step 2: towers.js 新增兩塔**（在 dwarf_mortar 之後、mage_chain 之前；皆在 TOWERS 內）
```js
  human_banner: {
    name: '人類號令旗', faction: 'human', kind: 'banner', canHitAir: false, requires: ['human_barracks'],
    color: '#e8d98a',
    levels: [
      { cost: 110, range: 110, buffDamage: 1.20, buffFireRate: 1.15 },
      { cost: 100, range: 125, buffDamage: 1.30, buffFireRate: 1.22 },
    ],
    branches: [
      { name: '戰旗', cost: 150, range: 140, buffDamage: 1.50, buffFireRate: 1.25 },
      { name: '聖旗', cost: 150, range: 150, buffDamage: 1.30, buffFireRate: 1.50 },
    ],
  },
  dwarf_mine: {
    name: '矮人地雷', faction: 'dwarf', kind: 'mine', attackType: 'siege', canHitAir: false, requires: ['dwarf_cannon'],
    color: '#9a7b3a', splash: 50,
    levels: [
      { cost: 120, damage: 60, range: 130, splash: 50, maxMines: 3, mineRate: 2.5 },
      { cost: 110, damage: 100, range: 140, splash: 56, maxMines: 4, mineRate: 2.2 },
    ],
    branches: [
      { name: '集束雷', cost: 160, damage: 130, range: 150, splash: 72, maxMines: 6, mineRate: 1.8 },
      { name: '高爆雷', cost: 160, damage: 220, range: 145, splash: 60, maxMines: 3, mineRate: 2.0 },
    ],
  },
```

- [ ] **Step 3: tower.js — applyStats/buildTower 支援 banner/mine 欄位**
`applyStats(t, s)` 的欄位複製迴圈，把 key 清單擴充為：
```js
  for (const k of ['soldierHp', 'soldierDmg', 'soldierAtk', 'maxSoldiers', 'engageRange',
                   'buffDamage', 'buffFireRate', 'maxMines', 'mineRate']) {
    if (s[k] !== undefined) t[k] = s[k];
  }
```
`buildTower` 在 barracks 區塊後，加 banner/mine 初始化：
```js
  if (def.kind === 'banner') { t.kind = 'banner'; }
  if (def.kind === 'mine') { t.kind = 'mine'; t.mines = []; t.mineSlots = []; t.mineCd = 0; }
```

- [ ] **Step 4: main.js 串接**
import：`import { applyAuras } from './systems/aura.js';`、`import { updateMines } from './systems/mines.js';`、`pathSlots` 併入既有 grid import。
建造後設定地雷佈點：在 `if (t.kind === 'barracks') t.rally = ...` 那行附近加：
```js
        if (t.kind === 'mine') t.mineSlots = pathSlots({ x: t.x, y: t.y }, t.range, s.map.path, 26);
```
塔更新前算光環：在 `for (const t of s.towers) {` 迴圈「之前」加 `applyAuras(s.towers);`
塔更新迴圈分流補上 banner/mine：
```js
  applyAuras(s.towers);
  for (const t of s.towers) {
    if (t.kind === 'barracks') updateBlocking(t, s.enemies, dt, s.now);
    else if (t.kind === 'banner') { /* 不開火，光環已套 */ }
    else if (t.kind === 'mine') { for (const d of updateMines(t, s.enemies, dt)) burst(d.x, d.y, '#ffb13a', 18); }
    else updateTower(t, s.enemies, s.projectiles, dt);
  }
```

- [ ] **Step 5: renderer.js — 畫號令旗、地雷、光環圈**
`drawTower` 內，banner 畫旗（沿用底座+三角旗，色 t.color）；其餘照舊。
`render()` 在塔之後、敵人之前，新增畫地雷與光環：
```js
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
```
在 `render()` 呼叫：`drawMinesAndAuras(ctx, state.towers);`（放在 `for (const t of state.towers) drawTower(...)` 之後）。

- [ ] **Step 6: buildMenu.js — 面板顯示 banner/mine 屬性**
`showTowerPanel` 的 statLine 擴充：
```js
  const statLine = t.kind === 'barracks'
    ? `<div>士兵 ${t.maxSoldiers}名 · 血${t.soldierHp} 攻${t.soldierDmg}</div>`
    : t.kind === 'banner'
    ? `<div>光環 傷害×${t.buffDamage} 射速×${t.buffFireRate} · 範圍${t.range}</div>`
    : t.kind === 'mine'
    ? `<div>地雷 ${t.maxMines}顆 · 傷害${t.damage} 範圍${t.splash}</div>`
    : `<div>傷害 ${t.damage} · 射程 ${t.range}</div>`;
```

- [ ] **Step 7: 驗證** `npm test` 全綠；`node --check` 改動檔；控制器瀏覽器實測。

- [ ] **Step 8: Commit** `git add -A && git commit -m "feat(towers): 號令旗光環 + 地雷佈雷 兩塔(渲染/面板/串接)"`

---

## Task 4：瀏覽器實測（控制器）
- [ ] 兵營在場→號令旗解鎖；蓋旗後，範圍內塔攻擊變快/變強(光環圈可見)。
- [ ] 火砲在場→地雷解鎖；蓋地雷後路徑上出現雷，敵人踩到爆 AoE(橘色爆點)，會補雷。
- [ ] 飛行敵不觸雷。升級分支：戰旗 buff 更強、集束雷更多顆。

## 完成定義（Phase 2b-3c Done）
- 號令旗光環提升周圍塔、地雷路徑爆破，皆走科技樹與分支。塔陣容補滿(14 座=12 可蓋+2 轉蛋)。
- aura/pathSlots 純函式有單元測試。全測試綠、瀏覽器實測通過。

## Self-Review
- banner/mine 皆 kind 分流、不走投射物；buff 每幀重算(applyAuras)再套到 updateTower/spawnProjectile。
- 地雷佈點建造時算一次(pathSlots)，補雷/引爆走 updateMines；飛行免疫；引爆 AoE 用 siege 傷害。
- applyStats 欄位清單含 buff/mine 欄位；buildTower 依 kind 初始化 mines/mineSlots。
- buff 倍率用 `|| 1` 防未套用時 undefined。
