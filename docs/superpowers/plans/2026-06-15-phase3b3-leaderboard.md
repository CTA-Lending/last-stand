# Phase 3b-3：撐最久榜（本機 + 模擬全球 + VPS 介面） — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 加入「🏆 撐最久榜」：無盡模式的存活波數/時間排名，混入模擬全球榜並標出「你」的名次；另列出戰役各難度最佳時間。以 `LeaderboardService` 介面抽象，之後可一行換成 VPS 遠端實作（真・全球榜）。

**Architecture:** `systems/leaderboard.js` 純函式 `buildEndlessBoard(yourBest, seed)`(合併排序+名次，TDD) + `createLocalLeaderboard(save, seed)`(async getEndlessBoard，模擬未來遠端)。`data/leaderboardSeed.js` 種子假資料。`ui/leaderboard.js` overlay 顯示榜單。main 加 🏆 按鈕。

**Tech Stack:** 同前。本機優先，VPS 為二期(介面已留)。

---

## Task 1：榜單合併排序（TDD）+ 種子資料

**Files:** Create `src/systems/leaderboard.js`, `src/data/leaderboardSeed.js`, `tests/leaderboard.test.js`

- [ ] **Step 1: 失敗測試** `tests/leaderboard.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEndlessBoard } from '../src/systems/leaderboard.js';

const seed = [
  { name: 'Aria', wave: 30, time: 600 },
  { name: 'Borin', wave: 18, time: 320 },
  { name: 'Cyra', wave: 9, time: 140 },
];

test('依波數→時間排序並標名次', () => {
  const board = buildEndlessBoard(null, seed);
  assert.equal(board[0].name, 'Aria');
  assert.equal(board[0].rank, 1);
  assert.equal(board[2].rank, 3);
});
test('插入「你」並標記、排到正確位置', () => {
  const board = buildEndlessBoard({ wave: 20, time: 400 }, seed);
  const me = board.find(r => r.you);
  assert.ok(me);
  assert.equal(me.name, '你');
  assert.equal(me.rank, 2); // 30 > 20 > 18
});
test('同波數比時間(久者前)', () => {
  const board = buildEndlessBoard({ wave: 18, time: 999 }, seed);
  const me = board.find(r => r.you);
  assert.ok(me.rank < board.find(r => r.name === 'Borin').rank); // 999 > 320
});
```

- [ ] **Step 2: 跑測試確認失敗** `cd last-stand && node --test tests/leaderboard.test.js`

- [ ] **Step 3: 實作 `src/systems/leaderboard.js`**
```js
export function buildEndlessBoard(yourBest, seed) {
  const rows = seed.map(e => ({ name: e.name, wave: e.wave, time: e.time, you: false }));
  if (yourBest) rows.push({ name: '你', wave: yourBest.wave, time: yourBest.time, you: true });
  rows.sort((a, b) => b.wave - a.wave || b.time - a.time);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

// 本機+模擬全球實作；未來換成 remote(fetch VPS) 即可，介面不變
export function createLocalLeaderboard(save, seed) {
  return {
    async getEndlessBoard() { return buildEndlessBoard(save.getBest(), seed); },
  };
}
```

- [ ] **Step 4: `src/data/leaderboardSeed.js`**（模擬全球資料，波數遞減）
```js
export const LEADERBOARD_SEED = [
  { name: 'DragonSlayer', wave: 47, time: 980 },
  { name: '守關王', wave: 41, time: 870 },
  { name: 'Aetheris', wave: 36, time: 760 },
  { name: 'NightWarden', wave: 32, time: 690 },
  { name: '炎魔剋星', wave: 28, time: 600 },
  { name: 'Lyra', wave: 24, time: 520 },
  { name: 'IronHold', wave: 21, time: 450 },
  { name: '小白兵', wave: 17, time: 360 },
  { name: 'Pyre', wave: 13, time: 280 },
  { name: 'Newbie42', wave: 8, time: 150 },
];
```

- [ ] **Step 5: 跑測試確認通過** `node --test tests/leaderboard.test.js`（3）；`npm test` 全綠

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(leaderboard): 撐最久榜合併排序 + 模擬全球種子 + 本機service"`

---

## Task 2：排行榜 UI + topbar 按鈕

**Files:** Create `src/ui/leaderboard.js`; Modify `index.html`, `src/main.js`

