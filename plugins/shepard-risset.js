// Plugin de instrumento para Demo Kit · Shepard–Risset
// Arrástralo al estudio. Una sola nota larga produce el glissando que "sube para siempre":
// varias sinusoides a una octava de distancia suben juntas, y una ventana en frecuencia (campana) hace que
// las de arriba se apaguen mientras otras nacen abajo. El tono cambia, pero la altura general nunca llega.
//   · la altura de la nota es el centro de la campana (con 0 octavas recorridas es una pila fija de octavas)
//   · «octavas recorridas» es un entero: si es entero, la nota termina con la pila alineada igual que empezó
//   · «aceleración» es la razón entre la velocidad final y la inicial (la velocidad crece exponencialmente en el tiempo);
//     con la misma razón que el mapa de tempo, el glissando acelera exactamente con el pulso
registerInstrument({
  id: 'shepard_risset',
  name: 'Shepard–Risset',
  kind: 'melodic',
  desc: 'Glissando infinito: parciales a octavas con ventana en frecuencia. Velocidad creciente (aceleración) y recorrido en octavas enteras.',
  params: [
    {k:'gain',  label:'Ganancia',                       min:0,   max:1,   step:.005, def:.5},
    {k:'octs',  label:'Octavas recorridas en la nota',  min:0,   max:80,  step:1,    def:20},
    {k:'accel', label:'Aceleración (final / inicial)',  min:.25, max:8,   step:.01,  def:2.718},
    {k:'dir',   label:'Dirección',                      type:'choice', opts:['Sube','Baja'], vals:[1,-1], def:1},
    {k:'parts', label:'Parciales (octavas de ancho)',   min:4,   max:12,  step:1,    def:8},
    {k:'bell',  label:'Estrechez de la ventana',        min:.5,  max:4,   step:.05,  def:1.5},
    {k:'atk',   label:'Entrada (s)',                    min:.005,max:4,   step:.005, def:.8},
    {k:'rel',   label:'Salida (s)',                     min:.02, max:4,   step:.01,  def:.3}
  ],
  play(K, n) {
    const p = n.p, sr = n.sr || 44100, TAU = 6.2831853, N = Math.round(p.parts), len = n.len, L = len + p.rel;
    const fB = n.hz / Math.pow(2, N / 2);                       // la nota cae en el centro de la campana
    const lnA = Math.log(p.accel), flat = Math.abs(p.accel - 1) < 1e-4;
    const r0 = flat ? p.octs / len : p.octs * lnA / ((p.accel - 1) * len);   // octavas/s iniciales: ∫ r0·accel^(t/len) dt = octs
    const ph = new Float64Array(N); for (let i = 0; i < N; i++) ph[i] = (K.rnd() + 1) / 2;
    const ex = 2 * p.bell; let x = 0;
    K.add(n.buf, n.t, L, t => {
      if (t <= len) x += p.dir * r0 * Math.exp(lnA * t / len) / sr;   // posición del glissando, en octavas
      let s = 0;
      for (let i = 0; i < N; i++) {
        let u = (i + x) % N; if (u < 0) u += N;                    // posición del parcial dentro de la pila
        const f = fB * Math.pow(2, u);
        ph[i] += f / sr; ph[i] -= Math.floor(ph[i]);
        if (f < sr * .45) s += Math.pow(Math.sin(Math.PI * u / N), ex) * Math.sin(TAU * ph[i]);
      }
      const a = Math.min(1, t / p.atk), env = a * a * (3 - 2 * a) * (t > len ? Math.max(0, 1 - (t - len) / p.rel) : 1);
      return s * env * (.55 / Math.sqrt(N));
    }, n.a * p.gain, n.pan);
  }
});
