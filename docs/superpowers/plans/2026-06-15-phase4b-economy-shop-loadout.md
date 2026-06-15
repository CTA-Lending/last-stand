# Phase 4b：鑽石經濟 + 商城 + 編隊 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 養成核心循環：破關/存活得💎鑽石 → 大廳🏪商城用鑽石買永久塔 → 進副本前**編隊**挑一套擁有的塔帶入 → 關卡內只能蓋帶入的塔(用💰金幣，現狀經濟)。移除舊的「場上要有前置塔才能蓋」改為帶隊制。起始擁有 4 基礎塔。

**Architecture:** `systems/account.js` 純函式(擁有/可買/編隊/結算鑽石，TDD)。`saveService` profile 擴充 owned/diamonds/loadout。塔資料加鑽石價。build bar 改成只顯示 loadout、全可蓋(移除 requires 閘)。結算給鑽石。大廳加商城與編隊面板。轉蛋解鎖併入 owned。

**Tech Stack:** 同前。

---

## Task 1：帳號純邏輯（account，TDD）+ 塔鑽石價

**Files:** Create `src/systems/account.js`, `tests/account.test.js`; Modify `src/data/towers.js`

- [ ] **Step 1: towers.js 加鑽石價**（8 座可買塔加 `diamond` 欄位；4 起始塔與 2 轉蛋塔不需）
在以下塔物件各加一欄：`elf_druid:40, dwarf_mortar:60, mage_chain:80, elf_moonblade:70, human_ballista:80, mage_polymorph:100, human_banner:90, dwarf_mine:90`（例如 `elf_druid` 內加 `diamond: 40,`）。

- [ ] **Step 2: 失敗測試** `tests/account.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_TOWERS, isOwned, canBuy, buyPrice, toggleLoadout, LOADOUT_MAX, runDiamonds } from '../src/systems/account.js';

test('起始擁有 4 基礎塔', () => {
  assert.equal(STARTER_TOWERS.length, 4);
  assert.ok(STARTER_TOWERS.includes('elf_archer'));
});
test('isOwned 依 owned 陣列', () => {
  assert.equal(isOwned('elf_druid', ['elf_archer']), false);
  assert.equal(isOwned('elf_druid', ['elf_druid']), true);
});
test('canBuy 需未擁有、買得起、有鑽石價', () => {
  assert.equal(canBuy('elf_druid', [], 100), true);      // 價40
  assert.equal(canBuy('elf_druid', [], 10), false);      // 鑽石不足
  assert.equal(canBuy('elf_druid', ['elf_druid'], 100), false); // 已擁有
  assert.equal(canBuy('elf_archer', [], 100), false);    // 起始塔無鑽石價(不販售)
});
test('toggleLoadout 上限與加減', () => {
  let lo = ['elf_archer'];
  lo = toggleLoadout(lo, 'dwarf_cannon', LOADOUT_MAX); // 加
  assert.ok(lo.includes('dwarf_cannon'));
  lo = toggleLoadout(lo, 'dwarf_cannon', LOADOUT_MAX); // 再點移除
  assert.ok(!lo.includes('dwarf_cannon'));
});
test('結算鑽石：戰役依難度、無盡依波數', () => {
  assert.equal(runDiamonds({ mode: 'campaign', won: true, difficulty: 'hell' }), 120);
  assert.equal(runDiamonds({ mode: 'campaign', won: false, difficulty: 'hell' }), 0); // 沒過關不給
  assert.equal(runDiamonds({ mode: 'endless', wave: 10 }), 20);
});
```

- [ ] **Step 3: 跑測試確認失敗** `cd last-stand && node --test tests/account.test.js`

- [ ] **Step 4: 實作 `src/systems/account.js`**
```js
import { TOWERS } from '../data/towers.js';

export const STARTER_TOWERS = ['elf_archer', 'dwarf_cannon', 'mage_arcane', 'human_barracks'];
export const LOADOUT_MAX = 6;
const CAMPAIGN_DIAMOND = { normal: 30, hero: 60, hell: 120 };

export function isOwned(type, owned) { return owned.includes(type); }

export function buyPrice(type) { return TOWERS[type].diamond || null; }

export function canBuy(type, owned, diamonds) {
  const price = buyPrice(type);
  return price != null && !owned.includes(type) && diamonds >= price;
}

export function toggleLoadout(loadout, type, max) {
  if (loadout.includes(type)) return loadout.filter(t => t !== type);
  if (loadout.length >= max) return loadout;
  return [...loadout, type];
}

export function runDiamonds(result) {
  if (result.mode === 'campaign') return result.won ? (CAMPAIGN_DIAMOND[result.difficulty] || 0) : 0;
  return Math.floor((result.wave || 0) * 2);
}
```

