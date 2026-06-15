import { TOWERS } from '../data/towers.js';

export const STARTER_TOWERS = ['elf_archer', 'dwarf_cannon', 'mage_arcane', 'human_barracks'];
export const LOADOUT_MAX = 6;
const CAMPAIGN_DIAMOND = { normal: 30, hero: 60, hell: 120 };

/** 一行數值摘要，用於 tooltip / shop 說明 */
export function towerSummary(type) {
  const def = TOWERS[type];
  if (!def) return '';
  const lv = def.levels[0];
  if (def.kind === 'barracks') {
    return `肉盾 · 士兵${lv.maxSoldiers}名 血${lv.soldierHp} 攻${lv.soldierDmg}`;
  }
  if (def.kind === 'banner') {
    return `光環 · 傷害×${lv.buffDamage} 射速×${lv.buffFireRate} 範圍${lv.range}`;
  }
  if (def.kind === 'mine') {
    return `地雷 · 傷害${lv.damage} 爆炸${lv.splash} 最多${lv.maxMines}顆`;
  }
  return `傷害${lv.damage} 射程${lv.range} 攻速${lv.fireRate}`;
}

export function isOwned(type, owned) { return owned.includes(type); }

export function buyPrice(type) { return TOWERS[type].diamond || null; }

export function canBuy(type, owned, diamonds) {
  const price = buyPrice(type);
  return price != null && !owned.includes(type) && diamonds >= price;
}

export function toggleLoadout(loadout, type, max) {
  if (loadout.includes(type)) {
    if (loadout.length <= 1) return loadout; // 至少保留 1 塔，避免空編隊鎖死
    return loadout.filter(t => t !== type);
  }
  if (loadout.length >= max) return loadout;
  return [...loadout, type];
}

export function runDiamonds(result) {
  if (result.mode === 'campaign') return result.won ? (CAMPAIGN_DIAMOND[result.difficulty] || 0) : 0;
  return Math.floor((result.wave || 0) * 2);
}
