export const TOWERS = {
  elf_archer: {
    name: '精靈神射手', faction: 'elf', attackType: 'physical', canHitAir: true,
    color: '#63992e', splash: 0,
    levels: [ { cost: 70, damage: 14, range: 120, fireRate: 1.4 }, { cost: 60, damage: 26, range: 135, fireRate: 1.6 } ],
    branches: [
      { name: '連射手', cost: 120, damage: 34, range: 145, fireRate: 2.8 },
      { name: '狙擊手', cost: 120, damage: 95, range: 210, fireRate: 1.0 },
    ],
  },
  dwarf_cannon: {
    name: '矮人蒸汽火砲', faction: 'dwarf', attackType: 'siege', canHitAir: false,
    color: '#b07a2f', splash: 42,
    levels: [ { cost: 95, damage: 26, range: 110, fireRate: 0.7 }, { cost: 90, damage: 46, range: 120, fireRate: 0.8 } ],
    branches: [
      { name: '爆裂彈', cost: 150, damage: 78, range: 130, fireRate: 0.9, splash: 64 },
      { name: '燃燒彈', cost: 150, damage: 56, range: 130, fireRate: 0.9, splash: 48, effect: { dot: { dps: 20, duration: 3 } } },
    ],
  },
  mage_arcane: {
    name: '魔法師奧術塔', faction: 'mage', attackType: 'magic', canHitAir: true,
    color: '#7f77dd', splash: 0,
    levels: [ { cost: 90, damage: 20, range: 115, fireRate: 1.1 }, { cost: 85, damage: 36, range: 125, fireRate: 1.2 } ],
    branches: [
      { name: '奧能爆發', cost: 140, damage: 88, range: 135, fireRate: 1.3 },
      { name: '遠古智慧', cost: 140, damage: 48, range: 175, fireRate: 1.8 },
    ],
  },
  elf_druid: {
    name: '精靈纏繞德魯伊', faction: 'elf', attackType: 'magic', canHitAir: true,
    requires: ['elf_archer'],
    color: '#3bbf8f', splash: 0, effect: { slow: { factor: 0.5, duration: 2 } },
    levels: [ { cost: 80, damage: 6, range: 110, fireRate: 1.0 }, { cost: 70, damage: 10, range: 120, fireRate: 1.1 } ],
    branches: [
      { name: '寒冰纏繞', cost: 120, damage: 16, range: 130, fireRate: 1.2, effect: { slow: { factor: 0.3, duration: 2.5 } } },
      { name: '劇毒纏繞', cost: 120, damage: 16, range: 130, fireRate: 1.2, effect: { dot: { dps: 16, duration: 3 } } },
    ],
  },
  dwarf_mortar: {
    name: '矮人燃燒投石', faction: 'dwarf', attackType: 'siege', canHitAir: false,
    requires: ['dwarf_cannon'],
    color: '#d8632f', splash: 48, effect: { dot: { dps: 10, duration: 3 } },
    levels: [ { cost: 120, damage: 22, range: 150, fireRate: 0.5 }, { cost: 110, damage: 40, range: 160, fireRate: 0.55 } ],
    branches: [
      { name: '巨石轟炸', cost: 170, damage: 95, range: 175, fireRate: 0.6, splash: 70, effect: { dot: { dps: 10, duration: 3 } } },
      { name: '烈焰風暴', cost: 170, damage: 60, range: 175, fireRate: 0.7, splash: 56, effect: { dot: { dps: 30, duration: 3 } } },
    ],
  },
  mage_chain: {
    name: '連環閃電', faction: 'mage', attackType: 'magic', canHitAir: true, requires: ['mage_arcane'],
    color: '#5bc8ff', splash: 0, chain: { count: 3, radius: 85, falloff: 0.65 },
    levels: [ { cost: 130, damage: 24, range: 130, fireRate: 1.0 }, { cost: 120, damage: 42, range: 140, fireRate: 1.1 } ],
    branches: [
      { name: '雷暴', cost: 170, damage: 70, range: 150, fireRate: 1.2, chain: { count: 5, radius: 95, falloff: 0.7 } },
      { name: '導電', cost: 170, damage: 92, range: 150, fireRate: 1.1, chain: { count: 3, radius: 85, falloff: 0.8 } },
    ],
  },
  elf_moonblade: {
    name: '精靈月刃', faction: 'elf', attackType: 'physical', canHitAir: true, requires: ['elf_archer'],
    color: '#aef0c8', splash: 0, chain: { count: 2, radius: 75, falloff: 0.6 },
    levels: [ { cost: 110, damage: 20, range: 125, fireRate: 1.3 }, { cost: 100, damage: 34, range: 135, fireRate: 1.5 } ],
    branches: [
      { name: '回旋月刃', cost: 150, damage: 54, range: 150, fireRate: 1.6, chain: { count: 4, radius: 85, falloff: 0.65 } },
      { name: '破甲月刃', cost: 150, damage: 82, range: 145, fireRate: 1.5, chain: { count: 2, radius: 75, falloff: 0.6 } },
    ],
  },
  human_ballista: {
    name: '人類十字弩', faction: 'human', attackType: 'physical', canHitAir: true, requires: ['human_barracks'],
    color: '#cdb27a', splash: 0, pierce: 3,
    levels: [ { cost: 110, damage: 24, range: 150, fireRate: 1.0 }, { cost: 100, damage: 42, range: 165, fireRate: 1.1 } ],
    branches: [
      { name: '貫穿弩', cost: 150, damage: 62, range: 185, fireRate: 1.2, pierce: 6 },
      { name: '重弩', cost: 150, damage: 115, range: 170, fireRate: 0.8, pierce: 3 },
    ],
  },
  mage_polymorph: {
    name: '魔法師變形術', faction: 'mage', attackType: 'magic', canHitAir: true, requires: ['mage_arcane'],
    color: '#e58ad8', splash: 0, polymorph: { chance: 0.12 },
    levels: [ { cost: 140, damage: 14, range: 120, fireRate: 0.9 }, { cost: 130, damage: 22, range: 130, fireRate: 1.0 } ],
    branches: [
      { name: '群體變形', cost: 180, damage: 30, range: 145, fireRate: 1.1, polymorph: { chance: 0.20 } },
      { name: '死亡變形', cost: 180, damage: 42, range: 135, fireRate: 1.0, polymorph: { chance: 0.32 } },
    ],
  },
  human_barracks: {
    name: '人類騎士兵營', faction: 'human', kind: 'barracks', canHitAir: false,
    color: '#c9c2a8',
    levels: [
      { cost: 100, soldierHp: 60,  soldierDmg: 8,  soldierAtk: 0.9, maxSoldiers: 2, engageRange: 46 },
      { cost: 90,  soldierHp: 100, soldierDmg: 13, soldierAtk: 1.0, maxSoldiers: 2, engageRange: 50 },
    ],
    branches: [
      { name: '重裝騎士', cost: 150, soldierHp: 200, soldierDmg: 16, soldierAtk: 1.0, maxSoldiers: 3, engageRange: 54 },
      { name: '聖殿守衛', cost: 150, soldierHp: 130, soldierDmg: 30, soldierAtk: 1.2, maxSoldiers: 2, engageRange: 54 },
    ],
  },
  human_banner: {
    name: '人類號令旗', faction: 'human', kind: 'banner', canHitAir: false, requires: ['human_barracks'],
    color: '#e8d98a',
    levels: [
      { cost: 110, range: 110, buffDamage: 1.20, buffFireRate: 1.15 },
      { cost: 100, range: 125, buffDamage: 1.30, buffFireRate: 1.22 },
    ],
    branches: [
      { name: '戰旗', cost: 150, range: 140, buffDamage: 1.50, buffFireRate: 1.25 },
      { name: '聖旗', cost: 150, range: 150, buffDamage: 1.30, buffFireRate: 1.50 },
    ],
  },
  dwarf_mine: {
    name: '矮人地雷', faction: 'dwarf', kind: 'mine', attackType: 'siege', canHitAir: false, requires: ['dwarf_cannon'],
    color: '#9a7b3a', splash: 50,
    levels: [
      { cost: 120, damage: 60, range: 130, splash: 50, maxMines: 3, mineRate: 2.5 },
      { cost: 110, damage: 100, range: 140, splash: 56, maxMines: 4, mineRate: 2.2 },
    ],
    branches: [
      { name: '集束雷', cost: 160, damage: 130, range: 150, splash: 72, maxMines: 6, mineRate: 1.8 },
      { name: '高爆雷', cost: 160, damage: 220, range: 145, splash: 60, maxMines: 3, mineRate: 2.0 },
    ],
  },

  // 🎰 轉蛋專屬傳奇塔（gachaOnly：建造列顯示為「🔒 轉蛋解鎖」，Phase 3 抽到才能用）
  dragon_whelp: {
    name: '龍族幼龍', faction: 'dragon', attackType: 'siege', canHitAir: true, gachaOnly: true,
    color: '#e0552d', splash: 55,
    levels: [ { cost: 200, damage: 70, range: 140, fireRate: 0.9 }, { cost: 180, damage: 120, range: 150, fireRate: 1.0 } ],
    branches: [
      { name: '烈焰巨龍', cost: 260, damage: 200, range: 165, fireRate: 1.1, splash: 75 },
      { name: '灼燒之翼', cost: 260, damage: 130, range: 160, fireRate: 1.2, splash: 60, effect: { dot: { dps: 40, duration: 3 } } },
    ],
  },
  divine_temple: {
    name: '神族聖殿', faction: 'god', attackType: 'magic', canHitAir: true, gachaOnly: true,
    color: '#ffd973', splash: 40,
    levels: [ { cost: 220, damage: 60, range: 150, fireRate: 1.2 }, { cost: 200, damage: 100, range: 160, fireRate: 1.3 } ],
    branches: [
      { name: '天罰審判', cost: 280, damage: 190, range: 175, fireRate: 1.2, splash: 50 },
      { name: '聖光普照', cost: 280, damage: 120, range: 185, fireRate: 1.6, splash: 45 },
    ],
  },
};
