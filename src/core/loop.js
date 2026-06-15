export function createLoop({ update, render, step = 1 / 60 }) {
  let acc = 0, last = 0, raf = 0, running = false;
  function frame(t) {
    if (!running) return;
    const dt = last ? (t - last) / 1000 : 0;
    last = t;
    acc += Math.min(dt, 0.25);
    while (acc >= step) { update(step); acc -= step; }
    render();
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { running = true; last = 0; raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
  };
}