- [ ] **Step 1: index.html — topbar 按鈕 + overlay + CSS**
topbar 內 dexbtn 後加：`<span id="lbbtn"></span>`
stage 內加：`<div id="lboverlay"></div>`
CSS：
```css
  #lbbtn button { margin-left:8px; font-size:13px; padding:3px 10px; cursor:pointer;
                  background:#2b3346; color:#ffd973; border:1px solid #3d4760; border-radius:6px; }
  #lboverlay { position:absolute; inset:0; background:rgba(0,0,0,.82); display:none;
               align-items:center; justify-content:center; }
  .lb-panel { background:#1f2632; padding:22px 26px; border-radius:14px; min-width:380px; max-height:90%; overflow:auto; }
  .lb-row { display:flex; justify-content:space-between; padding:7px 10px; border-radius:6px; font-size:14px; }
  .lb-row.you { background:#3a3320; color:#ffe08a; font-weight:bold; }
  .lb-rank { width:36px; color:#9fb0c0; }
  .lb-name { flex:1; }
  .lb-sub { color:#9fb0c0; font-size:12px; margin:14px 0 6px; }
  .lb-close { display:block; margin:16px auto 0; background:none; border:none; color:#aaa; cursor:pointer; }
  .lb-note { color:#6f7d8c; font-size:11px; text-align:center; margin-top:10px; }
```

- [ ] **Step 2: src/ui/leaderboard.js**
```js
import { BALANCE } from '../data/balance.js';

const DIFF_LABEL = { normal: '普通', hero: '英雄', hell: '地獄' };

export async function openLeaderboard(service, save, mapNames) {
  const ov = document.getElementById('lboverlay');
  const board = await service.getEndlessBoard();
  const rows = board.map(r => `<div class="lb-row ${r.you ? 'you' : ''}">
    <span class="lb-rank">#${r.rank}</span>
    <span class="lb-name">${r.name}</span>
    <span>第${r.wave}波 · ${r.time}s</span></div>`).join('');
  // 戰役最佳(各地圖×難度)
  let camp = '';
  for (const name of mapNames) for (const d of ['normal', 'hero', 'hell']) {
    const t = save.getCampaignBest(name + '.' + d);
    if (t != null) camp += `<div class="lb-row"><span class="lb-name">${name} · ${DIFF_LABEL[d]}</span><span>${t}s</span></div>`;
  }
  ov.innerHTML = `<div class="lb-panel">
    <h2>🏆 撐最久榜</h2>
    <div class="lb-sub">無盡模式 · 存活波數</div>
    ${rows}
    ${camp ? '<div class="lb-sub">戰役最佳通關</div>' + camp : ''}
    <div class="lb-note">目前為本機＋模擬全球榜；接上伺服器後顯示真實全球排名</div>
    <button class="lb-close">關閉</button></div>`;
  ov.style.display = 'flex';
  ov.querySelector('.lb-close').onclick = () => { ov.style.display = 'none'; };
}
```

- [ ] **Step 3: main.js — service 與 topbar 按鈕**
import：`import { createLocalLeaderboard } from './systems/leaderboard.js';`、`import { LEADERBOARD_SEED } from './data/leaderboardSeed.js';`、`import { openLeaderboard } from './ui/leaderboard.js';`
模組層(boot 前)：`const leaderboard = createLocalLeaderboard(save, LEADERBOARD_SEED);`
按鈕初始化：
```js
function initLbButton() {
  const bar = document.getElementById('lbbtn');
  bar.innerHTML = '';
  const b = document.createElement('button');
  b.textContent = '🏆 排行';
  b.onclick = () => openLeaderboard(leaderboard, save, MAPS.map(m => m.name));
  bar.appendChild(b);
}
```
`boot()` 內呼叫 `initLbButton();`

- [ ] **Step 4: 驗證** `npm test` 全綠；`node --check`；控制器實測：點🏆→看到模擬全球榜，玩過無盡後「你」插入正確名次；戰役過關後顯示該地圖×難度最佳時間；附「本機+模擬」說明。

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(leaderboard): 撐最久榜UI + topbar按鈕"`

---

## 完成定義（Phase 3b-3 Done）
- 🏆 排行開啟顯示無盡撐最久榜(模擬全球+你的名次)與戰役各難度最佳時間。
- 榜單純邏輯有測試。介面 LeaderboardService 預留 VPS 遠端實作。全測試綠、瀏覽器實測通過。
- **VPS 真全球榜為後續外部步驟**(需部署後端到使用者 VPS，提交/查詢改 remote 實作)。

## Self-Review
- buildEndlessBoard 純函式可測；createLocalLeaderboard async 模擬未來遠端，UI await 不需改。
- 「你」由 save.getBest() 注入並標記高亮；戰役最佳讀 save.getCampaignBest。
- 種子資料波數遞減合理；說明文字誠實標示「本機+模擬」。
