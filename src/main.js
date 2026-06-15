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
import { initBuildMenu, showTowerPanel } from './ui/buildMenu.js';
import { dist } from './core/geometry.js';
import { TOWERS } from './data/towers.js';

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
}

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
});

canvas.addEventListener('click', () => {
  const s = state;
  // 點到已有塔 → 選取
  const hitTower = s.towers.find(t => dist(t.x, t.y, mouse.x, mouse.y) < 16);
  if (hitTower && !s.selectedTowerType) {
    s.selectedTower = hitTower; showTowerPanel(s); return;
  }
  // 建塔
  if (s.selectedTowerType) {
    let idx = -1, best = 24;
    s.map.buildSlots.forEach((slot, i) => {
      const d = dist(slot.x, slot.y, mouse.x, mouse.y);
      if (d < best && !s.occupiedSlots.has(i)) { best = d; idx = i; }
    });
    if (idx >= 0) {
      const cost = TOWERS[s.selectedTowerType].levels[0].cost;
      if (s.economy.spend(cost)) {
        const t = buildTower(s.selectedTowerType, s.map.buildSlots[idx]);
        t.slotIndex = idx;
        s.towers.push(t);
        s.occupiedSlots.add(idx);
      }
    }
    return;
  }
  s.selectedTower = null; showTowerPanel(s);
});

function restart() {
  state = createGameState(MAP1);
  initBuildMenu(state);
  startWave(state);
}

function boot() {
  state = createGameState(MAP1);
  initBuildMenu(state);
  startWave(state);
  loop = createLoop({ update, render: draw });
  loop.start();
}
boot();
