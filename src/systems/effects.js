// 把塔/技能的 effect 套到敵人身上（就地修改）。now = 遊戲秒數。
export function applyEffect(enemy, effect, now) {
  if (!effect) return;
  if (effect.slow) {
    const until = now + effect.slow.duration;
    // 取較強(factor較小)或更久者
    if (effect.slow.factor < enemy.slowFactor || now >= enemy.slowUntil) {
      enemy.slowFactor = Math.min(enemy.slowFactor, effect.slow.factor);
    }
    enemy.slowUntil = Math.max(enemy.slowUntil, until);
  }
  if (effect.dot) {
    enemy.dots.push({ dps: effect.dot.dps, until: now + effect.dot.duration });
  }
}
