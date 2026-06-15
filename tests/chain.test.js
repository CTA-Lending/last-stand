import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chainTargets } from '../src/systems/chain.js';

const mk = (id, x) => ({ id, x, y: 0, alive: true, reachedEnd: false });

test('沿最近距離依序連鎖', () => {
  const a = mk(1, 0), b = mk(2, 30), c = mk(3, 70);
  const seq = chainTargets(a, [a, b, c], 50, 3);
  assert.deepEqual(seq.map(e => e.id), [1, 2, 3]); // 0→30→70 都在50內逐跳
});
test('超出半徑就停', () => {
  const a = mk(1, 0), b = mk(2, 200);
  const seq = chainTargets(a, [a, b], 50, 3);
  assert.deepEqual(seq.map(e => e.id), [1]);
});
test('maxJumps 限制跳數', () => {
  const es = [mk(1, 0), mk(2, 20), mk(3, 40), mk(4, 60)];
  const seq = chainTargets(es[0], es, 50, 1);
  assert.equal(seq.length, 2); // first + 1 跳
});
test('不重複命中同一敵', () => {
  const a = mk(1, 0), b = mk(2, 10);
  const seq = chainTargets(a, [a, b], 50, 5);
  assert.equal(new Set(seq.map(e => e.id)).size, seq.length);
});
