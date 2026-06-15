import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyEffect } from '../src/systems/effects.js';

function enemy() { return { slowUntil: 0, slowFactor: 1, dots: [] }; }

test('套用減速設定 slowUntil/slowFactor', () => {
  const e = enemy();
  applyEffect(e, { slow: { factor: 0.5, duration: 2 } }, 10);
  assert.equal(e.slowUntil, 12);
  assert.equal(e.slowFactor, 0.5);
});
test('更強的減速(factor較小)才覆蓋', () => {
  const e = enemy();
  applyEffect(e, { slow: { factor: 0.4, duration: 2 } }, 0);
  applyEffect(e, { slow: { factor: 0.8, duration: 2 } }, 0);
  assert.equal(e.slowFactor, 0.4);
});
test('減速過期後由較弱減速取代(不殘留舊強值)', () => {
  const e = enemy();
  applyEffect(e, { slow: { factor: 0.4, duration: 2 } }, 0);  // 0~2 生效
  applyEffect(e, { slow: { factor: 0.8, duration: 2 } }, 5);  // 已過期，應取代為 0.8
  assert.equal(e.slowFactor, 0.8);
  assert.equal(e.slowUntil, 7);
});
test('套用DoT推入dots', () => {
  const e = enemy();
  applyEffect(e, { dot: { dps: 12, duration: 3 } }, 5);
  assert.equal(e.dots.length, 1);
  assert.equal(e.dots[0].dps, 12);
  assert.equal(e.dots[0].until, 8);
});
test('無effect不報錯', () => {
  const e = enemy();
  applyEffect(e, undefined, 0);
  applyEffect(e, {}, 0);
  assert.equal(e.dots.length, 0);
});
