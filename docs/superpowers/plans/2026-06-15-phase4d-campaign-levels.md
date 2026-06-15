# Phase 4d：13 關章節副本（七情篇＋六慾篇） — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 把戰役做成 13 關章節副本：七情篇 7 關 + 六慾篇 6 關，每關固定一個情慾 Boss、固定波數/地圖，破關得鑽石並解鎖下一關。大廳戰役改為關卡選擇（章節→關卡，鎖定/已過/獎勵）。無盡模式不變。

**Architecture:** `data/levels.js` 13 關資料(章節/名/boss/波數/地圖/鑽石)。`systems/campaign.js` 純函式：`campaignWave(level, wave, hpMult)`(主題小怪+末波該情慾 boss)、`isLevelUnlocked(idx, cleared)`、`levelReward`。saveService profile 加 `cleared`(已過關卡 id)。大廳戰役改關卡選擇面板。main 依選關設 state(boss/波數/地圖)，破關記 cleared+給鑽石+解鎖下一關。

**Tech Stack:** 同前。

---

## Task 1：關卡資料 + campaign 純邏輯（TDD）

**Files:** Create `src/data/levels.js`, `src/systems/campaign.js`, `tests/campaign.test.js`

- [ ] **Step 1: data/levels.js**（13 關；map 用 'map1'/'map2' 代號）
```js
export const CHAPTERS = [
  { id: 'seven', name: '七情篇', levels: [
    { id: 's0', name: '嗔怒', boss: 'emo_nu',  waves: 8,  map: 'map1', diamond: 30 },
    { id: 's1', name: '悲哀', boss: 'emo_ai',  waves: 9,  map: 'map1', diamond: 35 },
    { id: 's2', name: '恐懼', boss: 'emo_ju',  waves: 10, map: 'map2', diamond: 40 },
    { id: 's3', name: '執愛', boss: 'emo_aii', waves: 11, map: 'map1', diamond: 45 },
    { id: 's4', name: '憎惡', boss: 'emo_wu',  waves: 12, map: 'map2', diamond: 55 },
    { id: 's5', name: '狂喜', boss: 'emo_xi',  waves: 13, map: 'map1', diamond: 60 },
    { id: 's6', name: '貪欲', boss: 'emo_yu',  waves: 14, map: 'map2', diamond: 70 },
  ]},
  { id: 'six', name: '六慾篇', levels: [
    { id: 'd0', name: '色慾', boss: 'yu_se',    waves: 12, map: 'map1', diamond: 55 },
    { id: 'd1', name: '聲慾', boss: 'yu_sheng', waves: 13, map: 'map2', diamond: 60 },
    { id: 'd2', name: '香慾', boss: 'yu_xiang', waves: 14, map: 'map1', diamond: 70 },
    { id: 'd3', name: '味慾', boss: 'yu_wei',   waves: 15, map: 'map2', diamond: 80 },
    { id: 'd4', name: '觸慾', boss: 'yu_chu',   waves: 16, map: 'map1', diamond: 95 },
    { id: 'd5', name: '意慾', boss: 'yu_yi',    waves: 18, map: 'map2', diamond: 120 },
  ]},
];
// 扁平順序（解鎖用）
export const LEVEL_ORDER = CHAPTERS.flatMap(c => c.levels.map(l => l.id));
```

- [ ] **Step 2: 失敗測試** `tests/campaign.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaignWave, isLevelUnlocked, levelDiamond } from '../src/systems/campaign.js';
import { CHAPTERS, LEVEL_ORDER } from '../src/data/levels.js';

const lvl = CHAPTERS[0].levels[0]; // 嗔怒 emo_nu waves8

test('末波生出該關情慾 boss', () => {
  const wave = campaignWave(lvl, lvl.waves, 1);
  assert.ok(wave.some(e => e.type === 'emo_nu' && e.boss));
});
test('非末波無 boss', () => {
  assert.ok(!campaignWave(lvl, 1, 1).some(e => e.boss));
});
test('hpMult 縮放', () => {
  const a = campaignWave(lvl, 1, 1)[0].hp;
  const b = campaignWave(lvl, 1, 2)[0].hp;
  assert.equal(b, a * 2);
});
test('第一關預設解鎖，後續需前一關已過', () => {
  assert.equal(isLevelUnlocked(0, []), true);
  assert.equal(isLevelUnlocked(1, []), false);
  assert.equal(isLevelUnlocked(1, [LEVEL_ORDER[0]]), true);
});
test('levelDiamond 回該關鑽石', () => {
  assert.equal(levelDiamond(lvl), 30);
});
```

- [ ] **Step 3: 跑測試確認失敗** `cd last-stand && node --test tests/campaign.test.js`

