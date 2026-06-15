export const MAP1 = {
  width: 800, height: 480, tile: 40,
  spawn: { x: 0, y: 200 },
  base:  { x: 800, y: 120 },
  path: [
    { x: 0,   y: 200 }, { x: 240, y: 200 }, { x: 240, y: 380 },
    { x: 520, y: 380 }, { x: 520, y: 120 }, { x: 800, y: 120 },
  ],
  // 建造採網格制：除走道外任一格皆可蓋（見 systems/grid.js）
};
