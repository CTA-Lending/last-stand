import { sfx, unlockAudio, startAmbient, stopAmbient, setMuted, isMuted } from './render/audio.js';
import { MAP1 } from './data/map1.js';
import { MAP2 } from './data/map2.js';
import { BALANCE } from './data/balance.js';
import { createGameState } from './state/gameState.js';
import { createLoop } from './core/loop.js';
import { render } from './render/renderer.js';
import { loadTowerArt } from './render/towerArt.js';
import { loadEnemyArt } from './render/enemyArt.js';
import { updateParticles, burst, spark, floatText, flash, motes, screenFlash, shockwave } from './render/particles.js';
import { buildWave, minionSpec, endlessProgress } from './systems/endlessDirector.js';
import { applyEnemyAbilities } from './systems/enemyAbility.js';
import { spawnEnemy, updateEnemy } from './entities/enemy.js';
import { buildTower, updateTower } from './entities/tower.js';
import { updateBlocking } from './systems/blocking.js';
import { applyAuras } from './systems/aura.js';
import { updateMines } from './systems/mines.js';
import { updateProjectile } from './entities/projectile.js';
import { createSaveService } from './services/saveService.js';
import { updateHud, showGameOver, showVictory } from './ui/hud.js';
import { initBuildMenu, showTowerPanel, refreshBuildButtons, refreshBuildAfford } from './ui/buildMenu.js';
import { dist } from './core/geometry.js';
import { cellOf, cellKey, cellCenter, nearestPointOnPath, pathSlots } from './systems/grid.js';
import { TOWERS } from './data/towers.js';
import { tickSpells, trigger, isReady, SPELLS } from './systems/spells.js';
import { initSpellBar, refreshSpellBar } from './ui/spellBar.js';
import { computeDamage } from './systems/combat.js';
import { isNewDay } from './systems/gacha.js';
import { openGacha } from './ui/gacha.js';
import { openCollection } from './ui/collection.js';
import { createLocalLeaderboard } from './systems/leaderboard.js';
import { LEADERBOARD_SEED } from './data/leaderboardSeed.js';
import { openLeaderboard } from './ui/leaderboard.js';
import { runDiamonds, campaignReward } from './systems/account.js';
import { openShop } from './ui/shop.js';
import { openLoadout } from './ui/loadout.js';
import { campaignWave } from './systems/campaign.js';
import { CHAPTERS, LEVEL_ORDER } from './data/levels.js';
import { TERRAINS } from './data/terrains.js';
import { openLevelSelect } from './ui/levelSelect.js';
import { openGuide } from './ui/guide.js';
import { initAuth, isAuthEnabled, signIn, logout } from './auth/login.js';
import { loadCloudProfile, pushCloudProfile, submitCloudScore, fetchAppConfig } from './auth/cloud.js';
import { GAME_CONFIG } from './data/config.js';
import { icon } from './ui/icons.js';

const MAPS = [ { name: '森林小徑', map: MAP1 }, { name: '雙叉路口', map: MAP2 } ];
// 大廳功能鈕統一加圖標（取代 emoji）
function btnLabel(name, text) { return icon(name, 15) + ' ' + text; }
let currentMap = MAP1;
let currentMode = 'endless';
let currentDifficulty = 'normal';
let currentLevel = null;

function gameOpts() {
  if (currentMode !== 'campaign') return { mode: 'endless' };
  return { mode: 'campaign', difficulty: currentDifficulty,
    totalWaves: currentLevel ? currentLevel.waves : BALANCE.campaign.totalWaves,
    hpMult: BALANCE.campaign.difficulty[currentDifficulty],
    level: currentLevel };
}

function campaignKey(s) {
  const name = MAPS.find(m => m.map === s.map)?.name || 'map';
  return name + '.' + s.difficulty;
}

function awardDiamonds(s) {
  const floor = s.mode === 'campaign' ? 0 : endlessProgress(s.wave).floor;
  const gained = runDiamonds({ mode: s.mode, won: s.won, difficulty: s.difficulty, wave: s.wave, floor, levelDiamond: s.level ? s.level.diamond : 30 });
  profile.diamonds += gained; save.saveProfile(profile);
  return gained;
}

