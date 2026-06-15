# Phase 2c：多路徑引擎 + 第二張地圖 + 地圖選擇 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 把引擎從單一路徑一般化成**多路徑**(`map.paths` 陣列)，MAP1 維持原樣可玩；新增 MAP2(雙傳送門匯流的分叉路口)與地圖選擇器，讓玩家切換戰場。

**Architecture:** `map.path/spawn` → `map.paths`(waypoint 陣列的陣列)，每路起點即傳送門。grid 的 pathDistance/nearestPointOnPath/pathSlots 改吃「路徑陣列」(對所有路取最小/聯集)。敵人帶 `pathIndex`，spawn 輪流分派、updateEnemy 走自己那條路。渲染畫所有路。地圖以 registry 管理 + topbar 選擇器，切換即重開。

**Tech Stack:** 同前。**這是改既有結構的重構——MAP1 必須維持完全一樣的可玩性(回歸)。**

---

## Task 1：grid 路徑函式一般化為「路徑陣列」+ MAP1 遷移

**Files:** Modify `src/systems/grid.js`, `src/data/map1.js`, `tests/grid.test.js`

- [ ] **Step 1: 更新 grid.test.js（改傳路徑陣列）**
把三個函式的測試改成傳 `paths`(陣列的陣列)：
```js
test('pathDistance 走道上接近0', () => {
  assert.ok(pathDistance(100, 100, [map.path]) < 1);
});
test('nearestPointOnPath 回路徑上最近點', () => {
  const p = nearestPointOnPath(100, 40, [[{ x: 0, y: 0 }, { x: 200, y: 0 }]]);
  assert.equal(Math.round(p.x), 100); assert.equal(Math.round(p.y), 0);
});
test('pathSlots 回射程內的路徑取樣點', () => {
  const slots = pathSlots({ x: 50, y: 0 }, 60, [[{ x: 0, y: 0 }, { x: 200, y: 0 }]], 20);
  assert.ok(slots.length >= 2);
  assert.ok(slots.every(s => Math.hypot(s.x - 50, s.y - 0) <= 60));
});
```
（`map` 物件保留 `path` 供測試包成 `[map.path]`；isBuildable/computeBuildableCells 的測試改用含 `paths` 的 map——見下。）
把測試頂端 `const map = { ..., path:[...] }` 改為同時提供 `paths: [ [...] ]`：
```js
const line = [{ x: 0, y: 100 }, { x: 200, y: 100 }];
const map = { width: 200, height: 200, tile: 40, path: line, paths: [line] };
```

- [ ] **Step 2: 跑測試確認失敗** `cd last-stand && node --test tests/grid.test.js`

- [ ] **Step 3: 改 grid.js**（三函式吃 `paths`；isBuildable/computeBuildableCells 用 `map.paths`）
```js
export function nearestPointOnPath(x, y, paths) {
  let best = null, bestD = Infinity;
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const ax = path[i].x, ay = path[i].y, bx = path[i + 1].x, by = path[i + 1].y;
      const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
      let t = len2 ? ((x - ax) * dx + (y - ay) * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const px = ax + dx * t, py = ay + dy * t;
      const d = dist(x, y, px, py);
      if (d < bestD) { bestD = d; best = { x: px, y: py }; }
    }
  }
  return best || { x: paths[0][0].x, y: paths[0][0].y };
}

export function pathDistance(x, y, paths) {
  let min = Infinity;
  for (const path of paths)
    for (let i = 0; i < path.length - 1; i++) {
      const d = pointSegDist(x, y, path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
      if (d < min) min = d;
    }
  return min;
}

export function isBuildable(col, row, map) {
  const c = cellCenter(col, row, map.tile);
  if (c.x < 0 || c.y < 0 || c.x > map.width || c.y > map.height) return false;
  return pathDistance(c.x, c.y, map.paths) > BLOCK_RADIUS;
}

export function pathSlots(center, range, paths, spacing) {
  const slots = [];
  for (const path of paths)
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
（cellOf/cellKey/cellCenter/pointSegDist/computeBuildableCells 不變；computeBuildableCells 仍呼叫 isBuildable，已改用 map.paths。）

- [ ] **Step 4: 遷移 `src/data/map1.js` 為 paths 形式**
```js
export const MAP1 = {
  width: 800, height: 480, tile: 40,
  base: { x: 800, y: 120 },
  paths: [
    [
      { x: 0, y: 200 }, { x: 240, y: 200 }, { x: 240, y: 380 },
      { x: 520, y: 380 }, { x: 520, y: 120 }, { x: 800, y: 120 },
    ],
  ],
  // 建造採網格制：除走道外任一格皆可蓋（見 systems/grid.js）
};
```

- [ ] **Step 5: 跑測試確認通過** `node --test tests/grid.test.js`；`npm test` 全綠

- [ ] **Step 6: Commit** `git add -A && git commit -m "refactor(map): path 函式一般化為路徑陣列 + MAP1 遷移 paths"`

---

## Task 2：敵人帶 pathIndex + 多路徑生怪/移動 + 渲染多路

**Files:** Modify `src/entities/enemy.js`, `src/state/gameState.js`, `src/main.js`, `src/render/renderer.js`

- [ ] **Step 1: enemy.js — spawn 帶 pathIndex、update 走自己的路**
`spawnEnemy(spec, map, pathIndex = 0)`：
```js
export function spawnEnemy(spec, map, pathIndex = 0) {
  const def = ENEMIES[spec.type];
  const path = map.paths[pathIndex];
  return {
    id: nextId++, type: spec.type,
    x: path[0].x, y: path[0].y, seg: 0, pathIndex,
    hp: spec.hp, maxHp: spec.maxHp, armorType: spec.armorType,
    speed: spec.speed, bounty: spec.bounty, boss: spec.boss,
    radius: def.radius, color: def.color,
    alive: true, reachedEnd: false,
    slowUntil: 0, slowFactor: 1, dots: [], hitFlash: 0,
    blockedBy: null, atkCd: 0, dmg: def.dmg, atk: def.atk,
  };
}
```
`updateEnemy` 內 `advancePath(map.path, ...)` 改為 `advancePath(map.paths[e.pathIndex], ...)`。

- [ ] **Step 2: gameState.js — 加 spawnCount**
return 物件加 `spawnCount: 0,`。

- [ ] **Step 3: main.js — 生怪輪流分派路徑**
生怪那段：
```js
    if (s.spawnTimer <= 0) {
      const pi = s.spawnCount % s.map.paths.length;
      s.enemies.push(spawnEnemy(s.spawnQueue.shift(), s.map, pi));
      s.spawnCount++;
      s.spawnTimer = BALANCE.endless.spawnGap;
    }
