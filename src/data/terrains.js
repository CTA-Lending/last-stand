// 14 種專屬地形（七情6+1、六慾6、無盡1）。智囊團(GPT-5.5)設計，網格座標→像素。
// 每張：theme(色調) + paths(敵人路徑) + obstacles(障礙：佔建造格 + 視覺)。
import { cellKey } from '../systems/grid.js';

const T = 40;
const gp = (c, r) => ({ x: c * T + T / 2, y: r * T + T / 2 });
const path = (g) => g.map(([c, r]) => gp(c, r));

// 障礙：cols c0..c1 × rows r0..r1。type: 'solid'(實體擋塊) | 'liquid'(液池)
function ob(c0, c1, r0, r1, type, color, glow) {
  const cells = [];
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) cells.push(cellKey(c, r));
  return {
    cells,
    vis: { type, color, glow,
      x: ((c0 + c1) / 2) * T + T / 2, y: ((r0 + r1) / 2) * T + T / 2,
      w: (c1 - c0 + 1) * T - 6, h: (r1 - r0 + 1) * T - 6 },
  };
}

function mk({ theme, paths, base, obstacles }) {
  const blocked = new Set(), vis = [];
  for (const o of (obstacles || [])) { o.cells.forEach(k => blocked.add(k)); vis.push(o.vis); }
  return {
    width: 800, height: 480, tile: T,
    base: gp(base[0], base[1]),
    paths: paths.map(path),
    theme, blockedCells: blocked, obstacles: vis,
  };
}

// 障礙調色盤
const LAVA = ['rgba(220,90,40,0.55)', 'rgba(255,150,70,ALPHA)'];
const WATER = ['rgba(70,120,180,0.5)', 'rgba(120,180,230,ALPHA)'];
const POISON = ['rgba(90,160,80,0.5)', 'rgba(150,220,120,ALPHA)'];
const SLIME = ['rgba(120,90,150,0.5)', 'rgba(180,140,210,ALPHA)'];
const VOID = ['rgba(36,36,54,0.66)', 'rgba(120,120,160,ALPHA)'];
const STONE = ['#4a4658', null];
const GOLD = ['#8a6a1a', 'rgba(255,210,90,ALPHA)'];
const CRYSTAL = ['#5a4a8a', 'rgba(150,120,255,ALPHA)'];
const WOOD = ['#5a3a22', null];
const MIRROR = ['#6a5a78', 'rgba(220,200,240,ALPHA)'];
const THORN = ['#3a2a22', null];

