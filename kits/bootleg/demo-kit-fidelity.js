// ════════════════════════════════════════════════════════════════════════════
//  DEMO KIT · versión COMENTADA («gemelo» de demo_kit.js)
// ════════════════════════════════════════════════════════════════════════════
//
//  Este archivo hace EXACTAMENTE lo mismo que demo_kit.js: con la misma semilla produce el mismo
//  audio, muestra por muestra (está comprobado). La única diferencia es que aquí cada pieza viene
//  explicada con calma, pensando en alguien que nunca ha hecho síntesis de sonido.
//  Si solo quieres usar el kit, no necesitas leer esto: mira kits/REFERENCIA.md.
//  Si quieres ENTENDER cómo suena lo que suena, sigue leyendo de arriba a abajo.
//
//  ── La idea en 30 segundos ──────────────────────────────────────────────────
//  Un sonido digital es una lista larguísima de números. Cada número dice «qué tan separado de su
//  posición de reposo está el parlante en este instante» (entre −1 y 1). A 44 100 números por
//  segundo, el oído lo oye como sonido continuo. A cada número lo llamamos una MUESTRA.
//
//  Este kit no usa grabaciones: CALCULA esos números con fórmulas.
//    · un seno (la onda más pura) calculado muestra a muestra suena a «piiii»
//    · ruido aleatorio suena a «shhh» (platillos, caja, hi-hat)
//    · multiplicar por una curva que baja (una envolvente) hace que el sonido se apague solo
//  Con esas tres ideas se hace casi todo.
//
//  ── Vocabulario que verás ───────────────────────────────────────────────────
//   sr ......... «sample rate»: muestras por segundo (normalmente 44100).
//   t0 ......... segundo en el que EMPIEZA un sonido dentro de la canción.
//   a .......... amplitud: qué tan fuerte (1 = fuerte, 0.1 = bajito).
//   pan ........ de qué lado suena: −1 = izquierda, 0 = centro, 1 = derecha.
//   Hz ......... ciclos por segundo = qué tan agudo es un sonido (440 Hz = la nota La).
//   MIDI ....... número de nota de piano: 60 = Do central, 69 = La (440 Hz), cada +1 = un semitono.
//   envolvente . curva que dice cómo cambia el volumen con el tiempo (golpe rápido → se apaga).
//   filtro ..... algo que quita agudos (pasa-bajos) para que el sonido sea más «oscuro» o «suave».
//   sidechain .. bajar el volumen de la música cada vez que suena el bombo, para que «respire».
//
// ════════════════════════════════════════════════════════════════════════════

