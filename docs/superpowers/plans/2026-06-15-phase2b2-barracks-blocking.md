# Phase 2b-2：人類騎士兵營 + 擋路機制 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 新增「人類騎士兵營」塔：在路徑旁集結點生成近戰士兵，士兵會**攔住地面敵人原地纏鬥**（雙方互相扣血），士兵陣亡後冷卻重生；飛行敵人不被擋。為固定路徑塔防加入「卡位/纏鬥」維度。

**Architecture:** 兵營是特殊塔(`kind:'barracks'`，不發射投射物)。建造時算出最近的路徑點當集結點。新增 `entities/soldier.js`(士兵實體)與 `systems/blocking.js`(管理生兵/找目標/纏鬥傷害交換，核心純邏輯 TDD)。敵人新增 `blockedBy`/近戰傷害欄位；`updateEnemy` 被擋時停止前進。主迴圈在塔更新分流 barracks→blocking。沿用 Phase 2b-1 的 2 階+分支升級。

**Tech Stack:** 同前（Canvas 2D、原生 JS ESM、node --test）。

---

## 既有可複用
- `systems/pathing.js` `advancePath`、`core/geometry.js` `dist`
- `entities/tower.js`：`buildTower`/`applyStats`/升級分支（需擴充支援 barracks 欄位與 kind）
- `entities/enemy.js` `updateEnemy(e, map, dt, now)`（需加「被擋則不前進」）
- `data/enemies.js`（需加近戰傷害 dmg / 攻速）、`data/towers.js`（加兵營）、`data/balance.js`
- `main.js` 塔更新迴圈、`render/renderer.js`、`ui/buildMenu.js`

---

## Task 1：最近路徑點工具 + 敵人近戰欄位

**Files:** Modify `src/systems/grid.js`(加 nearestPointOnPath), `src/data/enemies.js`, `tests/grid.test.js`

- [ ] **Step 1: grid.test.js 加測試**
```js
import { nearestPointOnPath } from '../src/systems/grid.js';
test('nearestPointOnPath 回路徑上最近點', () => {
  const p = nearestPointOnPath(100, 40, [{ x: 0, y: 0 }, { x: 200, y: 0 }]);
  assert.equal(Math.round(p.x), 100);
  assert.equal(Math.round(p.y), 0);
});
```

- [ ] **Step 2: grid.js 加 `nearestPointOnPath`**（沿用既有 pointSegDist 思路，回最近投影點）
```js
export function nearestPointOnPath(x, y, path) {
  let best = { x: path[0].x, y: path[0].y }, bestD = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const ax = path[i].x, ay = path[i].y, bx = path[i + 1].x, by = path[i + 1].y;
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    let t = len2 ? ((x - ax) * dx + (y - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const px = ax + dx * t, py = ay + dy * t;
    const d = dist(x, y, px, py);
    if (d < bestD) { bestD = d; best = { x: px, y: py }; }
  }
  return best;
}
```

- [ ] **Step 3: enemies.js 每隻加近戰傷害 `dmg` 與攻速 `atk`**（對士兵的傷害/秒攻一次間隔秒）
在每個敵人物件加欄位（範例值，全部都要加）：
```
skeleton:  dmg: 5,  atk: 1.0
zombie:    dmg: 10, atk: 1.3
banshee:   dmg: 0,  atk: 1.0   // 飛行不纏鬥
deathknight: dmg: 22, atk: 1.2
imp:       dmg: 4,  atk: 0.8
succubus:  dmg: 0,  atk: 1.0   // 飛行
infernal:  dmg: 18, atk: 1.4
warlock:   dmg: 8,  atk: 1.1
demonlord: dmg: 28, atk: 1.2
```

- [ ] **Step 4: 驗證** `node --test tests/grid.test.js`（+1）；`npm test` 全綠；`node --check src/systems/grid.js src/data/enemies.js`

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(blocking): nearestPointOnPath + 敵人近戰傷害欄位"`

---

## Task 2：擋路核心邏輯（blocking，TDD）

