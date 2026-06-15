// armorType: light|heavy|magic|flying
export const ENEMIES = {
  skeleton: { name: '骷髏兵', armorType: 'light',  hpMult: 0.8, speedMult: 1.25, bountyMult: 0.8, radius: 11, color: '#dfe3e6' },
  zombie:   { name: '僵屍',   armorType: 'heavy',  hpMult: 1.8, speedMult: 0.7,  bountyMult: 1.3, radius: 14, color: '#6b8f5a' },
  banshee:  { name: '女妖',   armorType: 'flying', hpMult: 0.9, speedMult: 1.1,  bountyMult: 1.1, radius: 12, color: '#a9b7ff' },
  deathknight: { name: '死亡騎士', armorType: 'heavy', hpMult: 1.0, speedMult: 0.85, bountyMult: 1.0, radius: 18, color: '#8a2f3a', boss: true },
};
