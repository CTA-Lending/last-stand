import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateBlocking, releaseBarracks } from '../src/systems/blocking.js';

function barracks() {
  return { kind: 'barracks', x: 100, y: 100, rally: { x: 100, y: 100 },
    soldiers: [], soldierHp: 60, soldierDmg: 8, soldierAtk: 0.8, maxSoldiers: 2, engageRange: 40 };
}
function enemy(o) {
  return { id: 1, x: 100, y: 100, hp: 50, armorType: 'light', alive: true, reachedEnd: false,
    dmg: 10, atk: 1.0, atkCd: 0, blockedBy: null, ...o };
}

test('兵營會生出士兵(至多 max)', () => {
  const b = barracks();
  updateBlocking(b, [], 0.1, 0);
  assert.equal(b.soldiers.length, 2);
});
test('射程內地面敵被指派攔截、標記 blockedBy', () => {
  const b = barracks();
  const e = enemy({ x: 110, y: 100 });
  updateBlocking(b, [e], 0.1, 0);
  assert.equal(e.blockedBy != null, true);
});
test('飛行敵不被攔', () => {
  const b = barracks();
  const e = enemy({ flying: true, x: 110, y: 100 });
  updateBlocking(b, [e], 0.1, 0);
  assert.equal(e.blockedBy, null);
});
test('纏鬥時士兵與敵互扣血', () => {
  const b = barracks();
  const e = enemy({ x: 105, y: 100, hp: 100 });
  for (let i = 0; i < 20; i++) updateBlocking(b, [e], 0.1, i * 0.1); // 跑2秒
  const s = b.soldiers[0];
  assert.ok(e.hp < 100);          // 敵被砍
  assert.ok(s.hp < s.maxHp || !s.alive); // 士兵被打
});
test('賣兵營會釋放被擋的敵人(不永久卡住)', () => {
  const b = barracks();
  const e = enemy({ x: 110, y: 100 });
  updateBlocking(b, [e], 0.1, 0);
  assert.ok(e.blockedBy != null);   // 已被擋
  releaseBarracks(b, [e]);
  assert.equal(e.blockedBy, null);  // 賣掉後釋放
});
