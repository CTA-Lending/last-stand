import { dist } from '../core/geometry.js';

export function inRange(tower, enemy) {
  return dist(tower.x, tower.y, enemy.x, enemy.y) <= tower.range;
}

export function selectTarget(tower, enemies) {
  const candidates = enemies.filter(e =>
    e.alive && !e.reachedEnd &&
    (tower.canHitAir || !e.flying) &&
    inRange(tower, e)
  );
  if (candidates.length === 0) return null;
  const priority = tower.priority || 'first';
  const score = {
    first: e => e.seg + (e.x + e.y) * 1e-6,   // 路徑最前
    last: e => -(e.seg + (e.x + e.y) * 1e-6),  // 路徑最後
    strong: e => e.hp,
    near: e => -dist(tower.x, tower.y, e.x, e.y),
  }[priority];
  return candidates.reduce((best, e) => (score(e) > score(best) ? e : best));
}
