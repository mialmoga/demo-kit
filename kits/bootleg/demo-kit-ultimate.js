// ════════════════════════════════════════════════════════════════════════════
//  DEMO KIT ULTIMATE (Versión Definitiva CMC · Zero-Dependencies Studio Engine)
// ════════════════════════════════════════════════════════════════════════════
//  Orquestado para Demo Kit Studio / DAW JS.
//  Unifica las mejoras de Ámbar, Velvet y Éter:
//    1. Filtro TPT/Zavalishin SVF (12 dB/oct + Q de alta estabilidad sin desbordamientos).
//    2. Osciladores antialias PolyBLEP + Unísono estéreo + LFO dinámico + Wavetable.
//    3. Saturación / Wavefolding suave con limitación por tangente hiperbólica (`Math.tanh`).
//    4. Envelope Follower, Comb Filter / Delay en Peine y Ping-Pong Delay Sincronizado.
//    5. Sanitización estricta contra NaN/Infinito e inestabilidad de frecuencias Nyquist.
// ════════════════════════════════════════════════════════════════════════════

function demoKit(sr, seconds, seed0) {
  const n = Math.ceil(seconds * sr);
  const dr = [new Float32Array(n), new Float32Array(n)];
  const mu = [new Float32Array(n), new Float32Array(n)];

  let seed = seed0 || 20261015;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2147483648 - 1;
  };

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const lpc = fc => 1 - Math.exp(-2 * Math.PI * Math.min(fc, sr * 0.45) / sr);
  const soft = x => x < -3 ? -1 : x > 3 ? 1 : x * (27 + x * x) / (27 + 9 * x * x);
  const fold = (x, gain = 2.0) => Math.sin(x * gain * 1.5707963);

  // Helper para prevenir desbordamientos o NaN en los búferes
  const sanitize = v => (isFinite(v) ? v : 0);

  function add(buf, t0, len, fn, amp, pan) {
    const s0 = Math.max(0, Math.floor(t0 * sr));
    const N = Math.min(Math.floor(len * sr), n - s0);
    if (N <= 0) return;

    const th = ((pan || 0) + 1) * Math.PI / 4;
    const gl = amp * Math.cos(th) * 1.414;
    const gr = amp * Math.sin(th) * 1.414;

    for (let i = 0; i < N; i++) {
      const v = sanitize(fn(i / sr));
      buf[0][s0 + i] += v * gl;
      buf[1][s0 + i] += v * gr;
    }
  }

  // ── 1. FILTRO DE ESTADO VARIABLE ROBUSTO (TPT / Zavalishin SVF) ────────────
  function createSVF(sr) {
    let ic1 = 0, ic2 = 0;
    return (input, fc, q) => {
      const safeFc = Math.max(10, Math.min(fc || 2500, sr * 0.44));
      const safeQ = Math.max(0.1, Math.min(q || 0.707, 20.0));
      const g = Math.tan(Math.PI * safeFc / sr);
      const k = 1 / safeQ;
      const a1 = 1 / (1 + g * (g + k));
      const a2 = g * a1;
      const a3 = g * a2;
      const v3 = input - ic2;
      const v1 = a1 * ic1 + a2 * v3;
      const v2 = ic2 + a2 * ic1 + a3 * v3;
      ic1 = 2 * v1 - ic1;
      ic2 = 2 * v2 - ic2;
      return sanitize(v2);
    };
  }

  // ── 2. MODULADORES Y EFECTOS DE AUDIO PRO ─────────────────────────────────
  function createEnvelopeFollower(sr, attackMs = 5, releaseMs = 80) {
    const alphaAtt = Math.exp(-1 / (sr * (attackMs / 1000)));
    const alphaRel = Math.exp(-1 / (sr * (releaseMs / 1000)));
    let env = 0;
    return input => {
      const absVal = Math.abs(input);
      const coeff = absVal > env ? alphaAtt : alphaRel;
      env = absVal + coeff * (env - absVal);
      return sanitize(env);
    };
  }

  function createComb(sr, delayTime = 0.02, feedback = 0.35) {
    const size = Math.max(1, Math.floor(delayTime * sr));
    const buf = new Float32Array(size);
    let ptr = 0;
    return input => {
      const out = buf[ptr];
      buf[ptr] = sanitize(input + out * feedback);
      ptr = (ptr + 1) % size;
      return input + out * 0.5;
    };
  }

  function createPingPongDelay(sr, bpm = 120, delayBeats = 0.5, feedback = 0.35, mixVal = 0.25) {
    const beatTime = 60 / bpm;
    const delaySamples = Math.max(1, Math.floor(sr * beatTime * delayBeats));
    const size = Math.max(1, delaySamples * 2);
    const bufferL = new Float32Array(size);
    const bufferR = new Float32Array(size);
    let ptr = 0;

    return (inL, inR) => {
      const readIdx = (ptr - delaySamples + size) % size;
      const outL = bufferL[readIdx];
      const outR = bufferR[readIdx];

      bufferL[ptr] = sanitize(inL + outR * feedback);
      bufferR[ptr] = sanitize(inR + outL * feedback);
      ptr = (ptr + 1) % size;

      return [
        inL * (1 - mixVal) + outL * mixVal,
        inR * (1 - mixVal) + outR * mixVal
      ];
    };
  }

  // ── 3. SÍNTESIS POR TABLAS DE ONDAS (Wavetable) ───────────────────────────
  const wtTables = [new Float32Array(256), new Float32Array(256)];
  for (let i = 0; i < 256; i++) {
    const phase = (i / 256) * Math.PI * 2;
    wtTables[0][i] = Math.sin(phase);
    wtTables[1][i] = i < 128 ? 1 : -1;
  }

  function sampleWavetable(tableIndex, phase, morph = 0) {
    const tIdx = Math.max(0, Math.min(wtTables.length - 1, tableIndex));
    const table = wtTables[tIdx];
    const p = (phase % 1 + 1) % 1;
    const idxFloat = p * 256;
    const idx = Math.floor(idxFloat);
    const nextIdx = (idx + 1) % 256;
    const frac = idxFloat - idx;
    const val = table[idx] * (1 - frac) + table[nextIdx] * frac;
    return val * (1 - morph) + Math.sin(p * Math.PI * 4) * morph;
  }

  const polyBlep = (p, dt) => {
    if (dt <= 0 || dt >= 0.5) return 0;
    if (p < dt) { const x = p / dt; return x + x - x * x - 1; }
    if (p > 1 - dt) { const x = (p - 1) / dt; return x * x + x + x + 1; }
    return 0;
  };

  // ── 4. PERCUSIÓN MEJORADA ──────────────────────────────────────────────────
  const kick = (t0, a, o) => {
    o = o || {};
    const f1 = o.lo || 42, f0 = o.hi || 180, k = o.k || 45, dec = o.dec || 8.0;
    const drive = o.drive || 1.8;
    add(dr, t0, o.len || 0.4, t => {
      const phase = 2 * Math.PI * (f1 * t + (f0 - f1) / k * (1 - Math.exp(-k * t)));
      let signal = Math.sin(phase) * Math.exp(-t * dec);
      const click = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 150) * 0.35;
      let mixed = fold((signal + click) * drive, o.fold == null ? 0.3 : o.fold);
      return Math.tanh(mixed) * Math.min(1, t * 1200);
    }, a, 0);
  };

  const snare = (t0, a, o) => {
    o = o || {};
    const tn = o.tone || 175, nd = o.nd || 18, td = o.td || 25;
    const filterNoise = createSVF(sr);
    add(dr, t0, o.len || 0.3, t => {
      const x = rnd();
      const noise = filterNoise(x, 2200, 1.2) * Math.exp(-t * nd) * 0.7;
      const tone = Math.sin(2 * Math.PI * tn * t) * Math.exp(-t * td) * 0.4;
      return Math.tanh((noise + tone) * 1.3);
    }, a, 0);
  };

  const clap = (t0, a) => {
    let p = 0;
    add(dr, t0, 0.3, t => {
      const x = rnd(), v = x - p * 0.7; p = x;
      return v * (Math.exp(-(t % 0.011) * 90) * (t < 0.033 ? 1 : 0) + Math.exp(-t * 14) * 0.7);
    }, a, 0);
  };

  const snap = (t0, a, pan) => {
    let p = 0;
    add(dr, t0, 0.12, t => {
      const x = rnd(), v = x - p * 0.9; p = x;
      return v * Math.exp(-t * 55) * 0.8 + Math.sin(2 * Math.PI * 1900 * t) * Math.exp(-t * 90) * 0.5;
    }, a, pan || 0);
  };

  const hat = (t0, a, open, pan) => {
    let p = 0;
    add(dr, t0, open ? 0.3 : 0.07, t => {
      const x = rnd(), v = x - p; p = x;
      return v * Math.exp(-t * (open ? 13 : 75));
    }, a, pan || 0);
  };

  const crash = (t0, a, len) => {
    let p = 0;
    add(dr, t0, len || 2.4, t => {
      const x = rnd(), v = x - p * 0.5; p = x;
      return v * Math.exp(-t * 2.2);
    }, a, 0);
  };

  // ── 5. SINTETIZADOR ULTIMATE (K.syn DEFINITIVO) ───────────────────────────
  function syn(buf, t0, len, f, a, pan, o) {
    o = o || {};
    const det = o.det || [0], D = Math.max(1, det.length);
    const ph = det.map((_, idx) => ((idx + 1) * 0.61803398875) % 1);
    const partialPans = det.map((_, idx) => (D > 1 ? (idx / (D - 1) * 2 - 1) * 0.4 : 0));

    const atk = Math.max(0.001, o.atk || 0.008);
    const rel = Math.max(0.005, o.rel || 0.12);
    const decay = o.dec || 0;
    const tot = len + rel;

    const dk = Math.exp(-decay / sr);
    const ak = 1 / (atk * sr);
    const rk = 1 / (rel * sr);

    const iN = Math.floor(tot * sr);
    const rS = iN - Math.floor(rel * sr);

    const filterL = createSVF(sr), filterR = createSVF(sr);
    const envFollower = o.envSens ? createEnvelopeFollower(sr, 5, 80) : null;
    const combL = o.comb ? createComb(sr, o.combTime || 0.02, o.combFb || 0.35) : x => x;
    const combR = o.comb ? createComb(sr, o.combTime || 0.02, o.combFb || 0.35) : x => x;
    const stereoDelay = o.delay ? createPingPongDelay(sr, o.bpm || 120, o.delayBeats || 0.5, o.delayFb || 0.3, o.delayMix || 0.25) : null;

    let e = 1, i = 0;
    const s0 = Math.max(0, Math.floor(t0 * sr));
    const N = Math.min(Math.floor(tot * sr), n - s0);
    if (N <= 0) return;

    for (let step = 0; step < N; step++) {
      const t = step / sr;
      let sigL = 0, sigR = 0;

      const lfoMod = o.lfo ? Math.sin(t * (o.lfoFreq || 4.0)) * (o.lfoDepth || 1.5) : 0;

      for (let k = 0; k < D; k++) {
        const currentDet = det[k] + lfoMod;
        const freq = Math.min(f * Math.pow(2, currentDet / 1200), sr * 0.44);
        const dt = Math.max(0.00001, Math.min(0.499, freq / sr));

        let p = ph[k] + dt; p -= Math.floor(p); ph[k] = p;

        let wave = 0;
        if (o.wavetable) {
          wave = sampleWavetable(o.wtIndex || 0, p, o.morph || 0);
        } else if (o.w === 1) {
          wave = (p < 0.5 ? 1 : -1) + polyBlep(p, dt) - polyBlep((p + 0.5) % 1, dt);
        } else if (o.w === 2) {
          wave = Math.sin(2 * Math.PI * p);
        } else {
          wave = 2 * p - 1 - polyBlep(p, dt);
        }

        if (o.ringModFreq) {
          wave *= Math.sin(2 * Math.PI * o.ringModFreq * t);
        } else if (o.amFreq) {
          const depth = o.amDepth || 0.5;
          wave *= (1.0 - depth + depth * Math.sin(2 * Math.PI * o.amFreq * t));
        }

        const panFactor = partialPans[k];
        const th = (panFactor + 1) * Math.PI / 4;
        sigL += wave * Math.cos(th);
        sigR += wave * Math.sin(th);
      }

      sigL /= D; sigR /= D;

      if (o.sub) {
        const sub = Math.sin(2 * Math.PI * (f * 0.5) * t) * o.sub;
        sigL += sub * 0.5;
        sigR += sub * 0.5;
      }

      const envVal = envFollower ? envFollower(sigL + sigR) : 0;
      const baseFc = typeof o.lp === 'function' ? o.lp(t) : (o.lp || 3500);
      const dynamicFc = Math.min(sr * 0.44, baseFc + envVal * (o.envSens || 0));

      let outL = filterL(sigL, dynamicFc, o.Q || 0.707);
      let outR = filterR(sigR, dynamicFc, o.Q || 0.707);

      outL = combL(outL);
      outR = combR(outR);

      if (stereoDelay) {
        const [dL, dR] = stereoDelay(outL, outR);
        outL = dL; outR = dR;
      }

      const ampEnv = Math.min(1, i * ak) * e * (i > rS ? Math.max(0, (iN - i) * rk) : 1);
      e *= dk; i++;

      const vL = Math.tanh(outL * (o.drive || 1.15)) * ampEnv;
      const vR = Math.tanh(outR * (o.drive || 1.15)) * ampEnv;

      const masterTh = ((pan || 0) + 1) * Math.PI / 4;
      buf[0][s0 + step] += sanitize(vL * a * Math.cos(masterTh) * 1.414);
      buf[1][s0 + step] += sanitize(vR * a * Math.sin(masterTh) * 1.414);
    }
  }

  // ── 6. INSTRUMENTOS ADICIONALES Y TRANSICIONES ────────────────────────────
  function bell(t0, m, a, pan, len) {
    const f = hz(m), L = len || 1.4;
    const P = [[1, 2.5, 1], [2.76, 5, 0.35], [5.4, 9, 0.15]];
    add(mu, t0, L, t => {
      let s = 0;
      for (const [r, d, g] of P) s += Math.sin(6.2831853 * f * r * t) * Math.exp(-t * d) * g;
      return s * Math.min(1, t * 600);
    }, a, pan);
  }

  const bp = (fc, Q) => {
    const w = 2 * Math.PI * fc / sr, al = Math.sin(w) / (2 * Q), a0 = 1 + al;
    const b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - al) / a0;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    return x => {
      const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      return sanitize(y);
    };
  };

  const VOW = { oh: [500, 900], ah: [800, 1200], ee: [300, 2300], oo: [320, 800] };
  function chop(t0, len, m, a, pan, v) {
    const f = hz(m), F = VOW[v || 'oh'], b1 = bp(F[0], 6), b2 = bp(F[1], 8);
    let ph = 0; const L = len + 0.08;
    add(mu, t0, L, t => {
      ph += f * (1 + 0.004 * Math.sin(t * 38)) / sr; ph -= Math.floor(ph);
      const s = 2 * ph - 1;
      return (b1(s) * 1.6 + b2(s)) * Math.min(1, t / 0.012) * Math.exp(-t * (2.2 / len)) * Math.min(1, (L - t) / 0.08);
    }, a, pan);
  }

  function riser(t0, len, a) {
    let y = 0;
    add(mu, t0, len, t => {
      const p = t / len, x = rnd();
      y += lpc(250 + 9000 * p * p) * (x - y);
      return y * (0.05 + p * p * 0.9);
    }, a, 0);
  }

  function sweep(t0, len, f0, f1, a) {
    const r = f1 / f0, c = 2 * Math.PI * f0 * len / Math.log(r);
    add(mu, t0, len, t => Math.sin(c * (Math.pow(r, t / len) - 1)) * (t / len) * (t / len), a, 0);
  }

  // ── 7. MEZCLA Y LIMITADOR DE ESTUDIO ──────────────────────────────────────
  function mix(duckAt) {
    const L = new Float32Array(n), R = new Float32Array(n), total = n / sr;
    let peak = 0;

    const maximize = x => {
      const driven = x * 1.0;
      return driven > 1 ? (2 / Math.PI) * Math.atan(driven) : (driven < -1 ? -(2 / Math.PI) * Math.atan(-driven) : driven);
    };

    for (let i = 0; i < n; i++) {
      const t = i / sr, g = duckAt(t);
      const fade = t > total - 0.6 ? Math.max(0, (total - t) / 0.6) : 1;

      const rawL = (dr[0][i] + mu[0][i] * g) * 0.9;
      const rawR = (dr[1][i] + mu[1][i] * g) * 0.9;

      L[i] = sanitize(maximize(rawL) * fade);
      R[i] = sanitize(rawR) * fade;

      const absPeak = Math.max(Math.abs(L[i]), Math.abs(R[i]));
      if (absPeak > peak) peak = absPeak;
    }

    if (peak > 0.95) {
      const k = 0.95 / peak;
      for (let i = 0; i < n; i++) {
        L[i] *= k;
        R[i] *= k;
      }
    }
    return { L, R, dur: total };
  }

  const api = {
    n, dr, mu, rnd, hz, lpc, soft, fold, add,
    kick, snare, clap, snap, hat, crash,
    syn, bell, chop, riser, sweep, mix
  };
  return api;
}

demoKit.metric = function(sr, BPM, BARS, tail, seed) {
  const beat = 60 / BPM, bar = beat * 4;
  const K = demoKit(sr, BARS * bar + (tail == null ? 2.5 : tail), seed);
  const T = (b, p) => b * bar + (p || 0) * beat;
  const duckBars = (arr, dk) => t => {
    const b = Math.min(BARS - 1, Math.floor(t / bar));
    return 1 - (t < BARS * bar ? (arr[b] || 0) : 0) * Math.exp(-(t % beat) / (dk || 0.13));
  };
  const rawMix = K.mix;
  const mix = (d, dk) => rawMix(typeof d === 'function' ? d : duckBars(d || [], dk));
  return Object.assign(K, { BPM, BARS, beat, bar, T, duckBars, mix });
};
