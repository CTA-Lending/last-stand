# Phase 2b-1：頂階分支升級系統 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 每座塔有 2 個基礎升級階，練到頂階後可二選一「專精分支」（共 5 塔 ×2 = 10 種專精），分支用現有傷害/射程/射速/濺射/減速/DoT 機制呈現，不需新投射物行為。

**Architecture:** 塔資料結構從「3 階 levels」改為「2 階 levels + 2 個 branches」。塔實例新增 `invested`(累計花費，供賣出退款)與 `branch`(已選分支 index 或 null)。升級/分支邏輯集中在 `entities/tower.js`（純函式部分 TDD）。UI 在頂階時顯示兩個分支按鈕。

**Tech Stack:** 同前（Canvas 2D、原生 JS ESM、node --test）。

---

## 既有結構（會改）
- `src/data/towers.js`：5 塔目前各有 `levels:[t1,t2,t3]`。改為 `levels:[t1,t2]` + `branches:[specA,specB]`。
- `src/entities/tower.js`：`buildTower`(level0)、`upgradeTower`/`upgradeCost`(走 levels)、`towerStats`。需改寫並新增分支函式。
- `src/ui/buildMenu.js`：`showTowerPanel` 升級/賣出。頂階要顯示兩個分支鈕；賣出改用 `invested`。
- `src/render/renderer.js`：塔的等級點 `for i<=t.level` 顯示。分支後加金色點。

---

## Task 1：tower.js 升級/分支邏輯（TDD）

**Files:** Modify `src/entities/tower.js`; Create `tests/tower.test.js`

塔實例欄位：`level`(0=tier1,1=tier2)、`branch`(null 或 0/1)、`invested`(累計花費)。
規則：
- 建造：level 0，套 levels[0]，invested = levels[0].cost。
- `canUpgrade(t)`：level < 1（還能升到 tier2）。
- `upgradeCost(t)`：canUpgrade 時回 levels[1].cost，否則 null。
- `upgradeTower(t)`：level 0→1，套 levels[1]，invested += cost。
- `canBranch(t)`：level === 1 && branch === null。
- `branchOptions(t)`：回 def.branches（含 name/cost…）。
- `chooseBranch(t, i)`：套 branches[i] 的 stats(damage/range/fireRate/splash/effect)、設 branch=i、invested += branches[i].cost。
- `sellValue(t, refundRate)`：floor(invested * refundRate)。

- [ ] **Step 1: 失敗測試** `tests/tower.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTower, upgradeTower, upgradeCost, canUpgrade, canBranch, branchOptions, chooseBranch, sellValue } from '../src/entities/tower.js';

const slot = { x: 100, y: 100 };

test('建造為 tier1，記錄 invested', () => {
  const t = buildTower('elf_archer', slot);
  assert.equal(t.level, 0);
  assert.equal(t.branch, null);
  assert.ok(t.invested > 0);
});
test('可升到 tier2 後不能再普通升級', () => {
  const t = buildTower('elf_archer', slot);
  assert.equal(canUpgrade(t), true);
  upgradeTower(t);
  assert.equal(t.level, 1);
  assert.equal(canUpgrade(t), false);
  assert.equal(upgradeCost(t), null);
});
test('頂階可選分支，選後套用該分支屬性', () => {
  const t = buildTower('elf_archer', slot);
  upgradeTower(t);
  assert.equal(canBranch(t), true);
  const opts = branchOptions(t);
  assert.equal(opts.length, 2);
  const before = t.damage;
  chooseBranch(t, 1); // 狙擊手：高傷
  assert.equal(t.branch, 1);
  assert.ok(t.damage > before);
  assert.equal(canBranch(t), false); // 已分支不可再選
});
test('賣出價 = invested × refundRate', () => {
  const t = buildTower('elf_archer', slot);
  upgradeTower(t);
  assert.equal(sellValue(t, 0.6), Math.floor(t.invested * 0.6));
});
```

- [ ] **Step 2: 跑測試確認失敗** `cd last-stand && node --test tests/tower.test.js`

