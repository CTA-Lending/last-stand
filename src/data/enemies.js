// armorType: 五行 metal|wood|water|fire|earth ; flying:true 為飛行(獨立屬性)
// dmg: 近戰對士兵傷害, atk: 攻速（秒攻一次間隔秒）; 飛行敵 dmg:0 不纏鬥
export const ENEMIES = {
  // 化身小怪（波次 fodder，主題=煩惱心魔）
  xinmo:    { name: '嗔影', armorType: 'fire',  hpMult: 0.8, speedMult: 1.25, bountyMult: 0.8, radius: 11, color: '#c45b6e', dmg: 5,  atk: 1.0 , lore: '嗔影——煩惱聚成的躁動殘片。' },
  zhizhang: { name: '痴障', armorType: 'earth',  hpMult: 1.8, speedMult: 0.7,  bountyMult: 1.3, radius: 14, color: '#5a6b8f', dmg: 10, atk: 1.3 , lore: '痴障——癡迷不悟的厚重障壁。' },
  yuanhun:  { name: '怨魂', armorType: 'water', flying: true, hpMult: 0.9, speedMult: 1.1,  bountyMult: 1.1, radius: 12, color: '#a98fd8', dmg: 0,  atk: 1.0 , lore: '怨魂——積怨不散的飄盪殘念。' },
  yunian:   { name: '慾念', armorType: 'metal',  hpMult: 1.1, speedMult: 0.95, bountyMult: 1.1, radius: 12, color: '#cf8f4a', dmg: 7,  atk: 1.1 , lore: '慾念——蠢動不止的欲望微光。' },

  // 七情 Boss
  emo_nu:  { name: '嗔怒之魔', form: 'brute',    armorType: 'fire', hpMult: 1.4, speedMult: 0.9,  bountyMult: 1.5, radius: 18, color: '#d23a2a', boss: true, dmg: 22, atk: 1.2, ability: { type: 'enrage',        threshold: 0.4, boost: 2.0 } , lore: '怒·爭鬥與怨恨——利益受損、面子被戳便動火，怒則氣上。' },
  emo_ai:  { name: '悲哀之魔', form: 'mourner',  armorType: 'water', hpMult: 1.4, speedMult: 0.8,  bountyMult: 1.5, radius: 18, color: '#3a6fd2', boss: true, dmg: 18, atk: 1.1, ability: { type: 'slowTowerAura', radius: 110, factor: 0.6 } , lore: '哀·委屈心——受挫或自覺不公便掉淚，陷在求理解的私心。' },
  emo_ju:  { name: '恐懼之魔', form: 'dread',    armorType: 'earth', hpMult: 1.2, speedMult: 0.95, bountyMult: 1.5, radius: 17, color: '#7a3fd0', boss: true, dmg: 16, atk: 1.0, ability: { type: 'fearAura',      radius: 110 } , lore: '懼·怕心——對未知、痛苦、損失極度害怕，阻礙正念提起。' },
  emo_aii: { name: '執愛之魔', form: 'lover',    armorType: 'wood', hpMult: 1.5, speedMult: 0.8,  bountyMult: 1.5, radius: 18, color: '#d24a90', boss: true, dmg: 20, atk: 1.2, ability: { type: 'summon',        interval: 3.5, minion: 'xinmo' } , lore: '愛·情與依賴——對特定對象放不下的感性依戀。' },
  emo_wu:  { name: '憎惡之魔', form: 'loath',    armorType: 'metal', hpMult: 2.2, speedMult: 0.7,  bountyMult: 1.7, radius: 20, color: '#5a1530', boss: true, dmg: 28, atk: 1.3, ability: { type: 'summon',        interval: 4,   minion: 'zhizhang' } , lore: '惡·厭惡與排斥——對不順眼者嫌棄、看不起的對立心。' },
  emo_xi:  { name: '狂喜之魔', form: 'manic',    armorType: 'fire', hpMult: 1.2, speedMult: 1.0,  bountyMult: 1.5, radius: 17, color: '#e0b020', boss: true, dmg: 16, atk: 1.0, ability: { type: 'healAura',      radius: 100, hps: 30 } , lore: '喜·顯示心——遇好事高興過頭、輕飄飄，演成炫示。' },
  emo_yu:  { name: '渴欲之魔', form: 'glutton',  armorType: 'metal', hpMult: 1.4, speedMult: 0.85, bountyMult: 1.5, radius: 18, color: '#c9a227', boss: true, dmg: 20, atk: 1.2, ability: { type: 'goldSteal',     interval: 2.5, amount: 12 } , lore: '欲·渴求與執著——非要不可、求快求結果的急躁。' },

  // 六慾 精英 Boss
  yu_se:    { name: '色慾', form: 'serpent',  armorType: 'fire',  hpMult: 1.2, speedMult: 1.0,  bountyMult: 1.4, radius: 16, color: '#e07ab0', boss: true, dmg: 16, atk: 1.0, ability: { type: 'fearAura',      radius: 100 } , lore: '眼·視覺追求——執著於好看、刺激、誘人的畫面。' },
  yu_sheng: { name: '聲慾', form: 'siren',    armorType: 'metal',  hpMult: 1.1, speedMult: 1.2,  bountyMult: 1.3, radius: 15, color: '#7fd0e0', boss: true, dmg: 16, atk: 1.0, ability: { type: 'slowTowerAura', radius: 100, factor: 0.7 } , lore: '耳·聽覺追求——貪聽讚美與好話的求名心。' },
  yu_xiang: { name: '香慾', form: 'incense',  armorType: 'wood',  hpMult: 1.5, speedMult: 0.8,  bountyMult: 1.4, radius: 17, color: '#9ac94a', boss: true, dmg: 22, atk: 1.2, ability: { type: 'slowTowerAura', radius: 110, factor: 0.55 } , lore: '鼻·嗅覺依賴——耽溺精緻氣味，對異味強烈嫌惡。' },
  yu_wei:   { name: '味慾', form: 'glutton',  armorType: 'earth',  hpMult: 1.4, speedMult: 0.85, bountyMult: 1.4, radius: 17, color: '#d2843a', boss: true, dmg: 20, atk: 1.2, ability: { type: 'goldSteal',     interval: 3,   amount: 14 } , lore: '舌·口腹之慾——執著美食、挑三揀四的味覺執。' },
  yu_chu:   { name: '觸慾', form: 'tentacle', armorType: 'wood', flying: true, hpMult: 1.1, speedMult: 1.05, bountyMult: 1.4, radius: 15, color: '#b08fe0', boss: true, dmg: 0,  atk: 1.0, ability: { type: 'slowTowerAura', radius: 100, factor: 0.65 } , lore: '身·安逸與色慾——貪圖肉體舒適、不想吃苦的安逸與觸欲。' },
  yu_yi:    { name: '法慾', form: 'psyche',   armorType: 'water',  hpMult: 1.3, speedMult: 0.95, bountyMult: 1.5, radius: 17, color: '#8f7fe0', boss: true, dmg: 18, atk: 1.1, ability: { type: 'summon',        interval: 3,   minion: 'yuanhun' } , lore: '法·妄念與思想干擾——意根接收的雜訊化成胡思亂想、後天觀念。' },
};
