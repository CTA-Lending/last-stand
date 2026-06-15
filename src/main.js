import { MAP1 } from './data/map1.js';
import { BALANCE } from './data/balance.js';
import { createGameState } from './state/gameState.js';
import { createLoop } from './core/loop.js';
import { render } from './render/renderer.js';
import { updateParticles, burst } from './render/particles.js';
import { buildWave } from './systems/endlessDirector.js';
import { spawnEnemy, updateEnemy } from './entities/enemy.js';
import { buildTower, updateTower } from './entities/tower.js';
import { updateProjectile } from './entities/projectile.js';
import { createSaveService } from './services/saveService.js';
import { updateHud, showGameOver } from './ui/hud.js';
import { initBuildMenu, showTowerPanel, refreshBuildButtons } from './ui/buildMenu.js';
import { dist } from './core/geometry.js';
import { cellOf, cellKey, cellCenter } from './systems/grid.js';
import { TOWERS } from './data/towers.js';
import { tickSpells, trigger, isReady, SPELLS } from './systems/spells.js';
import { initSpellBar, refreshSpellBar } from './ui/spellBar.js';
import { computeDamage } from './systems/combat.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const save = createSaveService();
const mouse = { x: 0, y: 0 };
let state, loop;

function startWave(s) {
  s.wave += 1;
  s.spawnQueue = buildWave(s.wave);
  s.spawnTimer = 0;
  s.waveTimer = BALANCE.endless.waveInterval;
}

function update(dt) {
  const s = state;
  if (s.over) return;
  s.now += dt;
  tickSpells(s.spells, dt);
  s.economy.tick(dt);

  // 生怪排程
  s.waveTimer -= dt;
  if (s.spawnQueue.length === 0 && s.enemies.every(e => !e.alive) && s.waveTimer <= 0) startWave(s);
  if (s.spawnQueue.length > 0) {
    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) {
      s.enemies.push(spawnEnemy(s.spawnQueue.shift(), s.map));
      s.spawnTimer = BALANCE.endless.spawnGap;
    }
  }
  if (s.waveTimer <= 0 && s.spawnQueue.length === 0) startWave(s);

  for (const t of s.towers) updateTower(t, s.enemies, s.projectiles, dt);
  for (let i = s.projectiles.length - 1; i >= 0; i--) {
    const p = s.projectiles[i];
    const hit = updateProjectile(p, s.enemies, dt, s.now);
    if (hit) burst(hit.x, hit.y, p.color, 7);
    if (!p.alive) s.projectiles.splice(i, 1);
  }
  for (const e of s.enemies) {
    const wasAlive = e.alive;
    updateEnemy(e, s.map, dt, s.now);
    if (wasAlive && !e.alive) {
      if (e.reachedEnd) { s.economy.loseLife(1); }
      else { s.economy.earn(e.bounty); s.economy.addScore(e.boss ? 100 : 10); burst(e.x, e.y, e.color, e.boss ? 28 : 12); }
    }
  }
  s.enemies = s.enemies.filter(e => e.alive || e.hitFlash > 0);
  updateParticles(dt);

  if (s.economy.isDead() && !s.over) {
    s.over = true;
    const record = { wave: s.wave, time: Math.floor(s.economy.elapsed), score: s.economy.score };
    save.submit(record);
    showGameOver(s, save.getBest(), restart);
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
        s.selectedTowerType = null;   // 蓋完回到游標，不連續蓋
        refreshBuildButtons(s);
      }
    }
    return;
  }
  s.selectedTower = null; showTowerPanel(s);
});

function restart() {
  state = createGameState(MAP1);
  initBuildMenu(state);
  initSpellBar(state, onCast);
  startWave(state);
}

function boot() {
  state = createGameState(MAP1);
  initBuildMenu(state);
  initSpellBar(state, onCast);
  startWave(state);
  loop = createLoop({ update, render: draw });
  loop.start();
}
boot();