// demoKit(sr, seconds, seed0) crea UN «estudio de grabación» en memoria y devuelve las herramientas.
//   sr ...... muestras por segundo
//   seconds . duración total de la canción (incluye la cola final)
//   seed0 ... semilla del ruido: con la misma semilla, el «aleatorio» sale igual siempre
function demoKit(sr,seconds,seed0){

  // ── 1. Las «pistas» donde se escribe el sonido ─────────────────────────────
  // n = cuántas muestras tiene toda la canción (segundos × muestras por segundo, redondeado hacia arriba).
  const n=Math.ceil(seconds*sr);

  // Hay DOS canales de mezcla, cada uno estéreo (izquierda + derecha):
  //   dr = «drums» (batería): no se toca con el sidechain.
  //   mu = «music» (música): baja de volumen cada vez que suena el bombo.
  // Float32Array = una lista de n números decimales, todos empiezan en 0 (silencio).
  const dr=[new Float32Array(n),new Float32Array(n)], mu=[new Float32Array(n),new Float32Array(n)];

  // ── 2. Aleatorio «de mentiritas» pero repetible ────────────────────────────
  // Una computadora no puede inventar azar de verdad; usa una fórmula que da números que PARECEN
  // al azar. Esta se llama «congruencial lineal»: cada número sale del anterior con una
  // multiplicación y una suma. Si arrancas con la misma semilla, sale la misma secuencia.
  let seed=seed0||20261015;           // si no pasas semilla, usa esta
  const rnd=()=>{
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;   // «>>>0» fuerza a que sea un entero positivo de 32 bits
    return seed/2147483648-1;                         // lo convierte a un número entre −1 y 1
  };

  // ── 3. Dos conversiones útiles ─────────────────────────────────────────────
  // MIDI → Hz. En música, subir 12 notas = el doble de frecuencia. Por eso la fórmula usa «2 elevado a…».
  // Ejemplo: hz(69) = 440 · hz(81) = 880 (una octava arriba) · hz(60) ≈ 261.6 (Do central).
  const hz=m=>440*Math.pow(2,(m-69)/12);

  // «Coeficiente de filtro» (lpc = low-pass coefficient). Dado un número en Hz, devuelve un valor
  // entre 0 y 1 para el filtro pasa-bajos más simple que existe (ver «filtros» más abajo):
  // cerca de 0 = filtra mucho (suena sordo), cerca de 1 = casi no filtra (suena brillante).
  // Math.min(fc, sr*.45) evita pedir frecuencias que el sistema no puede representar.
  const lpc=fc=>1-Math.exp(-2*Math.PI*Math.min(fc,sr*.45)/sr);

  // ── 4. LA herramienta base: add ────────────────────────────────────────────
  // Todo lo demás está construido con esto. Calcula un sonido y lo SUMA (mezcla) en un canal.
  //   buf ... a qué canal va (dr o mu)
  //   t0 .... en qué segundo empieza
  //   len ... cuántos segundos dura
  //   fn .... una función fn(t) que dice cuánto vale el sonido en el instante t (t = segundos desde t0)
  //   amp ... amplitud (volumen)
  //   pan ... −1 izquierda … 1 derecha
  function add(buf,t0,len,fn,amp,pan){
    // Convertimos segundos a posición en la lista de muestras (s0 = primera muestra; N = cuántas).
    // Math.max(0,…) evita empezar antes del inicio; Math.min(…, n-s0) evita pasarse del final.
    const s0=Math.max(0,Math.floor(t0*sr)), N=Math.min(Math.floor(len*sr),n-s0);
    if(N<=0) return;                  // si no cabe ni una muestra, no hay nada que hacer

    // Panorama «de potencia constante»: reparte el sonido entre izquierda y derecha con seno y
    // coseno para que el volumen percibido no cambie al moverlo de lado. El 1.414 (= √2) compensa
    // para que al centro cada lado reciba la ganancia justa.
    const th=((pan||0)+1)*Math.PI/4, gl=amp*Math.cos(th)*1.414, gr=amp*Math.sin(th)*1.414;

    // El bucle: por cada muestra, preguntamos a fn «¿cuánto vale en este instante?» (i/sr = segundos)
    // y lo sumamos (+=) a lo que ya hubiera, así se pueden superponer muchos sonidos.
    for(let i=0;i<N;i++){ const v=fn(i/sr); buf[0][s0+i]+=v*gl; buf[1][s0+i]+=v*gr; }
  }

  // ════════ PERCUSIÓN ════════
  // Cada instrumento es solo una fn(t) bien escogida pasada a add().

  // BOMBO: un seno cuya frecuencia BAJA rapidísimo (de «hi» a «lo»), como un golpe de parche que se afloja.
  //   o.lo ...... frecuencia final grave en Hz (46)      o.hi ... frecuencia inicial (151)
  //   o.k ....... qué tan rápido baja la frecuencia (30) o.dec .. qué tan rápido se apaga (6.5; más alto = más seco)
  //   o.click ... volumen del «clic» inicial (0.3)       o.len .. duración (0.45 s)
  const kick=(t0,a,o)=>{ o=o||{};
    const f1=o.lo||46, f0=o.hi||151, k=o.k||30, dec=o.dec||6.5, cl=o.click==null?.3:o.click;
    add(dr,t0,o.len||.45,t=>
        // 1) El seno con frecuencia descendente (la integral de la frecuencia da la fase; por eso el «1-exp(...)»).
        Math.sin(2*Math.PI*(f1*t+(f0-f1)/k*(1-Math.exp(-k*t))))
        // 2) × envolvente que se apaga exponencialmente (e^(−t·dec))
        *Math.exp(-t*dec)
        // 3) × una subida de 1/800 de segundo para que no empiece con un «pop» brusco
        *Math.min(1,t*800)
        // 4) + un clic muy corto (se apaga en 1/200 s) que le da «ataque» al golpe
        +Math.exp(-t*200)*cl,
      a,0); };                         // pan 0: el bombo siempre va al centro

  // CAJA: ruido blanco (el «shhh») + un tono corto, los dos con envolvente que cae.
  //   o.tone = frecuencia del tono (185 Hz)  o.nd = qué tan rápido se apaga el ruido (20)
  //   o.td = qué tan rápido se apaga el tono (28)  o.len = duración (0.25 s)
  const snare=(t0,a,o)=>{ o=o||{}; let p=0; const tn=o.tone||185, nd=o.nd||20, td=o.td||28;
    add(dr,t0,o.len||.25,t=>{
      const x=rnd();                   // una muestra de ruido, entre −1 y 1
      const v=x-p*.6; p=x;             // «x − 0.6·(muestra anterior)»: quita un poco de graves al ruido (suena más agudo y crujiente)
      return v*Math.exp(-t*nd)*.6 + Math.sin(2*Math.PI*tn*t)*Math.exp(-t*td)*.5;   // ruido + tono
    },a,0); };

  // PALMA: ruido con tres «rebotes» rapidísimos al inicio (como varias manos que no aplauden exactamente juntas) y una cola.
  const clap=(t0,a)=>{ let p=0; add(dr,t0,.3,t=>{ const x=rnd(), v=x-p*.7; p=x;
    // (t%.011): se repite cada 11 milisegundos → genera los rebotes; «t<.033» los limita a los primeros 33 ms.
    // Después queda solo la cola: exp(−14t) · 0.7
    return v*(Math.exp(-(t%.011)*90)*(t<.033?1:0)+Math.exp(-t*14)*.7); },a,0); };

  // CHASQUIDO (snap): un golpecito de ruido muy breve + un tono agudo (1900 Hz) que se apaga rápido. Se puede mover de lado (pan).
  const snap=(t0,a,pan)=>{ let p=0; add(dr,t0,.12,t=>{ const x=rnd(), v=x-p*.9; p=x;
    return v*Math.exp(-t*55)*.8+Math.sin(2*Math.PI*1900*t)*Math.exp(-t*90)*.5; },a,pan||0); };

  // HI-HAT: ruido «afilado» (x − muestra anterior: deja solo los agudos) con envolvente muy rápida.
  // Cerrado: dura .07 s y se apaga con rapidez 75. Abierto: dura .3 s y se apaga con rapidez 13 (suena más largo).
  const hat=(t0,a,open,pan)=>{ let p=0; add(dr,t0,open?.3:.07,t=>{ const x=rnd(), v=x-p; p=x; return v*Math.exp(-t*(open?13:75)); },a,pan||0); };

  // CRASH (platillo): ruido que se apaga lentamente (rapidez 2.2) durante varios segundos.
  const crash=(t0,a,len)=>{ let p=0; add(dr,t0,len||2.4,t=>{ const x=rnd(), v=x-p*.5; p=x; return v*Math.exp(-t*2.2); },a,0); };

  // ════════ SINTETIZADOR ════════
  // La herramienta más versátil. Genera una nota con:
  //   · varias «voces» ligeramente desafinadas (suena más grueso y vivo, como un coro de sierras)
  //   · una forma de onda a elegir
  //   · una envolvente (ataque, caída, cierre)
  //   · un filtro pasa-bajos fijo o que cambia con el tiempo
  //
  //   buf ... dr o mu        t0 ... inicio (s)       len ... duración de la nota (s)
  //   f ..... frecuencia en Hz (¡no MIDI!: usa hz(nota))     a ... amplitud      pan ... lado
  //   o ..... opciones (todas opcionales; puede omitirse):
  //     w: 0 = sierra (brillante y zumbona)  1 = cuadrada (hueca, tipo videojuego)  2 = seno (pura, ideal para graves)
  //     det: lista de desafines en «cents» (centésimas de semitono). [0] = una voz. [-10,10] = dos voces, una más grave y otra más aguda.
  //     atk: tiempo de subida en segundos (.004 = casi instantáneo; .5 = entrada suave tipo pad)
  //     rel: tiempo de cierre al terminar la nota en segundos (.06)
  //     dec: caída continua del volumen (0 = se sostiene; 2–3 = pluck que se apaga)
  //     lp: filtro pasa-bajos en Hz (número fijo) o una función t => Hz para que cambie con el tiempo (3000 por defecto)
  // SYN FIDELITY: osciladores antialias por PolyBLEP + sub + filtro + envolvente.
  // Conserva firma y destino de syn; sin efectos globales ni azar no determinista.
  const polyBlep = (p, dt) => {
    if (p < dt) { const x=p/dt; return x+x-x*x-1; }
    if (p > 1-dt) { const x=(p-1)/dt; return x*x+x+x+1; }
    return 0;
  };
  function syn(buf,t0,len,f,a,pan,o){
    o=o||{};
    const det=o.det||[0], D=Math.max(1,det.length), phases=det.map((_,j)=>((j+1)*0.61803398875)%1);
    const atk=Math.max(.001,o.atk||.008), rel=Math.max(.005,o.rel||.12), decay=o.dec||0;
    const total=len+rel, nTot=Math.floor(total*sr), s0=Math.max(0,Math.floor(t0*sr)), N=Math.min(nTot,n-s0);
    if(N<=0)return;
    let envDecay=1, filterL=0, filterR=0;
    const decayK=Math.exp(-decay/sr), attackK=1/(atk*sr), releaseK=1/(rel*sr);
    const cutoff=o.lp||4200, q=o.Q||.8, coeff=lpc(cutoff);
    const subPhase=0, subInc=Math.max(0,Math.min(.45,sr?f*.5/sr:0));
    const th=((pan||0)+1)*Math.PI/4, gl=a*Math.cos(th)*1.414, gr=a*Math.sin(th)*1.414;
    const shape=o.character||'organic';
    for(let i=0;i<N;i++){
      let l=0,r=0;
      for(let j=0;j<D;j++){
        const freq=Math.min(f*Math.pow(2,det[j]/1200),sr*.45), dt=freq/sr;
        phases[j]+=dt; phases[j]-=Math.floor(phases[j]);
        const p=phases[j];
        let saw=2*p-1-polyBlep(p,dt);
        let square=(p<.5?1:-1)+polyBlep(p,dt)-polyBlep((p+.5)%1,dt);
        let wave=o.w===1?square:o.w===2?Math.sin(2*Math.PI*p):saw;
        // Osciladores abiertos un poco a los lados, manteniendo el centro y la compatibilidad de mezcla.
        const side=D>1?(j/(D-1)*2-1)*.34:0, angle=(side+1)*Math.PI/4;
        l+=wave*Math.cos(angle); r+=wave*Math.sin(angle);
      }
      l/=D; r/=D;
      // Capa sub opcional, seno estable y centrado.
      if(o.sub){ const sub=Math.sin(2*Math.PI*(f*.5)*(i/sr))*o.sub; l+=sub*.5; r+=sub*.5; }
      const t=i/sr, ampEnv=Math.min(1,i*attackK)*envDecay*(i>nTot-Math.floor(rel*sr)?Math.max(0,(nTot-i)*releaseK):1);
      envDecay*=decayK;
      // Filtro suave de una etapa como color tonal; corte fijo evita saltos/CPU excesiva.
      filterL+=coeff*(l-filterL); filterR+=coeff*(r-filterR);
      const vL=Math.tanh(filterL*(o.drive||1.15))*ampEnv, vR=Math.tanh(filterR*(o.drive||1.15))*ampEnv;
      buf[0][s0+i]+=vL*gl; buf[1][s0+i]+=vR*gr;
    }
  }

  // CAMPANA / CAJA DE MÚSICA: tres senos con frecuencias «raras» (1×, 2.76× y 5.4× la nota), no armónicas;
  // esa rareza es lo que suena a metal. Los agudos se apagan más rápido que el grave.
  //   m = nota MIDI (¡aquí sí es MIDI!)   len = duración (1.4 s)
  function bell(t0,m,a,pan,len){
    const f=hz(m), L=len||1.4;
    // Cada fila: [múltiplo de la frecuencia, rapidez con que se apaga, volumen relativo]
    const P=[[1,2.5,1],[2.76,5,.35],[5.4,9,.15]];
    add(mu,t0,L,t=>{ let s=0;
      for(const [r,d,g] of P) s+=Math.sin(6.2831853*f*r*t)*Math.exp(-t*d)*g;   // suma de los tres «parciales»
      return s*Math.min(1,t*600); },                                             // pequeña subida inicial para evitar el pop
      a,pan);
  }

  // SÍLABA CANTADA («chop»): una sierra pasada por DOS filtros resonantes. Cada vocal («a», «e», «o»…) se
  // distingue por dos frecuencias llamadas «formantes» que el tracto vocal refuerza. Aquí las imitamos con
  // dos filtros pasa-banda (dejan pasar solo una franja de frecuencias).
  // bp(fc,Q) crea un filtro pasa-banda centrado en fc Hz; Q = qué tan angosta es la franja.
  // (Es un «biquad»: una fórmula estándar de audio que usa las dos muestras anteriores de entrada y de salida.)
  const bp=(fc,Q)=>{ const w=2*Math.PI*fc/sr, al=Math.sin(w)/(2*Q), a0=1+al, b0=al/a0, b2=-al/a0, a1=-2*Math.cos(w)/a0, a2=(1-al)/a0;
    let x1=0,x2=0,y1=0,y2=0;                    // memoria: dos entradas y dos salidas anteriores
    return x=>{ const y=b0*x+b2*x2-a1*y1-a2*y2; x2=x1; x1=x; y2=y1; y1=y; return y; }; };
  // Los dos formantes (en Hz) de cada vocal que ofrece el kit:
  const VOW={oh:[500,900],ah:[800,1200],ee:[300,2300],oo:[320,800]};
  //   m = nota MIDI    v = vocal: 'oh' 'ah' 'ee' 'oo'
  function chop(t0,len,m,a,pan,v){
    const f=hz(m), F=VOW[v||'oh'], b1=bp(F[0],6), b2=bp(F[1],8); let ph=0; const L=len+.08;
    add(mu,t0,L,t=>{
      ph+=f*(1+.004*Math.sin(t*38))/sr; ph-=Math.floor(ph);   // fase de la sierra con un vibrato muy leve (el sin(t·38))
      const s=2*ph-1;                                          // sierra cruda
      return (b1(s)*1.6+b2(s))                                  // pasa por los dos filtros y se suman
        *Math.min(1,t/.012)                                     // entrada suave de 12 ms
        *Math.exp(-t*(2.2/len))                                 // se apaga a lo largo de la sílaba
        *Math.min(1,(L-t)/.08); },                              // cierre de 80 ms
      a,pan);
  }

  // ════════ TRANSICIONES ════════

  // RISER: ruido que va subiendo en volumen y en brillo durante len segundos (típico antes de un drop).
  function riser(t0,len,a){ let y=0; add(mu,t0,len,t=>{
      const p=t/len, x=rnd();                      // p = avance de 0 a 1
      y+=lpc(250+9000*p*p)*(x-y);                  // filtro pasa-bajos cuyo corte sube de 250 Hz a 9250 Hz (p·p = sube cada vez más rápido)
      return y*(.05+p*p*.9); },a,0); }             // y el volumen también crece (de 5% a 95%)

  // SWEEP: un seno cuya frecuencia sube de f0 a f1 (en Hz) durante len segundos, creciendo en volumen.
  function sweep(t0,len,f0,f1,a){
    const r=f1/f0, c=2*Math.PI*f0*len/Math.log(r);  // constante de la subida exponencial (suena uniforme al oído)
    add(mu,t0,len,t=>Math.sin(c*(Math.pow(r,t/len)-1))*(t/len)*(t/len),a,0); }

  // ════════ MEZCLA FINAL ════════
  // mix(duckAt) junta los canales y entrega el resultado: {L, R, dur}.
  //   duckAt(t) = función que dice cuánto volumen tiene la MÚSICA (mu) en el segundo t: 1 = normal, 0.3 = «agachada».
  //   Es el sidechain: cuando suena el bombo, duckAt baja un momento y la música se hace a un lado.
  function mix(duckAt){
    const L=new Float32Array(n), R=new Float32Array(n), total=n/sr; let peak=0;
    // «soft» = saturación suave: números pequeños pasan casi igual, los grandes se aplastan hacia ±1 sin
    // cortarse de golpe (suena «cálido» en vez de «roto»). Es una curva en S.
    const soft=x=>x<-3?-1:x>3?1:x*(27+x*x)/(27+9*x*x);
    for(let i=0;i<n;i++){
      const t=i/sr, g=duckAt(t);
      // Fundido de salida: en los últimos 0.6 s el volumen baja suavemente a cero.
      const fade=t>total-.6?Math.max(0,(total-t)/.6):1;
      // batería + música×ducking, × 0.9, pasados por la saturación suave, × fundido
      L[i]=soft((dr[0][i]+mu[0][i]*g)*.9)*fade; R[i]=soft((dr[1][i]+mu[1][i]*g)*.9)*fade;
      const a=Math.max(Math.abs(L[i]),Math.abs(R[i])); if(a>peak) peak=a;   // buscamos el pico más alto
    }
    // Limitador final: si algún pico pasa de 0.92, se baja TODO proporcionalmente (nada llega a cortarse).
    if(peak>.92){ const k=.92/peak; for(let i=0;i<n;i++){ L[i]*=k; R[i]*=k; } }
    return {L,R,dur:total};
  }

  // Lo que el kit te entrega: todas las herramientas de arriba, más los buffers (n, dr, mu) y utilidades (rnd, hz, lpc, add).
  return {n,dr,mu,rnd,hz,lpc,add,kick,snare,clap,snap,hat,crash,syn,bell,chop,riser,sweep,mix};
}