```
barracks rally 與 mine slots 改用 `s.map.paths`：
`if (t.kind === 'barracks') t.rally = nearestPointOnPath(t.x, t.y, s.map.paths);`
`if (t.kind === 'mine') t.mineSlots = pathSlots({ x: t.x, y: t.y }, t.range, s.map.paths, 26);`

- [ ] **Step 4: buildMenu.js refreshMineSlots 改 paths**
`t.mineSlots = pathSlots({ x: t.x, y: t.y }, t.range, state.map.paths, 26);`

- [ ] **Step 5: renderer.js — 畫所有路徑**
`drawTerrain` 內把單路畫法抽成 helper 並對每條路畫：
```js
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
```

- [ ] **Step 6: 驗證** `npm test` 全綠；`node --check` 改動檔。控制器回歸實測 MAP1 與原本一樣可玩。

- [ ] **Step 7: Commit** `git add -A && git commit -m "feat(map): 敵人多路徑(pathIndex)生怪/移動 + 渲染多路"`

---

## Task 3：MAP2(雙傳送門匯流) + 地圖 registry + 選擇器

**Files:** Create `src/data/map2.js`; Modify `index.html`, `src/main.js`

- [ ] **Step 1: map2.js**（兩個傳送門匯流到中線出右）
```js
export const MAP2 = {
  width: 800, height: 480, tile: 40,
  base: { x: 800, y: 240 },
  paths: [
    [ { x: 0, y: 120 }, { x: 260, y: 120 }, { x: 260, y: 240 }, { x: 800, y: 240 } ],
    [ { x: 0, y: 360 }, { x: 260, y: 360 }, { x: 260, y: 240 }, { x: 800, y: 240 } ],
  ],
};
```

- [ ] **Step 2: index.html — topbar 加地圖選擇容器**
在 topbar 內 time span 之後加：`<span id="mapbar"></span>`，並補 CSS：
```css
  #mapbar button { margin-left:6px; font-size:12px; padding:2px 8px; cursor:pointer;
                   background:#2b3346; color:#eee; border:1px solid #3d4760; border-radius:6px; }
  #mapbar button.active { border-color:#ffe08a; }
```

- [ ] **Step 3: main.js — 地圖 registry + 選擇器 + 參數化 boot/restart**
頂部 import：`import { MAP2 } from './data/map2.js';`
新增 registry 與目前地圖：
```js
const MAPS = [ { name: '森林小徑', map: MAP1 }, { name: '雙叉路口', map: MAP2 } ];
let currentMap = MAP1;
```
`restart()` 與 `boot()` 內所有 `createGameState(MAP1)` 改 `createGameState(currentMap)`。
新增初始化選擇器：
```js
function initMapPicker() {
  const bar = document.getElementById('mapbar');
  bar.innerHTML = '🗺️';
  MAPS.forEach(m => {
    const b = document.createElement('button');
    b.textContent = m.name;
    b.classList.toggle('active', m.map === currentMap);
    b.onclick = () => { currentMap = m.map; restart(); initMapPicker(); };
    bar.appendChild(b);
  });
}
```
`boot()` 內 `loop.start();` 之前呼叫 `initMapPicker();`；`restart()` 末端也呼叫 `initMapPicker();`（保持 active 標示）。

- [ ] **Step 4: 驗證** `npm test` 全綠；`node --check src/main.js src/data/map2.js`；控制器實測：切到「雙叉路口」→ 出現兩條路、兩個傳送門各生怪匯流、建造/兵營/地雷在新地圖正常；切回「森林小徑」正常。

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(map): MAP2 雙叉路口 + 地圖選擇器"`

---

## 完成定義（Phase 2c Done）
- 引擎支援多路徑；MAP1 維持原可玩性(回歸通過)。
- MAP2 雙傳送門匯流可玩、可從 topbar 切換地圖。
- grid 函式一般化有測試覆蓋。全測試綠、兩地圖瀏覽器實測通過。

## Self-Review
- `map.paths` 取代 `map.path/spawn`；所有 path 消費者(grid/enemy/renderer/main/buildMenu)同步改吃 paths。
- 敵人 pathIndex 決定走哪條；spawnCount 輪流分派；advancePath 仍單路(用 paths[pathIndex])。
- buildable/nearest/slots 對所有路運算(min/聯集)，建塔避開所有走道、兵營/地雷對應最近路。
- 地圖切換 = 換 currentMap 重開；registry 可無限擴充地圖。
- 回歸重點：MAP1 遷移後 waypoints 數值不變，玩法應完全一致。
