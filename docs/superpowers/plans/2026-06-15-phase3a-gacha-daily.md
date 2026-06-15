# Phase 3a：轉轉樂 + 每日登入券 + 持久解鎖 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 加入養成核心：每日登入領轉券、轉轉樂抽出並**持久解鎖**龍族/神族傳奇塔(存 localStorage，跨局保留)，附開卡演出與角色設定文案。解鎖後建造列那兩座 🔒 塔變可蓋。

**Architecture:** `saveService` 擴充玩家檔(tickets/unlocked/lastLogin)。`systems/gacha.js` 純函式(抽卡/換日判定，TDD)。main 開局做每日登入給券、把 unlocked 灌進 `state.gachaUnlocked`(既有 isTowerUnlocked 已支援)。轉蛋 UI(topbar 按鈕開 overlay)抽卡→解鎖→存檔→刷新建造列+開卡演出。龍/神塔資料加 `lore` 角色設定。

**Tech Stack:** 同前。瀏覽器遊戲碼可用 `Date`/`Math.random`(僅 workflow 腳本禁用，遊戲碼不受限)。

---

## Task 1：玩家檔存取（saveService 擴充，TDD）

**Files:** Modify `src/services/saveService.js`, `tests/saveService.test.js`

- [ ] **Step 1: 加測試** `tests/saveService.test.js`（沿用既有 fakeStorage）
```js
import { createSaveService } from '../src/services/saveService.js';
// ...既有 best 測試保留...
test('無檔時 loadProfile 給預設', () => {
  const s = createSaveService(fakeStorage());
  const p = s.loadProfile();
  assert.equal(p.tickets, 0);
  assert.deepEqual(p.unlocked, []);
  assert.equal(p.lastLogin, null);
});
test('saveProfile/loadProfile 往返', () => {
  const st = fakeStorage(); const s = createSaveService(st);
  s.saveProfile({ tickets: 2, unlocked: ['dragon_whelp'], lastLogin: '2026-06-15' });
  const p = createSaveService(st).loadProfile();
  assert.equal(p.tickets, 2);
  assert.deepEqual(p.unlocked, ['dragon_whelp']);
  assert.equal(p.lastLogin, '2026-06-15');
});
```
（`fakeStorage` 已在檔案頂部；若無則沿用 best 測試的那個 Map 版本。）

- [ ] **Step 2: 跑測試確認失敗** `cd last-stand && node --test tests/saveService.test.js`

- [ ] **Step 3: 在 `src/services/saveService.js` 加 profile 方法**
檔頂加 `const PROFILE_KEY = 'laststand.profile';`，回傳物件加：
```js
    loadProfile() {
      const raw = storage ? storage.getItem(PROFILE_KEY) : null;
      const def = { tickets: 0, unlocked: [], lastLogin: null };
      if (!raw) return def;
      try { return { ...def, ...JSON.parse(raw) }; } catch { return def; }
    },
    saveProfile(p) { if (storage) storage.setItem(PROFILE_KEY, JSON.stringify(p)); },
```

- [ ] **Step 4: 跑測試確認通過** `node --test tests/saveService.test.js`；`npm test` 全綠

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(save): 玩家檔(tickets/unlocked/lastLogin)存取"`

---

## Task 2：轉蛋與換日邏輯（gacha，TDD）

**Files:** Create `src/systems/gacha.js`, `tests/gacha.test.js`

- [ ] **Step 1: 失敗測試** `tests/gacha.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawGacha, isNewDay, GACHA_POOL } from '../src/systems/gacha.js';

test('轉蛋池為龍與神', () => {
  assert.deepEqual([...GACHA_POOL].sort(), ['divine_temple', 'dragon_whelp']);
});
test('抽出尚未解鎖的塔', () => {
  const r = drawGacha(['dragon_whelp'], () => 0); // 只剩神族
  assert.equal(r.type, 'divine_temple');
  assert.equal(r.dup, false);
});
test('全解鎖則回 dup', () => {
  const r = drawGacha(['dragon_whelp', 'divine_temple'], () => 0);
  assert.equal(r.dup, true);
});
test('換日判定', () => {
  assert.equal(isNewDay(null, '2026-06-15'), true);
  assert.equal(isNewDay('2026-06-14', '2026-06-15'), true);
  assert.equal(isNewDay('2026-06-15', '2026-06-15'), false);
});
```

