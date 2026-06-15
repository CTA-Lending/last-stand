import { TOWERS } from '../data/towers.js';

export function towerRole(def) {
  if (def.kind === 'barracks') return '兵營·擋路';
  if (def.kind === 'banner') return '光環·增益';
  if (def.kind === 'mine') return '地雷·陷阱';
  return { physical: '物理', siege: '攻城', magic: '魔法' }[def.attackType] || '—';
}

export function isOwned(type, gachaUnlocked) {
  const def = TOWERS[type];
  if (def.gachaOnly) return !!(gachaUnlocked && gachaUnlocked.has(type));
  return true;
}
