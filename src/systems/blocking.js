import { dist } from '../core/geometry.js';
import { spawnSoldier } from '../entities/soldier.js';

const RESPAWN = 4; // 士兵重生秒

// 兵營被賣掉/移除時：釋放它的士兵正在攔截的敵人，避免敵人永久卡住(blockedBy 指向不存在的士兵)
export function releaseBarracks(b, enemies) {
  if (!b.soldiers) return;
  const ids = new Set(b.soldiers.map(s => s.id));
  for (const e of enemies) if (ids.has(e.blockedBy)) e.blockedBy = null;
}

export function updateBlocking(b, enemies, dt, now) {
  // 補足/重生士兵
  while (b.soldiers.length < b.maxSoldiers) b.soldiers.push(spawnSoldier(b, b.soldiers.length));
  for (const s of b.soldiers) {
    if (!s.alive) { s.respawn -= dt; if (s.respawn <= 0) Object.assign(s, spawnSoldier(b, b.soldiers.indexOf(s))); continue; }

    // 目標仍有效?
    let target = s.targetId != null ? enemies.find(e => e.id === s.targetId && e.alive) : null;
    if (target && (target.reachedEnd || dist(s.x, s.y, target.x, target.y) > b.engageRange)) {
      if (target.blockedBy === s.id) target.blockedBy = null;
      target = null; s.targetId = null;
    }
    // 找新目標：射程內、地面、未被擋（或已被本士兵擋）
    if (!target) {
      let best = null, bd = b.engageRange;
      for (const e of enemies) {
        if (!e.alive || e.reachedEnd || e.armorType === 'flying' || (e.blockedBy != null && e.blockedBy !== s.id)) continue;
        const d = dist(s.x, s.y, e.x, e.y);
        if (d <= bd) { bd = d; best = e; }
      }
      if (best) { target = best; s.targetId = best.id; best.blockedBy = s.id; }
    }
    if (!target) continue;

    // 纏鬥：互扣血
    s.atkCd -= dt;
    if (s.atkCd <= 0) { target.hp -= s.dmg; s.atkCd = 1 / s.atk; }
    target.atkCd -= dt;
    if (target.atkCd <= 0 && target.dmg > 0) { s.hp -= target.dmg; target.atkCd = 1 / target.atk; }

    if (s.hp <= 0) {
      s.alive = false; s.respawn = RESPAWN;
      if (target.blockedBy === s.id) target.blockedBy = null;
      s.targetId = null;
    }
  }
}