- [ ] **Step 4: 實作 `src/systems/campaign.js`**
```js
import { ENEMIES } from '../data/enemies.js';
import { BALANCE } from '../data/balance.js';
import { LEVEL_ORDER } from '../data/levels.js';

const E = BALANCE.endless;
const MINIONS = ['xinmo', 'zhizhang', 'yuanhun', 'yunian'];

function scaled(wave, typeKey) {
  const def = ENEMIES[typeKey];
  const hp = Math.round(E.hpBase * def.hpMult * Math.pow(E.hpGrowth, wave - 1));
  const speed = E.speedBase * def.speedMult * Math.pow(E.speedGrowthPer5, Math.floor((wave - 1) / 5));
  const bounty = Math.round(E.bountyBase * def.bountyMult * (1 + (wave - 1) * 0.05));
  return { hp, speed, bounty };
}

// 關卡波：主題小怪；末波加該關情慾 boss
export function campaignWave(level, wave, hpMult = 1) {
  const count = E.baseCount + (wave - 1) * E.countPerWave;
  const list = [];
  for (let i = 0; i < count; i++) {
    const typeKey = MINIONS[(wave - 1 + i) % MINIONS.length];
    const s = scaled(wave, typeKey);
    const hp = Math.round(s.hp * hpMult);
    list.push({ type: typeKey, armorType: ENEMIES[typeKey].armorType, hp, maxHp: hp, speed: s.speed, bounty: s.bounty, boss: false });
  }
  if (wave >= level.waves) {
    const b = ENEMIES[level.boss];
    const s = scaled(wave, level.boss);
    const hp = Math.round(s.hp * E.bossHpMult * hpMult);
    list.push({ type: level.boss, armorType: b.armorType, hp, maxHp: hp, speed: s.speed,
      bounty: Math.round(s.bounty * E.bossBountyMult), boss: true, ability: b.ability || null });
  }
  return list;
}

export function isLevelUnlocked(idx, cleared) {
  if (idx <= 0) return true;
  return cleared.includes(LEVEL_ORDER[idx - 1]);
}

export function levelDiamond(level) { return level.diamond; }
```

- [ ] **Step 5: 跑測試確認通過** `node --test tests/campaign.test.js`（5）；`npm test` 全綠

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(campaign): 13關章節資料 + campaignWave/解鎖/獎勵 純邏輯"`

---

## Task 2：saveService cleared + main 選關/破關串接

**Files:** Modify `src/services/saveService.js`, `tests/saveService.test.js`, `src/state/gameState.js`, `src/main.js`

- [ ] **Step 1: saveService profile 加 cleared**（loadProfile def 加 `cleared: []`；測試補一條 default 含 cleared:[]）

- [ ] **Step 2: gameState.js — createGameState opts 帶 level**
opts 支援 `level`(關卡物件)；campaign 時 `totalWaves = opts.totalWaves`（由 level.waves 傳入）。新增 `level: opts.level || null`。

- [ ] **Step 3: main.js — 選關進場 + campaignWave + 破關記錄解鎖**
import：`import { campaignWave } from './systems/campaign.js';`、`import { LEVEL_ORDER, CHAPTERS } from './data/levels.js';`
模組層加 `let currentLevel = null;`（選關時設定）。
`maybeStartWave(s)`：若 `s.mode === 'campaign' && s.level`，用 `campaignWave(s.level, s.wave, s.hpMult)` 取代 `buildWave`：
```js
  s.spawnQueue = s.level ? campaignWave(s.level, s.wave, s.hpMult) : buildWave(s.wave, s.hpMult);
```
`gameOpts()` campaign 分支改用 currentLevel：
```js
  return { mode: 'campaign', difficulty: currentDifficulty, hpMult: BALANCE.campaign.difficulty[currentDifficulty],
    totalWaves: currentLevel.waves, level: currentLevel, mapKey: currentLevel.map };
```
地圖依關卡：startRun 用 `currentMap = (currentLevel && currentLevel.map === 'map2') ? MAP2 : MAP1`（或 endless 用選的 currentMap）。最簡：在 startRun 開頭 `const map = (currentMode==='campaign' && currentLevel) ? (currentLevel.map==='map2'?MAP2:MAP1) : currentMap;` 並 `createGameState(map, gameOpts())`。
破關(victory)處：除既有結算外，記錄 cleared + 給該關鑽石：
```js
    if (s.level && !profile.cleared.includes(s.level.id)) profile.cleared.push(s.level.id);
    profile.diamonds += s.level ? s.level.diamond : 0; save.saveProfile(profile);
```
（注意：campaign 的 awardDiamonds 改為用 level.diamond；可在 victory 區塊直接加並存檔，移除原 runDiamonds 對 campaign 的計算，或讓 runDiamonds campaign 分支改吃 level.diamond。最簡：victory 區塊自行加 level.diamond 並 saveProfile，傳給 showVictory 顯示。）

