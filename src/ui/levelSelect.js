import { CHAPTERS, LEVEL_ORDER } from '../data/levels.js';
import { isLevelUnlocked } from '../systems/campaign.js';

export function openLevelSelect(profile, onPick) {
  const ov = document.getElementById('leveloverlay');
  let html = '<div class="lvl-panel"><h2>⚔️ 戰役 · 淨化心魔</h2>';
  for (const ch of CHAPTERS) {
    html += `<div class="lvl-chapter">${ch.name}</div><div class="lvl-grid">`;
    for (const lv of ch.levels) {
      const idx = LEVEL_ORDER.indexOf(lv.id);
      const unlocked = isLevelUnlocked(idx, profile.cleared);
      const cleared = profile.cleared.includes(lv.id);
      html += `<div class="lvl-card ${unlocked ? '' : 'locked'} ${cleared ? 'cleared' : ''}" data-id="${lv.id}">
        <div style="font-size:15px">${cleared ? '✅' : (unlocked ? '⚔️' : '🔒')} ${lv.name}</div>
        <div>${lv.waves}波 · 💎${lv.diamond}</div></div>`;
    }
    html += '</div>';
  }
  html += '<button class="ov-close">關閉</button></div>';
  ov.innerHTML = html; ov.style.display = 'flex';
  ov.querySelector('.ov-close').onclick = () => { ov.style.display = 'none'; };
  ov.querySelectorAll('.lvl-card:not(.locked)').forEach(c => c.onclick = () => {
    const lv = CHAPTERS.flatMap(ch => ch.levels).find(l => l.id === c.dataset.id);
    ov.style.display = 'none'; onPick(lv);
  });
}