- [ ] **Step 3: 改寫 `src/entities/tower.js`**
```js
import { TOWERS } from '../data/towers.js';
import { selectTarget } from '../systems/targeting.js';
import { spawnProjectile } from './projectile.js';

let nextId = 1;

function applyStats(t, s) {
  t.range = s.range; t.damage = s.damage; t.fireRate = s.fireRate;
  if (s.splash !== undefined) t.splash = s.splash;
  if (s.effect !== undefined) t.effect = s.effect;
}

export function buildTower(type, slot) {
  const def = TOWERS[type];
  const s = def.levels[0];
  const t = {
    id: nextId++, type, x: slot.x, y: slot.y,
    attackType: def.attackType, canHitAir: def.canHitAir, splash: def.splash || 0,
    effect: def.effect || null, color: def.color, level: 0, branch: null,
    cooldown: 0, priority: 'first', invested: s.cost,
  };
  applyStats(t, s);
  return t;
}

export function canUpgrade(t) { return t.level < TOWERS[t.type].levels.length - 1; }
export function upgradeCost(t) {
  return canUpgrade(t) ? TOWERS[t.type].levels[t.level + 1].cost : null;
}
export function upgradeTower(t) {
  if (!canUpgrade(t)) return false;
  t.level += 1;
  const s = TOWERS[t.type].levels[t.level];
  applyStats(t, s); t.invested += s.cost;
  return true;
}

export function canBranch(t) {
  return t.level === TOWERS[t.type].levels.length - 1 && t.branch === null;
}
export function branchOptions(t) { return TOWERS[t.type].branches; }
export function chooseBranch(t, i) {
  if (!canBranch(t)) return false;
  const b = TOWERS[t.type].branches[i];
  applyStats(t, b); t.branch = i; t.invested += b.cost;
  return true;
}

export function sellValue(t, refundRate) { return Math.floor(t.invested * refundRate); }

export function updateTower(t, enemies, projectiles, dt) {
  t.cooldown -= dt;
  if (t.cooldown > 0) return;
  const target = selectTarget(t, enemies);
  if (!target) return;
  projectiles.push(spawnProjectile(t, target));
  t.cooldown = 1 / t.fireRate;
}
```

- [ ] **Step 4: 跑測試確認通過** `node --test tests/tower.test.js`（4）

- [ ] **Step 5: Commit** `git add src/entities/tower.js tests/tower.test.js && git commit -m "feat(tower): 2階升級+頂階二選一分支+invested退款 邏輯"`

---

## Task 2：towers.js 改資料（2 階 + 2 分支 ×5 塔）

**Files:** Modify `src/data/towers.js`

每塔 `levels` 留前 2 階；新增 `branches`(2 個，含 name/cost 與最終屬性)。下列為完整數值。

- [ ] **Step 1: 全面改寫 `src/data/towers.js`**
```js
export const TOWERS = {
  elf_archer: {
    name: '精靈神射手', faction: 'elf', attackType: 'physical', canHitAir: true,
    color: '#63992e', splash: 0,
    levels: [ { cost: 70, damage: 14, range: 120, fireRate: 1.4 }, { cost: 60, damage: 26, range: 135, fireRate: 1.6 } ],
    branches: [
      { name: '連射手', cost: 120, damage: 34, range: 145, fireRate: 2.8 },
      { name: '狙擊手', cost: 120, damage: 95, range: 210, fireRate: 1.0 },
    ],
  },
  dwarf_cannon: {
    name: '矮人蒸汽火砲', faction: 'dwarf', attackType: 'siege', canHitAir: false,
    color: '#b07a2f', splash: 42,
    levels: [ { cost: 95, damage: 26, range: 110, fireRate: 0.7 }, { cost: 90, damage: 46, range: 120, fireRate: 0.8 } ],
    branches: [
      { name: '爆裂彈', cost: 150, damage: 78, range: 130, fireRate: 0.9, splash: 64 },
      { name: '燃燒彈', cost: 150, damage: 56, range: 130, fireRate: 0.9, splash: 48, effect: { dot: { dps: 20, duration: 3 } } },
    ],
  },
  mage_arcane: {
    name: '魔法師奧術塔', faction: 'mage', attackType: 'magic', canHitAir: true,
    color: '#7f77dd', splash: 0,
    levels: [ { cost: 90, damage: 20, range: 115, fireRate: 1.1 }, { cost: 85, damage: 36, range: 125, fireRate: 1.2 } ],
    branches: [
      { name: '奧能爆發', cost: 140, damage: 88, range: 135, fireRate: 1.3 },
      { name: '遠古智慧', cost: 140, damage: 48, range: 175, fireRate: 1.8 },
    ],
  },
  elf_druid: {
    name: '精靈纏繞德魯伊', faction: 'elf', attackType: 'magic', canHitAir: true,
    color: '#3bbf8f', splash: 0, effect: { slow: { factor: 0.5, duration: 2 } },
    levels: [ { cost: 80, damage: 6, range: 110, fireRate: 1.0 }, { cost: 70, damage: 10, range: 120, fireRate: 1.1 } ],
    branches: [
      { name: '寒冰纏繞', cost: 120, damage: 16, range: 130, fireRate: 1.2, effect: { slow: { factor: 0.3, duration: 2.5 } } },
      { name: '劇毒纏繞', cost: 120, damage: 16, range: 130, fireRate: 1.2, effect: { dot: { dps: 16, duration: 3 } } },
    ],
  },
  dwarf_mortar: {
    name: '矮人燃燒投石', faction: 'dwarf', attackType: 'siege', canHitAir: false,
    color: '#d8632f', splash: 48, effect: { dot: { dps: 10, duration: 3 } },
    levels: [ { cost: 120, damage: 22, range: 150, fireRate: 0.5 }, { cost: 110, damage: 40, range: 160, fireRate: 0.55 } ],
    branches: [
      { name: '巨石轟炸', cost: 170, damage: 95, range: 175, fireRate: 0.6, splash: 70, effect: { dot: { dps: 10, duration: 3 } } },
      { name: '烈焰風暴', cost: 170, damage: 60, range: 175, fireRate: 0.7, splash: 56, effect: { dot: { dps: 30, duration: 3 } } },
    ],
  },
};
```

