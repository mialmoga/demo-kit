// ──🥁 Batería (pads) · plugin de instrumento para Demo Kit ──  v1.1
// Una sola pista de percusión con 16 pads (carriles): cada golpe es una nota de un carril del piano roll, y con el teclado en pantalla
// (⌨ Tocar) los pads quedan en una rejilla para tocar y grabar ritmos al vuelo, sin cambiar de pista.
//   · Cada pad elige su SONIDO de una lista de 26 (bombo, bombo 808, caja, rim, palma, chasquido, tres hi-hats, ride, campana, crash,
//     tres toms, tres congas, bongó, timbal, cencerro, shaker, pandero, claves, woodblock, triángulo) y tiene sus propios ajustes
//     (sección plegable): volumen, tono (semitonos), duración (×) y paneo. El punto del inspector se apaga cuando un ajuste no aplica.
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
  const ORDER = [], S = {};
  // id, nombre, volumen base, nota GM, ajustes que aplican {tono, dec, pan}, síntesis (K, n, t, a, f=factor de tono, dec=factor de duración, pan)
  const def = (id, name, base, gm, ap, fn) => { S[id] = { id, name, base, gm, ap, fn }; ORDER.push(id); };
  const A = (tono, dec, pan) => ({ tono, dec, pan });
  const add = (K, n, t, len, fn, a, pan) => K.add(n.buf, t, len, fn, a, pan);
  const tom = (f0, base, gm, name) => [name, base, gm, A(1, 1, 1), (K, n, t, a, f, dec, pan) => { const fr = f0 * f, nz = noiseHP(K); let ph = 0;
    add(K, n, t, .6 * dec, tt => { ph += TWO_PI * fr * (1 + .7 * Math.exp(-tt / .035)) / n.sr; return Math.sin(ph) * Math.exp(-tt * 9 / dec) + nz() * .25 * Math.exp(-tt * 120); }, a, pan); }];
  const conga = (f0, dr, lenS, base, gm, name, slap) => [name, base, gm, A(1, 1, 1), (K, n, t, a, f, dec, pan) => { const fr = f0 * f, nz = noiseHP(K); let ph = 0;
    add(K, n, t, lenS * dec, tt => { ph += TWO_PI * fr * (1 + .12 * Math.exp(-tt / .018)) / n.sr; return Math.sin(ph) * Math.exp(-tt * dr / dec) * .9 + nz() * (slap ? .6 : .18) * Math.exp(-tt * (slap ? 70 : 150)); }, a, pan); }];
  const metal = (fs, dr, lenS, noise, base, gm, name) => [name, base, gm, A(1, 1, 1), (K, n, t, a, f, dec, pan) => { const nz = noiseHP(K);
    add(K, n, t, lenS * dec, tt => { let s = 0; for (const [r, w] of fs) s += Math.sin(TWO_PI * r * f * tt) * w; return s * Math.exp(-tt * dr / dec) + nz() * noise * Math.exp(-tt * dr * 1.4 / dec); }, a, pan); }];

  const mk = (id, arr) => def(id, arr[0], arr[1], arr[2], arr[3], arr[4]);
  def('bombo', 'Bombo', 1, 36, A(1, 1, 0), (K, n, t, a, f, dec) => K.kick(t, a, { lo: 50 * f, hi: 140 * f, len: .4 * dec }));
  def('bombo808', 'Bombo 808', .9, 35, A(1, 1, 0), (K, n, t, a, f, dec) => K.kick(t, a, { lo: 38 * f, hi: 110 * f, k: 22, dec: 3.2, len: 1 * dec }));
  def('caja', 'Caja', .85, 38, A(1, 1, 0), (K, n, t, a, f, dec) => K.snare(t, a, { tone: 200 * f, len: .25 * dec }));
  def('rim', 'Rim', .25, 37, A(1, 1, 1), (K, n, t, a, f, dec, pan) => { const nz = noiseHP(K), fr = 1750 * f; add(K, n, t, .08 * dec + .03, tt => (Math.sin(TWO_PI * fr * tt) * .7 + nz() * .5) * Math.exp(-tt * 70 / dec), a, pan); });
  def('palma', 'Palma', .5, 39, A(0, 0, 0), (K, n, t, a) => K.clap(t, a));
  def('chasq', 'Chasquido', .2, 85, A(0, 0, 1), (K, n, t, a, f, dec, pan) => K.snap(t, a, pan));
  def('hatc', 'Hi-hat cerrado', .1, 42, A(0, 0, 1), (K, n, t, a, f, dec, pan) => K.hat(t, a, false, pan));
  def('hatp', 'Hi-hat de pedal', .1, 44, A(0, 1, 1), (K, n, t, a, f, dec, pan) => { const nz = noiseHP(K); add(K, n, t, .06 * dec + .02, tt => nz() * Math.exp(-tt * 110 / dec), a * .9, pan); });
  def('hato', 'Hi-hat abierto', .1, 46, A(0, 0, 1), (K, n, t, a, f, dec, pan) => K.hat(t, a, true, pan));
  def('ride', 'Ride', .12, 51, A(1, 1, 1), (K, n, t, a, f, dec, pan) => { const nz = noiseHP(K), fs = [1, 1.43, 1.77, 2.16, 2.63, 3.34];
    add(K, n, t, 1.6 * dec, tt => { let s = 0; for (const r of fs) s += Math.sin(TWO_PI * 830 * f * r * tt) > 0 ? 1 : -1; return (s / 6 * .55 + nz() * .45) * (Math.exp(-tt * 3 / dec) * .75 + Math.exp(-tt * 30) * .5); }, a, pan); });
  mk('campana', metal([[1180, 1], [1760, .7], [2640, .35]], 7, .6, .12, .22, 53, 'Campana de ride'));
  def('crash', 'Crash', .3, 49, A(0, 1, 0), (K, n, t, a, f, dec) => K.crash(t, a, 2.4 * dec));
  mk('tomg', tom(92, .5, 41, 'Tom grave')); mk('tomm', tom(134, .5, 45, 'Tom medio')); mk('toma', tom(190, .5, 48, 'Tom agudo'));
  mk('congag', conga(190, 9, .6, .55, 64, 'Conga grave')); mk('congaa', conga(280, 11, .5, .5, 63, 'Conga aguda')); mk('congas', conga(330, 30, .22, .5, 62, 'Conga seca (slap)', true));
  mk('bongo', conga(420, 16, .3, .45, 60, 'Bongó'));
  mk('timbal', metal([[520, 1], [780, .5], [1100, .25]], 14, .35, .15, .3, 65, 'Timbal'));
  mk('cenc', ['Cencerro', .35, 56, A(1, 1, 1), (K, n, t, a, f, dec, pan) => { const f1 = 587 * f, f2 = 845 * f; let lp = 0;
    add(K, n, t, .5 * dec, tt => { const s = (Math.sin(TWO_PI * f1 * tt) > 0 ? 1 : -1) + (Math.sin(TWO_PI * f2 * tt) > 0 ? 1 : -1); lp += .35 * (s - lp); return lp * .5 * (Math.exp(-tt * 14 / dec) * .8 + Math.exp(-tt * 3 / dec) * .2); }, a, pan); }]);
  def('shak', 'Shaker', .16, 70, A(0, 1, 1), (K, n, t, a, f, dec, pan) => { const nz = noiseHP(K); add(K, n, t, .2 * dec, tt => nz() * Math.min(1, tt / .012) * Math.exp(-tt * 28 / dec), a, pan); });
  def('pandero', 'Pandero', .2, 54, A(0, 1, 1), (K, n, t, a, f, dec, pan) => { const nz = noiseHP(K), nz2 = noiseHP(K); add(K, n, t, .3 * dec, tt => (nz() * .6 + nz2() * .4) * Math.exp(-tt * 16 / dec) * (1 + .6 * Math.sin(TWO_PI * 95 * tt)) + Math.sin(TWO_PI * 330 * tt) * .25 * Math.exp(-tt * 40), a, pan); });
  def('claves', 'Claves', .3, 75, A(1, 1, 1), (K, n, t, a, f, dec, pan) => { const fr = 2500 * f; add(K, n, t, .08 * dec + .02, tt => Math.sin(TWO_PI * fr * tt) * Math.exp(-tt * 85 / dec), a, pan); });
  def('wood', 'Woodblock', .3, 76, A(1, 1, 1), (K, n, t, a, f, dec, pan) => { const f1 = 900 * f, f2 = 1350 * f; add(K, n, t, .15 * dec, tt => (Math.sin(TWO_PI * f1 * tt) + .5 * Math.sin(TWO_PI * f2 * tt)) * Math.exp(-tt * 45 / dec) * .7, a, pan); });
  mk('triang', metal([[2900, 1], [7500, .35], [10900, .15]], 4.5, 1.2, 0, .1, 81, 'Triángulo'));

  // ── los 16 pads ──
  const NP = 16, DEFSND = ['bombo', 'caja', 'hatc', 'hato', 'palma', 'rim', 'tomg', 'tomm', 'toma', 'crash', 'cenc', 'shak', 'ride', 'congag', 'congaa', 'congas'];
  const OLD = ['bombo', 'caja', 'hatc', 'hato', 'palma', 'rim', 'tomg', 'tomm', 'toma', 'crash', 'cenc', 'shak'];      // claves de la v1.0
  const num = (k, label, min, max, step, def, sec, on) => ({ k, label, min, max, step, def, sec, on });
  const params = [num('gain', 'Volumen general', 0, 2, .01, 1, 'General'),
    { k: 'midiMap', label: 'MIDI: nota de cada pad', type: 'choice', opts: ['Consecutivas desde C1 (pads MPC)', 'General MIDI (según el sonido)'], vals: ['seq', 'gm'], def: 'seq', sec: 'General' }];
  for (let i = 1; i <= NP; i++) {
    const sec = 'Pad ' + i, snd = p => S[(p || {})['p' + i + '_snd'] || DEFSND[i - 1]] || S[DEFSND[i - 1]];
    params.push({ k: 'p' + i + '_snd', label: 'Sonido', type: 'choice', opts: ORDER.map(id => S[id].name), vals: ORDER.slice(), def: DEFSND[i - 1], sec },
      num('p' + i + '_vol', 'Volumen', 0, 1.6, .01, 1, sec), num('p' + i + '_tono', 'Tono (st)', -12, 12, .5, 0, sec, p => !!snd(p).ap.tono),
      num('p' + i + '_dec', 'Duración (×)', .3, 3, .01, 1, sec, p => !!snd(p).ap.dec), num('p' + i + '_pan', 'Paneo', -1, 1, .01, 0, sec, p => !!snd(p).ap.pan));
  }
  const sndOf = (p, i) => S[(p || {})['p' + (i + 1) + '_snd']] || S[DEFSND[i]];
  const presets = {
    'Kit básico': {},
    'Kit lo-fi (seco)': { p1_tono: 1, p1_dec: .8, p2_tono: -2, p2_dec: .7, p2_vol: .8, p3_vol: .7, p4_vol: .7, p10_vol: .5, p6_vol: 1.2, p12_vol: .8, p13_vol: .6 },
    'Kit 808': { p1_snd: 'bombo808', p1_vol: 1.2, p2_tono: 2, p2_dec: 1.1, p7_tono: -4, p7_dec: 1.8, p8_tono: -2, p8_dec: 1.6, p9_dec: 1.4, p11_tono: -2, p11_dec: 1.2, p13_snd: 'chasq', p14_snd: 'palma' },
    'Kit latino': { p1_vol: .8, p2_vol: .6, p6_snd: 'claves', p6_vol: 1.3, p7_snd: 'bongo', p7_tono: -2, p8_snd: 'bongo', p8_tono: 3, p9_snd: 'timbal', p10_snd: 'campana', p11_vol: 1.3, p12_snd: 'pandero', p12_vol: 1.4, p13_snd: 'triang', p13_vol: 1.2, p14_vol: 1.1, p15_vol: 1.1, p16_vol: 1.1 },
    'Kit de rock (ride y toms)': { p5_snd: 'chasq', p5_vol: 0, p6_vol: .8, p7_dec: 1.3, p8_dec: 1.2, p9_dec: 1.1, p10_vol: 1.1, p11_snd: 'hatp', p11_vol: 1.2, p12_snd: 'campana', p13_vol: 1.2, p14_snd: 'tomg', p14_tono: -3, p15_snd: 'tomm', p15_tono: -3, p16_snd: 'toma', p16_tono: -3 },
    'Kit orquestal (toms y crash)': { p1_dec: 1.4, p7_dec: 1.8, p8_dec: 1.6, p9_dec: 1.4, p10_dec: 1.6, p10_vol: 1.3, p2_dec: 1.2, p13_dec: 1.3 }
  };
  return {
    id: 'bateria_pads', name: 'Batería (pads)', version: '1.1', kind: 'perc', cat: 'perc', oneShot: true, buf: 'dr', presetReset: true,
    lanes: DEFSND.map(id => ({ name: S[id].name, gm: S[id].gm })),
    laneNames: p => DEFSND.map((d, i) => sndOf(p, i).name),
    midiLane: (note, p) => { if (!p || p.midiMap !== 'gm') return null; for (let i = 0; i < NP; i++) if (sndOf(p, i).gm === note) return i; return null; },
    midiNote: (lane, p) => { const i = clamp(Math.round(lane), 0, NP - 1); if (!p || p.midiMap !== 'gm') return 36 + i; const s = sndOf(p, i); return s ? s.gm : 36 + i; },
    desc: 'Una pista de percusión con 16 pads. Cada pad elige su sonido de una lista de 26 (bombo, caja, hi-hats, ride, toms, congas, bongó, cencerro, pandero, claves…) y tiene sus propios ajustes. Cada golpe es una nota de su carril; con ⌨ Tocar los pads quedan en una rejilla para grabar ritmos al vuelo. Funciona con pads MIDI (consecutivas desde C1, o General MIDI).',
    params, presets,
    play(K, n) {
      const li = Math.round(n.lane); if (!(li >= 0 && li < NP)) return;
      const p = n.p, i = li + 1, s = sndOf(p, li), pre = 'p' + i + '_', old = li < OLD.length ? OLD[li] + '_' : null, defs = { vol: 1, tono: 0, dec: 1, pan: 0 };
      const g = k => { let v = p[pre + k]; if (old && (v == null || +v === defs[k]) && p[old + k] != null) v = p[old + k]; return v == null ? defs[k] : +v; };
      const a = n.a * (p.gain == null ? 1 : +p.gain) * s.base * g('vol'), f = st2(g('tono')), dec = clamp(g('dec'), .3, 3), pan = clamp(clamp(g('pan'), -1, 1) + (n.pan || 0), -1, 1);
      if (a < 1e-5) return;
      s.fn(K, n, n.t, a, f, dec, pan);
    }
  };
})());
