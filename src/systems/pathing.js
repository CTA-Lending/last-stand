import { dist } from '../core/geometry.js';

// 從 (x,y) 在 waypoints 上沿折線前進 distance；seg = 目前所在線段起點索引
export function advancePath(waypoints, seg, x, y, distance) {
  let remaining = distance;
  let cx = x, cy = y, cseg = seg;
  while (remaining > 0 && cseg < waypoints.length - 1) {
    const target = waypoints[cseg + 1];
    const d = dist(cx, cy, target.x, target.y);
    if (d <= remaining) {
      cx = target.x; cy = target.y; cseg += 1; remaining -= d;
    } else {
      const t = remaining / d;
      cx += (target.x - cx) * t;
      cy += (target.y - cy) * t;
      remaining = 0;
    }
  }
  const done = cseg >= waypoints.length - 1;
  return { x: cx, y: cy, seg: cseg, done };
}
