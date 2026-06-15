import { BALANCE } from '../data/balance.js';

const DIFF_LABEL = { normal: '普通', hero: '英雄', hell: '地獄' };

export async function openLeaderboard(service, save, mapNames) {
  const ov = document.getElementById('lboverlay');
  const board = await service.getEndlessBoard();
  const rows = board.map(r => `<div class="lb-row ${r.you ? 'you' : ''}">
    <span class="lb-rank">#${r.rank}</span>
    <span class="lb-name">${r.name}</span>
    <span>第${r.wave}波 · ${r.time}s</span></div>`).join('');
  // 戰役最佳(各地圖×難度)
  let camp = '';
  for (const name of mapNames) for (const d of ['normal', 'hero', 'hell']) {
    const t = save.getCampaignBest(name + '.' + d);
    if (t != null) camp += `<div class="lb-row"><span class="lb-name">${name} · ${DIFF_LABEL[d]}</span><span>${t}s</span></div>`;
  }
  ov.innerHTML = `<div class="lb-panel">
    <h2>🏆 撐最久榜</h2>
    <div class="lb-sub">無盡模式 · 存活波數</div>
    ${rows}
    ${camp ? '<div class="lb-sub">戰役最佳通關</div>' + camp : ''}
    <div class="lb-note">目前為本機＋模擬全球榜；接上伺服器後顯示真實全球排名</div>
    <button class="lb-close">關閉</button></div>`;
  ov.style.display = 'flex';
  ov.querySelector('.lb-close').onclick = () => { ov.style.display = 'none'; };
}