// ════════════════════════════════════════════════════════════════════════════
//  FORMA MÉTRICA (la recomendada para escribir canciones)
// ════════════════════════════════════════════════════════════════════════════
// En vez de calcular segundos a mano, piensas en MÚSICA: compases y pulsos.
//
//   const K = demoKit.metric(sr, BPM, BARS, tail, seed);
//     BPM ... pulsos por minuto (120 = el pulso dura medio segundo)
//     BARS .. cuántos compases tiene tu canción (de 4 pulsos cada uno)
//     tail .. segundos extra al final para que se apague la reverberación (2.5 por defecto)
//
//   K.beat ........ cuánto dura un pulso, en segundos (60 / BPM)
//   K.bar ......... cuánto dura un compás, en segundos (4 pulsos)
//   K.T(b, p) ..... «compás b, pulso p» → segundos.  T(0,0) = el inicio · T(2,1.5) = compás 3, pulso 2 y medio.
//                   (Los compases y pulsos cuentan desde 0.)
//   K.duckBars(arreglo, dk) ... crea el sidechain por compás: arreglo[b] = fuerza del agachado en el compás b
//                   (0 = nada, 0.8 = mucho); en cada pulso vuelve a subir con rapidez dk (.13 s).
//   K.mix(arreglo, dk) ........ igual que mix de siempre, pero acepta ese arreglo directamente.
demoKit.metric=function(sr,BPM,BARS,tail,seed){
  const beat=60/BPM, bar=beat*4;                                       // un compás = 4 pulsos
  const K=demoKit(sr,BARS*bar+(tail==null?2.5:tail),seed);             // la duración total se calcula sola
  const T=(b,p)=>b*bar+(p||0)*beat;                                    // (compás, pulso) → segundos
  const duckBars=(arr,dk)=>t=>{
    const b=Math.min(BARS-1,Math.floor(t/bar));                        // ¿en qué compás estamos?
    // 1 − fuerza × e^(−tiempo desde el último pulso / dk): cae al inicio de cada pulso y vuelve a subir
    return 1-(t<BARS*bar?(arr[b]||0):0)*Math.exp(-(t%beat)/(dk||.13)); };
  const rawMix=K.mix;                                                  // guardamos la mezcla original…
  const mix=(d,dk)=>rawMix(typeof d==='function'?d:duckBars(d||[],dk)); // …y la envolvemos: acepta función o arreglo
  return Object.assign(K,{BPM,BARS,beat,bar,T,duckBars,mix});
};

