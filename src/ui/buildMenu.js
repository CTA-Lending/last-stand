import { TOWERS } from '../data/towers.js';
import { upgradeTower, upgradeCost } from '../entities/tower.js';
import { BALANCE } from '../data/balance.js';

export function initBuildMenu(state) {
  const bar = document.getElementById('buildbar');
  bar.innerHTML = '';
  for (const [type, def] of Object.entries(TOWERS)) {
    const b = document.createElement('button');
    b.className = 'build-btn';
    b.innerHTML = `<span style="color:${def.color}">●</span> ${def.name}<br><small>${def.levels[0].cost}g</small>`;
    b.onclick = () => {
      state.selectedTowerType = state.selectedTowerType === type ? null : type;
      state.selectedTower = null;
      renderSelection(bar, state);
    };
    b.dataset.type = type;
    bar.appendChild(b);
  }
}

function renderSelection(bar, state) {
  [...bar.children].forEach(b =>
    b.classList.toggle('active', b.dataset.type === state.selectedTowerType));
}

export function showTowerPanel(state) {
  const panel = document.getElementById('towerpanel');
  const t = state.selectedTower;
  if (!t) { panel.style.display = 'none'; return; }
  const cost = upgradeCost(t);
  panel.style.display = 'block';
  panel.innerHTML = `
    <b>${TOWERS[t.type].name}</b> Lv.${t.level + 1}
    <div>傷害 ${t.damage} · 射程 ${t.range}</div>
    ${cost != null ? `<button id="upg">升級 (${cost}g)</button>` : '<span>已滿級</span>'}
    <button id="sell">賣出 (+${Math.floor(TOWERS[t.type].levels[t.level].cost * BALANCE.sellRefund)}g)</button>`;
  if (cost != null) document.getElementById('upg').onclick = () => {
    if (state.economy.spend(cost)) { upgradeTower(t); showTowerPanel(state); }
  };
  document.getElementById('sell').onclick = () => {
    state.economy.earn(Math.floor(TOWERS[t.type].levels[t.level].cost * BALANCE.sellRefund));
    state.towers = state.towers.filter(x => x !== t);
    state.occupiedCells.delete(t.cellKey);
    state.selectedTower = null; panel.style.display = 'none';
  };
}
