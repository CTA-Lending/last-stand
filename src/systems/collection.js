import { TOWERS } from '../data/towers.js';
import { ELEMENT_INFO } from '../data/attackMatrix.js';

export function towerRole(def) {
  const el = ELEMENT_INFO[def.attackType] ? ELEMENT_INFO[def.attackType].name + '屬' : '';
  if (def.kind === 'barracks') return '兵營·擋路' + (el ? ' · ' + el : '');
  if (def.kind === 'banner') return '光環·增益' + (el ? ' · ' + el : '');
  if (def.kind === 'mine') return '地雷·陷阱' + (el ? ' · ' + el : '');
  return el || '—';
}

export function isOwned(type, gachaUnlocked) {
  const def = TOWERS[type];
  if (def.gachaOnly) return !!(gachaUnlocked && gachaUnlocked.has(type));
  return true;
}
