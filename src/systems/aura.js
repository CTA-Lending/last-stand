import { dist } from '../core/geometry.js';

export function buffMultFor(tower, towers) {
  let dmg = 1, rate = 1;
  for (const b of towers) {
    if (b.kind !== 'banner' || b === tower) continue;
    if (dist(tower.x, tower.y, b.x, b.y) <= b.range) { dmg *= b.buffDamage; rate *= b.buffFireRate; }
  }
  return { dmg, rate };
}

export function applyAuras(towers) {
  for (const t of towers) {
    if (t.kind === 'banner') continue;
    const m = buffMultFor(t, towers);
    t.buffDmg = m.dmg; t.buffRate = m.rate;
  }
}
