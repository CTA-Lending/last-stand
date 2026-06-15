import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cellOf, cellKey, cellCenter, pathDistance, isBuildable, computeBuildableCells } from '../src/systems/grid.js';

const map = { width: 200, height: 200, tile: 40, path: [{ x: 0, y: 100 }, { x: 200, y: 100 }] };

test('cellOf 由座標算格', () => {
  assert.deepEqual(cellOf(50, 90, 40), { col: 1, row: 2 });
});
test('cellCenter 回格中心', () => {
  assert.deepEqual(cellCenter(1, 2, 40), { x: 60, y: 100 });
});
test('cellKey 字串', () => {
  assert.equal(cellKey(3, 4), '3,4');
});
test('pathDistance 走道上接近0', () => {
  assert.ok(pathDistance(100, 100, map.path) < 1);
});
test('走道上的格不可蓋', () => {
  assert.equal(isBuildable(2, 2, map), false); // row2 中心 y=100 = 走道
});
test('遠離走道的格可蓋', () => {
  assert.equal(isBuildable(2, 0, map), true);   // row0 中心 y=20，距走道80
});
test('computeBuildableCells 排除走道、保留遠處', () => {
  const set = computeBuildableCells(map);
  assert.ok(!set.has('2,2'));
  assert.ok(set.has('2,0'));
});
