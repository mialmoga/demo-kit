// ── ⚡ ELECTRONIC RUSH · 128 BPM · Electro · La menor · dificultad ●●○○○ ──
// Misma canción que la versión original, reescrita para usar `demoKit.metric` (el kit de Demo Kit),
// de modo que el estudio pueda convertirla en un proyecto editable.
// 128 BPM · La menor (Am–F–C–G) · 48 compases (~92 s)
// intro(0-7) · build(8-15) · drop(16-31) · breakdown(32-39) · drop final(40-47)
// BPM = 128 | BARS = 48
async function renderDemo(sr, onProg) {
  const K = demoKit.metric(sr, 128, 48, 2.5, 20261012);
  const { BARS, beat, bar, T, mu } = K, hz = K.hz;

  const CH = [{ r: 33, tri: [57, 60, 64] }, { r: 29, tri: [57, 60, 65] }, { r: 36, tri: [55, 60, 64] }, { r: 31, tri: [55, 59, 62] }];
  const ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 3, 2, 1, 2];
  const MA = [3, -1, 2, 3, -1, 1, 2, -1], MB = [2, -1, 3, -1, 2, 1, 0, -1];
  const duck = new Array(BARS).fill(0);

  for (let b = 0; b < BARS; b++) {
    const S = b < 8 ? 0 : b < 16 ? 1 : b < 32 ? 2 : b < 40 ? 3 : 4, ch = CH[b % 4], drop = (S === 2 || S === 4);
    duck[b] = drop ? .72 : S === 1 ? .25 + (b - 8) * .05 : (S === 0 && b >= 6) ? .1 : 0;

    // pad (respira: abierto en intro/breakdown, discreto en drops)
    const padA = [.5, .32, .2, .5, .2][S];
    const padLp = S === 0 ? 500 + b * 180 : S === 3 ? 900 + (b - 32) * 250 : S === 1 ? 1800 : 2200;
    for (const m of ch.tri) K.syn(mu, T(b, 0), bar, hz(m), padA * .35, (m % 3 - 1) * .4, { det: [-8, 8], w: 0, atk: .5, rel: .4, lp: padLp });

    // sub + bajo a contratiempo
    if (S === 1 || drop) K.syn(mu, T(b, 0), bar, hz(ch.r), .28, 0, { w: 2, atk: .02, rel: .1, lp: 300 });
    if (drop || (S === 1 && b >= 12))
      for (let k = 0; k < 4; k++) K.syn(mu, T(b, k + .5), beat * .45, hz(ch.r + 12), .2, 0,
        { det: [-6, 6], w: 0, atk: .004, rel: .05, dec: 3, lp: t => 260 + 900 * Math.exp(-t * 14) });

    // arpegio de 16avos
    if ((S === 0 && b >= 2) || S === 1 || drop) {
      const oct = S >= 2 ? 12 : 0, pool = [ch.tri[0], ch.tri[1], ch.tri[2], ch.tri[0] + 12].map(m => m + oct);
      const aA = S === 0 ? .07 : S === 1 ? .1 : .12;
      for (let i = 0; i < 16; i++) K.syn(mu, T(b, i / 4), beat * .22, hz(pool[ARP[i]]), aA, i % 2 ? .35 : -.35,
        { w: 0, atk: .002, rel: .03, dec: 9, lp: S === 0 ? 1400 : 2800 });
    }
    // lead (a partir del compás 20 del primer drop y todo el drop final)
    if ((S === 2 && b >= 20) || S === 4) {
      const pool = [...ch.tri.map(m => m + 12), ch.tri[0] + 24], mo = b % 2 ? MB : MA;
      for (let i = 0; i < 8; i++) if (mo[i] >= 0)
        K.syn(mu, T(b, i / 2), beat * .42, hz(pool[mo[i]]), .1, 0, { det: [-10, 10], w: 1, atk: .006, rel: .08, dec: 2.5, lp: 3200 });
    }
    // melodía del breakdown
    if (S === 3) [[0, ch.tri[2] + 12], [2, ch.tri[0] + 24]].forEach(([p, m]) =>
      K.syn(mu, T(b, p), beat * 1.9, hz(m), .16, .2, { w: 2, atk: .004, rel: .4, dec: 1.4, lp: 2500 }));

    // batería
    if (S !== 3 && b >= 6) for (let k = 0; k < 4; k++) K.kick(T(b, k), S === 0 ? .5 : S === 1 ? .75 : 1);
    if (S === 0 && b >= 4) for (let i = 0; i < 8; i++) K.hat(T(b, i / 2), .1, false, i % 2 ? .3 : -.3);
    if (S === 1 || drop) for (let i = 0; i < 16; i++) {
      const off = (i % 4 === 2); K.hat(T(b, i / 4), (off ? .17 : .09) * (S === 1 ? .8 : 1), off, i % 2 ? .3 : -.3);
    }
    if (drop) { K.clap(T(b, 1), .55); K.clap(T(b, 3), .55); }
    if (b === 14 || b === 15 || b === 38 || b === 39) {          // redoble de tensión
      const dens = b % 2 === 0 ? 2 : 4, a0 = b % 2 === 0 ? .25 : .35;
      for (let i = 0; i < 4 * dens; i++) K.snare(T(b, i / dens), a0 + .45 * i / (4 * dens));
    }
    if (b === 16 || b === 40) K.crash(T(b, 0), .3);
    if (b % 3 === 2) { if (onProg) onProg(b / BARS * .85); await sleep(0); }   // cede el hilo: la UI no se congela
  }
  K.riser(T(12, 0), 4 * bar, .5); K.riser(T(36, 0), 4 * bar, .5);
  K.kick(T(BARS, 0), 1); K.crash(T(BARS, 0), .35);

  return K.mix(duck, .13);   // sidechain por compás (decae en cada pulso)
}
