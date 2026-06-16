// 塔的精美 IP 圖載入 + 烘焙（徑向圓裁去方背景/角落殘字）。
// 基礎圖 <key>.png；專精分支進化圖 <key>_b0.png / <key>_b1.png（升到專精換圖）。
// 載不到就回 null，renderer 自動用向量 fallback。
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
  x.globalCompositeOperation = 'destination-in';
  const g = x.createRadialGradient(S / 2, S / 2, S * 0.34, S / 2, S / 2, S * 0.49);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.78, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  x.globalCompositeOperation = 'source-over';
  return c;
}

function load1(name) {
  const img = new Image();
  img.onload = () => { try { baked[name] = bake(img); } catch {} };
  img.onerror = () => {};
  img.src = 'assets/towers/' + name + '.png';
}

export function loadTowerArt() {
  if (typeof Image === 'undefined' || typeof document === 'undefined') return;
  for (const k of KEYS) { load1(k); load1(k + '_b0'); load1(k + '_b1'); }
}

// 傳塔物件 → 專精時優先回進化圖；傳字串 → 回基礎圖
export function getTowerArt(t) {
  if (t && typeof t === 'object') {
    if (t.branch != null && baked[t.type + '_b' + t.branch]) return baked[t.type + '_b' + t.branch];
    return baked[t.type] || null;
  }
  return baked[t] || null;
}
