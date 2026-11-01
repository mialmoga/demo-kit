// ── 🌊 NEON TIDAL · Drum & Bass procedural suite ──
// 174 BPM | 64 compases | F# menor | 2-step / liquid-neuro / cinematic DnB
// Demo Kit · composición procedural determinista · 31-oct-2026
// Estructura: 0-7 intro / 8-15 groove / 16-31 tema A / 32-39 build
//             40-55 drop / 56-59 interludio / 60-63 coda.
// Solo usa eventos reconocidos por el conversor del Studio.
// Los helpers reese/growl/rim/wash/impact se convierten en instrumentos nativos.

async function renderNeonTidal(sr, onProg) {
  const BPM = 174, BARS = 64;
  const K = demoKit.metric(sr, BPM, BARS, 3.2, 31102026);
  const { beat, bar, T, mu, dr, hz, lpc, rnd, add, syn, kick, snare,
          clap, snap, hat, crash, bell, chop, riser, sweep } = K;
  const TAU = 6.283185307179586;
  const sat = x => x / (1 + Math.abs(x));

  // ── Helpers reconocidos por el conversor del Studio ──────────────────
  // Reese: tres sierras desafinadas, filtro resonante de dos polos y drive.
  function reese(t0, len, midi, a, o) {
    const f = hz(midi), cents = [-17, 0, 17];
    const inc = cents.map(c => f * Math.pow(2, c / 1200) / sr);
    const ph = cents.map(() => rnd() * .5 + .5);
    const lfo = o.lfo || 0, lo = o.lo || 180, hi = o.hi || 1500;
    const drive = o.drive || 2.1, L = len + .05;
    let y1 = 0, y2 = 0;
    add(mu, t0, L, t => {
      let s = 0;
      for (let k = 0; k < 3; k++) {
        ph[k] += inc[k] * (1 + .002 * Math.sin(t * 2.1 + k));
        ph[k] -= Math.floor(ph[k]);
        s += 2 * ph[k] - 1;
      }
      const c = lpc(lo + (hi - lo) * (.5 + .5 * Math.sin(TAU * lfo * t)));
      y1 += c * (s / 3 - y1); y2 += c * (y1 - y2);
      return sat(y2 * drive) * Math.min(1, t / .01) * Math.min(1, (L - t) / .05) * 1.2;
    }, a, 0);
  }

  // Growl FM sincronizado: abre/cierra el filtro y cambia el índice de modulación.
  function growl(t0, len, midi, a, rate) {
    const f = hz(midi), L = len + .04;
    let pc = 0, pm = 0, y = 0;
    add(mu, t0, L, t => {
      pc += f / sr; pm += f * 2.01 / sr;
      pc -= Math.floor(pc); pm -= Math.floor(pm);
      const lf = .5 + .5 * Math.sin(TAU * rate * t);
      const x = sat(2.5 * Math.sin(TAU * pc + (1.5 + 6 * lf) * Math.sin(TAU * pm)));
      y += lpc(500 + 3000 * lf) * (x - y);
      return y * Math.min(1, t / .008) * Math.min(1, (L - t) / .04) * 1.3;
    }, a, 0);
  }

  // Rim: golpe corto de madera/metal, desplazado en estéreo.
  function rim(t0, a, pan) {
    let p = 0;
    add(dr, t0, .1, t => {
      const x = rnd(), v = x - p * .5; p = x;
      return Math.sin(TAU * 880 * t) * Math.exp(-t * 70) + v * Math.exp(-t * 90) * .6;
    }, a, pan);
  }

  // Wash: aire filtrado para transiciones y fondos.
  function wash(t0, len, a, fc) {
    let y = 0;
    add(mu, t0, len, t => {
      y += lpc(fc) * (rnd() - y);
      return y * Math.min(1, t / .8) * Math.min(1, (len - t) / .8);
    }, a, 0);
  }

  // Impact: sub descendente para los cambios grandes.
  function impact(t0, a) {
    add(mu, t0, 1.1, t =>
      Math.sin(TAU * (35 * t + (85 / 3) * (1 - Math.exp(-3 * t)))) * Math.exp(-t * 2.6),
    a, 0);
  }

  // ── Lenguaje armónico: F# menor, con color Dorian y tensión b2 puntual ──
  const CHORDS = [
    [54, 57, 61, 64], // F#m(add9 implícito en capas)
    [50, 54, 57, 61], // Dmaj7
    [45, 49, 52, 57], // A
    [52, 56, 59, 64]  // E
  ];
  const ROOTS = [30, 26, 33, 28]; // F#1, D1, A1, E1
  const BASS = [
    [0, 0, 2, 0, 3, 0, 1, 2],
    [0, 0, 3, 0, 2, 0, 1, 3],
    [0, 0, 2, 3, 0, 2, 1, 0],
    [0, 0, 3, 0, 2, 3, 1, 2]
  ];
  const HOOK_A = [
    [78, 76, 73, 69, 73, 76, 81, 78],
    [76, 73, 69, 71, 73, 76, 78, 76],
    [81, 78, 76, 73, 76, 78, 85, 83],
    [80, 76, 73, 71, 73, 76, 78, 80]
  ];
  const HOOK_B = [
    [85, 83, 81, 78, 76, 78, 81, 85],
    [83, 81, 78, 76, 73, 76, 78, 81],
    [88, 85, 83, 81, 78, 81, 83, 85],
    [87, 83, 80, 78, 76, 78, 80, 83]
  ];

  const section = b => b < 8 ? 0 : b < 16 ? 1 : b < 32 ? 2 :
                           b < 40 ? 3 : b < 56 ? 4 : b < 60 ? 5 : 6;
  const chordAt = b => CHORDS[Math.floor(b / 4) % 4];

  // Hook: una frase de 2 compases que cambia de registro en la segunda mitad.
  function playHook(b, variant, amp, octave, sparse) {
    const seq = variant ? HOOK_B : HOOK_A;
    const phrase = seq[(Math.floor(b / 2) + (variant ? 1 : 0)) % 4];
    for (let i = 0; i < 8; i++) {
      if (sparse && (i === 2 || i === 6)) continue;
      const p = i * .5 + (i % 2 ? .035 : 0);
      const m = phrase[i] + octave;
      const t = T(b, p);
      syn(mu, t, beat * (i % 4 === 3 ? .42 : .28), hz(m), amp,
          (i % 2 ? .42 : -.42), {
            w: 2, atk: .006, rel: .11, dec: 1.7,
            lp: t => 1800 + 3600 * Math.exp(-t * 8)
          });
      if (i === 0 || i === 4) bell(t, m + 12, amp * .38, i ? .62 : -.62, 1.15);
    }
  }

  // Acordes amplios: voces separadas, pequeñas inversiones y respiración de filtro.
  function playChord(b, amp, lenBars, shift) {
    const chord = chordAt(b);
    for (let i = 0; i < chord.length; i++) {
      const m = chord[i] + 12 + (i === 3 ? 12 : 0) + (shift || 0);
      syn(mu, T(b, 0), bar * lenBars, hz(m), amp * (i === 3 ? .68 : 1),
          (i - 1.5) * .42, {
            w: 0, atk: .34, rel: .55, det: [-13, 0, 13],
            lp: t => 900 + 2400 * Math.exp(-t * 1.8)
          });
    }
  }

  // ── Latido de sidechain + bombeo de bajo ─────────────────────────────
  const ducks = [];
  function pulse(t, depth, level) {
    kick(t, level, { lo: 42, hi: 115, k: 26, dec: 7.5, len: .34, click: .08 });
    ducks.push([t, depth]);
  }
  // La curva se precalcula a 800 Hz: K.mix consulta una interpolación O(1)
  // por muestra, evitando recorrer todos los golpes durante los ~89 s de render.
  function buildDuckCurve() {
    const CR = 800;
    const curve = new Float32Array(Math.ceil(K.n / sr * CR) + 2).fill(1);
    for (const [t, depth] of ducks) {
      const i0 = Math.floor(t * CR);
      for (let i = i0; i < Math.min(curve.length, i0 + CR * .5); i++) {
        const dt = (i - i0) / CR;
        const g = 1 - depth * Math.min(1, dt / .008) * Math.exp(-dt / .13);
        if (g < curve[i]) curve[i] = g;
      }
    }
    return t => {
      const x = Math.max(0, t * CR);
      const i = Math.min(curve.length - 2, Math.floor(x)), f = x - i;
      return curve[i] * (1 - f) + curve[i + 1] * f;
    };
  }

  // ── Programación por compás ──────────────────────────────────────────
  for (let b = 0; b < BARS; b++) {
    const S = section(b), t0 = T(b, 0), chord = chordAt(b), root = ROOTS[Math.floor(b / 4) % 4];
    const energy = S === 0 ? .18 : S === 1 ? .55 : S === 2 ? .76 : S === 3 ? .7 : S === 4 ? 1 : S === 5 ? .22 : .82;

    // Textura panorámica: aire granular sintético, nunca un clip horneado.
    if (b % 4 === 0 && S !== 5) {
      wash(t0, bar * 4, S === 0 ? .035 : S === 4 ? .055 : .025,
           S === 4 ? 3600 : 1500 + (b % 3) * 450);
    }
    if (b === 0) {
      sweep(T(0, 0), bar * 4, 90, 880, .07);
      bell(T(2, 1), 90, .08, -.55, 3.2);
    }
    if (b === 7 || b === 15 || b === 31 || b === 39 || b === 55) {
      riser(T(b, 0), bar, .12 + energy * .1);
      sweep(T(b, 1), beat * 3, 220, 1600 + b * 8, .08);
    }

    // Pads y colchón armónico.
    if (S === 0 && b >= 2 && b % 2 === 0) playChord(b, .055, 1.9, 0);
    if (S === 1 || S === 2 || S === 3 || S === 4 || S === 6) {
      if (b % 2 === 0 || S === 4) playChord(b, S === 4 ? .075 : .055, .94, S === 4 && b % 4 === 2 ? 12 : 0);
    }

    // Sub: notas largas bajo el Reese. El seno mantiene el centro del low-end.
    if (S >= 1 && S !== 5) {
      const pat = BASS[Math.floor(b / 4) % 4];
      for (let i = 0; i < 8; i++) {
        const p = i * .5;
        if (S < 4 && i % 2) continue;
        const m = root + pat[i];
        syn(mu, T(b, p), beat * (i % 4 === 3 ? .34 : .46), hz(m), S === 4 ? .28 : .2,
            0, { w: 2, atk: .004, rel: .08, dec: .7, lp: 180 });
      }
    }

    // Reese: frase rítmica con variaciones cada cuatro compases.
    if (S === 2 || S === 4 || S === 6) {
      const pat = BASS[Math.floor(b / 4) % 4];
      const count = S === 4 ? 8 : S === 6 ? 4 : 4;
      for (let i = 0; i < count; i++) {
        const p = S === 4 ? i * .5 : [0, 1.5, 2.5, 3.5][i];
        const m = root + pat[(i * (S === 4 ? 1 : 2)) % 8] + 12;
        reese(T(b, p), beat * (S === 4 ? .48 : .82), m,
              S === 4 ? .19 : .12, {
                lfo: S === 4 ? 2.4 / bar : 1.1 / bar,
                lo: 130, hi: S === 4 ? 2100 : 1150, drive: S === 4 ? 2.8 : 2.1
              });
      }
    }

    // Batería DnB: kick en 1/3, snare en 2/4; variación de ghost notes.
    if (S >= 1 && S !== 5) {
      const full = S === 4 || S === 6;
      const kickAmp = full ? .92 : .65;
      kick(T(b, 0), kickAmp, { lo: 43, hi: 145, k: 31, dec: 7.4, len: .34, click: .22 });
      kick(T(b, 2), full ? .78 : .48, { lo: 45, hi: 132, k: 28, dec: 7.8, len: .31, click: .16 });
      snare(T(b, 1), full ? .82 : .62, { tone: 190, nd: 19, td: 27, len: .23 });
      snare(T(b, 3), full ? .9 : .68, { tone: 205, nd: 17, td: 25, len: .25 });
      if (b % 2 === 1 || full) {
        snare(T(b, 2.75), full ? .13 : .075, { tone: 245, nd: 32, td: 42, len: .12 });
      }
      if (S === 4 && b % 4 === 3) {
        for (let j = 0; j < 4; j++) snare(T(b, 3 + j / 4), .11 + j * .025,
                                           { tone: 220 + j * 20, nd: 26, td: 34, len: .11 });
      }
      // Hats: corcheas con acentos y aperturas en los contratiempos.
      for (let i = 0; i < 8; i++) {
        const p = i * .5;
        const accent = i % 2 === 0 ? .19 : .11;
        hat(T(b, p), full ? accent * 1.15 : accent * .75,
            full && (i === 3 || i === 7), i % 2 ? .34 : -.34);
      }
      if (full) {
        for (let i = 0; i < 16; i++) {
          if (i % 4 === 0) continue;
          if (i % 2) hat(T(b, i / 4), .045 + (i % 3) * .012, false, i % 4 < 2 ? -.55 : .55);
        }
      }
      if (b % 4 === 3) {
        snap(T(b, 3.5), .13, .65);
        rim(T(b, 3.75), .08, -.65);
      }
    }

    // El groove de bajo también respira: sidechain paralelo al bombo.
    if (S >= 1 && S !== 5) {
      pulse(T(b, 0), S === 4 ? .52 : .35, S === 4 ? .28 : .16);
      pulse(T(b, 2), S === 4 ? .4 : .25, S === 4 ? .18 : .11);
    }

    // Hook principal: primero insinuado, después abierto y finalmente doblado.
    if (S === 1 && b % 2 === 0) playHook(b, 0, .075, 0, true);
    if (S === 2) playHook(b, Math.floor((b - 16) / 4) % 2, .105, 0, false);
    if (S === 3 && b >= 36) playHook(b, 1, .095, 12, false);
    if (S === 4) {
      playHook(b, Math.floor((b - 40) / 4) % 2, .13, 0, false);
      if (b % 2 === 0) playHook(b, 1, .055, 12, true);
    }
    if (S === 6 && b % 2 === 0) playHook(b, 0, .085, -12, true);

    // Campanas como pequeños puntos de luz y respuesta melódica.
    if (S === 0 && b % 2 === 1) bell(T(b, 2.5), [90, 88, 85, 83][(b >> 1) % 4], .055, .5, 2.6);
    if ((S === 2 || S === 4 || S === 6) && b % 4 === 2) {
      bell(T(b, 3.5), chord[2] + 24, .075, -.72, 2.1);
      bell(T(b, 1.5), chord[1] + 24, .045, .72, 1.7);
    }

    // Coro sintético: vocales sin palabras, como una capa humana abstracta.
    if (S === 2 && b % 2 === 0) {
      chop(t0, beat * 2.7, chord[1] + 12, .105, -.38, 'oo');
      chop(T(b, 2), beat * 1.7, chord[2] + 12, .085, .38, 'ah');
    }
    if (S === 4) {
      if (b % 2 === 0) chop(t0, beat * 3.4, chord[1] + 24, .105, -.42, 'ah');
      if (b % 4 === 2) chop(T(b, 2), beat * 1.8, chord[3] + 12, .08, .42, 'ee');
    }

    // Growl y fills de transición.
    if (S === 4 && b % 2 === 1) {
      growl(T(b, 1.5), beat * 1.9, root + 12, .075, 3.2 / bar);
      growl(T(b, 3.5), beat * .42, root + 19, .055, 5 / bar);
    }
    if (S === 3 && b >= 36 && b % 2 === 1) {
      for (let i = 0; i < 8; i++) hat(T(b, 2 + i / 4), .045 + i * .008, false, i % 2 ? .5 : -.5);
    }

    // Mini break: retirar el suelo y dejar una cola vocal/armónica.
    if (b === 55) {
      crash(t0, .22, 2.8);
      sweep(T(b, 2), beat * 2, 900, 120, .11);
    }
    if (S === 5) {
      if (b === 56) {
        impact(t0, .5);
        playChord(b, .075, 3.6, 0);
        chop(T(b, 0), bar * 2.6, 78, .16, 0, 'oo');
        bell(T(b, 2), 90, .11, .4, 3.4);
      }
      if (b === 58) {
        sweep(t0, bar * 2, 120, 1400, .1);
        riser(t0, bar * 2, .16);
      }
    }

    // Coda: deja que el motivo se desarme y vuelva al acorde raíz.
    if (b === 60) {
      crash(t0, .3, 3);
      impact(t0, .45);
    }
    if (b === 62) {
      bell(T(b, 0), 78, .11, -.3, 3.2);
      bell(T(b, 2), 73, .09, .3, 3.2);
    }
    if (b === 63) {
      wash(t0, bar * 2.3, .035, 1200);
      chop(T(b, 0), beat * 3, 73, .07, 0, 'oo');
    }

    if (onProg) onProg((b + 1) / BARS);
    if (b % 4 === 3) await sleep(0);
  }

  // Sidechain continuo y suave: cada golpe tiene ataque rápido y recuperación exponencial.
  // K.mix lo convierte en una tabla editable dentro del proyecto.
  const CR = 800;
  const curve = new Float32Array(Math.ceil(K.n / sr * CR) + 2).fill(1);
  for (const [t, d] of ducks) {
    const i0 = Math.floor(t * CR);
    for (let i = i0; i < Math.min(curve.length, i0 + CR * .5); i++) {
      const dt = (i - i0) / CR;
      const g = 1 - d * Math.min(1, dt / .008) * Math.exp(-dt / .13);
      if (g < curve[i]) curve[i] = g;
    }
  }
  const duck = t => {
    const x = Math.max(0, t * CR), i = Math.min(curve.length - 2, Math.floor(x)), f = x - i;
    return curve[i] * (1 - f) + curve[i + 1] * f;
  };

  if (onProg) onProg(1);
  return K.mix(buildDuckCurve());
}
