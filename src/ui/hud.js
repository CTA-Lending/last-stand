export function updateHud(state) {
  document.getElementById('hud-gold').textContent = Math.floor(state.economy.gold);
  document.getElementById('hud-lives').textContent = state.economy.lives;
  document.getElementById('hud-wave').textContent = state.wave;
  document.getElementById('hud-score').textContent = state.economy.score;
  document.getElementById('hud-time').textContent = Math.floor(state.economy.elapsed) + 's';
}

export function showGameOver(state, best, onRestart) {
  const el = document.getElementById('overlay');
  el.innerHTML = `
    <div class="panel">
      <h1>陣亡！</h1>
      <p>你撐到第 <b>${state.wave}</b> 波 · ${Math.floor(state.economy.elapsed)} 秒 · ${state.economy.score} 分</p>
      <p class="best">本機最佳：第 ${best ? best.wave : state.wave} 波</p>
      <button id="restart">再來一局</button>
    </div>`;
  el.style.display = 'flex';
  document.getElementById('restart').onclick = () => { el.style.display = 'none'; onRestart(); };
}
