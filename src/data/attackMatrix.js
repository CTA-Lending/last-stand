// 五行相生相剋：攻擊元素 vs 護甲元素。
// 相剋循環：金剋木、木剋土、土剋水、水剋火、火剋金。
// 攻方剋守方 → ×1.5(克制)；守方剋攻方 → ×0.6(被抵抗)；其餘(同/相生/無關) → ×1.0。
// 「飛行」不是元素，是獨立屬性(enemy.flying)，由塔的 canHitAir 決定打不打得到，與五行並存。

export const ELEMENTS = ['metal', 'wood', 'water', 'fire', 'earth'];

export const ELEMENT_INFO = {
  metal: { name: '金', color: '#e6d7a0', hint: '銳利肅殺' },
  wood:  { name: '木', color: '#7fc46a', hint: '生長纏繞' },
  water: { name: '水', color: '#5fb0e0', hint: '流轉沉溺' },
  fire:  { name: '火', color: '#e8743a', hint: '熾烈亢奮' },
  earth: { name: '土', color: '#cda46a', hint: '厚重穩固' },
};

// A 剋 KE[A]
const KE = { metal: 'wood', wood: 'earth', earth: 'water', water: 'fire', fire: 'metal' };

export const ATTACK_MATRIX = {};
for (const a of ELEMENTS) {
  ATTACK_MATRIX[a] = {};
  for (const b of ELEMENTS) {
    ATTACK_MATRIX[a][b] = KE[a] === b ? 1.5 : KE[b] === a ? 0.6 : 1.0;
  }
}

export function counters(a, b) { return KE[a] === b; } // a 是否剋 b
