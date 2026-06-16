import { BALANCE } from '../data/balance.js';
import { ENEMIES } from '../data/enemies.js';

const E = BALANCE.endless;

const MINIONS_A = ['xinmo', 'zhizhang', 'yuanhun'];
const MINIONS_B = ['yunian', 'xinmo', 'zhizhang'];
const SEVEN = ['emo_nu', 'emo_ai', 'emo_ju', 'emo_aii', 'emo_wu', 'emo_xi', 'emo_yu'];
const SIX   = ['yu_se', 'yu_sheng', 'yu_xiang', 'yu_wei', 'yu_chu', 'yu_yi'];

function poolFor(wave) {
  // 每 3 波切換化身組合，讓玩家面對不同護甲組合
  return Math.floor((wave - 1) / 3) % 2 === 0 ? MINIONS_A : MINIONS_B;
}

function scaledStats(wave, typeKey) {
  const def = ENEMIES[typeKey];
  const hp = Math.round(E.hpBase * def.hpMult * Math.pow(E.hpGrowth, wave - 1));
  const speed = E.speedBase * def.speedMult * Math.pow(E.speedGrowthPer5, Math.floor((wave - 1) / 5));
  const bounty = Math.round(E.bountyBase * def.bountyMult * (1 + (wave - 1) * 0.05));
  return { hp, speed, bounty };
}

// 供 main.js 召喚使用：以當前波數縮放一隻化身的規格
export function minionSpec(wave, type) {
  const s = scaledStats(wave, type);
  return { type, armorType: ENEMIES[type].armorType, flying: ENEMIES[type].flying, hp: s.hp, maxHp: s.hp, speed: s.speed, bounty: s.bounty, boss: false };
}

// 回傳這一波的 enemy 規格陣列（尚未含座標，spawn 時補）
export function buildWave(wave, hpMult = 1) {
  const count = E.baseCount + (wave - 1) * E.countPerWave;
  const pool = poolFor(wave);
  const list = [];
  for (let i = 0; i < count; i++) {
    const typeKey = pool[(wave - 1 + i) % pool.length];
    const s = scaledStats(wave, typeKey);
    const hp = Math.round(s.hp * hpMult);
    list.push({
      type: typeKey, armorType: ENEMIES[typeKey].armorType, flying: ENEMIES[typeKey].flying,
      hp, maxHp: hp, speed: s.speed, bounty: s.bounty, boss: false,
    });
  }
  if (wave % E.bossEvery === 0) {
    const idx = Math.floor(wave / E.bossEvery) - 1;
    const useSix = wave % E.demonBossEvery === 0;
    const arr = useSix ? SIX : SEVEN;
    const bossType = arr[((useSix ? Math.floor(wave / E.demonBossEvery) - 1 : idx) % arr.length + arr.length) % arr.length];
    const s = scaledStats(wave, bossType);
    const bossHp = Math.round(s.hp * E.bossHpMult * hpMult);
    list.push({
      type: bossType, armorType: ENEMIES[bossType].armorType, flying: ENEMIES[bossType].flying,
      hp: bossHp, maxHp: bossHp,
      speed: s.speed, bounty: Math.round(s.bounty * E.bossBountyMult), boss: true,
      ability: ENEMIES[bossType].ability || null,
    });
  }
  return list;
}

export { SEVEN, SIX };
