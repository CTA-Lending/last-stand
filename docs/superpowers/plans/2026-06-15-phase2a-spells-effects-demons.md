# Phase 2a：主動技 + 減速/毒塔 + 魔族 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 在已可玩的無盡生存切片上，加入兩個主動技（火雨/寒冰術）、兩座啟用減速/持續傷害(DoT)系統的新塔（纏繞德魯伊、燃燒投石），以及一整批魔族敵人混入無盡波次，讓策略與爽度大升級。

**Architecture:** 沿用 Phase 1 的資料驅動 + 模組分層。新增純邏輯模組 `systems/effects.js`（套用減速/DoT，TDD）與 `systems/spells.js`（主動技冷卻與施放，TDD）。塔資料新增 `effect` 欄位，投射物命中時套用。敵人資料新增魔族，無盡導演交替生不死/魔族與對應首領。主動技 UI 用 DOM 按鈕 + 火雨的點地施放模式。

**Tech Stack:** 同 Phase 1（Canvas 2D、原生 JS ESM、node --test）。

---

## 既有可複用（不要重寫）
- `src/systems/combat.js` `computeDamage(amount, attackType, armorType)`
- `src/entities/enemy.js`：enemy 形狀已含 `slowUntil, slowFactor, dots, hitFlash`；`updateEnemy` 已處理 DoT 與減速（`factor = now < e.slowUntil ? e.slowFactor : 1`），**故只要有人寫入這些欄位就會生效**。
- `src/entities/projectile.js` `spawnProjectile(tower, target)` / `updateProjectile(p, enemies, dt)`（目前只做直接傷害）
- `src/entities/tower.js` `buildTower/updateTower`
- `src/systems/endlessDirector.js` `buildWave(wave)`、`POOL`、`scaledStats`
- `src/data/{towers,enemies,balance}.js`
- `src/main.js` 主迴圈、`src/render/renderer.js`、`src/render/particles.js`、`src/ui/buildMenu.js`

---

## 檔案異動總覽
```
新增 src/systems/effects.js      # applyEffect 套用減速/DoT（純函式，TDD）
新增 src/systems/spells.js       # 主動技定義 + 冷卻/施放邏輯（TDD）
新增 src/ui/spellBar.js          # 主動技 DOM 按鈕 + 火雨點地模式
新增 tests/effects.test.js
新增 tests/spells.test.js
改   src/data/towers.js          # +纏繞德魯伊(slow) +燃燒投石(siege AoE+burn DoT)
改   src/data/enemies.js         # +魔族 imp/succubus/infernal/warlock/demonlord
改   src/data/balance.js         # 主動技參數 + 魔族波次參數
改   src/systems/endlessDirector.js  # 交替不死/魔族 + 對應首領
改   src/entities/projectile.js  # 命中時套用 tower.effect（需 now）
改   src/entities/tower.js       # spawnProjectile 帶上 effect
改   src/render/renderer.js      # 被減速/中毒/凍結的視覺提示 + 火雨點地預覽 + 新怪色
改   src/main.js                 # 串接 effects/spells/spellBar、傳 now 給 projectile
改   index.html                  # 主動技按鈕列容器
改   tests/endlessDirector.test.js  # 補魔族/交替首領斷言
```

---

## Task 1：effects 系統（套用減速/DoT，TDD）

**Files:** Create `src/systems/effects.js`, `tests/effects.test.js`

效果規格（塔/技能帶的 `effect` 物件）：
- 減速：`{ slow: { factor: 0.5, duration: 2 } }` → 設 `e.slowUntil = now + duration`、`e.slowFactor = factor`（取較強：factor 較小者覆蓋）
- 持續傷害：`{ dot: { dps: 12, duration: 3 } }` → push `{ dps, until: now + duration }` 進 `e.dots`
- 凍結＝減速 factor 0（寒冰術用）

- [ ] **Step 1: 失敗測試** `tests/effects.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyEffect } from '../src/systems/effects.js';

function enemy() { return { slowUntil: 0, slowFactor: 1, dots: [] }; }

test('套用減速設定 slowUntil/slowFactor', () => {
  const e = enemy();
  applyEffect(e, { slow: { factor: 0.5, duration: 2 } }, 10);
  assert.equal(e.slowUntil, 12);
  assert.equal(e.slowFactor, 0.5);
});
test('更強的減速(factor較小)才覆蓋', () => {
  const e = enemy();
  applyEffect(e, { slow: { factor: 0.4, duration: 2 } }, 0);
  applyEffect(e, { slow: { factor: 0.8, duration: 2 } }, 0);
  assert.equal(e.slowFactor, 0.4);
});
test('套用DoT推入dots', () => {
  const e = enemy();
  applyEffect(e, { dot: { dps: 12, duration: 3 } }, 5);
  assert.equal(e.dots.length, 1);
  assert.equal(e.dots[0].dps, 12);
  assert.equal(e.dots[0].until, 8);
});
test('無effect不報錯', () => {
  const e = enemy();
  applyEffect(e, undefined, 0);
  applyEffect(e, {}, 0);
  assert.equal(e.dots.length, 0);
});
```