**Files:** Create `src/entities/soldier.js`, `src/systems/blocking.js`, `tests/blocking.test.js`

職責：管理一座兵營的士兵（生兵/重生）、替士兵指派攔截目標（最近、非飛行、未被擋的地面敵）、處理士兵↔敵人纏鬥傷害交換。

資料形狀：
- soldier: `{ id, x, y, hp, maxHp, dmg, atk, atkCd, targetId, alive, respawn }`
- barracks tower 額外欄位：`rally:{x,y}`, `soldiers:[]`, `soldierHp, soldierDmg, soldierAtk, maxSoldiers, engageRange`
- enemy 額外：`blockedBy`(soldierId 或 null), `atkCd`

- [ ] **Step 1: 失敗測試** `tests/blocking.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateBlocking } from '../src/systems/blocking.js';

function barracks() {
  return { kind: 'barracks', x: 100, y: 100, rally: { x: 100, y: 100 },
    soldiers: [], soldierHp: 60, soldierDmg: 8, soldierAtk: 0.8, maxSoldiers: 2, engageRange: 40 };
}
function enemy(o) {
  return { id: 1, x: 100, y: 100, hp: 50, armorType: 'light', alive: true, reachedEnd: false,
    dmg: 10, atk: 1.0, atkCd: 0, blockedBy: null, ...o };
}

test('兵營會生出士兵(至多 max)', () => {
  const b = barracks();
  updateBlocking(b, [], 0.1, 0);
  assert.equal(b.soldiers.length, 2);
});
test('射程內地面敵被指派攔截、標記 blockedBy', () => {
  const b = barracks();
  const e = enemy({ x: 110, y: 100 });
  updateBlocking(b, [e], 0.1, 0);
  assert.equal(e.blockedBy != null, true);
});
test('飛行敵不被攔', () => {
  const b = barracks();
  const e = enemy({ armorType: 'flying', x: 110, y: 100 });
  updateBlocking(b, [e], 0.1, 0);
  assert.equal(e.blockedBy, null);
});
test('纏鬥時士兵與敵互扣血', () => {
  const b = barracks();
  const e = enemy({ x: 105, y: 100, hp: 100 });
  for (let i = 0; i < 20; i++) updateBlocking(b, [e], 0.1, i * 0.1); // 跑2秒
  const s = b.soldiers[0];
  assert.ok(e.hp < 100);          // 敵被砍
  assert.ok(s.hp < s.maxHp || !s.alive); // 士兵被打
});
```

- [ ] **Step 2: 跑測試確認失敗** `node --test tests/blocking.test.js`

- [ ] **Step 3: 實作 `src/entities/soldier.js`**
```js
let nextId = 1;
export function spawnSoldier(b, i) {
  const spread = (i - (b.maxSoldiers - 1) / 2) * 14;
  return {
    id: nextId++, x: b.rally.x + spread, y: b.rally.y, hp: b.soldierHp, maxHp: b.soldierHp,
    dmg: b.soldierDmg, atk: b.soldierAtk, atkCd: 0, targetId: null, alive: true, respawn: 0,
  };
}
```

