import { TOWERS } from '../data/towers.js';
import { toggleLoadout, LOADOUT_MAX, towerSummary } from '../systems/account.js';
import { ELEMENT_INFO } from '../data/attackMatrix.js';
const elColor = (def) => (ELEMENT_INFO[def.attackType] && ELEMENT_INFO[def.attackType].color) || def.color;

export function openLoadout(profile, save, onChange) {
  const ov = document.getElementById('loadoutoverlay');
  function render() {
    const cards = profile.owned.map(type => {
      const def = TOWERS[type]; const inLo = profile.loadout.includes(type);
      const full = !inLo && profile.loadout.length >= LOADOUT_MAX;
      const summary = towerSummary(type);
      const ec = elColor(def);
      return `<div class="lo-card ${inLo ? 'in' : ''} ${full ? 'disabled' : ''}" data-type="${type}" title="${summary}">
        <div class="dex-img" style="--ec:${ec};margin:0 0 5px"><img src="assets/towers/${type}.png" alt="${def.name}" loading="lazy"></div>
        <div style="color:${ec}">${def.name}</div>
        <div>${inLo ? '✓ 出戰' : (full ? '已滿' : '點選帶入')}</div>
      </div>`;
    }).join('');
    ov.innerHTML = `<div class="lo-panel"><h2>⚔️ 編隊（最多 ${LOADOUT_MAX}）</h2>
      <div>已選 ${profile.loadout.length}/${LOADOUT_MAX}</div>
      <div class="lo-grid">${cards}</div>
      <button class="ov-close">關閉</button></div>`;
    ov.querySelector('.ov-close').onclick = () => { ov.style.display = 'none'; };
    ov.querySelectorAll('.lo-card').forEach(c => c.onclick = () => {
      profile.loadout = toggleLoadout(profile.loadout, c.dataset.type, LOADOUT_MAX);
      save.saveProfile(profile); onChange(); render();
    });
  }
  render(); ov.style.display = 'flex';
}
