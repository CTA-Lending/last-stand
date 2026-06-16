import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDamage } from '../src/systems/combat.js';

// 五行相剋：金剋木、木剋土、土剋水、水剋火、火剋金
test('金剋木 ×1.5', () => {
  assert.equal(computeDamage(100, 'metal', 'wood'), 150);
});
test('木被金剋 ×0.6', () => {
  assert.equal(computeDamage(100, 'wood', 'metal'), 60);
});
test('水剋火 ×1.5', () => {
  assert.equal(computeDamage(100, 'water', 'fire'), 150);
});
test('同元素 ×1.0', () => {
  assert.equal(computeDamage(100, 'fire', 'fire'), 100);
});
test('相生中性(火生土) ×1.0', () => {
  assert.equal(computeDamage(100, 'fire', 'earth'), 100);
});
test('傷害不為負', () => {
  assert.equal(computeDamage(-5, 'metal', 'wood'), 0);
});
