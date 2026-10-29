// ── Ejemplo mínimo · demo para Demo Kit ──
// BPM = 100 | BARS = 4
async function renderEjemplo(sr, onProg) {
  const BPM = 100, BARS = 4, beat = 60 / BPM, bar = beat * 4;
  const K = demoKit(sr, BARS * bar + 2.5, 20261015);
  const kicks = [];
  for (let b = 0; b < BARS; b++) {
    const t0 = b * bar;
    for (let i = 0; i < 4; i++) { K.kick(t0 + i * beat, 0.9); kicks.push(t0 + i * beat); }
    K.clap(t0 + beat, 0.5); K.clap(t0 + 3 * beat, 0.5);
    for (let h = 0; h < 8; h++) K.hat(t0 + h * beat / 2, h % 2 ? 0.1 : 0.2, false, h % 2 ? 0.3 : -0.3);
    [57, 60, 64].forEach(m => K.syn(K.mu, t0, bar * 0.95, K.hz(m), 0.1, 0, { w: 0, atk: 0.2, rel: 0.3, det: [-8, 0, 8], lp: 1200 }));
    K.syn(K.mu, t0, beat * 0.9, K.hz(33), 0.4, 0, { w: 2, atk: 0.01, rel: 0.1, lp: 400 });
    if (onProg) onProg(b / BARS);
  }
  const duckAt = t => { let g = 1; for (const k of kicks) { const d = t - k; if (d >= 0 && d < 0.25) g = Math.min(g, 0.4 + 0.6 * (d / 0.25)); } return g; };
  return K.mix(duckAt);
}
