// Se ejecuta dentro del estudio (tiene fixTrack, INSTRUMENTS, uid…). Devuelve el proyecto.
(() => {
const BAR0 = i => i <= 28 ? 4 * i : i <= 44 ? 112 + 3.5 * (i - 28) : 168 + 4 * (i - 44);
const BL = i => (i >= 28 && i < 44) ? 3.5 : 4;
const CH = { Am: { r: 45, t: [57, 60, 64] }, F: { r: 41, t: [57, 60, 65] }, C: { r: 48, t: [55, 60, 64] }, G: { r: 43, t: [55, 59, 62] }, Dm: { r: 38, t: [57, 62, 65] }, E: { r: 40, t: [56, 59, 64] } };
const prog = i => CH[i < 28 ? ['Am','F','C','G'][i % 4] : i < 44 ? ['Am','F','Dm','E'][(i - 28) % 4] : i < 68 ? ['Am','F','C','G'][(i - 44) % 4] : ['F','C','G','Am','F','C','E','Am'][i - 68]];
const BARS = 76, range = (a, b) => Array.from({ length: b - a }, (_, k) => a + k);
const IVa = range(44, 56), IVb = range(60, 68), IV = [...IVa, ...IVb];
const T = [];
const mk = (id, name, inst, params, o = {}) => { const t = { id, name, inst, params: params || {}, vol: o.vol ?? 1, pan: o.pan ?? 0, mute: false, solo: false, ducked: !!o.ducked, sc: !!o.sc, notes: [] }; if (o.fx) t.fx = o.fx; if (o.auto) t.auto = o.auto; T.push(t); return t; };
const N = (t, b, l, m, v = 1, o) => { const n = { b: +b.toFixed(5), l, m, v }; if (o) n.o = o; t.notes.push(n); return n; };
const fx = (d, r) => { const f = {}; if (d) f.delay = Object.assign({ on: true, time: .75, fb: .4, tone: 4500, mix: .3, pp: true }, d); if (r) f.reverb = Object.assign({ on: true, size: .65, damp: .5, mix: .25, pre: 12 }, r); return f; };

// ── pistas ──
const kick = mk('kick', 'Bombo', 'kick', {}, { vol: .8, sc: true });
const snare = mk('snare', 'Caja', 'snare', {}, { vol: .8, fx: fx(null, { size: .35, mix: .18, damp: .6 }) });
const clap = mk('clap', 'Palma', 'clap', {}, { vol: .7, fx: fx(null, { size: .4, mix: .2 }) });
const hat = mk('hat', 'Hi-hat', 'hat', {}, { vol: .8, pan: .15 });
const fxT = mk('fxr', 'Riser', 'riser', {}, { vol: .8 });
const swp = mk('swp', 'Barrido', 'sweep', {}, { vol: .7 });
const imp = mk('imp', 'Impacto', 'impact', {}, { vol: .85 });
const crs = mk('crs', 'Crash', 'crash', {}, { vol: .6 });
const pad = mk('pad', 'Pad', 'pad', { gain: .15 }, { vol: 1, ducked: true, fx: fx(null, { size: .85, damp: .45, mix: .38, pre: 25 }), auto: { cut: [{ b: 0, v: .4 }, { b: 36, v: .65 }, { b: 80, v: 1 }], vol: [{ b: 0, v: .8 }, { b: 40, v: 1 }, { b: 276, v: 1 }, { b: 296, v: .25 }] } });
const sub = mk('sub', 'Sub', 'sub', {}, { vol: .85, ducked: true });
const rees = mk('rees', 'Bajo Reese', 'reese', { gain: .38 }, { vol: .62, ducked: true, auto: { 'p:hi': [{ b: BAR0(44), v: 500 }, { b: BAR0(55), v: 4200 }, { b: BAR0(56), v: 300 }, { b: BAR0(60), v: 5800 }, { b: BAR0(68), v: 1200 }] } });
const plk = mk('plk', 'Arpegio', 'pluck', { gain: .1 }, { vol: .8, ducked: true, pan: 0, fx: fx({ time: .75, fb: .35, mix: .22 }, { size: .5, mix: .15 }), auto: { 'p:lp': [{ b: 32, v: 700 }, { b: 80, v: 1800 }, { b: 112, v: 5500 }, { b: 168, v: 2400 }, { b: 228, v: 9000 }, { b: 264, v: 900 }], pan: [] } });
for (let b = 32; b <= 260; b += 8) plk.auto.pan.push({ b, v: (b / 8) % 2 ? .5 : -.5 });
const bell = mk('bell', 'Campana', 'bell', { gain: .14 }, { vol: 1.1, fx: fx({ time: .75, fb: .45, mix: .35 }, { size: .75, mix: .3 }) });
const lead = mk('lead', 'Lead Cristal', 'cristalfm', {}, { vol: .7, ducked: true, fx: fx({ time: 1.5, fb: .4, mix: .25 }, { size: .6, mix: .22 }), auto: { 'p:index': [{ b: 112, v: 1.5 }, { b: 168, v: 3.5 }, { b: 228, v: 6 }, { b: 264, v: 1.2 }] } });
const voz = mk('voz', 'Voz', 'voz', { coro: 2, agua: .12 }, { vol: 1.25, fx: fx(null, { size: .8, damp: .4, mix: .34, pre: 30 }) });

// ── movimientos ──
// I (compases 0-19) · 4/4 · 84 BPM: intro, campana, arpegio y la voz
for (const i of range(0, 76)) { const c = prog(i), b0 = BAR0(i), L = BL(i); if (i === 75) { for (const m of c.t) N(pad, b0, 4, m, .9); } else for (const m of c.t) N(pad, b0, L, m, .9); }
for (const i of [...range(4, 20), ...range(68, 76)]) { const c = prog(i), b0 = BAR0(i); N(bell, b0, 1, c.t[2] + 12, .8); N(bell, b0 + 2.5, 1, c.t[1] + 24, .65); if (i % 2) N(bell, b0 + 1.5, .75, c.t[0] + 24, .55); }
for (const i of range(8, 20)) { const c = prog(i), b0 = BAR0(i), pool = [c.t[0], c.t[1], c.t[2], c.t[0] + 12], P8 = [0, 1, 2, 3, 2, 1, 2, 3]; for (let k = 0; k < 8; k++) N(plk, b0 + k * .5, .4, pool[P8[k]], k % 2 ? .6 : .8); }
// voz: 4 versos
const SYL = INSTRUMENTS.voz.syllables;
const verse = (text, start, durs, pitches, esc) => { const w = SYL(text); if (w.length !== durs.length || w.length !== pitches.length) throw new Error('verso «' + text + '»: ' + w.length + ' sílabas, ' + durs.length + ' duraciones'); let b = start; w.forEach((s, k) => { const n = N(voz, b, durs[k], pitches[k], 1, esc ? esc(k, w.length) : undefined); n.w = s; b += durs[k]; }); };
verse('la marea trae ceniza', BAR0(12), [1,1,1,1,1.5,.5,1,1,5], [64,64,62,60,65,64,60,62,64], (k) => ({ energia: 50, sorpresa: 0, cansancio: 0 }));
verse('y la luna aprende a callar', BAR0(16), [.5,1,1,1,1,1.5,.5,1,1,6], [60,62,64,65,64,62,60,62,64,57], (k) => ({ energia: 56, sorpresa: k === 5 ? 75 : k === 2 ? 30 : 0, cansancio: 0 }));
verse('todo vuelve a ser silencio', BAR0(68), [1,1,1.5,.5,1,1,1,1,6], [64,65,67,65,64,62,60,62,57], (k, n) => ({ energia: Math.round(50 - 22 * k / (n - 1)), sorpresa: 0, cansancio: Math.round(10 + 60 * k / (n - 1)) }));
verse('y entonces todo calla', BAR0(72), [1,1,1,1,1,1,2,6], [60,60,62,64,62,60,59,57], (k, n) => ({ energia: Math.round(26 - 10 * k / (n - 1)), sorpresa: 0, cansancio: Math.round(75 + 25 * k / (n - 1)) }));

// II (20-27) · aceleración con rampa de tempo 84 → 112
for (const i of range(16, 20)) { const b0 = BAR0(i); N(kick, b0, .25, 0, .5); N(kick, b0 + 2, .25, 0, .45); }
for (const i of range(18, 20)) for (let k = 0; k < 8; k++) N(hat, BAR0(i) + k * .5, .25, 0, k % 2 ? .4 : .55);
for (const i of range(20, 28)) { const b0 = BAR0(i), c = prog(i); for (let k = 0; k < 4; k++) N(kick, b0 + k, .25, 0, .65 + .35 * (i - 20) / 7);
  if (i < 26) for (let k = 0; k < 8; k++) N(hat, b0 + k * .5, .25, 0, k % 2 ? .45 : .6);
  if (i >= 24) { for (const kk of [1, 3]) if (i < 26) N(clap, b0 + kk, .25, 0, .6); }
  const pool = [c.t[0], c.t[1], c.t[2], c.t[0] + 12], A16 = [0,1,2,3,2,1,2,3,0,1,2,3,3,2,1,2]; for (let k = 0; k < 16; k++) N(plk, b0 + k * .25, .2, pool[A16[k]] + 0, k % 2 ? .6 : .85);
  if (i >= 24) N(sub, b0, 4, c.r - 12, .9); }
for (let k = 0; k < 8; k++) N(snare, BAR0(26) + k * .5, .25, 0, .35 + .35 * k / 7);
for (let k = 0; k < 16; k++) N(snare, BAR0(27) + k * .25, .25, 0, .35 + .6 * k / 15);
N(fxT, BAR0(24), 16, 0, 1); N(swp, BAR0(26), 8, 0, 1);

// III (28-43) · 7/8, agrupado 2+2+3 · 112 BPM
for (const i of range(28, 44)) { const b0 = BAR0(i), c = prog(i), e = k => b0 + k * .5;
  N(kick, e(0), .25, 0, 1); N(kick, e(4), .25, 0, .85); if (i >= 32) N(kick, e(2), .25, 0, .5);
  N(snare, e(2), .25, 0, .8); if (i >= 36) N(clap, e(5), .25, 0, .6); else N(clap, e(5), .25, 0, .4);
  for (let k = 0; k < 7; k++) N(hat, e(k), .25, k === 6 ? 1 : 0, k === 6 ? .6 : [0,2,4].includes(k) ? .7 : .4);
  N(rees, e(0), 1, c.r - 12, 1); N(rees, e(2), 1, c.r - 12, .85); N(rees, e(4), 1.5, c.r - 12 + (i % 2 ? 7 : 0), 1);
  N(sub, b0, 3.5, c.r - 12, .85);
  const pool = [c.t[0], c.t[1], c.t[2], c.t[0] + 12], P7 = [0,1,2,3,2,1,2]; for (let k = 0; k < 7; k++) N(plk, e(k), .4, pool[P7[k]] + 12, [0,2,4].includes(k) ? .9 : .6);
  if (i >= 36) { N(lead, e(0), 1, c.t[2] + 12, .9); N(lead, e(2), 1, c.t[0] + 24, .85); N(lead, e(4), 1.5, c.t[1] + 12, .8); } }
N(crs, BAR0(28), 3.5, 0, 1); N(fxT, BAR0(40), 14, 0, 1); N(swp, BAR0(42), 7, 0, 1);

// IV (44-67) · el golpe: 4/4 · 112 BPM, con respiro en 56-59
const LM = [[[0,76,1.5],[1.5,74,.5],[2,72,1],[3,76,1]],[[0,77,1.5],[1.5,76,.5],[2,72,2]],[[0,79,1.5],[1.5,77,.5],[2,76,1],[3,74,1]],[[0,74,2],[2,71,1],[3,74,1]]];
for (const i of IV) { const b0 = BAR0(i), c = prog(i), full = IVb.includes(i);
  for (let k = 0; k < 4; k++) { N(kick, b0 + k, .25, 0, 1); }
  for (const kk of [1, 3]) N(clap, b0 + kk, .25, 0, .75);
  for (let k = 0; k < 16; k++) N(hat, b0 + k * .25, .25, 0, .35 + (k % 4 === 0 ? .25 : 0) + (k % 4 === 2 ? 0 : 0));
  for (const k of [2, 6, 10, 14]) N(hat, b0 + k * .25 + .0, .25, 1, .55);
  if (!(i === 67)) { for (const [bb, l] of [[0, .5], [1, .5], [1.5, .5], [2.5, .5], [3, .5]]) N(rees, b0 + bb, l, c.r - 12, bb === 0 ? 1 : .85); }
  N(sub, b0, 4, c.r - 12, .9);
  const pool = [c.t[0] + 12, c.t[1] + 12, c.t[2] + 12, c.t[0] + 24], A16 = [0,1,2,3,2,1,2,3,0,1,2,3,3,2,1,2]; for (let k = 0; k < 16; k++) N(plk, b0 + k * .25, .2, pool[A16[k]], k % 2 ? .55 : .8);
  if (i >= 52 || full || i % 4 === 0 || i % 4 === 2 || true) for (const [bb, m, l] of LM[(i - 44) % 4]) N(lead, b0 + bb, l, m, full ? .95 : .8);
  if (i === 67) for (let k = 0; k < 8; k++) N(snare, b0 + 2 + k * .25, .25, 0, .4 + .55 * k / 7); }
N(crs, BAR0(44), 4, 0, 1); N(crs, BAR0(60), 4, 0, 1); N(imp, BAR0(44), 1, 0, 1); N(imp, BAR0(60), 1, 0, 1);
N(fxT, BAR0(56), 16, 0, 1);
for (const i of range(56, 60)) { const c = prog(i); N(bell, BAR0(i) + 1, 1.5, c.t[2] + 24, .7); N(bell, BAR0(i) + 3, 1, c.t[1] + 12, .55); }
// respiro 56-59: reese largo (aquí se hornea el barrido) y la campana
for (const i of range(56, 60)) { const c = prog(i); N(rees, BAR0(i), 4, c.r - 12, 1); N(sub, BAR0(i), 4, c.r - 12, .7); }
// V (68-75) · desaceleración 112 → 68
N(imp, BAR0(68), 1, 0, .8);
return { tracks: T, BARS };
})()
