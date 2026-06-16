import { endlessProgress } from '../systems/endlessDirector.js';
import { DIFFICULTY_MULT } from '../systems/account.js';

export function updateHud(state) {
  document.getElementById('hud-gold').textContent = Math.floor(state.economy.gold);
  document.getElementById('hud-lives').textContent = state.economy.lives;
  document.getElementById('hud-wave').textContent =
    state.mode === 'campaign' ? state.wave + '/' + state.totalWaves : state.wave;
  document.getElementById('hud-score').textContent = state.economy.score;
  document.getElementById('hud-time').textContent = Math.floor(state.economy.elapsed) + 's';
  const nextEl = document.getElementById('hud-next');
  if (state.waveTimer > 0 && state.spawnQueue && state.spawnQueue.length === 0) {
    nextEl.textContent = '下一波 ' + Math.ceil(state.waveTimer) + 's (▶提前)';
  } else {
    nextEl.textContent = '';
  }
}

export function showVictory(state, bestTime, onRestart, onLobby, diamonds = 0) {
  const el = document.getElementById('overlay');
  const t = Math.floor(state.economy.elapsed);
  el.innerHTML = `<div class="panel">
    <h1>🏆 過關！</h1>
    <p>${state.difficulty === 'hell' ? '地獄' : state.difficulty === 'hero' ? '英雄' : '普通'}難度 · ${state.totalWaves} 波全清</p>
    <p>通關時間 <b>${t}s</b> · ⭐${state.economy.score}</p>
    <p class="best">最佳：${bestTime != null ? bestTime + 's' : t + 's'}</p>
    <p>獲得 💎${diamonds} <span style="color:var(--dim);font-size:13px">（難度 ×${DIFFICULTY_MULT[state.difficulty] || 1}）</span></p>
    <button id="restart">再來一局</button>
    <button id="lobby-btn">回大廳</button></div>`;
  el.style.display = 'flex';
  document.getElementById('restart').onclick = () => { el.style.display = 'none'; onRestart(); };
  document.getElementById('lobby-btn').onclick = () => { el.style.display = 'none'; onLobby(); };
}

export function showGameOver(state, best, onRestart, onLobby, diamonds = 0) {
  const el = document.getElementById('overlay');
  const dead = state.economy.isDead();
  const endless = state.mode !== 'campaign';
  let line, bestLine;
  if (endless) {
    const p = endlessProgress(state.wave);
    line = `你撐到 <b>第 ${p.round} 輪 · 第 ${p.layer} 層</b> · ${Math.floor(state.economy.elapsed)} 秒`;
    if (best) { const bp = endlessProgress(best.wave); bestLine = `本機最高：第 ${bp.round} 輪 · 第 ${bp.layer} 層`; }
    else bestLine = '（首次紀錄已保存）';
  } else {
    line = `你撐到第 <b>${state.wave}</b> 波 · ${Math.floor(state.economy.elapsed)} 秒`;
    bestLine = '（紀錄已保存）';
  }
  el.innerHTML = `
    <div class="panel">
      <h1>${dead ? '陣亡！' : '本局結束'}</h1>
      <p>${line} · ${state.economy.score} 分</p>
      <p class="best">${bestLine}</p>
      <p>獲得 💎${diamonds}</p>
      <button id="restart">再來一局</button>
      <button id="lobby-btn">回大廳</button>
    </div>`;
  el.style.display = 'flex';
  document.getElementById('restart').onclick = () => { el.style.display = 'none'; onRestart(); };
  document.getElementById('lobby-btn').onclick = () => { el.style.display = 'none'; onLobby(); };
}
