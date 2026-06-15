// Boss 專屬剪影：每隻情慾魔有可「瞇眼測試」分辨的輪廓（智囊團共識：不能只換色加角）。
// 每個 form 繪製 Boss 的「身體輪廓」(以 col=bodyColor 填)；眼睛/眉/血條由 drawEnemy 疊在上層。
// 設計目標：體型比例、姿態、招牌附肢各不同，純黑剪影也能一眼分辨。
import { rgba, lighten } from './colors.js';

function blob(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath(); ctx.fill();
}

const FORMS = {
  // 怒：寬厚弓背巨獸，雙拳上舉、肩棘（暴怒蓄拳）
  brute(ctx, x, y, r, col, hi, now) {
    ctx.fillStyle = col;
    blob(ctx, [[x - r * 1.25, y + r], [x - r * 1.4, y - r * 0.2], [x - r * 0.7, y - r * 0.85],
      [x + r * 0.7, y - r * 0.85], [x + r * 1.4, y - r * 0.2], [x + r * 1.25, y + r]]);
    // 肩棘
    ctx.fillStyle = lighten(col, 18);
    blob(ctx, [[x - r * 1.3, y - r * 0.2], [x - r * 1.7, y - r * 0.95], [x - r * 0.9, y - r * 0.6]]);
    blob(ctx, [[x + r * 1.3, y - r * 0.2], [x + r * 1.7, y - r * 0.95], [x + r * 0.9, y - r * 0.6]]);
    // 雙拳
    const pu = Math.sin(now * 3) * r * 0.12;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x - r * 1.25, y - r * 0.9 - pu, r * 0.42, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 1.25, y - r * 0.9 - pu, r * 0.42, 0, 7); ctx.fill();
  },
  // 哀：瘦高淚滴身，長垂袖，面紗（下垂）
  mourner(ctx, x, y, r, col, hi, now) {
    ctx.fillStyle = col;
    blob(ctx, [[x, y - r * 1.5], [x + r * 0.7, y - r * 0.3], [x + r * 0.55, y + r * 1.05],
      [x - r * 0.55, y + r * 1.05], [x - r * 0.7, y - r * 0.3]]);
    // 長垂袖（隨擺動）
    const sw = Math.sin(now * 1.5) * r * 0.2;
    ctx.fillStyle = lighten(col, -10);
    blob(ctx, [[x - r * 0.65, y - r * 0.2], [x - r * 1.0 + sw, y + r * 1.4], [x - r * 0.5, y + r * 0.9]]);
    blob(ctx, [[x + r * 0.65, y - r * 0.2], [x + r * 1.0 + sw, y + r * 1.4], [x + r * 0.5, y + r * 0.9]]);
    // 淚滴
    ctx.fillStyle = '#bfe3ff';
    ctx.beginPath(); ctx.arc(x - r * 0.32, y + r * 0.5 + (now * 30 % (r * 1.5)), 1.8, 0, 7); ctx.fill();
  },
  // 懼：蜷縮小身 + 環繞多眼 + 抖動殘影
  dread(ctx, x, y, r, col, hi, now) {
    const jit = Math.sin(now * 30) * 1.2;
    ctx.globalAlpha = 0.3; ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x - jit * 2, y, r * 0.8, 0, 7); ctx.fill(); // 殘影
    ctx.globalAlpha = 1;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x + jit, y + r * 0.2, r * 0.78, 0, 7); ctx.fill();
    // 環繞小眼
    ctx.fillStyle = '#fff';
    for (let k = 0; k < 5; k++) {
      const a = now * 0.8 + k * 1.256;
      const ex = x + Math.cos(a) * r * 1.25, ey = y + Math.sin(a) * r * 1.1;
      ctx.beginPath(); ctx.arc(ex, ey, r * 0.16, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a1320'; ctx.beginPath(); ctx.arc(ex, ey, r * 0.07, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
    }
  },
  // 愛：圓潤身軀 + 胸口心形鏤空
  lover(ctx, x, y, r, col, hi, now) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, r * 1.02, 0, 7); ctx.fill();
    // 心形鏤空（用背景暗色挖）
    const hs = r * 0.5 * (1 + Math.sin(now * 4) * 0.06);
    ctx.fillStyle = '#14101c';
    ctx.beginPath();
    ctx.moveTo(x, y + hs * 0.9);
    ctx.bezierCurveTo(x - hs * 1.4, y - hs * 0.3, x - hs * 0.5, y - hs * 1.1, x, y - hs * 0.3);
    ctx.bezierCurveTo(x + hs * 0.5, y - hs * 1.1, x + hs * 1.4, y - hs * 0.3, x, y + hs * 0.9);
    ctx.fill();
  },
  // 惡：不對稱腫塊 + 單側黑棘
  loath(ctx, x, y, r, col, hi, now) {
    ctx.fillStyle = col;
    blob(ctx, [[x - r * 1.1, y + r * 0.9], [x - r * 1.15, y - r * 0.5], [x - r * 0.3, y - r * 1.15],
      [x + r * 0.6, y - r * 0.95], [x + r * 1.25, y + r * 0.1], [x + r * 0.85, y + r]]);
    // 黑棘
    ctx.fillStyle = '#140a16';
    for (let k = 0; k < 4; k++) {
      const bx = x + r * (0.2 + k * 0.32), by = y - r * (0.9 - k * 0.18);
      blob(ctx, [[bx, by], [bx + r * 0.18, by - r * 0.7], [bx + r * 0.3, by]]);
    }
  },
  // 喜：渾圓彈跳球身 + 大半月狂笑（floating heal）
  manic(ctx, x, y, r, col, hi, now) {
    const sq = 1 + Math.sin(now * 6) * 0.08;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.05 / sq, r * 1.05 * sq, 0, 0, 7); ctx.fill();
    // 光環
    ctx.strokeStyle = rgba('#ffe79a', 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y - r * 1.5, r * 0.5, 0, 7); ctx.stroke();
  },
  // 貪/味：梨形巨腹 + 大裂口（吞噬）
  glutton(ctx, x, y, r, col, hi, now) {
    ctx.fillStyle = col;
    blob(ctx, [[x - r * 0.6, y - r * 0.9], [x + r * 0.6, y - r * 0.9], [x + r * 1.35, y + r * 0.5],
      [x + r * 0.7, y + r * 1.1], [x - r * 0.7, y + r * 1.1], [x - r * 1.35, y + r * 0.5]]);
    // 金瘤
    ctx.fillStyle = '#ffd95a';
    ctx.beginPath(); ctx.arc(x + r * 0.7, y + r * 0.3, r * 0.18, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.5, y + r * 0.6, r * 0.14, 0, 7); ctx.fill();
    // 大裂口
    const op = (0.5 + Math.sin(now * 3) * 0.5) * r * 0.5;
    ctx.fillStyle = '#2a0d12';
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.55, r * 0.7, op + r * 0.12, 0, 0, 7); ctx.fill();
  },
  // 色：S 形蜿蜒蛇身
  serpent(ctx, x, y, r, col, hi, now) {
    ctx.strokeStyle = col; ctx.lineWidth = r * 0.85; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const px = x + Math.sin(t * 6.28 + now * 2) * r * 0.8;
      const py = y + r * 1.2 - t * r * 2.4;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    // 頭（頂端膨大）
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x + Math.sin(now * 2) * r * 0.8, y - r * 1.1, r * 0.62, 0, 7); ctx.fill();
    ctx.lineCap = 'butt';
  },
  // 聲：身體外擴聲波環 + 圓張口
  siren(ctx, x, y, r, col, hi, now) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.78, r * 1.05, 0, 0, 7); ctx.fill();
    for (let k = 0; k < 3; k++) {
      const rr = r * (1.1 + k * 0.4) + (now * 40 % (r * 0.4));
      ctx.strokeStyle = rgba(col, 0.4 - k * 0.1); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, rr, -0.6, 0.6); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, rr, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
    }
    ctx.fillStyle = '#2a0d12';
    ctx.beginPath(); ctx.arc(x, y + r * 0.2, r * 0.3, 0, 7); ctx.fill();
  },
  // 香：厚重圓身 + 上升煙縷 + 花瓣領
  incense(ctx, x, y, r, col, hi, now) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y + r * 0.1, r * 1.08, 0, 7); ctx.fill();
    // 花瓣領
    ctx.fillStyle = lighten(col, 22);
    for (let k = 0; k < 6; k++) {
      const a = k * 1.047;
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.95, y - r * 0.5 + Math.sin(a) * r * 0.35, r * 0.3, r * 0.16, a, 0, 7); ctx.fill();
    }
    // 煙縷
    ctx.strokeStyle = rgba('#cfe6a0', 0.4); ctx.lineWidth = 2;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) ctx.lineTo(x + k * r * 0.5 + Math.sin(now * 2 + i) * 4, y - r * 1.1 - i * r * 0.25);
      ctx.stroke();
    }
  },
  // 觸：漂浮主體 + 多條垂觸手
  tentacle(ctx, x, y, r, col, hi, now) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y - r * 0.2, r * 0.95, 0, 7); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = r * 0.26; ctx.lineCap = 'round';
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      const bx = x + k * r * 0.42;
      ctx.moveTo(bx, y + r * 0.4);
      for (let i = 1; i <= 4; i++)
        ctx.lineTo(bx + Math.sin(now * 3 + k + i) * r * 0.25, y + r * 0.4 + i * r * 0.34);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  },
  // 意：漂浮菱形 + 單顆大旋渦眼
  psyche(ctx, x, y, r, col, hi, now) {
    ctx.fillStyle = col;
    blob(ctx, [[x, y - r * 1.3], [x + r * 1.0, y], [x, y + r * 1.3], [x - r * 1.0, y]]);
    // 旋渦眼
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = i * 0.5 + now * 1.5, rr = (i / 24) * r * 0.55;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  },
};

export function hasBossForm(e) { return !!(e.form && FORMS[e.form]); }

export function drawBossForm(ctx, e, x, y, r, col, now) {
  const fn = FORMS[e.form];
  if (fn) fn(ctx, x, y, r, col, 0, now || 0);
}
