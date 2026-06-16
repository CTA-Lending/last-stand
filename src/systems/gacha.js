export const GACHA_POOL = ['dragon_whelp', 'divine_temple'];

// 傳奇塔太強 → 命中率只有 0.001%（其餘槓龜）。CEO 指定。
export const LEGENDARY_RATE = 0.00001; // = 0.001%

// 抽卡：0.001% 命中一隻未解鎖傳奇；否則槓龜(miss)。全解鎖回 dup。
export function drawGacha(unlocked, rand) {
  const locked = GACHA_POOL.filter(t => !unlocked.includes(t));
  if (locked.length === 0) {
    return { type: GACHA_POOL[Math.floor(rand() * GACHA_POOL.length)], dup: true };
  }
  if (rand() < LEGENDARY_RATE) {
    return { type: locked[Math.floor(rand() * locked.length)], dup: false };
  }
  return { type: null, miss: true }; // 槓龜
}

export function isNewDay(lastLogin, today) { return lastLogin !== today; }