- [ ] **Step 4: 實作 `src/systems/blocking.js`**
```js
import { dist } from '../core/geometry.js';
import { spawnSoldier } from '../entities/soldier.js';

const RESPAWN = 4; // 士兵重生秒

export function updateBlocking(b, enemies, dt, now) {
  // 補足/重生士兵
  while (b.soldiers.length < b.maxSoldiers) b.soldiers.push(spawnSoldier(b, b.soldiers.length));
  for (const s of b.soldiers) {
    if (!s.alive) { s.respawn -= dt; if (s.respawn <= 0) Object.assign(s, spawnSoldier(b, b.soldiers.indexOf(s))); continue; }

    // 目標仍有效?
    let target = s.targetId != null ? enemies.find(e => e.id === s.targetId && e.alive) : null;
    if (target && (target.reachedEnd || dist(s.x, s.y, target.x, target.y) > b.engageRange)) {
      if (target.blockedBy === s.id) target.blockedBy = null;
      target = null; s.targetId = null;
    }
    // 找新目標：射程內、地面、未被擋
    if (!target) {
      let best = null, bd = b.engageRange;
      for (const e of enemies) {
        if (!e.alive || e.reachedEnd || e.armorType === 'flying' || (e.blockedBy != null && e.blockedBy !== s.id)) continue;
        const d = dist(s.x, s.y, e.x, e.y);
        if (d <= bd) { bd = d; best = e; }
      }
      if (best) { target = best; s.targetId = best.id; best.blockedBy = s.id; }
    }
    if (!target) continue;

    // 纏鬥：互扣血
    s.atkCd -= dt;
    if (s.atkCd <= 0) { target.hp -= s.dmg; s.atkCd = 1 / s.atk; }
    target.atkCd -= dt;
    if (target.atkCd <= 0 && target.dmg > 0) { s.hp -= target.dmg; target.atkCd = 1 / target.atk; }

    if (s.hp <= 0) {
      s.alive = false; s.respawn = RESPAWN;
      if (target.blockedBy === s.id) target.blockedBy = null;
      s.targetId = null;
    }
  }
}
```

- [ ] **Step 5: 跑測試確認通過** `node --test tests/blocking.test.js`（4）

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(blocking): 士兵實體 + 兵營擋路纏鬥核心"`

---

## Task 3：兵營塔資料 + 建造 + 敵人被擋停步 + 主迴圈串接

**Files:** Modify `src/data/towers.js`, `src/data/balance.js`, `src/entities/tower.js`, `src/entities/enemy.js`, `src/main.js`

- [ ] **Step 1: towers.js 加 human_barracks**（kind:'barracks'，stats 用 soldier 系欄位）
```js
  human_barracks: {
    name: '人類騎士兵營', faction: 'human', kind: 'barracks', canHitAir: false,
    color: '#c9c2a8',
    levels: [
      { cost: 100, soldierHp: 60,  soldierDmg: 8,  soldierAtk: 0.9, maxSoldiers: 2, engageRange: 46 },
      { cost: 90,  soldierHp: 100, soldierDmg: 13, soldierAtk: 1.0, maxSoldiers: 2, engageRange: 50 },
    ],
    branches: [
      { name: '重裝騎士', cost: 150, soldierHp: 200, soldierDmg: 16, soldierAtk: 1.0, maxSoldiers: 3, engageRange: 54 },
      { name: '聖殿守衛', cost: 150, soldierHp: 130, soldierDmg: 30, soldierAtk: 1.2, maxSoldiers: 2, engageRange: 54 },
    ],
  },
```

- [ ] **Step 2: tower.js — applyStats 支援 barracks 欄位 + buildTower 處理 kind**
`applyStats(t, s)` 末端追加（複製存在的欄位）：
```js
  for (const k of ['soldierHp', 'soldierDmg', 'soldierAtk', 'maxSoldiers', 'engageRange']) {
    if (s[k] !== undefined) t[k] = s[k];
  }
```
`buildTower` 內，建立 t 後、套 stats 前後處理 barracks：在 return 前加上
```js
  if (def.kind === 'barracks') {
    t.kind = 'barracks';
    t.rally = null;       // 由 main 建造後用 nearestPointOnPath 設定
    t.soldiers = [];
  }
```
（其餘塔 t.kind 為 undefined，照常發射投射物。）

- [ ] **Step 3: enemy.js — 被擋則不前進**
`updateEnemy` 內，計算 factor、處理 hitFlash 之後、呼叫 advancePath 之前加：
```js
  // 被士兵攔住 → 原地不前進（纏鬥由 blocking 處理）
  if (e.blockedBy != null) { return; }
```
並確保 spawn 時有欄位：`src/entities/enemy.js` `spawnEnemy` 回傳物件加 `blockedBy: null, atkCd: 0,`（dmg/atk 由 spec 帶入：spawnEnemy 目前由 buildWave spec 建立，需把 dmg/atk 從 ENEMIES 定義帶進）。在 spawnEnemy 內用 `const def = ENEMIES[spec.type];` 補 `dmg: def.dmg, atk: def.atk,`。

