import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSpellState, isReady, trigger, tickSpells, SPELLS } from '../src/systems/spells.js';

test('技能定義含火雨與寒冰', () => {
  assert.ok(SPELLS.firerain);
  assert.ok(SPELLS.frost);
});
test('初始即就緒', () => {
  const s = createSpellState();
  assert.equal(isReady(s, 'firerain'), true);
});
test('施放後進入冷卻、未就緒', () => {
  const s = createSpellState();
  trigger(s, 'firerain');
  assert.equal(isReady(s, 'firerain'), false);
});
test('冷卻倒數結束後恢復就緒', () => {
  const s = createSpellState();
  trigger(s, 'frost');
  tickSpells(s, SPELLS.frost.cooldown);
  assert.equal(isReady(s, 'frost'), true);
});
