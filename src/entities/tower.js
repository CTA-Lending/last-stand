import { TOWERS } from '../data/towers.js';
import { selectTarget } from '../systems/targeting.js';
import { spawnProjectile } from './projectile.js';

let nextId = 1;

export function towerStats(type, level) {
  return TOWERS[type].levels[level];
}

export function buildTower(type, slot) {
  const def = TOWERS[type];
  const s = def.levels[0];
  return {
    id: nextId++, type, slot, x: slot.x, y: slot.y,
    attackType: def.attackType, canHitAir: def.canHitAir, splash: def.splash,
    color: def.color, level: 0,
    range: s.range, damage: s.damage, fireRate: s.fireRate,
    cooldown: 0, priority: 'first',
  };
}

export function upgradeTower(t) {
  const def = TOWERS[t.type];
  if (t.level >= def.levels.length - 1) return false;
  t.level += 1;
  const s = def.levels[t.level];
  t.range = s.range; t.damage = s.damage; t.fireRate = s.fireRate;
  return true;
}

export function upgradeCost(t) {
  const def = TOWERS[t.type];
  return t.level >= def.levels.length - 1 ? null : def.levels[t.level + 1].cost;
}

export function updateTower(t, enemies, projectiles, dt) {
  t.cooldown -= dt;
  if (t.cooldown > 0) return;
  const target = selectTarget(t, enemies);
  if (!target) return;
  projectiles.push(spawnProjectile(t, target));
  t.cooldown = 1 / t.fireRate;
}
