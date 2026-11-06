// ── Guitarra acompañante · plugin de instrumento para Demo Kit ──
// Una NOTA larga en el piano roll = un PASAJE: la guitarra acompaña ese tiempo siguiendo un círculo de acordes y un patrón de rasgueo.
//   · La altura de la nota solo elige la tónica (do, re, mi…); el registro lo decide la guitarra, como lo haría una mano.
//   · El largo de la nota es cuánto acompaña. Dibuja una nota por sección (Verso, Coro…) y cambia de círculo, patrón o intérprete por pista.
// Cada cuerda es un modelo físico de cuerda pulsada (Karplus-Strong con afinación fraccionaria, pérdidas que apagan primero los agudos,
// posición de la púa y caja de resonancia), tocada con retardos y fuerzas que varían un poco, todo con la semilla de la pista (sin Math.random):
// el mismo proyecto suena igual siempre. Solo usa K.add y K.rnd, así que funciona con el kit incluido y con cualquiera de los alternos.
// Autoría: Ámbar (Claude Sonnet 5.5) con Brujo; la idea de programar el acompañamiento nació de la «guitarrita» que escribió Éter.
registerInstrument((() => {
  const TWO_PI = 6.283185307179586;
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- acordes: intervalos desde el bajo, pensados como se arman en la guitarra (primero lo importante) ---------- */
  const CH = {
    maj:  [0, 7, 12, 16, 19, 24], min:  [0, 7, 12, 15, 19, 24],
    dom7: [0, 7, 10, 16, 19, 22], maj7: [0, 7, 11, 16, 19, 23], min7: [0, 7, 10, 15, 19, 22],
    maj9: [0, 7, 11, 16, 26, 31], min9: [0, 7, 10, 15, 26, 31], dom9: [0, 7, 10, 16, 26, 31],
    dim:  [0, 6, 12, 15, 18, 24], dim7: [0, 6, 9, 15, 18, 21], m7b5: [0, 6, 10, 15, 18, 22]
  };
  // función del acorde → nombre según la riqueza elegida (0 tríadas · 1 séptimas · 2 novenas)
  const EXT = { maj: ['maj', 'maj7', 'maj9'], min: ['min', 'min7', 'min9'], dom: ['maj', 'dom7', 'dom9'], dim: ['dim', 'dim', 'dim'], dim7: ['dim7', 'dim7', 'dim7'], m7b5: ['m7b5', 'm7b5', 'm7b5'] };
  // círculos: [semitonos sobre la tónica, función]
  const PROG = {
    lofi:     [[0, 'maj'], [9, 'min'], [2, 'min'], [7, 'dom']],                 // I – vi – ii – V
    jazz:     [[2, 'min'], [7, 'dom'], [0, 'maj'], [0, 'maj']],                 // ii – V – I – I
    bossa:    [[0, 'maj'], [1, 'dim7'], [2, 'min'], [7, 'dom']],                // I – #i° – ii – V
    andaluza: [[0, 'min'], [10, 'maj'], [8, 'maj'], [7, 'dom']],                // i – VII – VI – V
    menor:    [[0, 'min'], [8, 'maj'], [3, 'maj'], [10, 'dom']],                // i – VI – III – VII
    pop:      [[0, 'maj'], [7, 'maj'], [9, 'min'], [5, 'maj']],                 // I – V – vi – IV
    ranchera: [[0, 'maj'], [5, 'maj'], [7, 'dom'], [0, 'maj']],                 // I – IV – V – I
    quintas:  [[0, 'maj'], [5, 'maj'], [11, 'm7b5'], [4, 'min'], [9, 'min'], [2, 'min'], [7, 'dom'], [0, 'maj']]   // círculo de quintas
  };

  /* ---------- patrones de mano derecha: [pulso dentro del acorde, golpe, fuerza] ----------
     D rasgueo hacia abajo · U hacia arriba (solo las cuerdas agudas) · C golpe corto de acorde (4 cuerdas agudas) ·
     B bajo (raíz) · B5 bajo (quinta) · A0…A5 una sola cuerda (arpegio) */
  const PAT = {
    abajo:     { per: 4, ev: [[0, 'D', 1], [1, 'D', .8], [2, 'D', .9], [3, 'D', .8]] },
    balada:    { per: 4, ev: [[0, 'D', 1], [1, 'D', .75], [1.5, 'U', .6], [2.5, 'U', .65], [3, 'D', .8], [3.5, 'U', .6]] },
    idavuelta: { per: 4, ev: [[0, 'D', 1], [.5, 'U', .55], [1, 'D', .8], [1.5, 'U', .55], [2, 'D', .9], [2.5, 'U', .55], [3, 'D', .8], [3.5, 'U', .55]] },
    arpegio:   { per: 4, ev: [[0, 'A0', 1], [.5, 'A2', .7], [1, 'A3', .75], [1.5, 'A4', .7], [2, 'A1', .85], [2.5, 'A3', .7], [3, 'A4', .75], [3.5, 'A2', .65]] },
    bossa:     { per: 4, ev: [[0, 'B', 1], [1.5, 'C', .7], [2, 'B5', .85], [3, 'C', .7], [3.5, 'C', .6]] },
    ranchera:  { per: 4, ev: [[0, 'B', 1], [1, 'C', .85], [2, 'B5', .9], [3, 'C', .85]] },
    vals:      { per: 3, ev: [[0, 'B', 1], [1, 'C', .8], [2, 'C', .75]] },
    flamenco:  { per: 4, ev: [[0, 'D', 1], [.75, 'U', .6], [1, 'D', .9], [1.5, 'U', .6], [2, 'D', 1], [2.5, 'D', .8], [2.75, 'U', .55], [3, 'D', .9], [3.5, 'U', .6]] }
  };

  /* ---------- intérpretes: cómo toca la mano ----------
     delay = segundos entre cuerda y cuerda del rasgueo · s = pérdida del lazo (más = más opaca) · t60 = cuánto suena la cuerda grave (s)
     pos = dónde pica la cuerda (0.1 junto al puente = brillante, 0.4 = redonda) · exLP = suavidad de la yema (1 = carne, 0 = uña)
     click = golpe de la uña · lp = tope de agudos (Hz) · sat = madera al límite · timing/vel = cuánto varía la mano */
  const PERF = {
    infante:  { delay: .028,  s: .44, t60: 3.0, pos: .30, exLP: .80, click: .04, lp: 4200, sat: 0,  timing: .008, vel: .10 },
    flamenco: { delay: .0065, s: .20, t60: 2.2, pos: .12, exLP: .15, click: .55, lp: 9000, sat: .3, timing: .003, vel: .12 },
    bossa:    { delay: .016,  s: .38, t60: 2.6, pos: .24, exLP: .60, click: .12, lp: 5200, sat: 0,  timing: .006, vel: .08 },
    ranchera: { delay: .011,  s: .30, t60: 2.3, pos: .16, exLP: .35, click: .30, lp: 7000, sat: .1, timing: .005, vel: .10 },
    lofi:     { delay: .020,  s: .48, t60: 1.8, pos: .35, exLP: .90, click: .02, lp: 2600, sat: .12, timing: .010, vel: .12 }
  };

  const LEVEL = .6;   // ganancia de calibración de nivel (se ajusta con medidas)

  const bpf = (fc, Q, sr) => { const w = TWO_PI * fc / sr, al = Math.sin(w) / (2 * Q), a0 = 1 + al; return { b0: al / a0, b2: -al / a0, a1: -2 * Math.cos(w) / a0, a2: (1 - al) / a0, x1: 0, x2: 0, y1: 0, y2: 0 }; };
  const runBq = (q, x) => { const y = q.b0 * x + q.b2 * q.x2 - q.a1 * q.y1 - q.a2 * q.y2; q.x2 = q.x1; q.x1 = x; q.y2 = q.y1; q.y1 = y; return y; };

  // acorde → notas MIDI de las cuerdas (de grave a aguda); la raíz cae en el registro del bajo de la guitarra (MI2–RE#3)
  function voicing(tonicPc, off, fn, ext, strings) {
    let root = 40 + ((((tonicPc + off) % 12) - 40) % 12 + 12) % 12; if (root > 51) root -= 12;
    const name = (EXT[fn] || EXT.maj)[ext], iv = CH[name]; return iv.slice(0, strings).map(i => root + i);
  }

  // una cuerda pulsada: escribe en acc (mono) desde la muestra i0 durante ring muestras
  function pluck(K, acc, i0, midi, amp, ring, pf, sustain, sr, pickBoost) {
    if (i0 >= acc.length || ring < 16) return; ring = Math.min(ring, acc.length - i0);
    const f = mtof(midi), s = pf.s, target = sr / f - s, Nb = Math.max(4, Math.floor(target - .5)), frac = target - Nb, apc = (1 - frac) / (1 + frac);
    const T60 = Math.max(.25, pf.t60 * sustain * Math.pow(110 / f, .35)), rho = Math.pow(10, -3 / (f * T60));
    // excitación: ruido suavizado por la yema y con la peineta de la posición de la púa
    const line = new Float32Array(Nb), raw = new Float32Array(Nb), lpA = 1 - pf.exLP * .93; let y = 0;
    for (let k = 0; k < Nb; k++) { y += lpA * (K.rnd() - y); raw[k] = y; }
    const b = clamp(Math.round(pf.pos * Nb), 1, Nb - 1); let mean = 0, e2 = 0;
    for (let k = 0; k < Nb; k++) { line[k] = k >= b ? raw[k] - raw[k - b] : raw[k]; mean += line[k]; } mean /= Nb;
    for (let k = 0; k < Nb; k++) { line[k] -= mean; e2 += line[k] * line[k]; }
    const sc = .5 / Math.sqrt(e2 / Nb + 1e-12); for (let k = 0; k < Nb; k++) line[k] *= sc;
    const relN = Math.min(ring >> 1, Math.floor(.06 * sr)), fadeAt = ring - relN;
    let p = 0, xp = 0, apx = 0, apy = 0;
    for (let k = 0; k < ring; k++) {
      const x = line[p], flt = (x * (1 - s) + xp * s) * rho; xp = x;
      const yv = apc * flt + apx - apc * apy; apx = flt; apy = yv; line[p] = yv; if (++p === Nb) p = 0;
      acc[i0 + k] += x * amp * (k < fadeAt ? 1 : (ring - k) / relN);
    }
    // golpe de la uña / yema: un soplo corto de ruido brillante
    const cl = Math.min(ring, Math.floor(.012 * sr)), ck = pf.click * pickBoost; let cp = 0;
    if (ck > 0) for (let k = 0; k < cl; k++) { const c = K.rnd(); acc[i0 + k] += (c - cp) * ck * amp * Math.exp(-k / (.0025 * sr)) * .35; cp = c; }
  }

  const choice = (k, label, opts, vals, def) => ({ k, label, type: 'choice', opts, vals, def });
  return {
    id: 'guitarra_acomp', name: 'Guitarra acompañante', kind: 'melodic', cat: 'acomp',
    desc: 'Una nota larga = un pasaje: la guitarra acompaña ese tiempo con un círculo de acordes y un patrón de rasgueo, tocado por un intérprete (Pedro Infante, Flamenco, Bossa, Ranchera, Lo-fi). La altura de la nota elige la tónica; el largo, cuánto acompaña.',
    params: [
      { k: 'gain', label: 'Ganancia', min: 0, max: 1.5, step: .01, def: .5 },
      choice('interprete', 'Intérprete', ['Pedro Infante (caricia)', 'Flamenco (aporreado)', 'Bossa (suave)', 'Ranchera (con uña)', 'Lo-fi (apagada)'], ['infante', 'flamenco', 'bossa', 'ranchera', 'lofi'], 'infante'),
      choice('circulo', 'Círculo de acordes', ['Lo-fi romántico (I–vi–ii–V)', 'Jazz 2-5-1', 'Bossa (I–#i°–ii–V)', 'Andaluza (i–VII–VI–V)', 'Menor (i–VI–III–VII)', 'Pop (I–V–vi–IV)', 'Ranchera (I–IV–V–I)', 'Círculo de quintas'], ['lofi', 'jazz', 'bossa', 'andaluza', 'menor', 'pop', 'ranchera', 'quintas'], 'lofi'),
      choice('ext', 'Acordes', ['Tríadas', 'Séptimas', 'Novenas'], [0, 1, 2], 1),
      choice('patron', 'Patrón de la mano derecha', ['Abajo (negras)', 'Balada', 'Ida y vuelta', 'Arpegio', 'Bossa', 'Ranchera', 'Vals (3 pulsos)', 'Flamenco'], ['abajo', 'balada', 'idavuelta', 'arpegio', 'bossa', 'ranchera', 'vals', 'flamenco'], 'balada'),
      { k: 'pulsos', label: 'Pulsos por acorde', min: 1, max: 16, step: 1, def: 4 },
      { k: 'cuerdas', label: 'Cuerdas', min: 4, max: 6, step: 1, def: 6 },
      { k: 'humaniza', label: 'Humanización', min: 0, max: 1, step: .05, def: .5 },
      { k: 'velo', label: 'Rapidez del rasgueo (×)', min: .4, max: 2.5, step: .05, def: 1 },
      { k: 'brillo', label: 'Brillo (×)', min: .4, max: 2, step: .05, def: 1 },
      { k: 'cuerpo', label: 'Caja de la guitarra', min: 0, max: 1, step: .05, def: .6 },
      { k: 'sustain', label: 'Sustain (×)', min: .4, max: 2.5, step: .05, def: 1 }
    ],
    presets: {
      'Pedro Infante': { interprete: 'infante', circulo: 'pop', ext: 1, patron: 'arpegio', pulsos: 4, humaniza: .55, velo: 1, brillo: 1, cuerpo: .65 },
      'Flamenco': { interprete: 'flamenco', circulo: 'andaluza', ext: 0, patron: 'flamenco', pulsos: 4, humaniza: .4, velo: 1, brillo: 1.1, cuerpo: .55 },
      'Bossa nova': { interprete: 'bossa', circulo: 'bossa', ext: 2, patron: 'bossa', pulsos: 4, humaniza: .45, velo: 1, brillo: .9, cuerpo: .6 },
      'Ranchera': { interprete: 'ranchera', circulo: 'ranchera', ext: 0, patron: 'ranchera', pulsos: 4, humaniza: .5, velo: 1, brillo: 1, cuerpo: .6 },
      'Lo-fi nocturno': { interprete: 'lofi', circulo: 'lofi', ext: 2, patron: 'balada', pulsos: 4, humaniza: .7, velo: .9, brillo: .8, cuerpo: .7 }
    },
    play(K, n) {
      const p = n.p, sr = n.sr, beat = n.beat, pf = PERF[p.interprete] || PERF.infante, pat = PAT[p.patron] || PAT.balada, prog = PROG[p.circulo] || PROG.lofi;
      const hum = clamp(p.humaniza == null ? .5 : p.humaniza, 0, 1), ext = clamp(Math.round(p.ext == null ? 1 : p.ext), 0, 2), ns = clamp(Math.round(p.cuerdas || 6), 4, 6);
      const speed = 1 / clamp(p.velo || 1, .3, 3), sus = clamp(p.sustain || 1, .3, 3), tonic = ((n.midi % 12) + 12) % 12, chordLen = Math.max(1, Math.round(p.pulsos || 4)) * beat;
      const tail = 1.2, total = Math.ceil((n.len + tail) * sr), acc = new Float32Array(total), r = () => K.rnd();
      let ci = 0;
      for (let cs = 0; cs < n.len - 1e-6; cs += chordLen, ci++) {
        const ce = Math.min(n.len, cs + chordLen), last = ce >= n.len - 1e-6, ch = prog[ci % prog.length], notes = voicing(tonic, ch[0], ch[1], ext, ns), rel = last ? .9 : .05;
        const hit = (idx, t, vol, ringMax, boost) => {         // una cuerda en el tiempo t (dentro del pasaje)
          const tt = t, ring = Math.floor(Math.min(ce - t + rel, ringMax) * sr); if (ring < 16 || tt < 0) return;
          pluck(K, acc, Math.round(tt * sr), notes[idx], vol * (1 - .03 * idx) * (1 + hum * pf.vel * r()), ring, pf, sus, sr, boost);
        };
        for (let rep = 0; cs + rep * pat.per * beat < ce - 1e-6; rep++) {
          for (const [pos, kind, fz] of pat.ev) {
            const t0 = cs + (rep * pat.per + pos) * beat + hum * pf.timing * r(); if (t0 >= ce - 1e-6 || t0 < 0) continue;
            const d = pf.delay * speed * (1 + hum * .25 * r());
            if (kind === 'D') { for (let i = 0; i < ns; i++) hit(i, t0 + i * d, fz, 8, fz); }
            else if (kind === 'U') { const m = Math.ceil(ns * .65); for (let j = 0; j < m; j++) hit(ns - 1 - j, t0 + j * d * .85, fz * .72, 6, fz * .7); }
            else if (kind === 'C') { const m = Math.min(4, ns); for (let j = 0; j < m; j++) hit(ns - m + j, t0 + j * d, fz * .85, .24, fz); }
            else if (kind === 'B') hit(0, t0, fz, 8, fz * .6);
            else if (kind === 'B5') hit(Math.min(1, ns - 1), t0, fz, 8, fz * .6);
            else if (kind[0] === 'A') hit(Math.min(+kind[1], ns - 1), t0, fz, 8, fz);
          }
        }
      }
      // caja de resonancia (aire ~100 Hz, tapa ~200 Hz, madera ~400 Hz, presencia ~2.4 kHz), tope de agudos y madera al límite
      const body = clamp(p.cuerpo == null ? .6 : p.cuerpo, 0, 1), R = [[98, 5, .55], [205, 4, .45], [395, 3, .22], [2400, 1.2, .12]].map(([fc, Q, g]) => ({ q: bpf(fc, Q, sr), g: g * body }));
      const lpc = 1 - Math.exp(-TWO_PI * clamp(pf.lp * (p.brillo || 1), 800, sr * .45) / sr); let ylp = 0; const sat = pf.sat;
      for (let i = 0; i < total; i++) {
        const x = acc[i]; let y = x; for (const b of R) y += runBq(b.q, x) * b.g;
        ylp += lpc * (y - ylp); acc[i] = sat > 0 ? Math.tanh(ylp * (1 + sat * 3)) / (1 + sat * .6) : ylp;
      }
      K.add(n.buf, n.t, n.len + tail, t => acc[Math.round(t * sr)] || 0, n.a * p.gain * LEVEL, n.pan);
    }
  };
})());