- [ ] **Step 2: 跑測試確認失敗** `node --test tests/gacha.test.js`

- [ ] **Step 3: 實作 `src/systems/gacha.js`**
```js
export const GACHA_POOL = ['dragon_whelp', 'divine_temple'];

// 抽卡：優先抽未解鎖；全解鎖則回 dup（呼叫端退券）
export function drawGacha(unlocked, rand) {
  const locked = GACHA_POOL.filter(t => !unlocked.includes(t));
  if (locked.length === 0) {
    return { type: GACHA_POOL[Math.floor(rand() * GACHA_POOL.length)], dup: true };
  }
  return { type: locked[Math.floor(rand() * locked.length)], dup: false };
}

export function isNewDay(lastLogin, today) { return lastLogin !== today; }
```

- [ ] **Step 4: 跑測試確認通過** `node --test tests/gacha.test.js`（4）；`npm test` 全綠

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(gacha): 抽卡+換日純函式"`

---

## Task 3：龍/神塔角色設定文案

**Files:** Modify `src/data/towers.js`

- [ ] **Step 1: 加 lore**（在 dragon_whelp / divine_temple 物件內加一欄）
```js
  // dragon_whelp 內：
    lore: '遠古巨龍的幼雛。烈焰吐息焚盡成群之敵，連翱翔天際的飛行單位也無所遁形。',
  // divine_temple 內：
    lore: '神族降臨的聖殿。以神聖審判淨化邪惡，聖光普照之處，黑暗無所容身。',
```

- [ ] **Step 2: Commit** `git add src/data/towers.js && git commit -m "feat(data): 龍/神塔角色設定文案"`

---

## Task 4：每日登入 + 轉蛋 UI + 持久解鎖串接

**Files:** Modify `index.html`, `src/main.js`; Create `src/ui/gacha.js`

- [ ] **Step 1: index.html — topbar 轉蛋鈕 + overlay 容器 + CSS**
topbar 內 mapbar 後加：`<span id="gachabtn"></span>`
stage 內(overlay 後)加：`<div id="gachaoverlay"></div>`
CSS：
```css
  #gachabtn button { margin-left:10px; font-size:13px; padding:3px 10px; cursor:pointer;
                     background:#4a3320; color:#ffe08a; border:1px solid #ffe08a; border-radius:6px; }
  #gachaoverlay { position:absolute; inset:0; background:rgba(0,0,0,.7); display:none;
                  align-items:center; justify-content:center; }
  .gacha-panel { background:#222a3a; padding:28px 36px; border-radius:14px; text-align:center; min-width:300px; }
  .gacha-panel h2 { margin:0 0 8px; }
  .gacha-card { margin:16px auto; padding:18px; border-radius:12px; width:200px; }
  .gacha-roll { margin-top:10px; padding:10px 26px; font-size:16px; cursor:pointer; border:none;
                border-radius:8px; background:#7f77dd; color:#fff; }
  .gacha-roll:disabled { opacity:.5; cursor:default; }
  .gacha-close { display:block; margin:14px auto 0; background:none; border:none; color:#aaa; cursor:pointer; }
```

