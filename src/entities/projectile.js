import { dist } from '../core/geometry.js';
import { computeDamage } from '../systems/combat.js';
import { applyEffect } from '../systems/effects.js';
import { chainTargets } from '../systems/chain.js';

let nextId = 1;

export function spawnProjectile(tower, target) {
  const proj = {
    id: nextId++, x: tower.x, y: tower.y, targetId: target.id,
    speed: 420, damage: tower.damage * (tower.buffDmg || 1), attackType: tower.attackType,
    splash: tower.splash, effect: tower.effect || null,
    color: tower.color, alive: true, chain: tower.chain || null,
    polymorph: tower.polymorph || null,
    trail: [],
  };
  if (tower.pierce) {
    const d = dist(tower.x, tower.y, target.x, target.y) || 1;
    proj.pierce = true; proj.pierceMax = tower.pierce;
    proj.dx = (target.x - tower.x) / d; proj.dy = (target.y - tower.y) / d;
    proj.hitSet = new Set(); proj.traveled = 0;
    proj.range = tower.range; proj.canHitAir = tower.canHitAir;
  }
  return proj;
}

// 命中回傳爆點與受擊清單，傷害由呼叫端套用（含粒子）
export function updateProjectile(p, enemies, dt, now) {
  if (p.pierce) return updatePierce(p, enemies, dt, now);
  const target = enemies.find(e => e.id === p.targetId && e.alive);
  if (!target) { p.alive = false; return null; }
  // 拖尾記錄
  if (p.trail) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 5) p.trail.shift(); }
  const d = dist(p.x, p.y, target.x, target.y);
  const move = p.speed * dt;
  if (d <= move) {
    p.alive = false;
    if (p.chain) {
      const seq = chainTargets(target, enemies, p.chain.radius, p.chain.count);
      let dmg = p.damage;
      const nodes = [];
      for (const e of seq) {
        e.hp -= computeDamage(dmg, p.attackType, e.armorType);
        if (p.effect) applyEffect(e, p.effect, now);
        e.hitFlash = 0.12;
        nodes.push({ x: e.x, y: e.y });
        dmg *= p.chain.falloff;
      }
      return { x: target.x, y: target.y, hits: seq, nodes };
    }
    const hits = p.splash > 0
      ? enemies.filter(e => e.alive && dist(target.x, target.y, e.x, e.y) <= p.splash)
      : [target];
    for (const e of hits) {
      e.hp -= computeDamage(p.damage, p.attackType, e.armorType);
      if (p.effect) applyEffect(e, p.effect, now);
      if (p.polymorph && rollPolymorph(e, p.polymorph.chance, Math.random)) e.hp = 0; // 變形即死
      e.hitFlash = 0.12;
    }
    return { x: target.x, y: target.y, hits };
  }
  p.x += (target.x - p.x) / d * move;
  p.y += (target.y - p.y) / d * move;
  return null;
}

function updatePierce(p, enemies, dt, now) {
  // 拖尾記錄（穿透彈）
  if (p.trail) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 5) p.trail.shift(); }
  p.x += p.dx * p.speed * dt;
  p.y += p.dy * p.speed * dt;
  p.traveled += p.speed * dt;
  const newly = [];
  for (const e of enemies) {
    if (!e.alive || p.hitSet.has(e.id)) continue;
    if (!p.canHitAir && e.flying) continue;
    if (dist(p.x, p.y, e.x, e.y) <= (e.radius || 12) + 4) {
      e.hp -= computeDamage(p.damage, p.attackType, e.armorType);
      if (p.effect) applyEffect(e, p.effect, now);
      e.hitFlash = 0.12;
      p.hitSet.add(e.id);
      newly.push({ x: e.x, y: e.y });
    }
  }
  if (p.hitSet.size >= p.pierceMax || p.traveled > p.range + 80) p.alive = false;
  return newly.length ? { x: p.x, y: p.y, hits: newly } : null;
}

// 變形判定：首領免疫；rand() < chance 則變形(即死)
export function rollPolymorph(target, chance, rand) {
  if (target.boss) return false;
  return rand() < chance;
}
