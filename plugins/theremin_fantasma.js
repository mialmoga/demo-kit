// Plugin de instrumento para Demo Kit · Theremin fantasma
// Arrástralo a la ventana del estudio (o «Demos y plugins» → plugin) y aparece como instrumento nuevo.
// Un theremin que no termina de estar afinado: entra deslizándose desde abajo, el vibrato tarda en despertar,
// la afinación deriva sola como si alguien moviera la mano en la oscuridad, y hay un halo de aliento a una octava.
registerInstrument({
  id: 'theremin_fantasma',
  name: '👻 Theremin fantasma',
  kind: 'melodic',
  desc: 'Seno con portamento de entrada, vibrato con retardo, deriva de afinación, aliento y un halo de octava.',
  params: [
    {k:'gain',   label:'Ganancia',                 min:0,   max:1,    step:.005, def:.35},
    {k:'scoop',  label:'Entra desde (semitonos)',  min:-12, max:12,   step:.1,   def:-2.5},
    {k:'glide',  label:'Tiempo de subida (s)',     min:.02, max:1.5,  step:.01,  def:.22},
    {k:'vrate',  label:'Vibrato (Hz)',             min:2,   max:9,    step:.1,   def:5.2},
    {k:'vdepth', label:'Vibrato (cents)',          min:0,   max:80,   step:1,    def:28},
    {k:'vdelay', label:'Vibrato: retardo (s)',     min:0,   max:2,    step:.05,  def:.35},
    {k:'drift',  label:'Deriva fantasma (cents)',  min:0,   max:60,   step:1,    def:12},
    {k:'breath', label:'Aliento',                  min:0,   max:1,    step:.01,  def:.18},
    {k:'halo',   label:'Halo (octava arriba)',     min:0,   max:1,    step:.01,  def:.25},
    {k:'tone',   label:'Brillo (Hz)',              min:400, max:8000, step:10,   def:2600},
    {k:'atk',    label:'Ataque (s)',               min:.005,max:1.5,  step:.005, def:.12},
    {k:'rel',    label:'Release (s)',              min:.02, max:2.5,  step:.01,  def:.5}
  ],
  play(K, n) {
    const p = n.p, sr = n.sr || 44100, TAU = 6.2831853, f0 = n.hz, L = n.len + p.rel;
    // todo el estado vive aquí dentro: cada nota tiene su propia mano en el aire
    const pv = K.rnd() * 3, d1 = K.rnd() * 3, d2 = K.rnd() * 3;
    const lpT = K.lpc(p.tone), lpB = K.lpc(2200);
    let ph = 0, ph2 = 0, y = 0, nz = 0;
    K.add(n.buf, n.t, L, t => {
      const vib = p.vdepth * Math.min(1, Math.max(0, (t - p.vdelay) / .9)) * Math.sin(TAU * p.vrate * t + pv);
      const drf = p.drift * .5 * (Math.sin(TAU * .37 * t + d1) + Math.sin(TAU * .91 * t + d2));
      const scp = p.scoop * Math.exp(-t / p.glide);
      const f = f0 * Math.pow(2, (scp + (vib + drf) / 100) / 12);
      ph += f / sr; ph -= Math.floor(ph);
      ph2 += f * 2.003 / sr; ph2 -= Math.floor(ph2);
      let s = Math.sin(TAU * ph) + .28 * Math.sin(2 * TAU * ph) + .08 * Math.sin(3 * TAU * ph) + p.halo * .5 * Math.sin(TAU * ph2);
      nz += lpB * (K.rnd() - nz);
      s += nz * p.breath * 1.6;
      y += lpT * (s - y);
      const att = Math.min(1, t / p.atk), env = att * att * (3 - 2 * att) * (t > n.len ? Math.max(0, 1 - (t - n.len) / p.rel) : 1);
      return y * env * .6;
    }, n.a * p.gain, n.pan);
  }
});
