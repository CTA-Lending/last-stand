// 七情六慾 13 隻 boss 的精美 IP 圖：載入 + 徑向圓裁烘焙（去方背景與角落殘字）。
// 化身小怪維持向量；載不到就回 null，drawEnemy 自動 fallback。
const KEYS = [
  'emo_nu', 'emo_ai', 'emo_ju', 'emo_aii', 'emo_wu', 'emo_xi', 'emo_yu',
  'yu_se', 'yu_sheng', 'yu_xiang', 'yu_wei', 'yu_chu', 'yu_yi',
];

const baked = {};

function bake(img) {
  const S = 96;
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, S, S);
  x.globalCompositeOperation = 'destination-in';
  const g = x.createRadialGradient(S / 2, S / 2, S * 0.34, S / 2, S / 2, S * 0.49);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.78, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  x.globalCompositeOperation = 'source-over';
  return c;
}

export function loadEnemyArt() {
  if (typeof Image === 'undefined' || typeof document === 'undefined') return;
  for (const k of KEYS) {
    const img = new Image();
    img.onload = () => { try { baked[k] = bake(img); } catch {} };
    img.onerror = () => {};
    img.src = 'assets/enemies/' + k + '.png';
  }
}

export function getEnemyArt(type) { return baked[type] || null; }
