// ── Cristal FM · plugin de instrumento para Demo Kit ──
// FM de dos operadores con ataque ajustable y vibrato suave. El «Índice FM» se puede automatizar por nota
// (curva de parámetros) y también ajustar nota por nota con su propio slider (noteParams).
registerInstrument({
  id: 'cristalfm',
  name: '💎 Cristal FM',
  kind: 'melodic',
  desc: 'FM brillante de vidrio: modulador con razón ajustable, índice que decae y vibrato suave. El índice se ajusta por nota.',
  noteParams: ['index'],
  params: [
    { k: 'gain',  label: 'Ganancia',        min: 0,   max: 1.5, step: .005, def: .16 },
    { k: 'ratio', label: 'Razón FM',        min: .5,  max: 8,   step: .01,  def: 2 },
    { k: 'index', label: 'Índice FM',       min: 0,   max: 12,  step: .1,   def: 3 },
    { k: 'decay', label: 'Caída (1/s)',     min: .3,  max: 12,  step: .1,   def: 1.6 },
    { k: 'atk',   label: 'Ataque (s)',      min: .002, max: 1,  step: .002, def: .012 },
    { k: 'vib',   label: 'Vibrato',         min: 0,   max: 1,   step: .01,  def: .25 }
  ],
  play(K, n) {
    const p = n.p, f = n.hz, tail = .9, L = n.len + tail, atk = Math.max(.002, p.atk), TAU = 2 * Math.PI;
    K.add(n.buf, n.t, L, t => {
      const rel = t > n.len ? Math.exp(-(t - n.len) * 7) : 1;
      const env = Math.min(1, t / atk) * Math.exp(-t * p.decay * .6) * rel;
      const idx = p.index * Math.exp(-t * p.decay * 1.1);
      const vib = 1 + .0035 * p.vib * Math.sin(TAU * 5.3 * t) * Math.min(1, t * 1.5);
      const ph = TAU * f * vib * t;
      const a = Math.sin(ph + idx * Math.sin(ph * p.ratio));
      const b = Math.sin(ph * 1.004 + idx * .6 * Math.sin(ph * p.ratio * 1.004));
      return (a * .62 + b * .38) * env;
    }, n.a * p.gain, n.pan);
  }
});