- [ ] **Step 4: endlessDirector 帶上 dmg/atk**（buildWave 產生的 spec 需含 dmg/atk，否則 spawnEnemy 取 def 即可）
確認 `spawnEnemy` 用 `ENEMIES[spec.type].dmg/atk` 取值（上步已處理），則 director 不需改。若 spawnEnemy 仍從 spec 取，請改為從 def 取。

- [ ] **Step 5: main.js 串接**
import：`import { updateBlocking } from './systems/blocking.js';` 與 `import { nearestPointOnPath } from './systems/grid.js';`
建造後設定集結點：在建塔成功處（`s.occupiedCells.add(key);` 之後）加：
```js
        if (t.kind === 'barracks') t.rally = nearestPointOnPath(t.x, t.y, s.map.path);
```
塔更新迴圈分流：把 `for (const t of s.towers) updateTower(t, s.enemies, s.projectiles, dt);` 改為
```js
  for (const t of s.towers) {
    if (t.kind === 'barracks') updateBlocking(t, s.enemies, dt, s.now);
    else updateTower(t, s.enemies, s.projectiles, dt);
  }
```

- [ ] **Step 6: 驗證** `npm test` 全綠；`node --check` 改動檔。

- [ ] **Step 7: Commit** `git add -A && git commit -m "feat(barracks): 兵營塔資料+建造集結點+敵人被擋停步+主迴圈分流"`

---

## Task 4：渲染 + UI

**Files:** Modify `src/render/renderer.js`, `src/ui/buildMenu.js`

- [ ] **Step 1: renderer.js 畫兵營/士兵/集結點**
`drawTower` 內若 `t.kind === 'barracks'`：畫旗幟方塊(已用底座)＋集結點小標記；另在 `render()` 塔之後新增畫士兵：
```js
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
```
在 `render()` 的 `for (const e of state.enemies)` 之前呼叫 `drawSoldiers(ctx, state.towers);`。
`drawTower` 對 barracks 可用旗色方塊：若 `t.kind==='barracks'`，中心畫一面小旗(矩形+三角)取代圓，顏色 t.color。

- [ ] **Step 2: buildMenu.js showTowerPanel 支援 barracks 顯示**
把顯示「傷害/射程」那行改為依 kind：
```js
  const statLine = t.kind === 'barracks'
    ? `<div>士兵 ${t.maxSoldiers}名 · 血${t.soldierHp} 攻${t.soldierDmg}</div>`
    : `<div>傷害 ${t.damage} · 射程 ${t.range}</div>`;
```
並把 panel.innerHTML 中該行換成 `${statLine}`。其餘升級/分支/賣出邏輯不變（分支數值含 soldier 欄位，applyStats 已支援）。

- [ ] **Step 3: 驗證** `npm test` 全綠；`node --check`；控制器瀏覽器實測：蓋兵營於路徑旁→士兵出現在路上→地面敵走到被擋住原地纏鬥、雙方血條下降→士兵死後約4秒重生→飛行敵無視穿過→升級/分支改變士兵數值。

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(barracks): 兵營/士兵/集結點渲染 + 面板顯示士兵屬性"`

---

## 完成定義（Phase 2b-2 Done）
- 人類騎士兵營可蓋，士兵站集結點攔住地面敵原地纏鬥、互扣血、死後重生、飛行敵不被擋。
- 兵營走 2 階+分支（重裝騎士/聖殿守衛）。
- blocking 核心有單元測試。全測試綠、瀏覽器實測通過。

## Self-Review
- 兵營 `kind:'barracks'` 不發射投射物，主迴圈分流到 updateBlocking；其餘塔不受影響。
- 敵人 `blockedBy` 由 blocking 設/清；updateEnemy 被擋則 return 不前進；士兵死亡或敵離開射程會清除，敵恢復前進。
- applyStats 同時支援投射塔(damage/range/fireRate/splash/effect)與兵營(soldier*)，分支升級沿用。
- enemy spawn 補 blockedBy/atkCd/dmg/atk，避免 undefined。
