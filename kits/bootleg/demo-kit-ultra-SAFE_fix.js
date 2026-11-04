// ── KIT DE SÍNTESIS DAW-READY (Modular, Extensible y Controlado) ────
function demoKit(sr, seconds, seed0) {
  const n = Math.ceil(seconds * sr);
  const dr = [new Float32Array(n), new Float32Array(n)], mu = [new Float32Array(n), new Float32Array(n)];
  let seed = seed0 || 20261015;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const lpc = fc => 1 - Math.exp(-2 * Math.PI * Math.min(fc, sr * .45) / sr);
  const soft = x => x < -3 ? -1 : x > 3 ? 1 : x * (27 + x * x) / (27 + 9 * x * x);

  function add(buf, t0, len, fn, amp, pan) {
    const s0 = Math.max(0, Math.floor(t0 * sr)), N = Math.min(Math.floor(len * sr), n - s0); if (N <= 0) return;
    const th = ((pan || 0) + 1) * Math.PI / 4, gl = amp * Math.cos(th) * 1.414, gr = amp * Math.sin(th) * 1.414;
    for (let i = 0; i < N; i++) { const v = fn(i / sr); buf[0][s0 + i] += v * gl; buf[1][s0 + i] += v * gr; }
  }

  // 1. Filtro SVF limpio y estable (Control de Resonancia Q seguro)
  function createSVF(sr) {
    // TPT / Zavalishin: mismo pasa-bajos de 12 dB/oct con resonancia, pero estable con cualquier frecuencia de corte
    // (el Chamberlin original se desbordaba por encima de ~sr/6 y llenaba la mezcla de NaN)
    let ic1 = 0, ic2 = 0;
    return (input, fc, q) => {
      const g = Math.tan(Math.PI * Math.min(fc, sr * 0.45) / sr), k = 1 / Math.max(0.1, (q || 0.707));
      const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
      const v3 = input - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3;
      ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
      return v2;
    };
  }

  // 2. Delay Estéreo Sincronizado / Ping-Pong (Útil para espacialidad sin destruir la mezcla)
  function createStereoDelay(sr, delaySec, feedback) {
    const size = Math.max(1, Math.floor(delaySec * sr));
    const bufL = new Float32Array(size), bufR = new Float32Array(size);
    let ptr = 0;
    return (inL, inR) => {
      const outL = bufL[ptr], outR = bufR[ptr];
      bufL[ptr] = inL + outR * feedback; // Cruzado ping-pong limpio
      bufR[ptr] = inR + outL * feedback;
      ptr = (ptr + 1) % size;
      return [inL + outL * 0.6, inR + outR * 0.6];
    };
  }

  // Percusiones base firmes
  const kick = (t0, a, o) => {
    o = o || {};
    const f1 = o.lo || 42, f0 = o.hi || 180, k = o.k || 45, dec = o.dec || 8.0;
    add(dr, t0, o.len || 0.4, t => {
      const phase = 2 * Math.PI * (f1 * t + (f0 - f1) / k * (1 - Math.exp(-k * t)));
      let signal = Math.sin(phase) * Math.exp(-t * dec);
      const click = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 150) * 0.3;
      return soft((signal + click) * 1.2) * Math.min(1, t * 1200);
    }, a, 0);
  };

  const snare = (t0, a, o) => {
    o = o || {};
    const tn = o.tone || 175, nd = o.nd || 18, td = o.td || 25;
    const filterNoise = createSVF(sr);
    add(dr, t0, o.len || 0.3, t => {
      const x = rnd();
      const noise = filterNoise(x, 2500, 1.0) * Math.exp(-t * nd) * 0.6;
      const tone = Math.sin(2 * Math.PI * tn * t) * Math.exp(-t * td) * 0.4;
      return soft((noise + tone) * 1.2);
    }, a, 0);
  };

  const clap = (t0, a) => { let p = 0; add(dr, t0, .3, t => { const x = rnd(), v = x - p * .7; p = x; return v * (Math.exp(-(t % .011) * 90) * (t < .033 ? 1 : 0) + Math.exp(-t * 14) * .7); }, a, 0); };
  const snap = (t0, a, pan) => { let p = 0; add(dr, t0, .12, t => { const x = rnd(), v = x - p * .9; p = x; return v * Math.exp(-t * 55) * .8 + Math.sin(2 * Math.PI * 1900 * t) * Math.exp(-t * 90) * .5; }, a, pan || 0); };
  const hat = (t0, a, open, pan) => { let p = 0; add(dr, t0, open ? .3 : .07, t => { const x = rnd(), v = x - p; p = x; return v * Math.exp(-t * (open ? 13 : 75)); }, a, pan || 0); };
  const crash = (t0, a, len) => { let p = 0; add(dr, t0, len || 2.4, t => { const x = rnd(), v = x - p * .5; p = x; return v * Math.exp(-t * 2.2); }, a, 0); };

  // Sintetizador modular extensible (con soporte opcional para delay y filtro configurable)
  function syn(buf, t0, len, f, a, pan, o) {
    o = o || {};
    const det = o.det || [0], D = det.length;
    const ph = det.map(() => rnd() * 0.5 + 0.5);
    const atk = o.atk || 0.01, rel = o.rel || 0.1, w = o.w || 0, tot = len + rel;
    const dk = Math.exp(-(o.dec || 0) / sr), ak = 1 / (atk * sr), rk = 1 / (rel * sr);
    const iN = Math.floor(tot * sr), rS = iN - Math.floor(rel * sr);
    
    const filterL = createSVF(sr), filterR = createSVF(sr);
    const stereoDelay = o.delay ? createStereoDelay(sr, o.delayTime || 0.25, o.delayFb || 0.3) : null;
    
    let e = 1, i = 0;
    const s0 = Math.max(0, Math.floor(t0 * sr)), N = Math.min(Math.floor(tot * sr), n - s0);
    if (N <= 0) return;

    for (let step = 0; step < N; step++) {
      const t = step / sr;
      let sigL = 0, sigR = 0;

      for (let k = 0; k < D; k++) {
        const inc = f * Math.pow(2, det[k] / 1200) / sr;
        let p = ph[k] + inc; p -= Math.floor(p); ph[k] = p;
        const wave = w === 0 ? 2 * p - 1 : w === 1 ? (p < 0.5 ? 1 : -1) : Math.sin(6.2831853 * p);
        const panFactor = D > 1 ? (k / (D - 1) * 2 - 1) * 0.5 : 0;
        const th = (panFactor + 1) * Math.PI / 4;
        sigL += wave * Math.cos(th);
        sigR += wave * Math.sin(th);
      }

      sigL /= D; sigR /= D;
      const targetFc = typeof o.lp === 'function' ? o.lp(t) : (o.lp || 3000);
      
      let outL = filterL(sigL, targetFc, o.Q || 0.707);
      let outR = filterR(sigR, targetFc, o.Q || 0.707);

      if (stereoDelay) {
        const [dL, dR] = stereoDelay(outL, outR);
        outL = dL; outR = dR;
      }
      
      const env = Math.min(1, i * ak) * e * (i > rS ? Math.max(0, (iN - i) * rk) : 1);
      e *= dk; i++;

      const masterTh = ((pan || 0) + 1) * Math.PI / 4;
      buf[0][s0 + step] += outL * env * a * Math.cos(masterTh) * 1.414;
      buf[1][s0 + step] += outR * env * a * Math.sin(masterTh) * 1.414;
    }
  }

  function bell(t0, m, a, pan, len) {
    const f = hz(m), L = len || 1.4, P = [[1, 2.5, 1], [2.76, 5, .35], [5.4, 9, .15]];
    add(mu, t0, L, t => { let s = 0; for (const [r, d, g] of P) s += Math.sin(6.2831853 * f * r * t) * Math.exp(-t * d) * g; return s * Math.min(1, t * 600); }, a, pan);
  }

  const bp = (fc, Q) => { const w = 2 * Math.PI * fc / sr, al = Math.sin(w) / (2 * Q), a0 = 1 + al, b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - al) / a0; let x1 = 0, x2 = 0, y1 = 0, y2 = 0; return x => { const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; }; };
  const VOW = { oh: [500, 900], ah: [800, 1200], ee: [300, 2300], oo: [320, 800] };
  function chop(t0, len, m, a, pan, v) {
    const f = hz(m), F = VOW[v || 'oh'], b1 = bp(F[0], 6), b2 = bp(F[1], 8); let ph = 0; const L = len + .08;
    add(mu, t0, L, t => { ph += f * (1 + .004 * Math.sin(t * 38)) / sr; ph -= Math.floor(ph); const s = 2 * ph - 1; return (b1(s) * 1.6 + b2(s)) * Math.min(1, t / .012) * Math.exp(-t * (2.2 / len)) * Math.min(1, (L - t) / .08); }, a, pan);
  }

  function riser(t0, len, a) { let y = 0; add(mu, t0, len, t => { const p = t / len, x = rnd(); y += lpc(250 + 9000 * p * p) * (x - y); return y * (.05 + p * p * .9); }, a, 0); }
  function sweep(t0, len, f0, f1, a) {
    const r = f1 / f0, c = 2 * Math.PI * f0 * len / Math.log(r);
    add(mu, t0, len, t => Math.sin(c * (Math.pow(r, t / len) - 1)) * (t / len) * (t / len), a, 0);
  }

  // Mezcla limpia y profesional con limitador transparente (sin distorsiones falsas)
  function mix(duckAt) {
    const L = new Float32Array(n), R = new Float32Array(n), total = n / sr; let peak = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr, g = duckAt(t), fade = t > total - .6 ? Math.max(0, (total - t) / .6) : 1;
      L[i] = soft((dr[0][i] + mu[0][i] * g) * 0.9) * fade;
      R[i] = soft((dr[1][i] + mu[1][i] * g) * 0.9) * fade;
      const a = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (a > peak) peak = a;
    }
    if (peak > 0.98) { const k = 0.98 / peak; for (let i = 0; i < n; i++) { L[i] *= k; R[i] *= k; } }
    return { L, R, dur: total };
  }

  return { n, dr, mu, rnd, hz, lpc, soft, add, kick, snare, clap, snap, hat, crash, syn, bell, chop, riser, sweep, mix };
}

demoKit.metric = function (sr, BPM, BARS, tail, seed) {
  const beat = 60 / BPM, bar = beat * 4, K = demoKit(sr, BARS * bar + (tail == null ? 2.5 : tail), seed);
  const T = (b, p) => b * bar + (p || 0) * beat;
  const duckBars = (arr, dk) => t => { const b = Math.min(BARS - 1, Math.floor(t / bar)); return 1 - (t < BARS * bar ? (arr[b] || 0) : 0) * Math.exp(-(t % beat) / (dk || .13)); };
  const rawMix = K.mix;
  const mix = (d, dk) => rawMix(typeof d === 'function' ? d : duckBars(d || [], dk));
  return Object.assign(K, { BPM, BARS, beat, bar, T, duckBars, mix });
};
