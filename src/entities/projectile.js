import { dist } from '../core/geometry.js';
import { computeDamage } from '../systems/combat.js';
import { applyEffect } from '../systems/effects.js';

let nextId = 1;

export function spawnProjectile(tower, target) {
  return {
    id: nextId++, x: tower.x, y: tower.y, targetId: target.id,
    speed: 420, damage: tower.damage, attackType: tower.attackType,
    splash: tower.splash, effect: tower.effect || null,
    color: tower.color, alive: true,
  };
}

// 命中回傳爆點與受擊清單，傷害由呼叫端套用（含粒子）
export function updateProjectile(p, enemies, dt, now) {
  const target = enemies.find(e => e.id === p.targetId && e.alive);
  if (!target) { p.alive = false; return null; }
  const d = dist(p.x, p.y, target.x, target.y);
  const move = p.speed * dt;
  if (d <= move) {
    p.alive = false;
    const hits = p.splash > 0
      ? enemies.filter(e => e.alive && dist(target.x, target.y, e.x, e.y) <= p.splash)
      : [target];
    for (const e of hits) {
      e.hp -= computeDamage(p.damage, p.attackType, e.armorType);
      if (p.effect) applyEffect(e, p.effect, now);
      e.hitFlash = 0.12;
    }
    return { x: target.x, y: target.y, hits };
  }
  p.x += (target.x - p.x) / d * move;
  p.y += (target.y - p.y) / d * move;
  return null;
}
