export function updateHud(state) {
  document.getElementById('hud-gold').textContent = Math.floor(state.economy.gold);
  document.getElementById('hud-lives').textContent = state.economy.lives;
  document.getElementById('hud-wave').textContent =
    state.mode === 'campaign' ? state.wave + '/' + state.totalWaves : state.wave;
  document.getElementById('hud-score').textContent = state.economy.score;
  document.getElementById('hud-time').textContent = Math.floor(state.economy.elapsed) + 's';
  document.getElementById('hud-next').textContent =
    state.waveTimer > 0 && state.waveTimer < 3
      ? '下一波 ' + Math.ceil(state.waveTimer) + 's'
      : '';
}

export function showVictory(state, bestTime, onRestart) {
  const el = document.getElementById('overlay');
  const t = Math.floor(state.economy.elapsed);
  el.innerHTML = `<div class="panel">
    <h1>🏆 過關！</h1>
    <p>${state.difficulty === 'hell' ? '地獄' : state.difficulty === 'hero' ? '英雄' : '普通'}難度 · ${state.totalWaves} 波全清</p>
    <p>通關時間 <b>${t}s</b> · ⭐${state.economy.score}</p>
    <p class="best">最佳：${bestTime != null ? bestTime + 's' : t + 's'}</p>
    <button id="restart">再來一局</button></div>`;
  el.style.display = 'flex';
  document.getElementById('restart').onclick = () => { el.style.display = 'none'; onRestart(); };
}

export function showGameOver(state, best, onRestart) {
  const el = document.getElementById('overlay');
  el.innerHTML = `
    <div class="panel">
      <h1>陣亡！</h1>
      <p>你撐到第 <b>${state.wave}</b> 波 · ${Math.floor(state.economy.elapsed)} 秒 · ${state.economy.score} 分</p>
      <p class="best">${best ? '本機最佳：第 ' + best.wave + ' 波' : '（首次紀錄已保存）'}</p>
      <button id="restart">再來一局</button>
    </div>`;
  el.style.display = 'flex';
  document.getElementById('restart').onclick = () => { el.style.display = 'none'; onRestart(); };
}
