// 塔的精美 IP 圖載入 + 烘焙：把 Imagen 生成的方圖以「徑向圓形遮罩」去掉方背景與角落殘字，
// 變成乾淨的圓形貼圖（圓石座剛好吻合）。載不到就回 null，renderer 自動用向量 fallback。
const KEYS = [
  'elf_archer', 'elf_druid', 'elf_moonblade', 'dwarf_cannon', 'dwarf_mortar', 'dwarf_mine',
  'mage_arcane', 'mage_chain', 'mage_polymorph', 'human_ballista', 'human_barracks',
  'human_banner', 'dragon_whelp', 'divine_temple',
];

const baked = {};

function bake(img) {
  const S = 96;
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, S, S);
  // 徑向遮罩：中心實 → 邊緣透明（圓形裁切，去掉方背景與角落 hex 殘字）
  x.globalCompositeOperation = 'destination-in';
  const g = x.createRadialGradient(S / 2, S / 2, S * 0.34, S / 2, S / 2, S * 0.49);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.78, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  x.globalCompositeOperation = 'source-over';
  return c;
}

export function loadTowerArt() {
  if (typeof Image === 'undefined' || typeof document === 'undefined') return; // 非瀏覽器(node 測試)略過
  for (const k of KEYS) {
    const img = new Image();
    img.onload = () => { try { baked[k] = bake(img); } catch {} };
    img.onerror = () => {};
    img.src = 'assets/towers/' + k + '.png';
  }
}

export function getTowerArt(type) { return baked[type] || null; }
