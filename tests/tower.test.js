import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTower, upgradeTower, upgradeCost, canUpgrade, canBranch, branchOptions, chooseBranch, sellValue } from '../src/entities/tower.js';

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