- [ ] **Step 5: 跑測試確認通過** `node --test tests/account.test.js`（5）；`npm test` 全綠；`node --check src/data/towers.js`

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(account): 擁有/購買/編隊/結算鑽石 純邏輯 + 塔鑽石價"`

---

## Task 2：saveService profile 擴充（owned/diamonds/loadout，TDD）

**Files:** Modify `src/services/saveService.js`, `tests/saveService.test.js`

- [ ] **Step 1: 加測試** `tests/saveService.test.js`
```js
import { STARTER_TOWERS } from '../src/systems/account.js';
test('profile 預設含 diamonds/owned(起始4)/loadout', () => {
  const s = createSaveService(fakeStorage());
  const p = s.loadProfile();
  assert.equal(p.diamonds, 0);
  assert.deepEqual(p.owned, STARTER_TOWERS);
  assert.deepEqual(p.loadout, STARTER_TOWERS);
});
```

- [ ] **Step 2: 跑測試確認失敗**

- [ ] **Step 3: 改 saveService.js**
檔頂 `import { STARTER_TOWERS } from '../systems/account.js';`，loadProfile 的 def 改：
```js
      const def = { tickets: 0, lastLogin: null, diamonds: 0,
        owned: [...STARTER_TOWERS], loadout: [...STARTER_TOWERS] };
```
（saveProfile 不變。`{...def, ...JSON.parse(raw)}` 會讓舊檔自動補上新欄位。）

- [ ] **Step 4: 跑測試通過**；`npm test` 全綠

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(save): profile 加 diamonds/owned/loadout(起始4塔)"`

---

## Task 3：build bar 改帶隊制 + 移除場上前置 + 結算給鑽石 + 轉蛋併入 owned

**Files:** Modify `src/ui/buildMenu.js`, `src/main.js`, `src/ui/gacha.js`

- [ ] **Step 1: buildMenu.js initBuildMenu 只列 loadout、全可蓋**
`initBuildMenu(state)` 改為遍歷 `state.loadout`（而非全 TOWERS），每個 type 建一顆按鈕；移除 `.req` 鎖定提示與 `refreshBuildLocks`/`isTowerUnlocked` 在建造列的使用（loadout 塔皆可蓋，只看金錢）。按鈕內容：`● 名字 / 金幣價`。保留 `refreshBuildButtons`(active 高亮)。
（`refreshBuildLocks` 可保留但變空函式或不再呼叫；main 的 draw 移除 `refreshBuildLocks(state)` 呼叫。）

- [ ] **Step 2: main.js — 帳號狀態 + loadout 進場 + 結算鑽石 + 移除 build 的解鎖檢查**
頂部 import：`import { runDiamonds } from './systems/account.js';`
模組層：`profile` 已載入；新增 `let owned = profile.owned; let loadout = profile.loadout;`（直接參考 profile 陣列）。
`gachaUnlocked` 改用 owned：把既有 `const gachaUnlocked = new Set(profile.unlocked)` 換成 `const gachaUnlocked = new Set(profile.owned)`（讓 isTowerUnlocked/圖鑑沿用 owned；轉蛋解鎖會 push 進 owned）。
`startRun()`：`state.loadout = profile.loadout.slice();` 並維持 `state.gachaUnlocked = gachaUnlocked;`。
build 點擊處：移除 `if (!isTowerUnlocked(...)) {...}` 那段（loadout 已限制），只留金錢/格子檢查。
draw() 移除 `refreshBuildLocks(state);`。
結算給鑽石：在 game over 與 victory 觸發處，計算並加鑽石、存檔：
```js
  // 共用：結算發鑽石
  function awardDiamonds(s) {
    const gained = runDiamonds({ mode: s.mode, won: s.won, difficulty: s.difficulty, wave: s.wave });
    profile.diamonds += gained; save.saveProfile(profile);
    return gained;
  }
```
game over：`const dia = awardDiamonds(s);` 並把 dia 傳給 showGameOver 顯示（hud 顯示「獲得 💎N」）。victory 同理。

