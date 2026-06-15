import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWave, SEVEN, SIX } from '../src/systems/endlessDirector.js';

const ALL_BOSSES = new Set([...SEVEN, ...SIX]);
const MINION_TYPES = new Set(['xinmo', 'zhizhang', 'yuanhun', 'yunian']);

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
test('波次會切換到第二化身池', () => {
  // wave 4-6 為第二化身池(MINIONS_B)，含 yunian
  const wave = buildWave(4);
  assert.ok(wave.some(e => MINION_TYPES.has(e.type)));
});
test('第5波首領為七情 Boss 之一', () => {
  const wave = buildWave(5);
  const boss = wave.find(e => e.boss);
  assert.ok(boss, '第5波應有 boss');
  assert.ok(SEVEN.includes(boss.type), `boss type 應在 SEVEN，但得到 ${boss.type}`);
});
test('第10波首領為六慾 Boss 之一', () => {
  const wave = buildWave(10);
  const boss = wave.find(e => e.boss);
  assert.ok(boss, '第10波應有 boss');
  assert.ok(SIX.includes(boss.type), `boss type 應在 SIX，但得到 ${boss.type}`);
});
test('hpMult 縮放怪血', () => {
  const base = buildWave(3)[0].hp;
  const hard = buildWave(3, 2)[0].hp;
  assert.equal(hard, base * 2);
});
test('boss 帶有 ability', () => {
  const wave = buildWave(5);
  const boss = wave.find(e => e.boss);
  assert.ok(boss.ability, 'boss 應帶有 ability');
  assert.ok(boss.ability.type, 'ability 應有 type');
});
test('非boss波怪都是化身', () => {
  const wave = buildWave(4);
  assert.ok(wave.every(e => MINION_TYPES.has(e.type)));
});