export const TERRAINS = {
  // ── 七情篇 ──
  s0: mk({ // 嗔怒 · 焦炎裂谷
    theme: { top: '#33180f', bottom: '#190a06', pathOuter: '#3f2014', pathInner: '#6b3320', dash: 'rgba(255,160,90,0.28)', mote: '255,120,50' },
    paths: [[[-1, 6], [3, 6], [3, 3], [8, 3], [8, 7], [13, 7], [13, 5], [19, 5]]], base: [19, 5],
    obstacles: [ob(5, 6, 5, 6, 'liquid', ...LAVA), ob(15, 17, 2, 3, 'liquid', ...LAVA)],
  }),
  s1: mk({ // 悲哀 · 雨幕淚灣
    theme: { top: '#24384a', bottom: '#0e1a2b', pathOuter: '#3a4d5c', pathInner: '#586f82', dash: 'rgba(170,200,225,0.28)', mote: '140,175,205' },
    paths: [[[-1, 2], [4, 2], [4, 9], [10, 9], [10, 4], [15, 4], [15, 8], [19, 8]]], base: [19, 8],
    obstacles: [ob(6, 8, 4, 7, 'liquid', ...WATER), ob(11, 13, 6, 8, 'liquid', ...WATER)],
  }),
  s2: mk({ // 恐懼 · 幽暗迷廊
    theme: { top: '#1a1d2e', bottom: '#06070f', pathOuter: '#34374a', pathInner: '#4a4d5a', dash: 'rgba(150,140,200,0.25)', mote: '120,110,160' },
    paths: [[[-1, 9], [2, 9], [2, 2], [6, 2], [6, 10], [10, 10], [10, 3], [14, 3], [14, 8], [19, 8]]], base: [19, 8],
    obstacles: [ob(4, 5, 5, 6, 'solid', ...STONE), ob(8, 9, 1, 2, 'solid', ...STONE), ob(12, 13, 6, 7, 'solid', ...STONE), ob(16, 17, 2, 3, 'liquid', ...VOID)],
  }),
  s3: mk({ // 執愛 · 紅線迴廊
    theme: { top: '#3b2633', bottom: '#220c1a', pathOuter: '#7a2842', pathInner: '#b33a5b', dash: 'rgba(255,160,190,0.3)', mote: '225,100,140' },
    paths: [[[-1, 6], [1, 6], [1, 1], [18, 1], [18, 10], [3, 10], [3, 3], [16, 3], [16, 8], [5, 8], [5, 5], [11, 5], [11, 6]]], base: [11, 6],
    obstacles: [ob(8, 9, 6, 7, 'solid', ...THORN), ob(12, 13, 9, 10, 'solid', ...STONE)],
  }),
  s4: mk({ // 憎惡 · 荊棘仇原（雙路）
    theme: { top: '#3b2a24', bottom: '#180d0d', pathOuter: '#43281f', pathInner: '#5a3a32', dash: 'rgba(220,140,110,0.25)', mote: '180,90,60' },
    paths: [[[-1, 2], [5, 2], [5, 5], [10, 5], [10, 3], [15, 3], [15, 6], [19, 6]],
            [[-1, 9], [4, 9], [4, 6], [9, 6], [9, 8], [14, 8], [14, 6], [19, 6]]], base: [19, 6],
    obstacles: [ob(6, 7, 6, 8, 'solid', ...THORN), ob(11, 12, 6, 7, 'solid', ...THORN), ob(2, 3, 4, 5, 'solid', ...STONE)],
  }),
  s5: mk({ // 狂喜 · 霓虹迴旋場
    theme: { top: '#24133d', bottom: '#10001f', pathOuter: '#7a2a6a', pathInner: '#ff4fd8', dash: 'rgba(120,245,255,0.4)', mote: '200,80,255' },
    paths: [[[0, -1], [0, 1], [4, 1], [4, 4], [1, 4], [1, 7], [6, 7], [6, 2], [10, 2], [10, 9], [14, 9], [14, 4], [18, 4], [18, 12]]], base: [18, 12],
    obstacles: [],
  }),
  s6: mk({ // 貪欲 · 金窟貪淵（雙路夾擊）
    theme: { top: '#3a2d18', bottom: '#1c1204', pathOuter: '#7a5a0a', pathInner: '#b8860b', dash: 'rgba(255,220,120,0.32)', mote: '220,180,60' },
    paths: [[[-1, 4], [3, 4], [3, 8], [7, 8], [7, 5], [10, 5]],
            [[20, 7], [16, 7], [16, 3], [12, 3], [12, 6], [10, 6]]], base: [10, 5],
    obstacles: [ob(8, 9, 3, 4, 'solid', ...GOLD), ob(11, 12, 7, 8, 'solid', ...GOLD), ob(5, 6, 1, 2, 'solid', ...GOLD), ob(14, 15, 9, 10, 'solid', ...GOLD)],
  }),
  // ── 六慾篇 ──
  d0: mk({ // 色慾 · 緋羅鏡庭
    theme: { top: '#4a1e3b', bottom: '#280717', pathOuter: '#9a2e50', pathInner: '#d7436f', dash: 'rgba(255,180,205,0.3)', mote: '230,100,150' },
    paths: [[[20, 2], [16, 2], [16, 1], [4, 1], [4, 5], [17, 5], [17, 10], [2, 10], [2, 7], [10, 7], [10, 12]]], base: [10, 12],
    obstacles: [ob(7, 8, 3, 4, 'solid', ...MIRROR), ob(12, 13, 7, 8, 'solid', ...MIRROR), ob(5, 6, 8, 9, 'solid', ...THORN), ob(15, 16, 6, 7, 'solid', ...MIRROR)],
  }),
  d1: mk({ // 聲慾 · 回音鐘峽（雙路匯合）
    theme: { top: '#263a42', bottom: '#0c1320', pathOuter: '#4a5a63', pathInner: '#6b7c85', dash: 'rgba(150,200,225,0.3)', mote: '130,180,200' },
    paths: [[[-1, 1], [6, 1], [6, 4], [12, 4], [12, 2], [18, 2], [18, 6], [19, 6]],
            [[-1, 10], [5, 10], [5, 7], [11, 7], [11, 9], [17, 9], [17, 6], [19, 6]]], base: [19, 6],
    obstacles: [ob(8, 9, 5, 6, 'solid', ...STONE), ob(13, 14, 5, 6, 'solid', ...STONE), ob(2, 3, 5, 6, 'solid', ...STONE)],
  }),
  d2: mk({ // 香慾 · 迷香霧沼
    theme: { top: '#263827', bottom: '#0e1812', pathOuter: '#4a5a37', pathInner: '#6a7b4f', dash: 'rgba(180,220,140,0.28)', mote: '150,200,120' },
    paths: [[[-1, 6], [2, 6], [2, 10], [6, 10], [6, 2], [9, 2], [9, 8], [12, 8], [12, 3], [16, 3], [16, 9], [19, 9]]], base: [19, 9],
    obstacles: [ob(3, 5, 3, 5, 'liquid', ...POISON), ob(10, 11, 4, 6, 'liquid', ...POISON), ob(13, 15, 6, 8, 'solid', ...THORN), ob(7, 8, 6, 7, 'liquid', ...POISON)],
  }),
  d3: mk({ // 味慾 · 饕餮餐桌（中央巨桌）
    theme: { top: '#3c2a1e', bottom: '#231104', pathOuter: '#6a3c1f', pathInner: '#8a4f2a', dash: 'rgba(220,170,120,0.28)', mote: '200,140,80' },
    paths: [[[-1, 4], [3, 4], [3, 2], [16, 2], [16, 5], [19, 5]],
            [[-1, 8], [4, 8], [4, 10], [15, 10], [15, 6], [19, 6]]], base: [19, 5],
    obstacles: [ob(6, 13, 4, 7, 'solid', ...WOOD), ob(1, 2, 1, 2, 'solid', ...WOOD), ob(17, 18, 8, 9, 'solid', ...STONE)],
  }),
  d4: mk({ // 觸慾 · 絲繭觸獄（狹廊切碎）
    theme: { top: '#302538', bottom: '#150d1a', pathOuter: '#5a4a70', pathInner: '#8a7aa0', dash: 'rgba(200,185,225,0.28)', mote: '160,140,190' },
    paths: [[[0, -1], [0, 2], [3, 2], [3, 5], [6, 5], [6, 8], [9, 8], [9, 3], [12, 3], [12, 6], [15, 6], [15, 9], [19, 9]]], base: [19, 9],
    obstacles: [ob(4, 5, 3, 4, 'solid', ...STONE), ob(7, 8, 6, 7, 'solid', ...STONE), ob(10, 11, 9, 10, 'liquid', ...SLIME), ob(13, 14, 4, 5, 'solid', ...STONE), ob(16, 17, 1, 2, 'solid', ...STONE)],
  }),
  d5: mk({ // 意慾 · 妄念萬象盤（雙向夾心核）
    theme: { top: '#1e2140', bottom: '#06061a', pathOuter: '#4a3a9a', pathInner: '#7c5cff', dash: 'rgba(170,150,255,0.32)', mote: '140,120,255' },
    paths: [[[-1, 2], [2, 2], [2, 9], [6, 9], [6, 4], [9, 4], [9, 6], [10, 6]],
            [[20, 9], [17, 9], [17, 2], [13, 2], [13, 7], [11, 7], [11, 6], [10, 6]]], base: [10, 6],
    obstacles: [ob(8, 9, 7, 8, 'solid', ...CRYSTAL), ob(11, 12, 4, 5, 'solid', ...CRYSTAL), ob(4, 5, 5, 6, 'solid', ...STONE), ob(15, 16, 5, 6, 'solid', ...STONE), ob(9, 10, 2, 3, 'solid', ...CRYSTAL)],
  }),
  // ── 無盡篇 ──
  endless: mk({ // 無盡心淵（雙路交錯）
    theme: { top: '#161622', bottom: '#03030a', pathOuter: '#3a3a5a', pathInner: '#8a8ab0', dash: 'rgba(255,255,255,0.22)', mote: '180,180,230' },
    paths: [[[-1, 5], [2, 5], [2, 1], [17, 1], [17, 4], [5, 4], [5, 9], [14, 9], [14, 6], [10, 6]],
            [[20, 6], [18, 6], [18, 10], [3, 10], [3, 7], [15, 7], [15, 2], [8, 2], [8, 6], [10, 6]]], base: [10, 6],
    obstacles: [ob(6, 7, 6, 7, 'liquid', ...VOID), ob(11, 12, 8, 9, 'solid', ...CRYSTAL), ob(4, 5, 2, 3, 'solid', ...STONE), ob(16, 17, 8, 9, 'solid', ...GOLD), ob(9, 10, 3, 4, 'liquid', ...POISON)],
  }),
};
