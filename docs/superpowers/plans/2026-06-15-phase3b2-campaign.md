# Phase 3b-2：戰役關卡模式 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 加入「戰役」模式(與無盡並存)：固定波數(15)、三難度(普通/英雄/地獄縮放怪血)、撐過全波即過關，記錄各地圖×難度最佳通關時間。topbar 可切模式與難度。

**Architecture:** gameState 加 `mode`/`difficulty`/`totalWaves`/`hpMult`/`won`。endlessDirector.buildWave 加 `hpMult` 參數(難度縮放，TDD)。saveService 加戰役最佳時間(取最短，TDD)。main 波次邏輯改 `maybeStartWave`(戰役不超過 totalWaves)+過關判定+勝利畫面+模式/難度選擇器。

**Tech Stack:** 同前。

---

## Task 1：難度縮放 + 戰役最佳時間（TDD）

**Files:** Modify `src/systems/endlessDirector.js`, `src/services/saveService.js`, `tests/endlessDirector.test.js`, `tests/saveService.test.js`

- [ ] **Step 1: 失敗測試**
`tests/endlessDirector.test.js` 末端加：
```js
test('hpMult 縮放怪血', () => {
  const base = buildWave(3)[0].hp;
  const hard = buildWave(3, 2)[0].hp;
  assert.equal(hard, base * 2);
});
```
`tests/saveService.test.js` 加（沿用 fakeStorage）：
```js
test('戰役最佳取最短時間', () => {
  const st = fakeStorage(); const s = createSaveService(st);
  assert.equal(s.getCampaignBest('map1.normal'), null);
  s.submitCampaign('map1.normal', 120);
  s.submitCampaign('map1.normal', 90);
  s.submitCampaign('map1.normal', 150);
  assert.equal(createSaveService(st).getCampaignBest('map1.normal'), 90);
});
```

- [ ] **Step 2: 跑測試確認失敗** `cd last-stand && node --test tests/endlessDirector.test.js tests/saveService.test.js`

- [ ] **Step 3: 實作**
`endlessDirector.js`：`buildWave(wave, hpMult = 1)`，在 `scaledStats` 算出 hp 後乘 hpMult。最小改法：把 `scaledStats(wave, typeKey)` 改為 `scaledStats(wave, typeKey, hpMult)`，內部 `hp = Math.round(... * hpMult)`；buildWave 把 hpMult 傳進每次呼叫(含 boss)。
```js
function scaledStats(wave, typeKey, hpMult) {
  const def = ENEMIES[typeKey];
  const hp = Math.round(E.hpBase * def.hpMult * Math.pow(E.hpGrowth, wave - 1) * hpMult);
  const speed = E.speedBase * def.speedMult * Math.pow(E.speedGrowthPer5, Math.floor((wave - 1) / 5));
  const bounty = Math.round(E.bountyBase * def.bountyMult * (1 + (wave - 1) * 0.05));
  return { hp, speed, bounty };
}
export function buildWave(wave, hpMult = 1) {
  // ...原邏輯，所有 scaledStats(wave, X) 改 scaledStats(wave, X, hpMult)...
}
```
（boss 的 `s.hp * E.bossHpMult` 不變，s.hp 已含 hpMult。）
`saveService.js`：加
```js
    getCampaignBest(key) {
      const raw = storage ? storage.getItem(CAMPAIGN_KEY) : null;
      let all = {};
      if (raw) { try { all = JSON.parse(raw); } catch { all = {}; } }
      return all[key] != null ? all[key] : null;
    },
    submitCampaign(key, time) {
      const raw = storage ? storage.getItem(CAMPAIGN_KEY) : null;
      let all = {};
      if (raw) { try { all = JSON.parse(raw); } catch { all = {}; } }
      if (all[key] == null || time < all[key]) { all[key] = time; storage.setItem(CAMPAIGN_KEY, JSON.stringify(all)); return true; }
      return false;
    },
```
檔頂加 `const CAMPAIGN_KEY = 'laststand.campaign';`

- [ ] **Step 4: 跑測試確認通過**；`npm test` 全綠

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(campaign): 難度hpMult縮放 + 戰役最佳時間存取"`

---

## Task 2：gameState 模式欄位 + main 波次/過關邏輯 + 勝利畫面

**Files:** Modify `src/state/gameState.js`, `src/main.js`, `src/ui/hud.js`, `src/data/balance.js`

- [ ] **Step 1: balance.js 加戰役設定**
```js
  campaign: { totalWaves: 15, difficulty: { normal: 1, hero: 1.7, hell: 2.6 } },
```

- [ ] **Step 2: gameState.js — 加模式欄位（createGameState 簽章加 opts）**
```js
export function createGameState(map, opts = {}) {
  const mode = opts.mode || 'endless';
  return {
    map, mode,
    difficulty: opts.difficulty || 'normal',
    hpMult: opts.hpMult || 1,
    totalWaves: mode === 'campaign' ? (opts.totalWaves || 15) : Infinity,
    won: false,
    // ...原本欄位不變...
    economy: createEconomy({ gold: BALANCE.startGold, lives: BALANCE.startLives }),
    enemies: [], towers: [], projectiles: [],
    buildableCells: computeBuildableCells(map), occupiedCells: new Set(),
    wave: 0, waveTimer: 0, spawnQueue: [], spawnTimer: 0, spawnCount: 0,
    selectedTowerType: null, selectedTower: null,
    now: 0, over: false, started: false,
    spells: createSpellState(), castMode: null,
  };
}
```

