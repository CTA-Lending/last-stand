import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTower, upgradeTower, upgradeCost, canUpgrade, canBranch, branchOptions, chooseBranch, sellValue, isTowerUnlocked, towerLockReason } from '../src/entities/tower.js';

const slot = { x: 100, y: 100 };

test('建造為 tier1，記錄 invested', () => {
  const t = buildTower('elf_archer', slot);
  assert.equal(t.level, 0);
  assert.equal(t.branch, null);
  assert.ok(t.invested > 0);
});
test('可升到 tier2 後不能再普通升級', () => {
  const t = buildTower('elf_archer', slot);
  assert.equal(canUpgrade(t), true);
  upgradeTower(t);
  assert.equal(t.level, 1);
  assert.equal(canUpgrade(t), false);
  assert.equal(upgradeCost(t), null);
});
test('頂階可選分支，選後套用該分支屬性', () => {
  const t = buildTower('elf_archer', slot);
  upgradeTower(t);
  assert.equal(canBranch(t), true);
  const opts = branchOptions(t);
  assert.equal(opts.length, 2);
  const before = t.damage;
  chooseBranch(t, 1); // 狙擊手：高傷
  assert.equal(t.branch, 1);
  assert.ok(t.damage > before);
  assert.equal(canBranch(t), false); // 已分支不可再選
});
test('賣出價 = invested × refundRate', () => {
  const t = buildTower('elf_archer', slot);
  upgradeTower(t);
  assert.equal(sellValue(t, 0.6), Math.floor(t.invested * 0.6));
});
test('基礎塔永遠解鎖；進階塔需場上有前置塔', () => {
  assert.equal(isTowerUnlocked('elf_archer', []), true);          // 基礎
  assert.equal(isTowerUnlocked('elf_druid', []), false);          // 場上無神射手 → 鎖
  const archer = buildTower('elf_archer', slot);
  assert.equal(isTowerUnlocked('elf_druid', [archer]), true);     // 有神射手 → 解鎖
});
test('gachaOnly 塔未解鎖前鎖住，提示轉蛋', () => {
  assert.equal(isTowerUnlocked('dragon_whelp', []), false);
  assert.equal(towerLockReason('dragon_whelp', []), '🔒 轉蛋解鎖');
  assert.equal(isTowerUnlocked('dragon_whelp', [], new Set(['dragon_whelp'])), true); // 抽到後解鎖
});
test('進階塔鎖住時提示缺哪個前置', () => {
  assert.equal(towerLockReason('elf_druid', []), '🔒 需精靈神射手');
  assert.equal(towerLockReason('elf_druid', [buildTower('elf_archer', slot)]), null);
});
