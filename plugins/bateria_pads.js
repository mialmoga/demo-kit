// ──🥁 Batería (pads) · plugin de instrumento para Demo Kit ──
// Una sola pista de percusión con 12 pads (carriles): cada golpe es una nota de un carril del piano roll, y con el teclado en pantalla (⌨ Tocar)
// los 12 pads quedan en un bloque de cuadritos para tocar y grabar ritmos al vuelo, sin cambiar de pista.
//   Pads: Bombo · Caja · Hi-hat cerrado · Hi-hat abierto · Palma · Rim · Tom grave · Tom medio · Tom agudo · Crash · Cencerro · Shaker
// Cada pad tiene sus propios ajustes (sección plegable): volumen, tono (semitonos), duración (×) y paneo. El punto del inspector se apaga
// cuando un ajuste no aplica a ese sonido (por ejemplo, la duración de la palma).
// Bombo, caja, palma, hi-hat y crash usan los sonidos del kit cargado (K.kick, K.snare…), así que cambian con el kit; los toms, el rim,
// el cencerro y el shaker se sintetizan aquí con K.add y K.rnd, y funcionan con cualquier kit.
// Autoría: Ámbar (Claude Sonnet 5.5) con Brujo.
registerInstrument((() => {
  const TWO_PI = 6.283185307179586, clamp = (x, a, b) => x < a ? a : x > b ? b : x, st2 = s => Math.pow(2, s / 12);
  // id, nombre del carril, volumen base (igual que el instrumento suelto del kit), qué ajustes aplican {tono, dec, pan}
  const PADS = [
    ['bombo', 'Bombo', 1, { tono: 1, dec: 1, pan: 0 }], ['caja', 'Caja', .85, { tono: 1, dec: 1, pan: 0 }],
    ['hatc', 'Hi-hat cerrado', .1, { tono: 0, dec: 0, pan: 1 }], ['hato', 'Hi-hat abierto', .1, { tono: 0, dec: 0, pan: 1 }],
    ['palma', 'Palma', .5, { tono: 0, dec: 0, pan: 0 }], ['rim', 'Rim', .25, { tono: 1, dec: 1, pan: 1 }],
    ['tomg', 'Tom grave', .5, { tono: 1, dec: 1, pan: 1 }], ['tomm', 'Tom medio', .5, { tono: 1, dec: 1, pan: 1 }], ['toma', 'Tom agudo', .5, { tono: 1, dec: 1, pan: 1 }],
    ['crash', 'Crash', .3, { tono: 0, dec: 1, pan: 0 }], ['cenc', 'Cencerro', .35, { tono: 1, dec: 1, pan: 1 }], ['shak', 'Shaker', .16, { tono: 0, dec: 1, pan: 1 }]
  ];
  const num = (k, label, min, max, step, def, sec, on) => ({ k, label, min, max, step, def, sec, on });
  const params = [num('gain', 'Volumen general', 0, 2, .01, 1, 'General')];
  const ON = {};
  PADS.forEach(([id, name, , ap], i) => {
    params.push(num(id + '_vol', 'Volumen', 0, 1.6, .01, 1, name), num(id + '_tono', 'Tono (st)', -12, 12, .5, 0, name, () => !!ap.tono),
      num(id + '_dec', 'Duración (×)', .3, 3, .01, 1, name, () => !!ap.dec), num(id + '_pan', 'Paneo', -1, 1, .01, 0, name, () => !!ap.pan));
  });
  // juegos listos: ajustan tono, duración y volumen de varios pads a la vez
  const kit = o => { const r = {}; for (const k in o) r[k] = o[k]; return r; };
  const presets = {
    'Kit básico': kit({}),
    'Kit lo-fi (seco)': kit({ bombo_tono: 1, bombo_dec: .8, caja_tono: -2, caja_dec: .7, caja_vol: .8, hatc_vol: .7, hato_vol: .7, crash_vol: .5, rim_vol: 1.2, shak_vol: .8 }),
    'Kit 808': kit({ bombo_tono: -5, bombo_dec: 2.2, bombo_vol: 1.2, caja_tono: 2, caja_dec: 1.1, tomg_tono: -4, tomg_dec: 1.8, tomm_tono: -2, tomm_dec: 1.6, toma_tono: 0, toma_dec: 1.4, cenc_tono: -2, cenc_dec: 1.2 }),
    'Kit latino': kit({ bombo_vol: .8, caja_vol: .6, rim_vol: 1.4, tomg_tono: 5, tomg_dec: .7, tomm_tono: 7, tomm_dec: .6, toma_tono: 6, toma_dec: .55, cenc_vol: 1.3, shak_vol: 1.4, shak_dec: .8 }),
    'Kit orquestal (toms y crash)': kit({ bombo_dec: 1.4, tomg_dec: 1.8, tomm_dec: 1.6, toma_dec: 1.4, crash_dec: 1.6, crash_vol: 1.3, caja_dec: 1.2 })
  };
  const noiseHP = K => { let p = 0; return () => { const x = K.rnd() * 2 - 1, v = x - p; p = x; return v; }; };
  return {
    id: 'bateria_pads', name: 'Batería (pads)', version: '1.0', kind: 'perc', cat: 'perc', oneShot: true, buf: 'dr', presetReset: true,
    lanes: PADS.map(p => ({ name: p[1] })),
    desc: 'Una pista de percusión con 12 pads: bombo, caja, hi-hat cerrado y abierto, palma, rim, tres toms, crash, cencerro y shaker. Cada golpe es una nota de su carril; con ⌨ Tocar los pads quedan en un bloque para grabar ritmos al vuelo. Cada pad tiene sus propios ajustes.',
    params, presets,
    play(K, n) {
      const li = Math.round(n.lane), pad = PADS[li]; if (!pad) return;
      const [id, , base] = pad, p = n.p, g = (k, d) => p[id + '_' + k] == null ? d : +p[id + '_' + k];
      const t = n.t, a = n.a * (p.gain == null ? 1 : +p.gain) * base * g('vol', 1), tono = g('tono', 0), dec = clamp(g('dec', 1), .3, 3), pan = clamp(clamp(g('pan', 0), -1, 1) + (n.pan || 0), -1, 1), f = st2(tono);
      if (a < 1e-5) return;
      if (id === 'bombo') K.kick(t, a, { lo: 50 * f, hi: 140 * f, len: .4 * dec });
      else if (id === 'caja') K.snare(t, a, { tone: 200 * f, len: .25 * dec });
      else if (id === 'hatc') K.hat(t, a, false, pan);
      else if (id === 'hato') K.hat(t, a, true, pan);
      else if (id === 'palma') K.clap(t, a);
      else if (id === 'crash') K.crash(t, a, 2.4 * dec);
      else if (id === 'rim') { const nz = noiseHP(K), fr = 1750 * f; K.add(n.buf, t, .08 * dec + .03, tt => (Math.sin(TWO_PI * fr * tt) * .7 + nz() * .5) * Math.exp(-tt * 70 / dec), a, pan); }
      else if (id === 'tomg' || id === 'tomm' || id === 'toma') {
        const f0 = { tomg: 92, tomm: 134, toma: 190 }[id] * f, nz = noiseHP(K); let ph = 0;
        K.add(n.buf, t, .6 * dec, tt => { ph += TWO_PI * f0 * (1 + .7 * Math.exp(-tt / .035)) / n.sr; return Math.sin(ph) * Math.exp(-tt * 9 / dec) + nz() * .25 * Math.exp(-tt * 120); }, a, pan);
      }
      else if (id === 'cenc') {
        const f1 = 587 * f, f2 = 845 * f; let lp = 0;
        K.add(n.buf, t, .5 * dec, tt => { const s = (Math.sin(TWO_PI * f1 * tt) > 0 ? 1 : -1) + (Math.sin(TWO_PI * f2 * tt) > 0 ? 1 : -1); lp += .35 * (s - lp); return lp * .5 * (Math.exp(-tt * 14 / dec) * .8 + Math.exp(-tt * 3 / dec) * .2); }, a, pan);
      }
      else if (id === 'shak') { const nz = noiseHP(K); K.add(n.buf, t, .2 * dec, tt => nz() * Math.min(1, tt / .012) * Math.exp(-tt * 28 / dec), a, pan); }
    }
  };
})());
