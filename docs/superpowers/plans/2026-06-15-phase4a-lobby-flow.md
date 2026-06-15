# Phase 4a：大廳/結算循環 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 把「自動開局、隨時切地圖會重開」改成線上遊戲式循環：**大廳 → 進入副本 → 遊玩 → 結算 → 回大廳**。進入後地圖/模式不可切換（修掉中途切地圖重開的 bug）；結算後按「回大廳」才回選單。

**Architecture:** 新增 `#lobby` DOM 大廳覆蓋層，把模式/地圖/難度選擇與轉蛋/圖鑑/排行按鈕**從 topbar 移進大廳**；topbar 只剩 HUD。main 加 `enterLobby()`(停 loop、顯示大廳、隱藏建造/技能列) 與 `startRun()`(隱藏大廳、建 state、開 loop)。boot 改為先進大廳不自動開局。結算(陣亡/過關)加「回大廳」鈕。

**Tech Stack:** 同前。此為流程/UI 重構，無深邏輯；以瀏覽器實測為主。**遊玩本身需與現狀一致(回歸)。**

---

## Task 1：index.html — 大廳結構 + topbar 瘦身

**Files:** Modify `index.html`

- [ ] **Step 1: topbar 移除選單 span（只留 HUD）**
把 topbar 內的 `<span id="mapbar">`、`<span id="modebar">`、`<span id="gachabtn">`、`<span id="dexbtn">`、`<span id="lbbtn">` 從 topbar **移除**（移到大廳，見下步）。topbar 只留 gold/lives/wave/score/time/hud-next。

- [ ] **Step 2: stage 內新增大廳覆蓋層**（在 #overlay 等之後）
```html
  <div id="lobby">
    <div class="lobby-panel">
      <h1>🏰 守關者 · 大廳</h1>
      <div class="lobby-section"><span class="lobby-label">模式</span><span id="modebar"></span></div>
      <div class="lobby-section"><span class="lobby-label">地圖</span><span id="mapbar"></span></div>
      <button id="enterRun">⚔️ 進入副本</button>
      <div class="lobby-menu">
        <span id="gachabtn"></span><span id="dexbtn"></span><span id="lbbtn"></span>
      </div>
    </div>
  </div>
```

- [ ] **Step 3: CSS（大廳）**
```css
  #lobby { position:absolute; inset:0; background:#1a2030; display:flex;
           align-items:center; justify-content:center; z-index:5; }
  .lobby-panel { background:#222a3a; padding:30px 40px; border-radius:16px; text-align:center; min-width:420px; }
  .lobby-panel h1 { margin:0 0 18px; }
  .lobby-section { display:flex; align-items:center; gap:10px; justify-content:center; margin:10px 0; }
  .lobby-label { color:#9fb0c0; width:48px; text-align:right; }
  #enterRun { margin:18px 0 6px; padding:12px 36px; font-size:18px; cursor:pointer;
              background:#7f77dd; color:#fff; border:none; border-radius:10px; }
  #enterRun:hover { background:#9089e6; }
  .lobby-menu { display:flex; gap:8px; justify-content:center; margin-top:14px; }
```
（`#modebar button, #mapbar button` 既有樣式沿用。）

- [ ] **Step 4: 驗證** `node --check` 不適用 html；以瀏覽器於後續 Task 驗。Commit：`git add index.html && git commit -m "feat(lobby): 大廳結構 + topbar 瘦身為純HUD"`

---

## Task 2：main.js — 大廳/遊玩狀態機 + 結算回大廳

**Files:** Modify `src/main.js`, `src/ui/hud.js`

- [ ] **Step 1: main.js 加狀態機**
保留既有 `currentMode/currentDifficulty/currentMap/gameOpts()/MAPS` 與各 init 函式。新增：
```js
function showInGameUI(show) {
  document.getElementById('buildbar').style.display = show ? 'flex' : 'none';
  document.getElementById('spellbar').style.display = show ? 'flex' : 'none';
}

function enterLobby() {
  if (loop) loop.stop();
  document.getElementById('lobby').style.display = 'flex';
  document.getElementById('overlay').style.display = 'none';
  showInGameUI(false);
  initModePicker(); initMapPicker();   // 重繪大廳選擇器(反映當前選擇)
}

function startRun() {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
  showInGameUI(true);
  state = createGameState(currentMap, gameOpts());
  state.gachaUnlocked = gachaUnlocked;
  initBuildMenu(state); initSpellBar(state, onCast);
  maybeStartWave(state);
  if (!loop) loop = createLoop({ update, render: draw });
  loop.start();
}
```
`restart()`（再來一局）改為呼叫 `startRun()`。
模式/地圖選擇器的按鈕 onclick：**不再 restart()**，只改 `currentMode/currentMap/...` 並重繪選擇器（因為在大廳，按「進入副本」才開局）。即把 initModePicker/initMapPicker 內 `restart(); initXxx();` 改為 `initXxx();`（只更新選取狀態）。
`boot()` 改為：
```js
function boot() {
  loop = createLoop({ update, render: draw });
  initGachaButton(); initDexButton(); initLbButton();
  enterLobby();   // 不自動開局，先進大廳
}
boot();
```
「進入副本」鈕綁定（boot 內或一次性）：
```js
document.getElementById('enterRun').onclick = () => startRun();
```

- [ ] **Step 2: hud.js — 結算加「回大廳」鈕**
`showGameOver` 與 `showVictory` 的按鈕區，除「再來一局」外加「回大廳」。簽章加 `onLobby`：
`showGameOver(state, best, onRestart, onLobby)`、`showVictory(state, bestTime, onRestart, onLobby)`。
按鈕 HTML 加：`<button id="lobby-btn">回大廳</button>`，並綁 `document.getElementById('lobby-btn').onclick = () => { el.style.display='none'; onLobby(); };`
main.js 呼叫處補上 `enterLobby` 作為 onLobby：
- `showGameOver(s, save.getBest(), restart, enterLobby)`
- `showVictory(s, save.getCampaignBest(key), restart, enterLobby)`

- [ ] **Step 3: 驗證** `npm test` 全綠(不應動到測試)；`node --check src/main.js src/ui/hud.js`；控制器瀏覽器實測（見 Task 3）。

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(lobby): 大廳/遊玩狀態機 + 結算回大廳(修中途切地圖重開)"`

---

## Task 3：瀏覽器實測（控制器）
- [ ] 開遊戲 → 看到**大廳**（不自動開局）；選模式/地圖；按「進入副本」→ 開始遊玩、大廳消失、topbar 只剩 HUD。
- [ ] 遊玩中**沒有**地圖/模式鈕可切（修掉中途切換重開的 bug）。
- [ ] 陣亡/過關 → 結算畫面有「再來一局」與「回大廳」；回大廳可重選地圖再進。
- [ ] 大廳可開轉蛋/圖鑑/排行。

## 完成定義（Phase 4a Done）
- 大廳→進副本→遊玩→結算→回大廳循環成立；遊玩中不可切地圖/模式(bug 修復)。
- 遊玩本身與現狀一致(回歸)。全測試綠、瀏覽器實測通過。

## Self-Review
- loop 在大廳 stop、進副本 start；建造/技能列只在遊玩顯示。
- 選擇器移大廳、改為只更新選取(不 restart)；按「進入副本」才建 state 開局。
- 結算兩鈕(再來/回大廳)；回大廳重繪選擇器。
- state.gachaUnlocked 仍在 startRun 設定，編隊/商城留待 4b。
