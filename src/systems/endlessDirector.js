import { BALANCE } from '../data/balance.js';
import { ENEMIES } from '../data/enemies.js';

const E = BALANCE.endless;

const UNDEAD = ['skeleton', 'zombie', 'banshee'];
const DEMON  = ['imp', 'succubus', 'warlock', 'infernal'];

function poolFor(wave) {
  // 每 3 波切換族別，讓玩家面對不同護甲組合
  return Math.floor((wave - 1) / 3) % 2 === 0 ? UNDEAD : DEMON;
}

function scaledStats(wave, typeKey) {
  const def = ENEMIES[typeKey];
  const hp = Math.round(E.hpBase * def.hpMult * Math.pow(E.hpGrowth, wave - 1));
  const speed = E.speedBase * def.speedMult * Math.pow(E.speedGrowthPer5, Math.floor((wave - 1) / 5));
  const bounty = Math.round(E.bountyBase * def.bountyMult * (1 + (wave - 1) * 0.05));
  return { hp, speed, bounty };
}

// 回傳這一波的 enemy 規格陣列（尚未含座標，spawn 時補）
export function buildWave(wave) {
  const count = E.baseCount + (wave - 1) * E.countPerWave;
  const pool = poolFor(wave);
  const list = [];
  for (let i = 0; i < count; i++) {
    const typeKey = pool[(wave - 1 + i) % pool.length];
    const s = scaledStats(wave, typeKey);
    list.push({
      type: typeKey, armorType: ENEMIES[typeKey].armorType,
      hp: s.hp, maxHp: s.hp, speed: s.speed, bounty: s.bounty, boss: false,
    });
  }
  if (wave % E.bossEvery === 0) {
    const useDemon = wave % E.demonBossEvery === 0;
    const bossType = useDemon ? 'demonlord' : 'deathknight';
    const s = scaledStats(wave, bossType);
    list.push({
      type: bossType, armorType: ENEMIES[bossType].armorType,
      hp: Math.round(s.hp * E.bossHpMult), maxHp: Math.round(s.hp * E.bossHpMult),
      speed: s.speed, bounty: Math.round(s.bounty * E.bossBountyMult), boss: true,
    });
  }
  return list;
}
