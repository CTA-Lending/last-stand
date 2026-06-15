import { dist } from '../core/geometry.js';
import { computeDamage } from '../systems/combat.js';

export function updateMines(t, enemies, dt) {
  const dets = [];
  // 補雷
  t.mineCd -= dt;
  if (t.mineCd <= 0 && t.mines.length < t.maxMines && t.mineSlots.length) {
    const free = t.mineSlots.filter(s => !t.mines.some(m => m.x === s.x && m.y === s.y));
    if (free.length) { t.mines.push({ x: free[0].x, y: free[0].y }); t.mineCd = t.mineRate; }
  }
  // 偵測踩雷(地面敵)
  for (let i = t.mines.length - 1; i >= 0; i--) {
    const m = t.mines[i];
    const trig = enemies.find(e => e.alive && !e.reachedEnd && e.armorType !== 'flying' && dist(m.x, m.y, e.x, e.y) <= 14);
    if (!trig) continue;
    for (const e of enemies) if (e.alive && dist(m.x, m.y, e.x, e.y) <= t.splash) {
      e.hp -= computeDamage(t.damage, 'siege', e.armorType); e.hitFlash = 0.12;
    }
    t.mines.splice(i, 1);
    dets.push({ x: m.x, y: m.y });
  }
  return dets;
}
