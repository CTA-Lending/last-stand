import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSaveService } from '../src/services/saveService.js';

function fakeStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test('無記錄時 best 為 null', () => {
  const s = createSaveService(fakeStorage());
  assert.equal(s.getBest(), null);
});
test('提交成績存最佳', () => {
  const s = createSaveService(fakeStorage());
  s.submit({ wave: 8, time: 120, score: 500 });
  assert.equal(s.getBest().wave, 8);
});
test('只有更好（波數高）才覆蓋', () => {
  const s = createSaveService(fakeStorage());
  s.submit({ wave: 8, time: 120, score: 500 });
  s.submit({ wave: 5, time: 999, score: 999 });
  assert.equal(s.getBest().wave, 8);
  s.submit({ wave: 10, time: 60, score: 200 });
  assert.equal(s.getBest().wave, 10);
});
