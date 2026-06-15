import { dist } from '../core/geometry.js';

export function chainTargets(first, enemies, radius, maxJumps) {
  const chain = [first];
  const used = new Set([first.id]);
  let cur = first;
  for (let j = 0; j < maxJumps; j++) {
    let best = null, bd = radius;
    for (const e of enemies) {
      if (!e.alive || e.reachedEnd || used.has(e.id)) continue;
      const d = dist(cur.x, cur.y, e.x, e.y);
      if (d <= bd) { bd = d; best = e; }
    }
    if (!best) break;
    chain.push(best); used.add(best.id); cur = best;
  }
  return chain;
}