- [ ] **Step 3: main.js — maybeStartWave + 過關判定 + 模式/難度選擇器 + 勝利畫面**
`startWave(s)` 改名/改為 `maybeStartWave(s)`：
```js
function maybeStartWave(s) {
  if (s.wave >= s.totalWaves) return false;     // 戰役達標不再開波(無盡為 Infinity 永遠開)
  s.wave += 1;
  s.spawnQueue = buildWave(s.wave, s.hpMult);
  s.spawnTimer = 0;
  s.waveTimer = BALANCE.endless.waveInterval;
  return true;
}
```
`update` 內兩處 `startWave(s)` 改 `maybeStartWave(s)`。在敵人結算之後、死亡判定附近加過關判定：
```js
  // 戰役過關：撐過最後一波且全部清空
  if (s.mode === 'campaign' && !s.over && s.wave >= s.totalWaves
      && s.spawnQueue.length === 0 && s.enemies.every(e => !e.alive) && !s.economy.isDead()) {
    s.over = true; s.won = true;
    const key = campaignKey(s);
    const time = Math.floor(s.economy.elapsed);
    save.submitCampaign(key, time);
    showVictory(s, save.getCampaignBest(key), restart);
  }
```
新增 helper 與 import：
`import { updateHud, showGameOver, showVictory } from './ui/hud.js';`
```js
function campaignKey(s) {
  const name = MAPS.find(m => m.map === s.map)?.name || 'map';
  return name + '.' + s.difficulty;
}
```
模式/難度狀態與 createGameState 串接：頂部加
```js
let currentMode = 'endless';
let currentDifficulty = 'normal';
function gameOpts() {
  if (currentMode !== 'campaign') return { mode: 'endless' };
  return { mode: 'campaign', difficulty: currentDifficulty,
    totalWaves: BALANCE.campaign.totalWaves, hpMult: BALANCE.campaign.difficulty[currentDifficulty] };
}
```
`boot()`/`restart()` 的 `createGameState(currentMap)` 改 `createGameState(currentMap, gameOpts())`；建立後仍設 `state.gachaUnlocked = gachaUnlocked;`。
`maybeStartWave(state)` 取代原 boot/restart 內的 `startWave(state)`。
模式選擇器（重用 topbar，放 mapbar 概念旁）：在 index.html 加 `<span id="modebar"></span>`，main 加
```js
function initModePicker() {
  const bar = document.getElementById('modebar');
  bar.innerHTML = '模式';
  const mk = (label, on) => { const b = document.createElement('button'); b.textContent = label; b.onclick = on; bar.appendChild(b); return b; };
  const endlessB = mk('無盡', () => { currentMode = 'endless'; restart(); initModePicker(); });
  const campB = mk('戰役', () => { currentMode = 'campaign'; restart(); initModePicker(); });
  endlessB.classList.toggle('active', currentMode === 'endless');
  campB.classList.toggle('active', currentMode === 'campaign');
  if (currentMode === 'campaign') {
    ['normal', 'hero', 'hell'].forEach(d => {
      const label = { normal: '普通', hero: '英雄', hell: '地獄' }[d];
      const b = mk(label, () => { currentDifficulty = d; restart(); initModePicker(); });
      b.classList.toggle('active', currentDifficulty === d);
    });
  }
}
```
`boot()` 內呼叫 `initModePicker();`，`restart()` 末端也呼叫 `initModePicker();`。
（沿用既有 `#mapbar button` 的 CSS，給 `#modebar button` 同樣樣式：在 index.html CSS 把選擇器寫成 `#mapbar button, #modebar button { ... }` 與 `.active`。）

- [ ] **Step 4: hud.js — showVictory + HUD 顯示波數上限**
```js
export function showVictory(state, bestTime, onRestart) {
  const el = document.getElementById('overlay');
  const t = Math.floor(state.economy.elapsed);
  el.innerHTML = `<div class="panel">
    <h1>🏆 過關！</h1>
    <p>${state.difficulty === 'hell' ? '地獄' : state.difficulty === 'hero' ? '英雄' : '普通'}難度 · ${state.totalWaves} 波全清</p>
    <p>通關時間 <b>${t}s</b> · ⭐${state.economy.score}</p>
    <p class="best">最佳：${bestTime != null ? bestTime + 's' : t + 's'}</p>
    <button id="restart">再來一局</button></div>`;
  el.style.display = 'flex';
  document.getElementById('restart').onclick = () => { el.style.display = 'none'; onRestart(); };
}
```
`updateHud` 內波數顯示：戰役顯示 `wave/totalWaves`：把 `hud-wave` 設為 `state.mode === 'campaign' ? state.wave + '/' + state.totalWaves : state.wave`。

- [ ] **Step 5: 驗證** `npm test` 全綠；`node --check`；控制器實測：切戰役→選地獄→撐 15 波→過關畫面顯示時間+最佳；切無盡正常無限。

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(campaign): 戰役模式(固定波/難度/過關計時/勝利畫面/模式選擇器)"`

---

## 完成定義（Phase 3b-2 Done）
- 戰役模式固定 15 波、三難度縮放、撐過即過關、記錄各地圖×難度最佳時間、勝利畫面。無盡模式不受影響。
- 難度/最佳時間純邏輯有測試。全測試綠、瀏覽器實測通過。

## Self-Review
- 無盡 totalWaves=Infinity → maybeStartWave 永遠開波，行為不變(回歸)。
- 戰役達標後不開新波；全清且未死→勝利；死亡仍走 showGameOver。
- buildWave(wave, hpMult) 向後相容(預設1)，既有呼叫不變。
- campaignKey = 地圖名×難度；最佳取最短(submitCampaign)。