// 無盡成績：含層數/輪數（記錄「最多打到第幾層」）
function endlessRecord(s) {
  const p = endlessProgress(s.wave);
  return { wave: s.wave, time: Math.floor(s.economy.elapsed), score: s.economy.score,
    floor: p.floor, round: p.round, layer: p.layer };
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const baseSave = createSaveService();
// 包裝：存檔/提交成績時同步到雲端(登入才生效，未登入 no-op)
const save = Object.assign({}, baseSave, {
  saveProfile(p) { baseSave.saveProfile(p); pushCloudProfile(p); },
  submit(rec) { const r = baseSave.submit(rec); submitCloudScore(rec); return r; },
});
const leaderboard = createLocalLeaderboard(save, LEADERBOARD_SEED);
const mouse = { x: 0, y: 0 };
let state, loop;

const profile = save.loadProfile();
const gachaUnlocked = new Set(profile.owned);
const today = new Date().toISOString().slice(0, 10);
if (isNewDay(profile.lastLogin, today)) { profile.tickets += 1; profile.lastLogin = today; save.saveProfile(profile); }

// ── 防沉迷：每日遊玩上限（分鐘可調，0=不限制；只計副本內實際遊玩，暫停不計）──
let _playLimitSec = (GAME_CONFIG.dailyPlayLimitMin || 0) * 60; // 可被後台遠端設定覆蓋
const PT_KEY = 'laststand.playtime';
function loadPtSec() {
  try { const r = JSON.parse(localStorage.getItem(PT_KEY) || '{}'); if (r.date === today) return r.sec || 0; } catch {}
  return 0;
}
let _ptSec = loadPtSec(), _ptAcc = 0;
function addPlaytime(dt) {
  _ptSec += dt; _ptAcc += dt;
  if (_ptAcc >= 2) { _ptAcc = 0; try { localStorage.setItem(PT_KEY, JSON.stringify({ date: today, sec: Math.floor(_ptSec) })); } catch {} }
}
function playLimitReached() { return _playLimitSec > 0 && _ptSec >= _playLimitSec; }
function limitMin() { return Math.round(_playLimitSec / 60); }
function remainPlayMin() { return Math.ceil(Math.max(0, _playLimitSec - _ptSec) / 60); }

// 後台遠端設定：套用每日上限（全玩家下次開即生效）
async function applyRemoteConfig() {
  try {
    const cfg = await fetchAppConfig();
    if (cfg && typeof cfg.dailyPlayLimitMin === 'number') {
      _playLimitSec = Math.max(0, cfg.dailyPlayLimitMin) * 60;
      refreshLobbyInfo();
    }
  } catch {}
}

function showPlayLimit() {
  const el = document.getElementById('overlay');
  el.innerHTML = `<div class="panel">
    <h1>⏰ 今日遊玩已達上限</h1>
    <p>為了健康，每天最多遊玩 <b>${limitMin()} 分鐘</b>。</p>
    <p>今天先休息，明天再來守關吧！</p>
    <button id="lobby-btn">回大廳</button></div>`;
  el.style.display = 'flex';
  document.getElementById('lobby-btn').onclick = () => { el.style.display = 'none'; enterLobby(); };
}

function initDexButton() {
  const bar = document.getElementById('dexbtn');
  bar.innerHTML = '';
  const b = document.createElement('button');
  b.innerHTML = btnLabel('book', '圖鑑');
  b.onclick = () => openCollection(gachaUnlocked);
  bar.appendChild(b);
}

// Google 登入（沿用 CTA 會員系統）：enabled 後在大廳顯示登入鈕/登入狀態
function setupLogin() {
  const slot = document.getElementById('loginslot');
  if (!slot) return;
  const paint = (user) => {
    if (user) {
      slot.innerHTML = `<span class="li-name">已登入 <b>${user.name}</b></span> <button class="li-btn" id="li-logout">登出</button>`;
      const lo = document.getElementById('li-logout');
      if (lo) lo.onclick = () => logout();
      if (_syncedUid !== user.uid) { _syncedUid = user.uid; syncCloud(); } // 首次登入該帳號 → 同步雲端進度
    } else if (isAuthEnabled()) {
      slot.innerHTML = '<button class="li-btn li-google" id="li-login">用 Google 登入</button><span class="li-hint">選填 · 雲端存進度；不登入也能直接玩</span>';
      const li = document.getElementById('li-login');
      if (li) li.onclick = () => signIn();
    } else {
      _syncedUid = null;
      slot.innerHTML = '';
    }
  };
  initAuth(paint).then(applyRemoteConfig); // 啟動後讀後台遠端設定(每日上限)
}

let _syncedUid = null;
// 登入後：把雲端進度合併進本機(取較佳)，再推回雲端
async function syncCloud() {
  try {
    const c = await loadCloudProfile();
    if (c) {
      profile.diamonds = Math.max(profile.diamonds || 0, c.diamonds || 0);
      profile.tickets = Math.max(profile.tickets || 0, c.tickets || 0);
      profile.owned = [...new Set([...(profile.owned || []), ...(c.owned || [])])];
      if (c.loadout && c.loadout.length) profile.loadout = c.loadout.filter(t => profile.owned.includes(t));
      profile.cleared = [...new Set([...(profile.cleared || []), ...(c.cleared || [])])];
      profile.seenTutorial = profile.seenTutorial || c.seenTutorial;
      for (const t of profile.owned) gachaUnlocked.add(t);
      baseSave.saveProfile(profile);
      refreshLobbyInfo(); initGachaButton();
    }
    pushCloudProfile(profile); // 首登或合併後推上雲端
  } catch (e) { console.warn('[cloud] 同步失敗', e); }
}

function initGuideButton() {
  const bar = document.getElementById('guidebtn');
  if (!bar) return;
  bar.innerHTML = '';
  const b = document.createElement('button');
  b.innerHTML = btnLabel('info', '攻略');
  b.onclick = () => openGuide();
  bar.appendChild(b);
}

function initLbButton() {
  const bar = document.getElementById('lbbtn');
  bar.innerHTML = '';
  const b = document.createElement('button');
  b.innerHTML = btnLabel('trophy', '排行');
  b.onclick = () => openLeaderboard(leaderboard, save, MAPS.map(m => m.name));
  bar.appendChild(b);
}

function initGachaButton() {
  const bar = document.getElementById('gachabtn');
  bar.innerHTML = '';
  const b = document.createElement('button');
  b.innerHTML = btnLabel('ticket', '轉蛋 (' + profile.tickets + '券)');
  b.onclick = () => openGacha({ profile, gachaUnlocked, save, onUnlock: () => { initGachaButton(); } });
  bar.appendChild(b);
}

function showWaveBanner(s) {
  const el = document.getElementById('wavebanner');
  if (!el) return;
  const isBossWave = s.mode === 'campaign'
    ? (s.level && s.wave >= s.totalWaves)
    : (s.wave % BALANCE.endless.bossEvery === 0);
  let text = '第 ' + s.wave + ' 波';
  if (isBossWave) {
    const bossName = s.mode === 'campaign'
      ? '首領'
      : endlessProgress(s.wave).name;   // 無盡：顯示當前情慾王名
    text = '⚠ 首領 · ' + bossName;
  }
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('show');
}

function maybeStartWave(s) {
  if (s.wave >= s.totalWaves) return false;     // 戰役達標不再開波(無盡為 Infinity 永遠開)
  s.wave += 1;
  s.spawnQueue = (s.mode === 'campaign' && s.level)
    ? campaignWave(s.level, s.wave, s.hpMult)
    : buildWave(s.wave, s.hpMult);
  if (s.mode !== 'campaign') setRunTitle(); // 無盡：每波更新「第R輪 第L層」
  s.spawnTimer = 0;
  s.waveTimer = BALANCE.endless.waveInterval;
  sfx.wave();
  showWaveBanner(s);
  return true;
}

function update(dt) {
  const s = state;
  if (s.over) return;
  // 防沉迷：累計實際遊玩時間，達 2 小時上限即結束本局
  addPlaytime(dt);
  if (playLimitReached()) { s.over = true; showPlayLimit(); return; }
  if (s.hitStop > 0) { s.hitStop -= dt; return; }
  s.now += dt;
  s.shake *= 0.86; if (s.shake < 0.3) s.shake = 0;
  tickSpells(s.spells, dt);
  s.economy.tick(dt);

  // 生怪排程
  s.waveTimer -= dt;
  if (s.spawnQueue.length === 0 && s.enemies.every(e => !e.alive) && s.waveTimer <= 0) maybeStartWave(s);
  if (s.spawnQueue.length > 0) {
    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) {
      const pi = s.spawnCount % s.map.paths.length;
      s.enemies.push(spawnEnemy(s.spawnQueue.shift(), s.map, pi));
      s.spawnCount++;
      s.spawnTimer = BALANCE.endless.spawnGap;
    }
  }
  if (s.waveTimer <= 0 && s.spawnQueue.length === 0) maybeStartWave(s);

  for (const t of s.towers) { t.debuffRate = 1; t.feared = false; }
  applyAuras(s.towers);
  applyEnemyAbilities({
    enemies: s.enemies, towers: s.towers, economy: s.economy,
    spawnMinion: (from, minionType) => {
      const spec = minionSpec(s.wave, minionType);
      const m = spawnEnemy(spec, s.map, from.pathIndex);
      m.x = from.x; m.y = from.y; m.seg = from.seg;
      s.enemies.push(m);
    },
    onAbility: (e, type) => {
      const label = { enrage: '狂怒!', goldSteal: '貪婪!', summon: '召喚!' }[type];
      if (label) {
        floatText(e.x, e.y - e.radius - 10, label, '#ff7a4a', 16);
        flash(e.x, e.y, '#ff7a4a', 20);
      }
    },
  }, dt);
  const prevProjLen = s.projectiles.length;
  for (const t of s.towers) {
    if (t.kind === 'barracks') updateBlocking(t, s.enemies, dt, s.now);
    else if (t.kind === 'banner') { /* 不開火，光環已套 */ }
    else if (t.kind === 'mine') { for (const d of updateMines(t, s.enemies, dt)) burst(d.x, d.y, '#ffb13a', 18); }
    else updateTower(t, s.enemies, s.projectiles, dt);
  }
  if (s.projectiles.length > prevProjLen) sfx.fire();
  for (let k = prevProjLen; k < s.projectiles.length; k++) flash(s.projectiles[k].x, s.projectiles[k].y, s.projectiles[k].color, 7);
  for (const t of s.towers) if (t.recoil > 0) t.recoil -= dt * 6;
  // 塔升級需要時間：倒數結束才套用新等級
  for (const t of s.towers) if (t.upgrading > 0) {
    t.upgrading -= dt;
    if (t.upgrading <= 0) {
      t.upgrading = 0;
      const apply = t._upApply; t._upApply = null;
      if (apply) {
        apply(); burst(t.x, t.y, '#ffe09a', 14); flash(t.x, t.y, '#ffe09a', 18);
        if (s.selectedTower === t) showTowerPanel(s); // 升級完成 → 刷新面板，不再卡「升級中」
      }
    }
  }
  for (let i = s.projectiles.length - 1; i >= 0; i--) {
    const p = s.projectiles[i];
    const hit = updateProjectile(p, s.enemies, dt, s.now);
    if (hit) {
      sfx.hit();
      if (hit.nodes && hit.nodes.length > 1) {
        for (let n = 1; n < hit.nodes.length; n++)
          spark(hit.nodes[n - 1].x, hit.nodes[n - 1].y, hit.nodes[n].x, hit.nodes[n].y, p.color);
      }
      burst(hit.x, hit.y, p.color, 7);
      floatText(hit.x, hit.y - 6, '' + Math.round(p.damage), p.color, Math.min(22, 12 + p.damage * 0.06));
      flash(hit.x, hit.y, p.color, 16);
      if (p.damage > 80) s.hitStop = Math.max(s.hitStop, 0.02);
    }
    if (!p.alive) s.projectiles.splice(i, 1);
  }
  for (const e of s.enemies) {
    const wasAlive = e.alive;
    updateEnemy(e, s.map, dt, s.now);
    if (wasAlive && !e.alive) {
      e.deathT = 0.14;
      if (e.reachedEnd) {
        s.economy.loseLife(1);
        s.shake = 4;
        screenFlash('#e0405a', 0.22);
        sfx.leak();
      } else {
        s.economy.earn(e.bounty); s.economy.addScore(e.boss ? 100 : 10);
        burst(e.x, e.y, e.color, e.boss ? 28 : 12);
        if (e.boss) {
          // Boss 死 = 全場淨化高潮（效果分級：全屏閃白只給 Boss）
          s.shake = 10; flash(e.x, e.y, e.color, 30);
          shockwave(e.x, e.y, '#ffe79a', 72);
          motes(e.x, e.y); motes(e.x, e.y);
          screenFlash('#fff', 0.12);
          s.hitStop = 0.07;
          sfx.boss();
        } else {
          motes(e.x, e.y);
          sfx.kill();
        }
      }
    }
  }
  for (const e of s.enemies) if (!e.alive && e.deathT > 0) e.deathT -= dt;
  for (const e of s.enemies) if (e.alive && e.spawnT > 0) e.spawnT -= dt;
  s.enemies = s.enemies.filter(e => e.alive || e.hitFlash > 0 || e.deathT > 0);
  updateParticles(dt);

  // 戰役過關：撐過最後一波且全部清空
  if (s.mode === 'campaign' && !s.over && s.wave >= s.totalWaves
      && s.spawnQueue.length === 0 && s.enemies.every(e => !e.alive) && !s.economy.isDead()) {
    s.over = true; s.won = true;
    sfx.win();
    const key = campaignKey(s);
    const time = Math.floor(s.economy.elapsed);
    save.submitCampaign(key, time);
    let dia;
    if (s.level) {
      // 章節關卡：獎勵固定鑽石、記錄通關、解鎖下一關
      if (!profile.cleared.includes(s.level.id)) profile.cleared.push(s.level.id);
      dia = campaignReward(s.level.diamond, s.difficulty); // 難度倍率：普通×1/英雄×2/地獄×3.5
      profile.diamonds += dia;
      save.saveProfile(profile);
    } else {
      dia = awardDiamonds(s);
    }
    showVictory(s, save.getCampaignBest(key), restart, enterLobby, dia);
  }

  if (s.economy.isDead() && !s.over) {
    s.over = true;
    if (s.mode !== 'campaign') save.submit(endlessRecord(s)); // 無盡才記排行
    const dia = awardDiamonds(s);
    showGameOver(s, save.getBest(), restart, enterLobby, dia);
  }
}