- [ ] **Step 2: 跑測試確認失敗** `cd last-stand && node --test tests/effects.test.js` → FAIL

- [ ] **Step 3: 實作** `src/systems/effects.js`
```js
// 把塔/技能的 effect 套到敵人身上（就地修改）。now = 遊戲秒數。
export function applyEffect(enemy, effect, now) {
  if (!effect) return;
  if (effect.slow) {
    const until = now + effect.slow.duration;
    // 取較強(factor較小)或更久者
    if (effect.slow.factor < enemy.slowFactor || now >= enemy.slowUntil) {
      enemy.slowFactor = Math.min(enemy.slowFactor, effect.slow.factor);
    }
    enemy.slowUntil = Math.max(enemy.slowUntil, until);
  }
  if (effect.dot) {
    enemy.dots.push({ dps: effect.dot.dps, until: now + effect.dot.duration });
  }
}
```

- [ ] **Step 4: 跑測試確認通過** `node --test tests/effects.test.js` → PASS（4）

- [ ] **Step 5: Commit** `git add src/systems/effects.js tests/effects.test.js && git commit -m "feat(effects): 套用減速/DoT 純函式"`

---

## Task 2：新塔資料 + 投射物套用效果

**Files:** Modify `src/data/towers.js`, `src/entities/projectile.js`, `src/entities/tower.js`, `src/main.js`

新塔需在命中時套效果。投射物目前不知道 `now`，需把 `now` 從 main 傳進來。

- [ ] **Step 1: towers.js 新增兩塔**（接在現有三塔之後，物件內）
```js
  elf_druid: {
    name: '精靈纏繞德魯伊', faction: 'elf', attackType: 'magic', canHitAir: true,
    color: '#3bbf8f', splash: 0,
    effect: { slow: { factor: 0.5, duration: 2 } },
    levels: [
      { cost: 80,  damage: 6,  range: 110, fireRate: 1.0 },
      { cost: 70,  damage: 10, range: 120, fireRate: 1.1 },
      { cost: 120, damage: 16, range: 130, fireRate: 1.2 },
    ],
  },
  dwarf_mortar: {
    name: '矮人燃燒投石', faction: 'dwarf', attackType: 'siege', canHitAir: false,
    color: '#d8632f', splash: 48,
    effect: { dot: { dps: 10, duration: 3 } },
    levels: [
      { cost: 120, damage: 22, range: 150, fireRate: 0.5 },
      { cost: 110, damage: 40, range: 160, fireRate: 0.55 },
      { cost: 170, damage: 70, range: 175, fireRate: 0.6 },
    ],
  },
```

- [ ] **Step 2: tower.js — spawnProjectile 帶 effect**
在 `src/entities/tower.js` 的 `updateTower` 內呼叫 `spawnProjectile(t, target)` 不變；改在 `src/entities/projectile.js` 的 `spawnProjectile` 讀 `tower.effect`（見下步）。同時於 `buildTower` 結果保留 `def.effect`：在 buildTower return 物件加上 `effect: def.effect || null,`。

- [ ] **Step 3: projectile.js — 命中套效果（需 now）**
改 `spawnProjectile`：
```js
export function spawnProjectile(tower, target) {
  return {
    id: nextId++, x: tower.x, y: tower.y, targetId: target.id,
    speed: 420, damage: tower.damage, attackType: tower.attackType,
    splash: tower.splash, effect: tower.effect || null,
    color: tower.color, alive: true,
  };
}
```
改 `updateProjectile(p, enemies, dt, now)`（新增 now 參數），命中迴圈套用效果：
```js
import { applyEffect } from '../systems/effects.js';
// ...在 hits 迴圈內，計算傷害後：
for (const e of hits) {
  e.hp -= computeDamage(p.damage, p.attackType, e.armorType);
  if (p.effect) applyEffect(e, p.effect, now);
  e.hitFlash = 0.12;
}
```

- [ ] **Step 4: main.js — 傳 now 給 updateProjectile**
找到 `const hit = updateProjectile(p, s.enemies, dt);` 改為 `const hit = updateProjectile(p, s.enemies, dt, s.now);`

