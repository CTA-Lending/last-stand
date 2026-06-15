import { ENEMIES } from '../data/enemies.js';
import { BALANCE } from '../data/balance.js';
import { LEVEL_ORDER } from '../data/levels.js';

const E = BALANCE.endless;
const MINIONS = ['xinmo', 'zhizhang', 'yuanhun', 'yunian'];

function scaled(wave, typeKey) {
  const def = ENEMIES[typeKey];
  const hp = Math.round(E.hpBase * def.hpMult * Math.pow(E.hpGrowth, wave - 1));
  const speed = E.speedBase * def.speedMult * Math.pow(E.speedGrowthPer5, Math.floor((wave - 1) / 5));
  const bounty = Math.round(E.bountyBase * def.bountyMult * (1 + (wave - 1) * 0.05));
  return { hp, speed, bounty };
}

// 關卡波：主題小怪；末波加該關情慾 boss
export function campaignWave(level, wave, hpMult = 1) {
  const count = E.baseCount + (wave - 1) * E.countPerWave;
  const list = [];
  for (let i = 0; i < count; i++) {
    const typeKey = MINIONS[(wave - 1 + i) % MINIONS.length];
    const s = scaled(wave, typeKey);
    const hp = Math.round(s.hp * hpMult);
    list.push({ type: typeKey, armorType: ENEMIES[typeKey].armorType, hp, maxHp: hp, speed: s.speed, bounty: s.bounty, boss: false });
  }
  if (wave >= level.waves) {
    const b = ENEMIES[level.boss];
    const s = scaled(wave, level.boss);
    const hp = Math.round(s.hp * E.bossHpMult * hpMult);
    list.push({ type: level.boss, armorType: b.armorType, hp, maxHp: hp, speed: s.speed,
      bounty: Math.round(s.bounty * E.bossBountyMult), boss: true, ability: b.ability || null });
  }
  return list;
}

export function isLevelUnlocked(idx, cleared) {
  if (idx <= 0) return true;
  return cleared.includes(LEVEL_ORDER[idx - 1]);
}

export function levelDiamond(level) { return level.diamond; }
