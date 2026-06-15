import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buffMultFor, applyAuras } from '../src/systems/aura.js';

const banner = (x) => ({ kind: 'banner', x, y: 0, range: 100, buffDamage: 1.25, buffFireRate: 1.2 });
const tower = (x) => ({ x, y: 0 });

test('範圍內塔取得 buff', () => {
  const m = buffMultFor(tower(50), [banner(0)]);
  assert.equal(m.dmg, 1.25); assert.equal(m.rate, 1.2);
});
test('範圍外不 buff', () => {
  const m = buffMultFor(tower(300), [banner(0)]);
  assert.equal(m.dmg, 1); assert.equal(m.rate, 1);
});
test('兩面旗疊乘', () => {
  const m = buffMultFor(tower(50), [banner(0), banner(60)]);
  assert.ok(Math.abs(m.dmg - 1.25 * 1.25) < 1e-9);
});
test('applyAuras 寫入 buffDmg/buffRate；banner 自身略過', () => {
  const t = tower(50), b = banner(0);
  applyAuras([t, b]);
  assert.equal(t.buffDmg, 1.25);
  assert.equal(b.buffDmg, undefined); // banner 不被 buff
});
