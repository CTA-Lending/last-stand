import { TOWERS } from '../data/towers.js';
import { selectTarget } from '../systems/targeting.js';
import { spawnProjectile } from './projectile.js';

let nextId = 1;

function applyStats(t, s) {
  t.range = s.range; t.damage = s.damage; t.fireRate = s.fireRate;
  if (s.splash !== undefined) t.splash = s.splash;
  if (s.effect !== undefined) t.effect = s.effect;
  for (const k of ['soldierHp', 'soldierDmg', 'soldierAtk', 'maxSoldiers', 'engageRange']) {
    if (s[k] !== undefined) t[k] = s[k];
  }
}

export function buildTower(type, slot) {
  const def = TOWERS[type];
  const s = def.levels[0];
  const t = {
    id: nextId++, type, x: slot.x, y: slot.y,
    attackType: def.attackType, canHitAir: def.canHitAir, splash: def.splash || 0,
    effect: def.effect || null, color: def.color, level: 0, branch: null,
    cooldown: 0, priority: 'first', invested: s.cost,
  };
  applyStats(t, s);
  if (def.kind === 'barracks') {
    t.kind = 'barracks';
    t.rally = null;       // 由 main 建造後用 nearestPointOnPath 設定
    t.soldiers = [];
  }
  return t;
}

export function canUpgrade(t) { return t.level < TOWERS[t.type].levels.length - 1; }
export function upgradeCost(t) {
  return canUpgrade(t) ? TOWERS[t.type].levels[t.level + 1].cost : null;
}
export function upgradeTower(t) {
  if (!canUpgrade(t)) return false;
  t.level += 1;
  const s = TOWERS[t.type].levels[t.level];
  applyStats(t, s); t.invested += s.cost;
  return true;
}

export function canBranch(t) {
  return t.level === TOWERS[t.type].levels.length - 1 && t.branch === null;
}
export function branchOptions(t) { return TOWERS[t.type].branches; }
export function chooseBranch(t, i) {
  if (!canBranch(t)) return false;
  const b = TOWERS[t.type].branches[i];
  applyStats(t, b); t.branch = i; t.invested += b.cost;
  return true;
}

export function sellValue(t, refundRate) { return Math.floor(t.invested * refundRate); }

export function updateTower(t, enemies, projectiles, dt) {
  t.cooldown -= dt;
  if (t.cooldown > 0) return;
  const target = selectTarget(t, enemies);
  if (!target) return;
  projectiles.push(spawnProjectile(t, target));
  t.cooldown = 1 / t.fireRate;
}
