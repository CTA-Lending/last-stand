import { advancePath } from '../systems/pathing.js';
import { ENEMIES } from '../data/enemies.js';

let nextId = 1;

export function spawnEnemy(spec, map) {
  const def = ENEMIES[spec.type];
  return {
    id: nextId++, type: spec.type,
    x: map.spawn.x, y: map.spawn.y, seg: 0,
    hp: spec.hp, maxHp: spec.maxHp, armorType: spec.armorType,
    speed: spec.speed, bounty: spec.bounty, boss: spec.boss,
    radius: def.radius, color: def.color,
    alive: true, reachedEnd: false,
    slowUntil: 0, slowFactor: 1, dots: [], hitFlash: 0, // slowUntil/slowFactor/dots reserved for Phase 2 — no tower applies them yet
  };
}

export function updateEnemy(e, map, dt, now) {
  if (!e.alive) return;
  // DoT
  for (const d of e.dots) {
    if (now < d.until) e.hp -= d.dps * dt;
  }
  e.dots = e.dots.filter(d => now < d.until);
  if (e.hp <= 0) { e.alive = false; return; }
  // 減速（過期重設 factor 確保視覺一致）
  if (now >= e.slowUntil) e.slowFactor = 1;
  const factor = now < e.slowUntil ? e.slowFactor : 1;
  if (e.hitFlash > 0) e.hitFlash -= dt;
  const moved = advancePath(map.path, e.seg, e.x, e.y, e.speed * factor * dt);
  e.x = moved.x; e.y = moved.y; e.seg = moved.seg;
  if (moved.done) { e.reachedEnd = true; e.alive = false; }
}
