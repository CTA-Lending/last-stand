import { TOWERS } from '../data/towers.js';
import { towerRole, isOwned } from '../systems/collection.js';
import { ELEMENT_INFO } from '../data/attackMatrix.js';
const elColor = (def) => (ELEMENT_INFO[def.attackType] && ELEMENT_INFO[def.attackType].color) || def.color;

export function openCollection(gachaUnlocked) {
  const ov = document.getElementById('dexoverlay');
  const cards = Object.entries(TOWERS).map(([type, def]) => {
    const owned = isOwned(type, gachaUnlocked);
    const cost = def.levels[0].cost;
    const ec = elColor(def);
    return `<div class="dex-card ${owned ? '' : 'locked'}">
      <div class="dex-img" style="--ec:${ec}"><img src="assets/towers/${type}.png" alt="${def.name}" loading="lazy"></div>
      <h4 style="color:${ec}">${def.name}</h4>
      <div class="dex-role">${towerRole(def)} · ${cost}g${def.gachaOnly ? ' · 傳奇' : ''}</div>
      <div class="dex-lore">${def.lore || (owned ? '' : '🔒 轉蛋解鎖')}</div>
    </div>`;
  }).join('');
  ov.innerHTML = `<div class="dex-panel"><h2>🎴 塔圖鑑</h2>
    <div class="dex-grid">${cards}</div>
    <button class="dex-close">關閉</button></div>`;
  ov.style.display = 'flex';
  ov.querySelector('.dex-close').onclick = () => { ov.style.display = 'none'; };
}
