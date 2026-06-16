import { TOWERS } from '../data/towers.js';
import { drawGacha, GACHA_POOL, LEGENDARY_RATE } from '../systems/gacha.js';

// 開啟轉蛋面板。deps: { profile, gachaUnlocked, save, onUnlock }
export function openGacha(deps) {
  const ov = document.getElementById('gachaoverlay');
  ov.style.display = 'flex';
  render(ov, deps, null);
}

function render(ov, deps, reveal) {
  const { profile } = deps;
  const allUnlocked = GACHA_POOL.every(t => (profile.owned || profile.unlocked).includes(t));
  const canRoll = profile.tickets > 0 && !allUnlocked;
  const card = reveal ? cardHtml(reveal) : '<div class="gacha-card" style="background:#2b3346;color:#888">轉動看看會抽到什麼…</div>';
  const ratePct = (LEGENDARY_RATE * 100).toFixed(3);
  ov.innerHTML = `<div class="gacha-panel">
    <h2>🎰 轉轉樂</h2>
    <div>轉券：<b style="color:#ffe08a">${profile.tickets}</b></div>
    <div style="font-size:11px;color:#9a92a8;margin:2px 0 4px">傳奇塔命中率 <b style="color:#ffe08a">${ratePct}%</b>（極稀有）</div>
    ${card}
    <button class="gacha-roll" ${canRoll ? '' : 'disabled'}>${allUnlocked ? '已全部解鎖' : '轉一發 (1券)'}</button>
    <button class="gacha-close">關閉</button>
  </div>`;
  ov.querySelector('.gacha-close').onclick = () => { ov.style.display = 'none'; };
  const roll = ov.querySelector('.gacha-roll');
  if (canRoll) roll.onclick = () => {
    profile.tickets -= 1;
    const ownedArr = profile.owned || profile.unlocked;
    const res = drawGacha(ownedArr, Math.random);
    if (res.miss) { /* 槓龜：券已扣，無所獲 */ }
    else if (!res.dup) { profile.owned ? profile.owned.push(res.type) : profile.unlocked.push(res.type); deps.gachaUnlocked.add(res.type); }
    else profile.tickets += 1; // 全解鎖才會 dup，退券
    deps.save.saveProfile(profile);
    deps.onUnlock();
    render(ov, deps, res);
  };
}

function cardHtml(res) {
  if (res.miss || !res.type) {
    return `<div class="gacha-card" style="background:#2b2533;border:2px solid #4a4458;color:#9a92a8">
      <div style="font-size:30px">🎟️</div>
      <h3 style="margin:6px 0;color:#cbbfe0">槓龜…</h3>
      <div style="font-size:12px">傳奇塔太稀有了，下次再試試！</div></div>`;
  }
  const def = TOWERS[res.type];
  return `<div class="gacha-card" style="background:${def.color}22;border:2px solid ${def.color}">
    <div style="font-size:34px;color:${def.color}">●</div>
    <h3 style="margin:6px 0;color:${def.color}">${def.name}</h3>
    <div style="font-size:12px;color:#ccc;margin-bottom:8px">${def.lore || ''}</div>
    <div style="color:#ffe08a">${res.dup ? '已擁有' : '✨ 解鎖！'}</div>
  </div>`;
}
