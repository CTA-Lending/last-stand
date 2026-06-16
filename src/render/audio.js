let actx = null;
let master = null;     // 總線：lowpass 削刺 → 主音量
let sfxBus = null;     // 音效匯流（與環境床分開好調平衡）
let muted = true;      // 預設靜音（CEO 要求拿掉音樂/音效），可用 HUD 喇叭鈕開回來

export function isMuted() { return muted; }
export function setMuted(v) {
  muted = !!v;
  if (muted) stopAmbient();
  return muted;
}

function ensureBus() {
  if (!actx || master) return;
  const lp = actx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 7200; lp.Q.value = 0.4; // 削掉 7k 以上的刺耳高頻
  const m = actx.createGain(); m.gain.value = 0.9;                  // master ≈ -1dB
  lp.connect(m); m.connect(actx.destination);
  master = m;
  const s = actx.createGain(); s.gain.value = 1; s.connect(lp);
  sfxBus = s;
}

export function unlockAudio() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { actx = null; }
  }
  ensureBus();
  if (actx && actx.state === 'suspended') actx.resume();
}

// 帶包絡的音色：快速 attack 避免爆音點擊，exp decay 自然收尾
function blip(freq, dur, type, gain, slideTo) {
  if (!actx || muted) return;
  ensureBus();
  const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  const atk = Math.min(0.012, dur * 0.25);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + atk);     // attack
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur); // decay/release
  o.connect(g); g.connect(sfxBus || actx.destination); o.start(t); o.stop(t + dur + 0.02);
}

let lastFire = 0;

let ambientNodes = null;

export function startAmbient() {
  if (!actx || ambientNodes || muted) return;
  try {
    const t = actx.currentTime;
    const filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    const gain = actx.createGain();
    gain.gain.setValueAtTime(0.012, t);
    filter.connect(gain); gain.connect(actx.destination);
    const oscs = [];
    [[55, 'sine'], [82, 'triangle'], [110, 'sine']].forEach(([freq, type]) => {
      const o = actx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq * (0.99 + Math.random() * 0.02), t);
      o.detune.setValueAtTime((Math.random() * 2 - 1) * 8, t);
      o.connect(filter); o.start(t);
      oscs.push(o);
    });
    ambientNodes = { oscs, filter, gain };
  } catch { ambientNodes = null; }
}

export function stopAmbient() {
  if (!ambientNodes) return;
  try {
    for (const o of ambientNodes.oscs) { try { o.stop(); } catch {} try { o.disconnect(); } catch {} }
    try { ambientNodes.filter.disconnect(); } catch {}
    try { ambientNodes.gain.disconnect(); } catch {}
  } catch {}
  ambientNodes = null;
}

export const sfx = {
  fire() {
    const n = (actx ? actx.currentTime : 0);
    if (n - lastFire < 0.06) return;
    lastFire = n;
    blip(420 * (0.9 + Math.random() * 0.2), 0.05, 'square', 0.018);
  },
  hit()      { blip(190 * (0.9 + Math.random() * 0.2), 0.05, 'triangle', 0.03); },
  kill()     { blip(340 * (0.9 + Math.random() * 0.2), 0.14, 'sawtooth', 0.045, 120); },
  boss()     { blip(80, 0.5, 'sine', 0.12, 40); blip(120, 0.3, 'square', 0.05, 60); },
  firerain() { blip(300, 0.4, 'sawtooth', 0.08, 90); },
  frost()    { blip(900, 0.4, 'sine', 0.06, 300); },
  wave()     { blip(440, 0.14, 'triangle', 0.05); setTimeout(() => blip(660, 0.16, 'triangle', 0.045), 110); },
  leak()     { blip(160, 0.3, 'sawtooth', 0.06, 70); },
  win()      { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.18, 'triangle', 0.06), i * 110)); },
};
