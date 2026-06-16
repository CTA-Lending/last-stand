import { TOWERS } from '../data/towers.js';
import { canBuy, buyPrice, isOwned, towerSummary } from '../systems/account.js';
import { ELEMENT_INFO } from '../data/attackMatrix.js';
const elColor = (def) => (ELEMENT_INFO[def.attackType] && ELEMENT_INFO[def.attackType].color) || def.color;

export function openShop(profile, save, onChange) {
  const ov = document.getElementById('shopoverlay');
  function render() {
    const cards = Object.entries(TOWERS).filter(([, d]) => d.diamond != null).map(([type, def]) => {
      const owned = isOwned(type, profile.owned);
      const buyable = canBuy(type, profile.owned, profile.diamonds);
      // 前置塔前提檢查（UI 層）
      const prereqs = def.requires || [];
      const prereqMet = prereqs.every(r => profile.owned.includes(r));
      const lockLine = !owned && !prereqMet
        ? `<div style="color:var(--rose);font-size:11px;margin-top:3px;">🔒 需先擁有 ${prereqs.map(r => TOWERS[r] ? TOWERS[r].name : r).join('、')}</div>`
        : '';
      const stats = `<div style="color:var(--dim);font-size:11px;margin-top:3px;">${towerSummary(type)}</div>`;
      // 買鈕：不可購或前置未達到時 disabled
      const btnDisabled = !buyable || !prereqMet ? 'disabled' : '';
      const ec = elColor(def);
      return `<div class="shop-card ${owned ? 'owned' : ''}" data-type="${type}">
        <div class="dex-img" style="--ec:${ec};margin:0 0 5px"><img src="assets/towers/${type}.png" alt="${def.name}" loading="lazy"></div>
        <div style="color:${ec}">${def.name}</div>
        ${stats}
        <div>${owned ? '已擁有' : '💎' + buyPrice(type)}</div>
        ${lockLine}
        ${owned ? '' : `<button ${btnDisabled} data-buy="${type}">購買</button>`}
      </div>`;
    }).join('');
    ov.innerHTML = `<div class="shop-panel"><h2>🏪 商城</h2>
      <div style="color:#7fe0ff">💎 ${profile.diamonds}</div>
      <div class="shop-grid">${cards}</div>
      <button class="ov-close">關閉</button></div>`;
    ov.querySelector('.ov-close').onclick = () => { ov.style.display = 'none'; };
    ov.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const type = b.dataset.buy;
      const prereqs = TOWERS[type].requires || [];
      const prereqMet = prereqs.every(r => profile.owned.includes(r));
      if (prereqMet && canBuy(type, profile.owned, profile.diamonds)) {
        profile.diamonds -= buyPrice(type); profile.owned.push(type);
        save.saveProfile(profile); onChange(); render();
      }
    });
  }
  render(); ov.style.display = 'flex';
}
