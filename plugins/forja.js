// ──🔥 Forja · plugin de instrumento para Demo Kit ──
// El «instrumento supremo»: un sintetizador de una sola voz por nota con mucho control sobre la onda y el legato, pensado para sonidos
// mecánicos (serruchos, motores, taladros) y, en las siguientes fases, acuosos. Fase 1 (v1.0): núcleo.
//   · Generadores: onda que se mezcla de seno → triángulo → sierra → cuadrada (con ancho de pulso), segunda onda, sincronía dura con barrido,
//     FM, varias voces desafinadas, o «pulsos de motor» (tren de golpes con irregularidad y fallos de encendido), más ruido blanco, rosa o café.
//   · Mecánico: modulación de amplitud (dientes de la sierra), aspereza, deriva de tono, saturación.
//   · Color: filtro resonante (pasabajos, pasabandas, pasaaltos) o peine, con envolvente y seguimiento del teclado.
//   · Legato: si la nota siguiente (o la anterior) está a menos de «Ventana» segundos, no se vuelve a atacar y el tono se desliza (glissando).
//     Con legato activado la pista se vuelve monofónica y el estudio marca las notas que se pisan; con legato apagado suena polifónico.
// Solo usa K.add y K.rnd (con la semilla de la pista), así que funciona con el kit incluido y con cualquiera de los alternos.
// Autoría: Ámbar (Claude Sonnet 5.5) con Brujo.
registerInstrument((() => {
  const TWO_PI = 6.283185307179586, PI = Math.PI;
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const LEVEL = .50;

  // PolyBLEP: quita el alias de los saltos de la sierra y la cuadrada
  const blep = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
  const basic = (i, p, dt, pw) => {
    if (i === 0) return Math.sin(TWO_PI * p);
    if (i === 1) return 1 - 4 * Math.abs(p - .5);
    if (i === 2) return 2 * p - 1 - blep(p, dt);
    let v = p < pw ? 1 : -1; v += blep(p, dt); v -= blep(p - pw < 0 ? p - pw + 1 : p - pw, dt); return v;
  };
  // forma 0…3: seno → triángulo → sierra → cuadrada, mezclando las dos vecinas
  const wave = (p, dt, f, pw) => { const i = Math.min(2, Math.floor(f)), x = f - i; const a = basic(i, p, dt, pw); return x < 1e-6 ? a : a + (basic(i + 1, p, dt, pw) - a) * x; };

  // ruido suave con desviación ≈ 1 (para la deriva y la aspereza): ruido blanco pasado por un filtro de un polo, reescalado
  const smoothNoise = (K, fc, sr) => { const a = 1 - Math.exp(-TWO_PI * fc / sr), g = 1 / (.577 * Math.sqrt(a / (2 - a))); let y = 0; return () => { y += a * ((K.rnd() * 2 - 1) - y); return y * g; }; };

  const choice = (k, label, opts, vals, def) => ({ k, label, type: 'choice', opts, vals, def });
  const num = (k, label, min, max, step, def) => ({ k, label, min, max, step, def });

  return {
    id: 'forja', name: 'Forja', version: '1.0', kind: 'melodic', cat: 'sinte',
    monoWhen: p => !!p && p.legato && p.legato !== 'off',
    desc: 'Sintetizador de una voz por nota con onda mezclable (seno→sierra→cuadrada), segunda onda, sincronía dura, FM, unísono, ruido, pulsos de motor, filtro resonante y legato con glissando. Presets: Serrucho, Motor diésel, Moto que acelera, Taladro.',
    params: [
      num('gain', 'Volumen', 0, 2, .01, 1),
      // ── generador 1
      choice('gen', 'Generador', ['Onda', 'Pulsos de motor'], ['onda', 'motor'], 'onda'),
      num('forma', 'Forma de onda (0 seno · 1 triángulo · 2 sierra · 3 cuadrada)', 0, 3, .01, 2),
      num('pw', 'Ancho de pulso (cuadrada)', .05, .95, .01, .5),
      num('voces', 'Voces en unísono', 1, 7, 1, 1),
      num('desa', 'Desafinación entre voces (cents)', 0, 60, 1, 12),
      num('sincr', 'Sincronía dura (1 = apagada)', 1, 8, .01, 1),
      num('sincEnv', 'Barrido de la sincronía (cae con la envolvente del filtro)', 0, 8, .05, 0),
      num('fm', 'FM (profundidad)', 0, 8, .05, 0),
      num('fmR', 'FM (razón del modulador)', .25, 8, .25, 2),
      // ── onda 2
      num('mix2', 'Onda 2 (mezcla)', 0, 1, .01, 0),
      num('forma2', 'Onda 2 · forma de onda', 0, 3, .01, 2),
      num('semi2', 'Onda 2 · semitonos', -24, 24, 1, -12),
      num('fine2', 'Onda 2 · afinación fina (cents)', -50, 50, 1, 0),
      // ── motor
      num('irr', 'Motor · irregularidad', 0, 1, .01, .3),
      num('fallos', 'Motor · fallos de encendido', 0, 1, .01, 0),
      num('filo', 'Motor · filo del golpe (más = más seco)', 2, 40, .5, 12),
      // ── ruido
      num('ruido', 'Ruido (mezcla)', 0, 1, .01, 0),
      choice('ruidoT', 'Tipo de ruido', ['Blanco', 'Rosa', 'Café (grave)'], ['blanco', 'rosa', 'cafe'], 'blanco'),
      // ── mecánico
      num('am', 'Dientes (modulación de amplitud)', 0, 1, .01, 0),
      num('amF', 'Dientes · frecuencia (Hz)', 5, 400, 1, 60),
      num('amIrr', 'Dientes · irregularidad', 0, 1, .01, .2),
      num('aspereza', 'Aspereza (temblor aleatorio)', 0, 1, .01, 0),
      num('deriva', 'Deriva de tono (cents)', 0, 100, 1, 0),
      num('drive', 'Saturación', 0, 1, .01, 0),
      // ── filtro
      choice('ftipo', 'Filtro', ['Pasabajos', 'Pasabandas', 'Pasaaltos', 'Peine'], ['lp', 'bp', 'hp', 'peine'], 'lp'),
      num('corte', 'Corte (Hz)', 40, 12000, 10, 3000),
      num('res', 'Resonancia', 0, 1, .01, .2),
      num('envF', 'Envolvente del filtro (octavas ×5; negativo = baja)', -1, 1, .05, 0),
      num('fdec', 'Envolvente del filtro · caída (s)', .02, 3, .01, .3),
      num('kbd', 'Seguir el teclado (el corte sube con la nota)', 0, 1, .01, .3),
      // ── envolvente de volumen
      num('atk', 'Ataque (s)', .001, 2, .001, .01),
      num('dec', 'Caída (s)', .01, 3, .01, .3),
      num('sus', 'Sostenido', 0, 1, .01, .8),
      num('rel', 'Relajación (s)', .01, 4, .01, .2),
      // ── tono
      num('bend', 'Caída de tono al atacar (semitonos)', -24, 24, .5, 0),
      num('bendT', 'Caída de tono · tiempo (s)', .005, 2, .005, .15),
      // ── legato
      choice('legato', 'Legato', ['Apagado (polifónico)', 'Legato (sin reataque)', 'Glissando'], ['off', 'legato', 'glide'], 'off'),
      num('ventana', 'Legato · ventana (s entre notas)', 0, 1, .01, .15),
      num('glide', 'Glissando · tiempo (s)', .01, 2, .01, .2)
    ],
    presets: {
      'Serrucho': { gain: 1.5, gen: 'onda', forma: 2, voces: 2, desa: 8, sincr: 1.6, sincEnv: 2.2, mix2: .45, forma2: 2, semi2: -12, fine2: 7, ruido: .1, ruidoT: 'rosa', am: .6, amF: 72, amIrr: .55, aspereza: .35, deriva: 14, drive: .4,
        ftipo: 'bp', corte: 1800, res: .5, envF: .3, fdec: .25, kbd: .4, atk: .006, dec: .3, sus: .8, rel: .14, bend: 0, legato: 'off' },
      'Motor diésel': { gen: 'motor', voces: 1, desa: 0, irr: .38, fallos: .08, filo: 14, ruido: .1, ruidoT: 'cafe', am: 0, aspereza: .18, deriva: 10, drive: .5,
        ftipo: 'lp', corte: 520, res: .3, envF: .25, fdec: .5, kbd: .5, atk: .02, dec: .4, sus: .9, rel: .25, bend: 3, bendT: .4, legato: 'off' },
      'Moto que acelera': { gen: 'motor', voces: 1, desa: 0, irr: .22, fallos: .02, filo: 9, ruido: .06, ruidoT: 'cafe', am: 0, aspereza: .12, deriva: 6, drive: .55,
        ftipo: 'lp', corte: 900, res: .35, envF: .15, fdec: .6, kbd: .8, atk: .02, dec: .3, sus: .95, rel: .3, bend: 0, legato: 'glide', ventana: .35, glide: .9 },
      'Taladro': { gen: 'onda', forma: 3, pw: .3, voces: 3, desa: 22, sincr: 2.4, sincEnv: 0, mix2: .3, forma2: 2, semi2: 7, fine2: 0, ruido: .22, ruidoT: 'blanco', am: .85, amF: 38, amIrr: .15, aspereza: .45, deriva: 20, drive: .7,
        ftipo: 'bp', corte: 2600, res: .6, envF: 0, fdec: .3, kbd: .5, atk: .004, dec: .2, sus: .9, rel: .08, legato: 'off' }
    },
    play(K, n) {
      const p = n.p, sr = n.sr, r = () => K.rnd();
      const g = (k, d) => p[k] == null ? d : +p[k];
      const mode = p.legato || 'off', lk = n.link || {}, win = g('ventana', .15);
      const cPrev = mode !== 'off' && lk.prevGap != null && lk.prevGap <= win;
      const cNext = mode !== 'off' && lk.nextGap != null && lk.nextGap <= win;
      const XF = .015, lead = cPrev ? Math.max(0, lk.prevGap) : 0;
      const atk = Math.max(.001, g('atk', .01)), dec = Math.max(.01, g('dec', .3)), sus = clamp(g('sus', .8), 0, 1), rel = Math.max(.01, g('rel', .2));
      const tail = cNext ? XF + .01 : Math.min(4, rel * 2 + .05), total = Math.ceil((lead + n.len + tail) * sr), acc = new Float32Array(total);
      const isMotor = p.gen === 'motor', V = isMotor ? Math.max(1, Math.round(g('voces', 1))) : clamp(Math.round(g('voces', 1)), 1, 7), desa = g('desa', 12);
      const forma = clamp(g('forma', 2), 0, 3), pw = clamp(g('pw', .5), .05, .95), forma2 = clamp(g('forma2', 2), 0, 3), mix2 = clamp(g('mix2', 0), 0, 1);
      const sincr = Math.max(1, g('sincr', 1)), sincEnv = g('sincEnv', 0), fm = g('fm', 0), fmR = g('fmR', 2);
      const semi2 = g('semi2', -12), fine2 = g('fine2', 0), irr = clamp(g('irr', .3), 0, 1), fallos = clamp(g('fallos', 0), 0, 1), filo = g('filo', 12);
      const ruido = clamp(g('ruido', 0), 0, 1), ruidoT = p.ruidoT || 'blanco', am = clamp(g('am', 0), 0, 1), amF = g('amF', 60), amIrr = clamp(g('amIrr', .2), 0, 1);
      const asp = clamp(g('aspereza', 0), 0, 1), deriva = g('deriva', 0), drive = clamp(g('drive', 0), 0, 1), ftipo = p.ftipo || 'lp';
      const corte = g('corte', 3000), res = clamp(g('res', .2), 0, 1), envF = g('envF', 0), fdec = Math.max(.02, g('fdec', .3)), kbd = clamp(g('kbd', .3), 0, 1);
      const bend = cPrev ? 0 : g('bend', 0), bendT = Math.max(.005, g('bendT', .15)), glideT = Math.max(.01, g('glide', .2));
      const midi = n.midi, prevMidi = cPrev && lk.prevMidi != null ? lk.prevMidi : midi;

      // estado del generador
      const ph = new Float64Array(V), pm = new Float64Array(V), voff = new Float64Array(V), mp = new Float64Array(V), mamp = new Float64Array(V).fill(1), mhold = new Float64Array(V);
      for (let v = 0; v < V; v++) { voff[v] = V === 1 ? 0 : ((v / (V - 1)) * 2 - 1) * desa; ph[v] = r(); pm[v] = r(); mp[v] = r(); }
      let ph2 = r(), pmo = 0, amPh = r(), dcx = 0, dcy = 0;
      const nDrift = smoothNoise(K, 5, sr), nAmp = smoothNoise(K, 120, sr), nAm = smoothNoise(K, 6, sr);
      let pk0 = 0, pk1 = 0, pk2 = 0, brown = 0;      // ruido rosa (Kellet) y café
      let ic1 = 0, ic2 = 0; const combMax = Math.ceil(sr / 20) + 8, comb = new Float32Array(combMax); let cw = 0;
      let relLevel = 0, relCaptured = false;
      const hasNoise = ruido > 0, tauDec = dec / 4, tauF = fdec / 3;

      for (let i = 0; i < total; i++) {
        const t = i / sr - lead;                            // tiempo desde el inicio de la nota (negativo mientras rellena el hueco anterior)
        // ── tono
        let pitch = midi;
        if (cPrev) { if (t < 0) pitch = prevMidi; else if (mode === 'glide') { const x = clamp(t / glideT, 0, 1); pitch = prevMidi + (midi - prevMidi) * (.5 - .5 * Math.cos(PI * x)); } }
        else if (bend) pitch += bend * Math.exp(-Math.max(0, t) / bendT);
        if (deriva) pitch += deriva * .01 * nDrift() * .5;
        const f0 = mtof(pitch);
        const fenv = cPrev ? 0 : Math.exp(-Math.max(0, t) / tauF);
        // ── generador
        let o = 0;
        const sr_eff = sincr + sincEnv * fenv;
        if (fm > 0) { pmo += f0 * fmR / sr; if (pmo >= 1) pmo -= 1; }
        const fmOff = fm > 0 ? fm * Math.sin(TWO_PI * pmo) / TWO_PI : 0;
        for (let v = 0; v < V; v++) {
          const fv = f0 * Math.pow(2, voff[v] / 1200);
          if (isMotor) {
            mp[v] += fv * (1 + irr * .12 * mhold[v]) / sr;
            if (mp[v] >= 1) { mp[v] -= 1; mamp[v] = 1 + irr * (r() * 2 - 1) * .6; if (fallos > 0 && r() < fallos * .5) mamp[v] *= .15; mhold[v] = r() * 2 - 1; }
            o += mamp[v] * Math.exp(-mp[v] * filo);
          } else {
            const dt = fv / sr; let s;
            if (sr_eff > 1.0001) { pm[v] += dt; if (pm[v] >= 1) { pm[v] -= 1; ph[v] = 0; } ph[v] += dt * sr_eff; if (ph[v] >= 1) ph[v] -= Math.floor(ph[v]); s = ph[v]; }
            else { ph[v] += dt; if (ph[v] >= 1) ph[v] -= 1; s = ph[v]; }
            let pe = s + fmOff; pe -= Math.floor(pe);
            o += wave(pe, Math.min(.45, dt * Math.max(1, sr_eff)), forma, pw);
          }
        }
        o /= Math.sqrt(V);
        if (isMotor) { const y = o - dcx + .995 * dcy; dcx = o; dcy = y; o = y * .8; }       // quita el nivel continuo de los pulsos
        else if (mix2 > 0) {
          const d2 = mtof(pitch + semi2 + fine2 / 100) / sr; ph2 += d2; if (ph2 >= 1) ph2 -= 1;
          o = o * (1 - mix2) + wave(ph2, Math.min(.45, d2), forma2, pw) * mix2;
        }
        // ── ruido
        if (hasNoise) {
          const w = r() * 2 - 1; let nz;
          if (ruidoT === 'rosa') { pk0 = .99765 * pk0 + w * .0990460; pk1 = .96300 * pk1 + w * .2965164; pk2 = .57000 * pk2 + w * 1.0526913; nz = (pk0 + pk1 + pk2 + w * .1848) * .25; }
          else if (ruidoT === 'cafe') { brown = (brown + .02 * w) / 1.02; nz = brown * 3.2; } else nz = w * .6;
          o = o * (1 - ruido * .5) + nz * ruido;
        }
        // ── mecánico: dientes y aspereza
        if (am > 0) { amPh += amF * (1 + amIrr * .5 * clamp(nAm(), -2, 2)) / sr; o *= 1 - am * (.5 - .5 * Math.cos(TWO_PI * amPh)); }
        if (asp > 0) o *= 1 - asp * clamp(.5 + .35 * nAmp(), 0, 1);
        // ── filtro
        let fc = corte * Math.pow(2, (pitch - 60) / 12 * kbd) * Math.pow(2, envF * fenv * 5);
        fc = clamp(fc, 20, sr * .45);
        let y;
        if (ftipo === 'peine') {
          const dly = clamp(sr / fc, 2, combMax - 3), fb = .3 + res * .66; let rp = cw - dly; if (rp < 0) rp += combMax; const i0 = Math.floor(rp), fr = rp - i0, a0 = comb[i0 % combMax], a1 = comb[(i0 + 1) % combMax];
          y = o + fb * (a0 + (a1 - a0) * fr); comb[cw] = y; cw = (cw + 1) % combMax; y *= 1 - fb * .45;
        } else {
          const gg = Math.tan(PI * fc / sr), Q = .6 + res * res * 18, k = 1 / Q, a1 = 1 / (1 + gg * (gg + k)), a2 = gg * a1, a3 = gg * a2;
          const v3 = o - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3; ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
          y = ftipo === 'bp' ? v1 * k * 1.4 : ftipo === 'hp' ? o - k * v1 - v2 : v2;
        }
        if (drive > 0) { const gd = 1 + drive * 9; y = Math.tanh(y * gd) / Math.sqrt(1 + drive * 2); }
        // ── envolvente de volumen
        let e;
        if (t < 0) e = sus;
        else if (t < n.len) { e = cPrev ? sus : (t < atk ? t / atk : sus + (1 - sus) * Math.exp(-(t - atk) / tauDec)); }
        else {
          if (!relCaptured) { relLevel = cPrev ? sus : (n.len < atk ? n.len / atk : sus + (1 - sus) * Math.exp(-(n.len - atk) / tauDec)); relCaptured = true; }
          e = cNext ? relLevel * Math.max(0, 1 - (t - n.len) / XF) : relLevel * Math.exp(-(t - n.len) * 4.6 / rel);
        }
        if (cPrev) { const fi = Math.min(1, (i / sr) / XF); e *= Math.sqrt(fi); }
        if (cNext && t >= n.len) e = Math.sqrt(Math.max(0, e / Math.max(relLevel, 1e-9))) * relLevel;
        acc[i] = y * e;
      }
      // fundido final para no dejar clic al cortar la cola
      const nf = Math.min(total, Math.floor(.004 * sr)); for (let i = 0; i < nf; i++) acc[total - 1 - i] *= i / nf;
      K.add(n.buf, n.t - lead, lead + n.len + tail, t => acc[Math.round(t * sr)] || 0, n.a * g('gain', 1) * LEVEL, n.pan);
    }
  };
})());
