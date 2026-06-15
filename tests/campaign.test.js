import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaignWave, isLevelUnlocked, levelDiamond } from '../src/systems/campaign.js';
import { CHAPTERS, LEVEL_ORDER } from '../src/data/levels.js';

const lvl = CHAPTERS[0].levels[0]; // 嗔怒 emo_nu waves8

test('末波生出該關情慾 boss', () => {
  const wave = campaignWave(lvl, lvl.waves, 1);
  assert.ok(wave.some(e => e.type === 'emo_nu' && e.boss));
});
test('非末波無 boss', () => {
  assert.ok(!campaignWave(lvl, 1, 1).some(e => e.boss));
});
test('hpMult 縮放', () => {
  const a = campaignWave(lvl, 1, 1)[0].hp;
  const b = campaignWave(lvl, 1, 2)[0].hp;
  assert.equal(b, a * 2);
});
test('第一關預設解鎖，後續需前一關已過', () => {
  assert.equal(isLevelUnlocked(0, []), true);
  assert.equal(isLevelUnlocked(1, []), false);
  assert.equal(isLevelUnlocked(1, [LEVEL_ORDER[0]]), true);
});
test('levelDiamond 回該關鑽石', () => {
  assert.equal(levelDiamond(lvl), 30);
});
