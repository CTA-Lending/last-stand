import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawGacha, isNewDay, GACHA_POOL } from '../src/systems/gacha.js';

test('轉蛋池為龍與神', () => {
  assert.deepEqual([...GACHA_POOL].sort(), ['divine_temple', 'dragon_whelp']);
});
test('抽出尚未解鎖的塔', () => {
  const r = drawGacha(['dragon_whelp'], () => 0); // 只剩神族
  assert.equal(r.type, 'divine_temple');
  assert.equal(r.dup, false);
});
test('全解鎖則回 dup', () => {
  const r = drawGacha(['dragon_whelp', 'divine_temple'], () => 0);
  assert.equal(r.dup, true);
});
test('未命中(0.001%)時槓龜 miss', () => {
  const r = drawGacha([], () => 0.5); // 0.5 遠大於 0.00001 → 槓龜
  assert.equal(r.miss, true);
  assert.equal(r.type, null);
});
test('換日判定', () => {
  assert.equal(isNewDay(null, '2026-06-15'), true);
  assert.equal(isNewDay('2026-06-14', '2026-06-15'), true);
  assert.equal(isNewDay('2026-06-15', '2026-06-15'), false);
});
