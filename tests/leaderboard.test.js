import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEndlessBoard } from '../src/systems/leaderboard.js';

const seed = [
  { name: 'Aria', wave: 30, time: 600 },
  { name: 'Borin', wave: 18, time: 320 },
  { name: 'Cyra', wave: 9, time: 140 },
];

test('依波數→時間排序並標名次', () => {
  const board = buildEndlessBoard(null, seed);
  assert.equal(board[0].name, 'Aria');
  assert.equal(board[0].rank, 1);
  assert.equal(board[2].rank, 3);
});
test('插入「你」並標記、排到正確位置', () => {
  const board = buildEndlessBoard({ wave: 20, time: 400 }, seed);
  const me = board.find(r => r.you);
  assert.ok(me);
  assert.equal(me.name, '你');
  assert.equal(me.rank, 2); // 30 > 20 > 18
});
test('同波數比時間(久者前)', () => {
  const board = buildEndlessBoard({ wave: 18, time: 999 }, seed);
  const me = board.find(r => r.you);
  assert.ok(me.rank < board.find(r => r.name === 'Borin').rank); // 999 > 320
});