- [ ] **Step 2: 驗證** `npm test` 全綠（tower.test 用 elf_archer 數值，需與此一致：tier2 dmg26、狙擊手 dmg95>26 ✓）；`node --check src/data/towers.js`

- [ ] **Step 3: Commit** `git add src/data/towers.js && git commit -m "feat(data): 5塔改為2階+2分支專精數值"`

---

## Task 3：UI 與渲染串接分支

**Files:** Modify `src/ui/buildMenu.js`, `src/render/renderer.js`, `src/data/balance.js`(若需)

- [ ] **Step 1: buildMenu.js showTowerPanel 改寫**
import 由 tower.js 取 `upgradeCost, canBranch, branchOptions, chooseBranch, sellValue, canUpgrade`。
頂階(canBranch)時，顯示兩個分支按鈕；否則顯示升級按鈕(若 canUpgrade)或「已專精/已滿級」。賣出用 `sellValue(t, BALANCE.sellRefund)`。
```js
import { TOWERS } from '../data/towers.js';
import { upgradeTower, upgradeCost, canUpgrade, canBranch, branchOptions, chooseBranch, sellValue } from '../entities/tower.js';
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
export function refreshBuildButtons(state) {
  renderSelection(document.getElementById('buildbar'), state);
}

export function showTowerPanel(state) {
  const panel = document.getElementById('towerpanel');
  const t = state.selectedTower;
  if (!t) { panel.style.display = 'none'; return; }
  const def = TOWERS[t.type];
  const sell = sellValue(t, BALANCE.sellRefund);
  let actions = '';
  if (canBranch(t)) {
    const o = branchOptions(t);
    actions = `<div class="branch-row">
      <button id="br0">${o[0].name} (${o[0].cost}g)</button>
      <button id="br1">${o[1].name} (${o[1].cost}g)</button></div>`;
  } else if (canUpgrade(t)) {
    actions = `<button id="upg">升級 (${upgradeCost(t)}g)</button>`;
  } else {
    actions = `<span>${t.branch != null ? def.branches[t.branch].name + ' · 已專精' : '已滿級'}</span>`;
  }
  panel.style.display = 'block';
  const lvLabel = t.branch != null ? def.branches[t.branch].name : 'Lv.' + (t.level + 1);
  panel.innerHTML = `<b>${def.name}</b> ${lvLabel}
    <div>傷害 ${t.damage} · 射程 ${t.range}</div>
    ${actions}
    <button id="sell">賣出 (+${sell}g)</button>`;
  const upg = document.getElementById('upg');
  if (upg) upg.onclick = () => { if (state.economy.spend(upgradeCost(t))) { upgradeTower(t); showTowerPanel(state); } };
  for (const i of [0, 1]) {
    const bb = document.getElementById('br' + i);
    if (bb) bb.onclick = () => {
      const cost = branchOptions(t)[i].cost;
      if (state.economy.spend(cost)) { chooseBranch(t, i); showTowerPanel(state); }
    };
  }
  document.getElementById('sell').onclick = () => {
    state.economy.earn(sell);
    state.towers = state.towers.filter(x => x !== t);
    state.occupiedCells.delete(t.cellKey);
    state.selectedTower = null; panel.style.display = 'none';
  };
}
```

- [ ] **Step 2: index.html 補分支按鈕列 CSS**（在 towerpanel 區塊樣式附近）
```css
  .branch-row { display:flex; gap:6px; }
  .branch-row button { flex:1; font-size:12px; }
```

- [ ] **Step 3: renderer.js 等級點 + 分支金點**
`drawTower` 內等級點迴圈後，若 `t.branch != null` 多畫一個金色點表示已專精：
```js
  if (t.branch != null) {
    ctx.fillStyle = '#ffd35a';
    ctx.fillRect(t.x + 9, t.y - 13, 5, 5);
  }
```

- [ ] **Step 4: 驗證** `npm test` 全綠；`node --check` 改動檔；控制器瀏覽器實測：蓋塔→升級到 tier2→出現兩個分支鈕→選一個→屬性變化、塔上出現金點、賣出退款合理。

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(ui): 頂階分支二選一面板 + 分支視覺 + invested 退款"`

---

## 完成定義（Phase 2b-1 Done）
- 每塔 2 階升級後可二選一專精，10 種專精皆生效（傷害/射程/濺射/減速/DoT 變化）。
- 賣出依累計投入退款。tower 邏輯有單元測試。
- 全測試綠、瀏覽器實測通過。

## Self-Review
- 資料結構 levels 由 3→2 階；tower.test 的 elf_archer tier2 dmg=26 與資料一致；狙擊手 dmg95>26 斷言成立。
- buildMenu 賣出改 sellValue(invested)，不再索引 levels[t.level]（避免分支後越界）。
- renderer 等級點迴圈 `for i<=t.level`（level 最大為 1）仍正確；分支金點額外標示。