function draw() {
  render(ctx, state, mouse);
  updateHud(state);
  refreshSpellBar(state);
  refreshBuildAfford(state);
}

// 滑鼠 + 觸控統一用 Pointer Events。
// canvas 在手機上以 CSS 等比縮放，座標必須換算回內部解析度(800×480)，否則點擊會偏。
function setPointer(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
  mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
}
canvas.addEventListener('pointermove', e => { setPointer(e); });
canvas.addEventListener('pointerdown', e => {
  // 觸控無 hover：按下即把塔/法術預覽定位到手指處，並擋掉頁面捲動與雙指縮放
  setPointer(e);
  if (isInRun() && (state.selectedTowerType || state.castMode)) e.preventDefault();
}, { passive: false });

function onCast(key) {
  const s = state;
  if (s.over) return;
  const def = SPELLS[key];
  if (!isReady(s.spells, key)) return;
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
  screenFlash('#bfe9ff', 0.3);
  shockwave(s.map.width / 2, s.map.height / 2, '#bfe9ff', 260);
  s.shake = 6;
  sfx.frost();
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
  // Extra staggered bursts for drama
  for (let i = 0; i < 4; i++) {
    const ox = (Math.random() * 2 - 1) * def.radius * 0.7;
    const oy = (Math.random() * 2 - 1) * def.radius * 0.7;
    burst(x + ox, y + oy, '#ff7a2f', 14);
  }
  screenFlash('#ff7a2f', 0.18);
  shockwave(x, y, '#ff7a2f', def.radius * 1.5);
  s.shake = 5;
  sfx.firerain();
  s.castMode = null;
}

