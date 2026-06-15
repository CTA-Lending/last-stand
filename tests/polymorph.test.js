import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollPolymorph } from '../src/entities/projectile.js';

test('首領免疫變形', () => {
  assert.equal(rollPolymorph({ boss: true }, 1, () => 0), false);
});
test('非首領且骰中 → 變形', () => {
  assert.equal(rollPolymorph({ boss: false }, 0.3, () => 0.1), true);  // 0.1<0.3
});
test('非首領但沒骰中 → 否', () => {
  assert.equal(rollPolymorph({ boss: false }, 0.3, () => 0.9), false); // 0.9>=0.3
});
