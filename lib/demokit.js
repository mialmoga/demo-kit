/* Demo Kit · librería v1.5 — https://github.com/mialmoga/demo-kit */
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
    o=o||{};
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
let SR=44100, OSF=1, HQ=false, TAIL=2.5, KIT_SEED=20261015;   // OSF = sobremuestreo de la síntesis y HQ = stems en coma flotante: solo los activa la exportación de audio
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
// Categorías de instrumento (solo para organizar y colorear; no cambian el sonido). Un plugin puede declarar cat:'perc'|'mel'|'acomp'|'fx'.
const CATS={perc:{name:'Percusión',color:'#f2b3bd'},mel:{name:'Melódico',color:'#b4c9f2'},acomp:{name:'Acompañamiento',color:'#b5e3c9'},fx:{name:'Efectos',color:'#d6c2f0'}};   // pasteles
const CAT_ORDER=['perc','mel','acomp','fx'];
const CAT_OF={kick:'perc',snare:'perc',clap:'perc',snap:'perc',hat:'perc',crash:'perc',rim:'perc',clip:'perc',
  sinte:'mel',pluck:'mel',bell:'mel',bellmk:'mel',chop:'mel',
  pad:'acomp',supersaw:'acomp',arp:'acomp',sub:'acomp',subfall:'acomp',reese:'acomp',reesemk:'acomp',growl:'acomp',
  riser:'fx',sweep:'fx',wash:'fx',impact:'fx'};
const catOf=d=>CATS[d&&d.cat]?d.cat:((d&&CAT_OF[d.id])||(d&&d.kind==='perc'?'perc':'mel'));
const slug=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'inst';
function registerInstrument(def,opts){
  if(!def||typeof def.play!=='function') throw new Error('El instrumento necesita una función play(K, n)');
  def.name=def.name||'Sin nombre'; def.id=def.id||slug(def.name); def.kind=def.kind==='perc'?'perc':'melodic'; def.cat=catOf(def);
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
  play(K,n){const cid=n.note.o&&n.note.o.cid, d=n.clips&&n.clips[cid]; if(!d) return; const sr=n.sr, r=n.clips[cid+'~r'];
    if(r){ const g=n.a*n.p.gain*.70711; K.add(n.buf,n.t,d.length/sr,t=>d[Math.round(t*sr)]||0,g,-1); K.add(n.buf,n.t,r.length/sr,t=>r[Math.round(t*sr)]||0,g,1); return; }   // clip estéreo (horneado): canal izquierdo y derecho por separado
    K.add(n.buf,n.t,d.length/sr,t=>d[Math.round(t*sr)]||0,n.a*n.p.gain,n.pan);}});

