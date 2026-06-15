// 單色向量圖標集（取代 emoji，消除廉價手遊感）
// 全部 24×24 viewBox，stroke=currentColor，由外層 CSS / color 控制顏色。
// 智囊團（GPT-5.5 + Gemini-3.1）共識：核心 UI 的 emoji 是最大廉價感來源，一律改線性圖標。

const PATHS = {
  coin:    '<circle cx="12" cy="12" r="8.3"/><circle cx="12" cy="12" r="3.8"/>',
  heart:   '<path d="M12 20C12 20 4 14 4 8.8 4 6.1 6.2 4.2 8.7 4.7 10.2 5 12 6.8 12 6.8s1.8-1.8 3.3-2.1C17.8 4.2 20 6.1 20 8.8 20 14 12 20 12 20z"/>',
  wave:    '<path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  star:    '<path d="M12 3.5l2.5 5.6 6 .6-4.5 4 1.3 5.9L12 16.8 6.7 19.6 8 13.7 3.5 9.7l6-.6z"/>',
  clock:   '<circle cx="12" cy="12" r="8.3"/><path d="M12 7.6V12l3.4 2"/>',
  gem:     '<path d="M6 4h12l3.4 5.4L12 21 2.6 9.4z"/><path d="M2.6 9.4h18.8M9 4 6 9.4 12 21 18 9.4 15 4"/>',
  play:    '<path d="M8 5.4v13.2l11-6.6z" fill="currentColor" stroke="none"/>',
  swords:  '<path d="M14.5 4H20v5.5L9 20.5 4 21l.5-5z"/><path d="M14 10l-9 9"/>',
  shop:    '<path d="M4 9.5 5.5 4h13L20 9.5M4 9.5V20h16V9.5M4 9.5h16M9.5 20v-5h5v5"/>',
  book:    '<path d="M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 16h12"/>',
  info:    '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="7.6" r="0.6" fill="currentColor"/>',
  trophy:  '<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 16h6M10 20h4M12 13v3"/>',
  ticket:  '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/><path d="M13 6v2M13 12v2"/>',
  lock:    '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  check:   '<path d="M5 12.5 10 17.5 19.5 7"/>',
  shield:  '<path d="M12 3 19 6v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  pause:   '<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>',
  flag:    '<path d="M6 21V4M6 5h11l-2 3 2 3H6"/>',
};

/** 回傳 inline SVG 字串。color 預設 currentColor（由外層文字色控制）。 */
export function icon(name, size = 16, color = 'currentColor') {
  const p = PATHS[name];
  if (!p) return '';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" `
    + `stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" `
    + `style="vertical-align:-0.18em;flex:none">${p}</svg>`;
}
