import { BALANCE } from '../data/balance.js';

const DIFF_LABEL = { normal: '普通', hero: '英雄', hell: '地獄' };

export async function openLeaderboard(service, save, mapNames) {
  const ov = document.getElementById('lboverlay');
  const board = await service.getEndlessBoard();
  const rows = board.length
    ? board.map(r => `<div class="lb-row ${r.you ? 'you' : ''}">
        <span class="lb-rank">#${r.rank}</span>
        <span class="lb-name">${r.name}</span>
        <span>第${r.round}輪·第${r.layer}層 · ${r.time}s</span></div>`).join('')
    : '<div class="lb-note">還沒有紀錄——去無盡模式撐撐看，看你能爬到第幾層！</div>';
  // 戰役最佳(各地圖×難度)
  let camp = '';
  for (const name of mapNames) for (const d of ['normal', 'hero', 'hell']) {
    const t = save.getCampaignBest(name + '.' + d);
    if (t != null) camp += `<div class="lb-row"><span class="lb-name">${name} · ${DIFF_LABEL[d]}</span><span>${t}s</span></div>`;
  }
  ov.innerHTML = `<div class="lb-panel">
    <h2>🏆 撐最久榜</h2>
    <div class="lb-sub">無盡模式 · 最高層數（七情六慾 13 層為一輪）</div>
    ${rows}
    ${camp ? '<div class="lb-sub">戰役最佳通關</div>' + camp : ''}
    <div class="lb-note">本機紀錄；接上伺服器後可顯示真實全球排名</div>
    <button class="lb-close">關閉</button></div>`;
  ov.style.display = 'flex';
  ov.querySelector('.lb-close').onclick = () => { ov.style.display = 'none'; };
}
