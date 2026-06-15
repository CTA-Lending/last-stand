import { sfx, unlockAudio } from './render/audio.js';
import { MAP1 } from './data/map1.js';
import { MAP2 } from './data/map2.js';
import { BALANCE } from './data/balance.js';
import { createGameState } from './state/gameState.js';
import { createLoop } from './core/loop.js';
import { render } from './render/renderer.js';
import { updateParticles, burst, spark, floatText, flash, motes, screenFlash, shockwave } from './render/particles.js';
import { buildWave, minionSpec } from './systems/endlessDirector.js';
import { applyEnemyAbilities } from './systems/enemyAbility.js';
import { spawnEnemy, updateEnemy } from './entities/enemy.js';
import { buildTower, updateTower } from './entities/tower.js';
import { updateBlocking } from './systems/blocking.js';
import { applyAuras } from './systems/aura.js';
import { updateMines } from './systems/mines.js';
import { updateProjectile } from './entities/projectile.js';
import { createSaveService } from './services/saveService.js';
import { updateHud, showGameOver, showVictory } from './ui/hud.js';
import { initBuildMenu, showTowerPanel, refreshBuildButtons } from './ui/buildMenu.js';
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
import { runDiamonds } from './systems/account.js';
import { openShop } from './ui/shop.js';
import { openLoadout } from './ui/loadout.js';
import { campaignWave } from './systems/campaign.js';
import { CHAPTERS, LEVEL_ORDER } from './data/levels.js';
import { openLevelSelect } from './ui/levelSelect.js';

const MAPS = [ { name: '森林小徑', map: MAP1 }, { name: '雙叉路口', map: MAP2 } ];
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
  const gained = runDiamonds({ mode: s.mode, won: s.won, difficulty: s.difficulty, wave: s.wave });
  profile.diamonds += gained; save.saveProfile(profile);
  return gained;
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const save = createSaveService();
const leaderboard = createLocalLeaderboard(save, LEADERBOARD_SEED);
const mouse = { x: 0, y: 0 };
let state, loop;

const profile = save.loadProfile();
const gachaUnlocked = new Set(profile.owned);
const today = new Date().toISOString().slice(0, 10);
if (isNewDay(profile.lastLogin, today)) { profile.tickets += 1; profile.lastLogin = today; save.saveProfile(profile); }

function initDexButton() {
  const bar = document.getElementById('dexbtn');
  bar.innerHTML = '';
  const b = document.createElement('button');
  b.textContent = '🎴 圖鑑';
  b.onclick = () => openCollection(gachaUnlocked);
  bar.appendChild(b);
}

function initLbButton() {
  const bar = document.getElementById('lbbtn');
  bar.innerHTML = '';
  const b = document.createElement('button');
  b.textContent = '🏆 排行';
  b.onclick = () => openLeaderboard(leaderboard, save, MAPS.map(m => m.name));
  bar.appendChild(b);
}

function initGachaButton() {
  const bar = document.getElementById('gachabtn');
  bar.innerHTML = '';
  const b = document.createElement('button');
  b.textContent = '🎰 轉蛋 (' + profile.tickets + '券)';
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
    const bossName = s.wave % (BALANCE.endless.demonBossEvery || 10) === 0 ? '魔王' : '死亡騎士';
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
  s.spawnTimer = 0;
  s.waveTimer = BALANCE.endless.waveInterval;
  sfx.wave();
  showWaveBanner(s);
  return true;
}

function update(dt) {
  const s = state;
  if (s.over) return;
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
  for (const t of s.towers) {
    if (t.kind === 'barracks') updateBlocking(t, s.enemies, dt, s.now);
    else if (t.kind === 'banner') { /* 不開火，光環已套 */ }
    else if (t.kind === 'mine') { for (const d of updateMines(t, s.enemies, dt)) burst(d.x, d.y, '#ffb13a', 18); }
    else updateTower(t, s.enemies, s.projectiles, dt);
  }
  const prevProjLen = s.projectiles.length;
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
    }
    if (!p.alive) s.projectiles.splice(i, 1);
  }
  if (s.projectiles.length > prevProjLen) sfx.fire();
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
          s.shake = 9; flash(e.x, e.y, e.color, 26);
          s.hitStop = 0.06;
          sfx.boss();
        } else {
          motes(e.x, e.y);
          sfx.kill();
        }
      }
    }
  }
  for (const e of s.enemies) if (!e.alive && e.deathT > 0) e.deathT -= dt;
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
      dia = s.level.diamond;
      profile.diamonds += dia;
      save.saveProfile(profile);
    } else {
      dia = awardDiamonds(s);
    }
    showVictory(s, save.getCampaignBest(key), restart, enterLobby, dia);
  }

  if (s.economy.isDead() && !s.over) {
    s.over = true;
    const record = { wave: s.wave, time: Math.floor(s.economy.elapsed), score: s.economy.score };
    save.submit(record);
    const dia = awardDiamonds(s);
    showGameOver(s, save.getBest(), restart, enterLobby, dia);
  }
}

function draw() {
  render(ctx, state, mouse);
  updateHud(state);
  refreshSpellBar(state);
}

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
});

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

canvas.addEventListener('click', () => {
  const s = state;
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
    }
    return;
  }
  s.selectedTower = null; showTowerPanel(s);
});

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

function initMapPicker() {
  const bar = document.getElementById('mapbar');
  bar.innerHTML = '🗺️';
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
    currentMode = 'campaign';
    initModePicker();
    openLevelSelect(profile, lv => { currentLevel = lv; startRun(); });
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
}

function enterLobby() {
  if (loop) loop.stop();
  document.getElementById('lobby').style.display = 'flex';
  document.getElementById('overlay').style.display = 'none';
  showInGameUI(false);
  initModePicker(); initMapPicker(); refreshLobbyInfo();
}

function startRun() {
  unlockAudio();
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
  showInGameUI(true);
  const runMap = (currentMode === 'campaign' && currentLevel)
    ? (currentLevel.map === 'map2' ? MAP2 : MAP1)
    : currentMap;
  state = createGameState(runMap, gameOpts());
  state.gachaUnlocked = gachaUnlocked;
  state.loadout = profile.loadout.slice();
  initBuildMenu(state); initSpellBar(state, onCast);
  maybeStartWave(state);
  if (!loop) loop = createLoop({ update, render: draw });
  loop.start();
}

function restart() {
  startRun();
}

function boot() {
  loop = createLoop({ update, render: draw });
  initGachaButton(); initDexButton(); initLbButton(); initShopButtons();
  document.getElementById('enterRun').onclick = () => { unlockAudio(); startRun(); };
  enterLobby();
}
boot();
