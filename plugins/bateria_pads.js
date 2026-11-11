// ──🥁 Batería (pads) · plugin de instrumento para Demo Kit ──  v1.2
// Una sola pista de percusión con 16 pads (carriles): cada golpe es una nota de un carril del piano roll, y con el teclado en pantalla
// (⌨ Tocar) los pads quedan en una rejilla para tocar y grabar ritmos al vuelo, sin cambiar de pista.
//   · Cada pad elige su SONIDO de una lista de 28 (bombo, bombo 808, caja, rim, palma, chasquido, tres hi-hats, ride, campana, crash,
//     tres toms, tres congas, bongó, timbal, cencerro, shaker, pandero, claves, woodblock, triángulo) y tiene sus propios ajustes
//     (sección plegable): volumen, tono (semitonos), duración (×), paneo y, según el sonido, ruido, brillo (corte de agudos), ataque, sub y clic. El punto del inspector se apaga cuando un ajuste no aplica.
//   · Los nombres de los carriles y de los pads siguen al sonido elegido.
//   · MIDI: por defecto cada pad responde a una nota consecutiva desde C1 (36), como los pads tipo MPC; con «General MIDI» cada pad responde
//     (y se exporta) con la nota de batería GM de su sonido (36 bombo, 38 caja, 42 hi-hat cerrado…).
// Bombo, caja, palma, chasquido, hi-hat cerrado y abierto y crash usan los sonidos del kit cargado (K.kick, K.snare…), así que cambian con el kit;
// el resto se sintetiza aquí con K.add y K.rnd y funciona con cualquier kit.
// Los proyectos hechos con la v1.0 (12 pads) abren igual: sus ajustes por pad se leen de las claves antiguas.
// Autoría: Ámbar (Claude Sonnet 5.5) con Brujo.
registerInstrument((() => {
  const TWO_PI = 6.283185307179586, clamp = (x, a, b) => x < a ? a : x > b ? b : x, st2 = s => Math.pow(2, s / 12);
  const noiseHP = K => { let p = 0; return () => { const x = K.rnd() * 2 - 1, v = x - p; p = x; return v; }; };
  // síntesis propia con brillo (dos polos pasabajos) y ataque (entrada suave) opcionales
  const addX = (K, n, t, len, fn, a, pan, X) => {
    let g = fn;
    if (X && (X.brillo < .999 || X.ataque > 0)) { const al = 1 - Math.exp(-TWO_PI * 700 * Math.pow(30, X.brillo) / n.sr), at = X.ataque / 1000; let y1 = 0, y2 = 0;
      g = tt => { let v = fn(tt); if (X.brillo < .999) { y1 += al * (v - y1); y2 += al * (y1 - y2); v = y2; } return at > 0 ? v * Math.min(1, tt / at) : v; }; }
    K.add(n.buf, t, len, g, a, pan, X); };
  const ORDER = [], S = {};
  // id, nombre, volumen base, nota GM, ajustes que aplican {tono, dec, pan}, síntesis (K, n, t, a, f=factor de tono, dec=factor de duración, pan)
  const def = (id, name, base, gm, ap, fn) => { S[id] = { id, name, base, gm, ap, fn }; ORDER.push(id); };
  const A = (tono, dec, pan, extra) => Object.assign({ tono, dec, pan }, extra || {});
  const OWN = { brillo: 1, ataque: 1 };           // los sonidos sintetizados aquí aceptan brillo y ataque
  const add = addX;
  const tom = (f0, base, gm, name) => [name, base, gm, A(1, 1, 1), (K, n, t, a, f, dec, pan, X) => { const fr = f0 * f, nz = noiseHP(K); let ph = 0;
    add(K, n, t, .6 * dec, tt => { ph += TWO_PI * fr * (1 + .7 * Math.exp(-tt / .035)) / n.sr; return Math.sin(ph) * Math.exp(-tt * 9 / dec) + nz() * .25 * X.ruido * Math.exp(-tt * 120); }, a, pan, X); }];
  const conga = (f0, dr, lenS, base, gm, name, slap) => [name, base, gm, A(1, 1, 1), (K, n, t, a, f, dec, pan, X) => { const fr = f0 * f, nz = noiseHP(K); let ph = 0;
    add(K, n, t, lenS * dec, tt => { ph += TWO_PI * fr * (1 + .12 * Math.exp(-tt / .018)) / n.sr; return Math.sin(ph) * Math.exp(-tt * dr / dec) * .9 + nz() * X.ruido * (slap ? .6 : .18) * Math.exp(-tt * (slap ? 70 : 150)); }, a, pan, X); }];
  const metal = (fs, dr, lenS, noise, base, gm, name) => [name, base, gm, A(1, 1, 1), (K, n, t, a, f, dec, pan, X) => { const nz = noiseHP(K);
    add(K, n, t, lenS * dec, tt => { let s = 0; for (const [r, w] of fs) s += Math.sin(TWO_PI * r * f * tt) * w; return s * Math.exp(-tt * dr / dec) + nz() * noise * X.ruido * Math.exp(-tt * dr * 1.4 / dec); }, a, pan, X); }];

  const mk = (id, arr) => def(id, arr[0], arr[1], arr[2], arr[3], arr[4]);
  const subLayer = (K, n, t, a, fr, dr, dec, X, base) => { const s = (X.sub || 0) + (base || 0); if (s <= 0) return; let ph = 0; add(K, n, t, 1.2 * dec, tt => { ph += TWO_PI * fr / n.sr; return Math.sin(ph) * Math.min(1, tt * 400) * Math.exp(-tt * dr / dec); }, a * s * .8, 0, null); };
  def('bombo', 'Bombo', 1, 36, A(1, 1, 0), (K, n, t, a, f, dec, pan, X) => { K.kick(t, a, { lo: 50 * f, hi: 140 * f, len: .4 * dec, click: .3 * X.clic }); subLayer(K, n, t, a, 50 * f, 5, dec, X, 0); });
  def('bombo808', 'Bombo 808', .9, 35, A(1, 1, 0), (K, n, t, a, f, dec, pan, X) => { K.kick(t, a, { lo: 38 * f, hi: 110 * f, k: 22, dec: 3.2, len: 1 * dec, click: .3 * X.clic }); subLayer(K, n, t, a, 38 * f, 2.2, dec, X, .35); });
  def('caja', 'Caja', .85, 38, A(1, 1, 0), (K, n, t, a, f, dec, pan, X) => K.snare(t, a, { tone: 200 * f, len: .25 * dec, nd: 20 / clamp(X.ruido, .15, 2.5) }));
  def('rim', 'Rim', .25, 37, A(1, 1, 1), (K, n, t, a, f, dec, pan, X) => { const nz = noiseHP(K), fr = 1750 * f; add(K, n, t, .08 * dec + .03, tt => (Math.sin(TWO_PI * fr * tt) * .7 + nz() * .5 * X.ruido) * Math.exp(-tt * 70 / dec), a, pan, X); });
  def('palma', 'Palma', .5, 39, A(0, 0, 0), (K, n, t, a) => K.clap(t, a));
  def('chasq', 'Chasquido', .2, 85, A(0, 0, 1), (K, n, t, a, f, dec, pan, X) => K.snap(t, a, pan));
  def('hatc', 'Hi-hat cerrado', .1, 42, A(0, 0, 1), (K, n, t, a, f, dec, pan, X) => K.hat(t, a, false, pan));
  def('hatp', 'Hi-hat de pedal', .1, 44, A(0, 1, 1), (K, n, t, a, f, dec, pan, X) => { const nz = noiseHP(K); add(K, n, t, .06 * dec + .02, tt => nz() * X.ruido * Math.exp(-tt * 110 / dec), a * .9, pan); });
  def('hato', 'Hi-hat abierto', .1, 46, A(0, 0, 1), (K, n, t, a, f, dec, pan, X) => K.hat(t, a, true, pan));
  def('ride', 'Ride', .12, 51, A(1, 1, 1), (K, n, t, a, f, dec, pan, X) => { const nz = noiseHP(K), fs = [1, 1.43, 1.77, 2.16, 2.63, 3.34];
    add(K, n, t, 1.6 * dec, tt => { let s = 0; for (const r of fs) s += Math.sin(TWO_PI * 830 * f * r * tt) > 0 ? 1 : -1; return (s / 6 * .55 + nz() * .45 * X.ruido) * (Math.exp(-tt * 3 / dec) * .75 + Math.exp(-tt * 30) * .5); }, a, pan, X); });
  mk('campana', metal([[1180, 1], [1760, .7], [2640, .35]], 7, .6, .12, .22, 53, 'Campana de ride'));
  def('crash', 'Crash', .3, 49, A(1, 1, 1), (K, n, t, a, f, dec, pan, X) => {     // metal inarmónico + ruido (el ruido se controla con «Ruido»)
    const fs = [1, 1.47, 1.83, 2.21, 2.69, 3.11, 3.67, 4.29], b0 = 650 * f, ph = fs.map(() => K.rnd() * TWO_PI); let lp = 0;
    add(K, n, t, 2.8 * dec, tt => { let s = 0; for (let k = 0; k < 8; k++) s += Math.sin(TWO_PI * b0 * fs[k] * tt + ph[k]) * Math.exp(-tt * (1.3 + .35 * k) / dec) / (1 + .12 * k);
      lp += .55 * ((K.rnd() * 2 - 1) - lp); return s * .5 + lp * .3 * X.ruido * (Math.exp(-tt * 2.6 / dec) * .8 + Math.exp(-tt * 45) * .6); }, a * 1.5, pan, X); });
  const hatM = (id, name, open, gm) => def(id, name, .12, gm, A(0, 1, 1), (K, n, t, a, f, dec, pan, X) => { const nz = noiseHP(K), fs = [205.3, 304.4, 369.6, 522.7, 540, 800], dr = open ? 11 : 70; let h1 = 0, h2 = 0;
    add(K, n, t, (open ? .5 : .1) * dec, tt => { let s = 0; for (const r of fs) s += Math.sin(TWO_PI * r * 7.2 * f * tt) > 0 ? 1 : -1; s = s / 6 + nz() * .35 * X.ruido; const y = s - h1; h1 = s; const z = y - h2; h2 = y * .0; return z * Math.exp(-tt * dr / dec) * .7; }, a, pan, X); });
  hatM('hatcm', 'Hi-hat cerrado (metálico)', false, 42); hatM('hatom', 'Hi-hat abierto (metálico)', true, 46);
  mk('tomg', tom(92, .5, 41, 'Tom grave')); mk('tomm', tom(134, .5, 45, 'Tom medio')); mk('toma', tom(190, .5, 48, 'Tom agudo'));
  mk('congag', conga(190, 9, .6, .55, 64, 'Conga grave')); mk('congaa', conga(280, 11, .5, .5, 63, 'Conga aguda')); mk('congas', conga(330, 30, .22, .5, 62, 'Conga seca (slap)', true));
  mk('bongo', conga(420, 16, .3, .45, 60, 'Bongó'));
  mk('timbal', metal([[520, 1], [780, .5], [1100, .25]], 14, .35, .15, .3, 65, 'Timbal'));
  mk('cenc', ['Cencerro', .35, 56, A(1, 1, 1), (K, n, t, a, f, dec, pan, X) => { const f1 = 587 * f, f2 = 845 * f; let lp = 0;
    add(K, n, t, .5 * dec, tt => { const s = (Math.sin(TWO_PI * f1 * tt) > 0 ? 1 : -1) + (Math.sin(TWO_PI * f2 * tt) > 0 ? 1 : -1); lp += .35 * (s - lp); return lp * .5 * (Math.exp(-tt * 14 / dec) * .8 + Math.exp(-tt * 3 / dec) * .2); }, a, pan, X); }]);
  def('shak', 'Shaker', .16, 70, A(0, 1, 1), (K, n, t, a, f, dec, pan, X) => { const nz = noiseHP(K); add(K, n, t, .2 * dec, tt => nz() * X.ruido * Math.min(1, tt / .012) * Math.exp(-tt * 28 / dec), a, pan, X); });
  def('pandero', 'Pandero', .2, 54, A(0, 1, 1), (K, n, t, a, f, dec, pan, X) => { const nz = noiseHP(K), nz2 = noiseHP(K); add(K, n, t, .3 * dec, tt => (nz() * .6 + nz2() * .4) * X.ruido * Math.exp(-tt * 16 / dec) * (1 + .6 * Math.sin(TWO_PI * 95 * tt)) + Math.sin(TWO_PI * 330 * tt) * .25 * Math.exp(-tt * 40), a, pan, X); });
  def('claves', 'Claves', .3, 75, A(1, 1, 1), (K, n, t, a, f, dec, pan, X) => { const fr = 2500 * f; add(K, n, t, .08 * dec + .02, tt => Math.sin(TWO_PI * fr * tt) * Math.exp(-tt * 85 / dec), a, pan, X); });
  def('wood', 'Woodblock', .3, 76, A(1, 1, 1), (K, n, t, a, f, dec, pan, X) => { const f1 = 900 * f, f2 = 1350 * f; add(K, n, t, .15 * dec, tt => (Math.sin(TWO_PI * f1 * tt) + .5 * Math.sin(TWO_PI * f2 * tt)) * Math.exp(-tt * 45 / dec) * .7, a, pan, X); });
  mk('triang', metal([[2900, 1], [7500, .35], [10900, .15]], 4.5, 1.2, 0, .1, 81, 'Triángulo'));

  // ── los 16 pads ──
  // qué ajustes aplican a cada sonido (el puntito del inspector se apaga en los que no)
  const KITS = ['bombo', 'bombo808', 'caja', 'palma', 'chasq', 'hatc', 'hato'];
  ORDER.forEach(id => { const s = S[id]; if (KITS.indexOf(id) < 0) { s.ap.brillo = 1; s.ap.ataque = 1; }
    if (['rim', 'hatp', 'ride', 'campana', 'crash', 'hatcm', 'hatom', 'tomg', 'tomm', 'toma', 'congag', 'congaa', 'congas', 'bongo', 'timbal', 'shak', 'pandero', 'triang', 'caja'].indexOf(id) >= 0) s.ap.ruido = 1;
    if (id === 'bombo' || id === 'bombo808') { s.ap.sub = 1; s.ap.clic = 1; } });
  const NP = 16, DEFSND = ['bombo', 'caja', 'hatc', 'hato', 'palma', 'rim', 'tomg', 'tomm', 'toma', 'crash', 'cenc', 'shak', 'ride', 'congag', 'congaa', 'congas'];
  const OLD = ['bombo', 'caja', 'hatc', 'hato', 'palma', 'rim', 'tomg', 'tomm', 'toma', 'crash', 'cenc', 'shak'];      // claves de la v1.0
  const num = (k, label, min, max, step, def, sec, on, lane) => ({ k, label, min, max, step, def, sec, on, lane });
  const params = [num('gain', 'Volumen general', 0, 2, .01, 1, 'General'),
    { k: 'midiMap', label: 'MIDI: nota de cada pad', type: 'choice', opts: ['Consecutivas desde C1 (pads MPC)', 'General MIDI (según el sonido)'], vals: ['seq', 'gm'], def: 'seq', sec: 'General' }];
  for (let i = 1; i <= NP; i++) {
    const sec = 'Pad ' + i, snd = p => S[(p || {})['p' + i + '_snd'] || DEFSND[i - 1]] || S[DEFSND[i - 1]];
    params.push({ k: 'p' + i + '_snd', label: 'Sonido', type: 'choice', opts: ORDER.map(id => S[id].name), vals: ORDER.slice(), def: DEFSND[i - 1], sec, lane: i - 1 },
      num('p' + i + '_vol', 'Volumen', 0, 1.6, .01, 1, sec, undefined, i - 1), num('p' + i + '_tono', 'Tono (st)', -12, 12, .5, 0, sec, p => !!snd(p).ap.tono, i - 1),
      num('p' + i + '_dec', 'Duración (×)', .3, 3, .01, 1, sec, p => !!snd(p).ap.dec, i - 1), num('p' + i + '_pan', 'Paneo', -1, 1, .01, 0, sec, p => !!snd(p).ap.pan, i - 1),
      num('p' + i + '_ruido', 'Ruido (×)', 0, 2, .01, 1, sec, p => !!snd(p).ap.ruido, i - 1), num('p' + i + '_brillo', 'Brillo (corte de agudos)', 0, 1, .01, 1, sec, p => !!snd(p).ap.brillo, i - 1),
      num('p' + i + '_ataque', 'Ataque (ms)', 0, 60, 1, 0, sec, p => !!snd(p).ap.ataque, i - 1), num('p' + i + '_sub', 'Sub (graves)', 0, 1.5, .01, 0, sec, p => !!snd(p).ap.sub, i - 1),
      num('p' + i + '_clic', 'Clic (ataque)', 0, 2, .01, 1, sec, p => !!snd(p).ap.clic, i - 1));
  }
  const sndOf = (p, i) => S[(p || {})['p' + (i + 1) + '_snd']] || S[DEFSND[i]];
  const presets = {
    'Kit básico': {},
    'Kit lo-fi (seco)': { p1_tono: 1, p1_dec: .8, p2_tono: -2, p2_dec: .7, p2_vol: .8, p3_vol: .7, p4_vol: .7, p10_vol: .5, p6_vol: 1.2, p12_vol: .8, p13_vol: .6 },
    'Kit 808': { p1_snd: 'bombo808', p1_vol: 1.2, p2_tono: 2, p2_dec: 1.1, p7_tono: -4, p7_dec: 1.8, p8_tono: -2, p8_dec: 1.6, p9_dec: 1.4, p11_tono: -2, p11_dec: 1.2, p13_snd: 'chasq', p14_snd: 'palma' },
    'Kit latino': { p1_vol: .8, p2_vol: .6, p6_snd: 'claves', p6_vol: 1.3, p7_snd: 'bongo', p7_tono: -2, p8_snd: 'bongo', p8_tono: 3, p9_snd: 'timbal', p10_snd: 'campana', p11_vol: 1.3, p12_snd: 'pandero', p12_vol: 1.4, p13_snd: 'triang', p13_vol: 1.2, p14_vol: 1.1, p15_vol: 1.1, p16_vol: 1.1 },
    'Kit de rock (ride y toms)': { p5_snd: 'chasq', p5_vol: 0, p6_vol: .8, p7_dec: 1.3, p8_dec: 1.2, p9_dec: 1.1, p10_vol: 1.1, p11_snd: 'hatp', p11_vol: 1.2, p12_snd: 'campana', p13_vol: 1.2, p14_snd: 'tomg', p14_tono: -3, p15_snd: 'tomm', p15_tono: -3, p16_snd: 'toma', p16_tono: -3 },
    'Kit oscuro y denso': { p1_sub: .5, p1_clic: .6, p2_ruido: .7, p3_brillo: .55, p4_brillo: .55, p10_ruido: .35, p10_brillo: .55, p13_brillo: .5, p13_ruido: .6, p5_vol: .8 },
    'Kit orquestal (toms y crash)': { p1_dec: 1.4, p7_dec: 1.8, p8_dec: 1.6, p9_dec: 1.4, p10_dec: 1.6, p10_vol: 1.3, p2_dec: 1.2, p13_dec: 1.3 }
  };
  return {
    id: 'bateria_pads', name: 'Batería (pads)', version: '1.2', kind: 'perc', cat: 'perc', oneShot: true, buf: 'dr', presetReset: true,
    lanes: DEFSND.map(id => ({ name: S[id].name, gm: S[id].gm })),
    laneNames: p => DEFSND.map((d, i) => sndOf(p, i).name),
    midiLane: (note, p) => { if (!p || p.midiMap !== 'gm') return null; for (let i = 0; i < NP; i++) if (sndOf(p, i).gm === note) return i; return null; },
    midiNote: (lane, p) => { const i = clamp(Math.round(lane), 0, NP - 1); if (!p || p.midiMap !== 'gm') return 36 + i; const s = sndOf(p, i); return s ? s.gm : 36 + i; },
    desc: 'Una pista de percusión con 16 pads. Cada pad elige su sonido de una lista de 28 (bombo, caja, hi-hats, ride, toms, congas, bongó, cencerro, pandero, claves…) y tiene sus propios ajustes. Cada golpe es una nota de su carril; con ⌨ Tocar los pads quedan en una rejilla para grabar ritmos al vuelo. Funciona con pads MIDI (consecutivas desde C1, o General MIDI).',
    params, presets,
    play(K, n) {
      const li = Math.round(n.lane); if (!(li >= 0 && li < NP)) return;
      const p = n.p, i = li + 1, s = sndOf(p, li), pre = 'p' + i + '_', old = li < OLD.length ? OLD[li] + '_' : null, defs = { vol: 1, tono: 0, dec: 1, pan: 0, ruido: 1, brillo: 1, ataque: 0, sub: 0, clic: 1 };
      const g = k => { let v = p[pre + k]; if (old && (v == null || +v === defs[k]) && p[old + k] != null) v = p[old + k]; return v == null ? defs[k] : +v; };
      const a = n.a * (p.gain == null ? 1 : +p.gain) * s.base * g('vol'), f = st2(g('tono')), dec = clamp(g('dec'), .3, 3), pan = clamp(clamp(g('pan'), -1, 1) + (n.pan || 0), -1, 1);
      if (a < 1e-5) return;
      s.fn(K, n, n.t, a, f, dec, pan, { ruido: clamp(g('ruido'), 0, 2), brillo: clamp(g('brillo'), 0, 1), ataque: clamp(g('ataque'), 0, 60), sub: clamp(g('sub'), 0, 1.5), clic: clamp(g('clic'), 0, 2) });
    }
  };
})());
