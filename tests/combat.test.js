import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDamage } from '../src/systems/combat.js';

test('物理剋輕甲 ×1.5', () => {
  assert.equal(computeDamage(100, 'physical', 'light'), 150);
});
test('物理打重甲 ×0.5', () => {
  assert.equal(computeDamage(100, 'physical', 'heavy'), 50);
});
test('攻城剋重甲 ×1.5', () => {
  assert.equal(computeDamage(100, 'siege', 'heavy'), 150);
});
test('魔法剋法甲 ×1.5', () => {
  assert.equal(computeDamage(100, 'magic', 'magic'), 150);
});
test('傷害不為負', () => {
  assert.equal(computeDamage(-5, 'magic', 'light'), 0);
});
