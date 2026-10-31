// ── 👻 La casa que respira · demo para Demo Kit ──
// Suspenso de casa embrujada · 84 BPM · Mi frigio con tritono (Mi–Si♭) · 32 compases · bucle limpio.
// Composición: Claude × Brujo · 31-oct-2026. Usa solo funciones nombradas del kit: se convierte en proyecto editable.
// Mapa:  0-3 umbral · 4-11 pasos · 12-19 aparición · 20-25 crecimiento · 26 susto · 27 silencio · 28-31 eco (vuelve al umbral)
// El sidechain no es un bombo: es un LATIDO. La música "respira" al ritmo de un corazón que se acelera y se apaga.
// BPM = 84 | BARS = 32
async function renderCasaQueRespira(sr, onProg) {
  const K = demoKit.metric(sr, 84, 32, 2.5, 20261031);
  const { beat, bar, T, mu, dr, hz, lpc, rnd, add, syn, kick, snare, hat, crash, bell, chop, riser, sweep, snap } = K;
  const BARS = 32, sat = x => x / (1 + Math.abs(x));

  // ── instrumentos propios (nombres que el estudio reconoce → pistas editables) ──
  // reese: tres sierras desafinadas → filtro de 2 polos que respira → saturación (aquí: el zumbido grave de la casa)
  function reese(t0,len,m,a,o){
    const f=hz(m), cents=[-17,0,17], inc=cents.map(c=>f*Math.pow(2,c/1200)/sr), ph=cents.map(()=>rnd()*.5+.5);
    const lfo=o.lfo||0, lo=o.lo||300, hi=o.hi||1400, drive=o.drive||2.2, L=len+.05; let y1=0,y2=0;
    add(mu,t0,L,t=>{ let s=0;
      for(let k=0;k<3;k++){ ph[k]+=inc[k]*(1+.002*Math.sin(t*2.1+k)); ph[k]-=Math.floor(ph[k]); s+=2*ph[k]-1; }
      const c=lpc(lo+(hi-lo)*(.5+.5*Math.sin(6.2831853*lfo*t))); y1+=c*(s/3-y1); y2+=c*(y1-y2);
      return sat(y2*drive)*Math.min(1,t/.01)*Math.min(1,(L-t)/.05)*1.2; },a,0);
  }
  // growl: FM con índice modulado por un LFO → saturación → filtro que respira (aquí: la respiración del monstruo)
  function growl(t0,len,m,a,rate){
    const f=hz(m), L=len+.04; let pc=0,pm=0,y=0;
    add(mu,t0,L,t=>{ pc+=f/sr; pm+=f*2.01/sr; pc-=Math.floor(pc); pm-=Math.floor(pm);
      const lf=.5+.5*Math.sin(6.2831853*rate*t), x=sat(2.5*Math.sin(6.2831853*pc+(1.5+6*lf)*Math.sin(6.2831853*pm)));
      y+=lpc(500+3000*lf)*(x-y);
      return y*Math.min(1,t/.008)*Math.min(1,(L-t)/.04)*1.3; },a,0);
  }
  function rim(t0,a,pan){ let p=0; add(dr,t0,.1,t=>{ const x=rnd(), v=x-p*.5; p=x; return Math.sin(2*Math.PI*880*t)*Math.exp(-t*70)+v*Math.exp(-t*90)*.6; },a,pan); }   // el tic-tac del reloj
  function wash(t0,len,a,fc){ let y=0; add(mu,t0,len,t=>{ y+=lpc(fc)*(rnd()-y); return y*Math.min(1,t/.8)*Math.min(1,(len-t)/.8); },a,0); }   // viento por los pasillos
  function impact(t0,a){ add(mu,t0,1.1,t=>Math.sin(2*Math.PI*(35*t+(85/3)*(1-Math.exp(-3*t))))*Math.exp(-t*2.6),a,0); }   // sub que cae

  // ── el latido: dos golpes graves (lub-dub) que además agachan la música ──
  const ducks = [];
  const HB = { lo: 40, hi: 92, k: 24, dec: 9, len: .55, click: .03 };
  const latido = (t, a, d) => { kick(t, a, HB); kick(t + beat * .62, a * .66, HB); ducks.push([t, d], [t + beat * .62, d * .7]); };

  // ── material musical ──
  const sec = b => b < 4 ? 0 : b < 12 ? 1 : b < 20 ? 2 : b < 26 ? 3 : b === 26 ? 4 : b === 27 ? 5 : 6;
  const CH = [[52, 59, 65], [52, 59, 65], [53, 57, 60], [52, 58, 64]];   // Mi+Fa+Si · Fa mayor (♭II) · Mi con Si♭ (tritono)
  const BASS = [                                                         // bajo sigiloso: [pulso, MIDI]
    [[0, 40], [1.5, 40], [2, 47], [3.25, 46]],
    [[0, 40], [1.5, 43], [2, 41], [3, 40]],
    [[0, 41], [1.5, 41], [2, 48], [3.25, 47]],
    [[0, 40], [1.5, 40], [2, 46], [3.5, 46]]];
  const MA = [[0, 0, 76], [0, 1, 77], [0, 2, 76], [0, 3.5, 70], [1, 0, 79], [1, 1.5, 77], [1, 2.5, 76], [1, 3.25, 70]];   // [compás, pulso, MIDI]
  const MB = [[0, 0, 76], [0, 1.5, 79], [0, 2, 77], [0, 3.5, 82], [1, 0, 81], [1, 1, 77], [1, 2, 76], [1, 3.5, 70]];
  const frase = (b0, M, sh, a, eco) => {                                 // campana de caja de música + eco ping-pong
    for (const [o, p, m] of M) {
      const t = T(b0 + o, p), pan = m % 2 ? -.4 : .4;
      bell(t, m + sh, a, pan, 1.8);
      if (eco) bell(t + beat * .75, m + sh, a * eco, -pan, 1.4);
    }
  };

  for (let b = 0; b < BARS; b++) {
    const S = sec(b), t0 = T(b, 0), ch = CH[b % 4];

    // viento por la casa (cada 4 compases; el del compás 24 atraviesa el susto y el silencio)
    if (b % 4 === 0) wash(t0, bar * 4, [.05, .04, .035, .07, 0, 0, .04][S], [900, 700, 600, 1400, 0, 0, 800][S]);
    if (b === 0) sweep(T(0, .3), 2.4, 140, 330, .06);                          // la puerta que se abre

    // zumbido grave (Mi) y su tritono (Si♭)
    if (b === 0 || b === 4 || b === 8 || b === 28) reese(t0, bar * 4, 28, b === 0 || b === 28 ? .22 : .2, { lfo: 1 / (bar * 2), lo: 90, hi: 420, drive: 1.6 });
    if (b === 2 || b === 12 || b === 16) reese(t0, bar * (b === 2 ? 2 : 4), 34, b === 2 ? .1 : .14, { lfo: 1 / bar, lo: 100, hi: 380, drive: 1.4 });
    if (b === 12 || b === 16) reese(t0, bar * 4, 28, .2, { lfo: 1 / (bar * 2), lo: 90, hi: 460, drive: 1.7 });
    if (S === 3) reese(t0, bar * (b === 25 ? .84 : 1), 28, .19, { lfo: (1 + (b - 20) * .5) / bar, lo: 90, hi: 500 + (b - 20) * 120, drive: 1.9 });

    // pad oscuro (se corta en seco antes del susto)
    if (S !== 4 && S !== 5) {
      const pa = [.03 + .01 * b, .08, .11, .11, 0, 0, .07][S], lp = [500, 650, 800, 1100, 0, 0, 600][S];
      for (const m of ch) syn(mu, t0, bar * (b === 25 ? .78 : .97), hz(m), pa, ((m % 5) - 2) * .18, { w: 0, atk: .9, rel: .8, det: [-14, 0, 14], lp });
    }

    // pasos: bajo sigiloso + tic-tac + madera que cruje
    if (S >= 1 && S <= 3) {
      for (const [p, m] of BASS[b % 4])
        syn(mu, T(b, p), beat * .3, hz(m), S === 3 ? .4 : .34, 0, { w: 0, atk: .004, rel: .05, dec: 5, lp: t => 200 + 1600 * Math.exp(-t * 14) });
      const n = S === 3 ? 8 : 4;
      for (let i = 0; i < (b === 25 ? 6 : n); i++) if (S !== 1 || i % 2) rim(T(b, S === 3 ? i / 2 : i), .07 + .02 * (S - 1), i % 2 ? .5 : -.5);
      if (S < 3 && b % 2) snap(T(b, 2.5), .22, .35);
    }

    // el latido
    if (S === 0 && b >= 2) latido(t0, .3, .2);
    if (S === 1) latido(t0, .5, .4);
    if (S === 2) { latido(t0, .55, .45); latido(T(b, 2), .45, .38); }
    if (S === 3) for (let i = 0; i < (b < 22 ? 2 : 4); i++) latido(T(b, b < 22 ? i * 2 : i), .6 + .04 * (b - 20), .5);
    if (b === 28) { latido(t0, .4, .3); latido(T(b, 2), .3, .25); }
    if (b === 29) latido(t0, .3, .25);
    if (b === 30) latido(t0, .2, .15);

    // la caja de música aparece de lejos
    if (b === 3) bell(T(3, 2.5), 76, .06, .4, 2.5);
    if (b === 8 || b === 10) bell(T(b, 3.5), 70, .06, -.4, 2);
    if (S === 2 && b % 2 === 0) frase(b, ((b - 12) / 2) % 2 ? MB : MA, b >= 16 ? 12 : 0, .1, b >= 16 ? .45 : .3);

    // coro fantasma
    if (S === 2) { const v = b < 16 ? 'oo' : 'oh'; chop(t0, beat * 3.4, ch[1] + 12, .2, -.35, v); chop(t0, beat * 3.4, ch[2] + 12, .17, .35, v); }
    if (S === 3) { chop(t0, beat * 3.6, ch[0] + 24, .26, -.25, 'ah'); chop(t0, beat * 3.6, ch[2] + 12, .22, .25, 'ah'); }

    // crecimiento: hi-hats en trémolo, growl, riser y redoble
    if (S === 3) {
      const n = b < 24 ? 8 : 16;
      for (let i = 0; i < (b === 25 ? 14 : n); i++) hat(T(b, i * 4 / n), .05 + .025 * (b - 20), false, i % 2 ? .3 : -.3);
      growl(t0, bar * (b === 25 ? .84 : .97), 40, .07 + .012 * (b - 20), (1 + (b - 20) * .35) / bar);
    }
    if (b === 11) { riser(T(11, 0), bar, .12); sweep(T(11, 1), beat * 7, 180, 900, .1); }
    if (b === 24) { riser(t0, bar * 2 - beat * .6, .45); sweep(t0, bar * 2 - beat * .6, 220, 1760, .14); }   // se cortan antes del golpe: medio pulso de vacío con solo el latido
    if (b === 25) for (let i = 0; i < 14; i++) snare(T(25, i / 4), .08 + .025 * i);

    // ¡el susto!
    if (b === 26) {
      impact(t0, 1); crash(t0, .55, 3.4); kick(t0, 1, { lo: 34, hi: 120, k: 25, dec: 5, len: .6, click: .4 });
      for (const m of [52, 53, 58, 59]) syn(mu, t0, beat * 1.4, hz(m), .2, ((m % 3) - 1) * .4, { w: 0, atk: .003, rel: .3, det: [-18, 0, 18], lp: 4200 });
      chop(t0, bar * .6, 82, .34, 0, 'ee');
    }
    // …y el silencio: solo la habitación y una campana
    if (b === 27) bell(T(27, 3), 64, .12, 0, 3.2);

    // eco: el tema regresa deshecho y la casa vuelve a dormir
    if (b === 28) frase(28, MA, -12, .09, .6);
    if (b === 28 || b === 29) { chop(t0, bar * .9, ch[1] + 12, .12, -.3, 'ah'); chop(t0, bar * .9, ch[2] + 12, .1, .3, 'oo'); }
    if (b === 30) { bell(T(30, 0), 76, .1, -.2, 2.8); bell(T(30, 2.5), 70, .09, .2, 3.2); }

    if (onProg) onProg(b / BARS);
    if (b % 4 === 3) await sleep(0);
  }

  // ── sidechain del latido: una curva que se pinta golpe por golpe (500 muestras/s) y se lee con interpolación ──
  const CR = 500, curve = new Float32Array(Math.ceil(K.n / sr * CR) + 3).fill(1);
  for (const [t, d] of ducks) {
    const i0 = Math.floor(t * CR);
    for (let i = i0; i < Math.min(curve.length, i0 + CR * .8); i++) {
      const dt = (i - i0) / CR, g = 1 - d * Math.min(1, dt / .012) * Math.exp(-dt / .16);
      if (g < curve[i]) curve[i] = g;
    }
  }
  const duckAt = t => { const x = Math.max(0, t * CR), i = Math.min(curve.length - 2, Math.floor(x)), f = x - i; return curve[i] * (1 - f) + curve[i + 1] * f; };

  if (onProg) onProg(1);
  return K.mix(duckAt);
}
