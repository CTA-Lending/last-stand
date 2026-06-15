import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advancePath } from '../src/systems/pathing.js';

const WP = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];

test('在第一段內前進', () => {
  const r = advancePath(WP, 0, 0, 0, 30);
  assert.equal(r.x, 30);
  assert.equal(r.y, 0);
  assert.equal(r.seg, 0);
  assert.equal(r.done, false);
});
test('跨過轉角進入下一段', () => {
  const r = advancePath(WP, 0, 90, 0, 30);
  assert.equal(r.seg, 1);
  assert.equal(Math.round(r.x), 100);
  assert.equal(Math.round(r.y), 20);
});
test('走到終點標記 done', () => {
  const r = advancePath(WP, 1, 100, 90, 50);
  assert.equal(r.done, true);
  assert.equal(r.x, 100);
  assert.equal(r.y, 100);
});
