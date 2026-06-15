import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEconomy } from '../src/systems/economy.js';

test('初始金錢與命數', () => {
  const e = createEconomy({ gold: 250, lives: 20 });
  assert.equal(e.gold, 250);
  assert.equal(e.lives, 20);
});
test('花費足夠則扣款回 true', () => {
  const e = createEconomy({ gold: 100, lives: 20 });
  assert.equal(e.spend(60), true);
  assert.equal(e.gold, 40);
});
test('花費不足回 false 不扣款', () => {
  const e = createEconomy({ gold: 50, lives: 20 });
  assert.equal(e.spend(60), false);
  assert.equal(e.gold, 50);
});
test('殺怪賺賞金與分數', () => {
  const e = createEconomy({ gold: 0, lives: 20 });
  e.earn(8); e.addScore(10);
  assert.equal(e.gold, 8);
  assert.equal(e.score, 10);
});
test('漏怪扣命，歸零標記 dead', () => {
  const e = createEconomy({ gold: 0, lives: 1 });
  e.loseLife(1);
  assert.equal(e.lives, 0);
  assert.equal(e.isDead(), true);
});
test('tick 累計存活時間', () => {
  const e = createEconomy({ gold: 0, lives: 20 });
  e.tick(0.5); e.tick(0.5);
  assert.equal(e.elapsed, 1);
});
