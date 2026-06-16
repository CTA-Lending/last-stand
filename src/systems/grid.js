import { dist } from '../core/geometry.js';

// 距走道中心線小於此值的格子視為走道、不可蓋（走道半寬約17 + 塔半寬約13）
const BLOCK_RADIUS = 28;

export function cellOf(x, y, tile) {
  return { col: Math.floor(x / tile), row: Math.floor(y / tile) };
}

export function cellKey(col, row) {
  return col + ',' + row;
}

export function cellCenter(col, row, tile) {
  return { x: col * tile + tile / 2, y: row * tile + tile / 2 };
}

function pointSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return dist(px, py, ax + dx * t, ay + dy * t);
}

// 回所有路徑折線上離 (x,y) 最近的投影點（接受 paths 陣列）
export function nearestPointOnPath(x, y, paths) {
  let best = null, bestD = Infinity;
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const ax = path[i].x, ay = path[i].y, bx = path[i + 1].x, by = path[i + 1].y;
      const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
      let t = len2 ? ((x - ax) * dx + (y - ay) * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const px = ax + dx * t, py = ay + dy * t;
      const d = dist(x, y, px, py);
      if (d < bestD) { bestD = d; best = { x: px, y: py }; }
    }
  }
  return best || { x: paths[0][0].x, y: paths[0][0].y };
}

// 點到所有 waypoint 折線的最短距離（接受 paths 陣列）
export function pathDistance(x, y, paths) {
  let min = Infinity;
  for (const path of paths)
    for (let i = 0; i < path.length - 1; i++) {
      const d = pointSegDist(x, y, path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
      if (d < min) min = d;
    }
  return min;
}

export function isBuildable(col, row, map) {
  const c = cellCenter(col, row, map.tile);
  if (c.x < 0 || c.y < 0 || c.x > map.width || c.y > map.height) return false;
  return pathDistance(c.x, c.y, map.paths) > BLOCK_RADIUS;
}

export function pathSlots(center, range, paths, spacing) {
  const slots = [];
  for (const path of paths)
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, Math.floor(segLen / spacing));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        if (Math.hypot(x - center.x, y - center.y) <= range) slots.push({ x, y });
      }
    }
  return slots;
}

// 預先算出所有可蓋格（除走道外的整片網格），回傳 key 的 Set
export function computeBuildableCells(map) {
  const set = new Set();
  const cols = Math.floor(map.width / map.tile);
  const rows = Math.floor(map.height / map.tile);
  const blocked = map.blockedCells;
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const key = cellKey(col, row);
      if (blocked && blocked.has(key)) continue; // 地形障礙佔格，不可蓋
      if (isBuildable(col, row, map)) set.add(key);
    }
  }
  return set;
}
