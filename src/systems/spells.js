export const SPELLS = {
  firerain: { name: '火雨', icon: '🔥', cooldown: 18, radius: 90, damage: 120, attackType: 'siege', targeted: true },
  frost:    { name: '寒冰術', icon: '❄️', cooldown: 25, duration: 3, targeted: false },
};

export function createSpellState() {
  const s = {};
  for (const k of Object.keys(SPELLS)) s[k] = 0; // 剩餘冷卻秒數
  return s;
}
export function isReady(state, key) { return state[key] <= 0; }
export function trigger(state, key) {
  if (!isReady(state, key)) return false;
  state[key] = SPELLS[key].cooldown;
  return true;
}
export function tickSpells(state, dt) {
  for (const k of Object.keys(state)) if (state[k] > 0) state[k] = Math.max(0, state[k] - dt);
}
