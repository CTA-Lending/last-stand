// attackType: physical|siege|magic；level 0..2 對應三階
export const TOWERS = {
  elf_archer: {
    name: '精靈神射手', faction: 'elf', attackType: 'physical', canHitAir: true,
    color: '#63992e', splash: 0,
    levels: [
      { cost: 70,  damage: 14, range: 120, fireRate: 1.4 },
      { cost: 60,  damage: 26, range: 135, fireRate: 1.6 },
      { cost: 110, damage: 48, range: 150, fireRate: 1.9 },
    ],
  },
  dwarf_cannon: {
    name: '矮人蒸汽火砲', faction: 'dwarf', attackType: 'siege', canHitAir: false,
    color: '#b07a2f', splash: 42,
    levels: [
      { cost: 95,  damage: 26, range: 110, fireRate: 0.7 },
      { cost: 90,  damage: 46, range: 120, fireRate: 0.8 },
      { cost: 150, damage: 80, range: 130, fireRate: 0.9 },
    ],
  },
  mage_arcane: {
    name: '魔法師奧術塔', faction: 'mage', attackType: 'magic', canHitAir: true,
    color: '#7f77dd', splash: 0,
    levels: [
      { cost: 90,  damage: 20, range: 115, fireRate: 1.1 },
      { cost: 85,  damage: 36, range: 125, fireRate: 1.2 },
      { cost: 140, damage: 64, range: 140, fireRate: 1.4 },
    ],
  },
  elf_druid: {
    name: '精靈纏繞德魯伊', faction: 'elf', attackType: 'magic', canHitAir: true,
    color: '#3bbf8f', splash: 0,
    effect: { slow: { factor: 0.5, duration: 2 } },
    levels: [
      { cost: 80,  damage: 6,  range: 110, fireRate: 1.0 },
      { cost: 70,  damage: 10, range: 120, fireRate: 1.1 },
      { cost: 120, damage: 16, range: 130, fireRate: 1.2 },
    ],
  },
  dwarf_mortar: {
    name: '矮人燃燒投石', faction: 'dwarf', attackType: 'siege', canHitAir: false,
    color: '#d8632f', splash: 48,
    effect: { dot: { dps: 10, duration: 3 } },
    levels: [
      { cost: 120, damage: 22, range: 150, fireRate: 0.5 },
      { cost: 110, damage: 40, range: 160, fireRate: 0.55 },
      { cost: 170, damage: 70, range: 175, fireRate: 0.6 },
    ],
  },
};
