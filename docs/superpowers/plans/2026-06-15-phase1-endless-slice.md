# Phase 1：無盡生存垂直切片 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做出《誰撐最久》的可玩無盡生存切片：怪物程式生成、一波比一波強，玩家蓋 3 種基礎塔靠克制表殺怪，撐越久分數越高，命歸零結束並存本機最佳記錄。

**Architecture:** 純邏輯模組（克制傷害、尋路、經濟、鎖定、無盡導演、存檔）與渲染/UI 解耦。邏輯模組為無副作用的 ES Modules，可在 Node 直接單元測試；Canvas 2D 分層渲染 + DOM HUD 疊層；中央 `gameState` 持有可變狀態；`main.js` 用固定時間步迴圈串接全部。全資料驅動（towers/enemies/balance/map）。

**Tech Stack:** HTML5 Canvas 2D、原生 JS（ES Modules，`"type":"module"`）、Node 內建測試器 `node --test`（零外部依賴）、localStorage 存檔。

---

## 檔案結構（Phase 1 建立）

```
last-stand/
  package.json              # "type":"module" + test script
  index.html                # canvas + DOM HUD 容器
  src/
    main.js                 # bootstrap：建 state、串接迴圈、輸入
    core/loop.js            # 固定時間步遊戲迴圈
    core/geometry.js        # 距離/向量小工具
    state/gameState.js      # 中央可變狀態容器
    systems/pathing.js      # 沿 waypoint 折線移動（純函式）
    systems/economy.js      # 金錢/命數/分數/計時
    systems/combat.js       # 克制表傷害結算
    systems/targeting.js    # 範圍查詢 + 鎖定優先序
    systems/endlessDirector.js # 程式生怪 + 難度縮放
    entities/enemy.js       # 敵人 spawn/update
    entities/tower.js       # 塔 spawn/fire/upgrade
    entities/projectile.js  # 投射物 update/命中
    render/renderer.js      # 分層 Canvas 渲染
    render/particles.js     # 粒子物件池
    ui/hud.js               # DOM HUD（金錢/命/波/分/結算）
    ui/buildMenu.js         # DOM 建造選單
    services/saveService.js # localStorage 最佳記錄（可注入 storage）
    data/attackMatrix.js    # 攻擊×護甲倍率表
    data/balance.js         # 數值/難度曲線參數
    data/towers.js          # 3 基礎塔定義（含升級階）
    data/enemies.js         # 不死族怪物定義
    data/map1.js            # 地圖：路徑/建塔格/出生點/王城
  tests/
    combat.test.js
    pathing.test.js
    economy.test.js
    targeting.test.js
    endlessDirector.test.js
    saveService.test.js
```

**共用資料形狀（全程一致）：**
- `attackType`: `'physical' | 'siege' | 'magic'`
- `armorType`: `'light' | 'heavy' | 'magic' | 'flying'`
- enemy: `{ id, type, x, y, hp, maxHp, armorType, speed, bounty, seg, alive, reachedEnd, slowUntil, slowFactor, dots }`
- tower: `{ id, type, x, y, slot, attackType, canHitAir, range, damage, fireRate, splash, cooldown, priority, level }`
- projectile: `{ id, x, y, targetId, speed, damage, attackType, splash, alive }`

---

## Task 1：測試骨架 + 克制傷害結算（combat）

**Files:**
- Create: `last-stand/package.json`
- Create: `last-stand/src/data/attackMatrix.js`
- Create: `last-stand/src/systems/combat.js`
- Test: `last-stand/tests/combat.test.js`

- [ ] **Step 1: 建 package.json**

```json
{
  "name": "last-stand",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: 寫失敗測試**

`tests/combat.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDamage } from '../src/systems/combat.js';

test('物理剋輕甲 ×1.5', () => {
  assert.equal(computeDamage(100, 'physical', 'light'), 150);
});
test('物理打重甲 ×0.5', () => {
  assert.equal(computeDamage(100, 'physical', 'heavy'), 50);
});
test('攻城剋重甲 ×1.5', () => {
  assert.equal(computeDamage(100, 'siege', 'heavy'), 150);
});
test('魔法剋法甲 ×1.5', () => {
  assert.equal(computeDamage(100, 'magic', 'magic'), 150);
});
test('傷害不為負', () => {
  assert.equal(computeDamage(-5, 'magic', 'light'), 0);
});
```

- [ ] **Step 3: 跑測試確認失敗**

Run: `cd last-stand && node --test tests/combat.test.js`
Expected: FAIL（Cannot find module combat.js）

- [ ] **Step 4: 寫最小實作**

`src/data/attackMatrix.js`:
```js
export const ATTACK_MATRIX = {
  physical: { light: 1.5, heavy: 0.5, magic: 1.0, flying: 1.0 },
  siege:    { light: 1.0, heavy: 1.5, magic: 0.75, flying: 1.0 },
  magic:    { light: 1.0, heavy: 1.0, magic: 1.5, flying: 1.0 },
};
export const CAN_HIT_AIR = { physical: true, siege: false, magic: true };
```

`src/systems/combat.js`:
```js
import { ATTACK_MATRIX } from '../data/attackMatrix.js';

export function computeDamage(amount, attackType, armorType) {
  const row = ATTACK_MATRIX[attackType];
  const mult = row && row[armorType] != null ? row[armorType] : 1;
  return Math.max(0, amount * mult);
}
```

- [ ] **Step 5: 跑測試確認通過並 commit**

Run: `cd last-stand && node --test tests/combat.test.js`
Expected: PASS（5 tests）
```bash
cd last-stand && git add package.json src/data/attackMatrix.js src/systems/combat.js tests/combat.test.js && git commit -m "feat(combat): 克制表傷害結算 + 測試骨架"
```

---

## Task 2：沿路徑移動（pathing）

**Files:**
- Create: `last-stand/src/core/geometry.js`
- Create: `last-stand/src/systems/pathing.js`
- Test: `last-stand/tests/pathing.test.js`

- [ ] **Step 1: 寫失敗測試**

`tests/pathing.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advancePath } from '../src/systems/pathing.js';