canvas.addEventListener('pointerup', () => {
  const s = state;
  if (!s || !isInRun()) return;
  if (s.castMode === 'firerain') { castFireRain(s, mouse.x, mouse.y); return; }
  // 點到已有塔 → 選取
  const hitTower = s.towers.find(t => dist(t.x, t.y, mouse.x, mouse.y) < 16);
  if (hitTower && !s.selectedTowerType) {
    s.selectedTower = hitTower; showTowerPanel(s); return;
  }
  // 建塔：點哪格蓋哪格（非走道、未佔用、一格一塔）
  if (s.selectedTowerType) {
    const { col, row } = cellOf(mouse.x, mouse.y, s.map.tile);
    const key = cellKey(col, row);
    if (s.buildableCells.has(key) && !s.occupiedCells.has(key)) {
      const cost = TOWERS[s.selectedTowerType].levels[0].cost;
      if (s.economy.gold < cost) { floatText(mouse.x, mouse.y, '金幣不足', '#e0668a', 14); return; }
      if (s.economy.spend(cost)) {
        const c = cellCenter(col, row, s.map.tile);
        const t = buildTower(s.selectedTowerType, { x: c.x, y: c.y });
        t.cellKey = key;
        s.towers.push(t);
        s.occupiedCells.add(key);
        if (t.kind === 'barracks') t.rally = nearestPointOnPath(t.x, t.y, s.map.paths);
        if (t.kind === 'mine') t.mineSlots = pathSlots({ x: t.x, y: t.y }, t.range, s.map.paths, 26);
        s.selectedTowerType = null;   // 蓋完回到游標，不連續蓋
        refreshBuildButtons(s);
      }
    } else {
      // 點到不可蓋處(走道/障礙/已佔/界外) → 取消選塔，避免卡在建造模式
      s.selectedTowerType = null;
      refreshBuildButtons(s);
    }
    return;
  }
  s.selectedTower = null; showTowerPanel(s);
});