- [ ] **Step 3: gacha.js — 解鎖併入 owned**
`ui/gacha.js` 抽中時：`profile.unlocked.push` 改為 `profile.owned.push(res.type)`；`deps.gachaUnlocked.add(res.type)` 不變。drawGacha 的 unlocked 參數改傳 `profile.owned`。

- [ ] **Step 4: hud.js — 結算顯示鑽石**
`showGameOver`/`showVictory` 簽章加 `diamonds`，面板加一行 `<p>獲得 💎${diamonds}</p>`。main 呼叫補上。

- [ ] **Step 5: 驗證** `npm test` 全綠；`node --check`；控制器實測：進副本只看到 loadout 的塔、皆可蓋；過關/陣亡結算顯示獲得鑽石、鑽石持久累積。

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(economy): build bar 改帶隊制 + 結算給鑽石 + 轉蛋併入 owned"`

---

## Task 4：大廳商城 + 編隊面板

**Files:** Create `src/ui/shop.js`, `src/ui/loadout.js`; Modify `index.html`, `src/main.js`

- [ ] **Step 1: index.html — 大廳加商城/編隊鈕 + 兩個 overlay + 鑽石顯示 + CSS**
lobby-menu 內加：`<span id="shopbtn"></span><span id="loadoutbtn"></span>`
lobby-panel 頂(h1 後)加：`<div id="diamondbar">💎 <b id="dia-count">0</b></div>`
stage 內加：`<div id="shopoverlay"></div><div id="loadoutoverlay"></div>`
CSS（沿用 overlay/卡片風格）：
```css
  #diamondbar { color:#7fe0ff; margin-bottom:10px; }
  #shopbtn button, #loadoutbtn button { margin-left:8px; font-size:13px; padding:3px 10px; cursor:pointer;
    background:#2b3346; color:#7fe0ff; border:1px solid #3d4760; border-radius:6px; }
  #shopoverlay, #loadoutoverlay { position:absolute; inset:0; background:rgba(0,0,0,.82);
    display:none; align-items:center; justify-content:center; z-index:6; }
  .shop-panel, .lo-panel { background:#1f2632; padding:22px 26px; border-radius:14px; max-width:720px; max-height:90%; overflow:auto; }
  .shop-grid, .lo-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:12px; }
  .shop-card, .lo-card { background:#2a3340; border-radius:10px; padding:10px; font-size:12px; text-align:center; cursor:pointer; }
  .shop-card.owned { opacity:.55; cursor:default; }
  .lo-card.in { border:2px solid #ffe08a; }
  .lo-card.disabled { opacity:.4; }
  .ov-close { display:block; margin:16px auto 0; background:none; border:none; color:#aaa; cursor:pointer; }
```

- [ ] **Step 2: src/ui/shop.js**
```js
import { TOWERS } from '../data/towers.js';
import { canBuy, buyPrice, isOwned } from '../systems/account.js';

export function openShop(profile, save, onChange) {
  const ov = document.getElementById('shopoverlay');
  function render() {
    const cards = Object.entries(TOWERS).filter(([, d]) => d.diamond != null).map(([type, def]) => {
      const owned = isOwned(type, profile.owned);
      const buyable = canBuy(type, profile.owned, profile.diamonds);
      return `<div class="shop-card ${owned ? 'owned' : ''}" data-type="${type}">
        <div style="font-size:22px;color:${def.color}">●</div>
        <div style="color:${def.color}">${def.name}</div>
        <div>${owned ? '已擁有' : '💎' + buyPrice(type)}</div>
        ${owned ? '' : `<button ${buyable ? '' : 'disabled'} data-buy="${type}">購買</button>`}
      </div>`;
    }).join('');
    ov.innerHTML = `<div class="shop-panel"><h2>🏪 商城</h2>
      <div style="color:#7fe0ff">💎 ${profile.diamonds}</div>
      <div class="shop-grid">${cards}</div>
      <button class="ov-close">關閉</button></div>`;
    ov.querySelector('.ov-close').onclick = () => { ov.style.display = 'none'; };
    ov.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const type = b.dataset.buy;
      if (canBuy(type, profile.owned, profile.diamonds)) {
        profile.diamonds -= buyPrice(type); profile.owned.push(type);
        save.saveProfile(profile); onChange(); render();
      }
    });
  }
  render(); ov.style.display = 'flex';
}
```

