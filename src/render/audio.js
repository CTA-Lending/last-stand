let actx = null;

export function unlockAudio() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { actx = null; }
  }
  if (actx && actx.state === 'suspended') actx.resume();
}

function blip(freq, dur, type, gain, slideTo) {
  if (!actx) return;
  const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur);
}

let lastFire = 0;

export const sfx = {
  fire() {
    const n = (actx ? actx.currentTime : 0);
    if (n - lastFire < 0.06) return;
    lastFire = n;
    blip(420 * (0.9 + Math.random() * 0.2), 0.05, 'square', 0.018);
  },
  hit()      { blip(190, 0.05, 'triangle', 0.03); },
  kill()     { blip(340, 0.14, 'sawtooth', 0.045, 120); },
  boss()     { blip(80, 0.5, 'sine', 0.12, 40); blip(120, 0.3, 'square', 0.05, 60); },
  firerain() { blip(300, 0.4, 'sawtooth', 0.08, 90); },
  frost()    { blip(900, 0.4, 'sine', 0.06, 300); },
  wave()     { blip(440, 0.14, 'triangle', 0.05); setTimeout(() => blip(660, 0.16, 'triangle', 0.045), 110); },
  leak()     { blip(160, 0.3, 'sawtooth', 0.06, 70); },
  win()      { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.18, 'triangle', 0.06), i * 110)); },
};
