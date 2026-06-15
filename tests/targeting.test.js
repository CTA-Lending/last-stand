import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectTarget } from '../src/systems/targeting.js';

const tower = { x: 0, y: 0, range: 100, canHitAir: false, priority: 'first' };
function enemy(o) {
  return { id: 1, x: 0, y: 0, hp: 10, armorType: 'light', seg: 0, alive: true, reachedEnd: false, ...o };
}

test('射程外不鎖定', () => {
  const t = selectTarget(tower, [enemy({ id: 1, x: 200, y: 0 })]);
  assert.equal(t, null);
});
test('不能打空時略過飛行', () => {
  const t = selectTarget(tower, [enemy({ id: 1, x: 50, y: 0, armorType: 'flying' })]);
  assert.equal(t, null);
});
test('first 選路徑最前（seg 大者）', () => {
  const t = selectTarget({ ...tower }, [
    enemy({ id: 1, x: 10, y: 0, seg: 0 }),
    enemy({ id: 2, x: 20, y: 0, seg: 2 }),
  ]);
  assert.equal(t.id, 2);
});
test('strong 選血量最高', () => {
  const t = selectTarget({ ...tower, priority: 'strong' }, [
    enemy({ id: 1, x: 10, y: 0, hp: 10 }),
    enemy({ id: 2, x: 20, y: 0, hp: 99 }),
  ]);
  assert.equal(t.id, 2);
});
test('last 選路徑最後（seg 小者）', () => {
  const t = selectTarget({ ...tower, priority: 'last' }, [
    enemy({ id: 1, x: 10, y: 0, seg: 0 }),
    enemy({ id: 2, x: 20, y: 0, seg: 2 }),
  ]);
  assert.equal(t.id, 1);
});
test('near 選離塔最近', () => {
  const t = selectTarget({ ...tower, priority: 'near' }, [
    enemy({ id: 1, x: 80, y: 0 }),
    enemy({ id: 2, x: 20, y: 0 }),
  ]);
  assert.equal(t.id, 2);
});
