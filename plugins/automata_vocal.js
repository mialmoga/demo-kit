// ── Voz cantada (Autómata Vocal) · plugin de instrumento para Demo Kit ──
// Sintetizador de formantes en español portado a JavaScript puro (sin Web Audio) para que corra dentro del render del estudio.
// Cada nota canta el TEXTO que le escribas encima (doble toque, mantener pulsada la nota o Intro en el piano roll): las sílabas se reparten dentro de la duración de la nota
// y el tono es el de la nota. Sin texto canta «a». Energía, Sorpresa y Cansancio se pueden cambiar nota por nota (panel «Notas») o con una curva.
// Autoría: motor de voz original «Autómata Vocal» (Claude Sonnet + Brujo); port a plugin de Demo Kit.
registerInstrument((() => {
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12), clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- fonética del español ---------- */
  const VOW = { a: [750, 1300, 2500], e: [450, 1900, 2550], i: [280, 2200, 3000], o: [480, 950, 2500], u: [300, 800, 2300] };
  const PH = {
    m: { k: 'N', f: [250, 1100, 2200] }, n: { k: 'N', f: [250, 1500, 2400] }, 'ñ': { k: 'N', f: [250, 1900, 2500] },
    l: { k: 'L', f: [350, 1400, 2800] }, r: { k: 'T' }, R: { k: 'R' },
    s: { k: 'F', nf: 6500, nq: 1.2, g: .5, d: .09 }, f: { k: 'F', nf: 4200, nq: .4, g: .28, d: .08 }, x: { k: 'F', nf: 2600, nq: .8, g: .45, d: .09 },
    Y: { k: 'Y' }, C: { k: 'A' },
    p: { k: 'S', nf: 900, nq: .8 }, t: { k: 'S', nf: 4500, nq: 1 }, k: { k: 'S', nf: 2000, nq: 1 },
    b: { k: 'D', f: [220, 800, 2200] }, d: { k: 'D', f: [220, 1700, 2600] }, g: { k: 'D', f: [220, 1300, 2300] }
  };
  const WEAK_WORDS = new Set(['de', 'la', 'el', 'lo', 'los', 'las', 'que', 'y', 'a', 'en', 'un', 'se', 'me', 'te', 'su', 'mi', 'tu', 'con', 'por', 'al', 'del', 'o', 'si', 'le', 'les', 'nos', 'es']);
  function g2p(w) {
    const out = []; out.stressAt = -1; const isE = x => !!x && 'eiéí'.includes(x);
    for (let i = 0; i < w.length; i++) {
      const ch = w[i], nx = w[i + 1] || '', nn = w[i + 2] || '', pv = w[i - 1] || ''; const add = c => out.push({ c }); const ac = 'áéíóú'.indexOf(ch);
      if (ac >= 0) { add('aeiou'[ac]); out.stressAt = out.length - 1; }
      else if ('aeiou'.includes(ch)) add(ch);
      else if (ch === 'ü') add('u');
      else if (ch === 'q') { add('k'); if (nx === 'u') i++; }
      else if (ch === 'c') { if (nx === 'h') { add('C'); i++; } else add(isE(nx) ? 's' : 'k'); }
      else if (ch === 'g') { if (isE(nx)) add('x'); else if (nx === 'u' && isE(nn)) { add('g'); i++; } else add('g'); }
      else if (ch === 'l') { if (nx === 'l') { add('Y'); i++; } else add('l'); }
      else if (ch === 'r') { if (nx === 'r') { add('R'); i++; } else add(i === 0 || (pv && 'nls'.includes(pv)) ? 'R' : 'r'); }
      else if (ch === 'j') add('x'); else if (ch === 'z') add('s'); else if (ch === 'v') add('b'); else if (ch === 'w') add('u');
      else if (ch === 'x') { add('k'); add('s'); }
      else if (ch === 'y') add(nx && 'aeiouáéíóú'.includes(nx) ? 'Y' : 'i');
      else if (ch === 'ñ') add('ñ');
      else if ('bdfkmnpst'.includes(ch)) add(ch);
    }
    return out;
  }
  function analyzeWord(w) {
    const lw = w.toLowerCase(), raw = g2p(lw), isV = p => 'aeiou'.includes(p.c); let i = 0;
    while (i < raw.length) {
      if (!isV(raw[i])) { i++; continue; }
      let j = i; while (j < raw.length && isV(raw[j])) j++;
      const run = []; for (let k = i; k < j; k++) run.push(k);
      const strongs = run.filter(k => 'aeo'.includes(raw[k].c) || k === raw.stressAt);
      if (strongs.length) { strongs.forEach(k => raw[k].nuc = true); run.forEach(k => { if (!raw[k].nuc) raw[k].glide = true; }); }
      else run.forEach((k, idx) => { if (idx === run.length - 1) raw[k].nuc = true; else raw[k].glide = true; });
      i = j;
    }
    const nuc = []; raw.forEach((p, k) => { if (p.nuc) nuc.push(k); });
    let st = -1;
    if (nuc.includes(raw.stressAt)) st = raw.stressAt;
    else if (nuc.length === 1) st = WEAK_WORDS.has(lw) ? -1 : nuc[0];
    else if (nuc.length > 1) { const last = lw.replace(/[áéíóú]/g, m => 'aeiou'['áéíóú'.indexOf(m)]).slice(-1); st = 'aeiouns'.includes(last) ? nuc[nuc.length - 2] : nuc[nuc.length - 1]; }
    if (st >= 0) raw[st].stress = true;
    return raw;
  }
  function phFrames(p) {
    const c = p.c, T = PH[c]; const V = (d, f, gv, gn, nf, nq) => ({ d, f, gv, gn: gn || 0, nf: nf || 2200, nq: nq || .6 });
    if (VOW[c]) { const fr = V(p.glide ? .07 : p.stress ? .17 : .12, VOW[c], 1); fr.nuc = !!p.nuc; fr.stress = !!p.stress; return [fr]; }
    const tap = [400, 1400, 2400];
    switch (T.k) {
      case 'N': return [V(.075, T.f, .55)]; case 'L': return [V(.07, T.f, .7)]; case 'T': return [V(.03, tap, .15)];
      case 'R': return [V(.03, tap, .8), V(.02, tap, .1), V(.03, tap, .8), V(.02, tap, .1), V(.03, tap, .8)];
      case 'F': { const fr = V(T.d, null, 0, T.g, T.nf, T.nq); if (c === 's') fr.sib = 1; return [fr]; }
      case 'Y': return [V(.07, VOW.i, .7, .08, 3000, .8)];
      case 'A': return [V(.04, null, 0, 0), V(.09, null, 0, .45, 3200, .8)];
      case 'S': return [V(.05, null, 0, 0), V(.015, null, 0, .55, T.nf, T.nq), V(.02, null, 0, .15, 2000, .6)];
      case 'D': return [V(.06, T.f, .4, .05, 3000, .8)];
    }
    return [];
  }
  function syllabify(text) {
    const phon = []; (text.match(/[\p{L}]+/gu) || []).forEach(w => analyzeWord(w).forEach(p => phon.push(p)));
    const sy = [], isV = p => 'aeiou'.includes(p.c), okOn = (a, b) => 'pbtdkgf'.includes(a.c) && 'lr'.includes(b.c); let buf = [];
    phon.forEach(p => {
      if (!p.nuc) { buf.push(p); return; }
      const post = [], pre = [];
      while (sy.length && buf.length && isV(buf[0])) post.push(buf.shift());
      while (buf.length && isV(buf[buf.length - 1])) pre.unshift(buf.pop());
      if (sy.length) { const last = sy[sy.length - 1]; last.co.push(...post); let on = [];
        if (buf.length === 1) on = buf.splice(0); else if (buf.length >= 2) on = okOn(buf[buf.length - 2], buf[buf.length - 1]) ? buf.splice(buf.length - 2) : buf.splice(buf.length - 1);
        last.co.push(...buf); sy.push({ on: [...on, ...pre], nuc: p, co: [] });
      } else sy.push({ on: [...buf, ...pre], nuc: p, co: [] });
      buf = [];
    });
    if (sy.length) sy[sy.length - 1].co.push(...buf);
    return sy;
  }

  /* ---------- separación ortográfica en sílabas (para repartir una letra sobre las notas) ---------- */
  function orthoSyllables(word) {
    const w = String(word), L = w.toLowerCase(), V = 'aeiouáéíóúü', STRONG = 'aeoáéó', units = [];
    for (let i = 0; i < w.length; i++) {
      const c = L[i], n = L[i + 1] || '';
      if ((c === 'c' && n === 'h') || (c === 'l' && n === 'l') || (c === 'r' && n === 'r')) { units.push({ v: false, s: w.substr(i, 2), l: L.substr(i, 2) }); i++; }
      else if (c === 'q' && n === 'u') { units.push({ v: false, s: w.substr(i, 2), l: 'qu' }); i++; }
      else if (c === 'g' && n === 'u' && 'eiéí'.includes(L[i + 2] || '')) { units.push({ v: false, s: w.substr(i, 2), l: 'gu' }); i++; }
      else if (c === 'y') units.push({ v: !(L[i + 1] && V.includes(L[i + 1])), s: w[i], l: 'y' });
      else units.push({ v: V.includes(c), s: w[i], l: c });
    }
    const nuclei = []; let i = 0;
    while (i < units.length) {
      if (!units[i].v) { i++; continue; }
      let cur = [units[i]]; i++;
      while (i < units.length && units[i].v) {
        const a = cur[cur.length - 1].l, b = units[i].l, hiatus = (STRONG.includes(a) && STRONG.includes(b)) || 'íú'.includes(a) || 'íú'.includes(b) || a === b;
        if (hiatus) { nuclei.push({ u: cur }); cur = [units[i]]; } else cur.push(units[i]); i++;
      }
      nuclei.push({ u: cur, end: i });
    }
    if (nuclei.length <= 1) return [w];
    // posición de cada núcleo dentro de units
    let pos = 0; const idx = []; for (const nu of nuclei) { while (units[pos] !== nu.u[0]) pos++; idx.push([pos, pos + nu.u.length]); pos += nu.u.length; }
    const CL = ['pl', 'pr', 'bl', 'br', 'fl', 'fr', 'gl', 'gr', 'cl', 'cr', 'tr', 'dr', 'kr', 'kl'], cut = [0];
    for (let k = 0; k < nuclei.length - 1; k++) {
      const a = idx[k][1], b = idx[k + 1][0], cons = units.slice(a, b).map(x => x.l), n = cons.length; let at = a;   // dónde cortar
      if (n === 0) at = a;
      else if (n === 1) at = a;
      else if (n === 2) at = CL.includes(cons.join('')) ? a : a + 1;
      else if (n === 3) at = CL.includes(cons.slice(1).join('')) ? a + 1 : a + 2;
      else at = a + 2;
      cut.push(at);
    }
    cut.push(units.length); const out = [];
    for (let k = 0; k < cut.length - 1; k++) out.push(units.slice(cut[k], cut[k + 1]).map(x => x.s).join(''));
    return out.filter(Boolean);
  }
  const syllables = text => (String(text || '').match(/[\p{L}]+/gu) || []).flatMap(orthoSyllables);

  /* ---------- identidad vocal (ADN) ---------- */
  function hashDNA(name) { const s = String(name || 'AMI').normalize('NFKC').trim().toLowerCase(); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function dnaProfile(seed) { const R = mulberry32(seed >>> 0); return { pitch: (R() - .5) * 2, form: [(R() - .5) * 2, (R() - .5) * 2, (R() - .5) * 2], brightness: (R() - .5) * 2, rough: (R() - .5) * 2, nasal: (R() - .5) * 2, breath: (R() - .5) * 2 }; }
  const dnaDepth = vp => clamp(vp.timbre == null ? .7 : vp.timbre, 0, 1);
  const formScale = (vp, dp) => .88 * Math.pow(1.22 / .88, vp.gen) * Math.pow(2, vp.form / 12) * Math.pow(2, dp.form[0] * dnaDepth(vp) * 1.8 / 12);

  /* ---------- plan de una nota: las sílabas del texto repartidas en su duración ---------- */
  function notePlan(text, vp, wl, f0, mood) {
    const sy = syllabify(text), n = sy.length; if (!n) return null;
    const w = sy.map((s, k) => (s.nuc.stress ? 1.3 : 1) * (k === n - 1 ? 1.6 : 1)), W = w.reduce((a, b) => a + b, 0), U = wl * .94;
    const slot = w.map(x => U * x / W), ts = []; let acc = 0; slot.forEach(d => { ts.push(acc); acc += d; });
    const frames = [], seed = vp.dnaSeed || 0, micro = (vp.micro == null ? .24 : vp.micro) * (1 - mood.fatigue * .35) * .5;
    const fk = k => f0 * Math.pow(2, micro * Math.sin((k + 1) * 1.618 + seed * 1e-6) / 12);
    const sum = a => a.reduce((x, f) => x + f.d, 0) / vp.vel;
    const onF = sy.map(s => s.on.flatMap(phFrames)), coF = sy.map(s => s.co.flatMap(phFrames));
    const place = (arr, k, t0, sc) => { let t = t0; arr.forEach(f => { f.t = t; f.d = f.d / vp.vel * sc; f.f0 = fk(k); frames.push(f); t += f.d; }); return t; };
    const o0 = sum(onF[0]), sc0 = o0 > 0 ? Math.min(1, .5 * slot[0] / o0) : 1;
    place(onF[0], 0, ts[0] - o0 * sc0, sc0);
    for (let k = 0; k < n; k++) {
      const tail = sum(coF[k]) + (k + 1 < n ? sum(onF[k + 1]) : 0), bf = tail > .55 * slot[k] ? .55 * slot[k] / tail : 1, tk = tail * bf, nf = phFrames(sy[k].nuc)[0];
      nf.t = ts[k]; nf.d = Math.max(.05, slot[k] - tk); nf.f0 = fk(k); frames.push(nf);
      const t = place(coF[k], k, ts[k] + slot[k] - tk, bf); if (k + 1 < n) place(onF[k + 1], k + 1, t, bf);
    }
    let t0 = 0; for (const f of frames) t0 = Math.min(t0, f.t); const pre = -t0; for (const f of frames) f.t += pre;
    return { frames, pre, end: pre + ts[n - 1] + slot[n - 1] };
  }

  /* ---------- síntesis ---------- */
  const TABLES = new Map(), NT = 2048;
  function glotTable(vp, dp, K) {
    const depth = dnaDepth(vp), key = (vp.dnaSeed || 0) + '|' + depth.toFixed(3) + '|' + K; let tab = TABLES.get(key); if (tab) return tab;
    const n = 40, re = new Float32Array(n + 1), im = new Float32Array(n + 1), R = mulberry32((vp.dnaSeed || 0) >>> 0);
    const tilt = 1.05 + dp.brightness * depth * .72, odd = 1 + dp.rough * depth * .48;
    for (let k = 1; k <= n; k++) {
      const harmonic = 1 / Math.pow(k, Math.max(.45, 1.3 - dp.brightness * depth * .55)), texture = 1 + (R() - .5) * (.08 + depth * .42) + (k % 2 ? (odd - 1) : (1 - odd) * .55);
      im[k] = harmonic * texture * (1 + (tilt - 1) * Math.min(1, k / 12)); re[k] = harmonic * dp.nasal * depth * .08 * (R() - .5);
    }
    const build = kmax => { const t = new Float32Array(NT); for (let k = 1; k <= kmax; k++) { const a = re[k], b = im[k], w = 2 * Math.PI * k / NT; for (let i = 0; i < NT; i++) t[i] += a * Math.cos(w * i) + b * Math.sin(w * i); } return t; };
    const full = build(n); let pk = 0; for (let i = 0; i < NT; i++) pk = Math.max(pk, Math.abs(full[i])); const sc = pk > 0 ? 1 / pk : 1;
    tab = K >= n ? full : build(K); for (let i = 0; i < NT; i++) tab[i] *= sc; TABLES.set(key, tab); if (TABLES.size > 64) TABLES.delete(TABLES.keys().next().value); return tab;
  }
  class Ramp {
    constructor(v0) { this.h = v0; this.v0 = v0; this.s = []; this.i = 0; }
    to(v, t, len, d) { this.s.push({ t0: t, v0: this.h, t1: t + Math.max(.002, Math.min(len, d)), v1: v }); this.h = v; }
    at(t) { const s = this.s; if (!s.length || t < s[0].t0) return this.v0; while (this.i < s.length - 1 && t >= s[this.i + 1].t0) this.i++; const g = s[this.i]; return t >= g.t1 ? g.v1 : g.v0 + (g.v1 - g.v0) * (t - g.t0) / (g.t1 - g.t0); }
  }
  const BQ = () => ({ b0: 0, b1: 0, b2: 0, a1: 0, a2: 0, z1: 0, z2: 0 });
  function bandpass(q, f, Q, sr) { f = clamp(f, 10, sr * .49); const w = 2 * Math.PI * f / sr, al = Math.sin(w) / (2 * Math.max(.01, Q)), a0 = 1 + al; q.b0 = al / a0; q.b1 = 0; q.b2 = -al / a0; q.a1 = -2 * Math.cos(w) / a0; q.a2 = (1 - al) / a0; }
  function lowpass(q, f, Qdb, sr) { f = clamp(f, 10, sr * .49); const Q = Math.pow(10, Qdb / 20), w = 2 * Math.PI * f / sr, c = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al; q.b0 = (1 - c) / 2 / a0; q.b1 = (1 - c) / a0; q.b2 = q.b0; q.a1 = -2 * c / a0; q.a2 = (1 - al) / a0; }
  const run = (q, x) => { const y = q.b0 * x + q.z1; q.z1 = q.b1 * x - q.a1 * y + q.z2; q.z2 = q.b2 * x - q.a2 * y; return y; };
  const sibMap = x => { x = clamp(x == null ? .3 : x, 0, 1); return { g: Math.pow(10, -1.1 * (1 - Math.pow(x, .8))), fc: 4300 + 2200 * x, q: .9 + .3 * x, lp: 5800 + 12200 * Math.pow(x, 2.5), att: .04 - .03 * x, rel: .06 - .05 * x }; };
  const CHOIR = [{ off: 0, dt: 0, fm: 1, g: 1, tl: 0 }, { off: -12, dt: -6, fm: .93, g: .6, tl: .012 }, { off: 12, dt: 7, fm: 1.1, g: .4, tl: .02 }, { off: 0, dt: 12, fm: 1.03, g: .55, tl: .03 }];

  // una voz del coro: devuelve el generador de muestras (t local en segundos) y deja los controles programados
  function makeVoice(frames, vp, dp, mood, vi, f0Contour, sr, plan) {
    const V = Object.assign({}, CHOIR[vi]); if (vi > 0 && vp['coro' + (vi + 1)] != null) V.off = +vp['coro' + (vi + 1)];
    const depth = dnaDepth(vp), fs = formScale(vp, dp) * V.fm, dR = mulberry32(((vp.dnaSeed || 0) ^ (0x45d9f3b + vi)) >>> 0);
    const dForm = [0, 1, 2].map((_, j) => (1 + dp.form[j] * depth * [.13, .17, .21][j]) * (.985 + dR() * .03));
    const list = frames.slice().sort((a, b) => a.t - b.t);
    const R = { osc: new Ramp(150), vg: new Ramp(0), ng: new Ramp(0), nbf: new Ramp(2500), nbq: new Ramp(.6), nlpf: new Ramp(18000), bp: [new Ramp(500), new Ramp(500), new Ramp(500)] };
    const aire = (vp.aire == null ? .08 : vp.aire) * (1 + mood.fatigue * .8);
    list.forEach((f, i) => {
      const t = Math.max(0, f.t + V.tl), end = t + f.d, nx = list[i + 1];
      if (f.f0) R.osc.to(f.f0 * Math.pow(2, V.off / 12), t, .06, f.d);
      if (f.f) f.f.forEach((x, j) => { const nasal = j === 0 ? dp.nasal * depth * .13 : 0; R.bp[j].to(Math.min(x * fs * dForm[j] * (1 + nasal), sr * .45), t, .03, f.d); });
      R.vg.to((f.gv || 0) * (1 + mood.energy * .10 - mood.fatigue * .18), t, .02, f.d);
      const sb0 = f.sib ? sibMap(vp.sib) : null, sb = sb0 ? Object.assign({}, sb0, { g: sb0.g * (1 + dp.rough * depth * .32), fc: sb0.fc * (1 + dp.brightness * depth * .24), lp: sb0.lp * (1 + dp.brightness * depth * .18) }) : null;
      const att = sb ? Math.min(sb.att, f.d * .45) : .01, rel = sb ? Math.min(sb.rel, f.d * .5) : 0;
      R.ng.to((((f.gn || 0) * (sb ? sb.g : 1) * (vp.ruido == null ? .62 : vp.ruido) * (1 + dp.rough * depth * .28)) + (f.gv || 0) * aire * .12 * (1 + dp.breath * depth * .45)) * 1.45, t, att, f.d);
      R.nbf.to(sb ? sb.fc : (f.nf || 2500), t, .01, f.d); R.nbq.to(sb ? sb.q : (f.nq || .6), t, .01, f.d); R.nlpf.to(sb ? sb.lp : 18000, t, .01, f.d);
      if (sb && rel > .004 && (!nx || nx.t + V.tl <= end + .004)) R.ng.to(0, end - rel, rel, rel);
      if (!nx || nx.t + V.tl > end + .004) { R.vg.to(0, end, .02, .02); R.ng.to(0, end, .01, .01); }
    });
    // generador
    const f0max = Math.max(60, ...list.map(f => f.f0 || 0)) * Math.pow(2, (V.off + 40) / 12) * 1.08, Kh = clamp(Math.floor(sr * .46 / f0max), 4, 40);
    const tab = glotTable(vp, dp, Kh), drive = 1 + clamp(vp.asp + (mood.energy - .5) * .2, 0, 1) * 3.2, nd = 1 / Math.tanh(drive);
    const bps = [0, 1, 2].map(() => BQ()), nb = BQ(), nlp = BQ(), Qs = [5, 7, 9], gs = [1, .7, .4];
    const rnd = mulberry32(((vp.dnaSeed || 0) ^ (vi * 7919 + 13)) >>> 0);
    const vibD = Math.max(0, vp.vib * 45 * (1 + (mood.energy - .5) * .4 - mood.fatigue * .5)), lfoR = 5.2 + vi * .4, level = clamp(.9 + mood.energy * .2 - mood.fatigue * .22, .55, 1.25), outG = V.g * 1.65 * level * .24;
    const water = clamp(vp.agua || 0, 0, 1); let wBuf = null, wPos = 0, wD = 0, wlp = null, fb = 0, wg = 0, dryW = 1;
    if (water > .001) { wD = Math.max(2, Math.round((.12 + water * .24) * sr)); wBuf = new Float32Array(wD); wlp = BQ(); lowpass(wlp, 18000 - water * 16600, .72 + water * .55, sr); fb = .08 + water * .34; wg = water * .72; dryW = 1 - water * .28; }
    let phase = 0, k = 0, fNow = 150, vgNow = 0, ngNow = 0;
    return t => {
      if ((k++ & 7) === 0) {
        const f0 = R.osc.at(t), cents = V.dt + Math.sin(2 * Math.PI * lfoR * t) * vibD; fNow = f0 * Math.pow(2, f0Contour(t) / 12 + cents / 1200);
        for (let j = 0; j < 3; j++) bandpass(bps[j], R.bp[j].at(t), Qs[j], sr);
        bandpass(nb, R.nbf.at(t), R.nbq.at(t), sr); lowpass(nlp, R.nlpf.at(t), .6, sr); vgNow = R.vg.at(t); ngNow = R.ng.at(t);
      }
      phase += fNow / sr; phase -= Math.floor(phase); const x = phase * NT, i0 = x | 0, fr = x - i0, w0 = tab[i0], w1 = tab[(i0 + 1) & (NT - 1)];
      const osc = w0 + (w1 - w0) * fr, v = Math.tanh(osc * drive) * nd * vgNow;
      let s = 0; for (let j = 0; j < 3; j++) s += run(bps[j], v) * gs[j];
      s += run(nlp, run(nb, rnd() * 2 - 1)) * ngNow; s *= .24;
      let o = s;
      if (wBuf) { const d = wBuf[wPos]; wBuf[wPos] = run(wlp, s) + fb * d; wPos = (wPos + 1) % wD; o = s * dryW + d * wg; }
      return o * V.g * 1.65 * level;
    };
  }

  const PRESETS = {
    'Robot': { gen: .5, tono: 0, form: -1, vel: 1, asp: .2, aire: .08, ruido: .62, vib: 0, micro: .24, timbre: .72, agua: 0, coro: 1, coro2: -12, coro3: 12, coro4: 0, sib: .3 },
    'Neutra': { gen: .5, tono: 0, form: 0, vel: 1, asp: .12, aire: .12, ruido: .62, vib: .15, micro: .42, timbre: .35, agua: 0, coro: 1, coro2: -12, coro3: 12, coro4: 0, sib: .3 },
    'Grave': { gen: .05, tono: -2, form: -1.5, vel: .95, asp: .18, aire: .16, ruido: .68, vib: .1, micro: .32, timbre: .55, agua: 0, coro: 1, coro2: -12, coro3: 12, coro4: 0, sib: .25 },
    'Aguda': { gen: .95, tono: 2, form: 1, vel: 1.05, asp: .1, aire: .08, ruido: .62, vib: .2, micro: .42, timbre: .45, agua: 0, coro: 1, coro2: -12, coro3: 12, coro4: 0, sib: .35 },
    'Hueca': { gen: .4, tono: -1, form: -3, vel: .9, asp: .32, aire: .28, ruido: .72, vib: .5, micro: .58, timbre: .8, agua: .18, coro: 2, coro2: -12, coro3: 12, coro4: 0, sib: .25 },
    // Rapero de barrio cansado de la vida: nada lo sorprende (pero algo sí, a medias). Energía, Sorpresa y Cansancio van aquí como valor general; por nota se siguen pudiendo editar.
    'El Brayan': { energia: 0, sorpresa: 50, cansancio: 100, gain: .84, gen: .79, tono: 2, form: -.5, vel: 1.05, legato: .15, asp: .15, aire: .08, ruido: .17, vib: .27, micro: .33, timbre: .59, sib: .15, agua: .56, coro: 1, coro2: 5, coro3: -5, coro4: -2, adn: 'AMI' }
  };
  const N = PRESETS.Neutra;
  return {
    id: 'voz', name: 'Voz cantada (Autómata)', kind: 'melodic', lyrics: true, noteParams: ['energia', 'sorpresa', 'cansancio'], presets: PRESETS, syllables,
    desc: 'Sintetizador de formantes en español. Escribe una sílaba o palabra sobre cada nota (doble toque, mantener pulsada o Intro; Espacio salta a la siguiente nota) y la voz la canta con el tono de la nota. Energía, Sorpresa y Cansancio se cambian nota por nota. El legato une las notas pegadas deslizando el tono.',
    params: [
      { k: 'energia', label: 'Energía', min: 0, max: 100, step: 1, def: 50 }, { k: 'sorpresa', label: 'Sorpresa', min: 0, max: 100, step: 1, def: 0 }, { k: 'cansancio', label: 'Cansancio', min: 0, max: 100, step: 1, def: 0 },
      { k: 'gain', label: 'Ganancia', min: 0, max: 2, step: .01, def: 1 },
      { k: 'gen', label: 'Género (0 masc · 1 fem)', min: 0, max: 1, step: .01, def: N.gen }, { k: 'tono', label: 'Tono (st)', min: -12, max: 12, step: 1, def: N.tono },
      { k: 'form', label: 'Formantes (st)', min: -6, max: 6, step: .5, def: N.form }, { k: 'vel', label: 'Velocidad de dicción', min: .6, max: 1.6, step: .05, def: N.vel }, { k: 'legato', label: 'Legato (enlace entre notas)', min: 0, max: 1, step: .05, def: .8 },
      { k: 'asp', label: 'Saturación', min: 0, max: 1, step: .01, def: N.asp }, { k: 'aire', label: 'Aire / respiración', min: 0, max: 1, step: .01, def: N.aire },
      { k: 'ruido', label: 'Ruido fonético', min: 0, max: 1, step: .01, def: N.ruido }, { k: 'vib', label: 'Vibrato', min: 0, max: 1, step: .01, def: N.vib },
      { k: 'micro', label: 'Microvariación', min: 0, max: 1, step: .01, def: N.micro }, { k: 'timbre', label: 'Timbre / carácter del ADN', min: 0, max: 1, step: .01, def: N.timbre },
      { k: 'sib', label: 'Sibilancia', min: 0, max: 1, step: .01, def: N.sib }, { k: 'agua', label: 'Bajo el agua · eco', min: 0, max: 1, step: .01, def: N.agua },
      { k: 'coro', label: 'Coro (voces)', min: 1, max: 4, step: 1, def: 1 }, { k: 'coro2', label: 'Voz 2 · tono (st)', min: -24, max: 24, step: .5, def: -12 },
      { k: 'coro3', label: 'Voz 3 · tono (st)', min: -24, max: 24, step: .5, def: 12 }, { k: 'coro4', label: 'Voz 4 · tono (st)', min: -24, max: 24, step: .5, def: 0 },
      { k: 'adn', label: 'Nombre / ADN de la voz', type: 'text', def: 'AMI' }
    ],
    play(K, n) {
      const p = n.p, sr = n.sr, text = (n.note && n.note.w) || 'a', name = (p.adn == null || String(p.adn).trim() === '') ? 'AMI' : String(p.adn);
      const vp = { gen: p.gen, tono: p.tono, form: p.form, vel: p.vel, asp: p.asp, aire: p.aire, ruido: p.ruido, vib: p.vib, micro: p.micro, timbre: p.timbre, sib: p.sib, agua: p.agua, coro: p.coro, coro2: p.coro2, coro3: p.coro3, coro4: p.coro4, dnaName: name, dnaSeed: hashDNA(name) };
      const mood = { energy: clamp(p.energia / 100, 0, 1), surprise: clamp(p.sorpresa / 100, 0, 1), fatigue: clamp(p.cansancio / 100, 0, 1) };
      const f0 = n.hz * Math.pow(2, vp.tono / 12), plan = notePlan(text, vp, n.len, f0, mood); if (!plan) return;
      // legato: si la nota vecina está pegada (hueco ≤ 120 ms) el tono se desliza desde la anterior y la vocal se alarga un poco para fundirse con la siguiente
      const lk = n.link, lg = clamp(p.legato == null ? .8 : p.legato, 0, 1), jp = !!(lk && lg > 0 && lk.prevGap != null && lk.prevGap <= .12), jn = !!(lk && lg > 0 && lk.nextGap != null && lk.nextGap <= .12);
      if (jn) { let last = null; for (const f of plan.frames) if (!last || f.t + f.d > last.t + last.d) last = f; if (last) last.d += .012 + .05 * lg; }
      const dm = jp ? n.midi - lk.prevMidi : 0, gt = Math.max(.02, Math.min(.03 + .13 * lg, .45 * n.len));
      const dp = dnaProfile(vp.dnaSeed), nv = clamp(Math.round(vp.coro), 1, 4), t0 = n.t - plan.pre, shift = t0 < 0 ? -t0 : 0, tailW = vp.agua > .001 ? Math.min(3.5, (.12 + vp.agua * .24) * 7 + .4) : 0;
      const sur = mood.surprise, fat = mood.fatigue, sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x), pre = plan.pre, len = n.len;
      const contour = t => { const tn = t - pre, u = clamp(tn / len, 0, 1); return -fat * .5 * u + (tn >= 0 && !jp ? -sur * 1.8 * Math.exp(-tn / .09) : 0) + (jn ? 0 : sur * 2.4 * sm((u - .55) / .45)) - (jp ? dm * (1 - sm(tn / gt)) : 0); };
      const voices = []; for (let v = 0; v < nv; v++) voices.push(makeVoice(plan.frames, vp, dp, mood, v, contour, sr, plan));
      const L = plan.end + .5 + tailW + .1; let tt = 0;
      K.add(n.buf, Math.max(0, t0), L, t => { const tl = t + shift; let s = 0; for (let v = 0; v < voices.length; v++) s += voices[v](tl); return s; }, n.a * p.gain * 1.4, n.pan);
    }
  };
})());
