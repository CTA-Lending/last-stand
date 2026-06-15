import { test } from 'node:test';
import assert from 'node:assert/strict';
import { towerRole, isOwned } from '../src/systems/collection.js';

test('依 kind/attackType 回定位字串', () => {
  assert.equal(towerRole({ kind: 'barracks' }), '兵營·擋路');
  assert.equal(towerRole({ kind: 'banner' }), '光環·增益');
  assert.equal(towerRole({ kind: 'mine' }), '地雷·陷阱');
  assert.equal(towerRole({ attackType: 'physical' }), '物理');
  assert.equal(towerRole({ attackType: 'siege' }), '攻城');
  assert.equal(towerRole({ attackType: 'magic' }), '魔法');
});
test('一般塔預設擁有；轉蛋塔需解鎖', () => {
  assert.equal(isOwned('elf_archer', new Set()), true);
  assert.equal(isOwned('dragon_whelp', new Set()), false);
  assert.equal(isOwned('dragon_whelp', new Set(['dragon_whelp'])), true);
});
