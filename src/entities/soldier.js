let nextId = 1;

export function spawnSoldier(b, i) {
  const spread = (i - (b.maxSoldiers - 1) / 2) * 14;
  return {
    id: nextId++, x: b.rally.x + spread, y: b.rally.y, hp: b.soldierHp, maxHp: b.soldierHp,
    dmg: b.soldierDmg, atk: b.soldierAtk, atkCd: 0, targetId: null, alive: true, respawn: 0,
  };
}