- [ ] **Step 4: 驗證** `npm test` 全綠；`node --check`。

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(campaign): 選關進場(boss/波數/地圖) + 破關記cleared+給關卡鑽石"`

---

## Task 3：大廳戰役關卡選擇面板

**Files:** Create `src/ui/levelSelect.js`; Modify `index.html`, `src/main.js`

- [ ] **Step 1: index.html — 大廳戰役關卡選擇 overlay + CSS**
stage 內加 `<div id="leveloverlay"></div>`。CSS 沿用 overlay/卡片：
```css
  #leveloverlay { position:absolute; inset:0; background:rgba(0,0,0,.85); display:none; align-items:center; justify-content:center; z-index:6; }
  .lvl-panel { background:#1f2632; padding:22px 26px; border-radius:14px; max-width:720px; max-height:90%; overflow:auto; }
  .lvl-chapter { color:#ffd973; margin:14px 0 6px; }
  .lvl-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
  .lvl-card { background:#2a3340; border-radius:10px; padding:10px; font-size:12px; text-align:center; cursor:pointer; }
  .lvl-card.locked { opacity:.4; cursor:default; }
  .lvl-card.cleared { border:2px solid #5fd35f; }
```

- [ ] **Step 2: src/ui/levelSelect.js**
```js
import { CHAPTERS, LEVEL_ORDER } from '../data/levels.js';
import { isLevelUnlocked } from '../systems/campaign.js';

export function openLevelSelect(profile, onPick) {
  const ov = document.getElementById('leveloverlay');
  let html = '<div class="lvl-panel"><h2>⚔️ 戰役 · 淨化心魔</h2>';
  for (const ch of CHAPTERS) {
    html += `<div class="lvl-chapter">${ch.name}</div><div class="lvl-grid">`;
    for (const lv of ch.levels) {
      const idx = LEVEL_ORDER.indexOf(lv.id);
      const unlocked = isLevelUnlocked(idx, profile.cleared);
      const cleared = profile.cleared.includes(lv.id);
      html += `<div class="lvl-card ${unlocked ? '' : 'locked'} ${cleared ? 'cleared' : ''}" data-id="${lv.id}">
        <div style="font-size:15px">${cleared ? '✅' : (unlocked ? '⚔️' : '🔒')} ${lv.name}</div>
        <div>${lv.waves}波 · 💎${lv.diamond}</div></div>`;
    }
    html += '</div>';
  }
  html += '<button class="ov-close">關閉</button></div>';
  ov.innerHTML = html; ov.style.display = 'flex';
  ov.querySelector('.ov-close').onclick = () => { ov.style.display = 'none'; };
  ov.querySelectorAll('.lvl-card:not(.locked)').forEach(c => c.onclick = () => {
    const lv = CHAPTERS.flatMap(ch => ch.levels).find(l => l.id === c.dataset.id);
    ov.style.display = 'none'; onPick(lv);
  });
}
```

- [ ] **Step 3: main.js — 戰役按鈕開選關**
import：`import { openLevelSelect } from './ui/levelSelect.js';`
模式選擇器：當選「戰役」時不直接進場，而是開選關面板：把 initModePicker 的「戰役」按鈕 onclick 改為 `currentMode='campaign'; openLevelSelect(profile, lv => { currentLevel = lv; startRun(); }); initModePicker();`。「無盡」維持選地圖+進入副本。
（即：無盡＝大廳選地圖按進入；戰役＝按戰役→跳關卡選擇→選關直接進。難度仍用 currentDifficulty，可在選關面板上方加難度切換或沿用大廳難度鈕。）
進場地圖依 currentLevel.map。

- [ ] **Step 4: 驗證** `npm test` 全綠；`node --check`；控制器實測：大廳按戰役→關卡選擇(七情篇/六慾篇、鎖定/已過/獎勵)→選第一關進場→末波出嗔怒 boss→過關得鑽石+第二關解鎖。

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(campaign): 大廳戰役關卡選擇面板(章節/鎖定/已過/獎勵)"`

---

## 完成定義（Phase 4d Done）
- 戰役＝13 關章節(七情篇7+六慾篇6)，每關固定情慾 boss/波數/地圖，破關得鑽石+解鎖下一關，進度持久。
- 無盡模式不變。campaign 純邏輯有測試。全測試綠、瀏覽器實測通過。

## Self-Review
- campaignWave 末波出該關 boss、帶 ability；hpMult 縮放；解鎖依扁平 LEVEL_ORDER 前一關 cleared。
- profile.cleared 持久；破關給 level.diamond(非 runDiamonds 波數公式)。
- 大廳：無盡走地圖+進入；戰役走關卡選擇；地圖依關卡 map。
- 七情六慾 boss 各帶專屬機制(4c 已實作)，關卡末戰即面對該情慾。
