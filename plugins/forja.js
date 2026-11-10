// ──🔥 Forja · plugin de instrumento para Demo Kit ──
// El «instrumento supremo»: un sintetizador de una sola voz por nota con mucho control sobre la onda y el legato, pensado para sonidos
// mecánicos (serruchos, motores, taladros) y, en las siguientes fases, acuosos. Fase 1 (v1.0): núcleo. v1.4: parámetros agrupados en secciones, punto que indica cuáles influyen en el sonido y presets que parten del estado basal. v1.3: fase 3 (generador «Agua»: goteo, burbujeo, arroyo/lluvia, olas; generador «Máquina»: cilindros con orden de encendido, engranes, inercia de arranque y apagado). v1.2: fase 2 (fuente aleatoria con destinos, plegador de onda, crush de bits y de muestreo). v1.1: «Capa ultra» (tabla de ondas con morph, ring mod, tubo resonante, fuerza→corte, LFO, eco ping-pong con cola) y 5 presets más.
//   · Generadores: onda que se mezcla de seno → triángulo → sierra → cuadrada (con ancho de pulso), segunda onda, sincronía dura con barrido,
//     FM, varias voces desafinadas, o «pulsos de motor» (tren de golpes con irregularidad y fallos de encendido), más ruido blanco, rosa o café.
//   · Mecánico: modulación de amplitud (dientes de la sierra), aspereza, deriva de tono, saturación.
//   · Color: filtro resonante (pasabajos, pasabandas, pasaaltos) o peine, con envolvente y seguimiento del teclado.
//   · Legato: si la nota siguiente (o la anterior) está a menos de «Ventana» segundos, no se vuelve a atacar y el tono se desliza (glissando).
//     Con legato activado la pista se vuelve monofónica y el estudio marca las notas que se pisan; con legato apagado suena polifónico.
// Solo usa K.add y K.rnd (con la semilla de la pista): todo está dentro del plugin, así que suena igual con el kit incluido y con cualquiera de los alternos,
// y con el kit Ultimate hereda además su carácter (digital = bit-crush, orgánico, pro, ultra) porque todo pasa por K.add.
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

  // tabla de ondas: 4 ciclos de 2048 muestras con distinto reparto de armónicos; se mezclan por posición (0…3)
  const TN = 2048, TABS = (() => {
    const rec = [h => h % 2 ? 1 / Math.pow(h, 1.6) : 0,
      h => Math.exp(-Math.pow((h - 3) / 1.3, 2)) + .8 * Math.exp(-Math.pow((h - 9) / 2, 2)) + .3 * Math.exp(-Math.pow((h - 14) / 2.5, 2)) + .25 / h,
      h => (h === 1 ? .6 : 0) + ([5, 7, 11, 13, 17, 19, 23].indexOf(h) >= 0 ? .7 / Math.sqrt(h) * 2.2 : 0),
      h => 1 / Math.sqrt(h)];
    return rec.map(f => { const a = new Float32Array(TN); let pk = 0; for (let h = 1; h <= 32; h++) { const w = f(h); if (w < 1e-4) continue; for (let i = 0; i < TN; i++) a[i] += w * Math.sin(TWO_PI * h * i / TN + h * h * .37); }
      for (let i = 0; i < TN; i++) pk = Math.max(pk, Math.abs(a[i])); for (let i = 0; i < TN; i++) a[i] /= pk || 1; return a; });
  })();
  const tab = (p, pos) => { const x = p * TN, i = Math.floor(x) % TN, fr = x - Math.floor(x), j = (i + 1) % TN, k = Math.min(2, Math.floor(pos)), m = pos - k, k2 = k + 1 > 3 ? 3 : k + 1;
    const A = TABS[k], B = TABS[k2]; const a = A[i] + (A[j] - A[i]) * fr, b = B[i] + (B[j] - B[i]) * fr; return a + (b - a) * m; };

  const choice = (k, label, opts, vals, def) => ({ k, label, type: 'choice', opts, vals, def });
  const S = (sec, d) => (d.sec = sec, d);
  const num = (k, label, min, max, step, def) => ({ k, label, min, max, step, def });

  const inst = {
    id: 'forja', name: 'Forja', version: '1.4', kind: 'melodic', cat: 'sinte',
    presetReset: true,
    monoWhen: p => !!p && p.legato && p.legato !== 'off',
    desc: 'Sintetizador de una voz por nota con onda mezclable (seno→sierra→cuadrada), segunda onda, sincronía dura, FM, unísono, ruido, pulsos de motor, filtro resonante y legato con glissando. Presets: Serrucho, Motor diésel, Moto que acelera, Taladro.',
    params: [
      S('Generador', choice('gen', 'Generador', ['Onda', 'Pulsos de motor', 'Tabla de ondas', 'Agua', 'Máquina'], ['onda', 'motor', 'tabla', 'agua', 'maquina'], 'onda')),
      S('Generador', num('morph', 'Tabla: posición', 0, 3, .01, 0)),
      S('Generador', num('morphEnv', 'Tabla: barrido', -3, 3, .05, 0)),
      S('Generador', num('forma', 'Forma de onda', 0, 3, .01, 2)),
      S('Generador', num('pw', 'Ancho de pulso', .05, .95, .01, .5)),
      S('Generador', num('voces', 'Voces', 1, 7, 1, 1)),
      S('Generador', num('desa', 'Desafinación', 0, 60, 1, 12)),
      S('Generador', num('sincr', 'Sincronía', 1, 8, .01, 1)),
      S('Generador', num('sincEnv', 'Sinc. barrido', 0, 8, .05, 0)),
      S('Generador', num('fm', 'FM', 0, 8, .05, 0)),
      S('Generador', num('fmR', 'FM razón', .25, 8, .25, 2)),
      S('Onda 2', num('mix2', 'Mezcla', 0, 1, .01, 0)),
      S('Onda 2', num('forma2', 'Forma', 0, 3, .01, 2)),
      S('Onda 2', num('semi2', 'Semitonos', -24, 24, 1, -12)),
      S('Onda 2', num('fine2', 'Fino (cents)', -50, 50, 1, 0)),
      S('Motor y máquina', num('irr', 'Irregularidad', 0, 1, .01, .3)),
      S('Motor y máquina', num('fallos', 'Fallos', 0, 1, .01, 0)),
      S('Motor y máquina', num('filo', 'Filo', 2, 40, .5, 12)),
      S('Motor y máquina', choice('cil', 'Cilindros', ['1', '2', '4', '6', '8'], ['1', '2', '4', '6', '8'], '4')),
      S('Motor y máquina', num('ordenIrr', 'Desigualdad', 0, 1, .01, .4)),
      S('Motor y máquina', num('engr', 'Engranes', 0, 1, .01, 0)),
      S('Motor y máquina', num('engrD', 'Dientes razón', 1, 24, .1, 7)),
      S('Motor y máquina', num('engrBand', 'Bandas lat.', 0, 1, .01, .4)),
      S('Agua', choice('aguaM', 'Modo', ['Goteo', 'Burbujeo', 'Arroyo / lluvia', 'Olas'], ['gota', 'burb', 'arroyo', 'olas'], 'burb')),
      S('Agua', num('dens', 'Densidad', 1, 400, 1, 30)),
      S('Agua', num('tam', 'Tamaño', 0, 1, .01, .5)),
      S('Agua', num('tamDisp', 'Dispersión', 0, 1, .01, .4)),
      S('Agua', num('corriente', 'Corriente', 0, 1, .01, .4)),
      S('Agua', num('olaHz', 'Olas Hz', .03, 2, .01, .15)),
      S('Ruido y carácter', num('ruido', 'Ruido', 0, 1, .01, 0)),
      S('Ruido y carácter', choice('ruidoT', 'Tipo', ['Blanco', 'Rosa', 'Café (grave)'], ['blanco', 'rosa', 'cafe'], 'blanco')),
      S('Ruido y carácter', num('am', 'Dientes', 0, 1, .01, 0)),
      S('Ruido y carácter', num('amF', 'Dientes Hz', 5, 400, 1, 60)),
      S('Ruido y carácter', num('amIrr', 'Dientes irreg.', 0, 1, .01, .2)),
      S('Ruido y carácter', num('aspereza', 'Aspereza', 0, 1, .01, 0)),
      S('Ruido y carácter', num('deriva', 'Deriva', 0, 100, 1, 0)),
      S('Ruido y carácter', num('drive', 'Saturación', 0, 1, .01, 0)),
      S('Filtro', choice('ftipo', 'Filtro', ['Pasabajos', 'Pasabandas', 'Pasaaltos', 'Peine'], ['lp', 'bp', 'hp', 'peine'], 'lp')),
      S('Filtro', num('corte', 'Corte', 40, 12000, 10, 3000)),
      S('Filtro', num('res', 'Resonancia', 0, 1, .01, .2)),
      S('Filtro', num('envF', 'Envolvente', -1, 1, .05, 0)),
      S('Filtro', num('fdec', 'Caída env.', .02, 3, .01, .3)),
      S('Filtro', num('kbd', 'Sigue la nota', 0, 1, .01, .3)),
      S('Volumen y envolvente', num('gain', 'Volumen', 0, 2, .01, 1)),
      S('Volumen y envolvente', num('atk', 'Ataque (s)', .001, 2, .001, .01)),
      S('Volumen y envolvente', num('dec', 'Caída (s)', .01, 3, .01, .3)),
      S('Volumen y envolvente', num('sus', 'Sostenido', 0, 1, .01, .8)),
      S('Volumen y envolvente', num('rel', 'Relajación (s)', .01, 4, .01, .2)),
      S('Tono', num('bend', 'Caída tono', -24, 24, .5, 0)),
      S('Tono', num('bendT', 'Caída tiempo', .005, 2, .005, .15)),
      S('Tono', num('inercia', 'Inercia', 0, 4, .01, 0)),
      S('Tono', num('arr', 'Arranque (st)', 0, 36, .5, 0)),
      S('Tono', num('apag', 'Apagado (st)', 0, 36, .5, 0)),
      S('Ring, tubo y fuerza', num('ring', 'Ring mezcla', 0, 1, .01, 0)),
      S('Ring, tubo y fuerza', num('ringHz', 'Ring Hz', 0, 2000, 1, 0)),
      S('Ring, tubo y fuerza', num('ringR', 'Ring razón', 0, 8, .01, 0)),
      S('Ring, tubo y fuerza', num('tubo', 'Tubo mezcla', 0, 1, .01, 0)),
      S('Ring, tubo y fuerza', num('tuboHz', 'Tubo Hz', 40, 2000, 1, 180)),
      S('Ring, tubo y fuerza', num('tuboFb', 'Tubo resonancia', 0, .95, .01, .7)),
      S('Ring, tubo y fuerza', num('sens', 'Fuerza → corte', 0, 1, .01, 0)),
      S('LFO', num('lfoHz', 'Velocidad Hz', .05, 30, .05, 4)),
      S('LFO', num('lfoTono', '→ tono', 0, 400, 1, 0)),
      S('LFO', num('lfoCorte', '→ corte', 0, 3, .05, 0)),
      S('LFO', num('lfoAmp', '→ volumen', 0, 1, .01, 0)),
      S('Azar', num('azar', 'Cantidad', 0, 1, .01, 0)),
      S('Azar', num('azarHz', 'Velocidad Hz', .1, 60, .1, 6)),
      S('Azar', num('azarSuave', 'Suavidad', 0, 1, .01, .3)),
      S('Azar', num('azarTono', '→ tono', 0, 1200, 5, 0)),
      S('Azar', num('azarCorte', '→ corte', 0, 3, .05, 0)),
      S('Azar', num('azarForma', '→ forma/tabla', 0, 3, .05, 0)),
      S('Azar', num('azarFold', '→ plegador', 0, 1, .01, 0)),
      S('Azar', num('azarAmp', '→ volumen', 0, 1, .01, 0)),
      S('Destructivos', num('fold', 'Plegador', 0, 1, .01, 0)),
      S('Destructivos', num('bits', 'Bits (16=off)', 2, 16, 1, 16)),
      S('Destructivos', num('rate', 'Retención', 1, 60, 1, 1)),
      S('Eco', num('eco', 'Eco mezcla', 0, 1, .01, 0)),
      S('Eco', choice('ecoT', 'Tiempo', ['1/16', '1/8', '3/16', '1/4', '3/8', '1/2'], ['.25', '.5', '.75', '1', '1.5', '2'], '.75')),
      S('Eco', num('ecoFb', 'Rebotes', 0, .9, .01, .5)),
      S('Legato', choice('legato', 'Legato', ['Apagado (polifónico)', 'Legato (sin reataque)', 'Glissando'], ['off', 'legato', 'glide'], 'off')),
      S('Legato', num('ventana', 'Ventana (s)', 0, 1, .01, .15)),
      S('Legato', num('glide', 'Glissando (s)', .01, 2, .01, .2))
    ],
    presets: {
      'Serrucho': { gain: 1.5, gen: 'onda', forma: 2, voces: 2, desa: 8, sincr: 1.6, sincEnv: 2.2, mix2: .45, forma2: 2, semi2: -12, fine2: 7, ruido: .1, ruidoT: 'rosa', am: .6, amF: 72, amIrr: .55, aspereza: .35, deriva: 14, drive: .4,
        ftipo: 'bp', corte: 1800, res: .5, envF: .3, fdec: .25, kbd: .4, atk: .006, dec: .3, sus: .8, rel: .14, bend: 0, legato: 'off' },
      'Motor diésel': { gen: 'motor', voces: 1, desa: 0, irr: .38, fallos: .08, filo: 14, ruido: .1, ruidoT: 'cafe', am: 0, aspereza: .18, deriva: 10, drive: .5,
        ftipo: 'lp', corte: 520, res: .3, envF: .25, fdec: .5, kbd: .5, atk: .02, dec: .4, sus: .9, rel: .25, bend: 3, bendT: .4, legato: 'off' },
      'Moto que acelera': { gen: 'motor', voces: 1, desa: 0, irr: .22, fallos: .02, filo: 9, ruido: .06, ruidoT: 'cafe', am: 0, aspereza: .12, deriva: 6, drive: .55,
        ftipo: 'lp', corte: 900, res: .35, envF: .15, fdec: .6, kbd: .8, atk: .02, dec: .3, sus: .95, rel: .3, bend: 0, legato: 'glide', ventana: .35, glide: .9 },
      'Turbina': { gain: 1.3, gen: 'tabla', morph: 2.2, morphEnv: .6, voces: 3, desa: 15, ruido: .2, ruidoT: 'blanco', am: .15, amF: 90, amIrr: .4, aspereza: .15, deriva: 12, drive: .2,
        ftipo: 'bp', corte: 1500, res: .55, envF: .4, fdec: 1.2, kbd: .6, sens: .5, atk: .6, dec: 1, sus: .9, rel: .8, bend: -5, bendT: 1.2, lfoHz: .3, lfoCorte: .4, lfoTono: 8, legato: 'glide', ventana: .5, glide: 1.2 },
      'Relojería': { gain: 1.6, gen: 'onda', forma: 1, voces: 1, mix2: .5, forma2: 0, semi2: 19, ring: .55, ringHz: 0, ringR: 3.53, tubo: .35, tuboHz: 880, tuboFb: .8, ruido: 0, am: 0, drive: 0,
        ftipo: 'hp', corte: 700, res: .2, kbd: .8, atk: .001, dec: .06, sus: 0, rel: .06, bend: 0, eco: .25, ecoT: '.5', ecoFb: .35, legato: 'off' },
      'Gotas': { gain: 1.6, gen: 'onda', forma: 0, voces: 1, mix2: .25, forma2: 0, semi2: 12, ring: 0, ruido: 0, am: 0, drive: 0, deriva: 0,
        ftipo: 'lp', corte: 6000, res: .1, kbd: .3, atk: .001, dec: .09, sus: 0, rel: .12, bend: -9, bendT: .05, eco: .55, ecoT: '1.5', ecoFb: .62, legato: 'off' },
      'Burbujas': { gain: 3.2, gen: 'onda', forma: 0, voces: 1, fm: .6, fmR: 1, ruido: .04, ruidoT: 'rosa', am: 0, drive: 0, deriva: 25, aspereza: .1,
        ftipo: 'bp', corte: 1200, res: .35, kbd: .9, sens: .4, atk: .002, dec: .14, sus: 0, rel: .1, bend: -14, bendT: .09, lfoHz: 7, lfoTono: 30, eco: .35, ecoT: '1', ecoFb: .5, legato: 'off' },
      'Submarino': { gain: 1.4, gen: 'tabla', morph: 1, morphEnv: -.5, voces: 2, desa: 9, ruido: .12, ruidoT: 'cafe', am: .1, amF: 5, amIrr: .6, aspereza: .1, deriva: 18, drive: .1,
        ftipo: 'lp', corte: 700, res: .45, envF: -.2, fdec: 1.5, kbd: .4, tubo: .4, tuboHz: 95, tuboFb: .85, atk: .5, dec: 1, sus: .85, rel: 1.4, bend: 2, bendT: 1, lfoHz: .2, lfoCorte: .6, lfoAmp: .25, eco: .45, ecoT: '2', ecoFb: .6, legato: 'off' },
      'Robot averiado': { gain: 1.2, gen: 'onda', forma: 2, voces: 2, desa: 10, mix2: .4, forma2: 3, semi2: -7, fold: .45, bits: 7, rate: 6, azar: .8, azarHz: 11, azarSuave: .1, azarTono: 160, azarCorte: 1.2, azarForma: 1, azarFold: .4, azarAmp: .25, ring: .2, ringR: 1.5,
        ftipo: 'bp', corte: 1400, res: .5, kbd: .5, atk: .004, dec: .25, sus: .7, rel: .12, drive: .3, am: .3, amF: 25, legato: 'off' },
      'Radio rota': { gain: 1.3, gen: 'tabla', morph: 1.5, voces: 2, desa: 20, ruido: .25, ruidoT: 'blanco', bits: 5, rate: 14, fold: .2, azar: .7, azarHz: 4, azarSuave: .6, azarTono: 90, azarCorte: 1.8, azarAmp: .45,
        ftipo: 'bp', corte: 2400, res: .55, kbd: .4, atk: .05, dec: .6, sus: .8, rel: .5, drive: .2, eco: .3, ecoT: '1.5', ecoFb: .45, legato: 'off' },
      'Goteo': { gain: 3, gen: 'agua', aguaM: 'gota', tam: .5, tamDisp: .25, ftipo: 'lp', corte: 7000, res: .1, kbd: .3, envF: 0, atk: .001, dec: .3, sus: 1, rel: .3, drive: 0, am: 0, aspereza: 0, eco: .45, ecoT: '1.5', ecoFb: .55, legato: 'off' },
      'Burbujeo': { gain: 7, gen: 'agua', aguaM: 'burb', dens: 22, tam: .45, tamDisp: .6, corriente: .6, ftipo: 'bp', corte: 1500, res: .3, kbd: .5, envF: 0, atk: .05, dec: .3, sus: 1, rel: .4, drive: 0, am: 0, aspereza: 0, eco: .2, ecoT: '1', ecoFb: .4, legato: 'off' },
      'Arroyo': { gain: 5, gen: 'agua', aguaM: 'arroyo', dens: 150, tam: .75, tamDisp: .6, corriente: .5, ruido: 0, ftipo: 'bp', corte: 3200, res: .3, kbd: .2, envF: 0, atk: .3, dec: .5, sus: 1, rel: .6, drive: 0, deriva: 0, am: 0, aspereza: 0, legato: 'off' },
      'Lluvia': { gain: 2.2, gen: 'agua', aguaM: 'arroyo', dens: 280, tam: .92, tamDisp: .8, corriente: .8, ftipo: 'hp', corte: 2500, res: .15, kbd: .1, envF: 0, atk: .4, dec: .5, sus: 1, rel: .8, drive: 0, am: 0, aspereza: 0, eco: .2, ecoT: '2', ecoFb: .4, legato: 'off' },
      'Olas': { gain: 2.4, gen: 'agua', aguaM: 'olas', olaHz: .13, corriente: .6, ftipo: 'lp', corte: 1800, res: .15, kbd: 0, envF: 0, atk: 1.2, dec: .5, sus: 1, rel: 2, drive: 0, am: 0, aspereza: 0, legato: 'off' },
      'V8': { gain: 1.3, gen: 'maquina', cil: '8', ordenIrr: .55, irr: .25, fallos: 0, filo: 11, ruido: .08, ruidoT: 'cafe', engr: 0, inercia: .35, arr: 6, apag: 8, deriva: 8, drive: .5, am: 0,
        ftipo: 'lp', corte: 700, res: .3, envF: .2, fdec: .4, kbd: .5, atk: .02, dec: .4, sus: .9, rel: .5, bend: 0, legato: 'off' },
      'Bóxer': { gain: 1.3, gen: 'maquina', cil: '4', ordenIrr: .85, irr: .45, fallos: .03, filo: 8, ruido: .06, ruidoT: 'cafe', engr: 0, inercia: .2, arr: 4, apag: 5, deriva: 12, drive: .55, am: 0,
        ftipo: 'lp', corte: 600, res: .35, envF: .15, fdec: .5, kbd: .6, atk: .02, dec: .3, sus: .9, rel: .35, bend: 0, legato: 'off' },
      'Engranes': { gain: 1.2, gen: 'maquina', cil: '2', ordenIrr: .2, irr: .15, filo: 30, engr: .9, engrD: 7.3, engrBand: .6, ruido: .05, ruidoT: 'rosa', inercia: .25, arr: 5, apag: 6, drive: .25, deriva: 6, am: 0,
        ftipo: 'bp', corte: 2200, res: .5, envF: 0, kbd: .5, atk: .05, dec: .3, sus: .9, rel: .3, bend: 0, legato: 'off' },
      'Sirena': { gain: 2.2, gen: 'onda', forma: 1, voces: 2, desa: 6, mix2: 0, ruido: 0, am: 0, aspereza: .05, deriva: 5, drive: .2, lfoHz: .4, lfoTono: 380, inercia: .6, arr: 12, apag: 12,
        ftipo: 'bp', corte: 1500, res: .4, envF: 0, kbd: .5, atk: .05, dec: .3, sus: 1, rel: 1.6, bend: 0, tubo: .15, tuboHz: 400, tuboFb: .6, legato: 'off' },
      'Turbo-dron': { gain: 1.9, gen: 'maquina', cil: '4', ordenIrr: .3, irr: .2, filo: 20, engr: .7, engrD: 11, engrBand: .3, ruido: .15, ruidoT: 'blanco', inercia: 1.2, arr: 14, apag: 10, drive: .3, deriva: 8, am: 0,
        ftipo: 'bp', corte: 2000, res: .5, envF: .3, fdec: 1.5, kbd: .5, sens: .4, atk: .8, dec: 1, sus: .9, rel: 1.5, tubo: .3, tuboHz: 150, tuboFb: .75, bend: 0, legato: 'glide', ventana: .5, glide: 1.0 },
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
      const isMotor = p.gen === 'motor' || p.gen === 'maquina', V = isMotor ? Math.max(1, Math.round(g('voces', 1))) : clamp(Math.round(g('voces', 1)), 1, 7), desa = g('desa', 12);
      const forma = clamp(g('forma', 2), 0, 3), pw = clamp(g('pw', .5), .05, .95), forma2 = clamp(g('forma2', 2), 0, 3), mix2 = clamp(g('mix2', 0), 0, 1);
      const sincr = Math.max(1, g('sincr', 1)), sincEnv = g('sincEnv', 0), fm = g('fm', 0), fmR = g('fmR', 2);
      const semi2 = g('semi2', -12), fine2 = g('fine2', 0), irr = clamp(g('irr', .3), 0, 1), fallos = clamp(g('fallos', 0), 0, 1), filo = g('filo', 12);
      const ruido = clamp(g('ruido', 0), 0, 1), ruidoT = p.ruidoT || 'blanco', am = clamp(g('am', 0), 0, 1), amF = g('amF', 60), amIrr = clamp(g('amIrr', .2), 0, 1);
      const asp = clamp(g('aspereza', 0), 0, 1), deriva = g('deriva', 0), drive = clamp(g('drive', 0), 0, 1), ftipo = p.ftipo || 'lp';
      const corte = g('corte', 3000), res = clamp(g('res', .2), 0, 1), envF = g('envF', 0), fdec = Math.max(.02, g('fdec', .3)), kbd = clamp(g('kbd', .3), 0, 1);
      const bend = cPrev ? 0 : g('bend', 0), bendT = Math.max(.005, g('bendT', .15)), glideT = Math.max(.01, g('glide', .2));
      const isTab = p.gen === 'tabla', morph = g('morph', 0), morphEnv = g('morphEnv', 0);
      const ring = clamp(g('ring', 0), 0, 1), ringHz = g('ringHz', 0), ringR = g('ringR', 0), tubo = clamp(g('tubo', 0), 0, 1), tuboHz = Math.max(20, g('tuboHz', 180)), tuboFb = clamp(g('tuboFb', .7), 0, .95);
      const sens = clamp(g('sens', 0), 0, 1), lfoHz = g('lfoHz', 4), lfoTono = g('lfoTono', 0), lfoCorte = g('lfoCorte', 0), lfoAmp = clamp(g('lfoAmp', 0), 0, 1);
      const fold = clamp(g('fold', 0), 0, 1), bits = clamp(Math.round(g('bits', 16)), 2, 16), rate = Math.max(1, Math.round(g('rate', 1)));
      const azar = clamp(g('azar', 0), 0, 1), azarHz = Math.max(.1, g('azarHz', 6)), azarSuave = clamp(g('azarSuave', .3), 0, 1), azTono = g('azarTono', 0), azCorte = g('azarCorte', 0), azForma = g('azarForma', 0), azFold = g('azarFold', 0), azAmp = clamp(g('azarAmp', 0), 0, 1);
      const useAz = azar > 0 && (azTono || azCorte || azForma || azFold || azAmp), qLev = Math.pow(2, bits - 1);
      const aguaM = p.aguaM || 'burb', isAgua = p.gen === 'agua', isMaq = p.gen === 'maquina', dens = Math.max(1, g('dens', 30)), tam = clamp(g('tam', .5), 0, 1), tamDisp = clamp(g('tamDisp', .4), 0, 1), corriente = clamp(g('corriente', .4), 0, 1), olaHz = g('olaHz', .15);
      const C = Math.max(1, parseInt(p.cil || 4)), ordenIrr = clamp(g('ordenIrr', .4), 0, 1), engr = clamp(g('engr', 0), 0, 1), engrD = g('engrD', 7), engrBand = clamp(g('engrBand', .4), 0, 1), inercia = Math.max(0, g('inercia', 0)), arr = g('arr', 0), apag = g('apag', 0);
      const eco = clamp(g('eco', 0), 0, 1), ecoFb = clamp(g('ecoFb', .5), 0, .9), ecoD = (+p.ecoT || .75) * (K.beat || .5);
      const midi = n.midi, prevMidi = cPrev && lk.prevMidi != null ? lk.prevMidi : midi;

      // estado del generador
      const ph = new Float64Array(V), pm = new Float64Array(V), voff = new Float64Array(V), mp = new Float64Array(V), mamp = new Float64Array(V).fill(1), mhold = new Float64Array(V);
      for (let v = 0; v < V; v++) { voff[v] = V === 1 ? 0 : ((v / (V - 1)) * 2 - 1) * desa; ph[v] = r(); pm[v] = r(); mp[v] = r(); }
      let ph2 = r(), pmo = 0, amPh = r(), dcx = 0, dcy = 0;
      const nDrift = smoothNoise(K, 5, sr), nAmp = smoothNoise(K, 120, sr), nAm = smoothNoise(K, 6, sr);
      let pk0 = 0, pk1 = 0, pk2 = 0, brown = 0;      // ruido rosa (Kellet) y café
      let ic1 = 0, ic2 = 0; const combMax = Math.ceil(sr / 20) + 8, comb = new Float32Array(combMax); let cw = 0;
      const cyl = new Float64Array(C); for (let c = 0; c < C; c++) cyl[c] = 1 + ordenIrr * (r() * 2 - 1) * .7; const mcnt = new Int32Array(V);
      const BM = 32, bf = new Float64Array(BM), bph = new Float64Array(BM), bam = new Float64Array(BM), btau = new Float64Array(BM), bdf = new Float64Array(BM), ben = new Float64Array(BM), ba0 = new Float64Array(BM); let bn = 0, gph = 0, gbp = 0, ps = null, wsw = 0;
      const pc = inercia > 0 ? 1 - Math.exp(-1 / (inercia * sr)) : 1;
      let rv = 0, rtarget = 0, rcount = 0, rstep = Math.max(1, Math.round(sr / azarHz)), hold = 0, holdN = 0, relLevel = 0, relCaptured = false, rph = 0, lph = 0; const comb2 = new Float32Array(combMax); let cw2 = 0;
      const hasNoise = ruido > 0, tauDec = dec / 4, tauF = fdec / 3;

      for (let i = 0; i < total; i++) {
        const t = i / sr - lead;                            // tiempo desde el inicio de la nota (negativo mientras rellena el hueco anterior)
        // ── tono
        let pitch = midi;
        if (cPrev) { if (t < 0) pitch = prevMidi; else if (mode === 'glide') { const x = clamp(t / glideT, 0, 1); pitch = prevMidi + (midi - prevMidi) * (.5 - .5 * Math.cos(PI * x)); } }
        else if (bend) pitch += bend * Math.exp(-Math.max(0, t) / bendT);
        if (inercia > 0 || arr > 0) { if (ps === null) ps = pitch - arr; ps += (pitch - ps) * pc; pitch = ps; }
        if (apag > 0 && t > n.len && !cNext) pitch -= apag * clamp((t - n.len) / rel, 0, 1);
        if (useAz) { if (--rcount <= 0) { rcount = Math.max(1, Math.round(rstep * (.6 + .8 * r()))); rtarget = r() * 2 - 1; } rv += (rtarget - rv) * (azarSuave > 0 ? 1 - Math.exp(-1 / (azarSuave * rstep * .5 + 1)) : 1); }
        const az = useAz ? rv * azar : 0;
        const lfo = (lfoTono || lfoCorte || lfoAmp) ? (lph += lfoHz / sr, Math.sin(TWO_PI * lph)) : 0;
        if (azTono) pitch += azTono * .01 * az;
        if (lfoTono) pitch += lfoTono * .01 * lfo;
        if (deriva) pitch += deriva * .01 * nDrift() * .5;
        const f0 = mtof(pitch);
        const fenv = cPrev ? 0 : Math.exp(-Math.max(0, t) / tauF);
        // ── generador
        let o = 0;
        const sr_eff = sincr + sincEnv * fenv;
        if (fm > 0) { pmo += f0 * fmR / sr; if (pmo >= 1) pmo -= 1; }
        const fmOff = fm > 0 ? fm * Math.sin(TWO_PI * pmo) / TWO_PI : 0;
        if (isAgua) {
          const sw = aguaM === 'olas' ? (wsw += olaHz / sr, Math.pow(.5 + .5 * Math.sin(TWO_PI * wsw) * (1 - corriente * .3 * Math.sin(TWO_PI * wsw * .37 + 1)), 2)) : 1;
          const spawnP = aguaM === 'gota' ? (i === Math.round(lead * sr) ? 1 : 0) : aguaM === 'burb' ? dens / sr * (1 + corriente * .8 * nAm()) : aguaM === 'arroyo' ? dens / sr * (1 + corriente * .7 * nAm()) : 0;
          if (spawnP > 0 && r() < spawnP) {
            const oct = (.5 - tam) * 2 + tamDisp * (r() * 2 - 1) * 1.6 * (aguaM === 'arroyo' ? 1.3 : 1), fb = clamp(f0 * Math.pow(2, oct), 60, sr * .4); let k = bn < BM ? bn++ : 0;
            if (bn === BM) { let m = 1e9; for (let q = 0; q < BM; q++) if (bam[q] < m) { m = bam[q]; k = q; } }
            bf[k] = fb; bph[k] = 0; ben[k] = 1; ba0[k] = (aguaM === 'arroyo' ? .35 : .8) * (.4 + .6 * r()); bam[k] = ba0[k]; btau[k] = clamp(7 / fb, .006, .09) * (aguaM === 'gota' ? 1.6 : 1); bdf[k] = (.22 + .2 * r()) * (aguaM === 'gota' ? 2.2 : 1);
          }
          let sum = 0;
          for (let q = 0; q < bn; q++) { if (bam[q] < 1e-4) continue; bph[q] += bf[q] * (1 + bdf[q] * (1 - ben[q])) / sr; if (bph[q] >= 1) bph[q] -= 1; sum += Math.sin(TWO_PI * bph[q]) * bam[q]; ben[q] *= Math.exp(-1 / (btau[q] * sr)); bam[q] = ba0[q] * ben[q]; }
          o = sum * .5;
          if (aguaM === 'olas') o += (r() * 2 - 1) * .6 * sw;
          else if (aguaM === 'arroyo') o += (r() * 2 - 1) * .12 * (1 + corriente * nAm() * .5);
        }
        else for (let v = 0; v < V; v++) {
          const fv = f0 * Math.pow(2, voff[v] / 1200);
          if (isMotor) {
            mp[v] += fv * (1 + irr * .12 * mhold[v]) / sr;
            if (mp[v] >= 1) { mp[v] -= 1; mamp[v] = (isMaq ? cyl[mcnt[v]++ % C] : 1) * (1 + irr * (r() * 2 - 1) * .6); if (fallos > 0 && r() < fallos * .5) mamp[v] *= .15; mhold[v] = r() * 2 - 1; }
            o += mamp[v] * Math.exp(-mp[v] * filo);
          } else {
            const dt = fv / sr; let s;
            if (sr_eff > 1.0001) { pm[v] += dt; if (pm[v] >= 1) { pm[v] -= 1; ph[v] = 0; } ph[v] += dt * sr_eff; if (ph[v] >= 1) ph[v] -= Math.floor(ph[v]); s = ph[v]; }
            else { ph[v] += dt; if (ph[v] >= 1) ph[v] -= 1; s = ph[v]; }
            let pe = s + fmOff; pe -= Math.floor(pe);
            o += isTab ? tab(pe, clamp(morph + morphEnv * fenv + azForma * az, 0, 3)) : wave(pe, Math.min(.45, dt * Math.max(1, sr_eff)), clamp(forma + azForma * az, 0, 3), pw);
          }
        }
        o /= Math.sqrt(V);
        if (isMotor) { const y = o - dcx + .995 * dcy; dcx = o; dcy = y; o = y * .8; }       // quita el nivel continuo de los pulsos
        else if (mix2 > 0 && !isTab && !isAgua) {
          const d2 = mtof(pitch + semi2 + fine2 / 100) / sr; ph2 += d2; if (ph2 >= 1) ph2 -= 1;
          o = o * (1 - mix2) + wave(ph2, Math.min(.45, d2), forma2, pw) * mix2;
        }
        if (engr > 0) { gph += f0 * engrD / sr; if (gph >= 1) gph -= Math.floor(gph); gbp += f0 / sr; if (gbp >= 1) gbp -= Math.floor(gbp); o += engr * .45 * Math.sin(TWO_PI * gph) * (1 + engrBand * Math.sin(TWO_PI * gbp)) / (1 + engrBand); }
        // ── ruido
        if (hasNoise) {
          const w = r() * 2 - 1; let nz;
          if (ruidoT === 'rosa') { pk0 = .99765 * pk0 + w * .0990460; pk1 = .96300 * pk1 + w * .2965164; pk2 = .57000 * pk2 + w * 1.0526913; nz = (pk0 + pk1 + pk2 + w * .1848) * .25; }
          else if (ruidoT === 'cafe') { brown = (brown + .02 * w) / 1.02; nz = brown * 3.2; } else nz = w * .6;
          o = o * (1 - ruido * .5) + nz * ruido;
        }
        // ── mecánico: dientes y aspereza
        if (am > 0) { amPh += amF * (1 + amIrr * .5 * clamp(nAm(), -2, 2)) / sr; o *= 1 - am * (.5 - .5 * Math.cos(TWO_PI * amPh)); }
        if (fold > 0 || azFold) { const kf = 1 + clamp(fold + azFold * az, 0, 1.5) * 7; o = Math.sin(o * kf * 1.5707963); }
        if (asp > 0) o *= 1 - asp * clamp(.5 + .35 * nAmp(), 0, 1);
        if (ring > 0) { rph += (ringHz + ringR * f0) / sr; if (rph >= 1) rph -= Math.floor(rph); o = o * (1 - ring) + o * Math.sin(TWO_PI * rph) * ring * 1.4; }
        // ── filtro
        let fc = corte * Math.pow(2, (pitch - 60) / 12 * kbd) * Math.pow(2, envF * fenv * 5) * Math.pow(2, sens * (clamp(n.a, 0, 1.5) - .7) * 4 + lfoCorte * lfo + azCorte * az);
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
        if (tubo > 0) { const dl = clamp(sr / tuboHz, 2, combMax - 3); let rp = cw2 - dl; if (rp < 0) rp += combMax; const i0 = Math.floor(rp), fr = rp - i0, a0 = comb2[i0 % combMax], a1 = comb2[(i0 + 1) % combMax];
          const w = y + tuboFb * (a0 + (a1 - a0) * fr); comb2[cw2] = w; cw2 = (cw2 + 1) % combMax; y = y * (1 - tubo) + w * tubo * (1 - tuboFb * .5); }
        if (bits < 16 || rate > 1) { if (holdN-- <= 0) { holdN = rate - 1; hold = bits < 16 ? Math.round(y * qLev) / qLev : y; } y = hold; }
        if (azAmp > 0 && useAz) y *= 1 - azAmp * (.5 - .5 * az);
        if (lfoAmp > 0) y *= 1 - lfoAmp * (.5 + .5 * lfo);
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
      const fn = t => acc[Math.round(t * sr)] || 0, amp = n.a * g('gain', 1) * LEVEL, t0 = n.t - lead, dur = lead + n.len + tail, pan0 = n.pan || 0;
      K.add(n.buf, t0, dur, fn, amp, pan0);
      if (eco > 0) for (let k = 1, a = eco; k <= 8 && a > .02; k++, a *= ecoFb) K.add(n.buf, t0 + k * ecoD, dur, fn, amp * a, clamp(pan0 + (k % 2 ? .75 : -.75), -1, 1));
    }
  };
  // ── qué parámetros influyen hoy (punto encendido en el inspector) ──
  const DEF = {}; for (const d of inst.params) DEF[d.k] = d.def;
  const v = (p, k) => p[k] == null ? DEF[k] : +p[k], gen = p => p.gen || 'onda', ag = p => p.aguaM || 'burb';
  const motorish = p => gen(p) === 'motor' || gen(p) === 'maquina', osc = p => gen(p) === 'onda' || gen(p) === 'tabla', lg = p => (p.legato || 'off') !== 'off';
  const useAz = p => v(p, 'azar') > 0 && (v(p, 'azarTono') > 0 || v(p, 'azarCorte') > 0 || v(p, 'azarForma') > 0 || v(p, 'azarFold') > 0 || v(p, 'azarAmp') > 0);
  const ON = {
    morph: p => gen(p) === 'tabla', morphEnv: p => gen(p) === 'tabla' && v(p, 'morphEnv') !== 0,
    forma: p => gen(p) === 'onda', pw: p => gen(p) === 'onda' && (v(p, 'forma') > 2 || (v(p, 'mix2') > 0 && v(p, 'forma2') > 2)),
    voces: p => (osc(p) || motorish(p)) && v(p, 'voces') > 1, desa: p => (osc(p) || motorish(p)) && v(p, 'voces') > 1,
    sincr: p => gen(p) === 'onda' && v(p, 'sincr') > 1, sincEnv: p => gen(p) === 'onda' && v(p, 'sincEnv') > 0,
    fm: p => osc(p) && v(p, 'fm') > 0, fmR: p => osc(p) && v(p, 'fm') > 0,
    mix2: p => gen(p) === 'onda' && v(p, 'mix2') > 0, forma2: p => gen(p) === 'onda' && v(p, 'mix2') > 0, semi2: p => gen(p) === 'onda' && v(p, 'mix2') > 0, fine2: p => gen(p) === 'onda' && v(p, 'mix2') > 0,
    irr: motorish, fallos: p => motorish(p) && v(p, 'fallos') > 0, filo: motorish, cil: p => gen(p) === 'maquina', ordenIrr: p => gen(p) === 'maquina',
    aguaM: p => gen(p) === 'agua', dens: p => gen(p) === 'agua' && (ag(p) === 'burb' || ag(p) === 'arroyo'), tam: p => gen(p) === 'agua' && ag(p) !== 'olas',
    tamDisp: p => gen(p) === 'agua' && ag(p) !== 'olas', corriente: p => gen(p) === 'agua', olaHz: p => gen(p) === 'agua' && ag(p) === 'olas',
    ruido: p => v(p, 'ruido') > 0, ruidoT: p => v(p, 'ruido') > 0,
    am: p => v(p, 'am') > 0, amF: p => v(p, 'am') > 0, amIrr: p => v(p, 'am') > 0, aspereza: p => v(p, 'aspereza') > 0, deriva: p => v(p, 'deriva') > 0, drive: p => v(p, 'drive') > 0,
    engr: p => v(p, 'engr') > 0, engrD: p => v(p, 'engr') > 0, engrBand: p => v(p, 'engr') > 0,
    envF: p => v(p, 'envF') !== 0, fdec: p => v(p, 'envF') !== 0 || (gen(p) === 'onda' && v(p, 'sincEnv') > 0) || (gen(p) === 'tabla' && v(p, 'morphEnv') !== 0), kbd: p => v(p, 'kbd') > 0,
    dec: p => v(p, 'sus') < 1,
    bend: p => v(p, 'bend') !== 0, bendT: p => v(p, 'bend') !== 0, inercia: p => v(p, 'inercia') > 0, arr: p => v(p, 'arr') > 0 && v(p, 'inercia') > 0, apag: p => v(p, 'apag') > 0,
    ring: p => v(p, 'ring') > 0 && (v(p, 'ringHz') > 0 || v(p, 'ringR') > 0), ringHz: p => v(p, 'ring') > 0 && v(p, 'ringHz') > 0, ringR: p => v(p, 'ring') > 0 && v(p, 'ringR') > 0,
    tubo: p => v(p, 'tubo') > 0, tuboHz: p => v(p, 'tubo') > 0, tuboFb: p => v(p, 'tubo') > 0, sens: p => v(p, 'sens') > 0,
    lfoHz: p => v(p, 'lfoTono') > 0 || v(p, 'lfoCorte') > 0 || v(p, 'lfoAmp') > 0, lfoTono: p => v(p, 'lfoTono') > 0, lfoCorte: p => v(p, 'lfoCorte') > 0, lfoAmp: p => v(p, 'lfoAmp') > 0,
    azar: useAz, azarHz: useAz, azarSuave: useAz, azarTono: p => v(p, 'azar') > 0 && v(p, 'azarTono') > 0, azarCorte: p => v(p, 'azar') > 0 && v(p, 'azarCorte') > 0,
    azarForma: p => v(p, 'azar') > 0 && v(p, 'azarForma') > 0, azarFold: p => v(p, 'azar') > 0 && v(p, 'azarFold') > 0, azarAmp: p => v(p, 'azar') > 0 && v(p, 'azarAmp') > 0,
    fold: p => v(p, 'fold') > 0 || (v(p, 'azar') > 0 && v(p, 'azarFold') > 0), bits: p => v(p, 'bits') < 16, rate: p => v(p, 'rate') > 1,
    eco: p => v(p, 'eco') > 0, ecoT: p => v(p, 'eco') > 0, ecoFb: p => v(p, 'eco') > 0,
    legato: lg, ventana: lg, glide: p => (p.legato || 'off') === 'glide'
  };
  for (const d of inst.params) if (ON[d.k]) d.on = ON[d.k];
  // los presets parten siempre del estado basal: lo que no mencionan vuelve a su valor por defecto
  for (const k in inst.presets) inst.presets[k] = Object.assign({}, DEF, inst.presets[k]);
  return inst;
})());
