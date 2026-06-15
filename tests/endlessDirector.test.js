import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWave } from '../src/systems/endlessDirector.js';

test('第 1 波怪數 = baseCount', () => {
  const wave = buildWave(1);
  assert.equal(wave.length, 6);
});
test('波數越高怪越多', () => {
  assert.equal(buildWave(3).length, 10);
});
test('血量隨波成長', () => {
  const w1 = buildWave(1)[0].hp;
  const w5 = buildWave(5)[0].hp;
  assert.ok(w5 > w1);
});
test('每 5 波含一隻 boss', () => {
  const wave = buildWave(5);
  assert.ok(wave.some(e => e.boss === true));
  assert.ok(!buildWave(4).some(e => e.boss === true));
});
test('每隻怪有必要欄位', () => {
  const e = buildWave(2)[0];
  for (const k of ['type', 'hp', 'maxHp', 'armorType', 'speed', 'bounty']) {
    assert.ok(e[k] !== undefined, `缺欄位 ${k}`);
  }
});
