// ── DEMO KIT · ULTIMATE 1.0.0 ───────────────────────────────────────────────────
// Kit alterno. NO reemplaza al kit por defecto: se carga a propósito (panel «Demos y plugins» → kits).
// Es Evol 1.2.0 (osciladores PolyBLEP, filtro TPT-SVF, percusión en capas, carácter orgánico/digital)
// MÁS lo mejor de las propuestas de Éter y de las versiones Pro, Ultra y Fidelity, rescatado como OPCIONES:
//
//   REGLA DE ORO: nada actúa si no lo pides. Con las opciones de siempre, este kit suena IGUAL, muestra
//   por muestra, que Evol (y, por tanto, casi igual que el kit incluido). Los extras se encienden con opciones.
//
// ── Opciones nuevas de K.syn (además de las de Evol: det, atk, rel, w, dec, lp, filt, res, drive, pw, sub, noise, kt, fenv, spread, drift) ──
//   wavetable:true, wtIndex:0|1, morph:0–1 ... tabla de ondas (0 = seno, 1 = cuadrada) mezclada con un seno 2×
//   amFreq:Hz, amDepth:0–1 ................... modulación de amplitud (trémolo rápido)
//   ringModFreq:Hz ........................... modulación en anillo (timbre metálico)
//   envSens:Hz, envAtk:ms, envRel:ms ......... el filtro se abre según la fuerza de la nota (envSens = apertura máxima aprox.)
//   comb:true, combTime:s, combFb:0–.95 ...... filtro en peine (espacio metálico)
//   delay:true, delayBeats, delayFb, delayMix, delayTail, bpm ... ping-pong estéreo por nota; la cola suena después de la nota
//   lfo:true | [Hz, cents] ................... deriva de afinación lenta y viva (lfo:false la apaga aunque el preset la traiga)
//   Q ........................................ alias de res, solo con los presets «pro» y «ultra» (así lo escribían esos kits)
// ── Opciones nuevas de K.kick ──
//   fold:0–3 ................................. wavefolding del cuerpo (más armónicos, más pegada); 0.4 = suave
// ── Mezcla (para demos escritas a mano: en el estudio cada pista se mezcla sola) ──
//   demoKit.master = { limit:'maximizer', delay:{ beats:.75, fb:.35, mix:.25, bpm:140 } }   (se lee al crear el kit)
//     limit:'maximizer' ... limitador suave continuo en vez de la saturación de siempre (tope .95)
//     delay ............... ping-pong estéreo en el bus maestro, sincronizado a K.BPM
// ── Siempre activo (no cambia el sonido de algo válido): blindaje contra NaN/Infinito en add, K.syn y K.mix.
//
// ── Presets (carácter del kit: demoKit.character, o el selector del estudio) ──
//   organico, digital ... iguales que en Evol
//   pro ................. sinte grueso por defecto (5 voces desafinadas, apertura estéreo .6, corte 2500 Hz, Q 1),
//                         deriva LFO viva, bombo con wavefolding (.4) y limitador suave en la mezcla
//   ultra ............... pro + el filtro se abre con la fuerza de cada nota (envSens 3000)
//   Los presets cambian los valores POR DEFECTO: lo que una nota pida explícitamente (det, lp…) manda.
//   Ojo con el nivel: con «pro» y «ultra», K.syn sin opciones suena unos 6 dB más bajo que en Evol (cinco voces promediadas); en una escena completa, unos 4 dB.
//
// Qué se corrigió respecto a las propuestas originales (por si las comparas):
//   · El panorama de una sola voz ya no se va a la izquierda (en Pro/Ultra una nota sola sonaba 9.7 dB más fuerte a la izquierda).
//   · El maximizador de Pro/Ultra/Ultimate v1 tenía un salto: pasado ±1 la salida caía a ±0.5. Aquí es continuo.
//   · El limitador de Ultimate v1 solo actuaba en el canal izquierdo.
//   · El delay y el seguidor de envolvente ya no van siempre encendidos.
//   · K.syn escribe siempre en el búfer que recibe (Ultimate v3 lo ignoraba y escribía en la percusión).
function demoKit(sr,seconds,seed0){
  const n=Math.ceil(seconds*sr);
  const dr=[new Float32Array(n),new Float32Array(n)], mu=[new Float32Array(n),new Float32Array(n)];
  let seed=seed0||20261015;
  const rnd=()=>{ seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/2147483648-1; };
  const hz=m=>440*Math.pow(2,(m-69)/12);
  const lpc=fc=>1-Math.exp(-2*Math.PI*Math.min(fc,sr*.45)/sr);
  // ── carácter (etapa 3) ──  demoKit.character = 'organico' | 'digital' | (nada = neutro, igual que las etapas 1–2)
  //   organico: cada golpe y cada nota varían un poco (afinación, nivel, filtro que respira) y se saturan suave, como un equipo analógico.
  //   digital:  todo exacto y repetible, con reducción de bits y de frecuencia de muestreo (12 bits, mantiene cada 2 muestras).
  // El carácter se lee al crear el kit; K.syn también acepta {character} para una sola nota. En neutro no se gasta ni un número aleatorio de más.
  const CH={organico:{drift:6,jit:4,wander:.05,vari:.07,sat:.3},digital:{drift:0,jit:0,wander:0,vari:0,bits:12,hold:2},
    pro:{drift:0,jit:0,wander:0,vari:0,sat:0,det:[-12,-5,0,5,12],spread:.6,lp:2500,res:1,useQ:true,lfo:[.64,1.5],fold:.4,master:'maximizer'},
    ultra:{drift:0,jit:0,wander:0,vari:0,sat:0,det:[-12,-5,0,5,12],spread:.6,lp:2500,res:1,useQ:true,lfo:[.64,1.5],fold:.4,master:'maximizer',envSens:3000}};
  const chr=CH[demoKit.character]||null;
  const vr=()=>chr&&chr.vari?1+chr.vari*rnd():1;                 // variación por golpe (nivel / afinación / caída)
  const qz=ch=>{ const q=Math.pow(2,ch.bits-1), h=ch.hold; let held=0,c=0; return v=>{ if(c++%h===0) held=Math.round(v*q)/q; return held; }; };
  function add(buf,t0,len,fn,amp,pan){
    const s0=Math.max(0,Math.floor(t0*sr)), N=Math.min(Math.floor(len*sr),n-s0); if(N<=0) return;
    const th=((pan||0)+1)*Math.PI/4, gl=amp*Math.cos(th)*1.414, gr=amp*Math.sin(th)*1.414, cz=chr&&chr.bits?qz(chr):null;
    for(let i=0;i<N;i++){ let v=fn(i/sr); if(cz) v=cz(v); if(!isFinite(v)) v=0; buf[0][s0+i]+=v*gl; buf[1][s0+i]+=v*gr; }
  }
  // ── percusión Evol (etapa 2): capas, mismas opciones que el kit incluido ──
  // Calibración de nivel frente al kit incluido: ganancia por golpe.
  const LVL={kick:.82,snare:1.03,clap:2.6,hat:5.6,crash:1.1};
  // filtro TPT-SVF suelto para percusión: (x,modo) con modo 0=LP 1=BP 2=HP
  const svfN=(fc,Q)=>{ const g=Math.tan(Math.PI*Math.min(fc,sr*.45)/sr), k=1/Q, a1=1/(1+g*(g+k)), a2=g*a1, a3=g*a2; let c1=0,c2=0;
    return (x,m)=>{ const v3=x-c2, v1=a1*c1+a2*v3, v2=c2+a2*c1+a3*v3; c1=2*v1-c1; c2=2*v2-c2; return m===2?x-k*v1-v2:m===1?k*v1:v2; }; };
  const blepS=(p,h)=>{ if(p<h){ p/=h; return p+p-p*p-1; } if(p>1-h){ p=(p-1)/h; return p*p+p+p+1; } return 0; };
  // seis cuadradas inarmónicas (el truco metálico del hi-hat clásico), sin aliasing
  const METAL=[205.3,304.4,369.6,522.7,540,800];
  const metal=(sc)=>{ const inc=METAL.map(f=>f*sc/sr), ph=METAL.map(()=>rnd()*.5+.5);
    return ()=>{ let s=0; for(let k=0;k<6;k++){ let p=ph[k]+inc[k]; p-=Math.floor(p); ph[k]=p; let v=(p<.5?1:-1)+blepS(p,inc[k]); let q=p+.5; if(q>=1) q-=1; v-=blepS(q,inc[k]); s+=v; } return s/6; }; };
  const kick=(t0,a,o)=>{ o=o||{}; a*=vr(); const pv=vr(), f1=(o.lo||46)*pv, f0=(o.hi||151)*pv, k=o.k||30, dec=(o.dec||6.5)*vr(), cl=o.click==null?.3:o.click, ck=svfN(3800,.9), fd=o.fold!=null?+o.fold:((chr&&chr.fold)||0);
    add(dr,t0,o.len||.45,t=>{
      const body=Math.sin(2*Math.PI*(f1*t+(f0-f1)/k*(1-Math.exp(-k*t))))*Math.exp(-t*dec)*Math.min(1,t*800);   // cuerpo: seno que cae de f0 a f1
      const thump=Math.sin(2*Math.PI*f1*t)*Math.exp(-t*dec*.55)*Math.min(1,t*400)*.28;                         // capa grave que sostiene
      const click=ck(rnd(),1)*Math.exp(-t*650)*cl*2.4+Math.sin(2*Math.PI*1750*t)*Math.exp(-t*850)*cl*.45;       // golpe seco
      return (Math.tanh(1.5*(fd>0?fold(body+thump,fd):body+thump))/Math.tanh(1.5)+click)*LVL.kick; },a,0); };
  const snare=(t0,a,o)=>{ o=o||{}; a*=vr(); const tn=(o.tone||185)*vr(), nd=o.nd||20, td=o.td||28, hp=svfN(1700,.8), bd=svfN(5200,.7); let p1=0,p2=0;
    add(dr,t0,o.len||.25,t=>{ const x=rnd(), f=tn*(1+.3*Math.exp(-t*55)); p1+=f/sr; p2+=f*1.58/sr;
      const body=(Math.sin(6.2831853*p1)*.62+Math.sin(6.2831853*p2)*.22)*Math.exp(-t*td);
      const nz=(hp(x,2)*.95+bd(x,1)*.55)*Math.exp(-t*nd)*.62+x*Math.exp(-t*240)*.3;
      return (body*.55+nz)*LVL.snare; },a,0); };
  const clap=(t0,a)=>{ a*=vr(); const bp=svfN(1250,1.1), hi=svfN(3000,.7), at=[0,.0105,.0215,.0325].map((v,i)=>i?v+rnd()*.0012:0);
    add(dr,t0,.3,t=>{ const x=rnd(), n=bp(x,1)*1.7+hi(x,2)*.35; let e=0;
      for(let i=0;i<4;i++){ const d=t-at[i]; if(d>=0&&d<.02) e+=Math.exp(-d*110)*(.85+.05*i); }
      if(t>=.0325) e+=Math.exp(-(t-.0325)*13)*.7;
      const y=n*e*LVL.clap; return 1.5*Math.tanh(y/1.5); },a,0); };
  const snap=(t0,a,pan)=>{ let p=0; add(dr,t0,.12,t=>{ const x=rnd(), v=x-p*.9; p=x;
    return v*Math.exp(-t*55)*.8+Math.sin(2*Math.PI*1900*t)*Math.exp(-t*90)*.5; },a,pan||0); };
  const hat=(t0,a,open,pan)=>{ a*=vr(); const m=metal(open?1.7:1.9), hp=svfN(7200,.7), bd=svfN(10500,.9);
    add(dr,t0,open?.3:.07,t=>{ const x=rnd(), s=m()*.8+x*.25, y=hp(s,2)*.8+bd(s,1)*.6;
      return y*(open?Math.exp(-t*13)*.8+Math.exp(-t*60)*.35:Math.exp(-t*75))*LVL.hat; },a,pan||0); };
  const crash=(t0,a,len)=>{ a*=vr(); let p=0; const m=metal(2.3), hp=svfN(5500,.7); add(dr,t0,len||2.4,t=>{ const x=rnd(), v=x-p*.5; p=x;
    return (v*.8+hp(m()*.7+x*.2,2)*.5)*Math.exp(-t*2.2)*LVL.crash; },a,0); };

  // ── Extras Ultimate: todos opcionales ──
  const fold=(x,g)=>Math.sin(x*g*1.5707963);                         // wavefolder: x → sin(x·g·π/2)
  const wtT=[new Float32Array(256),new Float32Array(256)];            // tablas de ondas: 0 = seno, 1 = cuadrada
  for(let i=0;i<256;i++){ wtT[0][i]=Math.sin(i/256*6.283185307179586); wtT[1][i]=i<128?1:-1; }
  const wtSample=(ti,p,morph)=>{ const T=wtT[Math.max(0,Math.min(1,ti|0))], q=((p%1)+1)%1*256, i=Math.floor(q), fr=q-i, v=T[i]*(1-fr)+T[(i+1)%256]*fr; return v*(1-morph)+Math.sin(q/256*12.566370614359172)*morph; };
  const combF=(time,fb)=>{ const size=Math.max(1,Math.floor(time*sr)), b=new Float32Array(size); let ptr=0; return x=>{ const o=b[ptr]; const w=x+o*fb; b[ptr]=isFinite(w)?w:0; ptr=(ptr+1)%size; return x+o*.5; }; };
  const ppF=(bpm,beats,fb,mx)=>{ const d=Math.max(1,Math.floor(sr*(60/bpm)*beats)), size=d*2, bL=new Float32Array(size), bR=new Float32Array(size); let ptr=0;
    return (xl,xr)=>{ const ri=(ptr-d+size)%size, ol=bL[ri], or_=bR[ri]; const wl=xl+or_*fb, wr=xr+ol*fb; bL[ptr]=isFinite(wl)?wl:0; bR[ptr]=isFinite(wr)?wr:0; ptr=(ptr+1)%size; return [xl*(1-mx)+ol*mx, xr*(1-mx)+or_*mx]; }; };

  // ── sintetizador Evol: w 0=sierra 1=cuadrada 2=seno · det en cents · lp en Hz o función del tiempo ──
  // Calibración de nivel frente al kit incluido (etapa 1): se ajusta con estas ganancias por onda.
  const LEVEL=[1.02,1,1];
  const TWO_PI=6.283185307179586, CENT=Math.LN2/1200;
  // PolyBLEP: corrige el salto de una onda con aristas (p = fase 0–1, h = incremento de fase por muestra)
  const blep=(p,h)=>{ if(p<h){ p/=h; return p+p-p*p-1; } if(p>1-h){ p=(p-1)/h; return p*p+p+p+1; } return 0; };
  function syn(buf,t0,len,f,a,pan,o){
    o=o||{}; const ch=o.character!==undefined?(CH[o.character]||null):chr;
    const det=(o.det||(ch&&ch.det)||[0]).map(d=>ch&&ch.jit?d+ch.jit*rnd():d), D=det.length, w=o.w||0, atk=Math.max(.0005,o.atk||.004), rel=Math.max(.005,o.rel||.06), tot=len+rel;
    const dlT=o.delay?(o.delayTail!=null?+o.delayTail:Math.min(2.5,(60/(o.bpm||api.BPM||120))*(o.delayBeats||.5)*5)):0;   // cola del delay: suena después de la nota
    const s0=Math.max(0,Math.floor(t0*sr)), N=Math.min(Math.floor((tot+dlT)*sr),n-s0); if(N<=0) return;
    const pw=Math.min(.95,Math.max(.05,o.pw==null?.5:o.pw)), sub=o.sub||0, nz=o.noise||0, dv=Math.min(1,Math.max(0,o.drive||0));
    const filt=o.filt||'lp', fOn=filt!=='off', Q=Math.min(24,Math.max(.5,o.res||(ch&&ch.useQ&&o.Q)||(ch&&ch.res)||.7071)), k=1/Q;
    const lpf=typeof o.lp==='function', lp0=lpf?0:(+o.lp||(ch&&ch.lp)||3000), kt=o.kt?Math.pow(f/261.63,o.kt):1;
    const fe=o.fenv, feA=fe?+fe[0]||0:0, feD=fe?Math.max(.005,+fe[1]||.3):1;
    const drift=(o.drift==null?(ch&&ch.drift!=null?ch.drift:3):o.drift)*CENT, spr=o.spread==null?(D>1?(ch&&ch.spread!=null?ch.spread:.45):0):o.spread;
    // por voz: incremento de fase base, fase inicial, deriva lenta (seno de .07–.32 Hz con fase propia) y posición estéreo
    const inc=new Float64Array(D), ph=new Float64Array(D), dph=new Float64Array(D), dst=new Float64Array(D), cur=new Float64Array(D), gl=new Float64Array(D), gr=new Float64Array(D);
    for(let v=0;v<D;v++){
      inc[v]=f*Math.pow(2,det[v]/1200)/sr; ph[v]=rnd()*.5+.5; dph[v]=(rnd()*.5+.5)*TWO_PI; dst[v]=TWO_PI*(.07+(rnd()*.5+.5)*.25)/sr; cur[v]=inc[v];
      const pv=Math.max(-1,Math.min(1,(pan||0)+spr*(D>1?v/(D-1)*2-1:0))), th=(pv+1)*Math.PI/4; gl[v]=Math.cos(th)*1.414/D; gr[v]=Math.sin(th)*1.414/D;
    }
    const thc=((pan||0)+1)*Math.PI/4, cl=Math.cos(thc)*1.414, cr=Math.sin(thc)*1.414;   // sub y ruido van al centro de la nota
    const wd=ch&&ch.wander||0, wph=wd?(rnd()*.5+.5)*TWO_PI:0, wr=TWO_PI*(.4+(wd?(rnd()*.5+.5):0)*.8)/sr, sat=ch&&ch.sat||0, cz=ch&&ch.bits?qz(ch):null, cz2=cz?qz(ch):null;
    const amp=a*(ch&&ch.vari?1+ch.vari*rnd():1)*LEVEL[w>2?0:w], dk=Math.exp(-(o.dec||0)/sr), atkS=atk*sr, relS=Math.floor(rel*sr), rS=Math.max(0,Math.floor(tot*sr)-relS);
    const eA=1/(1-Math.exp(-5)), sinc=f*.5/sr; let sph=0;
    // estado del filtro (un SVF por canal) y coeficientes (se recalculan cada 16 muestras)
    let a1=0,a2=0,a3=0, l1=0,l2=0,r1=0,r2=0, e=1, nzp=0;
    // extras Ultimate (opcionales)
    const wt=!!o.wavetable, wti=o.wtIndex||0, wmo=o.morph||0, rmF=+o.ringModFreq||0, amF=+o.amFreq||0, amD=o.amDepth==null?.5:+o.amDepth;
    const lfoC=o.lfo===false?null:Array.isArray(o.lfo)?o.lfo:(o.lfo===true||o.lfoFreq!=null||o.lfoDepth!=null)?[o.lfoFreq!=null?+o.lfoFreq:.64,o.lfoDepth!=null?+o.lfoDepth:1.5]:((ch&&ch.lfo)||null);
    const envS=o.envSens!=null?+o.envSens:((ch&&ch.envSens)||0), eAt=Math.exp(-1/(sr*((o.envAtk||5)/1000))), eRe=Math.exp(-1/(sr*((o.envRel||80)/1000))); let envv=0;
    const cbOn=!!o.comb, cbL=cbOn?combF(o.combTime||.02,o.combFb==null?.35:o.combFb):null, cbR=cbOn?combF(o.combTime||.02,o.combFb==null?.35:o.combFb):null;
    const dly=o.delay?ppF(o.bpm||api.BPM||120,o.delayBeats||.5,o.delayFb==null?.3:o.delayFb,o.delayMix==null?.25:o.delayMix):null;
    const coef=(fc)=>{ if(!(fc>=20)) fc=20; if(fc>sr*.45) fc=sr*.45; const g=Math.tan(Math.PI*fc/sr); a1=1/(1+g*(g+k)); a2=g*a1; a3=g*a2; };
    const out0=buf[0], out1=buf[1];
    for(let i=0;i<N;i++){
      if((i&15)===0){
        const t=i/sr;
        const lfoM=lfoC?Math.pow(2,lfoC[1]*Math.sin(6.283185307179586*lfoC[0]*t)/1200):1;
        for(let v=0;v<D;v++) cur[v]=inc[v]*(1+drift*Math.sin(dph[v]+dst[v]*i))*lfoM;
        if(fOn){ let fc=lpf?+o.lp(t):lp0; if(!isFinite(fc)) fc=lp0||3000; if(fe) fc*=Math.pow(2,feA*Math.exp(-t/feD)); if(envS) fc+=envv*envS; coef(fc*kt*(wd?1+wd*Math.sin(wph+wr*i):1)); }
      }
      let sl=0, sr_=0;
      for(let v=0;v<D;v++){
        let p=ph[v]+cur[v]; p-=Math.floor(p); ph[v]=p; const h=cur[v]; let s;
        if(w===0) s=2*p-1-blep(p,h);
        else if(w===1){ s=(p<pw?1:-1)+blep(p,h); let q=p-pw; if(q<0) q+=1; s-=blep(q,h); }
        else s=Math.sin(TWO_PI*p);
        if(wt) s=wtSample(wti,p,wmo);
        if(rmF) s*=Math.sin(TWO_PI*rmF*i/sr); else if(amF) s*=1-amD+amD*Math.sin(TWO_PI*amF*i/sr);
        sl+=s*gl[v]; sr_+=s*gr[v];
      }
      if(sub){ sph+=sinc; sph-=Math.floor(sph); const s=Math.sin(TWO_PI*sph)*sub; sl+=s*cl; sr_+=s*cr; }
      if(nz){ const x=rnd(), y=x-nzp; nzp=x; sl+=y*nz*.5*cl; sr_+=y*nz*.5*cr; }
      if(envS){ const ab=Math.abs(sl+sr_); envv=ab+(ab>envv?eAt:eRe)*(envv-ab); }
      if(dv>0){ const gd=1+dv*5; sl=Math.tanh(sl*gd)/Math.tanh(gd*.5+.5); sr_=Math.tanh(sr_*gd)/Math.tanh(gd*.5+.5); }
      if(fOn){
        let v3=sl-l2, v1=a1*l1+a2*v3, v2=l2+a2*l1+a3*v3; l1=2*v1-l1; l2=2*v2-l2; sl=filt==='bp'?k*v1:filt==='hp'?sl-k*v1-v2:v2;
        v3=sr_-r2; v1=a1*r1+a2*v3; v2=r2+a2*r1+a3*v3; r1=2*v1-r1; r2=2*v2-r2; sr_=filt==='bp'?k*v1:filt==='hp'?sr_-k*v1-v2:v2;
      }
      if(cbOn){ sl=cbL(sl); sr_=cbR(sr_); }
      if(sat){ sl=Math.tanh(sl*(1+sat))/(1+sat); sr_=Math.tanh(sr_*(1+sat))/(1+sat); }
      if(cz){ sl=cz(sl); sr_=cz2(sr_); }
      e*=dk; const ea=i<atkS?(1-Math.exp(-5*i/atkS))*eA:1;
      let er=1; if(i>=rS){ const x=(i-rS)/Math.max(1,relS); er=(Math.exp(-6.9*x)-.001)/.999; if(er<0) er=0; }
      const g=amp*ea*e*er; let oL=sl*g, oR=sr_*g;
      if(dly){ const q=dly(oL,oR); oL=q[0]; oR=q[1]; }
      if(!isFinite(oL)) oL=0; if(!isFinite(oR)) oR=0;
      out0[s0+i]+=oL; out1[s0+i]+=oR;
    }
  }
  // campana / cajita de música: parciales inarmónicos que decaen a distinta velocidad
  function bell(t0,m,a,pan,len){
    const f=hz(m), L=len||1.4, P=[[1,2.5,1],[2.76,5,.35],[5.4,9,.15]];
    add(mu,t0,L,t=>{ let s=0; for(const [r,d,g] of P) s+=Math.sin(6.2831853*f*r*t)*Math.exp(-t*d)*g; return s*Math.min(1,t*600); },a,pan);
  }
  // sílaba cantada tipo "chop": sierra filtrada por dos resonadores (formantes de la vocal)
  const bp=(fc,Q)=>{ const w=2*Math.PI*fc/sr, al=Math.sin(w)/(2*Q), a0=1+al, b0=al/a0, b2=-al/a0, a1=-2*Math.cos(w)/a0, a2=(1-al)/a0;
    let x1=0,x2=0,y1=0,y2=0; return x=>{ const y=b0*x+b2*x2-a1*y1-a2*y2; x2=x1; x1=x; y2=y1; y1=y; return y; }; };
  const VOW={oh:[500,900],ah:[800,1200],ee:[300,2300],oo:[320,800]};
  function chop(t0,len,m,a,pan,v){
    const f=hz(m), F=VOW[v||'oh'], b1=bp(F[0],6), b2=bp(F[1],8); let ph=0; const L=len+.08;
    add(mu,t0,L,t=>{ ph+=f*(1+.004*Math.sin(t*38))/sr; ph-=Math.floor(ph); const s=2*ph-1;
      return (b1(s)*1.6+b2(s))*Math.min(1,t/.012)*Math.exp(-t*(2.2/len))*Math.min(1,(L-t)/.08); },a,pan);
  }
  // ── transiciones ──
  function riser(t0,len,a){ let y=0; add(mu,t0,len,t=>{ const p=t/len, x=rnd(); y+=lpc(250+9000*p*p)*(x-y); return y*(.05+p*p*.9); },a,0); }
  function sweep(t0,len,f0,f1,a){            // seno que sube de f0 a f1
    const r=f1/f0, c=2*Math.PI*f0*len/Math.log(r);
    add(mu,t0,len,t=>Math.sin(c*(Math.pow(r,t/len)-1))*(t/len)*(t/len),a,0);
  }
  // ── mezcla: sidechain (duckAt devuelve la ganancia de la música), saturación suave (o limitador), fundido, tope de nivel ──
  // Con demoKit.master (o el preset pro/ultra) la saturación se cambia por un limitador suave continuo, y puede haber un delay en el bus.
  function mix(duckAt){
    const L=new Float32Array(n), R=new Float32Array(n), total=n/sr; let peak=0;
    const soft=x=>x<-3?-1:x>3?1:x*(27+x*x)/(27+9*x*x);
    const mst=demoKit.master||(chr&&chr.master==='maximizer'?{limit:'maximizer'}:null), lim=!!(mst&&mst.limit==='maximizer'), top=lim?.95:.92;
    const maxim=x=>{ const a=x<0?-x:x; if(a<=1) return x; const y=1+.6366197723675814*Math.atan((a-1)*1.5707963267948966); return x<0?-y:y; };   // continuo y suave: sigue a x hasta 1 y se acerca a 2
    const dly=mst&&mst.delay?ppF(mst.delay.bpm||api.BPM||140,mst.delay.beats||.75,mst.delay.fb==null?.35:mst.delay.fb,mst.delay.mix==null?.25:mst.delay.mix):null;
    for(let i=0;i<n;i++){
      const t=i/sr, g=duckAt(t), fade=t>total-.6?Math.max(0,(total-t)/.6):1;
      let xl=(dr[0][i]+mu[0][i]*g)*.9, xr=(dr[1][i]+mu[1][i]*g)*.9;
      if(dly){ const q=dly(xl,xr); xl=q[0]; xr=q[1]; }
      L[i]=(lim?maxim(xl):soft(xl))*fade; R[i]=(lim?maxim(xr):soft(xr))*fade;
      if(!isFinite(L[i])) L[i]=0; if(!isFinite(R[i])) R[i]=0;
      const a=Math.max(Math.abs(L[i]),Math.abs(R[i])); if(a>peak) peak=a;
    }
    if(peak>top){ const k=top/peak; for(let i=0;i<n;i++){ L[i]*=k; R[i]*=k; } }
    return {L,R,dur:total};
  }
  const api={n,dr,mu,rnd,hz,lpc,add,fold,kick,snare,clap,snap,hat,crash,syn,bell,chop,riser,sweep,mix};
  return api;
}
// Quién soy: el estudio lo lee para anotarlo en los proyectos que se guardan con este kit.
demoKit.info={id:'ultimate',name:'Ultimate',version:'1.0.0',stage:4,characters:['organico','digital','pro','ultra']};

// ── FORMA MÉTRICA (igual que el kit incluido) ──
demoKit.metric=function(sr,BPM,BARS,tail,seed){
  const beat=60/BPM, bar=beat*4, K=demoKit(sr,BARS*bar+(tail==null?2.5:tail),seed);
  const T=(b,p)=>b*bar+(p||0)*beat;
  const duckBars=(arr,dk)=>t=>{ const b=Math.min(BARS-1,Math.floor(t/bar)); return 1-(t<BARS*bar?(arr[b]||0):0)*Math.exp(-(t%beat)/(dk||.13)); };
  const rawMix=K.mix;
  const mix=(d,dk)=>rawMix(typeof d==='function'?d:duckBars(d||[],dk));
  return Object.assign(K,{BPM,BARS,beat,bar,T,duckBars,mix});
};
