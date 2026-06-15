import { TOWERS } from '../data/towers.js';
import { canBuy, buyPrice, isOwned } from '../systems/account.js';

export function openShop(profile, save, onChange) {
  const ov = document.getElementById('shopoverlay');
  function render() {
    const cards = Object.entries(TOWERS).filter(([, d]) => d.diamond != null).map(([type, def]) => {
      const owned = isOwned(type, profile.owned);
      const buyable = canBuy(type, profile.owned, profile.diamonds);
      return `<div class="shop-card ${owned ? 'owned' : ''}" data-type="${type}">
        <div style="font-size:22px;color:${def.color}">●</div>
        <div style="color:${def.color}">${def.name}</div>
        <div>${owned ? '已擁有' : '💎' + buyPrice(type)}</div>
        ${owned ? '' : `<button ${buyable ? '' : 'disabled'} data-buy="${type}">購買</button>`}
      </div>`;
    }).join('');
    ov.innerHTML = `<div class="shop-panel"><h2>🏪 商城</h2>
      <div style="color:#7fe0ff">💎 ${profile.diamonds}</div>
      <div class="shop-grid">${cards}</div>
      <button class="ov-close">關閉</button></div>`;
    ov.querySelector('.ov-close').onclick = () => { ov.style.display = 'none'; };
    ov.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const type = b.dataset.buy;
      if (canBuy(type, profile.owned, profile.diamonds)) {
        profile.diamonds -= buyPrice(type); profile.owned.push(type);
        save.saveProfile(profile); onChange(); render();
      }
    });
  }
  render(); ov.style.display = 'flex';
}
