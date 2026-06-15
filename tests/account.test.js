import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_TOWERS, isOwned, canBuy, buyPrice, toggleLoadout, LOADOUT_MAX, runDiamonds } from '../src/systems/account.js';

test('起始擁有 4 基礎塔', () => {
  assert.equal(STARTER_TOWERS.length, 4);
  assert.ok(STARTER_TOWERS.includes('elf_archer'));
});
test('isOwned 依 owned 陣列', () => {
  assert.equal(isOwned('elf_druid', ['elf_archer']), false);
  assert.equal(isOwned('elf_druid', ['elf_druid']), true);
});
test('canBuy 需未擁有、買得起、有鑽石價', () => {
  assert.equal(canBuy('elf_druid', [], 100), true);      // 價40
  assert.equal(canBuy('elf_druid', [], 10), false);      // 鑽石不足
  assert.equal(canBuy('elf_druid', ['elf_druid'], 100), false); // 已擁有
  assert.equal(canBuy('elf_archer', [], 100), false);    // 起始塔無鑽石價(不販售)
});
test('toggleLoadout 上限與加減', () => {
  let lo = ['elf_archer'];
  lo = toggleLoadout(lo, 'dwarf_cannon', LOADOUT_MAX); // 加
  assert.ok(lo.includes('dwarf_cannon'));
  lo = toggleLoadout(lo, 'dwarf_cannon', LOADOUT_MAX); // 再點移除
  assert.ok(!lo.includes('dwarf_cannon'));
});
test('結算鑽石：戰役依難度、無盡依波數', () => {
  assert.equal(runDiamonds({ mode: 'campaign', won: true, difficulty: 'hell' }), 120);
  assert.equal(runDiamonds({ mode: 'campaign', won: false, difficulty: 'hell' }), 0); // 沒過關不給
  assert.equal(runDiamonds({ mode: 'endless', wave: 10 }), 20);
});