- [ ] **Step 2: src/ui/gacha.js**
```js
import { TOWERS } from '../data/towers.js';
import { drawGacha, GACHA_POOL } from '../systems/gacha.js';

// 開啟轉蛋面板。deps: { profile, gachaUnlocked, save, onUnlock }
export function openGacha(deps) {
  const ov = document.getElementById('gachaoverlay');
  ov.style.display = 'flex';
  render(ov, deps, null);
}

function render(ov, deps, reveal) {
  const { profile } = deps;
  const allUnlocked = GACHA_POOL.every(t => profile.unlocked.includes(t));
  const canRoll = profile.tickets > 0 && !allUnlocked;
  const card = reveal ? cardHtml(reveal) : '<div class="gacha-card" style="background:#2b3346;color:#888">轉動看看會抽到什麼…</div>';
  ov.innerHTML = `<div class="gacha-panel">
    <h2>🎰 轉轉樂</h2>
    <div>轉券：<b style="color:#ffe08a">${profile.tickets}</b></div>
    ${card}
    <button class="gacha-roll" ${canRoll ? '' : 'disabled'}>${allUnlocked ? '已全部解鎖' : '轉一發 (1券)'}</button>
    <button class="gacha-close">關閉</button>
  </div>`;
  ov.querySelector('.gacha-close').onclick = () => { ov.style.display = 'none'; };
  const roll = ov.querySelector('.gacha-roll');
  if (canRoll) roll.onclick = () => {
    profile.tickets -= 1;
    const res = drawGacha(profile.unlocked, Math.random);
    if (!res.dup) { profile.unlocked.push(res.type); deps.gachaUnlocked.add(res.type); }
    else profile.tickets += 1; // 理論上不會(已擋全解鎖)
    deps.save.saveProfile(profile);
    deps.onUnlock();
    render(ov, deps, res);
  };
}

function cardHtml(res) {
  const def = TOWERS[res.type];
  return `<div class="gacha-card" style="background:${def.color}22;border:2px solid ${def.color}">
    <div style="font-size:34px;color:${def.color}">●</div>
    <h3 style="margin:6px 0;color:${def.color}">${def.name}</h3>
    <div style="font-size:12px;color:#ccc;margin-bottom:8px">${def.lore || ''}</div>
    <div style="color:#ffe08a">${res.dup ? '已擁有' : '✨ 解鎖！'}</div>
  </div>`;
}
```

- [ ] **Step 3: main.js — 開局每日登入給券 + 灌 gachaUnlocked + 轉蛋鈕**
頂部 import：`import { isNewDay } from './systems/gacha.js';`、`import { openGacha } from './ui/gacha.js';`
模組層(boot 前)加：
```js
const profile = save.loadProfile();
const gachaUnlocked = new Set(profile.unlocked);
const today = new Date().toISOString().slice(0, 10);
if (isNewDay(profile.lastLogin, today)) { profile.tickets += 1; profile.lastLogin = today; save.saveProfile(profile); }
```
`createGameState(currentMap)` 之後(boot 與 restart 都要)設定：`state.gachaUnlocked = gachaUnlocked;`
轉蛋鈕初始化函式：
```js
function initGachaButton() {
  const bar = document.getElementById('gachabtn');
  bar.innerHTML = '';
  const b = document.createElement('button');
  b.textContent = '🎰 轉蛋 (' + profile.tickets + '券)';
  b.onclick = () => openGacha({ profile, gachaUnlocked, save, onUnlock: () => { refreshBuildLocks(state); initGachaButton(); } });
  bar.appendChild(b);
}
```
`boot()` 內 `loop.start()` 前呼叫 `initGachaButton();`

- [ ] **Step 4: 驗證** `npm test` 全綠；`node --check` 改動檔；控制器瀏覽器實測。

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(gacha): 每日登入給券 + 轉蛋UI開卡 + 持久解鎖龍神塔"`

---

## Task 5：瀏覽器實測（控制器）
- [ ] 開局有「🎰 轉蛋 (N券)」鈕；首次登入給 1 券。
- [ ] 點轉蛋 → 開面板 → 轉一發 → 開卡演出顯示龍/神塔卡+角色設定文案+「✨解鎖！」。
- [ ] 解鎖後建造列對應塔(龍族幼龍/神族聖殿)從「🔒轉蛋解鎖」變可蓋。
- [ ] 重整頁面後解鎖仍在(持久)、轉券數正確、同日不重複發券。

## 完成定義（Phase 3a Done）
- 每日登入給轉券、轉轉樂抽卡開卡、持久解鎖龍/神傳奇塔、建造列即時反映。
- gacha/save 純邏輯有單元測試。全測試綠、瀏覽器實測+持久性通過。

## Self-Review
- 解鎖走既有 `isTowerUnlocked(type, towers, gachaUnlocked)`：state.gachaUnlocked 由持久 profile 灌入，跨局/重整保留。
- 每日登入用日期字串比較(isNewDay)，首登(null)即給券；同日不重發。
- 全解鎖時轉鈕禁用、不浪費券；dup 退券為保險。
- 開卡演出顯示 lore(角色設定)，奠定 Phase 3b 圖鑑基礎。