- [ ] **Step 3: src/ui/loadout.js**
```js
import { TOWERS } from '../data/towers.js';
import { toggleLoadout, LOADOUT_MAX } from '../systems/account.js';

export function openLoadout(profile, save, onChange) {
  const ov = document.getElementById('loadoutoverlay');
  function render() {
    const cards = profile.owned.map(type => {
      const def = TOWERS[type]; const inLo = profile.loadout.includes(type);
      const full = !inLo && profile.loadout.length >= LOADOUT_MAX;
      return `<div class="lo-card ${inLo ? 'in' : ''} ${full ? 'disabled' : ''}" data-type="${type}">
        <div style="font-size:20px;color:${def.color}">●</div>
        <div style="color:${def.color}">${def.name}</div>
        <div>${inLo ? '✓ 出戰' : (full ? '已滿' : '點選帶入')}</div>
      </div>`;
    }).join('');
    ov.innerHTML = `<div class="lo-panel"><h2>⚔️ 編隊（最多 ${LOADOUT_MAX}）</h2>
      <div>已選 ${profile.loadout.length}/${LOADOUT_MAX}</div>
      <div class="lo-grid">${cards}</div>
      <button class="ov-close">關閉</button></div>`;
    ov.querySelector('.ov-close').onclick = () => { ov.style.display = 'none'; };
    ov.querySelectorAll('.lo-card').forEach(c => c.onclick = () => {
      profile.loadout = toggleLoadout(profile.loadout, c.dataset.type, LOADOUT_MAX);
      save.saveProfile(profile); onChange(); render();
    });
  }
  render(); ov.style.display = 'flex';
}
```

- [ ] **Step 4: main.js — 商城/編隊鈕 + 鑽石顯示更新**
import：`import { openShop } from './ui/shop.js';`、`import { openLoadout } from './ui/loadout.js';`
```js
function refreshLobbyInfo() {
  const d = document.getElementById('dia-count'); if (d) d.textContent = profile.diamonds;
}
function initShopButtons() {
  const sb = document.getElementById('shopbtn'); sb.innerHTML = '';
  const s = document.createElement('button'); s.textContent = '🏪 商城';
  s.onclick = () => openShop(profile, save, refreshLobbyInfo); sb.appendChild(s);
  const lb = document.getElementById('loadoutbtn'); lb.innerHTML = '';
  const l = document.createElement('button'); l.textContent = '⚔️ 編隊';
  l.onclick = () => openLoadout(profile, save, refreshLobbyInfo); lb.appendChild(l);
}
```
`boot()` 內呼叫 `initShopButtons();`；`enterLobby()` 內呼叫 `refreshLobbyInfo();`（顯示最新鑽石）。

- [ ] **Step 5: 驗證** `npm test` 全綠；`node --check`；控制器實測：大廳顯示鑽石；商城買塔(扣鑽石、變已擁有)；編隊勾選(上限6)；進副本只帶編隊塔；過關得鑽石回大廳可再買。

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(lobby): 商城(鑽石買塔)+編隊面板+鑽石顯示"`

---

## 完成定義（Phase 4b Done）
- 雙貨幣(金幣局內/鑽石帳號)、商城鑽石買永久塔、編隊帶塔進關、關卡內只蓋帶入塔、結算給鑽石、全部持久。
- account/save 純邏輯有測試。全測試綠、瀏覽器實測通過。

## Self-Review
- owned 為單一真實來源(起始4+商城+轉蛋)；loadout 為 owned 子集(上限6)。
- build bar 只列 loadout、全可蓋(移除 requires 閘)；金錢經濟維持現狀。
- 結算 runDiamonds(戰役過關依難度/無盡依波)；持久存 profile。
- 大廳商城/編隊面板沿用 overlay 模式；鑽石即時顯示。
