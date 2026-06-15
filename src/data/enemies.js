// armorType: light|heavy|magic|flying
// dmg: 近戰對士兵傷害, atk: 攻速（秒攻一次間隔秒）; 飛行敵 dmg:0 不纏鬥
export const ENEMIES = {
  skeleton: { name: '骷髏兵', armorType: 'light',  hpMult: 0.8, speedMult: 1.25, bountyMult: 0.8, radius: 11, color: '#dfe3e6', dmg: 5,  atk: 1.0 },
  zombie:   { name: '僵屍',   armorType: 'heavy',  hpMult: 1.8, speedMult: 0.7,  bountyMult: 1.3, radius: 14, color: '#6b8f5a', dmg: 10, atk: 1.3 },
  banshee:  { name: '女妖',   armorType: 'flying', hpMult: 0.9, speedMult: 1.1,  bountyMult: 1.1, radius: 12, color: '#a9b7ff', dmg: 0,  atk: 1.0 },
  deathknight: { name: '死亡騎士', armorType: 'heavy', hpMult: 1.0, speedMult: 0.85, bountyMult: 1.0, radius: 18, color: '#8a2f3a', boss: true, dmg: 22, atk: 1.2 },
  imp:      { name: '小鬼',   armorType: 'light',  hpMult: 0.7, speedMult: 1.4,  bountyMult: 0.7, radius: 10, color: '#e2724b', dmg: 4,  atk: 0.8 },
  succubus: { name: '魅魔',   armorType: 'flying', hpMult: 1.0, speedMult: 1.15, bountyMult: 1.2, radius: 13, color: '#d46ab0', dmg: 0,  atk: 1.0 },
  infernal: { name: '炎魔',   armorType: 'heavy',  hpMult: 2.2, speedMult: 0.6,  bountyMult: 1.5, radius: 16, color: '#b0402f', dmg: 18, atk: 1.4 },
  warlock:  { name: '邪術士', armorType: 'magic',  hpMult: 1.3, speedMult: 0.9,  bountyMult: 1.3, radius: 13, color: '#7a3fd0', dmg: 8,  atk: 1.1 },
  demonlord:{ name: '魔王',   armorType: 'heavy',  hpMult: 1.1, speedMult: 0.8,  bountyMult: 1.0, radius: 20, color: '#5a1530', boss: true, dmg: 28, atk: 1.2 },
};
