import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyEnemyAbilities } from '../src/systems/enemyAbility.js';

const baseEnemy = o => ({ id:1, x:100, y:100, hp:100, maxHp:100, speed:40, alive:true, reachedEnd:false, ability:null, abilityCd:0, ...o });

test('enrage 低血加速一次', () => {
  const e = baseEnemy({ hp:20, maxHp:100, speed:40, ability:{ type:'enrage', threshold:0.3, boost:2 } });
  applyEnemyAbilities({ enemies:[e], towers:[], economy:{gold:0}, spawnMinion(){} }, 0.1);
  assert.equal(e.speed, 80);
  applyEnemyAbilities({ enemies:[e], towers:[], economy:{gold:0}, spawnMinion(){} }, 0.1);
  assert.equal(e.speed, 80); // 不重複加速
});
test('healAura 治療附近友軍', () => {
  const healer = baseEnemy({ id:1, ability:{ type:'healAura', radius:80, hps:50 } });
  const ally = baseEnemy({ id:2, x:120, y:100, hp:50, maxHp:100 });
  applyEnemyAbilities({ enemies:[healer, ally], towers:[], economy:{gold:0}, spawnMinion(){} }, 0.2);
  assert.ok(ally.hp > 50);
});
test('slowTowerAura 降周圍塔 debuffRate', () => {
  const e = baseEnemy({ ability:{ type:'slowTowerAura', radius:80, factor:0.5 } });
  const tower = { x:120, y:100, debuffRate:1 };
  applyEnemyAbilities({ enemies:[e], towers:[tower], economy:{gold:0}, spawnMinion(){} }, 0.1);
  assert.equal(tower.debuffRate, 0.5);
});
test('goldSteal 冷卻到就偷金幣', () => {
  const e = baseEnemy({ ability:{ type:'goldSteal', interval:1, amount:10 } });
  const economy = { gold: 100 };
  applyEnemyAbilities({ enemies:[e], towers:[], economy, spawnMinion(){} }, 1.0);
  assert.equal(economy.gold, 90);
});
test('summon 冷卻到就召喚', () => {
  let summoned = 0;
  const e = baseEnemy({ ability:{ type:'summon', interval:2, minion:'xinmo' } });
  applyEnemyAbilities({ enemies:[e], towers:[], economy:{gold:0}, spawnMinion(){ summoned++; } }, 2.0);
  assert.equal(summoned, 1);
});
