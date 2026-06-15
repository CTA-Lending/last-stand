import { TOWERS } from '../data/towers.js';
import { toggleLoadout, LOADOUT_MAX, towerSummary } from '../systems/account.js';

export function openLoadout(profile, save, onChange) {
  const ov = document.getElementById('loadoutoverlay');
  function render() {
    const cards = profile.owned.map(type => {
      const def = TOWERS[type]; const inLo = profile.loadout.includes(type);
      const full = !inLo && profile.loadout.length >= LOADOUT_MAX;
      const summary = towerSummary(type);
      return `<div class="lo-card ${inLo ? 'in' : ''} ${full ? 'disabled' : ''}" data-type="${type}" title="${summary}">
        <div style="font-size:20px;color:${def.color}">●</div>
        <div style="color:${def.color}">${def.name}</div>
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
