import { dist } from '../core/geometry.js';

export function applyEnemyAbilities(ctx, dt) {
  const { enemies, towers, economy, spawnMinion } = ctx;
  for (const e of enemies) {
    if (!e.alive || !e.ability) continue;
    const a = e.ability;
    switch (a.type) {
      case 'enrage':
        if (!e.enraged && e.hp / e.maxHp <= a.threshold) { e.speed *= a.boost; e.enraged = true; }
        break;
      case 'healAura':
        for (const o of enemies) if (o.alive && o !== e && o.hp < o.maxHp && dist(e.x, e.y, o.x, o.y) <= a.radius)
          o.hp = Math.min(o.maxHp, o.hp + a.hps * dt);
        break;
      case 'slowTowerAura':
        for (const t of towers) if (dist(e.x, e.y, t.x, t.y) <= a.radius) t.debuffRate = Math.min(t.debuffRate ?? 1, a.factor);
        break;
      case 'fearAura':
        for (const t of towers) if (dist(e.x, e.y, t.x, t.y) <= a.radius) t.feared = true;
        break;
      case 'goldSteal':
        e.abilityCd -= dt;
        if (e.abilityCd <= 0) { economy.gold = Math.max(0, economy.gold - a.amount); e.abilityCd = a.interval; }
        break;
      case 'summon':
        e.abilityCd -= dt;
        if (e.abilityCd <= 0) { spawnMinion(e, a.minion); e.abilityCd = a.interval; }
        break;
    }
  }
}
