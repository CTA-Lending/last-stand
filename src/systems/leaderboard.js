export function buildEndlessBoard(yourBest, seed) {
  const rows = seed.map(e => ({ name: e.name, wave: e.wave, time: e.time, you: false }));
  if (yourBest) rows.push({ name: '你', wave: yourBest.wave, time: yourBest.time, you: true });
  rows.sort((a, b) => b.wave - a.wave || b.time - a.time);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

// 本機+模擬全球實作；未來換成 remote(fetch VPS) 即可，介面不變
export function createLocalLeaderboard(save, seed) {
  return {
    async getEndlessBoard() { return buildEndlessBoard(save.getBest(), seed); },
  };
}
