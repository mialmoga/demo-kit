// ── ⚙️ KINETIC DRIFT · Neurofunk / Techstep Suite ──
// 178 BPM | 32 compases | D menor | Bajo denso modulado y percusión pesada
// Demo Kit · composición procedural determinista

async function renderKineticDrift(sr, onProg) {
  const BPM = 178, BARS = 32;
  const K = demoKit.metric(sr, BPM, BARS, 3.0, 20261101);
  const { beat, bar, T, mu, dr, hz, lpc, rnd, add, syn, kick, snare,
          clap, snap, hat, crash, bell, chop, riser, sweep } = K;
  const TAU = 6.283185307179586;
  const sat = x => x / (1 + Math.abs(x));

  // Reese pesadamente saturado para la estética neurofunk
  function neuroReese(t0, len, midi, a, rate) {
    const f = hz(midi), cents = [-14, -4, 4, 14];
    const inc = cents.map(c => f * Math.pow(2, c / 1200) / sr);
    const ph = cents.map(() => rnd());
    const L = len + .05;
    let y1 = 0, y2 = 0;
    add(mu, t0, L, t => {
      let s = 0;
      for (let k = 0; k < 4; k++) {
        ph[k] += inc[k] * (1 + .003 * Math.sin(t * 3.5 + k));
        ph[k] -= Math.floor(ph[k]);
        s += (ph[k] < .5 ? 1 : -1); // Ondas cuadradas/de pulso para mayor densidad armónica
      }
      const cutoff = 220 + 2800 * Math.abs(Math.sin(TAU * rate * t));
      const c = lpc(cutoff);
      y1 += c * (s / 4 - y1); y2 += c * (y1 - y2);
      return sat(y2 * 3.2) * Math.min(1, t / .008) * Math.min(1, (L - t) / .04) * 1.1;
    }, a, 0);
  }

  // Impacto metálico industrial para los cambios de sección
  function industrialHit(t0, a) {
    let p = 0;
    add(dr, t0, .8, t => {
      const x = rnd(), v = x - p; p = x;
      return (Math.sin(TAU * 120 * t) * Math.exp(-t * 5) + v * Math.exp(-t * 15)) * sat(Math.sin(t * 50));
    }, a, 0);
  }

  const CHORDS = [
    [50, 53, 57, 60], // Dm(maj7)
    [48, 52, 55, 58], // A#7
    [45, 48, 52, 55], // F5 / Am
    [43, 47, 50, 53]  // G#dim
  ];
  const chordAt = b => CHORDS[Math.floor(b / 4) % 4];

  // Curva de sidechain optimizada
  const ducks = [];
  function pulse(t, depth, level) {
    kick(t, level, { lo: 40, hi: 130, k: 32, dec: 8.0, len: .32, click: .15 });
    ducks.push([t, depth]);
  }

  function buildDuckCurve() {
    const CR = 800;
    const curve = new Float32Array(Math.ceil(K.n / sr * CR) + 2).fill(1);
    for (const [t, depth] of ducks) {
      const i0 = Math.floor(t * CR);
      for (let i = i0; i < Math.min(curve.length, i0 + CR * .4); i++) {
        const dt = (i - i0) / CR;
        const g = 1 - depth * Math.min(1, dt / .006) * Math.exp(-dt / .11);
        if (g < curve[i]) curve[i] = g;
      }
    }
    return t => {
      const x = Math.max(0, t * CR);
      const i = Math.min(curve.length - 2, Math.floor(x)), f = x - i;
      return curve[i] * (1 - f) + curve[i + 1] * f;
    };
  }

  // Bucle principal de composición (32 compases)
  for (let b = 0; b < BARS; b++) {
    const t0 = T(b, 0), chord = chordAt(b);
    const drop = b >= 8 && b < 24;

    // Transiciones y subidas de tensión
    if (b === 0) {
      sweep(t0, bar * 4, 60, 600, .08);
      industrialHit(t0, .4);
    }
    if (b === 7 || b === 23) {
      riser(t0, bar, .2);
      sweep(T(b, 2), beat * 2, 200, 2000, .1);
    }

    // Estructura rítmica pesada (Kick / Snare / Hats)
    kick(t0, drop ? .95 : .7, { lo: 42, hi: 140, k: 30, dec: 7.5, len: .33, click: .25 });
    kick(T(b, 2), drop ? .85 : .6, { lo: 44, hi: 125, k: 27, dec: 8.0, len: .3, click: .18 });
    
    snare(T(b, 1), drop ? .88 : .65, { tone: 180, nd: 22, td: 30, len: .24 });
    snare(T(b, 3), drop ? .95 : .7, { tone: 195, nd: 18, td: 26, len: .26 });

    // Hi-hats rápidos con variaciones métricas
    for (let i = 0; i < 8; i++) {
      const p = i * .5;
      hat(T(b, p), i % 2 === 0 ? .2 : .12, drop && (i === 3 || i === 7), i % 2 ? .3 : -.3);
    }

    if (drop) {
      // Ghost snares y micro-percusiones en los espacios
      snare(T(b, 2.75), .15, { tone: 220, nd: 35, td: 45, len: .1 });
      for (let j = 0; j < 4; j++) {
        hat(T(b, 3.25 + j * 0.08), .06, false, (j % 2 ? .4 : -.4));
      }

      // Bajo Neurofunk modulado por compás
      neuroReese(t0, bar * 0.95, chord[0] - 12, .22, 1.5 / bar);
      neuroReese(T(b, 2), bar * 0.95, chord[1] - 12, .22, 2.5 / bar);
    } else {
      // Sub-bass plano y profundo en la intro/outro
      syn(mu, t0, bar, hz(chord[0] - 24), .25, 0, { w: 2, atk: .01, rel: .1, lp: 150 });
    }

    // Sidechain aplicado en los pulsos fuertes
    pulse(t0, drop ? .55 : .3, drop ? .3 : .15);
    pulse(T(b, 2), drop ? .45 : .25, drop ? .22 : .1);

    if (onProg) onProg((b + 1) / BARS);
    if (b % 4 === 3) await sleep(0);
  }

  if (onProg) onProg(1);
  return K.mix(buildDuckCurve());
}