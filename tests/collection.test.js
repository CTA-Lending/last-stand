import { test } from 'node:test';
import assert from 'node:assert/strict';
import { towerRole, isOwned } from '../src/systems/collection.js';

test('依 kind/attackType 回定位字串（五行）', () => {
  assert.equal(towerRole({ kind: 'barracks' }), '兵營·擋路');
  assert.equal(towerRole({ kind: 'banner' }), '光環·增益');
  assert.equal(towerRole({ kind: 'mine' }), '地雷·陷阱');
  assert.equal(towerRole({ kind: 'barracks', attackType: 'metal' }), '兵營·擋路 · 金屬');
  assert.equal(towerRole({ attackType: 'metal' }), '金屬');
  assert.equal(towerRole({ attackType: 'fire' }), '火屬');
  assert.equal(towerRole({ attackType: 'wood' }), '木屬');
});
test('一般塔預設擁有；轉蛋塔需解鎖', () => {
  assert.equal(isOwned('elf_archer', new Set()), true);
  assert.equal(isOwned('dragon_whelp', new Set()), false);
  assert.equal(isOwned('dragon_whelp', new Set(['dragon_whelp'])), true);
});
