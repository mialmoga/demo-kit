// ── DEMO KIT · EVOL (etapas 1–2) ─────────────────────────────────────────────
// Kit alterno, más fino que el incluido. NO reemplaza al kit por defecto: se carga a propósito
// (panel «Demos y plugins» → kits, o soltando este archivo en el estudio) y los proyectos que
// se guardan con él lo anotan, para que siempre se sepa con qué motor sonaban.
//
// Qué cambia en esta etapa: SOLO K.syn (todos los instrumentos de síntesis: sinte, pad, supersaw,
// arp, sub, reese, growl, pluck…).
//   · Osciladores PolyBLEP (sierra / cuadrada con ancho de pulso / seno): casi sin aliasing arriba.
//   · Filtro TPT-SVF (Zavalishin): estable con cualquier corte y resonancia, modos LP / BP / HP.
//   · Envolventes exponenciales (ataque suave, release que cae como un instrumento real).
//   · Unísono estéreo: cada voz en su lugar del panorama y con una deriva lenta de afinación.
//   · Todo con la semilla del kit (nada de Math.random): mismo proyecto → mismo audio.
// Etapa 2: bombo en capas, caja con cuerpo y cresta, hi-hat metálico (6 cuadradas), palma de varias ráfagas, crash con brillo.
// Snap, campana, chop, riser, sweep y mix son idénticos al kit incluido.
//
// K.syn acepta las mismas opciones de siempre: {det, atk, rel, w, dec, lp (Hz o función del tiempo)}
// y opcionales nuevas: filt:'lp'|'bp'|'hp'|'off' · res (Q, .5–24) · drive (0–1) · pw (ancho de pulso .05–.95)
//   · sub (nivel de sub-oscilador, una octava abajo) · noise (nivel de ruido) · kt (seguimiento de tecla 0–1)
//   · fenv:[octavas, caída_s] (el corte sube N octavas y cae) · spread (apertura estéreo 0–1) · drift (cents)
function demoKit(sr,seconds,seed0){
  const n=Math.ceil(seconds*sr);
  const dr=[new Float32Array(n),new Float32Array(n)], mu=[new Float32Array(n),new Float32Array(n)];
  let seed=seed0||20261015;
  const rnd=()=>{ seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/2147483648-1; };
  const hz=m=>440*Math.pow(2,(m-69)/12);
  const lpc=fc=>1-Math.exp(-2*Math.PI*Math.min(fc,sr*.45)/sr);
  function add(buf,t0,len,fn,amp,pan){
    const s0=Math.max(0,Math.floor(t0*sr)), N=Math.min(Math.floor(len*sr),n-s0); if(N<=0) return;
    const th=((pan||0)+1)*Math.PI/4, gl=amp*Math.cos(th)*1.414, gr=amp*Math.sin(th)*1.414;
    for(let i=0;i<N;i++){ const v=fn(i/sr); buf[0][s0+i]+=v*gl; buf[1][s0+i]+=v*gr; }
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
  const kick=(t0,a,o)=>{ o=o||{}; const f1=o.lo||46, f0=o.hi||151, k=o.k||30, dec=o.dec||6.5, cl=o.click==null?.3:o.click, ck=svfN(3800,.9);
    add(dr,t0,o.len||.45,t=>{
      const body=Math.sin(2*Math.PI*(f1*t+(f0-f1)/k*(1-Math.exp(-k*t))))*Math.exp(-t*dec)*Math.min(1,t*800);   // cuerpo: seno que cae de f0 a f1
      const thump=Math.sin(2*Math.PI*f1*t)*Math.exp(-t*dec*.55)*Math.min(1,t*400)*.28;                         // capa grave que sostiene
      const click=ck(rnd(),1)*Math.exp(-t*650)*cl*2.4+Math.sin(2*Math.PI*1750*t)*Math.exp(-t*850)*cl*.45;       // golpe seco
      return (Math.tanh(1.5*(body+thump))/Math.tanh(1.5)+click)*LVL.kick; },a,0); };
  const snare=(t0,a,o)=>{ o=o||{}; const tn=o.tone||185, nd=o.nd||20, td=o.td||28, hp=svfN(1700,.8), bd=svfN(5200,.7); let p1=0,p2=0;
    add(dr,t0,o.len||.25,t=>{ const x=rnd(), f=tn*(1+.3*Math.exp(-t*55)); p1+=f/sr; p2+=f*1.58/sr;
      const body=(Math.sin(6.2831853*p1)*.62+Math.sin(6.2831853*p2)*.22)*Math.exp(-t*td);
      const nz=(hp(x,2)*.95+bd(x,1)*.55)*Math.exp(-t*nd)*.62+x*Math.exp(-t*240)*.3;
      return (body*.55+nz)*LVL.snare; },a,0); };
  const clap=(t0,a)=>{ const bp=svfN(1250,1.1), hi=svfN(3000,.7), at=[0,.0105,.0215,.0325].map((v,i)=>i?v+rnd()*.0012:0);
    add(dr,t0,.3,t=>{ const x=rnd(), n=bp(x,1)*1.7+hi(x,2)*.35; let e=0;
      for(let i=0;i<4;i++){ const d=t-at[i]; if(d>=0&&d<.02) e+=Math.exp(-d*110)*(.85+.05*i); }
      if(t>=.0325) e+=Math.exp(-(t-.0325)*13)*.7;
      const y=n*e*LVL.clap; return 1.5*Math.tanh(y/1.5); },a,0); };
  const snap=(t0,a,pan)=>{ let p=0; add(dr,t0,.12,t=>{ const x=rnd(), v=x-p*.9; p=x;
    return v*Math.exp(-t*55)*.8+Math.sin(2*Math.PI*1900*t)*Math.exp(-t*90)*.5; },a,pan||0); };
  const hat=(t0,a,open,pan)=>{ const m=metal(open?1.7:1.9), hp=svfN(7200,.7), bd=svfN(10500,.9);
    add(dr,t0,open?.3:.07,t=>{ const x=rnd(), s=m()*.8+x*.25, y=hp(s,2)*.8+bd(s,1)*.6;
      return y*(open?Math.exp(-t*13)*.8+Math.exp(-t*60)*.35:Math.exp(-t*75))*LVL.hat; },a,pan||0); };
  const crash=(t0,a,len)=>{ let p=0; const m=metal(2.3), hp=svfN(5500,.7); add(dr,t0,len||2.4,t=>{ const x=rnd(), v=x-p*.5; p=x;
    return (v*.8+hp(m()*.7+x*.2,2)*.5)*Math.exp(-t*2.2)*LVL.crash; },a,0); };

  // ── sintetizador Evol: w 0=sierra 1=cuadrada 2=seno · det en cents · lp en Hz o función del tiempo ──
  // Calibración de nivel frente al kit incluido (etapa 1): se ajusta con estas ganancias por onda.
  const LEVEL=[1.02,1,1];
  const TWO_PI=6.283185307179586, CENT=Math.LN2/1200;
  // PolyBLEP: corrige el salto de una onda con aristas (p = fase 0–1, h = incremento de fase por muestra)
  const blep=(p,h)=>{ if(p<h){ p/=h; return p+p-p*p-1; } if(p>1-h){ p=(p-1)/h; return p*p+p+p+1; } return 0; };
  function syn(buf,t0,len,f,a,pan,o){
    o=o||{};
    const det=o.det||[0], D=det.length, w=o.w||0, atk=Math.max(.0005,o.atk||.004), rel=Math.max(.005,o.rel||.06), tot=len+rel;
    const s0=Math.max(0,Math.floor(t0*sr)), N=Math.min(Math.floor(tot*sr),n-s0); if(N<=0) return;
    const pw=Math.min(.95,Math.max(.05,o.pw==null?.5:o.pw)), sub=o.sub||0, nz=o.noise||0, dv=Math.min(1,Math.max(0,o.drive||0));
    const filt=o.filt||'lp', fOn=filt!=='off', Q=Math.min(24,Math.max(.5,o.res||.7071)), k=1/Q;
    const lpf=typeof o.lp==='function', lp0=lpf?0:(+o.lp||3000), kt=o.kt?Math.pow(f/261.63,o.kt):1;
    const fe=o.fenv, feA=fe?+fe[0]||0:0, feD=fe?Math.max(.005,+fe[1]||.3):1;
    const drift=(o.drift==null?3:o.drift)*CENT, spr=o.spread==null?(D>1?.45:0):o.spread;
    // por voz: incremento de fase base, fase inicial, deriva lenta (seno de .07–.32 Hz con fase propia) y posición estéreo
    const inc=new Float64Array(D), ph=new Float64Array(D), dph=new Float64Array(D), dst=new Float64Array(D), cur=new Float64Array(D), gl=new Float64Array(D), gr=new Float64Array(D);
    for(let v=0;v<D;v++){
      inc[v]=f*Math.pow(2,det[v]/1200)/sr; ph[v]=rnd()*.5+.5; dph[v]=(rnd()*.5+.5)*TWO_PI; dst[v]=TWO_PI*(.07+(rnd()*.5+.5)*.25)/sr; cur[v]=inc[v];
      const pv=Math.max(-1,Math.min(1,(pan||0)+spr*(D>1?v/(D-1)*2-1:0))), th=(pv+1)*Math.PI/4; gl[v]=Math.cos(th)*1.414/D; gr[v]=Math.sin(th)*1.414/D;
    }
    const thc=((pan||0)+1)*Math.PI/4, cl=Math.cos(thc)*1.414, cr=Math.sin(thc)*1.414;   // sub y ruido van al centro de la nota
    const amp=a*LEVEL[w>2?0:w], dk=Math.exp(-(o.dec||0)/sr), atkS=atk*sr, relS=Math.floor(rel*sr), rS=Math.max(0,Math.floor(tot*sr)-relS);
    const eA=1/(1-Math.exp(-5)), sinc=f*.5/sr; let sph=0;
    // estado del filtro (un SVF por canal) y coeficientes (se recalculan cada 16 muestras)
    let a1=0,a2=0,a3=0, l1=0,l2=0,r1=0,r2=0, e=1, nzp=0;
    const coef=(fc)=>{ if(!(fc>=20)) fc=20; if(fc>sr*.45) fc=sr*.45; const g=Math.tan(Math.PI*fc/sr); a1=1/(1+g*(g+k)); a2=g*a1; a3=g*a2; };
    const out0=buf[0], out1=buf[1];
    for(let i=0;i<N;i++){
      if((i&15)===0){
        const t=i/sr;
        for(let v=0;v<D;v++) cur[v]=inc[v]*(1+drift*Math.sin(dph[v]+dst[v]*i));
        if(fOn){ let fc=lpf?+o.lp(t):lp0; if(!isFinite(fc)) fc=lp0||3000; if(fe) fc*=Math.pow(2,feA*Math.exp(-t/feD)); coef(fc*kt); }
      }
      let sl=0, sr_=0;
      for(let v=0;v<D;v++){
        let p=ph[v]+cur[v]; p-=Math.floor(p); ph[v]=p; const h=cur[v]; let s;
        if(w===0) s=2*p-1-blep(p,h);
        else if(w===1){ s=(p<pw?1:-1)+blep(p,h); let q=p-pw; if(q<0) q+=1; s-=blep(q,h); }
        else s=Math.sin(TWO_PI*p);
        sl+=s*gl[v]; sr_+=s*gr[v];
      }
      if(sub){ sph+=sinc; sph-=Math.floor(sph); const s=Math.sin(TWO_PI*sph)*sub; sl+=s*cl; sr_+=s*cr; }
      if(nz){ const x=rnd(), y=x-nzp; nzp=x; sl+=y*nz*.5*cl; sr_+=y*nz*.5*cr; }
      if(dv>0){ const gd=1+dv*5; sl=Math.tanh(sl*gd)/Math.tanh(gd*.5+.5); sr_=Math.tanh(sr_*gd)/Math.tanh(gd*.5+.5); }
      if(fOn){
        let v3=sl-l2, v1=a1*l1+a2*v3, v2=l2+a2*l1+a3*v3; l1=2*v1-l1; l2=2*v2-l2; sl=filt==='bp'?k*v1:filt==='hp'?sl-k*v1-v2:v2;
        v3=sr_-r2; v1=a1*r1+a2*v3; v2=r2+a2*r1+a3*v3; r1=2*v1-r1; r2=2*v2-r2; sr_=filt==='bp'?k*v1:filt==='hp'?sr_-k*v1-v2:v2;
      }
      e*=dk; const ea=i<atkS?(1-Math.exp(-5*i/atkS))*eA:1;
      let er=1; if(i>=rS){ const x=(i-rS)/Math.max(1,relS); er=(Math.exp(-6.9*x)-.001)/.999; if(er<0) er=0; }
      const g=amp*ea*e*er; out0[s0+i]+=sl*g; out1[s0+i]+=sr_*g;
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
  // ── mezcla: sidechain (duckAt devuelve la ganancia de la música), saturación suave, fundido, tope de nivel ──
  function mix(duckAt){
    const L=new Float32Array(n), R=new Float32Array(n), total=n/sr; let peak=0;
    const soft=x=>x<-3?-1:x>3?1:x*(27+x*x)/(27+9*x*x);
    for(let i=0;i<n;i++){
      const t=i/sr, g=duckAt(t), fade=t>total-.6?Math.max(0,(total-t)/.6):1;
      L[i]=soft((dr[0][i]+mu[0][i]*g)*.9)*fade; R[i]=soft((dr[1][i]+mu[1][i]*g)*.9)*fade;
      const a=Math.max(Math.abs(L[i]),Math.abs(R[i])); if(a>peak) peak=a;
    }
    if(peak>.92){ const k=.92/peak; for(let i=0;i<n;i++){ L[i]*=k; R[i]*=k; } }
    return {L,R,dur:total};
  }
  return {n,dr,mu,rnd,hz,lpc,add,kick,snare,clap,snap,hat,crash,syn,bell,chop,riser,sweep,mix};
}
// Quién soy: el estudio lo lee para anotarlo en los proyectos que se guardan con este kit.
demoKit.info={id:'evol',name:'Evol',version:'1.1.0',stage:2};

// ── FORMA MÉTRICA (igual que el kit incluido) ──
demoKit.metric=function(sr,BPM,BARS,tail,seed){
  const beat=60/BPM, bar=beat*4, K=demoKit(sr,BARS*bar+(tail==null?2.5:tail),seed);
  const T=(b,p)=>b*bar+(p||0)*beat;
  const duckBars=(arr,dk)=>t=>{ const b=Math.min(BARS-1,Math.floor(t/bar)); return 1-(t<BARS*bar?(arr[b]||0):0)*Math.exp(-(t%beat)/(dk||.13)); };
  const rawMix=K.mix;
  const mix=(d,dk)=>rawMix(typeof d==='function'?d:duckBars(d||[],dk));
  return Object.assign(K,{BPM,BARS,beat,bar,T,duckBars,mix});
};
