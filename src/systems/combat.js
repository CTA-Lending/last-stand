import { ATTACK_MATRIX } from '../data/attackMatrix.js';

export function computeDamage(amount, attackType, armorType) {
  const row = ATTACK_MATRIX[attackType];
  const mult = row && row[armorType] != null ? row[armorType] : 1;
  return Math.max(0, amount * mult);
}
