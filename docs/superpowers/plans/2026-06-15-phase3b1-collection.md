# Phase 3b-1：角色圖鑑 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 加入「圖鑑」總覽：topbar 按鈕開面板，翻閱全部 14 座塔的角色卡（立繪色、名字、陣營、定位、造價、角色設定文案、解鎖狀態）。轉蛋塔未解鎖顯示 🔒。

**Architecture:** 純展示為主。`systems/collection.js` 放純函式 `towerRole(def)`(回定位字串)、`isOwned(type, gachaUnlocked)`(TDD)。`ui/collection.js` 渲染 overlay。main 加 topbar 按鈕。

**Tech Stack:** 同前。

---

## Task 1：圖鑑純函式（TDD）

**Files:** Create `src/systems/collection.js`, `tests/collection.test.js`

- [ ] **Step 1: 失敗測試** `tests/collection.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { towerRole, isOwned } from '../src/systems/collection.js';

test('依 kind/attackType 回定位字串', () => {
  assert.equal(towerRole({ kind: 'barracks' }), '兵營·擋路');
  assert.equal(towerRole({ kind: 'banner' }), '光環·增益');
  assert.equal(towerRole({ kind: 'mine' }), '地雷·陷阱');
  assert.equal(towerRole({ attackType: 'physical' }), '物理');
  assert.equal(towerRole({ attackType: 'siege' }), '攻城');
  assert.equal(towerRole({ attackType: 'magic' }), '魔法');
});
test('一般塔預設擁有；轉蛋塔需解鎖', () => {
  assert.equal(isOwned('elf_archer', new Set()), true);
  assert.equal(isOwned('dragon_whelp', new Set()), false);
  assert.equal(isOwned('dragon_whelp', new Set(['dragon_whelp'])), true);
});
```

- [ ] **Step 2: 跑測試確認失敗** `cd last-stand && node --test tests/collection.test.js`

- [ ] **Step 3: 實作 `src/systems/collection.js`**
```js
import { TOWERS } from '../data/towers.js';

export function towerRole(def) {
  if (def.kind === 'barracks') return '兵營·擋路';
  if (def.kind === 'banner') return '光環·增益';
  if (def.kind === 'mine') return '地雷·陷阱';
  return { physical: '物理', siege: '攻城', magic: '魔法' }[def.attackType] || '—';
}

export function isOwned(type, gachaUnlocked) {
  const def = TOWERS[type];
  if (def.gachaOnly) return !!(gachaUnlocked && gachaUnlocked.has(type));
  return true;
}
```

- [ ] **Step 4: 跑測試確認通過** `node --test tests/collection.test.js`（2）；`npm test` 全綠

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(collection): 圖鑑純函式(定位/擁有)"`

---

## Task 2：圖鑑 UI + topbar 按鈕

**Files:** Create `src/ui/collection.js`; Modify `index.html`, `src/main.js`

- [ ] **Step 1: index.html — topbar 按鈕 + overlay + CSS**
topbar 內 gachabtn 後加：`<span id="dexbtn"></span>`
stage 內加：`<div id="dexoverlay"></div>`
CSS：
```css
  #dexbtn button { margin-left:8px; font-size:13px; padding:3px 10px; cursor:pointer;
                   background:#2b3346; color:#bfe9ff; border:1px solid #3d4760; border-radius:6px; }
  #dexoverlay { position:absolute; inset:0; background:rgba(0,0,0,.8); display:none;
                align-items:center; justify-content:center; overflow:auto; }
  .dex-panel { background:#1f2632; padding:20px 24px; border-radius:14px; max-width:760px; max-height:92%; overflow:auto; }
  .dex-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
  .dex-card { background:#2a3340; border-radius:10px; padding:12px; font-size:12px; }
  .dex-card.locked { opacity:.5; }
  .dex-card h4 { margin:4px 0; font-size:14px; }
  .dex-role { color:#9fb0c0; }
  .dex-lore { color:#cbd4dd; margin-top:6px; line-height:1.5; }
  .dex-close { display:block; margin:16px auto 0; background:none; border:none; color:#aaa; cursor:pointer; }
```

- [ ] **Step 2: src/ui/collection.js**
```js
import { TOWERS } from '../data/towers.js';
import { towerRole, isOwned } from '../systems/collection.js';

export function openCollection(gachaUnlocked) {
  const ov = document.getElementById('dexoverlay');
  const cards = Object.entries(TOWERS).map(([type, def]) => {
    const owned = isOwned(type, gachaUnlocked);
    const cost = def.levels[0].cost;
    return `<div class="dex-card ${owned ? '' : 'locked'}">
      <div style="font-size:26px;color:${def.color}">●</div>
      <h4 style="color:${def.color}">${def.name}</h4>
      <div class="dex-role">${towerRole(def)} · ${cost}g${def.gachaOnly ? ' · 傳奇' : ''}</div>
      <div class="dex-lore">${def.lore || (owned ? '' : '🔒 轉蛋解鎖')}</div>
    </div>`;
  }).join('');
  ov.innerHTML = `<div class="dex-panel"><h2>🎴 塔圖鑑</h2>
    <div class="dex-grid">${cards}</div>
    <button class="dex-close">關閉</button></div>`;
  ov.style.display = 'flex';
  ov.querySelector('.dex-close').onclick = () => { ov.style.display = 'none'; };
}
```

- [ ] **Step 3: main.js — topbar 圖鑑鈕**
import：`import { openCollection } from './ui/collection.js';`
新增初始化（一次即可，放 boot 內 loop.start 前）：
```js
function initDexButton() {
  const bar = document.getElementById('dexbtn');
  bar.innerHTML = '';
  const b = document.createElement('button');
  b.textContent = '🎴 圖鑑';
  b.onclick = () => openCollection(gachaUnlocked);
  bar.appendChild(b);
}
```
`boot()` 內呼叫 `initDexButton();`

- [ ] **Step 4: 驗證** `npm test` 全綠；`node --check`；控制器實測：點圖鑑→看到 14 張卡含角色設定，轉蛋塔未解鎖顯示 🔒/淡化、解鎖後顯示 lore。

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(collection): 角色圖鑑面板 + topbar 按鈕"`

---

## 完成定義（Phase 3b-1 Done）
- topbar「🎴 圖鑑」開啟可翻閱全 14 塔角色卡(立繪/名字/定位/造價/角色設定/解鎖狀態)。
- collection 純函式有測試。全測試綠、瀏覽器實測通過。

## Self-Review
- 圖鑑純展示，讀 TOWERS + gachaUnlocked；轉蛋未解鎖淡化+🔒。
- towerRole/isOwned 純函式可測、之後視覺打磨可沿用。
