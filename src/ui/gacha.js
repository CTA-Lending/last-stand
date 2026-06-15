import { TOWERS } from '../data/towers.js';
import { drawGacha, GACHA_POOL } from '../systems/gacha.js';

// 開啟轉蛋面板。deps: { profile, gachaUnlocked, save, onUnlock }
export function openGacha(deps) {
  const ov = document.getElementById('gachaoverlay');
  ov.style.display = 'flex';
  render(ov, deps, null);
}

function render(ov, deps, reveal) {
  const { profile } = deps;
  const allUnlocked = GACHA_POOL.every(t => profile.unlocked.includes(t));
  const canRoll = profile.tickets > 0 && !allUnlocked;
  const card = reveal ? cardHtml(reveal) : '<div class="gacha-card" style="background:#2b3346;color:#888">轉動看看會抽到什麼…</div>';
  ov.innerHTML = `<div class="gacha-panel">
    <h2>🎰 轉轉樂</h2>
    <div>轉券：<b style="color:#ffe08a">${profile.tickets}</b></div>
    ${card}
    <button class="gacha-roll" ${canRoll ? '' : 'disabled'}>${allUnlocked ? '已全部解鎖' : '轉一發 (1券)'}</button>
    <button class="gacha-close">關閉</button>
  </div>`;
  ov.querySelector('.gacha-close').onclick = () => { ov.style.display = 'none'; };
  const roll = ov.querySelector('.gacha-roll');
  if (canRoll) roll.onclick = () => {
    profile.tickets -= 1;
    const res = drawGacha(profile.unlocked, Math.random);
    if (!res.dup) { profile.unlocked.push(res.type); deps.gachaUnlocked.add(res.type); }
    else profile.tickets += 1; // 理論上不會(已擋全解鎖)
    deps.save.saveProfile(profile);
    deps.onUnlock();
    render(ov, deps, res);
  };
}

function cardHtml(res) {
  const def = TOWERS[res.type];
  return `<div class="gacha-card" style="background:${def.color}22;border:2px solid ${def.color}">
    <div style="font-size:34px;color:${def.color}">●</div>
    <h3 style="margin:6px 0;color:${def.color}">${def.name}</h3>
    <div style="font-size:12px;color:#ccc;margin-bottom:8px">${def.lore || ''}</div>
    <div style="color:#ffe08a">${res.dup ? '已擁有' : '✨ 解鎖！'}</div>
  </div>`;
}