- [ ] **Step 5: 驗證** `npm test`（28 仍綠）；`node --check src/entities/projectile.js src/entities/tower.js src/main.js src/data/towers.js`

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(towers): 纏繞德魯伊(減速)+燃燒投石(DoT)，投射物套用效果"`

---

## Task 3：魔族敵人 + 無盡導演交替

**Files:** Modify `src/data/enemies.js`, `src/data/balance.js`, `src/systems/endlessDirector.js`, `tests/endlessDirector.test.js`

- [ ] **Step 1: enemies.js 新增魔族**
```js
  imp:      { name: '小鬼',   armorType: 'light',  hpMult: 0.7, speedMult: 1.4,  bountyMult: 0.7, radius: 10, color: '#e2724b' },
  succubus: { name: '魅魔',   armorType: 'flying', hpMult: 1.0, speedMult: 1.15, bountyMult: 1.2, radius: 13, color: '#d46ab0' },
  infernal: { name: '炎魔',   armorType: 'heavy',  hpMult: 2.2, speedMult: 0.6,  bountyMult: 1.5, radius: 16, color: '#b0402f' },
  warlock:  { name: '邪術士', armorType: 'magic',  hpMult: 1.3, speedMult: 0.9,  bountyMult: 1.3, radius: 13, color: '#7a3fd0' },
  demonlord:{ name: '魔王',   armorType: 'heavy',  hpMult: 1.1, speedMult: 0.8,  bountyMult: 1.0, radius: 20, color: '#5a1530', boss: true },
```

- [ ] **Step 2: balance.js endless 區塊新增**（在 endless 物件內加）
```js
    demonBossEvery: 10,   // 第10/20/...波改出魔王(其餘boss波出死亡騎士)
```

- [ ] **Step 3: endlessDirector.js — 交替兩族 + 對應首領**
把 `POOL` 改為兩族池並依波數交替整波族別（奇數段不死、偶數段魔族），首領依 `demonBossEvery` 決定死亡騎士或魔王：
```js
const UNDEAD = ['skeleton', 'zombie', 'banshee'];
const DEMON = ['imp', 'succubus', 'warlock', 'infernal'];

function poolFor(wave) {
  // 每 3 波切換族別，讓玩家面對不同護甲組合
  return Math.floor((wave - 1) / 3) % 2 === 0 ? UNDEAD : DEMON;
}
```
`buildWave` 內 `const pool = poolFor(wave);` 取代原 `POOL`，索引用 `pool[(wave - 1 + i) % pool.length]`。首領段改：
```js
  if (wave % E.bossEvery === 0) {
    const useDemon = wave % E.demonBossEvery === 0;
    const bossType = useDemon ? 'demonlord' : 'deathknight';
    const s = scaledStats(wave, bossType);
    list.push({
      type: bossType, armorType: ENEMIES[bossType].armorType,
      hp: Math.round(s.hp * E.bossHpMult), maxHp: Math.round(s.hp * E.bossHpMult),
      speed: s.speed, bounty: Math.round(s.bounty * E.bossBountyMult), boss: true,
    });
  }
```

- [ ] **Step 4: 補測試** `tests/endlessDirector.test.js` 末端加：
```js
test('波次會切換到魔族池', () => {
  // wave 4-6 為魔族段
  const wave = buildWave(4);
  const demonTypes = ['imp','succubus','warlock','infernal'];
  assert.ok(wave.some(e => demonTypes.includes(e.type)));
});
test('第10波首領為魔王', () => {
  const wave = buildWave(10);
  assert.ok(wave.some(e => e.type === 'demonlord' && e.boss));
});
test('第5波首領為死亡騎士', () => {
  const wave = buildWave(5);
  assert.ok(wave.some(e => e.type === 'deathknight' && e.boss));
});
```

- [ ] **Step 5: 驗證** `node --test tests/endlessDirector.test.js`（原 5 + 新 3 = 8 綠）；`npm test` 全綠

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(enemies): 魔族陣容 + 無盡導演交替兩族與對應首領"`

---

## Task 4：主動技系統（spells，TDD）

**Files:** Create `src/systems/spells.js`, `tests/spells.test.js`

主動技定義 + 冷卻狀態管理（純邏輯；實際傷害/凍結套用在 main 串接時做）。