// 右鍵：取消選塔 / 取消法術點地模式（桌面快速取消）
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  const s = state;
  if (s && isInRun() && (s.selectedTowerType || s.castMode)) {
    s.selectedTowerType = null; s.castMode = null;
    refreshBuildButtons(s);
  }
});

function refreshLobbyInfo() {
  const d = document.getElementById('dia-count'); if (d) d.textContent = profile.diamonds;
  const pn = document.getElementById('playtimenote');
  if (pn) {
    if (_playLimitSec <= 0) { pn.textContent = ''; pn.classList.remove('limit'); }
    else {
      const lim = playLimitReached();
      pn.textContent = lim
        ? `⏰ 今日已玩滿 ${limitMin()} 分鐘，明天再來～`
        : `🕒 今日剩餘遊玩約 ${remainPlayMin()} 分（每日上限 ${limitMin()} 分）`;
      pn.classList.toggle('limit', lim);
    }
  }
}

function initShopButtons() {
  const sb = document.getElementById('shopbtn'); sb.innerHTML = '';
  const s = document.createElement('button'); s.innerHTML = btnLabel('shop', '商城');
  s.onclick = () => openShop(profile, save, refreshLobbyInfo); sb.appendChild(s);
  const lb = document.getElementById('loadoutbtn'); lb.innerHTML = '';
  const l = document.createElement('button'); l.innerHTML = btnLabel('swords', '編隊');
  l.onclick = () => openLoadout(profile, save, refreshLobbyInfo); lb.appendChild(l);
}

