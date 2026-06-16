import { endlessProgress } from './endlessDirector.js';

// 把一筆紀錄補上 輪/層（舊紀錄或種子只有 wave 時，從 wave 推算）
function toRow(e, you) {
  const p = endlessProgress(e.wave || 1);
  return {
    name: e.name || (you ? '你' : '玩家'),
    wave: e.wave, time: e.time || 0,
    floor: e.floor != null ? e.floor : p.floor,
    round: e.round != null ? e.round : p.round,
    layer: e.layer != null ? e.layer : p.layer,
    you,
  };
}

export function buildEndlessBoard(yourBest, seed) {
  const rows = (seed || []).map(e => toRow(e, false));
  if (yourBest) rows.push(toRow({ ...yourBest, name: '你' }, true));
  rows.sort((a, b) => b.floor - a.floor || b.time - a.time); // 以層數高低排名
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

// 本機實作；未來換成 remote(fetch VPS) 即可，介面不變
export function createLocalLeaderboard(save, seed) {
  return {
    async getEndlessBoard() { return buildEndlessBoard(save.getBest(), seed); },
  };
}
