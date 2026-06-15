import { TOWERS } from '../data/towers.js';
import { upgradeTower, upgradeCost, canUpgrade, canBranch, branchOptions, chooseBranch, sellValue, isTowerUnlocked, towerLockReason } from '../entities/tower.js';
import { releaseBarracks } from '../systems/blocking.js';
import { BALANCE } from '../data/balance.js';

export function initBuildMenu(state) {
  const bar = document.getElementById('buildbar');
  bar.innerHTML = '';
  for (const [type, def] of Object.entries(TOWERS)) {
    const b = document.createElement('button');
    b.className = 'build-btn';
    b.innerHTML = `<span style="color:${def.color}">●</span> ${def.name}<br><small class="req"></small>`;
    b.onclick = () => {
      if (!isTowerUnlocked(type, state.towers, state.gachaUnlocked)) return; // 未解鎖不可選
      state.selectedTowerType = state.selectedTowerType === type ? null : type;
      state.selectedTower = null;
      renderSelection(bar, state);
    };
    b.dataset.type = type;
    bar.appendChild(b);
  }
  refreshBuildLocks(state);
}

function renderSelection(bar, state) {
  [...bar.children].forEach(b =>
    b.classList.toggle('active', b.dataset.type === state.selectedTowerType));
}
export function refreshBuildButtons(state) {
  renderSelection(document.getElementById('buildbar'), state);
}

// 依場上前置塔/轉蛋解鎖狀態，更新建造列鎖定外觀與提示
export function refreshBuildLocks(state) {
  const bar = document.getElementById('buildbar');
  for (const b of bar.children) {
    const type = b.dataset.type;
    const unlocked = isTowerUnlocked(type, state.towers, state.gachaUnlocked);
    b.classList.toggle('locked', !unlocked);
    const req = b.querySelector('.req');
    if (req) req.textContent = unlocked
      ? TOWERS[type].levels[0].cost + 'g'
      : towerLockReason(type, state.towers, state.gachaUnlocked);
  }
}

export function showTowerPanel(state) {
  const panel = document.getElementById('towerpanel');
  const t = state.selectedTower;
  if (!t) { panel.style.display = 'none'; return; }
  const def = TOWERS[t.type];
  const sell = sellValue(t, BALANCE.sellRefund);
  let actions = '';
  if (canBranch(t)) {
    const o = branchOptions(t);
    actions = `<div class="branch-row">
      <button id="br0">${o[0].name} (${o[0].cost}g)</button>
      <button id="br1">${o[1].name} (${o[1].cost}g)</button></div>`;
  } else if (canUpgrade(t)) {
    actions = `<button id="upg">升級 (${upgradeCost(t)}g)</button>`;
  } else {
    actions = `<span>${t.branch != null ? def.branches[t.branch].name + ' · 已專精' : '已滿級'}</span>`;
  }
  panel.style.display = 'block';
  const lvLabel = t.branch != null ? def.branches[t.branch].name : 'Lv.' + (t.level + 1);
  const statLine = t.kind === 'barracks'
    ? `<div>士兵 ${t.maxSoldiers}名 · 血${t.soldierHp} 攻${t.soldierDmg}</div>`
    : `<div>傷害 ${t.damage} · 射程 ${t.range}</div>`;
  panel.innerHTML = `<b>${def.name}</b> ${lvLabel}
    ${statLine}
    ${actions}
    <button id="sell">賣出 (+${sell}g)</button>`;
  const upg = document.getElementById('upg');
  if (upg) upg.onclick = () => { if (state.economy.spend(upgradeCost(t))) { upgradeTower(t); showTowerPanel(state); } };
  for (const i of [0, 1]) {
    const bb = document.getElementById('br' + i);
    if (bb) bb.onclick = () => {
      const cost = branchOptions(t)[i].cost;
      if (state.economy.spend(cost)) { chooseBranch(t, i); showTowerPanel(state); }
    };
  }
  document.getElementById('sell').onclick = () => {
    state.economy.earn(sell);
    if (t.kind === 'barracks') releaseBarracks(t, state.enemies); // 釋放被擋的敵人，避免永久卡住
    state.towers = state.towers.filter(x => x !== t);
    state.occupiedCells.delete(t.cellKey);
    state.selectedTower = null; panel.style.display = 'none';
  };
}
