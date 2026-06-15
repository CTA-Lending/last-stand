export const BALANCE = {
  startGold: 250,
  startLives: 20,
  sellRefund: 0.6,
  endless: {
    waveInterval: 16,   // 自動下一波的秒數
    spawnGap: 0.7,      // 同波怪間隔秒
    baseCount: 6,       // 第 1 波怪數
    countPerWave: 2,    // 每波 +2
    hpBase: 40,
    hpGrowth: 1.16,     // hp = hpBase * growth^(wave-1)
    speedBase: 42,      // px/s
    speedGrowthPer5: 1.08,
    bountyBase: 8,
    bossEvery: 5,
    bossHpMult: 8,
    bossBountyMult: 10,
    demonBossEvery: 10,   // 第10/20/...波改出魔王(其餘boss波出死亡騎士)
  },
};