- [ ] **Step 1: 失敗測試** `tests/spells.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSpellState, isReady, trigger, tickSpells, SPELLS } from '../src/systems/spells.js';

test('技能定義含火雨與寒冰', () => {
  assert.ok(SPELLS.firerain);
  assert.ok(SPELLS.frost);
});
test('初始即就緒', () => {
  const s = createSpellState();
  assert.equal(isReady(s, 'firerain'), true);
});
test('施放後進入冷卻、未就緒', () => {
  const s = createSpellState();
  trigger(s, 'firerain');
  assert.equal(isReady(s, 'firerain'), false);
});
test('冷卻倒數結束後恢復就緒', () => {
  const s = createSpellState();
  trigger(s, 'frost');
  tickSpells(s, SPELLS.frost.cooldown);
  assert.equal(isReady(s, 'frost'), true);
});
```

- [ ] **Step 2: 跑測試確認失敗** `node --test tests/spells.test.js` → FAIL

- [ ] **Step 3: 實作** `src/systems/spells.js`
```js
export const SPELLS = {
  firerain: { name: '火雨', icon: '🔥', cooldown: 18, radius: 90, damage: 120, attackType: 'siege', targeted: true },
  frost:    { name: '寒冰術', icon: '❄️', cooldown: 25, duration: 3, targeted: false },
};

export function createSpellState() {
  const s = {};
  for (const k of Object.keys(SPELLS)) s[k] = 0; // 剩餘冷卻秒數
  return s;
}
export function isReady(state, key) { return state[key] <= 0; }
export function trigger(state, key) {
  if (!isReady(state, key)) return false;
  state[key] = SPELLS[key].cooldown;
  return true;
}
export function tickSpells(state, dt) {
  for (const k of Object.keys(state)) if (state[k] > 0) state[k] = Math.max(0, state[k] - dt);
}
```

- [ ] **Step 4: 跑測試確認通過** `node --test tests/spells.test.js` → PASS（4）

- [ ] **Step 5: Commit** `git add src/systems/spells.js tests/spells.test.js && git commit -m "feat(spells): 主動技冷卻/施放邏輯"`

---

## Task 5：主動技 UI + 串接（火雨點地、寒冰全場）

**Files:** Create `src/ui/spellBar.js`; Modify `index.html`, `src/main.js`, `src/state/gameState.js`, `src/render/renderer.js`

- [ ] **Step 1: gameState.js 加 spell 狀態**
import 並在 createGameState return 物件加：`spells: createSpellState(),` 與 `castMode: null,`（火雨待點地時 = 'firerain'）。檔頭 `import { createSpellState } from '../systems/spells.js';`

- [ ] **Step 2: index.html 加技能列容器**（buildbar 後）
```html
  <div id="spellbar"></div>
```
並補 CSS：
```css
  #spellbar { display:flex; gap:8px; padding:0 10px 10px; }
  .spell-btn { background:#3a2b4a; color:#eee; border:1px solid #5a4670; border-radius:8px;
               padding:8px 14px; cursor:pointer; font-size:14px; }
  .spell-btn.cooling { opacity:.45; cursor:default; }
  .spell-btn.armed { border-color:#ffe08a; background:#4a3320; }
```

- [ ] **Step 3: spellBar.js**
```js
import { SPELLS, isReady } from '../systems/spells.js';

export function initSpellBar(state, onCast) {
  const bar = document.getElementById('spellbar');
  bar.innerHTML = '';
  for (const [key, def] of Object.entries(SPELLS)) {
    const b = document.createElement('button');
    b.className = 'spell-btn'; b.dataset.key = key;
    b.onclick = () => onCast(key);
    bar.appendChild(b);
  }
  refreshSpellBar(state);
}

export function refreshSpellBar(state) {
  const bar = document.getElementById('spellbar');
  for (const b of bar.children) {
    const key = b.dataset.key, def = SPELLS[key];
    const ready = isReady(state.spells, key);
    const cd = Math.ceil(state.spells[key]);
    b.textContent = `${def.icon} ${def.name}` + (ready ? '' : ` (${cd}s)`);
    b.classList.toggle('cooling', !ready);
    b.classList.toggle('armed', state.castMode === key);
  }
}
```

