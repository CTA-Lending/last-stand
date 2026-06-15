// armorType: light|heavy|magic|flying
// dmg: 近戰對士兵傷害, atk: 攻速（秒攻一次間隔秒）; 飛行敵 dmg:0 不纏鬥
export const ENEMIES = {
  // 化身小怪（波次 fodder，主題=煩惱心魔）
  xinmo:    { name: '嗔影', armorType: 'light',  hpMult: 0.8, speedMult: 1.25, bountyMult: 0.8, radius: 11, color: '#c45b6e', dmg: 5,  atk: 1.0 },
  zhizhang: { name: '痴障', armorType: 'heavy',  hpMult: 1.8, speedMult: 0.7,  bountyMult: 1.3, radius: 14, color: '#5a6b8f', dmg: 10, atk: 1.3 },
  yuanhun:  { name: '怨魂', armorType: 'flying', hpMult: 0.9, speedMult: 1.1,  bountyMult: 1.1, radius: 12, color: '#a98fd8', dmg: 0,  atk: 1.0 },
  yunian:   { name: '慾念', armorType: 'magic',  hpMult: 1.1, speedMult: 0.95, bountyMult: 1.1, radius: 12, color: '#cf8f4a', dmg: 7,  atk: 1.1 },

  // 七情 Boss
  emo_nu:  { name: '嗔怒之魔', armorType: 'heavy', hpMult: 1.4, speedMult: 0.9,  bountyMult: 1.5, radius: 18, color: '#d23a2a', boss: true, dmg: 22, atk: 1.2, ability: { type: 'enrage',        threshold: 0.4, boost: 2.0 } },
  emo_ai:  { name: '悲哀之魔', armorType: 'heavy', hpMult: 1.4, speedMult: 0.8,  bountyMult: 1.5, radius: 18, color: '#3a6fd2', boss: true, dmg: 18, atk: 1.1, ability: { type: 'slowTowerAura', radius: 110, factor: 0.6 } },
  emo_ju:  { name: '恐懼之魔', armorType: 'magic', hpMult: 1.2, speedMult: 0.95, bountyMult: 1.5, radius: 17, color: '#7a3fd0', boss: true, dmg: 16, atk: 1.0, ability: { type: 'fearAura',      radius: 110 } },
  emo_aii: { name: '執愛之魔', armorType: 'heavy', hpMult: 1.5, speedMult: 0.8,  bountyMult: 1.5, radius: 18, color: '#d24a90', boss: true, dmg: 20, atk: 1.2, ability: { type: 'summon',        interval: 3.5, minion: 'xinmo' } },
  emo_wu:  { name: '憎惡之魔', armorType: 'heavy', hpMult: 2.2, speedMult: 0.7,  bountyMult: 1.7, radius: 20, color: '#5a1530', boss: true, dmg: 28, atk: 1.3, ability: { type: 'summon',        interval: 4,   minion: 'zhizhang' } },
  emo_xi:  { name: '狂喜之魔', armorType: 'light', hpMult: 1.2, speedMult: 1.0,  bountyMult: 1.5, radius: 17, color: '#e0b020', boss: true, dmg: 16, atk: 1.0, ability: { type: 'healAura',      radius: 100, hps: 30 } },
  emo_yu:  { name: '貪欲之魔', armorType: 'heavy', hpMult: 1.4, speedMult: 0.85, bountyMult: 1.5, radius: 18, color: '#c9a227', boss: true, dmg: 20, atk: 1.2, ability: { type: 'goldSteal',     interval: 2.5, amount: 12 } },

  // 六慾 精英 Boss
  yu_se:    { name: '色慾', armorType: 'magic',  hpMult: 1.2, speedMult: 1.0,  bountyMult: 1.4, radius: 16, color: '#e07ab0', boss: true, dmg: 16, atk: 1.0, ability: { type: 'fearAura',      radius: 100 } },
  yu_sheng: { name: '聲慾', armorType: 'light',  hpMult: 1.1, speedMult: 1.2,  bountyMult: 1.3, radius: 15, color: '#7fd0e0', boss: true, dmg: 16, atk: 1.0, ability: { type: 'slowTowerAura', radius: 100, factor: 0.7 } },
  yu_xiang: { name: '香慾', armorType: 'heavy',  hpMult: 1.5, speedMult: 0.8,  bountyMult: 1.4, radius: 17, color: '#9ac94a', boss: true, dmg: 22, atk: 1.2, ability: { type: 'slowTowerAura', radius: 110, factor: 0.55 } },
  yu_wei:   { name: '味慾', armorType: 'heavy',  hpMult: 1.4, speedMult: 0.85, bountyMult: 1.4, radius: 17, color: '#d2843a', boss: true, dmg: 20, atk: 1.2, ability: { type: 'goldSteal',     interval: 3,   amount: 14 } },
  yu_chu:   { name: '觸慾', armorType: 'flying', hpMult: 1.1, speedMult: 1.05, bountyMult: 1.4, radius: 15, color: '#b08fe0', boss: true, dmg: 0,  atk: 1.0, ability: { type: 'slowTowerAura', radius: 100, factor: 0.65 } },
  yu_yi:    { name: '意慾', armorType: 'magic',  hpMult: 1.3, speedMult: 0.95, bountyMult: 1.5, radius: 17, color: '#8f7fe0', boss: true, dmg: 18, atk: 1.1, ability: { type: 'summon',        interval: 3,   minion: 'yuanhun' } },
};