// ───────────────────────── plugins de usuario ─────────────────────────
function evalPlugin(code){
  let def=null; const reg=d=>{def=d;return d;};
  try{ const f=new Function('registerInstrument',code); const ret=f(reg); if(!def&&ret&&typeof ret==='object') def=ret; }
  catch(e){ if(e instanceof SyntaxError){ let ok=false; try{ const r=new Function('return ('+code+')')(); if(r&&typeof r==='object'){def=r;ok=true;} }catch(e2){} if(!ok) throw e; } else throw e; }
  if(!def) throw new Error('El código no registró ningún instrumento: usa registerInstrument({ … })');
  return def;
}
// Versiones de plugin: «version:'1.2'» (mayor.menor) en la definición. Mismo mayor = compatible hacia atrás (solo se añaden parámetros y opciones).
// Sin campo cuenta como 1.0, así los plugins anteriores a esto siguen valiendo.
const parseVer=v=>{ const m=/^\s*(\d+)(?:\.(\d+))?/.exec(String(v==null?'':v)); return m?[+m[1],+(m[2]||0)]:[1,0]; };
const cmpVer=(a,b)=>a[0]-b[0]||a[1]-b[1];
const verStr=a=>a[0]+'.'+a[1];
function codeVersion(code){ const m=/version\s*:\s*['"]([\d.]+)['"]/.exec(code||''); return parseVer(m&&m[1]); }   // leída del texto, sin ejecutar nada
// Los plugins temporales (de un proyecto) viven solo mientras ese proyecto está abierto: no se guardan en el navegador y, si pisan a uno instalado, lo guardan en «shadow» para devolverlo.
function persistPlugins(){ if(typeof DK_NO_PERSIST!=='undefined') return; try{ if(typeof localStorage!=='undefined') localStorage.setItem('demokit-studio-plugins',JSON.stringify(USER_PLUGINS.map(u=>u.temp?u.shadow:u).filter(Boolean).map(u=>({id:u.id,name:u.name,code:u.code})))); }catch(e){} }
function installPlugin(code,opts){
  const def=evalPlugin(code); registerInstrument(def,{user:true});
  const rec={id:def.id,name:def.name,code,version:verStr(parseVer(def.version))}; const i=USER_PLUGINS.findIndex(u=>u.id===def.id), prev=i>=0?USER_PLUGINS[i]:null;
  if(opts&&opts.temp){ rec.temp=true; rec.from=opts.from||''; rec.shadow=prev?(prev.temp?prev.shadow:prev):null; }
  if(i>=0) USER_PLUGINS[i]=rec; else USER_PLUGINS.push(rec); persistPlugins(); return def;
}
// devuelve el estado de antes de abrir el proyecto: quita los temporales y repone los instalados que habían pisado
function restoreTemps(){ let n=0;
  for(const u of USER_PLUGINS.slice()){ if(!u.temp) continue; n++; const i=USER_PLUGINS.indexOf(u);
    if(u.shadow){ try{ registerInstrument(evalPlugin(u.shadow.code),{user:true}); USER_PLUGINS[i]=u.shadow; continue; }catch(e){ console.warn('plugin',u.id,e); } }
    USER_PLUGINS.splice(i,1); delete INSTRUMENTS[u.id]; const k=INST_ORDER.indexOf(u.id); if(k>=0) INST_ORDER.splice(k,1); }
  return n; }
function removePlugin(id){ USER_PLUGINS=USER_PLUGINS.filter(u=>u.id!==id); persistPlugins(); }

// ───────────────────────── proyecto ─────────────────────────
// compás: P.sig=[numerador,denominador]; el «pulso» del proyecto es la negra, así que un compás dura sig[0]*4/sig[1] pulsos (4/4→4, 3/4→3, 6/8→3, 7/8→3.5)
const barBeats=P=>{ const s=P&&P.sig; return s&&s[0]>0&&s[1]>0?s[0]*4/s[1]:4; };

// ── mapa de compases: P.sig = compás inicial; P.sigs = [{bar, sig:[n,d]}] cambios a partir del compás `bar` (0 = primero; solo en límites de compás).
// Sin cambios el mapa es constante (bar·barBeats) y todo sale exactamente como antes. Las notas y el tempo están en pulsos: no se mueven; lo que cambia es dónde caen las barras.
const mmCache=new WeakMap();
// ── secciones de la canción: P.marks = [{bar,name,c?}]  (bar = compás 0-based donde empieza; dura hasta la siguiente marca). Solo organizan: no afectan al audio.
const MARK_PAL=['#d9b38c','#9ec5a0','#8fb3d9','#c9a0d6','#d6a0a0','#b8c98f','#8fcfc9','#c7b8e0'];
function markPts(P){ const m=new Map(); for(const x of (P&&P.marks)||[]){ if(!x||!(x.bar>=0)) continue; const bar=Math.floor(x.bar), o={bar,name:String(x.name==null?'':x.name).trim().slice(0,40)||'Sección'}; if(x.c>=0&&x.c<MARK_PAL.length) o.c=x.c|0; if(x.cue&&typeof x.cue==='object'&&Object.keys(x.cue).length) o.cue=JSON.parse(JSON.stringify(x.cue)); m.set(bar,o); } return [...m.values()].sort((a,b)=>a.bar-b.bar); }
function markColor(mk){ if(mk.c!=null&&MARK_PAL[mk.c]) return MARK_PAL[mk.c]; const s=String(mk.name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[\s\d]+$/,''); let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return MARK_PAL[h%MARK_PAL.length]; }
function sigPts(P){ const m=new Map(); for(const x of (P&&P.sigs)||[]) if(x&&x.bar>0&&x.sig&&x.sig[0]>0&&x.sig[1]>0) m.set(Math.floor(x.bar),[+x.sig[0],+x.sig[1]]); return [...m].sort((a,b)=>a[0]-b[0]).map(([bar,sig])=>({bar,sig})); }
function meter(P){
  const pts=sigPts(P), key=(P.sig||'')+'|'+(pts.length?JSON.stringify(pts):''), c=mmCache.get(P); if(c&&c.key===key) return c.mm;
  const sg0=(P.sig&&P.sig[0]>0&&P.sig[1]>0)?P.sig:[4,4], bb0=barBeats(P); let mm;
  if(!pts.length) mm={constant:true,bb:bb0,sig:sg0,total:n=>n*bb0,beatOfBar:i=>i*bb0,lenAt:()=>bb0,sigAtBar:()=>sg0,barAt:b=>{ const i=Math.max(0,Math.floor(b/bb0+1e-9)); return {i,start:i*bb0,len:bb0,sig:sg0}; }};
  else{ const segs=[{bar0:0,b0:0,len:bb0,sig:sg0}]; for(const p of pts){ const q=segs[segs.length-1]; segs.push({bar0:p.bar,b0:q.b0+(p.bar-q.bar0)*q.len,len:p.sig[0]*4/p.sig[1],sig:p.sig}); }
    const segB=b=>{ let g=segs[0]; for(const q of segs){ if(q.b0<=b+1e-9) g=q; else break; } return g; }, segI=i=>{ let g=segs[0]; for(const q of segs){ if(q.bar0<=i) g=q; else break; } return g; };
    mm={constant:false,bb:bb0,sig:sg0,segs,total:n=>{ const g=segI(n); return g.b0+(n-g.bar0)*g.len; },beatOfBar:i=>{ const g=segI(i); return g.b0+(i-g.bar0)*g.len; },lenAt:b=>segB(b).len,sigAtBar:i=>segI(i).sig,
      barAt:b=>{ const g=segB(Math.max(0,b)), i=g.bar0+Math.max(0,Math.floor((Math.max(0,b)-g.b0)/g.len+1e-9)); return {i,start:g.b0+(i-g.bar0)*g.len,len:g.len,sig:g.sig}; }}; }
  mmCache.set(P,{key,mm}); return mm;
}

// ── banco de sonidos: cada sección (marca) del proyecto puede ser un «cue» con nombre (hover, click, error…). La metadata va dentro de la marca (mk.cue) y el proyecto lleva P.bank={v:1,theme:'default'}.
// Tipos: 'one' (disparo), 'loop' (bucle sin costura), 'gate' (presionar → mantener → soltar: ataque, zona que se repite y cola de soltar).
const CUE_TYPES=['one','loop','gate'];
const cueSlug=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'cue';
function cueOf(mk){ const c=(mk&&mk.cue)||{}, n=x=>+x||0;
  return {id:c.id?cueSlug(c.id):cueSlug(mk&&mk.name), type:CUE_TYPES.includes(c.type)?c.type:'one', vars:clamp(Math.round(n(c.vars)||1),1,6), vol:clamp(n(c.vol),-24,12), jp:clamp(n(c.jp),0,1200), jv:clamp(n(c.jv),0,12),
    grp:String(c.grp||'').trim().slice(0,24), cd:clamp(Math.round(n(c.cd)),0,5000), att:clamp(n(c.att),0,10), rel:clamp(n(c.rel),0,60), tail:c.tail==null||c.tail===''?null:clamp(n(c.tail),0,8), pit:!!c.pit, tn:c.tn==null||c.tn===''?null:clamp(Math.round(n(c.tn)),-36,36)}; }
// lista de cues: una por marca; dura desde su compás hasta el de la siguiente marca (o el final del proyecto)
function bankCues(P){ const mm=meter(P), tm=tmap(P), L=markPts(P).filter(m=>m.bar<P.bars), out=[], seen=new Map();
  for(let i=0;i<L.length;i++){ const m=L[i], bar1=i+1<L.length?Math.min(P.bars,L[i+1].bar):P.bars, b0=mm.beatOfBar(m.bar), b1=mm.beatOfBar(bar1), c=cueOf(m);
    const q={mk:m,c,bar0:m.bar,bar1,b0,b1,sec:tm.sec(b1)-tm.sec(b0)}; if(seen.has(c.id)){ q.dup=true; seen.get(c.id).dup=true; } else seen.set(c.id,q); out.push(q); }
  return out; }
// proyecto mínimo con solo lo que cae dentro del cue (notas y automatización movidas al inicio); variant cambia la semilla del azar → tomas distintas
function cueProject(P,q,variant){
  const mm=meter(P), tm=tmap(P), solo=P.tracks.some(t=>t.solo), b0=q.b0, b1=q.b1, E=1e-9;
  const Q={name:(P.name||'banco')+'·'+q.c.id,bpm:Math.round(tm.bpmAt(b0)*1000)/1000||P.bpm,bars:Math.max(1,q.bar1-q.bar0),sig:mm.sigAtBar(q.bar0).slice(),seed:(((P.seed||KIT_SEED)+(variant|0)*7919)>>>0)||1,
    sc:P.sc,master:P.master,clips:Object.assign({},P.clips),key:P.key,tracks:[]};
  for(const tr of P.tracks){ if(tr.mute||(solo&&!tr.solo)) continue; const notes=[]; for(const n of tr.notes) if(n.b>=b0-E&&n.b<b1-E) notes.push(Object.assign({},n,{b:n.b-b0})); if(!notes.length) continue;
    const t=Object.assign({},tr,{notes}); if(tr.auto){ const a={}; for(const k in tr.auto){ const pts=tr.auto[k].slice().sort((x,y)=>x.b-y.b), o=[]; let prev=null; for(const p of pts){ if(p.b<b0-E) prev=p; else if(p.b<b1+E) o.push({b:p.b-b0,v:p.v}); }
        if(prev&&(!o.length||o[0].b>E)) o.unshift({b:0,v:prev.v}); if(o.length) a[k]=o; } t.auto=a; }
    Q.tracks.push(t); }
  return Q; }

// ── armado de un cue (lo usan el estudio y el banco «en vivo»: mismo código → mismo sonido)
function foldLoop(L,R,n){ const N=L.length; if(N<=n) return [L,R]; const a=new Float32Array(n), b=new Float32Array(n); a.set(L.subarray(0,n)); b.set(R.subarray(0,n)); for(let i=n;i<N;i++){ const j=(i-n)%n; a[j]+=L[i]; b[j]+=R[i]; } return [a,b]; }
function bankEdge(L,R,thr,last){ if(last){ for(let i=L.length-1;i>=0;i--) if(Math.abs(L[i])>thr||Math.abs(R[i])>thr) return i; return -1; } for(let i=0;i<L.length;i++) if(Math.abs(L[i])>thr||Math.abs(R[i])>thr) return i; return -1; }
const bankFade=(x,i0,i1,up)=>{ const n=Math.max(1,i1-i0); for(let i=i0;i<i1&&i<x.length;i++){ const w=(i-i0)/n; x[i]*=up?w:1-w; } };
// corta y prepara el audio crudo de un cue según su tipo; devuelve {L,R,h?} con h = largo del cuerpo (gate) en segundos
function bankShape(q,L,R,sr){ const c=q.c; let a,b,h=0;
  if(c.type==='loop'){ const n=Math.max(1,Math.round(q.sec*sr)); [a,b]=foldLoop(L,R,n); if(a.length<n){ const A=new Float32Array(n),B=new Float32Array(n); A.set(a); B.set(b); a=A; b=B; } return {L:a,R:b}; }
  if(c.type==='gate'){ const xf=Math.round(.02*sr), r=Math.min(L.length-1,Math.round((c.rel>0?c.rel:q.sec)*sr)), s=Math.max(xf+1,Math.round(Math.max(c.att,.04)*sr)), end=bankEdge(L,R,3e-4,true);
    const hn=Math.max(s+xf+2,r), tl=Math.min(L.length,Math.max(hn+1,end+Math.round(.002*sr)))-hn, A=Float32Array.from(L.subarray(0,hn+tl)), B=Float32Array.from(R.subarray(0,hn+tl));
    if(hn-s>xf*2) for(let i=0;i<xf;i++){ const w=i/xf, co=Math.cos(w*Math.PI/2), si=Math.sin(w*Math.PI/2), j=hn-xf+i; A[j]=L[j]*co+L[s-xf+i]*si; B[j]=R[j]*co+R[s-xf+i]*si; }
    bankFade(A,hn+tl-Math.round(.003*sr),hn+tl,false); bankFade(B,hn+tl-Math.round(.003*sr),hn+tl,false); return {L:A,R:B,h:hn/sr,a:s/sr}; }
  const i0=Math.max(0,bankEdge(L,R,1e-3,false)-Math.round(.0005*sr)), i1=bankEdge(L,R,3e-4,true);
  if(i1<0) return {L:new Float32Array(1),R:new Float32Array(1)};
  a=Float32Array.from(L.subarray(i0,i1+Math.round(.004*sr))); b=Float32Array.from(R.subarray(i0,i1+Math.round(.004*sr)));
  bankFade(a,0,Math.round(.0003*sr),true); bankFade(b,0,Math.round(.0003*sr),true); bankFade(a,a.length-Math.round(.003*sr),a.length,false); bankFade(b,b.length-Math.round(.003*sr),b.length,false); return {L:a,R:b}; }
// renderiza un cue (una toma) a la frecuencia de salida; el proyecto principal conserva su caché de stems
// render crudo de un cue ya extraído (Q = cueProject): estéreo a la frecuencia sr (si sr<44100 se renderiza a 44100 y se decima)
async function cueRenderRaw(Q,tail,sr){ const t0=TAIL,s0=SR,o0=OSF,h0=HQ,RS=sr<44100?44100:sr; TAIL=tail; SR=RS; OSF=1; HQ=false;
  try{ const o=await renderProject(Q,null); let L=o.L,R=o.R; if(RS!==sr){ L=await decimatePow2(L,sr,RS/sr); R=await decimatePow2(R,sr,RS/sr); } return {L,R}; }
  finally{ TAIL=t0; SR=s0; OSF=o0; HQ=h0; } }
// cue terminado: render → recorte / bucle / gate → ganancia (ya calculada en el estudio) → mono. cq={type,att,rel,tail}
async function cueFinal(Q,cq,sec,sr,gdb,mono){ const raw=await cueRenderRaw(Q,cq.tail==null?(cq.type==='loop'?0:1.5):cq.tail,sr), sh=bankShape({c:cq,sec},raw.L,raw.R,sr);
  const g=Math.pow(10,gdb/20); let L=new Float32Array(sh.L.length), R=new Float32Array(sh.R.length), pk=0; for(let i=0;i<L.length;i++){ L[i]=sh.L[i]*g; R[i]=sh.R[i]*g; const a=Math.abs(L[i]),b=Math.abs(R[i]); if(a>pk) pk=a; if(b>pk) pk=b; }
  if(pk>.995){ const f=.995/pk; for(let i=0;i<L.length;i++){ L[i]*=f; R[i]*=f; } }
  if(mono){ const m=new Float32Array(L.length); for(let i=0;i<m.length;i++) m[i]=(L[i]+R[i])/2; L=R=m; }
  return {L,R,len:L.length,h:sh.h||0,a:sh.a||0}; }
const SIGS=[[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[3,8],[5,8],[6,8],[7,8],[9,8],[12,8]];
// ── progresión de acordes del proyecto: P.prog = {text}. Texto tipo «Am7 | Dm7 G7 | Cmaj7 %»; «|» separa compases, varios acordes en un compás lo reparten por igual,
// «%» solo en un compás (o un compás vacío) repite el compás anterior; «%» o «.» junto a otros acordes sostienen el anterior. La progresión se repite si el proyecto es más largo.
// Lo leen los instrumentos con progAt(P,beat) y el botón «Generar pista de acordes»; los proyectos sin P.prog no cambian en nada.
const PC_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'], PC_FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const PC_OF={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function parseChord(sym){
  let m=/^([A-G])([#b♯♭]?)(.*?)(?:\/([A-G])([#b♯♭]?))?$/.exec(String(sym).trim()); if(!m) return null;
  const acc=a=>a==='#'||a==='♯'?1:a==='b'||a==='♭'?-1:0, root=((PC_OF[m[1]]+acc(m[2]))%12+12)%12, bass=m[4]?((PC_OF[m[4]]+acc(m[5]))%12+12)%12:null;
  let rest=m[3].replace(/[()\s,]/g,''), third=4, fifth=7, seventh=null, sixth=false, ext=[], adds=[], maj=false, dim=false, power=false, alt=false;
  const T=[ // [regex, acción]; el orden importa (los más largos primero)
    [/^(maj|Maj|MAJ|Δ|∆|M)(?=\d)/,()=>{ maj=true; }], [/^(maj|Maj|MAJ|Δ|∆)/,()=>{}],
    [/^(min|mi|m|-)/,()=>{ third=3; }], [/^(dim|°|o)/,()=>{ third=3; fifth=6; dim=true; }], [/^(ø|half)/,()=>{ third=3; fifth=6; seventh=10; }],
    [/^(aug|\+)/,()=>{ fifth=8; }], [/^sus(2|4)?/,(x)=>{ third=x[1]==='2'?2:5; }], [/^add(2|4|6|9|11|13)/,(x)=>{ adds.push({2:2,4:5,6:9,9:14,11:17,13:21}[x[1]]); }],
    [/^(b5|♭5|-5)/,()=>{ fifth=6; }], [/^(#5|♯5|\+5)/,()=>{ fifth=8; }], [/^(b9|♭9)/,()=>{ ext.push(13); }], [/^(#9|♯9)/,()=>{ ext.push(15); }],
    [/^(#11|♯11)/,()=>{ ext.push(18); }], [/^(b13|♭13)/,()=>{ ext.push(20); }], [/^alt/,()=>{ alt=true; }],
    [/^69/,()=>{ sixth=true; ext.push(14); }], [/^6/,()=>{ sixth=true; }],
    [/^(13|11|9|7)/,(x)=>{ const n=+x[1]; seventh=maj?11:dim&&n===7?9:10; if(n>=9) ext.push(14); if(n===11) ext.push(17); if(n===13) ext.push(21); }],
    [/^5/,()=>{ power=true; }] ];
  while(rest){ let ok=false; for(const [re,fn] of T){ const x=re.exec(rest); if(x){ fn(x); rest=rest.slice(x[0].length); ok=true; break; } } if(!ok) return null; }
  if(alt){ seventh=10; ext.push(13,15); fifth=6; }
  const ivs=new Set([0]); if(!power) ivs.add(third); ivs.add(fifth); if(seventh!=null) ivs.add(seventh); if(sixth) ivs.add(9); for(const e of ext) ivs.add(e); for(const a of adds) ivs.add(a);
  const arr=[...ivs].sort((a,b)=>a-b); return {sym:String(sym).trim(),root,bass,ivs:arr,pcs:[...new Set(arr.map(i=>(root+i)%12))]};
}
const progCache=new WeakMap();
function progChords(P){
  const text=(P.prog&&P.prog.text)||''; const mm=meter(P), key=text+'|'+P.bars+'|'+(P.sig||'')+'|'+JSON.stringify(sigPts(P)), c=progCache.get(P); if(c&&c.key===key) return c.res;
  const res={chords:[],errors:[],cycleBars:0}; progCache.set(P,{key,res});
  const bars=text.split('|').map(x=>x.trim()); while(bars.length&&bars[bars.length-1]==='') bars.pop();       // un «|» final no añade un compás vacío
  if(bars[0]==='') bars.shift();                                                                              // ni uno inicial
  if(!bars.length) return res;
  const slots=[]; let prev=null;   // por compás: lista de {sym,ch|null}
  bars.forEach((b,bi)=>{
    if(b===''||b==='%'){ slots.push(prev?prev.map(x=>Object.assign({},x)):[]); return; }
    const toks=b.split(/\s+/).filter(Boolean), row=[]; let last=null;
    for(const tk of toks){ if(tk==='.'||tk==='_'||tk==='%'){ row.push({hold:true}); continue; }
      const ch=parseChord(tk); if(!ch) res.errors.push({bar:bi+1,tok:tk,msg:'no entiendo «'+tk+'» (compás '+(bi+1)+')'}); row.push({sym:tk,ch:ch}); }
    slots.push(row); prev=row; });
  const n=slots.length; res.cycleBars=n;
  let cur=null;
  for(let bar=0;bar<P.bars;bar++){ const row=slots[bar%n], cyc=Math.floor(bar/n), b0=mm.beatOfBar(bar), len=mm.lenAt(bar), k=row.length; if(!k) continue;
    row.forEach((x,i)=>{ const t0=b0+len*i/k, t1=b0+len*(i+1)/k;
      if(x.hold){ if(cur) cur.b1=t1; return; }
      const e={b0:t0,b1:t1,bar,cyc,sym:x.sym,ok:!!x.ch}; if(x.ch){ e.root=x.ch.root; e.bass=x.ch.bass; e.ivs=x.ch.ivs; e.pcs=x.ch.pcs; }
      res.chords.push(e); cur=e; }); }
  return res;
}
function progAt(P,beat){ let r=null; for(const c of progChords(P).chords){ if(c.b0<=beat+1e-9) r=c; else break; } return r&&r.ok?r:null; }   // acorde que suena en ese pulso (null si no hay o no se entendió)
// Acordes cerrados con la conducción de voces más suave: de cada acorde elige la inversión y octava cuyo centro queda más cerca del acorde anterior (el primero, cerca de do central).
// Con más de 4 notas quita primero la quinta y luego la oncena, para que 9/11/13 no queden empastados. Devuelve {chords:[{b,l,ms:[midi…]}], bass:[{b,l,m}]}.
// un acorde → notas MIDI cerradas cerca de `prev` (centro del acorde anterior): elige la inversión y octava de centro más cercano. Devuelve {ms, mean}.
const VOICINGS=[['suave','Cerrado suave'],['fijo','Cerrado fijo'],['drop2','Abierto (drop 2)'],['drop24','Abierto (drop 2+4)'],['amplio','Amplio (orquestal)'],['alterna','Alternar cerrado/abierto']];
// Un acorde → notas MIDI. `mode` (ver VOICINGS):
//   suave   cerrado, con la inversión y octava más cercanas al acorde anterior (conducción de voces suave)
//   fijo    cerrado, siempre en estado fundamental y cerca de do central: cada acorde y cada vuelta salen idénticos
//   drop2   como «suave», pero la segunda nota desde arriba baja una octava
//   drop24  la segunda y la cuarta desde arriba bajan una octava (con tríadas solo la segunda)
//   amplio  notas del acorde repartidas en dos octavas (alternas suben una octava); con `noRoot` quita la fundamental, que ya toca el bajo
//   alterna cerrado en los compases impares y drop 2 en los pares
// Devuelve {ms, mean}: `mean` es el centro de la versión cerrada, para que la conducción de voces no se desvíe al abrir.
function voiceChord(c,prev,mode,noRoot){
  mode=mode||'suave'; let iv=c.ivs.slice(); if(iv.length>4){ const k=iv.findIndex(x=>x===7||x===6||x===8); if(k>0&&iv.length>4) iv.splice(k,1); } if(iv.length>5){ const k=iv.indexOf(17); if(k>0) iv.splice(k,1); }
  const mean=v=>v.reduce((a,b)=>a+b,0)/v.length, closed=(ivs,r)=>ivs.map((x,i)=>c.root+x+(i<r?12:0)).sort((a,b)=>a-b);
  let cl;
  if(mode==='fijo'){ const v=closed(iv,0), sh=Math.round((prev-mean(v))/12)*12; cl=v.map(m=>m+sh); }
  else { const cands=[]; for(let r=0;r<iv.length;r++){ const v=closed(iv,r), sh=Math.round((prev-mean(v))/12)*12; const ms=v.map(m=>m+sh); cands.push({ms,d:Math.abs(mean(ms)-prev)}); } cands.sort((a,b)=>a.d-b.d); cl=cands[0].ms; }
  while(Math.min(...cl)<48) cl=cl.map(m=>m+12); while(Math.max(...cl)>84) cl=cl.map(m=>m-12);
  const mc=mean(cl); let ms=cl.slice(), open=mode==='drop2'||mode==='drop24'||mode==='amplio'||(mode==='alterna'&&(c.bar||0)%2===1);
  if(open){ const n=ms.length;
    if(mode==='amplio'){ let pool=ms.slice(); if(noRoot){ const rp=((c.root%12)+12)%12, r=pool.filter(m=>((m%12)+12)%12!==rp); if(r.length>=2) pool=r; } ms=pool.map((m,i)=>i%2?m+12:m); }
    else { if(n>=2) ms[n-2]-=12; if(mode==='drop24'&&n>=4) ms[n-4]-=12; }
    ms.sort((a,b)=>a-b); while(Math.min(...ms)<40) ms=ms.map(m=>m+12); while(Math.max(...ms)>96) ms=ms.map(m=>m-12); }
  return {ms,mean:mc};
}
function progToNotes(P,opts){
  const L=progChords(P).chords.filter(c=>c.ok), o=Object.assign({center:62,gap:.02,voicing:'suave',noRoot:false},opts||{}), out={chords:[],bass:[]}; let prev=o.center, lastCyc=null;   // o.cycle: al empezar cada vuelta de la progresión la conducción de voces vuelve a partir de `center` (así todas las vueltas suenan igual)
  for(const c of L){
    if(o.cycle&&c.cyc!==lastCyc){ if(lastCyc!==null) prev=o.center; lastCyc=c.cyc; }
    const v=voiceChord(c,o.voicing==='fijo'?o.center:prev,o.voicing,o.noRoot); prev=v.mean; const len=Math.max(.05,c.b1-c.b0-o.gap);
    out.chords.push({b:r6(c.b0),l:r6(len),ms:v.ms});
    const bp=c.bass!=null?c.bass:c.root; out.bass.push({b:r6(c.b0),l:r6(len),m:36+(((bp-36)%12)+12)%12}); }
  return out;
}
// vista previa de un acorde con el instrumento de la pista: los instrumentos que leen la progresión (usesProg) reciben el acorde tal cual; los demás, sus notas cerradas juntas
function previewChordBuffer(P,tr,c,sec){
  const inst=INSTRUMENTS[tr.inst]; if(!inst) throw new Error('instrumento no disponible');
  const beat=60/P.bpm, lenB=sec/beat, dur=Math.min(6,sec+2.6), K=Kit.make(SR,dur,7); K.sr=SR;
  if(inst.usesProg){ const t2=Object.assign({},tr,{params:Object.assign({},tr.params,(inst.params||[]).some(x=>x.k==='circulo')?{circulo:'proyecto'}:{})});
    const na=noteArgs(K,P,t2,{b:0,l:lenB,m:c.root+48,v:.9},beat,0); na.chords=[{t0:0,t1:sec,sym:c.sym,root:c.root,bass:c.bass,ivs:c.ivs,pcs:c.pcs}]; inst.play(K,na); }
  else for(const m of voiceChord(c,62).ms) inst.play(K,noteArgs(K,P,tr,{b:0,l:lenB,m,v:.8},beat,0));
  return withFx(P,tr,K.mix(()=>1));
}
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
function noteArgs(K,P,tr,nt,beat,t0,nb){
  const p=nt.o?Object.assign({},tr.params,nt.o):tr.params, tm=t0!=null?null:tmap(P), vb=!!tm&&!tm.constant, bpmN=vb?tm.bpmAt(nt.b):P.bpm, bt=vb?60/bpmN:beat;
  return {t:t0!=null?t0:(vb?tm.sec(nt.b):nt.b*beat),len:Math.max(.01,vb?tm.span(nt.b,nt.l||.25):(nt.l||.25)*beat),midi:nt.m,hz:K.hz(nt.m),lane:nt.m,a:(nt.v==null?1:nt.v)*(tr.vol==null?1:tr.vol),
    pan:clamp((tr.pan||0)+(nt.pan||0),-1,1),p,buf:tr.ducked?K.mu:K.dr,sr:K.sr||SR,bpm:bpmN,beat:bt,bar:bt*meter(P).lenAt(nt.b),note:nt,clips:P.clips,link:nb&&!(t0!=null)?linkOf(P,nt,nb):null,chords:chordsFor(P,nt,tm,vb,beat)};
}
// acordes de la progresión del proyecto que caen dentro de la nota, con inicio y fin en segundos RELATIVOS al inicio de la nota (el primero empieza en 0 aunque el acorde venga de antes).
// null si el proyecto no tiene progresión: los instrumentos que no la usan ni lo notan.
function chordsFor(P,nt,tm,vb,beat){
  if(!P.prog||!P.prog.text) return null; const L=progChords(P).chords; if(!L.length) return null;
  const b0=nt.b||0, b1=b0+(nt.l||.25), sec=vb?(b=>tm.sec(b)):(b=>b*beat), s0=sec(b0), len=sec(b1)-s0, out=[];
  for(const c of L){ if(c.b1<=b0+1e-9) continue; if(c.b0>=b1-1e-9) break; if(!c.ok) continue;
    out.push({t0:Math.max(0,sec(c.b0)-s0),t1:Math.min(len,sec(c.b1)-s0),sym:c.sym,root:c.root,bass:c.bass,ivs:c.ivs,pcs:c.pcs}); }
  return out.length?out:null;
}
// vecinas de una nota (para instrumentos que enlazan notas, como la voz): holgura en segundos hasta el final de la anterior / el inicio de la siguiente (≤0 = se tocan o se pisan) y su nota MIDI
function linkOf(P,nt,nb){ const tm=tmap(P), beat=60/P.bpm, sec=b=>tm.constant?b*beat:tm.sec(b), r={prevGap:null,prevMidi:null,nextGap:null,nextMidi:null}, s0=sec(nt.b), e0=sec(nt.b+(nt.l||.25));
  if(nb.prev){ r.prevGap=s0-sec(nb.prev.b+(nb.prev.l||.25)); r.prevMidi=nb.prev.m; } if(nb.next){ r.nextGap=sec(nb.next.b)-e0; r.nextMidi=nb.next.m; } return r; }
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
const FX_DEF={pw:{on:false,sub:0,body:0,drive:0,dark:0,glue:0},eq:{on:false,low:0,mid:0,midF:1000,midQ:1,high:0},comp:{on:false,thr:-18,ratio:3,atk:10,rel:120,knee:6,makeup:0,mix:1},delay:{on:false,time:.75,fb:.4,tone:4500,mix:.3,pp:true},reverb:{on:false,size:.65,damp:.5,mix:.25,pre:12},sp:{on:false,cx:0,cy:0,cz:2,r:0,rot:0,incl:0,paz:0,ph:0,mix:1,vox:1,vmode:0,spread:1}};
const MASTER_DEF={low:0,high:0,gain:1,limit:true,ceil:.97,pwSub:0,pwBody:0,pwDrive:0,pwDark:0,pwGlue:0};
const fxOf=tr=>{ const f=(tr&&tr.fx)||{}; return {pw:Object.assign({},FX_DEF.pw,f.pw),eq:Object.assign({},FX_DEF.eq,f.eq),comp:Object.assign({},FX_DEF.comp,f.comp),delay:Object.assign({},FX_DEF.delay,f.delay),reverb:Object.assign({},FX_DEF.reverb,f.reverb),sp:Object.assign({},FX_DEF.sp,f.sp)}; };
// curvas de los efectos de la pista (tr.auto['fx:<grupo>.<parámetro>'], puntos {b,v} con el valor real del parámetro): continuas, se aplican sobre el audio ya renderizado
const FX_LANES={'fx:eq.low':{g:'eq',k:'low',label:'EQ · graves',min:-12,max:12,unit:'dB'},'fx:eq.mid':{g:'eq',k:'mid',label:'EQ · medios',min:-12,max:12,unit:'dB'},'fx:eq.midF':{g:'eq',k:'midF',label:'EQ · frecuencia de medios',min:200,max:5000,unit:'Hz'},'fx:eq.high':{g:'eq',k:'high',label:'EQ · agudos',min:-12,max:12,unit:'dB'},
  'fx:comp.thr':{g:'comp',k:'thr',label:'Compresor · umbral',min:-48,max:0,unit:'dB'},'fx:comp.makeup':{g:'comp',k:'makeup',label:'Compresor · compensación',min:0,max:24,unit:'dB'},'fx:comp.mix':{g:'comp',k:'mix',label:'Compresor · mezcla',min:0,max:1,unit:''},
  'fx:sp.r':{g:'sp',k:'r',label:'Espacio 3D · radio',min:0,max:6,unit:''},'fx:sp.cx':{g:'sp',k:'cx',label:'Espacio 3D · izquierda–derecha',min:-6,max:6,unit:''},'fx:sp.cy':{g:'sp',k:'cy',label:'Espacio 3D · abajo–arriba',min:-6,max:6,unit:''},'fx:sp.cz':{g:'sp',k:'cz',label:'Espacio 3D · atrás–adelante',min:-6,max:6,unit:''},'fx:sp.rot':{g:'sp',k:'rot',label:'Espacio 3D · vueltas por compás',min:-8,max:8,unit:''},'fx:sp.spread':{g:'sp',k:'spread',label:'Espacio 3D · separación de voces',min:0,max:1,unit:''},'fx:sp.mix':{g:'sp',k:'mix',label:'Espacio 3D · mezcla',min:0,max:1,unit:''},
  'fx:delay.mix':{g:'delay',k:'mix',label:'Delay · mezcla',min:0,max:1,unit:''},'fx:reverb.mix':{g:'reverb',k:'mix',label:'Reverb · mezcla',min:0,max:1,unit:''}};
function fxLanePts(tr){ let o=null; if(tr&&tr.auto) for(const k in FX_LANES){ const p=autoPts(tr,k); if(p){ (o||(o={}))[k]=p; } } return o; }
const eqOn=(e,L)=>!!(e.on&&(e.low||e.mid||e.high||(L&&(L['fx:eq.low']||L['fx:eq.mid']||L['fx:eq.high'])))), compOn=(c,L)=>!!(c.on&&(c.mix>0||(L&&L['fx:comp.mix']))&&c.ratio>1);
const pwOn=p=>!!(p&&p.on&&(p.sub||p.body||p.drive||p.dark||p.glue));
const spOn=(p,L)=>!!(p&&p.on&&(p.mix>0||(L&&L['fx:sp.mix'])));
const fxActive=(fx,L)=>!!(pwOn(fx.pw)||spOn(fx.sp,L)||eqOn(fx.eq,L)||compOn(fx.comp,L)||(fx.delay.on&&(fx.delay.mix>0||(L&&L['fx:delay.mix'])))||(fx.reverb.on&&(fx.reverb.mix>0||(L&&L['fx:reverb.mix']))));
const masterOf=P=>Object.assign({},MASTER_DEF,P.master);
const REV_WET=.74;      // calibración de la reverb (ver pruebas): con mezcla = 1 el nivel del agua ≈ nivel de la entrada
const revFbk=size=>.7+.26*clamp(size,0,1);                                    // máx .96 → cola de unos 5 s
const revComp=size=>{ const f=revFbk(size),r=revFbk(.65); return Math.sqrt((1-f*f)/(1-r*r)); };   // mantiene el volumen parecido al cambiar el tamaño
function delayFx(L,R,m,p,beat,tv,mixF){
  const vd=tv&&!tv.tm.constant, d=Math.max(1,Math.round(p.time*(vd?tv.tm.slowBeat:beat)*SR)), fb=clamp(p.fb,0,.92), a=1-Math.exp(-2*Math.PI*clamp(p.tone,200,16000)/SR), mix=clamp(p.mix,0,1), nL=L.length;
  const oL=new Float32Array(m),oR=new Float32Array(m),wL=new Float32Array(m),wR=new Float32Array(m); oL.set(L.subarray(0,Math.min(nL,m))); oR.set(R.subarray(0,Math.min(nL,m))); let yl=0,yr=0;
  let dd=d; for(let i=d;i<m;i++){ if(vd&&(i&255)===0){ const tn=tv.tm.beat((tv.s0+i)/SR); dd=Math.max(1,Math.min(i,Math.round(p.time*60/tv.tm.bpmAt(tn)*SR))); } const j=i-(vd?dd:d), xl=j<nL?L[j]:0, xr=j<nL?R[j]:0; let vl,vr;
    if(p.pp){ vl=.5*(xl+xr)+fb*wR[j]; vr=fb*wL[j]; } else { vl=xl+fb*wL[j]; vr=xr+fb*wR[j]; }      // ping-pong: el eco rebota entre izquierda y derecha
    yl+=a*(vl-yl); yr+=a*(vr-yr); wL[i]=yl; wR[i]=yr; const mx=mixF?clamp(mixF(i),0,1):mix; oL[i]+=yl*mx; oR[i]+=yr*mx; }
  return [oL,oR];
}
function reverbFx(L,R,m,p,mixF){          // Freeverb: 8 peines + 4 pasatodo por canal, con un poco de separación estéreo
  const sc=SR/44100, cd=[1116,1188,1277,1356,1422,1491,1557,1617], ad=[556,441,341,225], sp=23;
  const fbk=revFbk(p.size), dmp=clamp(p.damp,0,1)*.6, pre=Math.round(clamp(p.pre,0,200)*SR/1000), wet0=REV_WET*revComp(p.size)*3, wet1=clamp(p.mix,0,1)*wet0, nL=L.length;
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
    const wet=mixF?clamp(mixF(i),0,1)*wet0:wet1; oL[i]=(i<nL?L[i]:0)+sl*wet; oR[i]=(i<nL?R[i]:0)+sr*wet;
  }
  return [oL,oR];
}
function applyFx(L,R,fx,beat,maxLen,tv,lanes){      // → {L,R}; la salida puede ser más larga que la entrada (cola del eco y de la reverb)
  const n=L.length; let tail=0; const dly=fx.delay.on&&(fx.delay.mix>0||(lanes&&lanes['fx:delay.mix'])), rev=fx.reverb.on&&(fx.reverb.mix>0||(lanes&&lanes['fx:reverb.mix']));
  if(dly){ const d=Math.max(1,Math.round(fx.delay.time*(tv&&!tv.tm.constant?tv.tm.slowBeat:beat)*SR)), fb=clamp(fx.delay.fb,0,.92); tail+=Math.min(8*SR,d*((fb>0?Math.ceil(Math.log(.001)/Math.log(fb)):0)+1)); }
  if(rev){ const fbk=revFbk(fx.reverb.size); tail+=Math.min(6*SR,Math.ceil((1400/44100)*SR*Math.log(.001)/Math.log(fbk)))+Math.round(clamp(fx.reverb.pre,0,200)*SR/1000); }
  const m=Math.min(maxLen==null?n+tail:maxLen,n+tail); let a=L,b=R;
  const eqA=eqOn(fx.eq,lanes), cpA=compOn(fx.comp,lanes), LN=lanes||{};
  const pwA=pwOn(fx.pw); if(pwA||eqA||cpA){ a=Float32Array.from(a); b=Float32Array.from(b);                  // potencia → EQ → compresor → espacio 3D → eco → reverb
    if(pwA) powerFx(a,b,fx.pw);
    if(eqA){ if(LN['fx:eq.low']||LN['fx:eq.mid']||LN['fx:eq.midF']||LN['fx:eq.high']) eqAuto(a,b,fx.eq,{low:LN['fx:eq.low'],mid:LN['fx:eq.mid'],midF:LN['fx:eq.midF'],high:LN['fx:eq.high']}); else { shelf(a,b,120,fx.eq.low,false); peakEq(a,b,fx.eq.midF,fx.eq.mid,fx.eq.midQ); shelf(a,b,7000,fx.eq.high,true); } }
    if(cpA) compFx(a,b,fx.comp,(LN['fx:comp.thr']||LN['fx:comp.makeup']||LN['fx:comp.mix'])?{thr:LN['fx:comp.thr'],makeup:LN['fx:comp.makeup'],mix:LN['fx:comp.mix']}:null); }
  if(spOn(fx.sp,LN)) [a,b]=spatialFx(a,b,fx.sp,beat,tv,LN);                                                  // espacio 3D (binaural) antes del eco y la reverb
  if(dly) [a,b]=delayFx(a,b,m,fx.delay,beat,tv,LN['fx:delay.mix']);
  if(rev) [a,b]=reverbFx(a,b,m,fx.reverb,LN['fx:reverb.mix']);
  return {L:a,R:b};
}

// ── «Espacio 3D»: una fuente mono que se mueve alrededor de la cabeza (binaural, para audífonos). Coordenadas en radios de cabeza: x derecha, y arriba, z adelante.
//   Modelo: cabeza esférica. ITD de Woodworth (retraso entre oídos) + sombra de cabeza de Brown–Duda (filtro de 1.er orden por oído) + distancia (atenuación y pérdida de agudos)
//   + «detrás» (agudos recortados) + «altura» (agudos realzados o recortados). Dentro de la cabeza (distancia < 1) las diferencias entre oídos se desvanecen.
//   La fuente sigue una órbita circular de radio r alrededor del centro (cx,cy,cz); el plano se inclina con incl (0 = horizontal, 90 = vertical) y paz (hacia dónde se inclina).
//   Los giros van al tempo (rot = vueltas por compás de 4 pulsos) y pueden llevar curvas de automatización.
function spatialFx(L,R,p,beat,tv,LN){
  const n=L.length, sr=SR, B=32, nb=Math.ceil(n/B), A_HEAD=.0875, C_SND=343, K=sr/(C_SND/A_HEAD), TP=Math.PI*2;
  const inc=p.incl*Math.PI/180, paz=p.paz*Math.PI/180, nx=Math.sin(inc)*Math.sin(paz), ny=Math.cos(inc), nz=Math.sin(inc)*Math.cos(paz);
  let ux=-nz*nx, uy=-nz*ny, uz=1-nz*nz, ul=Math.hypot(ux,uy,uz); if(ul<1e-3){ ux=1-nx*nx; uy=-nx*ny; uz=-nx*nz; ul=Math.hypot(ux,uy,uz); } ux/=ul; uy/=ul; uz/=ul;
  const vx=ny*uz-nz*uy, vy=nz*ux-nx*uz, vz=nx*uy-ny*ux, s0=(tv&&tv.s0)||0, vt=!!(tv&&tv.tm&&!tv.tm.constant), ln=(k,i,d)=>(LN&&LN[k])?LN[k](i):d;
  const dLb=new Float32Array(nb+1), dRb=new Float32Array(nb+1), aLb=new Float32Array(nb+1), aRb=new Float32Array(nb+1), fcb=new Float32Array(nb+1), gb=new Float32Array(nb+1), keb=new Float32Array(nb+1);
  let ph=p.ph*Math.PI/180, bPrev=0;
  for(let b=0;b<=nb;b++){ const i=Math.min(n,b*B), bt=vt?tv.tm.beat((s0+i)/sr):(s0+i)/sr/beat; if(b>0) ph+=TP*ln('fx:sp.rot',i,p.rot)*(bt-bPrev)/4; bPrev=bt;
    const r=Math.max(0,ln('fx:sp.r',i,p.r)), po=(p.vox>1&&p.vo>0)?p.vo/p.vox*TP*ln('fx:sp.spread',i,p.spread==null?1:p.spread):0, c=Math.cos(ph+po), sn=Math.sin(ph+po), x=ln('fx:sp.cx',i,p.cx)+r*(c*ux+sn*vx), y=ln('fx:sp.cy',i,p.cy)+r*(c*uy+sn*vy), z=ln('fx:sp.cz',i,p.cz)+r*(c*uz+sn*vz);
    const dist=Math.max(1e-3,Math.hypot(x,y,z)), inside=clamp((1.15-dist)/.85,0,1), lat=Math.asin(clamp(x/dist,-1,1)), itd=(A_HEAD/C_SND)*(lat+Math.sin(lat))*sr*(1-inside), D0=.00045*sr+2;
    dLb[b]=D0+itd/2; dRb[b]=D0-itd/2;
    const al=th=>1+(1.05+.95*Math.cos(th*1.2)-1)*(1-inside); aLb[b]=al(Math.acos(clamp(-x/dist,-1,1))); aRb[b]=al(Math.acos(clamp(x/dist,-1,1)));
    gb[b]=1/Math.max(1,dist/1.5); const back=Math.max(0,-z/dist)*(1-inside); fcb[b]=Math.min(.45*sr,20000/(1+.18*Math.max(0,dist-1.5)),20000-back*.8*16500); keb[b]=.5*(y/dist)*(1-inside); }
  const m=new Float32Array(n), lnz=new Int32Array(nb+1); let last=-1e9; for(let i=0;i<n;i++){ const v=.5*(L[i]+R[i]); m[i]=v; if(v>1e-8||v<-1e-8) last=i; if((i&(B-1))===B-1||i===n-1) lnz[(i/B)|0]=last; }
  const mf=new Float32Array(n), a6=1-Math.exp(-TP*6000/sr); let y1=0,y6=0;
  for(let b=0;b<nb;b++){ const i0=b*B, i1=Math.min(n,i0+B); if(lnz[b]<i0-4000) { y1=0; y6=0; continue; } const a=1-Math.exp(-TP*fcb[b]/sr), g=gb[b], ke=keb[b];
    for(let i=i0;i<i1;i++){ y1+=a*(m[i]-y1); y6+=a6*(y1-y6); mf[i]=g*(y1+ke*(y1-y6)); } }
  const rd=(pos)=>{ const k=Math.floor(pos), f=pos-k; if(k<-1||k>=n) return 0; const s0_=k-1>=0&&k-1<n?mf[k-1]:0, s1=k>=0&&k<n?mf[k]:0, s2=k+1<n&&k+1>=0?mf[k+1]:0, s3=k+2<n&&k+2>=0?mf[k+2]:0;
    return ((((.5*(s3-s0_)+1.5*(s1-s2))*f)+(s0_-2.5*s1+2*s2-.5*s3))*f+.5*(s2-s0_))*f+s1; };
  const oL=new Float32Array(n), oR=new Float32Array(n); let lx=0,ly=0,rx=0,ry=0;
  for(let b=0;b<nb;b++){ const i0=b*B, i1=Math.min(n,i0+B); if(lnz[b]<i0-4000){ lx=ly=rx=ry=0; for(let i=i0;i<i1;i++){ const mx=ln('fx:sp.mix',i,p.mix); oL[i]=(1-mx)*L[i]; oR[i]=(1-mx)*R[i]; } continue; }
    const kl=K*aLb[b], kr=K*aRb[b], B0l=(1+kl)/(1+K), B1l=(1-kl)/(1+K), B0r=(1+kr)/(1+K), B1r=(1-kr)/(1+K), A1=(1-K)/(1+K), dl0=dLb[b], dl1=dLb[b+1], dr0=dRb[b], dr1=dRb[b+1];
    for(let i=i0;i<i1;i++){ const t=(i-i0)/B, xl=rd(i-(dl0+(dl1-dl0)*t)), xr=rd(i-(dr0+(dr1-dr0)*t)), yl=B0l*xl+B1l*lx-A1*ly, yr=B0r*xr+B1r*rx-A1*ry; lx=xl; ly=yl; rx=xr; ry=yr;
      const mx=ln('fx:sp.mix',i,p.mix); oL[i]=(1-mx)*L[i]+mx*yl; oR[i]=(1-mx)*R[i]+mx*yr; } }
  return [oL,oR];
}
function fxStems(stems,fx,beat,N,tm,LP){
  return stems.map(st=>{
    const len=st.q[0].length, g=st.pk/32767, L=new Float32Array(len), R=new Float32Array(len); for(let i=0;i<len;i++){ L[i]=st.q[0][i]*g; R[i]=st.q[1][i]*g; }
    let lanes=null; if(LP){ lanes={}; for(const k in LP){ const S=autoSampler(LP[k],beat,tm), o=st.s0; lanes[k]=i=>S(o+i); } }     // una curva por pista y por tramo, en tiempo absoluto
    const fx2=(st.vo!=null&&fx.sp&&fx.sp.vox>1)?Object.assign({},fx,{sp:Object.assign({},fx.sp,{vo:st.vo})}):fx, r=applyFx(L,R,fx2,beat,N-st.s0,tm?{tm,s0:st.s0}:null,lanes), n=r.L.length; let pk=0; for(let i=0;i<n;i++){ const a=Math.abs(r.L[i]),b=Math.abs(r.R[i]); if(a>pk) pk=a; if(b>pk) pk=b; }
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
function peakEq(L,R,f,dB,Q){                // campana (biquad RBJ), en el sitio
  if(!dB) return; const A=Math.pow(10,dB/40), w=2*Math.PI*clamp(f,40,SR*.45)/SR, cs=Math.cos(w), al=Math.sin(w)/(2*clamp(Q,.2,12));
  let b0=1+al*A, b1=-2*cs, b2=1-al*A, a0=1+al/A, a1=-2*cs, a2=1-al/A; b0/=a0; b1/=a0; b2/=a0; a1/=a0; a2/=a0;
  for(const X of [L,R]){ let x1=0,x2=0,y1=0,y2=0; for(let i=0;i<X.length;i++){ const x=X[i], y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2; x2=x1; x1=x; y2=y1; y1=y; X[i]=y; } }
}
function shelfCo(f,dB,high){ const A=Math.pow(10,dB/40), w=2*Math.PI*f/SR, cs=Math.cos(w), al=Math.sin(w)/2*Math.SQRT2, t=2*Math.sqrt(A)*al; let b0,b1,b2,a0,a1,a2;
  if(!high){ b0=A*((A+1)-(A-1)*cs+t); b1=2*A*((A-1)-(A+1)*cs); b2=A*((A+1)-(A-1)*cs-t); a0=(A+1)+(A-1)*cs+t; a1=-2*((A-1)+(A+1)*cs); a2=(A+1)+(A-1)*cs-t; }
  else { b0=A*((A+1)+(A-1)*cs+t); b1=-2*A*((A-1)+(A+1)*cs); b2=A*((A+1)+(A-1)*cs-t); a0=(A+1)-(A-1)*cs+t; a1=2*((A-1)-(A+1)*cs); a2=(A+1)-(A-1)*cs-t; }
  return [b0/a0,b1/a0,b2/a0,a1/a0,a2/a0]; }
function peakCo(f,dB,Q){ const A=Math.pow(10,dB/40), w=2*Math.PI*clamp(f,40,SR*.45)/SR, cs=Math.cos(w), al=Math.sin(w)/(2*clamp(Q,.2,12)), a0=1+al/A; return [(1+al*A)/a0,-2*cs/a0,(1-al*A)/a0,-2*cs/a0,(1-al/A)/a0]; }
function eqAuto(L,R,eq,g){                  // EQ con curvas: se recalculan los filtros cada 32 muestras y el estado se conserva, así los barridos no hacen clic
  const n=L.length, st=[0,1,2].map(()=>[new Float64Array(4),new Float64Array(4)]); let co=[null,null,null];
  for(let i0=0;i0<n;i0+=32){
    const lo=g.low?g.low(i0):eq.low, mi=g.mid?g.mid(i0):eq.mid, mf=g.midF?g.midF(i0):eq.midF, hi=g.high?g.high(i0):eq.high;
    co=[shelfCo(120,clamp(lo,-12,12),false),peakCo(mf,clamp(mi,-12,12),eq.midQ),shelfCo(7000,clamp(hi,-12,12),true)];
    const i1=Math.min(n,i0+32);
    for(let f=0;f<3;f++){ const [b0,b1,b2,a1,a2]=co[f];
      for(let ch=0;ch<2;ch++){ const X=ch?R:L, s=st[f][ch]; let x1=s[0],x2=s[1],y1=s[2],y2=s[3];
        for(let i=i0;i<i1;i++){ const x=X[i], y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2; x2=x1; x1=x; y2=y1; y1=y; X[i]=y; }
        s[0]=x1; s[1]=x2; s[2]=y1; s[3]=y2; } } }
}
let lastGR=0;                                // reducción máxima (dB) del último compresor aplicado; la interfaz la muestra
// «Potencia»: graves y cuerpo → saturación (con el mismo nivel RMS, así solo se vuelve más densa, no más fuerte) → recorte de agudos → compresión de pegamento. En el sitio.
//   sub  0–9 dB de graves (shelf a 80 Hz) · body 0–12 dB de cuerpo (campana a 300 Hz) · drive 0–1 saturación · dark 0–1 recorte de agudos (de 20 kHz a ~3.5 kHz) · glue 0–1 compresión
function powerFx(L,R,p){
  const n=L.length; if(p.sub) shelf(L,R,80,clamp(p.sub,0,12),false); if(p.body) peakEq(L,R,300,clamp(p.body,0,12),.6);
  if(p.drive>0){ const g=1+clamp(p.drive,0,1)*9, ig=1/Math.tanh(g); let s0=0,s1=0;
    for(let i=0;i<n;i++){ s0+=L[i]*L[i]+R[i]*R[i]; L[i]=Math.tanh(L[i]*g)*ig*.5; R[i]=Math.tanh(R[i]*g)*ig*.5; s1+=L[i]*L[i]+R[i]*R[i]; }
    // nivelación: la saturación se normaliza para que el RMS quede como el original, pero sin pasar de un recorte razonable
    const k=s1>1e-12?Math.sqrt(s0/s1):1; for(let i=0;i<n;i++){ L[i]*=k; R[i]*=k; } }
  if(p.dark>0){ const a=1-Math.exp(-2*Math.PI*20000*Math.pow(.175,clamp(p.dark,0,1))/SR); for(const X of [L,R]){ let y1=0,y2=0; for(let i=0;i<n;i++){ y1+=a*(X[i]-y1); y2+=a*(y1-y2); X[i]=y2; } } }
  if(p.glue>0){ const q=clamp(p.glue,0,1); compFx(L,R,{thr:-10-10*q,ratio:1.5+3*q,atk:20,rel:150,knee:6,makeup:3*q,mix:1}); }
}
function compFx(L,R,p,ga){                      // compresor con codo suave, detector de pico enlazado (no mueve el paneo), en el sitio
  const thr=p.thr, ratio=Math.max(1,p.ratio), kn=Math.max(0,p.knee), mix=clamp(p.mix,0,1), mk=Math.pow(10,(p.makeup||0)/20);
  const aC=Math.exp(-1/(Math.max(.1,p.atk)*1e-3*SR)), rC=Math.exp(-1/(Math.max(1,p.rel)*1e-3*SR)), inv=1/ratio-1; let gs=0, mx=0; const n=L.length;
  for(let i=0;i<n;i++){
    const x=Math.max(Math.abs(L[i]),Math.abs(R[i])), lv=x>1e-6?20*Math.log10(x):-120, ov=lv-(ga&&ga.thr?ga.thr(i):thr); let gr;
    if(2*ov<-kn) gr=0; else if(kn>0&&2*Math.abs(ov)<=kn){ const t=ov+kn/2; gr=-inv*t*t/(2*kn); } else gr=-inv*ov;
    gs=gr>gs?aC*gs+(1-aC)*gr:rC*gs+(1-rC)*gr; if(gs>mx) mx=gs;
    const g=(ga&&ga.makeup?Math.pow(10,ga.makeup(i)/20):mk)*Math.pow(10,-gs/20), mi=ga&&ga.mix?clamp(ga.mix(i),0,1):mix, w=mi>=1?g:(1-mi)+mi*g; L[i]*=w; R[i]*=w;
  }
  if(mx>lastGR) lastGR=mx;
}
function masterFx(P,out){
  const m=masterOf(P), pw=m.pwSub||m.pwBody||m.pwDrive||m.pwDark||m.pwGlue; if(!m.low&&!m.high&&m.gain===1&&!pw) return out;          // todo neutro: no se toca el sonido original
  const L=Float32Array.from(out.L), R=Float32Array.from(out.R), n=L.length; if(pw) powerFx(L,R,{sub:m.pwSub,body:m.pwBody,drive:m.pwDrive,dark:m.pwDark,glue:m.pwGlue}); shelf(L,R,120,m.low,false); shelf(L,R,7000,m.high,true);
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
function trackKey(P,tr,total){ const inst=INSTRUMENTS[tr.inst], k=[SR,OSF,HQ,tr.inst,inst?inst.rev:0,KIT_REV,tr.params,tr.pan,tr.ducked?1:0,P.bpm,tempoPts(P),P.seed,total,tr.notes,(l=>l.length?[tr.alv===16?16:8,l.map(x=>[x.k,x.pts])]:0)(paramLanes(tr,inst))];
  { const sp=fxOf(tr).sp; if(sp.on&&sp.vox>1) k.push(['vox',sp.vox|0,sp.vmode|0]); }
  if(inst&&inst.usesProg) k.push([(P.prog&&P.prog.text)||'',P.sig||0,sigPts(P),P.bars]);   // solo los instrumentos que leen la progresión se re-renderizan al editarla
  return hash2(JSON.stringify(k)); }
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
// ── sobremuestreo: la síntesis se calcula a SR×OSF y se baja a SR con un FIR pasabajas de ventana Kaiser (≈100 dB de rechazo) en etapas de ÷2.
//    Banda de paso hasta 0.45·SR; lo que cae por encima de la mitad de SR (armónicos de ondas cuadradas, sierras, metales…) se elimina en vez de «rebotar» como ruido.
const _firCache=new Map();
function firHalf(Rin,pe){ const key=Rin+'|'+pe, c=_firCache.get(key); if(c) return c;
  const stop=Rin/2-pe, fc=(pe+stop)/2/Rin, dw=2*Math.PI*(stop-pe)/Rin, A=100, beta=.1102*(A-8.7);
  let N=Math.ceil((A-8)/(2.285*dw)); if(N%2===0) N++; N=Math.min(Math.max(N,7),1201); const M=(N-1)/2, h=new Float64Array(N);
  const i0=x=>{ let s=1,t=1; for(let k=1;k<60;k++){ t*=(x/2/k); s+=t*t; } return s; }, b0=i0(beta); let sum=0;
  for(let k=0;k<N;k++){ const m=k-M, w=i0(beta*Math.sqrt(Math.max(0,1-(m/M)*(m/M))))/b0, s=m===0?2*fc:Math.sin(2*Math.PI*fc*m)/(Math.PI*m); h[k]=s*w; sum+=h[k]; }
  for(let k=0;k<N;k++) h[k]/=sum; const o={h:Float32Array.from(h),M}; _firCache.set(key,o); return o; }
function decim2(x,Rin,pe){ const {h,M}=firHalf(Rin,pe), n=x.length, no=Math.ceil(n/2), y=new Float32Array(no), h0=h[M];
  for(let o=0;o<no;o++){ const c=2*o; let s=h0*x[c];
    if(c-M>=0&&c+M<n){ for(let k=1;k<=M;k++) s+=h[M+k]*(x[c+k]+x[c-k]); }
    else { for(let k=1;k<=M;k++){ const a=c+k,b=c-k; s+=h[M+k]*((a<n?x[a]:0)+(b>=0?x[b]:0)); } }
    y[o]=s; }
  return y; }
async function decimatePow2(x,Rout,factor){ let Rin=Rout*factor, y=x; const pe=.45*Rout; while(Rin>Rout){ y=decim2(y,Rin,pe); Rin/=2; await tick(); } return y; }
// stems en coma flotante (q = Float32, pk = 32767 para que el mezclador no cambie); si OSF>1 baja cada bus a SR solo en el tramo con sonido
async function extractStemsHQ(K,osf){
  const out=[], TAPS=1300;
  for(const bus of ['mu','dr']){
    const A=K[bus][0],B=K[bus][1],n=A.length; let s0=-1,s1=0;
    for(let i=0;i<n;i++){ if(A[i]!==0||B[i]!==0){ s0=i; break; } } if(s0<0) continue;
    for(let i=n-1;i>=s0;i--){ if(A[i]!==0||B[i]!==0){ s1=i+1; break; } }
    let a=Math.max(0,s0-TAPS*osf), b=Math.min(n,s1+TAPS*osf); a-=a%osf;
    let qa=A.subarray(a,b), qb=B.subarray(a,b), off=a;
    if(osf>1){ qa=await decimatePow2(qa,SR,osf); qb=await decimatePow2(qb,SR,osf); off=a/osf; }
    const m=qa.length; let i0=0; while(i0<m&&qa[i0]===0&&qb[i0]===0) i0++; let i1=m; while(i1>i0&&qa[i1-1]===0&&qb[i1-1]===0) i1--;
    if(i1<=i0) continue; out.push({bus,s0:off+i0,pk:32767,q:[Float32Array.from(qa.subarray(i0,i1)),Float32Array.from(qb.subarray(i0,i1))]});
  }
  return out;
}
// reparto de las notas de una pista entre voces del Espacio 3D: modo 0 = por altura dentro de cada acorde (grave→voz 0), modo 1 = alternando nota a nota
function voiceOf(SN,NV,mode){ const o=new Array(SN.length).fill(0); if(NV<2) return o;
  if(mode===1){ for(let j=0;j<SN.length;j++) o[j]=j%NV; return o; }
  for(let j=0;j<SN.length;){ let e=j+1; while(e<SN.length&&SN[e].b-SN[j].b<.03) e++; const g=[]; for(let q=j;q<e;q++) g.push(q); g.sort((a,b)=>SN[a].m-SN[b].m||a-b); g.forEach((q,r)=>{ o[q]=r%NV; }); j=e; }
  return o; }
async function renderTrackStem(P,tr,beat,total){
  const inst=INSTRUMENTS[tr.inst]; if(!inst) throw new Error('instrumento no disponible ('+tr.inst+')');
  const KSR=SR*OSF, K=Kit.make(KSR,total,trackSeed(P,tr)); K.sr=KSR; const t=Object.assign({},tr,{vol:1}), lanes=paramLanes(tr,inst), LV=tr.alv===16?16:8; let last=performance.now(),i=0;
  const SN=tr.notes.slice().sort((a,b)=>a.b-b.b), vsp=fxOf(tr).sp, NV=(vsp.on&&vsp.vox>1)?Math.min(8,vsp.vox|0):1, vo=voiceOf(SN,NV,vsp.vmode), out=[];
  for(let v=0;v<NV;v++){ const Kv=v?Kit.make(KSR,total,trackSeed(P,tr)):K; if(v) Kv.sr=KSR;
    for(let j=0;j<SN.length;j++){ if(vo[j]!==v) continue; const nt=SN[j]; let pv=null,nx=null; for(let q=j-1;q>=0;q--) if(SN[q].b<nt.b-1e-6){ pv=SN[q]; break; } for(let q=j+1;q<SN.length;q++) if(SN[q].b>nt.b+1e-6){ nx=SN[q]; break; }
      inst.play(Kv,noteArgs(Kv,P,t,laneNote(lanes,LV,nt),beat,null,{prev:pv,next:nx})); if(++i%25===0&&performance.now()-last>14){ await tick(); last=performance.now(); } }
    const ss=HQ?await extractStemsHQ(Kv,OSF):extractStems(Kv); if(NV>1) for(const st of ss) st.vo=v; out.push(...ss); }
  return out;
}
async function ensureStems(P,trs,onProg,from,to){
  const beat=60/P.bpm, tmx=tmap(P), total=(tmx.constant?meter(P).total(P.bars)*beat:tmx.sec(meter(P).total(P.bars)))+TAIL, live=new Set(P.tracks.map(t=>t.id)), errors=[], todo=[]; let tot=0;
  for(const id of [...stemCache.keys()]) if(!live.has(id)) stemCache.delete(id);
  for(const tr of trs){ const key=trackKey(P,tr,total),c=stemCache.get(tr.id); if(c&&c.key===key){ if(c.err) errors.push({track:tr.name,msg:c.err}); continue; } todo.push({tr,key}); tot+=tr.notes.length+1; }
  let done=0; for(const {tr,key} of todo){
    const e={key,stems:[]}; try{ e.stems=await renderTrackStem(P,tr,beat,total); }catch(err){ e.err=err.message; errors.push({track:tr.name,msg:err.message}); }
    stemCache.set(tr.id,e); done+=tr.notes.length+1; if(onProg) onProg(from+(to-from)*done/tot); await tick();
  }
  let fxN=0, N=Math.ceil(total*SR);
  for(const tr of trs){ const c=stemCache.get(tr.id); if(!c||c.err) continue; const fx=fxOf(tr), LP=fxLanePts(tr), want=fxActive(fx,LP)?hash2(JSON.stringify([fx,beat,tmx.key,c.key,LP])):'';
    if(c.fxKey!==want){ lastGR=0; c.fxStems=want?fxStems(c.stems,fx,beat,N,tmx,LP):null; c.fxKey=want; c.gr=lastGR; if(want){ fxN++; await tick(); } } }
  return {errors,rendered:todo.length,fx:fxN,beat,total};
}
// ── automatización por pista (volumen, paneo, filtro): puntos {b,v} en pulsos, interpolación lineal; se aplica al mezclar,
// así que editarla no vuelve a renderizar ningún instrumento
const AUTO_DEF={vol:{label:'Volumen',min:0,max:1.5,def:1},pan:{label:'Paneo',min:-1,max:1,def:0},cut:{label:'Filtro',min:0,max:1,def:1}};
const cutHz=c=>80*Math.pow(18000/80,clamp(c,0,1));
function autoPts(tr,k){ const a=tr.auto&&tr.auto[k]; return a&&a.length?a.slice().sort((x,y)=>x.b-y.b):null; }
function autoValue(pts,b){ if(b<=pts[0].b) return pts[0].v; for(let j=0;j<pts.length-1;j++){ if(b<pts[j+1].b){ const d=pts[j+1].b-pts[j].b; return d>0?pts[j].v+(pts[j+1].v-pts[j].v)*(b-pts[j].b)/d:pts[j+1].v; } } return pts[pts.length-1].v; }
// ── automatización de parámetros del instrumento (carril 'p:<param>'): el valor se toma al inicio de cada nota y se cuantiza
// a 8 (por defecto) o 16 niveles (tr.alv); una nota con ese parámetro fijado a mano (nt.o) manda sobre la curva.
function paramDef(inst,k){ return inst&&inst.params.find(d=>d.k===k&&(d.type||'num')==='num'&&d.max>d.min); }
function stepVal(d,v,L){ const q=Math.round(clamp((v-d.min)/(d.max-d.min),0,1)*(L-1))/(L-1); return +(d.min+q*(d.max-d.min)).toFixed(5); }
function paramLanes(tr,inst){ const out=[]; if(!tr.auto||!inst) return out; for(const k in tr.auto){ if(k.slice(0,2)!=='p:') continue; const d=paramDef(inst,k.slice(2)), pts=autoPts(tr,k); if(d&&pts) out.push({k:d.k,d,pts}); } return out; }
function laneNote(lanes,L,nt){ if(!lanes.length) return nt; let o=null; for(const ln of lanes){ if(nt.o&&nt.o[ln.k]!=null) continue; if(!o) o=Object.assign({},nt.o); o[ln.k]=stepVal(ln.d,autoValue(ln.pts,nt.b),L); } return o?Object.assign({},nt,{o}):nt; }
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
  const K0=Kit.make(SR,total,P.seed||KIT_SEED); K0.sr=SR; K0.BPM=P.bpm;      // los kits con efectos en el master (delay) pueden sincronizarse con K.BPM
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
// opts: {loop:{start,end} escribe un bloque «smpl» con un loop (muestras; end incluido), bits:16|24, float:true para 32 bits en coma flotante, dither (solo 16 bits; ruido TPDF de ±1 LSB con semilla fija, así es reproducible; activo por omisión)}
function encodeWav(L,R,sr,opts){
  opts=opts||{}; const fl=!!opts.float, bits=fl?32:(opts.bits===24?24:16), bps=bits/8, n=L.length, data=n*2*bps, lp=opts.loop&&opts.loop.end>opts.loop.start?opts.loop:null, buf=new ArrayBuffer(44+data+(fl?12:0)+(lp?68:0)), v=new DataView(buf);
  const ws=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  ws(0,'RIFF'); v.setUint32(4,buf.byteLength-8,true); ws(8,'WAVE'); ws(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,fl?3:1,true); v.setUint16(22,2,true);
  v.setUint32(24,sr,true); v.setUint32(28,sr*2*bps,true); v.setUint16(32,2*bps,true); v.setUint16(34,bits,true);
  let o=36; if(fl){ ws(36,'fact'); v.setUint32(40,4,true); v.setUint32(44,n,true); o=48; }
  ws(o,'data'); v.setUint32(o+4,data,true); o+=8;
  let seed=0x9E3779B9; const rnd=()=>{ seed^=seed<<13; seed>>>=0; seed^=seed>>>17; seed^=seed<<5; seed>>>=0; return seed/4294967296; };
  const dith=bits===16&&opts.dither!==false;
  for(let i=0;i<n;i++) for(let c=0;c<2;c++){ const x=c?R[i]:L[i];
    if(fl){ v.setFloat32(o,x,true); o+=4; }
    else if(bits===24){ const s=x>1?1:x<-1?-1:x, q=Math.round(s*8388607); v.setUint8(o,q&255); v.setUint8(o+1,(q>>8)&255); v.setUint8(o+2,(q>>16)&255); o+=3; }
    else { let s=x>1?1:x<-1?-1:x; s=s*32767+(dith?(rnd()-rnd()):0); s=s>32767?32767:s<-32768?-32768:Math.round(s); v.setInt16(o,s,true); o+=2; } }
  if(lp){ ws(o,'smpl'); v.setUint32(o+4,60,true); const q=o+8; v.setUint32(q+8,Math.round(1e9/sr),true); v.setUint32(q+12,60,true); v.setUint32(q+28,1,true);      // 1 loop, hacia delante, sin repeticiones fijas
    v.setUint32(q+44,lp.start,true); v.setUint32(q+48,lp.end,true); }
  return new Blob([buf],{type:'audio/wav'});
}

// ───────────────────────── (de)serialización ─────────────────────────
function u8ToB64(u8){let s='';const C=0x8000;for(let i=0;i<u8.length;i+=C)s+=String.fromCharCode.apply(null,u8.subarray(i,i+C));return btoa(s);}
function b64ToU8(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}
// Un kit alterno puede declararse con demoKit.info={id,name,version}; el proyecto lo anota (P.engine) para avisar si se abre con otro kit.
// Si el kit trae varios caracteres (info.characters, p. ej. Evol: orgánico / digital), el activo viaja en el proyecto como engine.c.
function kitChars(){ const i=Kit.make&&Kit.make.info; return i&&Array.isArray(i.characters)?i.characters:[]; }
function kitInfo(){ const i=Kit.make&&Kit.make.info; if(!(i&&typeof i.id==='string')) return null; const o={id:i.id.slice(0,40),v:String(i.version||'').slice(0,20)}, c=Kit.make.character; if(c&&kitChars().includes(c)) o.c=c; return o; }
function setKitChar(c){ if(!Kit.make) return; Kit.make.character=(c&&kitChars().includes(c))?c:undefined; bumpKit(); }
const KIT_FORMAT=1;      // sube cuando un cambio del kit/motor haga sonar distinto un proyecto ya guardado
const NOTE_KEYS=new Set(['b','l','m','v','pan','o','w']);
function compactNote(n){
  for(const k in n) if(!NOTE_KEYS.has(k)) return n;                        // con campos desconocidos se guarda tal cual
  const q=x=>Math.round(x*1e5)/1e5, v=n.v==null?1:n.v, pan=n.pan||0, hasO=n.o&&Object.keys(n.o).length, w=n.w||'';
  const a=[q(n.b),q(n.l==null?.25:n.l),n.m]; if(v!==1||pan||hasO||w) a.push(v); if(pan||hasO||w) a.push(pan); if(hasO||w) a.push(hasO?n.o:0); if(w) a.push(w); return a;   // [b,l,m,v,pan,o,w]
}
function compactTrack(t){
  const inst=INSTRUMENTS[t.inst], def=inst?defaultParams(inst):null, o={id:t.id,name:t.name,inst:t.inst};
  const prm={}; for(const k in (t.params||{})) if(!def||t.params[k]!==def[k]) prm[k]=t.params[k]; if(Object.keys(prm).length) o.params=prm;
  if(t.vol!=null&&t.vol!==1) o.vol=t.vol; if(t.pan) o.pan=t.pan; if(t.mute) o.mute=true; if(t.solo) o.solo=true; o.ducked=!!t.ducked; if(t.sc) o.sc=true;
  if(t.fx) o.fx=t.fx; if(t.auto) o.auto=t.auto; if(t.alv) o.alv=t.alv; if(t.bakeOf) o.bakeOf=t.bakeOf; o.n=t.notes.map(compactNote); return o;
}
function expandTrack(t){ if(!Array.isArray(t.n)) return t; t.notes=t.n.map(a=>{ if(!Array.isArray(a)) return a; const n={b:a[0],l:a[1],m:a[2],v:a[3]==null?1:a[3]}; if(a[4]) n.pan=a[4]; if(a[5]) n.o=a[5]; if(a[6]) n.w=a[6]; return n; }); delete t.n; return t; }
function projectToJSON(P,opts){
  const compact=!!(opts&&opts.compact);
  const o={format:'demokit-studio',v:compact?2:1,kit:KIT_FORMAT,name:P.name,bpm:P.bpm,bars:P.bars,tempo:(P.tempo&&P.tempo.length)?P.tempo:undefined,sig:barBeats(P)===4&&(!P.sig||P.sig[1]===4)?undefined:P.sig,sigs:sigPts(P).length?sigPts(P):undefined,marks:markPts(P).length?markPts(P):undefined,bank:(P.bank&&typeof P.bank==='object')?P.bank:undefined,genre:P.genre||undefined,engine:kitInfo()||P.engine||undefined,seed:P.seed,sc:{mode:P.sc.mode,depth:P.sc.depth,rel:P.sc.rel,rate:P.sc.rate},master:masterOf(P),key:P.key||undefined,prog:(P.prog&&P.prog.text&&P.prog.text.trim())?{text:P.prog.text}:undefined,tracks:compact?P.tracks.map(compactTrack):P.tracks,clips:{},plugins:[]};
  if(P.sc.table){ const T=P.sc.table,u=new Uint8Array(T.length); for(let i=0;i<T.length;i++) u[i]=Math.round(clamp(T[i],0,1)*255); o.sc.table=u8ToB64(u); }
  if(typeof pruneBakedClips==='function') pruneBakedClips(P);
  for(const cid in P.clips){ const d=P.clips[cid],q=new Int16Array(d.length); for(let i=0;i<d.length;i++) q[i]=clamp(Math.round(d[i]*16384),-32768,32767); o.clips[cid]=u8ToB64(new Uint8Array(q.buffer)); }
  const used=new Set(P.tracks.map(t=>t.inst)); for(const u of USER_PLUGINS) if(used.has(u.id)) o.plugins.push({id:u.id,name:u.name,code:u.code});
  return o;
}
// peso de cada parte del archivo compacto (para avisar de lo que lo infla)
function projectReport(P){
  const o=projectToJSON(P,{compact:true}), len=x=>JSON.stringify(x).length, notes=o.tracks.reduce((a,t)=>a+len(t.n),0);
  return {total:len(o),notes,noteCount:P.tracks.reduce((a,t)=>a+t.notes.length,0),clips:len(o.clips),clipCount:Object.keys(o.clips).length,plugins:len(o.plugins),tracks:o.tracks.length};
}
// opts.allowPlugins===false: no se ejecuta el código de los plugins incluidos (por defecto sí, para compatibilidad; el estudio pregunta antes)
function projectFromJSON(o,opts){
  const errs=[], skipped=[], notes=[]; for(const u of o.plugins||[]){ const md=opts&&opts.pluginMode&&opts.pluginMode[u.id]; if(md==='installed') continue; if(md==='skip'||(opts&&opts.allowPlugins===false)){ skipped.push(u.name||u.id); continue; } try{ installPlugin(u.code,md==='temp'?{temp:true,from:o.name}:undefined); if(md==='temp') notes.push('«'+(u.name||u.id)+'» v'+verStr(codeVersion(u.code))+' se cargó como copia temporal: no toca tu plugin instalado.'); }catch(e){ errs.push(u.id+': '+e.message); } }
  const P=newProject(o.name,o.bpm,o.bars); if(Array.isArray(o.tempo)) P.tempo=tempoPts({bpm:o.bpm,tempo:o.tempo}); if(Array.isArray(o.sig)&&o.sig[0]>0&&o.sig[1]>0) P.sig=[+o.sig[0],+o.sig[1]]; if(Array.isArray(o.sigs)&&o.sigs.length) P.sigs=o.sigs.map(x=>({bar:x.bar,sig:[+x.sig[0],+x.sig[1]]})); if(Array.isArray(o.marks)&&o.marks.length) P.marks=markPts({marks:o.marks}); if(o.bank&&typeof o.bank==='object') P.bank=JSON.parse(JSON.stringify(o.bank)); if(typeof o.genre==='string'&&o.genre) P.genre=o.genre.slice(0,60); if(o.engine&&typeof o.engine.id==='string'){ P.engine={id:o.engine.id.slice(0,40),v:String(o.engine.v||'').slice(0,20)}; if(typeof o.engine.c==='string') P.engine.c=o.engine.c.slice(0,20); } P.seed=o.seed||KIT_SEED; Object.assign(P.sc,o.sc||{}); P.sc.table=null; P.master=Object.assign({},MASTER_DEF,o.master||{}); if(o.key) P.key=Object.assign({root:0,scale:'off',fit:false},o.key); if(o.prog&&typeof o.prog.text==='string'&&o.prog.text.trim()) P.prog={text:o.prog.text.slice(0,4000)};
  if(o.sc&&o.sc.table){ const u=b64ToU8(o.sc.table),T=new Float32Array(u.length); for(let i=0;i<u.length;i++) T[i]=u[i]/255; P.sc.table=T; }
  for(const cid in o.clips||{}){ const u=b64ToU8(o.clips[cid]),q=new Int16Array(u.buffer,u.byteOffset,u.length>>1),d=new Float32Array(q.length); for(let i=0;i<q.length;i++) d[i]=q[i]/16384; P.clips[cid]=d; }
  P.tracks=(o.tracks||[]).map(t=>fixTrack(expandTrack(t))); P.loadErrors=errs; P.loadNotes=notes; P.loadWarnings=[]; if(skipped.length) P.loadWarnings.push('Plugins sin ejecutar: '+skipped.join(', ')+'. Las pistas que los usan quedan sin instrumento.'); if(o.kit!=null&&o.kit!==KIT_FORMAT) P.loadWarnings.push('Este proyecto se guardó con la versión '+o.kit+' del kit y esta es la '+KIT_FORMAT+(o.kit>KIT_FORMAT?': puede sonar distinto o faltar instrumentos. Actualiza la librería.':': puede sonar un poco distinto.')); return P;
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

// ═══════════════════════════════════════════════════════════════════════
//  DEMO KIT · librería para usar en otros proyectos (sin interfaz)
//  Carga y renderiza canciones .demokit.json (proyectos del estudio) o demos .js «a mano»,
//  y las reproduce con Web Audio. Todo se sintetiza en el momento: no hay muestras.
// ═══════════════════════════════════════════════════════════════════════
persistPlugins=function(){};            // en la librería no se escribe en localStorage
const LIB_VERSION='1.5.0';
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
    if(prog) prog(1); return new Song({name:P.name,kind:'project',bpm:P.bpm,bars:P.bars,bpb:barBeats(P),sig:P.sig,loopSec:tmap(P).sec(meter(P).total(P.bars)),warnings},out);
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
