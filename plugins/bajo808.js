// ──🔊 Bajo 808 · plugin de instrumento para Demo Kit ──  v1.0
// Bajo de una voz pensado para graves sostenidos y potentes: seno con golpe de tono al inicio (la «caída» del 808), sub una octava abajo,
// armónicos por saturación (tanh, asimétrica o plegado) para que se oiga en bocinas chicas y tenga cuerpo entre 200 y 500 Hz,
// y glide entre notas ligadas: si una nota empieza dentro de la ventana de la anterior, no hay nuevo ataque y el tono se desliza.
// Se toca como un instrumento melódico (usa la escala y los acordes del estudio). Con glide activado la pista se vuelve monofónica.
// Autoría: Ámbar (Claude Sonnet 5.5) con Brujo.
registerInstrument((() => {
  const TWO_PI = 6.283185307179586, clamp = (x, a, b) => x < a ? a : x > b ? b : x, hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const S = (sec, d) => (d.sec = sec, d);
  const num = (k, label, min, max, step, def) => ({ k, label, min, max, step, def });
  const choice = (k, label, opts, vals, def) => ({ k, label, type: 'choice', opts, vals, def });
  const params = [
    S('General', num('gain', 'Volumen', 0, 2, .01, 1)),
    S('Tono', num('oct', 'Octava', -2, 2, 1, 0)), S('Tono', num('fino', 'Afinación (cents)', -50, 50, 1, 0)),
    S('Golpe de tono', num('punch', 'Caída (semitonos)', 0, 24, .5, 7)), S('Golpe de tono', num('punchT', 'Duración de la caída (s)', .005, .4, .005, .05)),
    S('Golpe de tono', num('clic', 'Clic', 0, 1, .01, .25)),
    S('Envolvente', num('dec', 'Caída del volumen (s)', .05, 6, .01, 1.4)), S('Envolvente', num('sus', 'Sostenido', 0, 1, .01, .55)), S('Envolvente', num('rel', 'Relajación (s)', .02, 3, .01, .25)),
    S('Glide', choice('glideMode', 'Glide', ['Apagado', 'Solo notas ligadas', 'Siempre (desde la nota anterior)'], ['off', 'ligado', 'siempre'], 'off')),
    S('Glide', num('glide', 'Duración del glide (s)', .01, 1.5, .01, .12)), S('Glide', num('ventana', 'Ventana de unión (s)', 0, 1, .01, .12)),
    S('Armónicos', num('drive', 'Saturación', 0, 1, .01, .45)), S('Armónicos', choice('tipo', 'Tipo de saturación', ['Suave (tanh)', 'Asimétrica (pares e impares)', 'Plegado (metálico)'], ['tanh', 'asim', 'fold'], 'tanh')),
    S('Armónicos', num('h2', 'Segundo armónico', 0, 1, .01, 0)), S('Armónicos', num('h3', 'Tercer armónico', 0, 1, .01, 0)),
    S('Sub', num('sub', 'Sub (una octava abajo)', 0, 1, .01, .35)),
    S('Filtro', num('corte', 'Corte de agudos (Hz)', 150, 12000, 10, 2500))
  ];
  const DEF = {}; params.forEach(d => DEF[d.k] = d.def);
  const P = o => Object.assign({}, DEF, o);
  const presets = {
    '808 clásico': P({}),
    '808 largo con glide': P({ dec: 3.2, sus: .7, rel: .5, glideMode: 'ligado', glide: .18, ventana: .2, punch: 5 }),
    '808 sucio': P({ drive: .85, tipo: 'asim', corte: 4200, punch: 12, punchT: .04, clic: .4, h2: .25 }),
    'Sub suave': P({ drive: .08, punch: 3, punchT: .08, clic: .08, sub: .5, corte: 900, dec: 2, sus: .7 }),
    'Bajo hip-hop corto': P({ dec: .45, sus: .15, rel: .12, punch: 9, punchT: .035, drive: .55, corte: 2000, sub: .3 }),
    'Industrial plegado': P({ drive: .9, tipo: 'fold', h3: .35, corte: 6000, punch: 14, punchT: .03, clic: .5, dec: 1.1, sus: .6 }),
    'Trap con deslizamiento': P({ dec: 2.4, sus: .8, rel: .4, glideMode: 'siempre', glide: .22, punch: 0, drive: .5, h2: .15 })
  };
  return {
    id: 'bajo808', name: 'Bajo 808', version: '1.0', kind: 'melodic', cat: 'bajo', presetReset: true,
    monoWhen: p => !!p && p.glideMode && p.glideMode !== 'off',
    desc: 'Bajo de una voz para graves sostenidos: seno con caída de tono, sub una octava abajo, saturación para dar armónicos y glide entre notas ligadas. Presets: 808 clásico, largo con glide, sucio, Sub suave, hip-hop corto, Industrial plegado y Trap con deslizamiento.',
    params, presets,
    play(K, n) {
      const p = n.p, sr = n.sr, g = (k, d) => p[k] == null ? d : +p[k], lk = n.link || {}, mode = p.glideMode || 'off', win = g('ventana', .12);
      const cPrev = mode !== 'off' && lk.prevGap != null && (mode === 'siempre' ? lk.prevGap <= Math.max(win, 1.5) : lk.prevGap <= win) && lk.prevMidi != null;
      const cNext = mode !== 'off' && lk.nextGap != null && lk.nextGap <= win;
      const XF = .02, lead = cPrev ? Math.max(0, lk.prevGap) : 0, dec = Math.max(.05, g('dec', 1.4)), sus = clamp(g('sus', .55), 0, 1), rel = Math.max(.02, g('rel', .25));
      const tail = cNext ? XF + .01 : Math.min(3.5, rel * 1.6 + .05), total = Math.ceil((lead + n.len + tail) * sr), acc = new Float32Array(total);
      const midi = n.midi + 12 * Math.round(g('oct', 0)) + g('fino', 0) / 100, prevMidi = cPrev ? lk.prevMidi + 12 * Math.round(g('oct', 0)) + g('fino', 0) / 100 : midi;
      const punch = cPrev ? 0 : g('punch', 7), punchT = Math.max(.005, g('punchT', .05)), glideT = Math.max(.01, g('glide', .12));
      const drive = clamp(g('drive', .45), 0, 1), tipo = p.tipo || 'tanh', h2 = clamp(g('h2', 0), 0, 1), h3 = clamp(g('h3', 0), 0, 1), sub = clamp(g('sub', .35), 0, 1);
      const clic = clamp(g('clic', .25), 0, 1), al = 1 - Math.exp(-TWO_PI * clamp(g('corte', 2500), 150, 12000) / sr), gd = 1 + drive * 8, norm = 1 / Math.tanh(gd);
      let ph = 0, phs = 0, y1 = 0, y2 = 0, relLevel = -1;
      for (let i = 0; i < total; i++) {
        const t = i / sr - lead;                                           // t<0: tramo previo (nota anterior aún sonando, ya ligada)
        let pitch = midi;
        if (cPrev) { if (t < 0) pitch = prevMidi; else { const x = clamp(t / glideT, 0, 1); pitch = prevMidi + (midi - prevMidi) * (1 - Math.pow(1 - x, 3)); } }
        else if (punch > 0 && t >= 0) pitch = midi + punch * Math.exp(-t / punchT);
        const f = hz(pitch); ph += f / sr; phs += f * .5 / sr; if (ph >= 1) ph -= 1; if (phs >= 1) phs -= 1;
        let s = Math.sin(TWO_PI * ph);
        if (h2) s += h2 * .5 * Math.sin(TWO_PI * 2 * ph); if (h3) s += h3 * .4 * Math.sin(TWO_PI * 3 * ph);
        if (sub) s += sub * Math.sin(TWO_PI * phs);
        if (drive > 0) {
          if (tipo === 'asim') { const v = s * gd * .5; s = (Math.tanh(v + .35) - Math.tanh(.35)) * norm * .9; }
          else if (tipo === 'fold') { let v = s * (1 + drive * 3); v = ((v + 1) % 4 + 4) % 4; s = (v < 2 ? v : 4 - v) - 1; s *= .8; }
          else s = Math.tanh(s * gd) * norm * .8;
        }
        y1 += al * (s - y1); y2 += al * (y1 - y2); s = y2;
        if (clic > 0 && t >= 0 && t < .006) s += (K.rnd() * 2 - 1) * clic * .35 * (1 - t / .006);
        let e;
        if (t < 0) e = sus;
        else if (t < n.len) e = cPrev ? sus : (t < .002 ? t / .002 : sus + (1 - sus) * Math.exp(-(t - .002) / (dec * .35)));
        else { if (relLevel < 0) relLevel = cPrev ? sus : (n.len < .002 ? n.len / .002 : sus + (1 - sus) * Math.exp(-(n.len - .002) / (dec * .35)));
          e = cNext ? relLevel * Math.max(0, 1 - (t - n.len) / XF) : relLevel * Math.exp(-(t - n.len) * 4.6 / rel); }
        if (cPrev && t >= 0 && t < XF) e *= .5 + .5 * (t / XF);
        acc[i] = s * e;
      }
      const nf = Math.min(total, Math.floor(.004 * sr)); for (let i = 0; i < nf; i++) acc[total - 1 - i] *= i / nf;
      K.add(n.buf, n.t - lead, lead + n.len + tail, tt => acc[Math.round(tt * sr)] || 0, n.a * g('gain', 1) * .8, n.pan || 0);
    }
  };
})());
