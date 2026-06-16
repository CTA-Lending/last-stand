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
test('首領依序循環七情六慾13隻（第k個王=THIRTEEN[(k-1)%13]）', () => {
  const THIRTEEN = [...SEVEN, ...SIX];
  for (const k of [1, 2, 7, 8, 13, 14]) {           // k=每 5 波一個王
    const boss = buildWave(k * 5).find(e => e.boss);
    assert.ok(boss, `第${k * 5}波應有 boss`);
    assert.equal(boss.type, THIRTEEN[(k - 1) % 13], `第${k}個王應為 ${THIRTEEN[(k - 1) % 13]}`);
  }
});
test('第14個王回到嗔怒（第2輪第1層）', () => {
  const boss = buildWave(14 * 5).find(e => e.boss);
  assert.equal(boss.type, 'emo_nu');
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
