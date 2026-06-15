export const GACHA_POOL = ['dragon_whelp', 'divine_temple'];

// 抽卡：優先抽未解鎖；全解鎖則回 dup（呼叫端退券）
export function drawGacha(unlocked, rand) {
  const locked = GACHA_POOL.filter(t => !unlocked.includes(t));
  if (locked.length === 0) {
    return { type: GACHA_POOL[Math.floor(rand() * GACHA_POOL.length)], dup: true };
  }
  return { type: locked[Math.floor(rand() * locked.length)], dup: false };
}

export function isNewDay(lastLogin, today) { return lastLogin !== today; }