const WP = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];

test('在第一段內前進', () => {
  const r = advancePath(WP, 0, 0, 0, 30);
  assert.equal(r.x, 30);
  assert.equal(r.y, 0);
  assert.equal(r.seg, 0);
  assert.equal(r.done, false);
});
test('跨過轉角進入下一段', () => {
  const r = advancePath(WP, 0, 90, 0, 30);
  assert.equal(r.seg, 1);
  assert.equal(Math.round(r.x), 100);
  assert.equal(Math.round(r.y), 20);
});
test('走到終點標記 done', () => {
  const r = advancePath(WP, 1, 100, 90, 50);
  assert.equal(r.done, true);
  assert.equal(r.x, 100);
  assert.equal(r.y, 100);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd last-stand && node --test tests/pathing.test.js`
Expected: FAIL

- [ ] **Step 3: 寫實作**

`src/core/geometry.js`:
```js
export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}
```

`src/systems/pathing.js`:
```js
import { dist } from '../core/geometry.js';

// 從 (x,y) 在 waypoints 上沿折線前進 distance；seg = 目前所在線段起點索引
export function advancePath(waypoints, seg, x, y, distance) {
  let remaining = distance;
  let cx = x, cy = y, cseg = seg;
  while (remaining > 0 && cseg < waypoints.length - 1) {
    const target = waypoints[cseg + 1];
    const d = dist(cx, cy, target.x, target.y);
    if (d <= remaining) {
      cx = target.x; cy = target.y; cseg += 1; remaining -= d;
    } else {
      const t = remaining / d;
      cx += (target.x - cx) * t;
      cy += (target.y - cy) * t;
      remaining = 0;
    }
  }
  const done = cseg >= waypoints.length - 1;
  return { x: cx, y: cy, seg: cseg, done };
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `cd last-stand && node --test tests/pathing.test.js`
Expected: PASS（3 tests）

- [ ] **Step 5: Commit**

```bash
cd last-stand && git add src/core/geometry.js src/systems/pathing.js tests/pathing.test.js && git commit -m "feat(pathing): 沿 waypoint 折線移動"
```

---

## Task 3：經濟系統（economy）

**Files:**
- Create: `last-stand/src/systems/economy.js`
- Test: `last-stand/tests/economy.test.js`

- [ ] **Step 1: 寫失敗測試**

`tests/economy.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEconomy } from '../src/systems/economy.js';

test('初始金錢與命數', () => {
  const e = createEconomy({ gold: 250, lives: 20 });
  assert.equal(e.gold, 250);
  assert.equal(e.lives, 20);
});
test('花費足夠則扣款回 true', () => {
  const e = createEconomy({ gold: 100, lives: 20 });
  assert.equal(e.spend(60), true);
  assert.equal(e.gold, 40);
});
test('花費不足回 false 不扣款', () => {
  const e = createEconomy({ gold: 50, lives: 20 });
  assert.equal(e.spend(60), false);
  assert.equal(e.gold, 50);
});
test('殺怪賺賞金與分數', () => {
  const e = createEconomy({ gold: 0, lives: 20 });
  e.earn(8); e.addScore(10);
  assert.equal(e.gold, 8);
  assert.equal(e.score, 10);
});
test('漏怪扣命，歸零標記 dead', () => {
  const e = createEconomy({ gold: 0, lives: 1 });
  e.loseLife(1);
  assert.equal(e.lives, 0);
  assert.equal(e.isDead(), true);
});
test('tick 累計存活時間', () => {
  const e = createEconomy({ gold: 0, lives: 20 });
  e.tick(0.5); e.tick(0.5);
  assert.equal(e.elapsed, 1);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd last-stand && node --test tests/economy.test.js`
Expected: FAIL

- [ ] **Step 3: 寫實作**

`src/systems/economy.js`:
```js
export function createEconomy({ gold = 0, lives = 20 } = {}) {
  return {
    gold, lives, score: 0, elapsed: 0,
    spend(cost) {
      if (this.gold < cost) return false;
      this.gold -= cost; return true;
    },
    earn(amount) { this.gold += amount; },
    addScore(amount) { this.score += amount; },
    loseLife(n = 1) { this.lives = Math.max(0, this.lives - n); },
    isDead() { return this.lives <= 0; },
    tick(dt) { this.elapsed += dt; },
  };
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `cd last-stand && node --test tests/economy.test.js`
Expected: PASS（6 tests）

- [ ] **Step 5: Commit**

```bash
cd last-stand && git add src/systems/economy.js tests/economy.test.js && git commit -m "feat(economy): 金錢/命數/分數/計時"
```

---

## Task 4：鎖定系統（targeting）

**Files:**
- Create: `last-stand/src/systems/targeting.js`
- Test: `last-stand/tests/targeting.test.js`

- [ ] **Step 1: 寫失敗測試**

`tests/targeting.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectTarget } from '../src/systems/targeting.js';

const tower = { x: 0, y: 0, range: 100, canHitAir: false, priority: 'first' };
function enemy(o) {
  return { id: 1, x: 0, y: 0, hp: 10, armorType: 'light', seg: 0, alive: true, reachedEnd: false, ...o };
}

test('射程外不鎖定', () => {
  const t = selectTarget(tower, [enemy({ id: 1, x: 200, y: 0 })]);
  assert.equal(t, null);
});
test('不能打空時略過飛行', () => {
  const t = selectTarget(tower, [enemy({ id: 1, x: 50, y: 0, armorType: 'flying' })]);
  assert.equal(t, null);
});
test('first 選路徑最前（seg 大者）', () => {
  const t = selectTarget({ ...tower }, [
    enemy({ id: 1, x: 10, y: 0, seg: 0 }),
    enemy({ id: 2, x: 20, y: 0, seg: 2 }),
  ]);
  assert.equal(t.id, 2);
});
test('strong 選血量最高', () => {
  const t = selectTarget({ ...tower, priority: 'strong' }, [
    enemy({ id: 1, x: 10, y: 0, hp: 10 }),
    enemy({ id: 2, x: 20, y: 0, hp: 99 }),
  ]);
  assert.equal(t.id, 2);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd last-stand && node --test tests/targeting.test.js`
Expected: FAIL

- [ ] **Step 3: 寫實作**

`src/systems/targeting.js`:
```js
import { dist } from '../core/geometry.js';

export function inRange(tower, enemy) {
  return dist(tower.x, tower.y, enemy.x, enemy.y) <= tower.range;
}

export function selectTarget(tower, enemies) {
  const candidates = enemies.filter(e =>
    e.alive && !e.reachedEnd &&
    (tower.canHitAir || e.armorType !== 'flying') &&
    inRange(tower, e)
  );
  if (candidates.length === 0) return null;
  const priority = tower.priority || 'first';
  const score = {
    first: e => e.seg + (e.x + e.y) * 1e-6,   // 路徑最前
    last: e => -(e.seg + (e.x + e.y) * 1e-6),  // 路徑最後
    strong: e => e.hp,
    near: e => -dist(tower.x, tower.y, e.x, e.y),
  }[priority];
  return candidates.reduce((best, e) => (score(e) > score(best) ? e : best));
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `cd last-stand && node --test tests/targeting.test.js`
Expected: PASS（4 tests）

- [ ] **Step 5: Commit**

```bash
cd last-stand && git add src/systems/targeting.js tests/targeting.test.js && git commit -m "feat(targeting): 範圍查詢 + 鎖定優先序"
```

---

## Task 5：資料檔（balance / towers / enemies / map1）

**Files:**
- Create: `last-stand/src/data/balance.js`
- Create: `last-stand/src/data/towers.js`
- Create: `last-stand/src/data/enemies.js`
- Create: `last-stand/src/data/map1.js`

此任務為純資料，無單元測試（形狀於後續整合驗證）。

- [ ] **Step 1: balance.js**

```js
export const BALANCE = {
  startGold: 250,
  startLives: 20,
  sellRefund: 0.6,
  endless: {
    waveInterval: 16,   // 自動下一波的秒數
    spawnGap: 0.7,      // 同波怪間隔秒
    baseCount: 6,       // 第 1 波怪數
    countPerWave: 2,    // 每波 +2
    hpBase: 40,
    hpGrowth: 1.16,     // hp = hpBase * growth^(wave-1)
    speedBase: 42,      // px/s
    speedGrowthPer5: 1.08,
    bountyBase: 8,
    bossEvery: 5,
    bossHpMult: 8,
    bossBountyMult: 10,
  },
};
```

- [ ] **Step 2: towers.js（3 基礎塔，各 3 階）**

```js
// attackType: physical|siege|magic；level 0..2 對應三階
export const TOWERS = {
  elf_archer: {
    name: '精靈神射手', faction: 'elf', attackType: 'physical', canHitAir: true,
    color: '#63992e', splash: 0,
    levels: [
      { cost: 70,  damage: 14, range: 120, fireRate: 1.4 },
      { cost: 60,  damage: 26, range: 135, fireRate: 1.6 },
      { cost: 110, damage: 48, range: 150, fireRate: 1.9 },
    ],
  },
  dwarf_cannon: {
    name: '矮人蒸汽火砲', faction: 'dwarf', attackType: 'siege', canHitAir: false,
    color: '#b07a2f', splash: 42,
    levels: [
      { cost: 95,  damage: 26, range: 110, fireRate: 0.7 },
      { cost: 90,  damage: 46, range: 120, fireRate: 0.8 },
      { cost: 150, damage: 80, range: 130, fireRate: 0.9 },
    ],
  },
  mage_arcane: {
    name: '魔法師奧術塔', faction: 'mage', attackType: 'magic', canHitAir: true,
    color: '#7f77dd', splash: 0,
    levels: [
      { cost: 90,  damage: 20, range: 115, fireRate: 1.1 },
      { cost: 85,  damage: 36, range: 125, fireRate: 1.2 },
      { cost: 140, damage: 64, range: 140, fireRate: 1.4 },
    ],
  },
};
```

- [ ] **Step 3: enemies.js（不死族）**

```js
// armorType: light|heavy|magic|flying
export const ENEMIES = {
  skeleton: { name: '骷髏兵', armorType: 'light',  hpMult: 0.8, speedMult: 1.25, bountyMult: 0.8, radius: 11, color: '#dfe3e6' },
  zombie:   { name: '僵屍',   armorType: 'heavy',  hpMult: 1.8, speedMult: 0.7,  bountyMult: 1.3, radius: 14, color: '#6b8f5a' },
  banshee:  { name: '女妖',   armorType: 'flying', hpMult: 0.9, speedMult: 1.1,  bountyMult: 1.1, radius: 12, color: '#a9b7ff' },
  deathknight: { name: '死亡騎士', armorType: 'heavy', hpMult: 1.0, speedMult: 0.85, bountyMult: 1.0, radius: 18, color: '#8a2f3a', boss: true },
};
```

- [ ] **Step 4: map1.js（800×480，tile 40）**

```js
export const MAP1 = {
  width: 800, height: 480, tile: 40,
  spawn: { x: 0, y: 200 },
  base:  { x: 800, y: 120 },
  path: [
    { x: 0,   y: 200 }, { x: 240, y: 200 }, { x: 240, y: 380 },
    { x: 520, y: 380 }, { x: 520, y: 120 }, { x: 800, y: 120 },
  ],
  // 建塔格中心點（避開路徑）
  buildSlots: [
    { x: 120, y: 120 }, { x: 200, y: 300 }, { x: 320, y: 300 },
    { x: 360, y: 200 }, { x: 440, y: 300 }, { x: 440, y: 180 },
    { x: 600, y: 240 }, { x: 600, y: 360 }, { x: 680, y: 200 },
    { x: 360, y: 100 }, { x: 600, y: 60 },  { x: 200, y: 120 },
  ],
};
```

- [ ] **Step 5: Commit**

```bash
cd last-stand && git add src/data/ && git commit -m "feat(data): balance/towers/enemies/map1 資料檔"
```

---

## Task 6：無盡導演（endlessDirector）

**Files:**
- Create: `last-stand/src/systems/endlessDirector.js`
- Test: `last-stand/tests/endlessDirector.test.js`

導演職責：依波數產生「這波要生哪些怪」的清單，血量/移速隨波縮放，每 `bossEvery` 波加首領。它只回傳 enemy 規格陣列，不直接操作場景。

- [ ] **Step 1: 寫失敗測試**

`tests/endlessDirector.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWave } from '../src/systems/endlessDirector.js';

test('第 1 波怪數 = baseCount', () => {
  const wave = buildWave(1);
  assert.equal(wave.length, 6);
});
test('波數越高怪越多', () => {
  assert.equal(buildWave(3).length, 10);
});
test('血量隨波成長', () => {
  const w1 = buildWave(1)[0].hp;
  const w5 = buildWave(5)[0].hp;
  assert.ok(w5 > w1);
});
test('每 5 波含一隻 boss', () => {
  const wave = buildWave(5);
  assert.ok(wave.some(e => e.boss === true));
  assert.ok(!buildWave(4).some(e => e.boss === true));
});
test('每隻怪有必要欄位', () => {
  const e = buildWave(2)[0];
  for (const k of ['type', 'hp', 'maxHp', 'armorType', 'speed', 'bounty']) {
    assert.ok(e[k] !== undefined, `缺欄位 ${k}`);
  }
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd last-stand && node --test tests/endlessDirector.test.js`
Expected: FAIL

- [ ] **Step 3: 寫實作**

`src/systems/endlessDirector.js`:
```js
import { BALANCE } from '../data/balance.js';
import { ENEMIES } from '../data/enemies.js';

const E = BALANCE.endless;
const POOL = ['skeleton', 'zombie', 'banshee'];

function scaledStats(wave, typeKey) {
  const def = ENEMIES[typeKey];
  const hp = Math.round(E.hpBase * def.hpMult * Math.pow(E.hpGrowth, wave - 1));
  const speed = E.speedBase * def.speedMult * Math.pow(E.speedGrowthPer5, Math.floor((wave - 1) / 5));
  const bounty = Math.round(E.bountyBase * def.bountyMult * (1 + (wave - 1) * 0.05));
  return { hp, speed, bounty };
}

// 回傳這一波的 enemy 規格陣列（尚未含座標，spawn 時補）
export function buildWave(wave) {
  const count = E.baseCount + (wave - 1) * E.countPerWave;
  const list = [];
  for (let i = 0; i < count; i++) {
    const typeKey = POOL[(wave + i) % POOL.length];
    const s = scaledStats(wave, typeKey);
    list.push({
      type: typeKey, armorType: ENEMIES[typeKey].armorType,
      hp: s.hp, maxHp: s.hp, speed: s.speed, bounty: s.bounty, boss: false,
    });
  }
  if (wave % E.bossEvery === 0) {
    const s = scaledStats(wave, 'deathknight');
    list.push({
      type: 'deathknight', armorType: 'heavy',
      hp: s.hp * E.bossHpMult, maxHp: s.hp * E.bossHpMult,
      speed: s.speed, bounty: s.bounty * E.bossBountyMult, boss: true,
    });
  }
  return list;
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `cd last-stand && node --test tests/endlessDirector.test.js`
Expected: PASS（5 tests）

- [ ] **Step 5: Commit**

```bash
cd last-stand && git add src/systems/endlessDirector.js tests/endlessDirector.test.js && git commit -m "feat(endless): 程式生怪 + 難度縮放"
```

---

## Task 7：存檔服務（saveService）

**Files:**
- Create: `last-stand/src/services/saveService.js`
- Test: `last-stand/tests/saveService.test.js`

用依賴注入 storage（預設 `globalThis.localStorage`），測試時注入假物件。

- [ ] **Step 1: 寫失敗測試**

`tests/saveService.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSaveService } from '../src/services/saveService.js';

function fakeStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test('無記錄時 best 為 null', () => {
  const s = createSaveService(fakeStorage());
  assert.equal(s.getBest(), null);
});
test('提交成績存最佳', () => {
  const s = createSaveService(fakeStorage());
  s.submit({ wave: 8, time: 120, score: 500 });
  assert.equal(s.getBest().wave, 8);
});
test('只有更好（波數高）才覆蓋', () => {
  const s = createSaveService(fakeStorage());
  s.submit({ wave: 8, time: 120, score: 500 });
  s.submit({ wave: 5, time: 999, score: 999 });
  assert.equal(s.getBest().wave, 8);
  s.submit({ wave: 10, time: 60, score: 200 });
  assert.equal(s.getBest().wave, 10);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd last-stand && node --test tests/saveService.test.js`
Expected: FAIL

- [ ] **Step 3: 寫實作**

`src/services/saveService.js`:
```js
const KEY = 'laststand.endless.best';

export function createSaveService(storage = globalThis.localStorage) {
  return {
    getBest() {
      const raw = storage ? storage.getItem(KEY) : null;
      return raw ? JSON.parse(raw) : null;
    },
    submit(record) {
      const best = this.getBest();
      if (!best || record.wave > best.wave ||
          (record.wave === best.wave && record.score > best.score)) {
        storage.setItem(KEY, JSON.stringify(record));
        return true;
      }
      return false;
    },
  };
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `cd last-stand && node --test tests/saveService.test.js`
Expected: PASS（3 tests）

- [ ] **Step 5: 跑全部測試 + Commit**

Run: `cd last-stand && npm test`
Expected: 全綠（combat/pathing/economy/targeting/endless/save）
```bash
cd last-stand && git add src/services/saveService.js tests/saveService.test.js && git commit -m "feat(save): localStorage 最佳記錄（可注入 storage）"
```

---

## Task 8：實體 — enemy / tower / projectile

**Files:**
- Create: `last-stand/src/entities/enemy.js`
- Create: `last-stand/src/entities/tower.js`
- Create: `last-stand/src/entities/projectile.js`

這些操作可變狀態、與場景耦合，於瀏覽器整合驗證；提供完整程式。

- [ ] **Step 1: enemy.js**

```js
import { advancePath } from '../systems/pathing.js';
import { ENEMIES } from '../data/enemies.js';

let nextId = 1;

export function spawnEnemy(spec, map) {
  const def = ENEMIES[spec.type];
  return {
    id: nextId++, type: spec.type,
    x: map.spawn.x, y: map.spawn.y, seg: 0,
    hp: spec.hp, maxHp: spec.maxHp, armorType: spec.armorType,
    speed: spec.speed, bounty: spec.bounty, boss: spec.boss,
    radius: def.radius, color: def.color,
    alive: true, reachedEnd: false,
    slowUntil: 0, slowFactor: 1, dots: [], hitFlash: 0,
  };
}

export function updateEnemy(e, map, dt, now) {
  if (!e.alive) return;
  // DoT
  for (const d of e.dots) {
    if (now < d.until) e.hp -= d.dps * dt;
  }
  e.dots = e.dots.filter(d => now < d.until);
  if (e.hp <= 0) { e.alive = false; return; }
  // 減速
  const factor = now < e.slowUntil ? e.slowFactor : 1;
  if (e.hitFlash > 0) e.hitFlash -= dt;
  const moved = advancePath(map.path, e.seg, e.x, e.y, e.speed * factor * dt);
  e.x = moved.x; e.y = moved.y; e.seg = moved.seg;
  if (moved.done) { e.reachedEnd = true; e.alive = false; }
}
```

- [ ] **Step 2: tower.js**

```js
import { TOWERS } from '../data/towers.js';
import { selectTarget } from '../systems/targeting.js';
import { spawnProjectile } from './projectile.js';

let nextId = 1;

export function towerStats(type, level) {
  return TOWERS[type].levels[level];
}

export function buildTower(type, slot) {
  const def = TOWERS[type];
  const s = def.levels[0];
  return {
    id: nextId++, type, slot, x: slot.x, y: slot.y,
    attackType: def.attackType, canHitAir: def.canHitAir, splash: def.splash,
    color: def.color, level: 0,
    range: s.range, damage: s.damage, fireRate: s.fireRate,
    cooldown: 0, priority: 'first',
  };
}

export function upgradeTower(t) {
  const def = TOWERS[t.type];
  if (t.level >= def.levels.length - 1) return false;
  t.level += 1;
  const s = def.levels[t.level];
  t.range = s.range; t.damage = s.damage; t.fireRate = s.fireRate;
  return true;
}

export function upgradeCost(t) {
  const def = TOWERS[t.type];
  return t.level >= def.levels.length - 1 ? null : def.levels[t.level + 1].cost;
}

export function updateTower(t, enemies, projectiles, dt) {
  t.cooldown -= dt;
  if (t.cooldown > 0) return;
  const target = selectTarget(t, enemies);
  if (!target) return;
  projectiles.push(spawnProjectile(t, target));
  t.cooldown = 1 / t.fireRate;
}
```

- [ ] **Step 3: projectile.js**

```js
import { dist } from '../core/geometry.js';
import { computeDamage } from '../systems/combat.js';

let nextId = 1;

export function spawnProjectile(tower, target) {
  return {
    id: nextId++, x: tower.x, y: tower.y, targetId: target.id,
    speed: 420, damage: tower.damage, attackType: tower.attackType,
    splash: tower.splash, color: tower.color, alive: true,
  };
}

// 命中回傳爆點與受擊清單，傷害由呼叫端套用（含粒子）
export function updateProjectile(p, enemies, dt) {
  const target = enemies.find(e => e.id === p.targetId && e.alive);
  if (!target) { p.alive = false; return null; }
  const d = dist(p.x, p.y, target.x, target.y);
  const move = p.speed * dt;
  if (d <= move) {
    p.alive = false;
    const hits = p.splash > 0
      ? enemies.filter(e => e.alive && dist(target.x, target.y, e.x, e.y) <= p.splash)
      : [target];
    for (const e of hits) {
      e.hp -= computeDamage(p.damage, p.attackType, e.armorType);
      e.hitFlash = 0.12;
    }
    return { x: target.x, y: target.y, hits };
  }
  p.x += (target.x - p.x) / d * move;
  p.y += (target.y - p.y) / d * move;
  return null;
}
```

- [ ] **Step 4: Commit**

```bash
cd last-stand && git add src/entities/ && git commit -m "feat(entities): enemy/tower/projectile 邏輯"
```

---

## Task 9：中央狀態 + 粒子系統

**Files:**
- Create: `last-stand/src/state/gameState.js`
- Create: `last-stand/src/render/particles.js`

- [ ] **Step 1: gameState.js**

```js
import { createEconomy } from '../systems/economy.js';
import { BALANCE } from '../data/balance.js';

export function createGameState(map) {
  return {
    map,
    economy: createEconomy({ gold: BALANCE.startGold, lives: BALANCE.startLives }),
    enemies: [], towers: [], projectiles: [],
    occupiedSlots: new Set(),  // slot index 已建塔
    wave: 0, waveTimer: 0, spawnQueue: [], spawnTimer: 0,
    selectedTowerType: null, selectedTower: null,
    now: 0, over: false, started: false,
  };
}
```

- [ ] **Step 2: particles.js（物件池）**

```js
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
```

- [ ] **Step 3: Commit**

```bash
cd last-stand && git add src/state/gameState.js src/render/particles.js && git commit -m "feat(state): 中央狀態 + 粒子物件池"
```

---

## Task 10：分層渲染器（renderer）

**Files:**
- Create: `last-stand/src/render/renderer.js`

- [ ] **Step 1: renderer.js**

```js
import { drawParticles } from './particles.js';
import { TOWERS } from '../data/towers.js';

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

function drawSlots(ctx, state) {
  state.map.buildSlots.forEach((s, i) => {
    if (state.occupiedSlots.has(i)) return;
    ctx.fillStyle = state.selectedTowerType ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(s.x, s.y, 16, 0, Math.PI * 2); ctx.fill();
  });
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
}

function drawEnemy(ctx, e) {
  ctx.fillStyle = e.hitFlash > 0 ? '#fff' : e.color;
  ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
  if (e.armorType === 'flying') {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 4, 0, Math.PI * 2); ctx.stroke();
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
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2); ctx.stroke();
}

export function render(ctx, state, mouse) {
  drawTerrain(ctx, state.map);
  drawSlots(ctx, state);
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
}
```

- [ ] **Step 2: Commit**

```bash
cd last-stand && git add src/render/renderer.js && git commit -m "feat(render): 分層 Canvas 渲染 + 血條/射程預覽"
```

---

## Task 11：遊戲迴圈 + DOM HUD + 建造選單

**Files:**
- Create: `last-stand/src/core/loop.js`
- Create: `last-stand/src/ui/hud.js`
- Create: `last-stand/src/ui/buildMenu.js`

- [ ] **Step 1: loop.js（固定時間步）**

```js
export function createLoop({ update, render, step = 1 / 60 }) {
  let acc = 0, last = 0, raf = 0, running = false;
  function frame(t) {
    if (!running) return;
    const dt = last ? (t - last) / 1000 : 0;
    last = t;
    acc += Math.min(dt, 0.25);
    while (acc >= step) { update(step); acc -= step; }
    render();
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { running = true; last = 0; raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
  };
}
```

- [ ] **Step 2: hud.js（更新頂部數值 + 結算畫面）**

```js
export function updateHud(state) {
  document.getElementById('hud-gold').textContent = Math.floor(state.economy.gold);
  document.getElementById('hud-lives').textContent = state.economy.lives;
  document.getElementById('hud-wave').textContent = state.wave;
  document.getElementById('hud-score').textContent = state.economy.score;
  document.getElementById('hud-time').textContent = Math.floor(state.economy.elapsed) + 's';
}

export function showGameOver(state, best, onRestart) {
  const el = document.getElementById('overlay');
  el.innerHTML = `
    <div class="panel">
      <h1>陣亡！</h1>
      <p>你撐到第 <b>${state.wave}</b> 波 · ${Math.floor(state.economy.elapsed)} 秒 · ${state.economy.score} 分</p>
      <p class="best">本機最佳：第 ${best ? best.wave : state.wave} 波</p>
      <button id="restart">再來一局</button>
    </div>`;
  el.style.display = 'flex';
  document.getElementById('restart').onclick = () => { el.style.display = 'none'; onRestart(); };
}
```

- [ ] **Step 3: buildMenu.js（建造列 + 升級/賣出面板）**

```js
import { TOWERS } from '../data/towers.js';
import { upgradeTower, upgradeCost } from '../entities/tower.js';
import { BALANCE } from '../data/balance.js';

export function initBuildMenu(state) {
  const bar = document.getElementById('buildbar');
  bar.innerHTML = '';
  for (const [type, def] of Object.entries(TOWERS)) {
    const b = document.createElement('button');
    b.className = 'build-btn';
    b.innerHTML = `<span style="color:${def.color}">●</span> ${def.name}<br><small>${def.levels[0].cost}g</small>`;
    b.onclick = () => {
      state.selectedTowerType = state.selectedTowerType === type ? null : type;
      state.selectedTower = null;
      renderSelection(bar, state);
    };
    b.dataset.type = type;
    bar.appendChild(b);
  }
}

function renderSelection(bar, state) {
  [...bar.children].forEach(b =>
    b.classList.toggle('active', b.dataset.type === state.selectedTowerType));
}

export function showTowerPanel(state) {
  const panel = document.getElementById('towerpanel');
  const t = state.selectedTower;
  if (!t) { panel.style.display = 'none'; return; }
  const cost = upgradeCost(t);
  panel.style.display = 'block';
  panel.innerHTML = `
    <b>${TOWERS[t.type].name}</b> Lv.${t.level + 1}
    <div>傷害 ${t.damage} · 射程 ${t.range}</div>
    ${cost != null ? `<button id="upg">升級 (${cost}g)</button>` : '<span>已滿級</span>'}
    <button id="sell">賣出 (+${Math.floor(TOWERS[t.type].levels[t.level].cost * BALANCE.sellRefund)}g)</button>`;
  if (cost != null) document.getElementById('upg').onclick = () => {
    if (state.economy.spend(cost)) { upgradeTower(t); showTowerPanel(state); }
  };
  document.getElementById('sell').onclick = () => {
    state.economy.earn(Math.floor(TOWERS[t.type].levels[t.level].cost * BALANCE.sellRefund));
    state.towers = state.towers.filter(x => x !== t);
    state.occupiedSlots.delete(t.slotIndex);
    state.selectedTower = null; panel.style.display = 'none';
  };
}
```

- [ ] **Step 4: Commit**

```bash
cd last-stand && git add src/core/loop.js src/ui/ && git commit -m "feat(ui): 迴圈 + HUD + 建造選單/升級面板"
```

---

## Task 12：index.html + main.js 串接（瀏覽器可玩）

**Files:**
- Create: `last-stand/index.html`
- Create: `last-stand/src/main.js`

- [ ] **Step 1: index.html**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>誰撐最久 · Last Stand</title>
<style>
  body { margin:0; background:#1c2230; color:#eee; font-family:system-ui,sans-serif;
         display:flex; flex-direction:column; align-items:center; }
  #topbar { display:flex; gap:18px; padding:10px; font-size:15px; }
  #topbar b { color:#ffe08a; }
  #stage { position:relative; }
  canvas { display:block; background:#cfe3c4; border-radius:8px; cursor:pointer; }
  #buildbar { display:flex; gap:8px; padding:10px; }
  .build-btn { background:#2b3346; color:#eee; border:1px solid #3d4760; border-radius:8px;
               padding:6px 10px; cursor:pointer; font-size:13px; text-align:center; }
  .build-btn.active { border-color:#ffe08a; background:#3a3320; }
  #towerpanel { position:absolute; top:8px; right:8px; background:rgba(20,24,34,.92);
                padding:10px; border-radius:8px; font-size:13px; display:none; }
  #towerpanel button { display:block; margin-top:6px; width:100%; cursor:pointer; }
  #overlay { position:absolute; inset:0; background:rgba(0,0,0,.6); display:none;
             align-items:center; justify-content:center; }
  .panel { background:#222a3a; padding:30px 40px; border-radius:12px; text-align:center; }
  .panel button { margin-top:14px; padding:10px 24px; font-size:16px; cursor:pointer;
                  background:#7f77dd; color:#fff; border:none; border-radius:8px; }
  .best { color:#ffe08a; }
</style>
</head>
<body>
  <div id="topbar">
    <span>💰<b id="hud-gold">0</b></span>
    <span>❤️<b id="hud-lives">0</b></span>
    <span>🌊 第<b id="hud-wave">0</b>波</span>
    <span>⭐<b id="hud-score">0</b></span>
    <span>⏱️<b id="hud-time">0s</b></span>
  </div>
  <div id="stage">
    <canvas id="game" width="800" height="480"></canvas>
    <div id="towerpanel"></div>
    <div id="overlay"></div>
  </div>
  <div id="buildbar"></div>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: main.js（串接全部）**

```js
import { MAP1 } from './data/map1.js';
import { BALANCE } from './data/balance.js';
import { createGameState } from './state/gameState.js';
import { createLoop } from './core/loop.js';
import { render } from './render/renderer.js';
import { updateParticles, burst } from './render/particles.js';
import { buildWave } from './systems/endlessDirector.js';
import { spawnEnemy, updateEnemy } from './entities/enemy.js';
import { buildTower, updateTower } from './entities/tower.js';
import { updateProjectile } from './entities/projectile.js';
import { createSaveService } from './services/saveService.js';
import { updateHud, showGameOver } from './ui/hud.js';
import { initBuildMenu, showTowerPanel } from './ui/buildMenu.js';
import { dist } from './core/geometry.js';
import { TOWERS } from './data/towers.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const save = createSaveService();
const mouse = { x: 0, y: 0 };
let state, loop;

function startWave(s) {
  s.wave += 1;
  s.spawnQueue = buildWave(s.wave);
  s.spawnTimer = 0;
  s.waveTimer = BALANCE.endless.waveInterval;
}

function update(dt) {
  const s = state;
  if (s.over) return;
  s.now += dt;
  s.economy.tick(dt);

  // 生怪排程
  s.waveTimer -= dt;
  if (s.spawnQueue.length === 0 && s.enemies.every(e => !e.alive) && s.waveTimer <= 0) startWave(s);
  if (s.spawnQueue.length > 0) {
    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) {
      s.enemies.push(spawnEnemy(s.spawnQueue.shift(), s.map));
      s.spawnTimer = BALANCE.endless.spawnGap;
    }
  }
  if (s.waveTimer <= 0 && s.spawnQueue.length === 0) startWave(s);

  for (const t of s.towers) updateTower(t, s.enemies, s.projectiles, dt);
  for (let i = s.projectiles.length - 1; i >= 0; i--) {
    const p = s.projectiles[i];
    const hit = updateProjectile(p, s.enemies, dt);
    if (hit) burst(hit.x, hit.y, p.color, 7);
    if (!p.alive) s.projectiles.splice(i, 1);
  }
  for (const e of s.enemies) {
    const wasAlive = e.alive;
    updateEnemy(e, s.map, dt, s.now);
    if (wasAlive && !e.alive) {
      if (e.reachedEnd) { s.economy.loseLife(1); }
      else { s.economy.earn(e.bounty); s.economy.addScore(e.boss ? 100 : 10); burst(e.x, e.y, e.color, 12); }
    }
  }
  s.enemies = s.enemies.filter(e => e.alive || e.hitFlash > 0);
  updateParticles(dt);

  if (s.economy.isDead() && !s.over) {
    s.over = true;
    const record = { wave: s.wave, time: Math.floor(s.economy.elapsed), score: s.economy.score };
    save.submit(record);
    showGameOver(s, save.getBest(), restart);
  }
}

function draw() {
  render(ctx, state, mouse);
  updateHud(state);
}

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
});

canvas.addEventListener('click', () => {
  const s = state;
  // 點到已有塔 → 選取
  const hitTower = s.towers.find(t => dist(t.x, t.y, mouse.x, mouse.y) < 16);
  if (hitTower && !s.selectedTowerType) {
    s.selectedTower = hitTower; showTowerPanel(s); return;
  }
  // 建塔
  if (s.selectedTowerType) {
    let idx = -1, best = 24;
    s.map.buildSlots.forEach((slot, i) => {
      const d = dist(slot.x, slot.y, mouse.x, mouse.y);
      if (d < best && !s.occupiedSlots.has(i)) { best = d; idx = i; }
    });
    if (idx >= 0) {
      const cost = TOWERS[s.selectedTowerType].levels[0].cost;
      if (s.economy.spend(cost)) {
        const t = buildTower(s.selectedTowerType, s.map.buildSlots[idx]);
        t.slotIndex = idx;
        s.towers.push(t);
        s.occupiedSlots.add(idx);
      }
    }
    return;
  }
  s.selectedTower = null; showTowerPanel(s);
});

function restart() {
  state = createGameState(MAP1);
  initBuildMenu(state);
  startWave(state);
}

function boot() {
  state = createGameState(MAP1);
  initBuildMenu(state);
  startWave(state);
  loop = createLoop({ update, render: draw });
  loop.start();
}
boot();
```

- [ ] **Step 3: 瀏覽器實測**

Run:
```bash
cd last-stand && python -m http.server 8000
```
開 `http://localhost:8000`，驗收清單：
- [ ] 地圖、路徑、建塔格顯示正常
- [ ] 點建造列選塔 → 滑鼠出現射程預覽 → 點建塔格成功蓋塔、扣金
- [ ] 怪沿路徑走、塔自動開火、投射物命中有粒子、血條遞減
- [ ] 殺怪得金加分、漏怪扣命
- [ ] 一波波自動來、怪越來越強（血量/數量上升）、第 5 波出 boss
- [ ] 點已建塔出現升級/賣出面板，升級生效
- [ ] 命歸零跳結算、顯示波數/時間/分數與本機最佳、再來一局可重玩

- [ ] **Step 4: Commit**

```bash
cd last-stand && git add index.html src/main.js && git commit -m "feat(game): index.html + main 串接，無盡生存可玩切片完成"
```

---

## Task 13：打擊感與收尾微調（juice）

**Files:**
- Modify: `last-stand/src/render/renderer.js`
- Modify: `last-stand/src/main.js`

依實測手感調整以下其一以上（每項調完於瀏覽器確認、各自 commit）：

- [ ] **Step 1: boss 視覺強化** — 在 `drawEnemy` 為 `e.boss` 加描邊光環（較大半徑、金色 stroke）。
- [ ] **Step 2: 開火後座** — 命中時 `burst` 顆數依 splash 放大；boss 死亡 `burst(..., 24)`。
- [ ] **Step 3: 下一波提示** — `main.js` 在 `waveTimer < 3` 時於 HUD 顯示「下一波 3..2..1」。
- [ ] **Step 4: 數值平衡微調** — 依實測調 `balance.js` 的 `hpGrowth` / 塔造價，使第 1 波輕鬆、約第 10 波開始吃緊。
- [ ] **Step 5: 全測試 + Commit**

```bash
cd last-stand && npm test && git add -A && git commit -m "polish: 打擊感與平衡微調"
```

---

## 完成定義（Phase 1 Done）

- `npm test` 全綠（combat/pathing/economy/targeting/endless/save）。
- 瀏覽器開啟即玩：可蓋 3 種塔、克制表生效、無盡波次越來越強、命歸零結算並存本機最佳、可重開。
- 程式碼按模組切分、資料驅動，為 Phase 2（補滿 18 塔/魔族/主動技）預留擴充點。

---

## Self-Review 紀錄

- **Spec 覆蓋**：無盡模式(Task 6,12)、克制表(Task 1)、3 基礎塔含升級(Task 5,8,11)、不死族怪(Task 5,6)、命數/計時/分數(Task 3)、本機最佳記錄(Task 7,12)、分層渲染+粒子(Task 9,10)、固定時間步迴圈(Task 11)。Phase 1 範圍內無遺漏。
- **延後項（非 Phase 1，已於 spec 標記）**：龍/神傳奇塔、魔族、主動技、轉蛋/圖鑑/每日券、戰役關卡、多地圖、全球榜後端 → Phase 2-4。
- **型別一致**：`armorType`/`attackType` 字串全程一致；`buildTower` 設 `slotIndex`，`main.js` 與 `buildMenu.js` 賣出皆用 `slotIndex` 釋放 `occupiedSlots`；`selectTarget` 欄位與 enemy 形狀對齊。
