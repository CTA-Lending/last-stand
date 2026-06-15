import { SPELLS, isReady } from '../systems/spells.js';

export function initSpellBar(state, onCast) {
  const bar = document.getElementById('spellbar');
  bar.innerHTML = '';
  for (const [key, def] of Object.entries(SPELLS)) {
    const b = document.createElement('button');
    b.className = 'spell-btn'; b.dataset.key = key;
    b.onclick = () => onCast(key);
    bar.appendChild(b);
  }
  refreshSpellBar(state);
}

export function refreshSpellBar(state) {
  const bar = document.getElementById('spellbar');
  for (const b of bar.children) {
    const key = b.dataset.key, def = SPELLS[key];
    const ready = isReady(state.spells, key);
    const cd = Math.ceil(state.spells[key]);
    b.textContent = `${def.icon} ${def.name}` + (ready ? '' : ` (${cd}s)`);
    b.classList.toggle('cooling', !ready);
    b.classList.toggle('armed', state.castMode === key);
  }
}