function initMapPicker() {
  const bar = document.getElementById('mapbar');
  if (!bar) return; // 地圖改為關卡內建，大廳不再提供選單
  bar.innerHTML = '';
  MAPS.forEach(m => {
    const b = document.createElement('button');
    b.textContent = m.name;
    b.classList.toggle('active', m.map === currentMap);
    b.onclick = () => { currentMap = m.map; initMapPicker(); };
    bar.appendChild(b);
  });
}

function initModePicker() {
  const bar = document.getElementById('modebar');
  bar.innerHTML = '';
  const mk = (label, on) => { const b = document.createElement('button'); b.textContent = label; b.onclick = on; bar.appendChild(b); return b; };
  const endlessB = mk('無盡', () => { currentMode = 'endless'; currentLevel = null; initModePicker(); });
  const campB = mk('戰役', () => {
    // 只切到戰役模式並顯示難度選項；選關卡改由「進入副本」開啟，先選難度再進關
    currentMode = 'campaign';
    initModePicker();
  });
  endlessB.classList.toggle('active', currentMode === 'endless');
  campB.classList.toggle('active', currentMode === 'campaign');
  if (currentMode === 'campaign') {
    ['normal', 'hero', 'hell'].forEach(d => {
      const label = { normal: '普通', hero: '英雄', hell: '地獄' }[d];
      const b = mk(label, () => { currentDifficulty = d; initModePicker(); });
      b.classList.toggle('active', currentDifficulty === d);
    });
  }
}

function showInGameUI(show) {
  document.getElementById('buildbar').style.display = show ? 'flex' : 'none';
  document.getElementById('spellbar').style.display = show ? 'flex' : 'none';
  document.getElementById('hud-controls').style.display = show ? 'inline-flex' : 'none';
  document.getElementById('hintbtn').style.display = show ? 'inline-block' : 'none';
  // 大廳隱藏頂部數據列（全是 0，且會與大廳面板重疊）；遊戲中才顯示
  document.getElementById('topbar').style.display = show ? 'flex' : 'none';
  const rt = document.getElementById('runtitle');
  if (rt) rt.style.display = show ? 'block' : 'none';
}