- [ ] **Step 4: main.js 串接**
頂部 import：
```js
import { tickSpells, trigger, SPELLS } from './systems/spells.js';
import { applyEffect } from './systems/effects.js';
import { initSpellBar, refreshSpellBar } from './ui/spellBar.js';
import { computeDamage } from './systems/combat.js';
```
`update(dt)` 內 `s.now += dt;` 之後加 `tickSpells(s.spells, dt);`
`draw()` 內加 `refreshSpellBar(state);`
施放處理函式（新增）：
```js
function onCast(key) {
  const s = state;
  if (s.over) return;
  const def = SPELLS[key];
  if (!isReady(s.spells, key)) return;     // 需 import isReady
  if (def.targeted) {
    s.castMode = s.castMode === key ? null : key; // 進入/取消點地模式
  } else {
    if (trigger(s.spells, key)) castFrost(s);
  }
}
function castFrost(s) {
  for (const e of s.enemies) if (e.alive) {
    e.slowUntil = s.now + SPELLS.frost.duration; e.slowFactor = 0; // 凍結
  }
  burst(s.map.width / 2, s.map.height / 2, '#a9d8ff', 40);
}
function castFireRain(s, x, y) {
  if (!trigger(s.spells, 'firerain')) return;
  const def = SPELLS.firerain;
  for (const e of s.enemies) if (e.alive) {
    if (dist(x, y, e.x, e.y) <= def.radius) {
      e.hp -= computeDamage(def.damage, def.attackType, e.armorType);
      e.hitFlash = 0.15;
    }
  }
  burst(x, y, '#ff7a2f', 36);
  s.castMode = null;
}
```
（`isReady` 加入 import 行：`import { tickSpells, trigger, isReady, SPELLS } from './systems/spells.js';`）
canvas click handler 開頭加火雨點地分支（在建塔判斷之前）：
```js
  if (s.castMode === 'firerain') { castFireRain(s, mouse.x, mouse.y); return; }
```
`boot()` 與 `restart()` 內，`initBuildMenu(state)` 之後加 `initSpellBar(state, onCast);`

- [ ] **Step 5: renderer.js 視覺提示**
在 `drawEnemy` 血條前加狀態圈：被減速/凍結畫淡藍外圈、中毒(dots.length)畫綠點。火雨點地預覽：在 `render()` 末端，若 `state.castMode === 'firerain'` 於 mouse 畫紅色半透明圓（半徑 `SPELLS.firerain.radius`，需 import SPELLS）。
```js
// drawEnemy 內，血條前：
if (e.slowUntil > 0 && e.slowFactor < 1) {
  ctx.strokeStyle = e.slowFactor === 0 ? '#bfe9ff' : '#7fc7ff';
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI*2); ctx.stroke();
}
if (e.dots && e.dots.length) {
  ctx.fillStyle = '#7fe04a'; ctx.beginPath(); ctx.arc(e.x + e.radius, e.y - e.radius, 3, 0, Math.PI*2); ctx.fill();
}
```
注意：renderer 的時間判斷無 now，這裡用 `e.slowFactor < 1 && e.slowUntil > 0` 近似（過期後 updateEnemy 不會重設 factor，但視覺殘留可接受；如需精準可在 main 的 update 末端把過期的 slowFactor 重設為 1）。為求乾淨，於 `src/entities/enemy.js` `updateEnemy` 移動前加：`if (now >= e.slowUntil) e.slowFactor = 1;`

- [ ] **Step 6: 驗證** `npm test` 全綠；`node --check` 改動的 JS 檔；控制器會在瀏覽器實測火雨/寒冰/新塔/魔族。

- [ ] **Step 7: Commit** `git add -A && git commit -m "feat(spells+ui): 火雨點地施放 + 寒冰全場凍結 + 狀態視覺提示"`

---

## Task 6：瀏覽器實測 + 微調

- [ ] 起伺服器實測（控制器執行）：火雨點地造成範圍傷害+紅圈預覽；寒冰術全場凍結3秒；纏繞德魯伊命中後敵人變慢(淡藍圈)；燃燒投石命中後持續掉血(綠點)；魔族在約第4波出現、第10波出魔王；技能冷卻數字正常、armed 高亮正常。
- [ ] 依手感微調 `balance.js`/`spells.js`（冷卻、傷害、減速倍率）。
- [ ] `npm test` 全綠後 commit：`git add -A && git commit -m "polish(2a): 主動技與新塔手感微調"`

---

## 完成定義（Phase 2a Done）
- 兩個主動技可用（火雨點地 AoE、寒冰全場凍結），有冷卻 UI。
- 兩座新塔啟用減速與 DoT 系統並有視覺提示。
- 魔族整批進無盡池、與不死交替、第10波魔王。
- 全測試綠（effects 4 + spells 4 + endless +3，其餘不變）、瀏覽器實測通過。

## Self-Review
- 啟用了 Phase 1 預埋的 `slowUntil/slowFactor/dots`（effects.js 寫入、updateEnemy 既有讀取）。
- `updateProjectile` 簽章新增 `now`，main 呼叫端同步更新（型別一致）。
- 凍結＝slowFactor 0，與減速同機制；updateEnemy 過期重設 factor 避免視覺殘留。
- endless 交替族別仍保證 count/boss 數學不變，新測試覆蓋族別切換與首領種類。
