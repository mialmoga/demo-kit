/* Demo Kit · librería v1.2 — https://github.com/mialmoga/demo-kit */
;(function(){
// ── KIT DE SÍNTESIS PARA LAS DEMOS (Cotton Sugar, The Void) ────
// Todo se calcula muestra a muestra en JavaScript: sin archivos de audio, sin librerías.
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
  // ── percusión ──
  const kick=(t0,a,o)=>{ o=o||{}; const f1=o.lo||46, f0=o.hi||151, k=o.k||30, dec=o.dec||6.5, cl=o.click==null?.3:o.click;
    add(dr,t0,o.len||.45,t=>Math.sin(2*Math.PI*(f1*t+(f0-f1)/k*(1-Math.exp(-k*t))))*Math.exp(-t*dec)*Math.min(1,t*800)+Math.exp(-t*200)*cl,a,0); };
  const snare=(t0,a,o)=>{ o=o||{}; let p=0; const tn=o.tone||185, nd=o.nd||20, td=o.td||28;
    add(dr,t0,o.len||.25,t=>{ const x=rnd(), v=x-p*.6; p=x; return v*Math.exp(-t*nd)*.6+Math.sin(2*Math.PI*tn*t)*Math.exp(-t*td)*.5; },a,0); };
  const clap=(t0,a)=>{ let p=0; add(dr,t0,.3,t=>{ const x=rnd(), v=x-p*.7; p=x;
    return v*(Math.exp(-(t%.011)*90)*(t<.033?1:0)+Math.exp(-t*14)*.7); },a,0); };
  const snap=(t0,a,pan)=>{ let p=0; add(dr,t0,.12,t=>{ const x=rnd(), v=x-p*.9; p=x;
    return v*Math.exp(-t*55)*.8+Math.sin(2*Math.PI*1900*t)*Math.exp(-t*90)*.5; },a,pan||0); };
  const hat=(t0,a,open,pan)=>{ let p=0; add(dr,t0,open?.3:.07,t=>{ const x=rnd(), v=x-p; p=x; return v*Math.exp(-t*(open?13:75)); },a,pan||0); };
  const crash=(t0,a,len)=>{ let p=0; add(dr,t0,len||2.4,t=>{ const x=rnd(), v=x-p*.5; p=x; return v*Math.exp(-t*2.2); },a,0); };

  // ── sintetizador: w 0=sierra 1=cuadrada 2=seno · det en cents · lp en Hz o función del tiempo ──
  function syn(buf,t0,len,f,a,pan,o){
    const det=o.det||[0], D=det.length, inc=det.map(d=>f*Math.pow(2,d/1200)/sr), ph=det.map(()=>rnd()*.5+.5);
    const atk=o.atk||.004, rel=o.rel||.06, w=o.w||0, tot=len+rel;
    const lpf=typeof o.lp==='function', lpk=lpf?0:lpc(o.lp||3000);
    const dk=Math.exp(-(o.dec||0)/sr), ak=1/(atk*sr), rk=1/(rel*sr), iN=Math.floor(tot*sr), rS=iN-Math.floor(rel*sr);
    let y=0, e=1, i=0;
    add(buf,t0,tot,t=>{
      let s=0;
      for(let k=0;k<D;k++){ let p=ph[k]+inc[k]; p-=Math.floor(p); ph[k]=p;
        s+= w===0 ? 2*p-1 : w===1 ? (p<.5?1:-1) : Math.sin(6.2831853*p); }
      y+=(lpf?lpc(o.lp(t)):lpk)*(s/D-y); e*=dk; i++;
      return y*Math.min(1,i*ak)*e*(i>rS?Math.max(0,(iN-i)*rk):1);
    },a,pan);
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

// ── FORMA MÉTRICA (recomendada para escribir demos) ────
// demoKit.metric(sr,BPM,BARS,tail,seed) → el mismo kit + tiempo musical:
//   beat, bar  (segundos)      T(compás,pulso) → segundos      BPM, BARS
//   duckBars([..por compás..],dk) → función para mix (sidechain por compás, decae cada pulso)
//   mix también acepta directamente el arreglo por compás: K.mix(duck,dk)
// La duración se calcula sola: BARS*bar+tail (tail por defecto 2.5 s).
demoKit.metric=function(sr,BPM,BARS,tail,seed){
  const beat=60/BPM, bar=beat*4, K=demoKit(sr,BARS*bar+(tail==null?2.5:tail),seed);
  const T=(b,p)=>b*bar+(p||0)*beat;
  const duckBars=(arr,dk)=>t=>{ const b=Math.min(BARS-1,Math.floor(t/bar)); return 1-(t<BARS*bar?(arr[b]||0):0)*Math.exp(-(t%beat)/(dk||.13)); };
  const rawMix=K.mix;
  const mix=(d,dk)=>rawMix(typeof d==='function'?d:duckBars(d||[],dk));
  return Object.assign(K,{BPM,BARS,beat,bar,T,duckBars,mix});
};

// ═══════════════════════════════════════════════════════════════════════
//  MOTOR DEL ESTUDIO (sin DOM): instrumentos, render, conversión de demos, proyectos
// ═══════════════════════════════════════════════════════════════════════
const SR=44100, TAIL=2.5, KIT_SEED=20261015;
const Kit={make:(typeof demoKit==='function')?demoKit:null};   // se puede reemplazar cargando otro demo_kit.js
const tick=()=>new Promise(r=>setTimeout(r,0));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));              // las demos lo usan
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const r6=x=>Math.round(x*1e6)/1e6;
let _rev=0;
function hash2(str){ let a=0x811c9dc5,b=5381; for(let i=0;i<str.length;i++){ const c=str.charCodeAt(i); a^=c; a=Math.imul(a,16777619); b=(Math.imul(b,33)^c)|0; } return (a>>>0).toString(36)+'-'+(b>>>0).toString(36); }
let _uid=0; const uid=()=>'t'+(++_uid).toString(36)+Math.random().toString(36).slice(2,5);
const satf=x=>x/(1+Math.abs(x));

// ───────────────────────── registro de instrumentos ─────────────────────────
const INSTRUMENTS={}, INST_ORDER=[];
let USER_PLUGINS=[];                                            // [{id,name,code}]
const slug=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'inst';
function registerInstrument(def,opts){
  if(!def||typeof def.play!=='function') throw new Error('El instrumento necesita una función play(K, n)');
  def.name=def.name||'Sin nombre'; def.id=def.id||slug(def.name); def.kind=def.kind==='perc'?'perc':'melodic';
  def.params=(def.params||[]).map(p=>Object.assign({type:'num',min:0,max:1,step:.01,def:0,label:p.k},p));
  if(def.kind==='perc'&&!def.lanes) def.lanes=[{name:def.name}];
  def.user=!!(opts&&opts.user); def.rev=++_rev;
  if(!INSTRUMENTS[def.id]) INST_ORDER.push(def.id);
  INSTRUMENTS[def.id]=def; return def;
}
const defaultParams=inst=>{const p={};for(const d of inst.params)p[d.k]=d.def;return p;};

// ayudas de síntesis
const _fn=new Map();
function fnFromSrc(src){ if(!_fn.has(src)){ let f=null; try{ f=new Function('"use strict";return ('+src+')')(); }catch(e){} _fn.set(src,f);} return _fn.get(src); }
function lpFor(p){
  if(p.lpSrc){ const f=fnFromSrc(p.lpSrc); if(f) return f; }
  if(p.lpSweep>0){ const b=p.lp,s=p.lpSweep,r=p.lpRate; return t=>b+s*Math.exp(-t*r); }
  return p.lp;
}
function detFor(p){
  if(Array.isArray(p.detRaw)&&p.detRaw.length) return p.detRaw;
  const V=Math.max(1,Math.round(p.voices)),S=p.spread; if(V===1) return [0];
  const a=[]; for(let i=0;i<V;i++) a.push(-S+2*S*i/(V-1)); return a;
}
const G=def=>({k:'gain',label:'Ganancia',min:0,max:1.5,step:.005,def});

function synthParams(d){return [G(d.gain),
  {k:'w',label:'Onda',type:'choice',opts:['Sierra','Cuadrada','Seno'],vals:[0,1,2],def:d.w},
  {k:'voices',label:'Voces',min:1,max:9,step:1,def:d.voices},
  {k:'spread',label:'Desafine (cents)',min:0,max:50,step:.5,def:d.spread},
  {k:'atk',label:'Ataque (s)',min:.001,max:2,step:.001,def:d.atk},
  {k:'rel',label:'Release (s)',min:.01,max:2,step:.01,def:d.rel},
  {k:'dec',label:'Caída (1/s)',min:0,max:20,step:.1,def:d.dec},
  {k:'lp',label:'Filtro base (Hz)',min:60,max:12000,step:10,def:d.lp},
  {k:'lpSweep',label:'Filtro: barrido (Hz)',min:0,max:9000,step:10,def:d.lpSweep},
  {k:'lpRate',label:'Filtro: velocidad (1/s)',min:.5,max:40,step:.5,def:d.lpRate}];}
function synthDef(id,name,desc,d){
  return {id,name,desc,kind:'melodic',params:synthParams(d),
    play(K,n){const p=n.p; K.syn(n.buf,n.t,n.len,n.hz,n.a*p.gain,n.pan,{det:detFor(p),atk:p.atk,rel:p.rel,w:p.w,dec:p.dec,lp:lpFor(p)});}};
}
const S0={gain:.2,w:0,voices:3,spread:10,atk:.004,rel:.08,dec:0,lp:3000,lpSweep:0,lpRate:10};
registerInstrument(synthDef('sinte','Sinte (genérico)','K.syn con todos sus controles: onda, voces desafinadas, envolvente y filtro que se cierra.',S0));
registerInstrument(synthDef('supersaw','Supersaw','Acordes anchos del future bass: 5 sierras desafinadas y filtro que se cierra rápido.',Object.assign({},S0,{gain:.1,voices:5,spread:20,rel:.12,dec:2.5,lp:1500,lpSweep:5500,lpRate:9})));
registerInstrument(synthDef('pluck','Pluck / arpegio','Nota corta y brillante con caída de filtro.',Object.assign({},S0,{gain:.1,voices:2,spread:6,atk:.003,rel:.05,dec:6,lp:900,lpSweep:4500,lpRate:14})));
registerInstrument(synthDef('arp','Arpegio cuadrado','Onda cuadrada con filtro que se cierra: el arpegio oscuro de The Void.',Object.assign({},S0,{gain:.09,w:1,voices:2,spread:8,atk:.003,rel:.05,dec:7,lp:700,lpSweep:3200,lpRate:13})));
registerInstrument(synthDef('pad','Pad aireado','Sierras lentas con ataque y release largos.',Object.assign({},S0,{gain:.08,voices:2,spread:9,atk:.5,rel:.5,dec:0,lp:2600})));
registerInstrument(synthDef('sub','Sub (seno)','Seno puro para graves.',Object.assign({},S0,{gain:.42,w:2,voices:1,spread:0,atk:.01,rel:.08,dec:1.2,lp:900})));

registerInstrument({id:'subfall',name:'Sub con caída',kind:'melodic',desc:'Seno con caída exponencial y cierre rápido (el sub del drop de The Void).',
  params:[G(.45),{k:'decay',label:'Caída (1/s)',min:0,max:4,step:.05,def:.9},{k:'atk',label:'Ataque (1/s)',min:5,max:200,step:1,def:40},{k:'rel',label:'Cierre (1/s)',min:5,max:200,step:1,def:30}],
  play(K,n){const p=n.p,f=n.hz,L=n.len; K.add(n.buf,n.t,L,t=>Math.sin(2*Math.PI*f*t)*Math.min(1,t*p.atk)*(p.decay>0?Math.exp(-t*p.decay):1)*Math.min(1,(L-t)*p.rel),n.a*p.gain,n.pan);}});

registerInstrument({id:'reese',name:'Reese (bajo gruñón)',kind:'melodic',desc:'Tres sierras desafinadas → filtro de 2 polos que respira → saturación (portado de The Void).',
  params:[G(.42),{k:'lfoB',label:'Respiración (ciclos/pulso)',min:0,max:8,step:.25,def:.5},{k:'lo',label:'Filtro mínimo (Hz)',min:80,max:2000,step:10,def:260},{k:'hi',label:'Filtro máximo (Hz)',min:200,max:6000,step:10,def:1400},{k:'drive',label:'Saturación',min:.5,max:8,step:.1,def:2.2}],
  play(K,n){
    const p=n.p,sr=n.sr,f=n.hz,cents=[-17,0,17],inc=cents.map(c=>f*Math.pow(2,c/1200)/sr),ph=cents.map(()=>K.rnd()*.5+.5);
    const lfo=p.lfoB/n.beat,lo=p.lo,hi=p.hi,drive=p.drive,L=n.len+.05; let y1=0,y2=0;
    K.add(n.buf,n.t,L,t=>{ let s=0;
      for(let k=0;k<3;k++){ ph[k]+=inc[k]*(1+.002*Math.sin(t*2.1+k)); ph[k]-=Math.floor(ph[k]); s+=2*ph[k]-1; }
      const c=K.lpc(lo+(hi-lo)*(.5+.5*Math.sin(6.2831853*lfo*t))); y1+=c*(s/3-y1); y2+=c*(y1-y2);
      return satf(y2*drive)*Math.min(1,t/.01)*Math.min(1,(L-t)/.05)*1.2; },n.a*p.gain,n.pan);
  }});
registerInstrument({id:'reesemk',name:'Reese 4 sierras (MK)',kind:'melodic',desc:'Cuatro sierras desafinadas → filtro de 2 polos con wobble al pulso (el bajo de The Void original).',
  params:[G(1),{k:'rateB',label:'Wobble (ciclos/pulso, 0 = fijo)',min:0,max:8,step:.25,def:1},{k:'open',label:'Filtro fijo (Hz)',min:80,max:6000,step:10,def:400}],
  play(K,n){
    const p=n.p,sr=n.sr,f=n.hz,det=[-16,-6,5,16],D=4,inc=det.map(d=>f*Math.pow(2,d/1200)/sr),ph=det.map(()=>K.rnd()*.5+.5);
    const iN=Math.floor((n.len+.03)*sr),rS=Math.floor(n.len*sr),ak=1/(.004*sr),L=n.len+.03,rate=p.rateB; let y1=0,y2=0,i=0;
    K.add(n.buf,n.t,L,t=>{ let s=0;
      for(let k=0;k<D;k++){ let q=ph[k]+inc[k]; q-=Math.floor(q); ph[k]=q; s+=2*q-1; }
      const lf=.5-.5*Math.cos(6.2831853*rate*t/n.beat), kk=K.lpc(rate>0?150+2600*lf*lf:p.open);
      y1+=kk*(s/D*1.8-y1); y2+=kk*(y1-y2); i++;
      const x=y2*2.4; return (x<-3?-1:x>3?1:x*(27+x*x)/(27+9*x*x))*Math.min(1,i*ak)*(i>rS?Math.max(0,(iN-i)/(iN-rS)):1); },n.a*p.gain,n.pan);
  }});
registerInstrument({id:'growl',name:'Growl (wob dubstep)',kind:'melodic',desc:'FM con índice modulado por un LFO al ritmo → saturación → filtro que respira (portado de The Void).',
  params:[G(.18),{k:'rateB',label:'Wob (ciclos/pulso)',min:.5,max:8,step:.25,def:2}],
  play(K,n){
    const p=n.p,sr=n.sr,f=n.hz,rate=p.rateB/n.beat,L=n.len+.04; let pc=0,pm=0,y=0;
    K.add(n.buf,n.t,L,t=>{ pc+=f/sr; pm+=f*2.01/sr; pc-=Math.floor(pc); pm-=Math.floor(pm);
      const lf=.5+.5*Math.sin(6.2831853*rate*t), x=satf(2.5*Math.sin(6.2831853*pc+(1.5+6*lf)*Math.sin(6.2831853*pm)));
      y+=K.lpc(500+3000*lf)*(x-y);
      return y*Math.min(1,t/.008)*Math.min(1,(L-t)/.04)*1.3; },n.a*p.gain,n.pan);
  }});
registerInstrument({id:'bell',name:'Campana / cajita de música',kind:'melodic',buf:'mu',desc:'K.bell: parciales inarmónicos que decaen a distinta velocidad.',
  params:[G(.1),{k:'len',label:'Duración (s)',min:.3,max:6,step:.05,def:1.4}],
  play(K,n){K.bell(n.t,n.midi,n.a*n.p.gain,n.pan,n.p.len);}});
registerInstrument({id:'bellmk',name:'Campana (MK)',kind:'melodic',buf:'mu',desc:'Tres parciales inarmónicos (1 · 2.756 · 5.404) con ataque instantáneo: la campana de Cotton Sugar original.',
  params:[G(1),{k:'len',label:'Duración (s)',min:.3,max:6,step:.05,def:1.3}],
  play(K,n){ const f=n.hz,L=n.p.len; K.add(n.buf,n.t,L,t=>{ const w=6.2831853*f*t;
    return (Math.sin(w)*Math.exp(-t*3.2)+Math.sin(w*2.756)*.35*Math.exp(-t*7)+Math.sin(w*5.404)*.12*Math.exp(-t*12))*Math.min(1,t*1500); },n.a*n.p.gain,n.pan); }});
registerInstrument({id:'chop',name:'Sílaba cantada (chop)',kind:'melodic',buf:'mu',desc:'K.chop: sierra filtrada por dos resonadores (formantes de la vocal).',
  params:[G(.14),{k:'v',label:'Vocal',type:'choice',opts:['oh','ah','ee','oo'],vals:['oh','ah','ee','oo'],def:'oh'}],
  play(K,n){K.chop(n.t,n.len,n.midi,n.a*n.p.gain,n.pan,n.p.v);}});

// percusión y efectos de un solo carril
registerInstrument({id:'riser',name:'Riser (ruido ascendente)',kind:'perc',buf:'mu',desc:'K.riser: ruido filtrado que sube durante toda la nota.',params:[G(.45)],
  play(K,n){K.riser(n.t,n.len,n.a*n.p.gain);}});
registerInstrument({id:'sweep',name:'Barrido (seno)',kind:'perc',buf:'mu',desc:'K.sweep: seno que sube de f0 a f1 durante la nota.',
  params:[G(.07),{k:'f0',label:'Frecuencia inicial (Hz)',min:40,max:2000,step:5,def:300},{k:'f1',label:'Frecuencia final (Hz)',min:200,max:8000,step:10,def:2400}],
  play(K,n){K.sweep(n.t,n.len,n.p.f0,n.p.f1,n.a*n.p.gain);}});
registerInstrument({id:'wash',name:'Viento (ruido)',kind:'perc',desc:'Ruido filtrado con entrada y salida suaves (textura de fondo).',
  params:[G(.05),{k:'fc',label:'Corte (Hz)',min:200,max:8000,step:50,def:1500}],
  play(K,n){const p=n.p; let y=0; K.add(n.buf,n.t,n.len,t=>{ y+=K.lpc(p.fc)*(K.rnd()-y); return y*Math.min(1,t/.8)*Math.min(1,(n.len-t)/.8); },n.a*p.gain,n.pan);}});
registerInstrument({id:'impact',name:'Impacto (sub que cae)',kind:'perc',oneShot:true,desc:'Seno grave que cae de frecuencia; para marcar cambios de sección.',params:[G(.55)],
  play(K,n){K.add(n.buf,n.t,1.1,t=>Math.sin(2*Math.PI*(35*t+(85/3)*(1-Math.exp(-3*t))))*Math.exp(-t*2.6),n.a*n.p.gain,n.pan);}});
registerInstrument({id:'rim',name:'Rim (clic seco)',kind:'perc',oneShot:true,ducked:false,desc:'Tono corto + ruido seco; sincopa extra.',params:[G(.16)],
  play(K,n){let z=0; K.add(n.buf,n.t,.1,t=>{ const x=K.rnd(),v=x-z*.5; z=x; return Math.sin(2*Math.PI*880*t)*Math.exp(-t*70)+v*Math.exp(-t*90)*.6; },n.a*n.p.gain,n.pan);}});

// batería del kit
registerInstrument({id:'kick',name:'Bombo',kind:'perc',oneShot:true,buf:'dr',desc:'K.kick: seno que cae de hi a lo + clic.',
  params:[G(1),{k:'lo',label:'Grave final (Hz)',min:30,max:90,step:1,def:50},{k:'hi',label:'Ataque (Hz)',min:80,max:260,step:1,def:140},{k:'k',label:'Rapidez de caída',min:10,max:80,step:1,def:35},{k:'dec',label:'Decaimiento (1/s)',min:2,max:20,step:.1,def:8},{k:'len',label:'Duración (s)',min:.1,max:1,step:.01,def:.4},{k:'click',label:'Clic',min:0,max:1,step:.01,def:.3}],
  play(K,n){const p=n.p; K.kick(n.t,n.a*p.gain,{lo:p.lo,hi:p.hi,k:p.k,dec:p.dec,len:p.len,click:p.click});}});
registerInstrument({id:'snare',name:'Caja',kind:'perc',oneShot:true,buf:'dr',desc:'K.snare: ruido + tono.',
  params:[G(.85),{k:'tone',label:'Tono (Hz)',min:100,max:400,step:1,def:200},{k:'nd',label:'Caída ruido (1/s)',min:5,max:50,step:.5,def:18},{k:'td',label:'Caída tono (1/s)',min:5,max:80,step:.5,def:26},{k:'len',label:'Duración (s)',min:.08,max:.6,step:.01,def:.25}],
  play(K,n){const p=n.p; K.snare(n.t,n.a*p.gain,{tone:p.tone,nd:p.nd,td:p.td,len:p.len});}});
registerInstrument({id:'clap',name:'Palma',kind:'perc',oneShot:true,buf:'dr',desc:'K.clap: ráfagas de ruido.',params:[G(.5)],play(K,n){K.clap(n.t,n.a*n.p.gain);}});
registerInstrument({id:'snap',name:'Chasquido',kind:'perc',oneShot:true,buf:'dr',desc:'K.snap: chasquido de dedos.',params:[G(.2)],play(K,n){K.snap(n.t,n.a*n.p.gain,n.pan);}});
registerInstrument({id:'hat',name:'Hi-hat',kind:'perc',oneShot:true,buf:'dr',lanes:[{name:'Cerrado'},{name:'Abierto'}],desc:'K.hat: carril 1 cerrado, carril 2 abierto.',params:[G(.1)],
  play(K,n){K.hat(n.t,n.a*n.p.gain,Math.round(n.lane)===1,n.pan);}});
registerInstrument({id:'crash',name:'Crash',kind:'perc',oneShot:true,buf:'dr',desc:'K.crash: platillo de ruido.',params:[G(.3),{k:'len',label:'Duración (s)',min:.5,max:5,step:.1,def:2.4}],
  play(K,n){K.crash(n.t,n.a*n.p.gain,n.p.len);}});
registerInstrument({id:'clip',name:'Clip de audio horneado',kind:'perc',oneShot:true,hidden:true,desc:'Audio fijo capturado de una demo (un add() con función interna que no se puede parametrizar).',params:[G(1)],
  play(K,n){const d=n.clips&&n.clips[n.note.o&&n.note.o.cid]; if(!d) return; const sr=n.sr; K.add(n.buf,n.t,d.length/sr,t=>d[Math.round(t*sr)]||0,n.a*n.p.gain,n.pan);}});

// ───────────────────────── plugins de usuario ─────────────────────────
function evalPlugin(code){
  let def=null; const reg=d=>{def=d;return d;};
  try{ const f=new Function('registerInstrument',code); const ret=f(reg); if(!def&&ret&&typeof ret==='object') def=ret; }
  catch(e){ if(e instanceof SyntaxError){ let ok=false; try{ const r=new Function('return ('+code+')')(); if(r&&typeof r==='object'){def=r;ok=true;} }catch(e2){} if(!ok) throw e; } else throw e; }
  if(!def) throw new Error('El código no registró ningún instrumento: usa registerInstrument({ … })');
  return def;
}
function persistPlugins(){ try{ if(typeof localStorage!=='undefined') localStorage.setItem('demokit-studio-plugins',JSON.stringify(USER_PLUGINS)); }catch(e){} }
function installPlugin(code){
  const def=evalPlugin(code); registerInstrument(def,{user:true});
  const rec={id:def.id,name:def.name,code}; const i=USER_PLUGINS.findIndex(u=>u.id===def.id);
  if(i>=0) USER_PLUGINS[i]=rec; else USER_PLUGINS.push(rec); persistPlugins(); return def;
}
function removePlugin(id){ USER_PLUGINS=USER_PLUGINS.filter(u=>u.id!==id); persistPlugins(); }

// ───────────────────────── proyecto ─────────────────────────
// compás: P.sig=[numerador,denominador]; el «pulso» del proyecto es la negra, así que un compás dura sig[0]*4/sig[1] pulsos (4/4→4, 3/4→3, 6/8→3, 7/8→3.5)
const barBeats=P=>{ const s=P&&P.sig; return s&&s[0]>0&&s[1]>0?s[0]*4/s[1]:4; };
const SIGS=[[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[3,8],[5,8],[6,8],[7,8],[9,8],[12,8]];
function newProject(name,bpm,bars){return {name:name||'Sin título',bpm:bpm||120,bars:bars||8,sig:[4,4],seed:KIT_SEED,sc:{mode:'param',depth:.7,rel:.12,table:null,rate:800},master:Object.assign({},MASTER_DEF),tracks:[],clips:{}};}
function newTrack(instId,name){
  const inst=INSTRUMENTS[instId];
  return {id:uid(),name:name||inst.name,inst:instId,params:defaultParams(inst),vol:1,pan:0,mute:false,solo:false,
    ducked:inst.buf==='mu'?true:inst.buf==='dr'?false:inst.ducked!==false,sc:instId==='kick',notes:[]};
}
function fixTrack(t){ if(!t.id) t.id=uid(); const inst=INSTRUMENTS[t.inst]; if(inst) t.params=Object.assign(defaultParams(inst),t.params||{}); t.notes=t.notes||[]; t.vol=t.vol==null?1:t.vol; t.pan=t.pan||0; return t; }

function starterProject(){
  const P=newProject('Ejemplo',128,8); P.sc.depth=.7; P.sc.rel=.14;
  const T=id=>{const t=newTrack(id);P.tracks.push(t);return t;};
  const kick=T('kick'), clap=T('clap'), hat=T('hat'), sub=T('subfall'), chords=T('supersaw'), pad=T('pad'), pl=T('pluck');
  hat.params.gain=.12; sub.name='Bajo'; chords.name='Acordes'; pl.name='Pluck';
  const CH=[{r:36,t:[60,64,67,71]},{r:33,t:[57,60,64,67]},{r:29,t:[53,57,60,64]},{r:31,t:[55,59,62,64]}];
  for(let b=0;b<8;b++){
    const c=CH[b%4], o=b*4;
    for(let k=0;k<4;k++) kick.notes.push({b:o+k,l:.25,m:0,v:1});
    for(const k of [1,3]) clap.notes.push({b:o+k,l:.25,m:0,v:1});
    for(let i=0;i<8;i++) hat.notes.push({b:o+i*.5,l:.25,m:0,v:i%2?.4:.7,pan:i%2?.3:-.3});
    hat.notes.push({b:o+3.5,l:.25,m:1,v:1,pan:.3});
    sub.notes.push({b:o,l:3.6,m:c.r,v:1});
    for(const p of [0,1.5,2.5,3.25]) for(const m of c.t) chords.notes.push({b:o+p,l:.4,m:m+12,v:1,pan:r6(((m%3)-1)*.3)});
    for(const m of c.t) pad.notes.push({b:o,l:4,m,v:1,pan:r6(((m%5)-2)*.18)});
    if(b>=4){ const pat=(b%2)?[3,-1,2,-1,3,2,-1,2]:[3,-1,1,2,-1,1,2,-1]; pat.forEach((x,i)=>{ if(x>=0) pl.notes.push({b:o+i*.5,l:.42,m:c.t[x]+24,v:1,pan:i%2?.4:-.4}); }); }
  }
  return P;
}

// ───────────────────────── mapa de tempo (pulso ↔ segundos) ─────────────────────────
// P.bpm es el tempo inicial. P.tempo = [{b, bpm, ramp}] (pulsos > 0, ordenados): en el pulso b el tempo pasa a bpm.
// Con ramp:true el tempo cambia gradualmente (lineal por pulso) desde el punto anterior y llega a bpm en b (acelerando / ritardando).
// Sin puntos el mapa es constante y las cuentas son exactamente las de siempre (b·60/bpm).
const tmCache=new WeakMap();
function tempoPts(P){ return (P.tempo||[]).filter(p=>p&&p.b>0&&p.bpm>0).map(p=>({b:+p.b,bpm:clamp(+p.bpm,20,400),ramp:!!p.ramp})).sort((x,y)=>x.b-y.b); }
function tmap(P){
  const pts=tempoPts(P), key=P.bpm+'|'+JSON.stringify(pts), c=tmCache.get(P); if(c&&c.key===key) return c.tm;
  const beat0=60/P.bpm; let tm;
  if(!pts.length) tm={constant:true,key,beat0,slowBeat:beat0,sec:b=>b*beat0,beat:s=>s/beat0,span:(b,l)=>l*beat0,bpmAt:()=>P.bpm};
  else{
    const dur=(b0,b1,p0,p1)=>p0===p1?60*(b1-b0)/p0:60*(b1-b0)/(p1-p0)*Math.log(p1/p0), segs=[]; let cur={b:0,t:0,bpm:P.bpm}, slow=P.bpm;
    for(const p of pts){ const p1=p.ramp?p.bpm:cur.bpm, d=dur(cur.b,p.b,cur.bpm,p1); segs.push({b0:cur.b,b1:p.b,p0:cur.bpm,p1,t0:cur.t,t1:cur.t+d}); cur={b:p.b,t:cur.t+d,bpm:p.bpm}; slow=Math.min(slow,p.bpm); }
    segs.push({b0:cur.b,b1:Infinity,p0:cur.bpm,p1:cur.bpm,t0:cur.t,t1:Infinity});
    const segB=b=>{ for(let i=0;i<segs.length;i++) if(b<segs[i].b1) return segs[i]; return segs[segs.length-1]; };
    const segT=s=>{ for(let i=0;i<segs.length;i++) if(s<segs[i].t1) return segs[i]; return segs[segs.length-1]; };
    const kOf=g=>(g.p1-g.p0)/(g.b1-g.b0);
    const sec=b=>{ const g=segB(b), x=b-g.b0; if(g.p0===g.p1) return g.t0+60*x/g.p0; const px=g.p0+kOf(g)*x; return x===0?g.t0:g.t0+60*x/(px-g.p0)*Math.log(px/g.p0); };
    tm={constant:false,key,beat0,slowBeat:60/slow,sec,
      beat:s=>{ const g=segT(s), dt=s-g.t0; if(g.p0===g.p1) return g.b0+dt*g.p0/60; const k=kOf(g); return g.b0+(g.p0*Math.exp(k*dt/60)-g.p0)/k; },
      span:(b,l)=>sec(b+l)-sec(b),
      bpmAt:b=>{ const g=segB(b); return g.p0===g.p1?g.p0:g.p0+kOf(g)*(b-g.b0); }};
  }
  tmCache.set(P,{key,tm}); return tm;
}
// ───────────────────────── render ─────────────────────────
function noteArgs(K,P,tr,nt,beat,t0){
  const p=nt.o?Object.assign({},tr.params,nt.o):tr.params, tm=t0!=null?null:tmap(P), vb=!!tm&&!tm.constant, bpmN=vb?tm.bpmAt(nt.b):P.bpm, bt=vb?60/bpmN:beat;
  return {t:t0!=null?t0:(vb?tm.sec(nt.b):nt.b*beat),len:Math.max(.01,vb?tm.span(nt.b,nt.l||.25):(nt.l||.25)*beat),midi:nt.m,hz:K.hz(nt.m),lane:nt.m,a:(nt.v==null?1:nt.v)*(tr.vol==null?1:tr.vol),
    pan:clamp((tr.pan||0)+(nt.pan||0),-1,1),p,buf:tr.ducked?K.mu:K.dr,sr:SR,bpm:bpmN,beat:bt,bar:bt*barBeats(P),note:nt,clips:P.clips};
}
function makeDuck(P,beat){
  const sc=P.sc||{}, tm=tmap(P), vb=!tm.constant;
  if(sc.mode==='table'&&sc.table){ const T=sc.table,R=sc.rate||800; return t=>{ const x=t*R,i=Math.floor(x); if(i>=T.length-1) return T[T.length-1]; if(i<0) return T[0]; const f=x-i; return T[i]+(T[i+1]-T[i])*f; }; }
  const tr=[]; for(const t of P.tracks) if(t.sc) for(const n of t.notes) tr.push(vb?tm.sec(n.b):n.b*beat); tr.sort((a,b)=>a-b);
  if(!tr.length||!(sc.depth>0)) return ()=>1;
  const depth=sc.depth,rel=Math.max(.005,sc.rel||.1); let idx=0;
  return t=>{ while(idx+1<tr.length&&tr[idx+1]<=t) idx++; while(idx>0&&tr[idx]>t) idx--; if(tr[idx]>t) return 1; return 1-depth*Math.exp(-(t-tr[idx])/rel); };
}
// ───────────────────────── efectos: delay, reverb (por pista) y master (EQ + limitador) ─────────────────────────
// Trabajan sobre el audio ya renderizado, así que cambiar un efecto no vuelve a renderizar el instrumento.
const FX_DEF={delay:{on:false,time:.75,fb:.4,tone:4500,mix:.3,pp:true},reverb:{on:false,size:.65,damp:.5,mix:.25,pre:12}};
const MASTER_DEF={low:0,high:0,gain:1,limit:true,ceil:.97};
const fxOf=tr=>{ const f=(tr&&tr.fx)||{}; return {delay:Object.assign({},FX_DEF.delay,f.delay),reverb:Object.assign({},FX_DEF.reverb,f.reverb)}; };
const fxActive=fx=>!!((fx.delay.on&&fx.delay.mix>0)||(fx.reverb.on&&fx.reverb.mix>0));
const masterOf=P=>Object.assign({},MASTER_DEF,P.master);
const REV_WET=.74;      // calibración de la reverb (ver pruebas): con mezcla = 1 el nivel del agua ≈ nivel de la entrada
const revFbk=size=>.7+.26*clamp(size,0,1);                                    // máx .96 → cola de unos 5 s
const revComp=size=>{ const f=revFbk(size),r=revFbk(.65); return Math.sqrt((1-f*f)/(1-r*r)); };   // mantiene el volumen parecido al cambiar el tamaño
function delayFx(L,R,m,p,beat,tv){
  const vd=tv&&!tv.tm.constant, d=Math.max(1,Math.round(p.time*(vd?tv.tm.slowBeat:beat)*SR)), fb=clamp(p.fb,0,.92), a=1-Math.exp(-2*Math.PI*clamp(p.tone,200,16000)/SR), mix=clamp(p.mix,0,1), nL=L.length;
  const oL=new Float32Array(m),oR=new Float32Array(m),wL=new Float32Array(m),wR=new Float32Array(m); oL.set(L.subarray(0,Math.min(nL,m))); oR.set(R.subarray(0,Math.min(nL,m))); let yl=0,yr=0;
  let dd=d; for(let i=d;i<m;i++){ if(vd&&(i&255)===0){ const tn=tv.tm.beat((tv.s0+i)/SR); dd=Math.max(1,Math.min(i,Math.round(p.time*60/tv.tm.bpmAt(tn)*SR))); } const j=i-(vd?dd:d), xl=j<nL?L[j]:0, xr=j<nL?R[j]:0; let vl,vr;
    if(p.pp){ vl=.5*(xl+xr)+fb*wR[j]; vr=fb*wL[j]; } else { vl=xl+fb*wL[j]; vr=xr+fb*wR[j]; }      // ping-pong: el eco rebota entre izquierda y derecha
    yl+=a*(vl-yl); yr+=a*(vr-yr); wL[i]=yl; wR[i]=yr; oL[i]+=yl*mix; oR[i]+=yr*mix; }
  return [oL,oR];
}
function reverbFx(L,R,m,p){          // Freeverb: 8 peines + 4 pasatodo por canal, con un poco de separación estéreo
  const sc=SR/44100, cd=[1116,1188,1277,1356,1422,1491,1557,1617], ad=[556,441,341,225], sp=23;
  const fbk=revFbk(p.size), dmp=clamp(p.damp,0,1)*.6, pre=Math.round(clamp(p.pre,0,200)*SR/1000), wet=clamp(p.mix,0,1)*REV_WET*revComp(p.size)*3, nL=L.length;
  const mk=(arr,add)=>arr.map(v=>new Float32Array(Math.max(1,Math.round((v+add)*sc))));
  const cL=mk(cd,0),cR=mk(cd,sp),aL=mk(ad,0),aR=mk(ad,sp), ciL=new Int32Array(8),ciR=new Int32Array(8),aiL=new Int32Array(4),aiR=new Int32Array(4), fL=new Float32Array(8),fR=new Float32Array(8);
  const oL=new Float32Array(m),oR=new Float32Array(m);
  for(let i=0;i<m;i++){
    const j=i-pre, inp=(j>=0&&j<nL)?(L[j]+R[j])*.015:0; let sl=0,sr=0;
    for(let k=0;k<8;k++){
      let b=cL[k],ix=ciL[k],o=b[ix]; fL[k]=o*(1-dmp)+fL[k]*dmp; b[ix]=inp+fL[k]*fbk; ciL[k]=++ix>=b.length?0:ix; sl+=o;
      b=cR[k]; ix=ciR[k]; o=b[ix]; fR[k]=o*(1-dmp)+fR[k]*dmp; b[ix]=inp+fR[k]*fbk; ciR[k]=++ix>=b.length?0:ix; sr+=o;
    }
    for(let k=0;k<4;k++){
      let b=aL[k],ix=aiL[k],o=b[ix]; b[ix]=sl+o*.5; sl=o-sl; aiL[k]=++ix>=b.length?0:ix;
      b=aR[k]; ix=aiR[k]; o=b[ix]; b[ix]=sr+o*.5; sr=o-sr; aiR[k]=++ix>=b.length?0:ix;
    }
    oL[i]=(i<nL?L[i]:0)+sl*wet; oR[i]=(i<nL?R[i]:0)+sr*wet;
  }
  return [oL,oR];
}
function applyFx(L,R,fx,beat,maxLen,tv){      // → {L,R}; la salida puede ser más larga que la entrada (cola del eco y de la reverb)
  const n=L.length; let tail=0; const dly=fx.delay.on&&fx.delay.mix>0, rev=fx.reverb.on&&fx.reverb.mix>0;
  if(dly){ const d=Math.max(1,Math.round(fx.delay.time*(tv&&!tv.tm.constant?tv.tm.slowBeat:beat)*SR)), fb=clamp(fx.delay.fb,0,.92); tail+=Math.min(8*SR,d*((fb>0?Math.ceil(Math.log(.001)/Math.log(fb)):0)+1)); }
  if(rev){ const fbk=revFbk(fx.reverb.size); tail+=Math.min(6*SR,Math.ceil((1400/44100)*SR*Math.log(.001)/Math.log(fbk)))+Math.round(clamp(fx.reverb.pre,0,200)*SR/1000); }
  const m=Math.min(maxLen==null?n+tail:maxLen,n+tail); let a=L,b=R;
  if(dly) [a,b]=delayFx(a,b,m,fx.delay,beat,tv);
  if(rev) [a,b]=reverbFx(a,b,m,fx.reverb);
  return {L:a,R:b};
}
function fxStems(stems,fx,beat,N,tm){
  return stems.map(st=>{
    const len=st.q[0].length, g=st.pk/32767, L=new Float32Array(len), R=new Float32Array(len); for(let i=0;i<len;i++){ L[i]=st.q[0][i]*g; R[i]=st.q[1][i]*g; }
    const r=applyFx(L,R,fx,beat,N-st.s0,tm?{tm,s0:st.s0}:null), n=r.L.length; let pk=0; for(let i=0;i<n;i++){ const a=Math.abs(r.L[i]),b=Math.abs(r.R[i]); if(a>pk) pk=a; if(b>pk) pk=b; }
    const k=pk>0?32767/pk:0, qa=new Int16Array(n), qb=new Int16Array(n); for(let i=0;i<n;i++){ qa[i]=Math.round(r.L[i]*k); qb[i]=Math.round(r.R[i]*k); }
    return {bus:st.bus,s0:st.s0,pk,q:[qa,qb]};
  });
}
function withFx(P,tr,out,extra){            // para la vista previa y para tocar en vivo
  const fx=fxOf(tr); if(!fxActive(fx)) return out; const r=applyFx(out.L,out.R,fx,60/P.bpm,out.L.length+(extra==null?3*SR:extra)); return {L:r.L,R:r.R,dur:r.L.length/SR};
}
function shelf(L,R,f,dB,high){              // filtro shelving (biquad RBJ), en el sitio
  if(!dB) return; const A=Math.pow(10,dB/40), w=2*Math.PI*f/SR, cs=Math.cos(w), al=Math.sin(w)/2*Math.SQRT2, t=2*Math.sqrt(A)*al; let b0,b1,b2,a0,a1,a2;
  if(!high){ b0=A*((A+1)-(A-1)*cs+t); b1=2*A*((A-1)-(A+1)*cs); b2=A*((A+1)-(A-1)*cs-t); a0=(A+1)+(A-1)*cs+t; a1=-2*((A-1)+(A+1)*cs); a2=(A+1)+(A-1)*cs-t; }
  else { b0=A*((A+1)+(A-1)*cs+t); b1=-2*A*((A-1)+(A+1)*cs); b2=A*((A+1)+(A-1)*cs-t); a0=(A+1)-(A-1)*cs+t; a1=2*((A-1)-(A+1)*cs); a2=(A+1)-(A-1)*cs-t; }
  b0/=a0; b1/=a0; b2/=a0; a1/=a0; a2/=a0;
  for(const X of [L,R]){ let x1=0,x2=0,y1=0,y2=0; for(let i=0;i<X.length;i++){ const x=X[i], y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2; x2=x1; x1=x; y2=y1; y1=y; X[i]=y; } }
}
function masterFx(P,out){
  const m=masterOf(P); if(!m.low&&!m.high&&m.gain===1) return out;          // todo neutro: no se toca el sonido original
  const L=Float32Array.from(out.L), R=Float32Array.from(out.R), n=L.length; shelf(L,R,120,m.low,false); shelf(L,R,7000,m.high,true);
  const g=m.gain, ceil=clamp(m.ceil,.3,1), oL=new Float32Array(n), oR=new Float32Array(n);
  if(m.limit){      // limitador con anticipación de 1.5 ms: el audio se retrasa W muestras para que la ganancia ya haya bajado cuando llegue el pico
    const W=Math.round(.0015*SR), rel=1-Math.exp(-1/(.08*SR)); let gr=1;
    for(let i=0;i<n;i++){ const pk=Math.max(Math.abs(L[i]),Math.abs(R[i]))*g, t=pk>ceil?ceil/pk:1;
      if(t<gr) gr=Math.max(t,gr-1/W); else gr=Math.min(t,gr+(1-gr)*rel+1e-7);
      const j=i-W; if(j>=0){ oL[i]=clamp(L[j]*g*gr,-ceil,ceil); oR[i]=clamp(R[j]*g*gr,-ceil,ceil); } }
  } else for(let i=0;i<n;i++){ oL[i]=clamp(L[i]*g,-1,1); oR[i]=clamp(R[i]*g,-1,1); }
  return {L:oL,R:oR,dur:out.dur};
}

// ───────────────────────── render por pista (stems con caché) ─────────────────────────
// Cada pista se renderiza sola en su propio kit y se guarda como «stem» (Int16 recortado al tramo con sonido).
// La mezcla final se hace aparte con el K.mix del kit (sidechain, saturación suave, fundido). Volumen, mute y solo
// se aplican al mezclar, así que cambiarlos no vuelve a renderizar nada; editar una pista solo renderiza esa pista.
const stemCache=new Map(); let KIT_REV=0; const STEM_BUDGET=320*1048576;   // tope de memoria de la caché (bytes)
const stemBytes=c=>c.stems.reduce((a,st)=>a+st.q[0].length*4,0)+(c.fxStems?c.fxStems.reduce((a,st)=>a+st.q[0].length*4,0):0);
function stemMemory(){ let m=0; for(const c of stemCache.values()) m+=stemBytes(c); return m; }
function trimStems(keep){ let m=stemMemory(); if(m<=STEM_BUDGET) return; for(const [id,c] of stemCache){ if(keep.has(id)) continue; m-=stemBytes(c); stemCache.delete(id); if(m<=STEM_BUDGET) break; } }
function bumpKit(){ KIT_REV++; stemCache.clear(); }
function trackKey(P,tr,total){ const inst=INSTRUMENTS[tr.inst]; return hash2(JSON.stringify([tr.inst,inst?inst.rev:0,KIT_REV,tr.params,tr.pan,tr.ducked?1:0,P.bpm,tempoPts(P),P.seed,total,tr.notes])); }
const trackSeed=(P,tr)=>(((P.seed||KIT_SEED)^parseInt(hash2(String(tr.id)).split('-')[0],36))>>>0)||1;
function extractStems(K){
  const out=[];
  for(const bus of ['mu','dr']){
    const A=K[bus][0],B=K[bus][1],n=A.length; let s0=-1,s1=0;
    for(let i=0;i<n;i++){ if(A[i]!==0||B[i]!==0){ s0=i; break; } } if(s0<0) continue;
    for(let i=n-1;i>=s0;i--){ if(A[i]!==0||B[i]!==0){ s1=i+1; break; } }
    let pk=0; for(let i=s0;i<s1;i++){ const a=Math.abs(A[i]),b=Math.abs(B[i]); if(a>pk) pk=a; if(b>pk) pk=b; } if(!(pk>0)) continue;
    const k=32767/pk,qa=new Int16Array(s1-s0),qb=new Int16Array(s1-s0); for(let i=s0;i<s1;i++){ qa[i-s0]=Math.round(A[i]*k); qb[i-s0]=Math.round(B[i]*k); }
    out.push({bus,s0,pk,q:[qa,qb]});
  }
  return out;
}
async function renderTrackStem(P,tr,beat,total){
  const inst=INSTRUMENTS[tr.inst]; if(!inst) throw new Error('instrumento no disponible ('+tr.inst+')');
  const K=Kit.make(SR,total,trackSeed(P,tr)); K.sr=SR; const t=Object.assign({},tr,{vol:1}); let last=performance.now(),i=0;
  for(const nt of tr.notes.slice().sort((a,b)=>a.b-b.b)){ inst.play(K,noteArgs(K,P,t,nt,beat)); if(++i%25===0&&performance.now()-last>14){ await tick(); last=performance.now(); } }
  return extractStems(K);
}
async function ensureStems(P,trs,onProg,from,to){
  const beat=60/P.bpm, tmx=tmap(P), total=(tmx.constant?P.bars*beat*barBeats(P):tmx.sec(P.bars*barBeats(P)))+TAIL, live=new Set(P.tracks.map(t=>t.id)), errors=[], todo=[]; let tot=0;
  for(const id of [...stemCache.keys()]) if(!live.has(id)) stemCache.delete(id);
  for(const tr of trs){ const key=trackKey(P,tr,total),c=stemCache.get(tr.id); if(c&&c.key===key){ if(c.err) errors.push({track:tr.name,msg:c.err}); continue; } todo.push({tr,key}); tot+=tr.notes.length+1; }
  let done=0; for(const {tr,key} of todo){
    const e={key,stems:[]}; try{ e.stems=await renderTrackStem(P,tr,beat,total); }catch(err){ e.err=err.message; errors.push({track:tr.name,msg:err.message}); }
    stemCache.set(tr.id,e); done+=tr.notes.length+1; if(onProg) onProg(from+(to-from)*done/tot); await tick();
  }
  let fxN=0, N=Math.ceil(total*SR);
  for(const tr of trs){ const c=stemCache.get(tr.id); if(!c||c.err) continue; const fx=fxOf(tr), want=fxActive(fx)?hash2(JSON.stringify([fx,beat,tmx.key,c.key])):'';
    if(c.fxKey!==want){ c.fxStems=want?fxStems(c.stems,fx,beat,N,tmx):null; c.fxKey=want; if(want){ fxN++; await tick(); } } }
  return {errors,rendered:todo.length,fx:fxN,beat,total};
}
// ── automatización por pista (volumen, paneo, filtro): puntos {b,v} en pulsos, interpolación lineal; se aplica al mezclar,
// así que editarla no vuelve a renderizar ningún instrumento
const AUTO_DEF={vol:{label:'Volumen',min:0,max:1.5,def:1},pan:{label:'Paneo',min:-1,max:1,def:0},cut:{label:'Filtro',min:0,max:1,def:1}};
const cutHz=c=>80*Math.pow(18000/80,clamp(c,0,1));
function autoPts(tr,k){ const a=tr.auto&&tr.auto[k]; return a&&a.length?a.slice().sort((x,y)=>x.b-y.b):null; }
function autoValue(pts,b){ if(b<=pts[0].b) return pts[0].v; for(let j=0;j<pts.length-1;j++){ if(b<pts[j+1].b){ const d=pts[j+1].b-pts[j].b; return d>0?pts[j].v+(pts[j+1].v-pts[j].v)*(b-pts[j].b)/d:pts[j+1].v; } } return pts[pts.length-1].v; }
function autoSampler(pts,beat,tm){ let j=0; const T=pts.map(p=>(tm&&!tm.constant?tm.sec(p.b):p.b*beat)*SR), n=pts.length;
  return i=>{ if(i<=T[0]) return pts[0].v; while(j<n-1&&T[j+1]<=i) j++; if(j>=n-1) return pts[n-1].v; return pts[j].v+(pts[j+1].v-pts[j].v)*(i-T[j])/(T[j+1]-T[j]); }; }
function mixAuto(K0,st,vol,A,beat,tm){
  const q0=st.q[0],q1=st.q[1],d0=K0[st.bus][0],d1=K0[st.bus][1],o=st.s0,n=q0.length,base=vol*st.pk/32767;
  const sv=A.vol&&autoSampler(A.vol,beat,tm), sp=A.pan&&autoSampler(A.pan,beat,tm), sc=A.cut&&autoSampler(A.cut,beat,tm);
  let a1=0,a2=0,b1=0,b2=0,al=1;     // filtro: dos polos simples en cascada (12 dB/oct), un canal por cada par
  for(let i=0;i<n;i++){ const t=o+i; let g=base; if(sv) g*=Math.max(0,sv(t)); let x=q0[i]*g,y=q1[i]*g;
    if(sp){ const p=clamp(sp(t),-1,1); if(p>0) x*=1-p; else y*=1+p; }
    if(sc){ if((i&31)===0){ const c=sc(t); al=c>=.999?1:1-Math.exp(-2*Math.PI*cutHz(c)/SR); }
      if(al<1){ a1+=al*(x-a1); a2+=al*(a1-a2); b1+=al*(y-b1); b2+=al*(b1-b2); x=a2; y=b2; } else { a1=a2=x; b1=b2=y; } }
    d0[o+i]+=x; d1[o+i]+=y; }
}
async function mixStems(P,trs,total,beat){
  const K0=Kit.make(SR,total,P.seed||KIT_SEED); K0.sr=SR;
  for(const tr of trs){ const c=stemCache.get(tr.id); if(!c) continue; const vol=tr.vol==null?1:tr.vol, A={vol:autoPts(tr,'vol'),pan:autoPts(tr,'pan'),cut:autoPts(tr,'cut')}, any=A.vol||A.pan||A.cut;
    for(const st of (c.fxStems||c.stems)){ if(any){ mixAuto(K0,st,vol,A,beat,tmap(P)); continue; } const g=vol*st.pk/32767; for(let ch=0;ch<2;ch++){ const d=K0[st.bus][ch],q=st.q[ch],o=st.s0; for(let i=0;i<q.length;i++) d[o+i]+=q[i]*g; } }
    await tick(); }
  return K0.mix(makeDuck(P,beat));
}
async function renderProject(P,onProg){
  const solo=P.tracks.some(t=>t.solo), trs=P.tracks.filter(t=>!t.mute&&(!solo||t.solo));
  const r=await ensureStems(P,trs,onProg,0,.85); if(onProg) onProg(.9); await tick();
  const out=masterFx(P,await mixStems(P,trs,r.total,r.beat)); trimStems(new Set(trs.map(t=>t.id))); out.errors=r.errors; out.stats={tracks:trs.length,rendered:r.rendered,fx:r.fx}; return out;
}
// un audio por pista (con el sidechain y la saturación del master, como suenan solas); incluye pistas silenciadas
async function renderStems(P,onProg){
  const trs=P.tracks.filter(t=>t.notes.length), r=await ensureStems(P,trs,onProg,0,.5), files=[];
  for(let i=0;i<trs.length;i++){ const o=await mixStems(P,[trs[i]],r.total,r.beat); files.push({name:trs[i].name,L:o.L,R:o.R}); if(onProg) onProg(.5+.5*(i+1)/trs.length); await tick(); }
  return {files,errors:r.errors};
}
function previewBuffer(P,tr,nt){
  const inst=INSTRUMENTS[tr.inst]; if(!inst) throw new Error('instrumento no disponible');
  const beat=60/P.bpm, dur=Math.min(5,Math.max(.4,(nt.l||.25)*beat)+2.6), K=Kit.make(SR,dur,7); K.sr=SR;
  inst.play(K,noteArgs(K,P,tr,Object.assign({},nt,{b:0}),beat,0)); return withFx(P,tr,K.mix(()=>1));
}

// Nota para tocar en vivo: se renderiza con volumen 1 (el volumen y la velocidad se aplican después como ganancia),
// y el largo es fijo; al soltar la tecla la interfaz hace el fundido de salida.
function liveNoteBuffer(P,tr,m,lenSec){
  const inst=INSTRUMENTS[tr.inst]; if(!inst) throw new Error('instrumento no disponible');
  const beat=60/P.bpm, dur=inst.oneShot?3:lenSec+.8, K=Kit.make(SR,dur,7); K.sr=SR;
  const t=Object.assign({},tr,{vol:1});
  inst.play(K,noteArgs(K,P,t,{b:0,l:inst.oneShot?.25:lenSec/beat,m,v:1},beat,0)); return withFx(P,tr,K.mix(()=>1));
}

// ───────────────────────── WAV ─────────────────────────
function encodeWav(L,R,sr){
  const n=L.length,buf=new ArrayBuffer(44+n*4),v=new DataView(buf); const ws=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  ws(0,'RIFF'); v.setUint32(4,36+n*4,true); ws(8,'WAVE'); ws(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,2,true);
  v.setUint32(24,sr,true); v.setUint32(28,sr*4,true); v.setUint16(32,4,true); v.setUint16(34,16,true); ws(36,'data'); v.setUint32(40,n*4,true);
  let o=44; for(let i=0;i<n;i++){ let s=L[i]; s=s>1?1:s<-1?-1:s; v.setInt16(o,s<0?s*32768:s*32767,true); o+=2; s=R[i]; s=s>1?1:s<-1?-1:s; v.setInt16(o,s<0?s*32768:s*32767,true); o+=2; }
  return new Blob([buf],{type:'audio/wav'});
}

// ───────────────────────── (de)serialización ─────────────────────────
function u8ToB64(u8){let s='';const C=0x8000;for(let i=0;i<u8.length;i+=C)s+=String.fromCharCode.apply(null,u8.subarray(i,i+C));return btoa(s);}
function b64ToU8(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}
const KIT_FORMAT=1;      // sube cuando un cambio del kit/motor haga sonar distinto un proyecto ya guardado
const NOTE_KEYS=new Set(['b','l','m','v','pan','o']);
function compactNote(n){
  for(const k in n) if(!NOTE_KEYS.has(k)) return n;                        // con campos desconocidos se guarda tal cual
  const q=x=>Math.round(x*1e5)/1e5, v=n.v==null?1:n.v, pan=n.pan||0, hasO=n.o&&Object.keys(n.o).length;
  const a=[q(n.b),q(n.l==null?.25:n.l),n.m]; if(v!==1||pan||hasO) a.push(v); if(pan||hasO) a.push(pan); if(hasO) a.push(n.o); return a;
}
function compactTrack(t){
  const inst=INSTRUMENTS[t.inst], def=inst?defaultParams(inst):null, o={id:t.id,name:t.name,inst:t.inst};
  const prm={}; for(const k in (t.params||{})) if(!def||t.params[k]!==def[k]) prm[k]=t.params[k]; if(Object.keys(prm).length) o.params=prm;
  if(t.vol!=null&&t.vol!==1) o.vol=t.vol; if(t.pan) o.pan=t.pan; if(t.mute) o.mute=true; if(t.solo) o.solo=true; o.ducked=!!t.ducked; if(t.sc) o.sc=true;
  if(t.fx) o.fx=t.fx; if(t.auto) o.auto=t.auto; o.n=t.notes.map(compactNote); return o;
}
function expandTrack(t){ if(!Array.isArray(t.n)) return t; t.notes=t.n.map(a=>{ if(!Array.isArray(a)) return a; const n={b:a[0],l:a[1],m:a[2],v:a[3]==null?1:a[3]}; if(a[4]) n.pan=a[4]; if(a[5]) n.o=a[5]; return n; }); delete t.n; return t; }
function projectToJSON(P,opts){
  const compact=!!(opts&&opts.compact);
  const o={format:'demokit-studio',v:compact?2:1,kit:KIT_FORMAT,name:P.name,bpm:P.bpm,bars:P.bars,tempo:(P.tempo&&P.tempo.length)?P.tempo:undefined,sig:barBeats(P)===4&&(!P.sig||P.sig[1]===4)?undefined:P.sig,seed:P.seed,sc:{mode:P.sc.mode,depth:P.sc.depth,rel:P.sc.rel,rate:P.sc.rate},master:masterOf(P),key:P.key||undefined,tracks:compact?P.tracks.map(compactTrack):P.tracks,clips:{},plugins:[]};
  if(P.sc.table){ const T=P.sc.table,u=new Uint8Array(T.length); for(let i=0;i<T.length;i++) u[i]=Math.round(clamp(T[i],0,1)*255); o.sc.table=u8ToB64(u); }
  for(const cid in P.clips){ const d=P.clips[cid],q=new Int16Array(d.length); for(let i=0;i<d.length;i++) q[i]=clamp(Math.round(d[i]*16384),-32768,32767); o.clips[cid]=u8ToB64(new Uint8Array(q.buffer)); }
  const used=new Set(P.tracks.map(t=>t.inst)); for(const u of USER_PLUGINS) if(used.has(u.id)) o.plugins.push(u);
  return o;
}
// peso de cada parte del archivo compacto (para avisar de lo que lo infla)
function projectReport(P){
  const o=projectToJSON(P,{compact:true}), len=x=>JSON.stringify(x).length, notes=o.tracks.reduce((a,t)=>a+len(t.n),0);
  return {total:len(o),notes,noteCount:P.tracks.reduce((a,t)=>a+t.notes.length,0),clips:len(o.clips),clipCount:Object.keys(o.clips).length,plugins:len(o.plugins),tracks:o.tracks.length};
}
// opts.allowPlugins===false: no se ejecuta el código de los plugins incluidos (por defecto sí, para compatibilidad; el estudio pregunta antes)
function projectFromJSON(o,opts){
  const errs=[], skipped=[]; for(const u of o.plugins||[]){ if(opts&&opts.allowPlugins===false){ skipped.push(u.name||u.id); continue; } try{ installPlugin(u.code); }catch(e){ errs.push(u.id+': '+e.message); } }
  const P=newProject(o.name,o.bpm,o.bars); if(Array.isArray(o.tempo)) P.tempo=tempoPts({bpm:o.bpm,tempo:o.tempo}); if(Array.isArray(o.sig)&&o.sig[0]>0&&o.sig[1]>0) P.sig=[+o.sig[0],+o.sig[1]]; P.seed=o.seed||KIT_SEED; Object.assign(P.sc,o.sc||{}); P.sc.table=null; P.master=Object.assign({},MASTER_DEF,o.master||{}); if(o.key) P.key=Object.assign({root:0,scale:'off',fit:false},o.key);
  if(o.sc&&o.sc.table){ const u=b64ToU8(o.sc.table),T=new Float32Array(u.length); for(let i=0;i<u.length;i++) T[i]=u[i]/255; P.sc.table=T; }
  for(const cid in o.clips||{}){ const u=b64ToU8(o.clips[cid]),q=new Int16Array(u.buffer,u.byteOffset,u.length>>1),d=new Float32Array(q.length); for(let i=0;i<q.length;i++) d[i]=q[i]/16384; P.clips[cid]=d; }
  P.tracks=(o.tracks||[]).map(t=>fixTrack(expandTrack(t))); P.loadErrors=errs; P.loadWarnings=[]; if(skipped.length) P.loadWarnings.push('Plugins sin ejecutar: '+skipped.join(', ')+'. Las pistas que los usan quedan sin instrumento.'); if(o.kit!=null&&o.kit!==KIT_FORMAT) P.loadWarnings.push('Este proyecto se guardó con la versión '+o.kit+' del kit y esta es la '+KIT_FORMAT+(o.kit>KIT_FORMAT?': puede sonar distinto o faltar instrumentos. Actualiza la librería.':': puede sonar un poco distinto.')); return P;
}

// ───────────────────────── conversión de demos → proyecto editable ─────────────────────────
// Se ejecuta la demo con un "kit grabador": cada llamada a kick/snare/syn/bell/… queda registrada en lugar de sonar.
// Las funciones auxiliares conocidas (reese, growl, rim, wash, impact) se interceptan reescribiendo su cabecera.
const HELPERS={
  reese:{inst:'reese',buf:'mu',map(a,bt){const [t0,len,m,amp,o]=a,oo=o||{};
    if(a.length>=6||typeof o==='number'){const [,,f,am,rate,open]=a;return{inst:'reesemk',t0,len,m:+(69+12*Math.log2(f/440)).toFixed(4),a:am,pan:0,p:{rateB:rate||0,open:open||400}};}
    return{t0,len,m,a:amp,pan:0,p:{lfoB:r6((oo.lfo||0)*bt),lo:oo.lo||300,hi:oo.hi||1400,drive:oo.drive||2.2}};}},
  bell:{inst:'bellmk',buf:'mu',map(a){const [t0,m,amp,pan,len]=a;return{t0,len:null,m,a:amp,pan:pan||0,p:{len:len||1.3}};}},
  growl:{inst:'growl',buf:'mu',map(a,bt){const [t0,len,m,amp,rate]=a;return{t0,len,m,a:amp,pan:0,p:{rateB:r6(rate*bt)}};}},
  rim:{inst:'rim',buf:'dr',map(a){const [t0,amp,pan]=a;return{t0,len:null,m:0,a:amp,pan:pan||0,p:{}};}},
  wash:{inst:'wash',buf:'mu',map(a){const [t0,len,amp,fc]=a;return{t0,len,m:0,a:amp,pan:0,p:{fc}};}},
  impact:{inst:'impact',buf:'mu',map(a){const [t0,amp]=a;return{t0,len:null,m:0,a:amp,pan:0,p:{}};}}
};
function detToParams(det){
  const V=det.length; if(V===1) return det[0]===0?{voices:1,spread:0}:{voices:1,spread:0,detRaw:det.slice()};
  const S=Math.max.apply(null,det.map(Math.abs)),gen=[]; for(let i=0;i<V;i++) gen.push(-S+2*S*i/(V-1));
  return gen.every((g,i)=>Math.abs(g-det[i])<1e-6)?{voices:V,spread:S}:{voices:V,spread:S,detRaw:det.slice()};
}
function lpToParams(lp){
  if(lp==null) return {lp:3000,lpSweep:0,lpRate:10};
  if(typeof lp==='number') return {lp,lpSweep:0,lpRate:10};
  const src=String(lp), m=/^\s*\(?\s*t\s*\)?\s*=>\s*([\d.]+)\s*\+\s*([\d.]+)\s*\*\s*Math\.exp\(\s*-\s*t\s*\*\s*([\d.]+)\s*\)\s*$/.exec(src);
  return m?{lp:+m[1],lpSweep:+m[2],lpRate:+m[3]}:{lp:3000,lpSweep:0,lpRate:10,lpSrc:src};
}
function callerName(skip){
  try{ const st=(new Error().stack||'').split('\n'); const bad=new Set(['callerName','add','Object.add','K.add','Array.map','map','Object.assign']);
    for(const s of st){ const m=/at\s+(?:async\s+)?([A-Za-z_$][\w$.]*)\s*\(/.exec(s)||/^\s*([A-Za-z_$][\w$]*)@/.exec(s); if(!m||bad.has(m[1])) continue; return m[1]===skip?'inline':m[1]; } }catch(e){}
  return '?';
}
function mapEvent(e,bt){
  const mid=f=>{const m=69+12*Math.log2(f/440),r=Math.round(m);return Math.abs(m-r)<1e-3?r:+m.toFixed(3);};
  const oneShot=(inst,t0,a,pan,m,p)=>({inst,buf:'dr',t0,len:null,m:m||0,a,pan:pan||0,p:p||{}});
  switch(e.fn){
    case 'kick':{const o=e.o;return oneShot('kick',e.t0,e.a,0,0,{lo:o.lo||46,hi:o.hi||151,k:o.k||30,dec:o.dec||6.5,len:o.len||.45,click:o.click==null?.3:o.click});}
    case 'snare':{const o=e.o;return oneShot('snare',e.t0,e.a,0,0,{tone:o.tone||185,nd:o.nd||20,td:o.td||28,len:o.len||.25});}
    case 'clap': return oneShot('clap',e.t0,e.a,0,0);
    case 'snap': return oneShot('snap',e.t0,e.a,e.pan,0);
    case 'hat': return oneShot('hat',e.t0,e.a,e.pan,e.open?1:0);
    case 'crash': return oneShot('crash',e.t0,e.a,0,0,{len:e.len});
    case 'syn':{const o=e.o,p=Object.assign({w:o.w||0,atk:o.atk||.004,rel:o.rel||.06,dec:o.dec||0,detRaw:null,lpSrc:null},detToParams(o.det||[0]),lpToParams(o.lp));
      return {inst:'sinte',buf:e.buf,t0:e.t0,len:e.len,m:mid(e.f),a:e.a,pan:e.pan,p,gkey:JSON.stringify([e.buf,p.w,o.det||[0],p.atk,p.rel,p.dec])};}
    case 'bell': return {inst:'bell',buf:'mu',t0:e.t0,len:null,m:e.m,a:e.a,pan:e.pan,p:{len:e.len}};
    case 'chop': return {inst:'chop',buf:'mu',t0:e.t0,len:e.len,m:e.m,a:e.a,pan:e.pan,p:{v:e.v}};
    case 'riser': return {inst:'riser',buf:'mu',t0:e.t0,len:e.len,m:0,a:e.a,pan:0,p:{}};
    case 'sweep': return {inst:'sweep',buf:'mu',t0:e.t0,len:e.len,m:0,a:e.a,pan:0,p:{f0:e.f0,f1:e.f1}};
    case 'helper':{const h=HELPERS[e.name],x=h.map(e.args,bt);return Object.assign({inst:h.inst,buf:h.buf},x);}
    case 'add': return {inst:'clip',buf:e.buf,t0:e.t0,len:e.len,m:0,a:e.amp,pan:e.pan,p:{},data:e.data,caller:e.caller};
  }
  return null;
}
const TRACK_NAMES={kick:'Bombo',snare:'Caja',clap:'Palma',snap:'Chasquido',hat:'Hi-hat',crash:'Crash',bell:'Campanas',bellmk:'Campanas',reesemk:'Reese',chop:'Sílabas (chop)',riser:'Riser',sweep:'Barrido',reese:'Reese',growl:'Growl',rim:'Rim',wash:'Viento',impact:'Impacto'};
function guessName(g){
  if(TRACK_NAMES[g.inst]) return TRACK_NAMES[g.inst];
  if(g.inst==='clip') return 'Clip · '+(g.caller==='inline'?'add() en línea':g.caller);
  const p=g.items[0].p; if(p.atk>=.3) return 'Pad'; if(p.w===2) return 'Sub (seno)'; if(p.voices>=5) return 'Supersaw';
  if(p.dec>=5) return p.w===1?'Arpegio cuadrado':'Pluck / arpegio'; return p.voices>1?'Sinte':'Capa de sierra';
}
function buildProject(events,meta){
  const beat=60/meta.bpm, P=newProject(meta.title,meta.bpm,meta.bars); P.seed=meta.seed||KIT_SEED;
  const groups=new Map(); let nItems=0;
  for(const e of events){ const it=mapEvent(e,beat); if(!it) continue; nItems++;
    const key=it.gkey||(it.inst+'|'+it.buf+(it.inst==='clip'?'|'+it.caller:'')); let g=groups.get(key);
    if(!g){ g={inst:it.inst,buf:it.buf,caller:it.caller,items:[]}; groups.set(key,g); } g.items.push(it); }
  let ci=0; const trs=[], seen={};
  for(const g of groups.values()){
    const inst=INSTRUMENTS[g.inst], base=defaultParams(inst); let gain=0; for(const it of g.items) gain=Math.max(gain,it.a||0); if(!(gain>0)) gain=1;
    const keys=new Set(); g.items.forEach(it=>Object.keys(it.p).forEach(k=>keys.add(k)));
    for(const k of keys){ const cnt=new Map(); let best=null,bn=0; for(const it of g.items){ const s=JSON.stringify(it.p[k]),c=(cnt.get(s)||0)+1; cnt.set(s,c); if(c>bn){bn=c;best=it.p[k];} } base[k]=best; }
    base.gain=r6(gain);
    const notes=g.items.map(it=>{
      const nt={b:r6(it.t0/beat),l:it.len!=null?r6(it.len/beat):.25,m:it.m,v:r6((it.a||0)/gain)}; if(it.pan) nt.pan=r6(it.pan);
      const o={}; for(const k of keys){ if(JSON.stringify(it.p[k])!==JSON.stringify(base[k])) o[k]=it.p[k]===undefined?null:it.p[k]; }
      if(it.data){ const cid='c'+(++ci); P.clips[cid]=it.data; o.cid=cid; }
      if(Object.keys(o).length) nt.o=o; return nt; }).sort((a,b)=>a.b-b.b);
    let name=guessName(g); seen[name]=(seen[name]||0)+1; if(seen[name]>1) name+=' '+seen[name];
    trs.push({id:uid(),name,inst:g.inst,params:base,vol:1,pan:0,mute:false,solo:false,ducked:g.buf==='mu',sc:g.inst==='kick',notes});
  }
  const rank=['kick','snare','clap','snap','hat','crash']; const ord=t=>{const i=rank.indexOf(t.inst);return i<0?100:i;};
  P.tracks=trs.map((t,i)=>({t,i})).sort((a,b)=>ord(a.t)-ord(b.t)||a.i-b.i).map(x=>x.t);
  if(meta.duckAt){ const R=800,N=Math.ceil((meta.seconds||0)*R)+2,T=new Float32Array(N); for(let i=0;i<N;i++) T[i]=clamp(meta.duckAt(i/R),0,1.5);
    P.sc.table=T; P.sc.rate=R; P.sc.mode='table'; let mn=1; for(const v of T) if(v<mn) mn=v; P.sc.depth=r6(clamp(1-mn,.05,.95)); P.sc.rel=.09; }
  return {project:P,stats:{tracks:P.tracks.length,notes:nItems,clips:ci}};
}
// makeKit (make_kit.js) → adaptador sobre demoKit.metric (salida idéntica muestra a muestra a la original)
function makeKitOn(metric){ return (sr,BPM,BARS,tail,seed0)=>{ const K=metric(sr,BPM,BARS,tail,seed0), T=K.T, bar=K.bar,
  soft=x=>x<-3?-1:x>3?1:x*(27+x*x)/(27+9*x*x), k0=K.kick, r0=K.riser, kick=(t0,a,f0,dk)=>{ f0=f0||46; k0(t0,a,{lo:f0,hi:f0+105,dec:dk||6.5}); };
  return Object.assign(K,{soft,kick,riser:(bs,a)=>r0(T(bs,0),4*bar,a||.5)}); }; }
function stripMakeKit(src){ const mk=/(^|\n)[ \t]*function\s+makeKit\s*\(/.exec(src), rn=/(^|\n)[ \t]*async\s+function\s+render\w*\s*\(/.exec(src);
  if(mk&&rn&&mk.index<rn.index) return {src:src.slice(0,mk.index+(mk[1]?1:0))+src.slice(rn.index+(rn[1]?1:0)),used:true}; return {src,used:false}; }
// compila una demo .js (con demoKit o con makeKit) y devuelve su función render
function compileDemo(src,fnName,sleepFn){ const st=stripMakeKit(src);
  return new Function('demoKit','sleep','makeKit',st.src+'\nreturn '+fnName+';')(Kit.make,sleepFn,Kit.make&&Kit.make.metric?makeKitOn(Kit.make.metric):undefined); }
async function recordDemo(src,opts){
  opts=opts||{};
  const m=/async\s+function\s+(render\w*)\s*\(/.exec(src); if(!m) throw new Error('No encontré una función async render…(sr, onProg) en el archivo.');
  const fnName=m[1], events=[]; let duckAt=null, seconds=0, seed=null;
  const bm=/\bBPM\s*=\s*([\d.]+)/.exec(src)||/([\d.]+)\s*BPM/i.exec(src); let bpm=bm?+bm[1]:(opts.bpm||120);
  const bake=(fn,len)=>{ const N=Math.max(0,Math.floor(len*SR)),d=new Float32Array(N); for(let i=0;i<N;i++) d[i]=fn(i/SR); return d; };
  let mBpm=null,mBars=null;
  const recKit=(sr,secs,seed0)=>{
    seconds=secs; seed=seed0; const real=Kit.make(sr,.05,seed0), K=Object.assign({},real), rec=(fn,o)=>{events.push(Object.assign({fn},o));};
    K.n=Math.ceil(secs*sr);
    K.kick=(t0,a,o)=>rec('kick',{t0,a,o:Object.assign({},o||{})});
    K.snare=(t0,a,o)=>rec('snare',{t0,a,o:Object.assign({},o||{})});
    K.clap=(t0,a)=>rec('clap',{t0,a});
    K.snap=(t0,a,pan)=>rec('snap',{t0,a,pan:pan||0});
    K.hat=(t0,a,open,pan)=>rec('hat',{t0,a,open:!!open,pan:pan||0});
    K.crash=(t0,a,len)=>rec('crash',{t0,a,len:len||2.4});
    K.syn=(buf,t0,len,f,a,pan,o)=>rec('syn',{buf:buf===real.mu?'mu':'dr',t0,len,f,a,pan:pan||0,o:Object.assign({},o||{})});
    K.bell=(t0,mm,a,pan,len)=>rec('bell',{t0,m:mm,a,pan:pan||0,len:len||1.4});
    K.chop=(t0,len,mm,a,pan,v)=>rec('chop',{t0,len,m:mm,a,pan:pan||0,v:v||'oh'});
    K.riser=(t0,len,a)=>rec('riser',{t0,len,a});
    K.sweep=(t0,len,f0,f1,a)=>rec('sweep',{t0,len,f0,f1,a});
    K.add=(buf,t0,len,fn,amp,pan)=>rec('add',{buf:buf===real.mu?'mu':'dr',t0,len,amp,pan:pan||0,data:bake(fn,len),caller:callerName(fnName)});
    K.mix=(d,dk)=>{duckAt=typeof d==='function'?d:null; if(typeof d!=='function'&&K.duckBars) duckAt=K.duckBars(d||[],dk); return{L:new Float32Array(1),R:new Float32Array(1),dur:secs};};
    return K;
  };
  recKit.metric=(sr,BPM,BARS,tail,seed0)=>{
    mBpm=BPM; mBars=BARS; const beat=60/BPM,bar=beat*4,K=recKit(sr,BARS*bar+(tail==null?2.5:tail),seed0);
    K.BPM=BPM; K.BARS=BARS; K.beat=beat; K.bar=bar; K.T=(b,p)=>b*bar+(p||0)*beat;
    K.duckBars=(arr,dk)=>t=>{ const b=Math.min(BARS-1,Math.floor(t/bar)); return 1-(t<BARS*bar?(arr[b]||0):0)*Math.exp(-(t%beat)/(dk||.13)); };
    return K;
  };
  const makeKitShim=makeKitOn(recKit.metric);
  const __enter=(name,args)=>{ if(!HELPERS[name]) return false; events.push({fn:'helper',name,args:args.map(x=>x&&typeof x==='object'?Object.assign({},x):x)}); return true; };
  const sm=stripMakeKit(src), work=sm.src, usedMakeKit=sm.used;
  const patched=work.replace(/(^|\n)([ \t]*)function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/g,(mm,pre,ws,name,args)=>{
    if(/[{\[.]/.test(args)) return mm; const list=args.split(',').map(s=>s.split('=')[0].trim()).filter(Boolean);
    return pre+ws+'function '+name+'('+args+'){ if(__enter('+JSON.stringify(name)+',['+list.join(',')+'])) return;'; });
  const patched2=patched.replace(/(^|\n)([ \t]*)(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\(([^)]*)\)\s*=>\s*\{/g,(mm,pre,ws,name,args)=>{
    if(!HELPERS[name]||/[{\[.=]/.test(args)) return mm; const list=args.split(',').map(x=>x.trim()).filter(Boolean);
    return mm+' if(__enter('+JSON.stringify(name)+',['+list.join(',')+'])) return;'; });
  const render=new Function('demoKit','sleep','__enter','makeKit',patched2+'\nreturn '+fnName+';')(recKit,sleep,__enter,makeKitShim);
  await render(SR,null);
  if(mBpm) bpm=mBpm;
  const beat=60/bpm, bm2=/\bBARS\s*=\s*(\d+)/.exec(src), bars=mBars||(bm2?+bm2[1]:Math.max(1,Math.round((seconds-TAIL)/(beat*4))));
  const tm=/^\/\/\s*[─\-—–\s]*([^·\n]+?)\s*·/m.exec(src);
  const title=opts.name||(tm?tm[1].trim():fnName);
  const res=buildProject(events,{bpm,bars,seed,seconds,duckAt,title});
  const ws=[]; if(res.stats.notes<8) ws.push('Casi no se registraron notas ('+res.stats.notes+'): esta demo probablemente usa un kit propio que el conversor no reconoce.');
  if(res.stats.clips>150) ws.push('Muchos clips ('+res.stats.clips+'): hay funciones propias que se hornean como audio y el proyecto pesará mucho.');
  res.warnings=ws; res.makeKit=usedMakeKit; return res;
}

// ═══════════════════════════════════════════════════════════════════════
//  DEMO KIT · librería para usar en otros proyectos (sin interfaz)
//  Carga y renderiza canciones .demokit.json (proyectos del estudio) o demos .js «a mano»,
//  y las reproduce con Web Audio. Todo se sintetiza en el momento: no hay muestras.
// ═══════════════════════════════════════════════════════════════════════
persistPlugins=function(){};            // en la librería no se escribe en localStorage
const LIB_VERSION='1.2.0';
let _ctx=null, _dest=null, _out=null;
function audioCtx(){
  if(!_ctx){ const AC=(typeof AudioContext!=='undefined'&&AudioContext)||(typeof webkitAudioContext!=='undefined'&&webkitAudioContext); if(!AC) throw new Error('Este entorno no tiene Web Audio: usa DemoKit.load() y lee song.L / song.R'); _ctx=new AC({latencyHint:'interactive'}); }
  return _ctx;
}
function audioOut(){ const c=audioCtx(); if(!_out){ _out=c.createGain(); _out.connect(_dest||c.destination); } return _out; }
const wait=p=>p&&typeof p.then==='function'?p:Promise.resolve(p);

class Song{
  constructor(m,out){
    this.name=m.name; this.kind=m.kind; this.bpm=m.bpm||null; this.bars=m.bars||null; this.bpb=m.bpb||4; this.sig=m.sig||null; this.loopSec=m.loopSec||0; this.warnings=m.warnings||[];
    this.L=out.L; this.R=out.R; this.sampleRate=SR; this.duration=out.L.length/SR;
    this.loopEnd=m.loopSec?Math.min(this.duration,m.loopSec):(m.bpm&&m.bars)?Math.min(this.duration,m.bars*(m.bpb||4)*60/m.bpm):this.duration;   // el final «musical», sin la cola de reverberación
    this._buf=null; this._bufCtx=null; this._handles=new Set();
  }
  buffer(){ const c=audioCtx(); if(this._buf&&this._bufCtx===c) return this._buf; const b=c.createBuffer(2,this.L.length,SR); b.copyToChannel(this.L,0); b.copyToChannel(this.R,1); this._buf=b; this._bufCtx=c; return b; }
  // opciones: loop, volume (0..1+), fadeIn (s), offset (s), loopStart/loopEnd (s)
  play(o){ o=o||{}; const c=audioCtx(); if(c.state==='suspended') c.resume();
    const src=c.createBufferSource(), g=c.createGain(); src.buffer=this.buffer(); const vol=o.volume==null?1:o.volume;
    if(o.fadeIn>0){ g.gain.setValueAtTime(0,c.currentTime); g.gain.linearRampToValueAtTime(vol,c.currentTime+o.fadeIn); } else g.gain.value=vol;
    if(o.loop){ src.loop=true; src.loopStart=o.loopStart||0; src.loopEnd=o.loopEnd||this.loopEnd; }
    src.connect(g); g.connect(audioOut()); src.start(0,Math.max(0,o.offset||0));
    const self=this; let done=false, resolveEnd; const ended=new Promise(r=>resolveEnd=r);
    const h={source:src,ended,
      setVolume(v,fade){ const t=c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value,t); g.gain.linearRampToValueAtTime(v,t+(fade||0.02)); },
      stop(fade){ if(done) return; const t=c.currentTime, f=Math.max(.02,fade==null?.05:fade); g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value,t); g.gain.linearRampToValueAtTime(0,t+f); try{ src.stop(t+f+.02); }catch(e){} } };
    src.onended=()=>{ done=true; self._handles.delete(h); try{ g.disconnect(); }catch(e){} resolveEnd(); };
    this._handles.add(h); return h; }
  stop(fade){ for(const h of [...this._handles]) h.stop(fade); }
  wav(){ return encodeWav(this.L,this.R,SR); }                 // Blob audio/wav
}

const isDemoJs=s=>/async\s+function\s+render\w*\s*\(/.test(s);
const looksJson=s=>/^\s*\{/.test(s);
function scanDemo(src){
  const fn=(/async\s+function\s+(render\w*)\s*\(/.exec(src)||[])[1], line=((/^\/\/(.*)$/m.exec(src)||[])[1]||'');
  const name=line.replace(/^[\s─\-—–]+/,'').split(/\s+(?:─+|·|\|)\s*/)[0].trim()||fn;
  const bpm=+((/\bBPM\s*=\s*(\d+(?:\.\d+)?)/.exec(src)||/(\d+(?:\.\d+)?)\s*BPM/.exec(src)||[])[1])||0, bars=+((/\bBARS\s*=\s*(\d+)/.exec(src)||[])[1])||0;
  const mt=/(?:demoKit\.metric|makeKit)\(\s*\w+\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+)\s*[,)]/.exec(src);
  const sg=/\bSIG\s*=\s*(\d+)\s*\/\s*(\d+)/.exec(src);
  return {fn,name,bpm:bpm||(mt?+mt[1]:0),bars:bars||(mt?+mt[2]:0),bpb:sg?+sg[1]*4/+sg[2]:4,sig:sg?[+sg[1],+sg[2]]:null};
}
async function readSource(source,opts){
  if(source&&typeof source==='object'&&!(typeof Response!=='undefined'&&source instanceof Response)) return {obj:source};
  if(typeof source!=='string') throw new Error('DemoKit.load espera una URL, el texto de un archivo o un objeto de proyecto');
  let txt=source;
  if(!looksJson(txt)&&!isDemoJs(txt)){ if(typeof fetch!=='function') throw new Error('No hay fetch en este entorno: pasa el texto del archivo'); const r=await fetch(txt,opts&&opts.fetch); if(!r.ok) throw new Error('No pude cargar «'+source+'» ('+r.status+')'); txt=await r.text(); }
  if(looksJson(txt)) return {obj:JSON.parse(txt)};
  if(isDemoJs(txt)) return {js:txt};
  throw new Error('El archivo no es un proyecto .demokit.json ni una demo .js con «async function render…»');
}
// ── caché en IndexedDB: la primera vez se renderiza, las siguientes se carga el audio ya hecho ──
// La llave mezcla el contenido del archivo, la versión de la librería, el código del kit en uso y las opciones que cambian el resultado.
const CACHE_DB='demokit-cache', CACHE_MAX=12;
const idb=()=>{ try{ return typeof indexedDB!=='undefined'?indexedDB:null; }catch(e){ return null; } };
function hash53(str){ let h1=0xdeadbeef,h2=0x41c6ce57; for(let i=0;i<str.length;i++){ const c=str.charCodeAt(i); h1=Math.imul(h1^c,2654435761); h2=Math.imul(h2^c,1597334677); }
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909); h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return (4294967296*(2097151&h2)+(h1>>>0)).toString(36); }
function cacheKey(rd,opts){ const body=rd.js!=null?rd.js:JSON.stringify(rd.obj); return [LIB_VERSION,hash53(String(Kit.make)),opts.allowPlugins?'p':'-',SR,hash53(body),body.length].join('|'); }
function cacheDb(){ return new Promise(res=>{ try{ const q=idb().open(CACHE_DB,1); q.onupgradeneeded=()=>q.result.createObjectStore('songs'); q.onsuccess=()=>res(q.result); q.onerror=q.onblocked=()=>res(null); }catch(e){ res(null); } }); }
async function cacheGet(key){ const db=await cacheDb(); if(!db) return null; return new Promise(res=>{ try{ const q=db.transaction('songs').objectStore('songs').get(key); q.onsuccess=()=>{ const r=q.result; db.close(); res(r&&r.L&&r.R?r:null); }; q.onerror=()=>{ db.close(); res(null); }; }catch(e){ res(null); } }); }
async function cachePut(key,song){ try{ const db=await cacheDb(); if(!db) return; const tx=db.transaction('songs','readwrite'), st=tx.objectStore('songs');
  st.put({meta:{name:song.name,kind:song.kind,bpm:song.bpm,bars:song.bars,bpb:song.bpb,sig:song.sig,loopSec:song.loopSec,warnings:song.warnings},L:song.L,R:song.R,t:Date.now()},key);
  const all=st.openCursor(), olds=[]; all.onsuccess=()=>{ const c=all.result; if(c){ olds.push({k:c.key,t:c.value.t||0}); c.continue(); } else if(olds.length>CACHE_MAX){ olds.sort((a,b)=>a.t-b.t); for(const o of olds.slice(0,olds.length-CACHE_MAX)) st.delete(o.k); } };
  tx.oncomplete=()=>db.close(); tx.onerror=tx.onabort=()=>db.close(); }catch(e){} }
function cacheClear(){ return new Promise(res=>{ if(!idb()) return res(false); try{ const q=idb().deleteDatabase(CACHE_DB); q.onsuccess=()=>res(true); q.onerror=q.onblocked=()=>res(false); }catch(e){ res(false); } }); }
// opciones: onProgress(p 0..1), cache (true por defecto: guarda el audio renderizado en IndexedDB), allowPlugins (false por defecto: el código de plugins incluido en un archivo no se ejecuta salvo que confíes en él)
async function load(source,opts){
  opts=opts||{}; const prog=opts.onProgress||null, rd=await readSource(source,opts);
  const useCache=opts.cache!==false&&!!idb(), key=useCache?cacheKey(rd,opts):null;
  if(useCache){ const hit=await cacheGet(key); if(hit){ if(prog) prog(1); const sg=new Song(hit.meta,{L:hit.L,R:hit.R}); sg.cached=true; return sg; } }
  const song=await renderSource(rd,opts,prog);
  if(useCache) cachePut(key,song);                    // sin await: guardar no retrasa la música
  return song;
}
async function renderSource(rd,opts,prog){
  if(rd.obj){
    const o=rd.obj; if(o.format!=='demokit-studio') throw new Error('No es un proyecto de Demo Kit (falta format:"demokit-studio")');
    const warnings=[], plugs=(o.plugins||[]).length; let use=o;
    if(plugs&&!opts.allowPlugins){ use=Object.assign({},o,{plugins:[]}); warnings.push(plugs+' plugin(s) ignorados: el archivo trae código propio. Usa {allowPlugins:true} solo si confías en él.'); }
    const P=projectFromJSON(use); if(P.loadErrors&&P.loadErrors.length) warnings.push(...P.loadErrors); if(P.loadWarnings) warnings.push(...P.loadWarnings);
    const out=await renderProject(P,prog?(p=>prog(Math.min(1,p))):null); if(out.errors) for(const e of out.errors) warnings.push('Pista «'+e.track+'»: '+e.msg);
    if(prog) prog(1); return new Song({name:P.name,kind:'project',bpm:P.bpm,bars:P.bars,bpb:barBeats(P),sig:P.sig,loopSec:tmap(P).sec(P.bars*barBeats(P)),warnings},out);
  }
  const m=scanDemo(rd.js); if(!m.fn) throw new Error('No encontré la función render…');
  const fn=compileDemo(rd.js,m.fn,sleep);
  const out=await fn(SR,prog?(p=>prog(Math.min(1,p/.85))):null); if(!out||!out.L) throw new Error('La demo no devolvió {L, R}');
  if(prog) prog(1); return new Song({name:m.name,kind:'demo',bpm:m.bpm,bars:m.bars,bpb:m.bpb,sig:m.sig,warnings:[]},out);
}
const DemoKit={version:LIB_VERSION,sampleRate:SR,load,clearCache:cacheClear,
  unlock(){ const c=audioCtx(); return c.state==='suspended'?c.resume():Promise.resolve(); },                // llámalo dentro de un clic/toque
  useContext(ctx,destination){ _ctx=ctx; _dest=destination||null; _out=null; },                               // para integrarlo con el audio de tu juego
  setVolume(v,fade){ const o=audioOut(),c=audioCtx(),t=c.currentTime; o.gain.cancelScheduledValues(t); o.gain.setValueAtTime(o.gain.value,t); o.gain.linearRampToValueAtTime(v,t+(fade||.02)); },
  setKit(f){ if(typeof f!=='function') throw new Error('setKit espera la función demoKit'); Kit.make=f; },
  get context(){ return _ctx; }};
globalThis.DemoKit=DemoKit; if(typeof module!=='undefined'&&module.exports) module.exports=DemoKit;

})();