// 遊戲中左上角顯示「目前正在打什麼關卡」
function setRunTitle() {
  const el = document.getElementById('runtitle');
  if (!el) return;
  if (currentMode === 'campaign' && currentLevel) {
    const diff = { normal: '普通', hero: '英雄', hell: '地獄' }[currentDifficulty] || '';
    el.innerHTML = `${currentLevel.name}<small>戰役 · ${diff}難度 · 共 ${currentLevel.waves} 波</small>`;
  } else {
    const wave = (state && state.wave) || 1;
    const p = endlessProgress(Math.max(1, wave));
    el.innerHTML = `無盡求生<small>第 ${p.round} 輪 · 第 ${p.layer}/13 層　▶ ${p.name}</small>`;
  }
}

const HINT_HTML = '① 點下方選塔 → 點地圖空地放置　② 用 <b>金幣</b> 升級　③ 撐過所有波次<br><small>快捷鍵：<b>1-9</b> 選塔 · <b>Esc</b> 取消 · <b>空白鍵</b> 暫停　（點擊關閉）</small>';
function showHint() {
  const hint = document.getElementById('hint');
  if (!hint.innerHTML.trim()) hint.innerHTML = HINT_HTML;
  hint.style.display = 'block';
  hint.onclick = () => { hint.style.display = 'none'; };
}

let _paused = false;
let _togglePause = null;

function initRunControls() {
  _paused = false;
  const ctrl = document.getElementById('hud-controls');
  const pauseOverlay = document.getElementById('pause-overlay');
  ctrl.innerHTML = '';

  // ▶ 提前開波
  const earlyBtn = document.createElement('button');
  earlyBtn.textContent = '▶ 提前開波';
  earlyBtn.title = '立即開始下一波（波間等待期間有效）';
  earlyBtn.onclick = () => {
    if (_paused) return;
    if (state && state.spawnQueue && state.spawnQueue.length === 0 && !state.over) {
      state.waveTimer = 0;
    }
  };

  // ⏸ 暫停
  const pauseBtn = document.createElement('button');
  pauseBtn.textContent = '⏸ 暫停';
  pauseBtn.title = '暫停 / 繼續遊戲';
  const togglePause = () => {
    if (!loop) return;
    if (_paused) {
      _paused = false;
      pauseOverlay.style.display = 'none';
      pauseBtn.textContent = '⏸ 暫停';
      pauseBtn.classList.remove('active-pause');
      loop.start();
    } else {
      _paused = true;
      pauseOverlay.style.display = 'flex';
      pauseBtn.textContent = '▶ 繼續';
      pauseBtn.classList.add('active-pause');
      loop.stop();
    }
  };
  pauseBtn.onclick = togglePause;
  _togglePause = togglePause;

  // 🏳 投降 (二次確認)
  const isEndless = currentMode !== 'campaign';
  const exitLabel = isEndless ? '🏁 結束' : '🏳 投降';
  const forfeitBtn = document.createElement('button');
  forfeitBtn.textContent = exitLabel;
  forfeitBtn.title = isEndless ? '結束本局並記錄最高層數（點兩下確認）' : '放棄本局（點兩下確認）';
  let forfeitArmed = false;
  forfeitBtn.onclick = () => {
    if (!forfeitArmed) {
      forfeitArmed = true;
      forfeitBtn.textContent = isEndless ? '確認結束?' : '確認投降?';
      forfeitBtn.style.borderColor = 'var(--rose)';
      forfeitBtn.style.color = 'var(--rose)';
      setTimeout(() => {
        if (forfeitArmed) {
          forfeitArmed = false;
          forfeitBtn.textContent = exitLabel;
          forfeitBtn.style.borderColor = '';
          forfeitBtn.style.color = '';
        }
      }, 3000);
    } else {
      forfeitArmed = false;
      if (_paused) { _paused = false; pauseOverlay.style.display = 'none'; loop.start(); }
      if (isEndless && state && !state.over) {
        // 無盡主動結束：記錄最高層數並顯示結算窗口
        state.over = true;
        save.submit(endlessRecord(state));
        const dia = awardDiamonds(state);
        showGameOver(state, save.getBest(), restart, enterLobby, dia);
      } else {
        enterLobby();
      }
    }
  };

  // 🔇 音效開關（預設靜音）
  const soundBtn = document.createElement('button');
  soundBtn.textContent = isMuted() ? '🔇 音效' : '🔊 音效';
  soundBtn.title = '開啟 / 關閉 音樂與音效';
  soundBtn.onclick = () => {
    const m = setMuted(!isMuted());
    soundBtn.textContent = m ? '🔇 音效' : '🔊 音效';
    if (!m) { unlockAudio(); if (isInRun()) startAmbient(); }
  };

  ctrl.appendChild(earlyBtn);
  ctrl.appendChild(pauseBtn);
  ctrl.appendChild(soundBtn);
  ctrl.appendChild(forfeitBtn);
}

