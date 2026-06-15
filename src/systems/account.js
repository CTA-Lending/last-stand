import { TOWERS } from '../data/towers.js';

export const STARTER_TOWERS = ['elf_archer', 'dwarf_cannon', 'mage_arcane', 'human_barracks'];
export const LOADOUT_MAX = 6;
const CAMPAIGN_DIAMOND = { normal: 30, hero: 60, hell: 120 };

export function isOwned(type, owned) { return owned.includes(type); }

export function buyPrice(type) { return TOWERS[type].diamond || null; }

export function canBuy(type, owned, diamonds) {
  const price = buyPrice(type);
  return price != null && !owned.includes(type) && diamonds >= price;
}

export function toggleLoadout(loadout, type, max) {
  if (loadout.includes(type)) return loadout.filter(t => t !== type);
  if (loadout.length >= max) return loadout;
  return [...loadout, type];
}

export function runDiamonds(result) {
  if (result.mode === 'campaign') return result.won ? (CAMPAIGN_DIAMOND[result.difficulty] || 0) : 0;
  return Math.floor((result.wave || 0) * 2);
}
