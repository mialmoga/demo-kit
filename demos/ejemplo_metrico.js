// ──📏 Ejemplo métrico · demoKit.metric: BPM y BARS en una sola llamada ──
async function renderMetrico(sr, onProg) {
  const K = demoKit.metric(sr, 128, 8, 2.5, 7), { beat, T } = K;
  for (let b = 0; b < 8; b++) {
    for (let i = 0; i < 4; i++) K.kick(T(b, i), 1);
    K.snare(T(b, 1), .8); K.snare(T(b, 3), .8);
    for (let i = 0; i < 8; i++) K.hat(T(b, i / 2), .35, i % 2 === 1, 0);
  }
  const bajo = [45, 45, 48, 43];
  for (let b = 0; b < 8; b++) K.syn(K.mu, T(b, 0), beat * 3.5, 440 * Math.pow(2, (bajo[b % 4] - 69) / 12), .3, 0, { w: 2 });
  return K.mix([0, 0, .8, .8, .8, .8, .8, .8], .13);   // sidechain por compás
}