// 轉場遮幕：先全黑再淡出，遮住大廳↔副本的瞬切
function fadeVeil() {
  const v = document.getElementById('fadeveil');
  if (!v) return;
  v.classList.add('veil-on');
  requestAnimationFrame(() => requestAnimationFrame(() => v.classList.remove('veil-on')));
}

function enterLobby() {
  _paused = false;
  fadeVeil();
  stopAmbient();
  if (loop) loop.stop();
  document.getElementById('pause-overlay').style.display = 'none';
  document.getElementById('lobby').style.display = 'flex';
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('hint').style.display = 'none';
  showInGameUI(false);
  initModePicker(); refreshLobbyInfo();
}

function startRun() {
  if (playLimitReached()) { showPlayLimit(); return; } // 防沉迷：達上限不開新局
  unlockAudio();
  startAmbient();
  _paused = false;
  fadeVeil();
  document.getElementById('pause-overlay').style.display = 'none';
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
  showInGameUI(true);
  setRunTitle();
  initRunControls();
  const runMap = (currentMode === 'campaign' && currentLevel && TERRAINS[currentLevel.id])
    ? TERRAINS[currentLevel.id]
    : TERRAINS.endless;
  state = createGameState(runMap, gameOpts());
  state.gachaUnlocked = gachaUnlocked;
  state.loadout = profile.loadout.slice();
  initBuildMenu(state); initSpellBar(state, onCast);
  maybeStartWave(state);
  if (!loop) loop = createLoop({ update, render: draw });
  loop.start();

  // 新手提示：首次進入副本才顯示
  if (!profile.seenTutorial) {
    profile.seenTutorial = true;
    save.saveProfile(profile);
    showHint();
    setTimeout(() => { document.getElementById('hint').style.display = 'none'; }, 8000);
  }
}

function restart() {
  startRun();
}

function isInRun() {
  return state && document.getElementById('lobby').style.display === 'none';
}

function boot() {
  loadTowerArt(); // 預載塔的精美 IP 圖
  loadEnemyArt(); // 預載 boss 精美 IP 圖
  loop = createLoop({ update, render: draw });
  initGachaButton(); initDexButton(); initLbButton(); initShopButtons(); initGuideButton(); setupLogin();
  document.getElementById('enterRun').onclick = () => {
    if (playLimitReached()) { showPlayLimit(); return; } // 防沉迷
    unlockAudio();
    // 戰役：先開關卡選單（難度已在大廳選好）；無盡：直接開打
    if (currentMode === 'campaign') {
      openLevelSelect(profile, lv => { currentLevel = lv; startRun(); });
    } else {
      startRun();
    }
  };
  document.getElementById('hintbtn').onclick = showHint;

  window.addEventListener('keydown', e => {
    if (!isInRun()) return;
    const s = state;
    if (e.key >= '1' && e.key <= '9') {
      const idx = Number(e.key) - 1;
      if (s.loadout && s.loadout[idx]) {
        s.selectedTowerType = s.loadout[idx];
        s.selectedTower = null;
        refreshBuildButtons(s);
      }
    } else if (e.key === 'Escape') {
      s.selectedTowerType = null;
      s.castMode = null;
      s.selectedTower = null;
      refreshBuildButtons(s);
      showTowerPanel(s);
    } else if (e.key === ' ') {
      e.preventDefault();
      if (_togglePause) _togglePause();
    }
  });

  enterLobby();
}
boot();
