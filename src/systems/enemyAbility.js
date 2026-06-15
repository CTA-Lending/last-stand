import { dist } from '../core/geometry.js';

const ENEMY_CAP = 120; // 召喚軟上限：避免無上限召喚拖效能/卡波次

export function applyEnemyAbilities(ctx, dt) {
  const { enemies, towers, economy, spawnMinion } = ctx;
  for (const e of enemies) {
    if (!e.alive || !e.ability) continue;
    const a = e.ability;
    switch (a.type) {
      case 'enrage':
        if (!e.enraged && e.hp / e.maxHp <= a.threshold) {
          e.speed *= a.boost; e.enraged = true;
          if (ctx.onAbility) ctx.onAbility(e, a.type);
        }
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
        if (e.abilityCd <= 0) {
          economy.gold = Math.max(0, economy.gold - a.amount); e.abilityCd = a.interval;
          if (ctx.onAbility) ctx.onAbility(e, a.type);
        }
        break;
      case 'summon':
        e.abilityCd -= dt;
        if (e.abilityCd <= 0) {
          // 軟上限內才召喚，避免無上限堆怪拖效能/卡住波次清空判定
          if (enemies.reduce((n, o) => n + (o.alive ? 1 : 0), 0) < ENEMY_CAP) spawnMinion(e, a.minion);
          e.abilityCd = a.interval;
          if (ctx.onAbility) ctx.onAbility(e, a.type);
        }
        break;
    }
  }
}
