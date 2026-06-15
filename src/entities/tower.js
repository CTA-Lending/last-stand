import { TOWERS } from '../data/towers.js';
import { selectTarget } from '../systems/targeting.js';
import { spawnProjectile } from './projectile.js';

let nextId = 1;

function applyStats(t, s) {
  t.range = s.range; t.damage = s.damage; t.fireRate = s.fireRate;
  if (s.splash !== undefined) t.splash = s.splash;
  if (s.effect !== undefined) t.effect = s.effect;
  if (s.chain !== undefined) t.chain = s.chain;
  if (s.pierce !== undefined) t.pierce = s.pierce;
  if (s.polymorph !== undefined) t.polymorph = s.polymorph;
  for (const k of ['soldierHp', 'soldierDmg', 'soldierAtk', 'maxSoldiers', 'engageRange',
                   'buffDamage', 'buffFireRate', 'maxMines', 'mineRate']) {
    if (s[k] !== undefined) t[k] = s[k];
  }
}

export function buildTower(type, slot) {
  const def = TOWERS[type];
  const s = def.levels[0];
  const t = {
    id: nextId++, type, x: slot.x, y: slot.y,
    attackType: def.attackType, canHitAir: def.canHitAir, splash: def.splash || 0,
    effect: def.effect || null, color: def.color, chain: def.chain || null,
    pierce: def.pierce || 0, polymorph: def.polymorph || null, level: 0, branch: null,
    cooldown: 0, priority: 'first', invested: s.cost,
  };
  applyStats(t, s);
  if (def.kind === 'barracks') {
    t.kind = 'barracks';
    t.rally = null;       // 由 main 建造後用 nearestPointOnPath 設定
    t.soldiers = [];
  }
  if (def.kind === 'banner') { t.kind = 'banner'; }
  if (def.kind === 'mine') { t.kind = 'mine'; t.mines = []; t.mineSlots = []; t.mineCd = 0; }
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

// 科技樹：場上要有前置塔才能蓋；gachaOnly 需轉蛋解鎖(gachaUnlocked Set)
export function isTowerUnlocked(type, towers, gachaUnlocked) {
  const def = TOWERS[type];
  if (def.gachaOnly && !(gachaUnlocked && gachaUnlocked.has(type))) return false;
  if (!def.requires || def.requires.length === 0) return true;
  return def.requires.every(req => towers.some(t => t.type === req));
}

// 未解鎖時給 UI 的提示字串；已解鎖回 null
export function towerLockReason(type, towers, gachaUnlocked) {
  const def = TOWERS[type];
  if (def.gachaOnly && !(gachaUnlocked && gachaUnlocked.has(type))) return '🔒 轉蛋解鎖';
  if (def.requires) {
    const missing = def.requires.filter(req => !towers.some(t => t.type === req));
    if (missing.length) return '🔒 需' + missing.map(r => TOWERS[r].name).join('、');
  }
  return null;
}

export function updateTower(t, enemies, projectiles, dt) {
  t.cooldown -= dt;
  if (t.cooldown > 0) return;
  if (t.feared && Math.random() < 0.35) { t.cooldown = 0.2; return; } // 恐懼:機率不發
  const target = selectTarget(t, enemies);
  if (!target) return;
  t.aimAngle = Math.atan2(target.y - t.y, target.x - t.x);
  projectiles.push(spawnProjectile(t, target));
  const rate = t.fireRate * (t.buffRate || 1) * (t.debuffRate || 1);
  t.cooldown = 1 / rate;
}