// ════════════════════════════════════════════════════════════════════════════
//  EJEMPLO COMPLETO PARA COPIAR (una canción de 4 compases)
// ════════════════════════════════════════════════════════════════════════════
//
//  async function renderMiPrimeraCancion(sr, onProg){
//    const K = demoKit.metric(sr, 120, 4, 2.5, 1);       // 120 BPM, 4 compases
//    const { beat, T } = K;
//    for (let b = 0; b < 4; b++) {
//      for (let i = 0; i < 4; i++) K.kick(T(b, i), 1);           // bombo en cada pulso
//      K.snare(T(b, 1), .8);  K.snare(T(b, 3), .8);              // caja en los pulsos 2 y 4
//      K.hat(T(b, 0.5), .3, false, 0);                           // hi-hat entre pulso y pulso
//      K.syn(K.mu, T(b, 0), beat * 3, K.hz(45), .3, 0, { w: 2 }); // bajo senoidal, nota MIDI 45 (La grave)
//    }
//    K.bell(T(3, 0), 81, .12, 0, 2);                             // una campana (MIDI 81) en el último compás
//    return K.mix([0, .8, .8, .8], .13);                         // sidechain: nada en el 1.º compás, fuerte en los demás
//  }
//
//  Para oírla: abre el estudio (demo_kit_studio.html), «Demos y plugins», suelta el archivo y pulsa «▶ Original».
