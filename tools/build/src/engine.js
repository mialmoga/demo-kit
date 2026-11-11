//#ENGINE-BEGIN
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
function persistPlugins(){ try{ if(typeof localStorage!=='undefined') localStorage.setItem('demokit-studio-plugins',JSON.stringify(USER_PLUGINS.map(u=>u.temp?u.shadow:u).filter(Boolean).map(u=>({id:u.id,name:u.name,code:u.code})))); }catch(e){} }
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
function markPts(P){ const m=new Map(); for(const x of (P&&P.marks)||[]){ if(!x||!(x.bar>=0)) continue; const bar=Math.floor(x.bar), o={bar,name:String(x.name==null?'':x.name).trim().slice(0,40)||'Sección'}; if(x.c>=0&&x.c<MARK_PAL.length) o.c=x.c|0; m.set(bar,o); } return [...m.values()].sort((a,b)=>a.bar-b.bar); }
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
function voiceChord(c,prev){
  let iv=c.ivs.slice(); if(iv.length>4){ const k=iv.findIndex(x=>x===7||x===6||x===8); if(k>0&&iv.length>4) iv.splice(k,1); } if(iv.length>5){ const k=iv.indexOf(17); if(k>0) iv.splice(k,1); }
  const cands=[]; for(let r=0;r<iv.length;r++){ const v=iv.map((x,i)=>c.root+x+(i<r?12:0)).sort((a,b)=>a-b); const mean=v.reduce((a,b)=>a+b,0)/v.length, sh=Math.round((prev-mean)/12)*12; const ms=v.map(m=>m+sh); const mn=ms.reduce((a,b)=>a+b,0)/ms.length; cands.push({ms,d:Math.abs(mn-prev)}); }
  cands.sort((a,b)=>a.d-b.d); let ms=cands[0].ms; while(Math.min(...ms)<48) ms=ms.map(m=>m+12); while(Math.max(...ms)>84) ms=ms.map(m=>m-12);
  return {ms,mean:ms.reduce((a,b)=>a+b,0)/ms.length};
}
function progToNotes(P,opts){
  const L=progChords(P).chords.filter(c=>c.ok), o=Object.assign({center:62,gap:.02},opts||{}), out={chords:[],bass:[]}; let prev=o.center;
  for(const c of L){
    const v=voiceChord(c,prev); prev=v.mean; const len=Math.max(.05,c.b1-c.b0-o.gap);
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
    pan:clamp((tr.pan||0)+(nt.pan||0),-1,1),p,buf:tr.ducked?K.mu:K.dr,sr:SR,bpm:bpmN,beat:bt,bar:bt*meter(P).lenAt(nt.b),note:nt,clips:P.clips,link:nb&&!(t0!=null)?linkOf(P,nt,nb):null,chords:chordsFor(P,nt,tm,vb,beat)};
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
const FX_DEF={eq:{on:false,low:0,mid:0,midF:1000,midQ:1,high:0},comp:{on:false,thr:-18,ratio:3,atk:10,rel:120,knee:6,makeup:0,mix:1},delay:{on:false,time:.75,fb:.4,tone:4500,mix:.3,pp:true},reverb:{on:false,size:.65,damp:.5,mix:.25,pre:12}};
const MASTER_DEF={low:0,high:0,gain:1,limit:true,ceil:.97};
const fxOf=tr=>{ const f=(tr&&tr.fx)||{}; return {eq:Object.assign({},FX_DEF.eq,f.eq),comp:Object.assign({},FX_DEF.comp,f.comp),delay:Object.assign({},FX_DEF.delay,f.delay),reverb:Object.assign({},FX_DEF.reverb,f.reverb)}; };
// curvas de los efectos de la pista (tr.auto['fx:<grupo>.<parámetro>'], puntos {b,v} con el valor real del parámetro): continuas, se aplican sobre el audio ya renderizado
const FX_LANES={'fx:eq.low':{g:'eq',k:'low',label:'EQ · graves',min:-12,max:12,unit:'dB'},'fx:eq.mid':{g:'eq',k:'mid',label:'EQ · medios',min:-12,max:12,unit:'dB'},'fx:eq.midF':{g:'eq',k:'midF',label:'EQ · frecuencia de medios',min:200,max:5000,unit:'Hz'},'fx:eq.high':{g:'eq',k:'high',label:'EQ · agudos',min:-12,max:12,unit:'dB'},
  'fx:comp.thr':{g:'comp',k:'thr',label:'Compresor · umbral',min:-48,max:0,unit:'dB'},'fx:comp.makeup':{g:'comp',k:'makeup',label:'Compresor · compensación',min:0,max:24,unit:'dB'},'fx:comp.mix':{g:'comp',k:'mix',label:'Compresor · mezcla',min:0,max:1,unit:''},
  'fx:delay.mix':{g:'delay',k:'mix',label:'Delay · mezcla',min:0,max:1,unit:''},'fx:reverb.mix':{g:'reverb',k:'mix',label:'Reverb · mezcla',min:0,max:1,unit:''}};
function fxLanePts(tr){ let o=null; if(tr&&tr.auto) for(const k in FX_LANES){ const p=autoPts(tr,k); if(p){ (o||(o={}))[k]=p; } } return o; }
const eqOn=(e,L)=>!!(e.on&&(e.low||e.mid||e.high||(L&&(L['fx:eq.low']||L['fx:eq.mid']||L['fx:eq.high'])))), compOn=(c,L)=>!!(c.on&&(c.mix>0||(L&&L['fx:comp.mix']))&&c.ratio>1);
const fxActive=(fx,L)=>!!(eqOn(fx.eq,L)||compOn(fx.comp,L)||(fx.delay.on&&(fx.delay.mix>0||(L&&L['fx:delay.mix'])))||(fx.reverb.on&&(fx.reverb.mix>0||(L&&L['fx:reverb.mix']))));
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
  if(eqA||cpA){ a=Float32Array.from(a); b=Float32Array.from(b);                  // EQ → compresor → eco → reverb
    if(eqA){ if(LN['fx:eq.low']||LN['fx:eq.mid']||LN['fx:eq.midF']||LN['fx:eq.high']) eqAuto(a,b,fx.eq,{low:LN['fx:eq.low'],mid:LN['fx:eq.mid'],midF:LN['fx:eq.midF'],high:LN['fx:eq.high']}); else { shelf(a,b,120,fx.eq.low,false); peakEq(a,b,fx.eq.midF,fx.eq.mid,fx.eq.midQ); shelf(a,b,7000,fx.eq.high,true); } }
    if(cpA) compFx(a,b,fx.comp,(LN['fx:comp.thr']||LN['fx:comp.makeup']||LN['fx:comp.mix'])?{thr:LN['fx:comp.thr'],makeup:LN['fx:comp.makeup'],mix:LN['fx:comp.mix']}:null); }
  if(dly) [a,b]=delayFx(a,b,m,fx.delay,beat,tv,LN['fx:delay.mix']);
  if(rev) [a,b]=reverbFx(a,b,m,fx.reverb,LN['fx:reverb.mix']);
  return {L:a,R:b};
}
function fxStems(stems,fx,beat,N,tm,LP){
  return stems.map(st=>{
    const len=st.q[0].length, g=st.pk/32767, L=new Float32Array(len), R=new Float32Array(len); for(let i=0;i<len;i++){ L[i]=st.q[0][i]*g; R[i]=st.q[1][i]*g; }
    let lanes=null; if(LP){ lanes={}; for(const k in LP){ const S=autoSampler(LP[k],beat,tm), o=st.s0; lanes[k]=i=>S(o+i); } }     // una curva por pista y por tramo, en tiempo absoluto
    const r=applyFx(L,R,fx,beat,N-st.s0,tm?{tm,s0:st.s0}:null,lanes), n=r.L.length; let pk=0; for(let i=0;i<n;i++){ const a=Math.abs(r.L[i]),b=Math.abs(r.R[i]); if(a>pk) pk=a; if(b>pk) pk=b; }
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
function trackKey(P,tr,total){ const inst=INSTRUMENTS[tr.inst], k=[tr.inst,inst?inst.rev:0,KIT_REV,tr.params,tr.pan,tr.ducked?1:0,P.bpm,tempoPts(P),P.seed,total,tr.notes,(l=>l.length?[tr.alv===16?16:8,l.map(x=>[x.k,x.pts])]:0)(paramLanes(tr,inst))];
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
async function renderTrackStem(P,tr,beat,total){
  const inst=INSTRUMENTS[tr.inst]; if(!inst) throw new Error('instrumento no disponible ('+tr.inst+')');
  const K=Kit.make(SR,total,trackSeed(P,tr)); K.sr=SR; const t=Object.assign({},tr,{vol:1}), lanes=paramLanes(tr,inst), LV=tr.alv===16?16:8; let last=performance.now(),i=0;
  const SN=tr.notes.slice().sort((a,b)=>a.b-b.b);
  for(let j=0;j<SN.length;j++){ const nt=SN[j]; let pv=null,nx=null; for(let q=j-1;q>=0;q--) if(SN[q].b<nt.b-1e-6){ pv=SN[q]; break; } for(let q=j+1;q<SN.length;q++) if(SN[q].b>nt.b+1e-6){ nx=SN[q]; break; }
    inst.play(K,noteArgs(K,P,t,laneNote(lanes,LV,nt),beat,null,{prev:pv,next:nx})); if(++i%25===0&&performance.now()-last>14){ await tick(); last=performance.now(); } }
  return extractStems(K);
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
  const o={format:'demokit-studio',v:compact?2:1,kit:KIT_FORMAT,name:P.name,bpm:P.bpm,bars:P.bars,tempo:(P.tempo&&P.tempo.length)?P.tempo:undefined,sig:barBeats(P)===4&&(!P.sig||P.sig[1]===4)?undefined:P.sig,sigs:sigPts(P).length?sigPts(P):undefined,marks:markPts(P).length?markPts(P):undefined,genre:P.genre||undefined,engine:kitInfo()||P.engine||undefined,seed:P.seed,sc:{mode:P.sc.mode,depth:P.sc.depth,rel:P.sc.rel,rate:P.sc.rate},master:masterOf(P),key:P.key||undefined,prog:(P.prog&&P.prog.text&&P.prog.text.trim())?{text:P.prog.text}:undefined,tracks:compact?P.tracks.map(compactTrack):P.tracks,clips:{},plugins:[]};
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
  const P=newProject(o.name,o.bpm,o.bars); if(Array.isArray(o.tempo)) P.tempo=tempoPts({bpm:o.bpm,tempo:o.tempo}); if(Array.isArray(o.sig)&&o.sig[0]>0&&o.sig[1]>0) P.sig=[+o.sig[0],+o.sig[1]]; if(Array.isArray(o.sigs)&&o.sigs.length) P.sigs=o.sigs.map(x=>({bar:x.bar,sig:[+x.sig[0],+x.sig[1]]})); if(Array.isArray(o.marks)&&o.marks.length) P.marks=markPts({marks:o.marks}); if(typeof o.genre==='string'&&o.genre) P.genre=o.genre.slice(0,60); if(o.engine&&typeof o.engine.id==='string'){ P.engine={id:o.engine.id.slice(0,40),v:String(o.engine.v||'').slice(0,20)}; if(typeof o.engine.c==='string') P.engine.c=o.engine.c.slice(0,20); } P.seed=o.seed||KIT_SEED; Object.assign(P.sc,o.sc||{}); P.sc.table=null; P.master=Object.assign({},MASTER_DEF,o.master||{}); if(o.key) P.key=Object.assign({root:0,scale:'off',fit:false},o.key); if(o.prog&&typeof o.prog.text==='string'&&o.prog.text.trim()) P.prog={text:o.prog.text.slice(0,4000)};
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
//#CONVERTER-BEGIN
// ───────────────────────── MIDI: exportar el proyecto e importar un archivo .mid ─────────────────────────
// Archivo MIDI estándar tipo 1, 480 pulsos por negra (el «pulso» del proyecto es la negra, así que 1 pulso = 480 ticks).
// MIDI lleva la partitura (notas, tempo, compás, volumen y paneo), no el sonido del kit, ni plugins, ni efectos.
// ── hornear notas con barrido continuo ──
// Una nota con automatización de parámetros normalmente fija el valor al empezar. Hornear la renderiza varias veces (mismo ruido, mismo
// inicio) con los valores que la curva toma a lo largo de la nota y hace crossfade entre esos renders: el barrido sale continuo.
// El resultado es un clip estéreo en una pista «· bake» (p.clips[cid] = izquierdo, p.clips[cid+'~r'] = derecho). Notas idénticas comparten clip.
function bakeNoteClip(P,tr,nt,lanes){
  const inst=INSTRUMENTS[tr.inst], tm=tmap(P), beatN=60/tm.bpmAt(nt.b), lenB=nt.l||.25, lenSec=Math.max(.01,tm.span(nt.b,lenB)), dur=lenSec+TAIL;
  const KN=Math.max(3,Math.min(16,Math.round(lenSec*6)+2)), an=[];
  for(let i=0;i<KN;i++){ const f=i/(KN-1), o={}; for(const ln of lanes){ if(nt.o&&nt.o[ln.k]!=null) continue; const dd=ln.d, st=dd.step>0?dd.step:.01; o[ln.k]=+(Math.round(clamp(autoValue(ln.pts,nt.b+lenB*f),dd.min,dd.max)/st)*st).toFixed(5); } an.push({s:tm.sec(nt.b+lenB*f)-tm.sec(nt.b),o}); }
  const chs=inst.usesProg?chordsFor(P,nt,tm,true,60/P.bpm):null;   // los acordes que caen en la nota (con su posición real) entran al hash y al render
  const cid='bk-'+hash2(JSON.stringify([tr.inst,inst.rev,KIT_REV,tr.params,nt.m,lenSec,nt.v,nt.pan,nt.o,tr.pan,tr.ducked?1:0,beatN,P.seed,trackSeed(P,tr),an.map(x=>[+x.s.toFixed(4),x.o])].concat(chs?[chs]:[])));
  if(P.clips[cid]) return {cid,shared:true,bytes:0};
  const t=Object.assign({},tr,{vol:1}), n2=Object.assign({},nt,{b:0,l:lenSec/beatN}), R=[]; let N=Infinity;
  for(const x of an){ const K=Kit.make(SR,dur,trackSeed(P,tr)); K.sr=SR; const na=noteArgs(K,P,t,Object.assign({},n2,{o:Object.assign({},nt.o,x.o)}),beatN,0); na.chords=chs; inst.play(K,na); const bus=tr.ducked?K.mu:K.dr; R.push(bus); N=Math.min(N,bus[0].length); }
  const L=new Float32Array(N), Rr=new Float32Array(N); let j=0, end=0;
  for(let i=0;i<N;i++){ const ts=i/SR; while(j<KN-2&&an[j+1].s<=ts) j++; let w=0, A=R[j], B=R[Math.min(j+1,KN-1)];
    if(KN>1&&ts>=an[j].s&&an[j+1]){ const d=an[j+1].s-an[j].s; w=d>0?Math.min(1,(ts-an[j].s)/d):1; }
    const l=A[0][i]*(1-w)+B[0][i]*w, r=A[1][i]*(1-w)+B[1][i]*w; L[i]=clamp(l,-1.99,1.99); Rr[i]=clamp(r,-1.99,1.99); if(Math.abs(l)>1e-5||Math.abs(r)>1e-5) end=i+1; }
  P.clips[cid]=L.slice(0,end); P.clips[cid+'~r']=Rr.slice(0,end); return {cid,shared:false,bytes:end*4};
}
function bakeTrackNotes(P,tr,notes){      // → {baked, shared, bytes, track}
  const inst=INSTRUMENTS[tr.inst]; if(!inst) throw new Error('instrumento no disponible'); const lanes=paramLanes(tr,inst);
  if(!lanes.length) throw new Error('esta pista no tiene curvas de parámetros del instrumento');
  let bt=P.tracks.find(x=>x.bakeOf===tr.id&&x.inst==='clip');
  if(!bt){ const ci=INSTRUMENTS.clip; bt=fixTrack({id:uid(),name:tr.name+' · bake',inst:'clip',params:defaultParams(ci),vol:tr.vol,pan:0,mute:tr.mute,solo:tr.solo,ducked:tr.ducked,sc:tr.sc,bakeOf:tr.id,notes:[]});
    if(tr.fx) bt.fx=JSON.parse(JSON.stringify(tr.fx)); if(tr.auto){ const a={}; for(const k of Object.keys(tr.auto)) if(k==='vol'||k==='pan'||k==='cut'||FX_LANES[k]) a[k]=JSON.parse(JSON.stringify(tr.auto[k])); if(Object.keys(a).length) bt.auto=a; }
    P.tracks.splice(P.tracks.indexOf(tr)+1,0,bt); }
  let baked=0, shared=0, bytes=0;
  for(const nt of notes){ const r=bakeNoteClip(P,tr,nt,lanes); tr.notes.splice(tr.notes.indexOf(nt),1);
    const src={m:nt.m,l:nt.l,v:nt.v==null?1:nt.v}; if(nt.pan) src.pan=nt.pan; if(nt.o) src.o=nt.o; if(nt.w) src.w=nt.w;
    bt.notes.push({b:nt.b,l:nt.l||.25,m:0,v:1,o:{cid:r.cid,src}}); baked++; if(r.shared) shared++; bytes+=r.bytes; }
  return {baked,shared,bytes,track:bt};
}
function unbakeTrackNotes(P,bt,notes){     // devuelve las notas horneadas a su pista de origen
  const src=P.tracks.find(x=>x.id===bt.bakeOf); if(!src) throw new Error('la pista original ya no existe'); let n=0;
  for(const nt of notes){ const s=nt.o&&nt.o.src; if(!s) continue; const o={b:nt.b,l:s.l,m:s.m,v:s.v}; if(s.pan) o.pan=s.pan; if(s.o) o.o=s.o; if(s.w) o.w=s.w; src.notes.push(o); bt.notes.splice(bt.notes.indexOf(nt),1); n++; }
  if(!bt.notes.length) P.tracks.splice(P.tracks.indexOf(bt),1); pruneBakedClips(P); return n;
}
function pruneBakedClips(P){ const used=new Set(); for(const t of P.tracks) if(t.inst==='clip') for(const n of t.notes) if(n.o&&n.o.cid) used.add(n.o.cid); for(const k of Object.keys(P.clips)) if(k.slice(0,3)==='bk-'&&!used.has(k.replace(/~r$/,''))) delete P.clips[k]; }

const MIDI_PPQ=480;
const MIDI_GM_DRUM={kick:36,snare:38,clap:39,rim:37,snap:75,crash:49};                  // hi-hat: carril 0 → 42 (cerrado), carril 1 → 46 (abierto)
const MIDI_PROG={sub:38,subfall:38,reese:39,reesemk:39,growl:39,bell:10,bellmk:10,chop:52,pad:89,supersaw:81,sinte:81,pluck:80,arp:80};   // programa GM de referencia (0-127)
function midiVlq(n){ n=Math.max(0,Math.round(n)); const b=[n&127]; while((n>>=7)>0) b.unshift((n&127)|128); return b; }
function midiText(s){ return Array.from(new TextEncoder().encode(String(s))); }
function midiChunk(tag,bytes){ const n=bytes.length; return [tag.charCodeAt(0),tag.charCodeAt(1),tag.charCodeAt(2),tag.charCodeAt(3),(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].concat(bytes); }
function midiTrackBytes(evs,endTick){   // evs: [{t,o,b:[bytes]}] (o: orden en el mismo tick) → bytes de la pista con su fin
  evs.sort((x,y)=>x.t-y.t||x.o-y.o); const out=[]; let last=0; for(const e of evs){ out.push(...midiVlq(e.t-last),...e.b); last=e.t; }
  out.push(...midiVlq(Math.max(0,endTick-last)),0xFF,0x2F,0); return midiChunk('MTrk',out);
}
function projectToMidi(P){
  const tm=tmap(P), mm=meter(P), totalBeats=mm.total(P.bars), endTick=Math.round(totalBeats*MIDI_PPQ), sig=(P.sig&&P.sig[0]>0&&P.sig[1]>0)?P.sig:[4,4];
  const meta=(t,type,data,o)=>({t,o:o==null?0:o,b:[0xFF,type,...midiVlq(data.length),...data]});
  const cond=[meta(0,0x03,midiText(P.name||'Demo Kit')),meta(0,0x58,[sig[0],Math.round(Math.log2(sig[1])),24,8])];
  for(const p of sigPts(P)) if(p.bar<P.bars) cond.push(meta(Math.round(mm.beatOfBar(p.bar)*MIDI_PPQ),0x58,[p.sig[0],Math.round(Math.log2(p.sig[1])),24,8]));
  for(const m of markPts(P)) if(m.bar<P.bars) cond.push(meta(Math.round(mm.beatOfBar(m.bar)*MIDI_PPQ),0x06,midiText(m.name),-2));   // secciones → marcadores de MIDI (los DAW los muestran en su regla)
  { let lastMp=-1; const cand=new Set([0]); for(let b=0;b<=totalBeats+1e-9;b+=.25) cand.add(+b.toFixed(6)); for(const p of (P.tempo||[])) if(p&&p.b>=0&&p.b<=totalBeats) cand.add(+p.b);
    for(const b of [...cand].sort((x,y)=>x-y)){ const mp=Math.round(60e6/Math.max(1,tm.bpmAt(b))); if(mp!==lastMp){ cond.push(meta(Math.round(b*MIDI_PPQ),0x51,[(mp>>>16)&255,(mp>>>8)&255,mp&255],-1)); lastMp=mp; } } }
  const chunks=[midiTrackBytes(cond,endTick)], skipped=[]; let nextCh=0; const melCh=[0,1,2,3,4,5,6,7,8,10,11,12,13,14,15];
  for(const tr of P.tracks){ if(!tr.notes.length){ continue; } const inst=INSTRUMENTS[tr.inst]||{}, gm=inst.kind==='perc'&&(MIDI_GM_DRUM[tr.inst]||tr.inst==='hat'||typeof inst.midiNote==='function');
    const ch=gm?9:melCh[nextCh++%melCh.length], ev=[meta(0,0x03,midiText(tr.name||inst.name||'Pista')),meta(0,0x04,midiText(inst.name||tr.inst))];
    if(!gm) ev.push({t:0,o:1,b:[0xC0|ch,MIDI_PROG[tr.inst]||0]});
    ev.push({t:0,o:1,b:[0xB0|ch,7,tr.mute?0:Math.max(0,Math.min(127,Math.round((tr.vol==null?1:tr.vol)*100)))]},{t:0,o:1,b:[0xB0|ch,10,Math.max(0,Math.min(127,Math.round(64+(tr.pan||0)*63)))]});
    const list=tr.notes.map(n=>{ let key=typeof inst.midiNote==='function'&&inst.kind==='perc'?inst.midiNote(n.m,tr.params||{}):null; if(key==null) key=gm?(tr.inst==='hat'?(Math.round(n.m)===1?46:42):MIDI_GM_DRUM[tr.inst]):Math.max(0,Math.min(127,Math.round(inst.kind==='perc'?60+(n.m||0):n.m)));
      const on=Math.round(n.b*MIDI_PPQ), len=gm?120:Math.max(1,Math.round((n.l||.25)*MIDI_PPQ)); return {key,on,off:on+len,vel:Math.max(1,Math.min(127,Math.round((n.v==null?1:n.v)*100)))}; });
    const byKey=new Map(); for(const x of list){ if(!byKey.has(x.key)) byKey.set(x.key,[]); byKey.get(x.key).push(x); }
    for(const arr of byKey.values()){ arr.sort((a,b)=>a.on-b.on); for(let i=0;i+1<arr.length;i++) if(arr[i].off>arr[i+1].on) arr[i].off=Math.max(arr[i].on+1,arr[i+1].on); }   // una misma nota no se solapa consigo misma
    for(const x of list){ ev.push({t:x.on,o:2,b:[0x90|ch,x.key,x.vel]},{t:x.off,o:1,b:[0x80|ch,x.key,0]}); }
    chunks.push(midiTrackBytes(ev,Math.max(endTick,...list.map(x=>x.off)))); }
  const header=midiChunk('MThd',[0,1,(chunks.length>>8)&255,chunks.length&255,(MIDI_PPQ>>8)&255,MIDI_PPQ&255]);
  return new Uint8Array(header.concat(...chunks));
}
// texto de los meta-eventos: casi todos los programas escriben UTF-8, pero algunos usan Latin-1 (acentos); se prueba UTF-8 estricto y, si no cuadra, Latin-1
function midiDecode(d){ try{ return new TextDecoder('utf-8',{fatal:true}).decode(d); }catch(e){ return new TextDecoder('windows-1252').decode(d); } }
function parseMidi(u8){
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength), tag=(i)=>String.fromCharCode(u8[i],u8[i+1],u8[i+2],u8[i+3]);
  if(u8.length<14||tag(0)!=='MThd') throw new Error('No es un archivo MIDI (falta la cabecera MThd).');
  const hl=dv.getUint32(4), format=dv.getUint16(8), ntrk=dv.getUint16(10), div=dv.getUint16(12);
  if(div&0x8000) throw new Error('Este MIDI usa tiempo SMPTE (no compases y pulsos); no sé importarlo.');
  const ppq=div||480, tracks=[]; let pos=8+hl;
  while(pos+8<=u8.length&&tracks.length<ntrk+64){ const t=tag(pos), len=dv.getUint32(pos+4), end=Math.min(u8.length,pos+8+len); pos+=8;
    if(t!=='MTrk'){ pos=end; continue; }
    const evs=[]; let tick=0, run=0;
    const vlq=()=>{ let v=0,b; do{ b=u8[pos++]; v=(v<<7)|(b&127); }while((b&128)&&pos<end); return v; };
    while(pos<end){ tick+=vlq(); let s=u8[pos];
      if(s===0xFF){ pos++; const ty=u8[pos++], l=vlq(), d=u8.subarray(pos,pos+l); pos+=l; run=0;
        if(ty===0x03) evs.push({tick,k:'name',text:midiDecode(d)}); else if(ty===0x51&&l===3) evs.push({tick,k:'tempo',mp:(d[0]<<16)|(d[1]<<8)|d[2]}); else if(ty===0x58&&l>=2) evs.push({tick,k:'sig',n:d[0],d:Math.pow(2,d[1])}); else if(ty===0x06||ty===0x07) evs.push({tick,k:'marker',text:midiDecode(d)}); else if(ty===0x2F){ evs.push({tick,k:'end'}); break; } continue; }
      if(s===0xF0||s===0xF7){ pos++; const l=vlq(); pos+=l; run=0; continue; }
      if(s&128){ run=s; pos++; } else if(!run) throw new Error('El archivo MIDI está dañado (dato sin estado previo).'); else s=run;
      const st=run&0xF0, ch=run&15;
      if(st===0x80||st===0x90||st===0xA0||st===0xB0||st===0xE0){ const a=u8[pos++], b=u8[pos++];
        if(st===0x90&&b>0) evs.push({tick,k:'on',ch,key:a,vel:b}); else if(st===0x80||st===0x90) evs.push({tick,k:'off',ch,key:a}); else if(st===0xB0) evs.push({tick,k:'cc',ch,c:a,v:b}); }
      else if(st===0xC0){ evs.push({tick,k:'prog',ch,p:u8[pos++]}); } else if(st===0xD0){ pos++; } else { pos++; } }
    tracks.push(evs); pos=end; }
  return {format,ppq,tracks};
}
function midiSigToProject(n,d,warn){ const bbs=n*4/d; for(const s of SIGS) if(s[0]===n&&s[1]===d) return [n,d]; for(const s of SIGS) if(Math.abs(s[0]*4/s[1]-bbs)<1e-9) return s.slice(); warn.push('El compás '+n+'/'+d+' no está entre los que soporta el estudio: usé 4/4.'); return [4,4]; }
function midiToProject(u8,fname){
  const M=parseMidi(u8), ppq=M.ppq, warn=[], r6b=x=>r6(x/ppq);
  let tempos=[], sigs=[], projName=null;
  M.tracks.forEach((evs,ti)=>{ for(const e of evs){ if(e.k==='tempo') tempos.push(e); else if(e.k==='sig') sigs.push(e); else if(e.k==='name'&&ti===0&&!projName&&e.text.trim()) projName=e.text.trim(); } });
  tempos.sort((a,b)=>a.tick-b.tick); sigs.sort((a,b)=>a.tick-b.tick);
  const bpm0=tempos.length?60e6/tempos[0].mp:120, P=newProject(projName||String(fname||'MIDI').replace(/\.midi?$/i,''),+Math.max(20,Math.min(400,bpm0)).toFixed(2),8);
  { const pts=[]; let lastBpm=P.bpm; for(const t of tempos.slice(1)){ const b=+(60e6/t.mp).toFixed(2); if(Math.abs(b-lastBpm)<.005||t.tick===0) continue; pts.push({b:r6b(t.tick),bpm:Math.max(20,Math.min(400,b)),ramp:false}); lastBpm=b; }
    let kept=pts; if(pts.length>200){ kept=[]; let lb=P.bpm; for(const p of pts) if(Math.abs(p.bpm-lb)/lb>=.005){ kept.push(p); lb=p.bpm; } warn.push('El archivo tiene '+pts.length+' cambios de tempo; simplifiqué a '+kept.length+'.'); }
    if(kept.length) P.tempo=kept; }
  if(sigs.length){ let cur={bar:0,beat:0,len:4,sig:[4,4]}; const pts=[], s0=sigs.find(x=>x.tick===0); if(s0){ P.sig=midiSigToProject(s0.n,s0.d,warn); cur.len=barBeats(P); cur.sig=P.sig; }
    let snapped=0; for(const x of sigs){ if(x.tick===0) continue; const beat=x.tick/ppq, bars=(beat-cur.beat)/cur.len, bi=Math.round(bars); if(Math.abs(bars-bi)>1e-3) snapped++;
      const sg=midiSigToProject(x.n,x.d,warn); if(sg[0]===cur.sig[0]&&sg[1]===cur.sig[1]) continue; const bar=cur.bar+Math.max(0,bi);
      if(bar===0){ P.sig=sg; } else { const k=pts.findIndex(q=>q.bar===bar); if(k>=0) pts[k].sig=sg; else pts.push({bar,sig:sg}); }
      cur={bar,beat:cur.beat+Math.max(0,bi)*cur.len,len:sg[0]*4/sg[1],sig:sg}; }
    if(pts.length){ P.sigs=pts; warn.push('El archivo cambia de compás ('+(pts.length)+' cambio'+(pts.length>1?'s':'')+'): quedan en la pista «Compás».'); }
    if(snapped) warn.push(snapped+' cambio(s) de compás no caían en límite de compás: los ajusté al compás más cercano.'); }
  const groups=new Map(); const grp=(key,make)=>{ let g=groups.get(key); if(!g){ g=make(); groups.set(key,g); } return g; };
  const drumTarget=k=>(k===35||k===36)?['kick',0,'Bombo']:(k===38||k===40)?['snare',0,'Caja']:k===39?['clap',0,'Palma']:k===37?['rim',0,'Rim']:(k===42||k===44)?['hat',0,'Hi-hat']:k===46?['hat',1,'Hi-hat']:(k===49||k===57)?['crash',0,'Crash']:k===75?['snap',0,'Chasquido']:['rim',0,'Percusión extra'];
  const FAM=['Piano','Percusión afinada','Órgano','Guitarra','Bajo','Cuerdas','Ensamble','Metales','Cañas','Flautas','Lead','Pad','Efectos sintéticos','Étnicos','Percusión','Efectos'];
  const progInst=p=>p>=32&&p<=39?'sub':p>=8&&p<=15?'bell':((p>=40&&p<=55)||(p>=88&&p<=95))?'pad':'sinte';
  let lastTick=0, nNotes=0, dropped=0; for(const evs of M.tracks) for(const x of evs) if(x.k==='end') lastTick=Math.max(lastTick,x.tick);
  M.tracks.forEach((evs,ti)=>{
    const name=(evs.find(e=>e.k==='name')||{}).text, open=new Map(), state={}, seq=[];
    const st=ch=>state[ch]||(state[ch]={prog:0,vol:null,pan:null,seen:false});
    for(const e of evs){ if(e.k==='prog'){ const s=st(e.ch); if(!s.seen) s.prog=e.p; } else if(e.k==='cc'){ const s=st(e.ch); if(!s.seen){ if(e.c===7) s.vol=e.v; else if(e.c===10) s.pan=e.v; } }
      else if(e.k==='on'){ st(e.ch).seen=true; const k=e.ch+':'+e.key; if(!open.has(k)) open.set(k,[]); open.get(k).push(e); }
      else if(e.k==='off'){ const k=e.ch+':'+e.key, q=open.get(k); if(q&&q.length){ const o=q.shift(); seq.push({ch:e.ch,key:e.key,on:o.tick,off:Math.max(o.tick+1,e.tick),vel:o.vel}); } } }
    const endT=evs.length?evs[evs.length-1].tick:0; for(const [k,q] of open) for(const o of q) seq.push({ch:o.ch,key:o.key,on:o.tick,off:Math.max(o.tick+1,endT),vel:o.vel});
    for(const x of seq){ lastTick=Math.max(lastTick,x.off); nNotes++;
      if(x.ch===9){ const [inst,lane,gname]=drumTarget(x.key), g=grp('d:'+inst+'|'+gname,()=>({inst,name:gname,kind:'perc',s:st(9),notes:[]})); g.notes.push({b:r6b(x.on),l:.25,m:lane,v:r6(x.vel/100)}); }
      else { const s=st(x.ch), key='m:'+ti+':'+x.ch, g=grp(key,()=>({inst:progInst(s.prog),name:(name&&name.trim())||((FAM[s.prog>>3]||'Pista')+' · canal '+(x.ch+1)),kind:'mel',s,notes:[]})); g.notes.push({b:r6b(x.on),l:Math.max(r6(1/ppq),r6b(x.off-x.on)),m:x.key,v:r6(x.vel/100)}); } } });
  if(!nNotes) throw new Error('El archivo MIDI no tiene notas.');
  const rawMarks=[]; M.tracks.forEach(evs=>{ for(const x of evs) if(x.k==='marker'&&x.text&&x.text.trim()) rawMarks.push(x); });
  const mmI=meter(P), endBeat=lastTick/ppq; P.bars=Math.max(1,Math.min(256,mmI.barAt(Math.max(0,endBeat-1e-6)).i+1));
  if(mmI.barAt(Math.max(0,endBeat-1e-6)).i+1>256) warn.push('El archivo dura más de 256 compases: recorté el proyecto a 256.');
  if(rawMarks.length){ rawMarks.sort((a,b)=>a.tick-b.tick); const byBar=new Map(); let snappedM=0, outM=0, dupM=0;
    for(const x of rawMarks){ const beat=x.tick/ppq, a=mmI.barAt(Math.max(0,beat)), bi=(beat-a.start)>a.len/2?a.i+1:a.i; if(Math.abs(beat-mmI.beatOfBar(bi))>1e-3) snappedM++; if(bi>=P.bars){ outM++; continue; } if(byBar.has(bi)){ dupM++; continue; } byBar.set(bi,{bar:bi,name:x.text.trim().slice(0,40)}); }
    if(byBar.size){ P.marks=markPts({marks:[...byBar.values()]}); warn.push('Importé '+P.marks.length+' marcador'+(P.marks.length>1?'es':'')+' como secciones.'); }
    if(snappedM) warn.push(snappedM+' marcador(es) no caían en límite de compás: los ajusté al compás más cercano.'); if(dupM) warn.push(dupM+' marcador(es) caían en un compás que ya tenía sección: los dejé fuera.'); if(outM) warn.push(outM+' marcador(es) quedaban después del final: los dejé fuera.'); }
  const used={}; for(const g of groups.values()){ const tr=newTrack(g.inst,g.name); if(used[g.name]) tr.name=g.name+' '+(++used[g.name]); else used[g.name]=1;
    if(g.s&&g.s.vol!=null) tr.vol=Math.max(0,Math.min(1.5,g.s.vol/100)); if(g.s&&g.s.pan!=null) tr.pan=Math.max(-1,Math.min(1,(g.s.pan-64)/63));
    tr.notes=g.notes.sort((a,b)=>a.b-b.b); P.tracks.push(tr); }
  const rank=['kick','snare','clap','snap','hat','crash','rim']; const ord=t=>{ const i=rank.indexOf(t.inst); return i<0?100:i; };   // la batería arriba, como al convertir demos
  P.tracks=P.tracks.map((t,i)=>({t,i})).sort((a,b)=>(ord(a.t)-ord(b.t))||(a.i-b.i)).map(x=>x.t);
  return {project:P,warnings:warn,stats:{tracks:P.tracks.length,notes:nNotes,bars:P.bars,bpm:P.bpm,tempoChanges:(P.tempo||[]).length,marks:(P.marks||[]).length}};
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
    case 'auto': return e.item;
    case 'add': return {inst:'clip',buf:e.buf,t0:e.t0,len:e.len,m:0,a:e.amp,pan:e.pan,p:{},data:e.data,caller:e.caller};
  }
  return null;
}
const TRACK_NAMES={kick:'Bombo',snare:'Caja',clap:'Palma',snap:'Chasquido',hat:'Hi-hat',crash:'Crash',bell:'Campanas',bellmk:'Campanas',reesemk:'Reese',chop:'Sílabas (chop)',riser:'Riser',sweep:'Barrido',reese:'Reese',growl:'Growl',rim:'Rim',wash:'Viento',impact:'Impacto'};
function guessName(g){
  if(g.name) return g.name;
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
    if(!g){ g={inst:it.inst,buf:it.buf,caller:it.caller,name:it.gname,items:[]}; groups.set(key,g); } g.items.push(it); }
  let ci=0, clipsTotal=0; const trs=[], seen={}, dedup=new Map();   // dedup: huella → [cid] (los clips con audio idéntico comparten cid)
  const sameData=(a,b)=>{ if(a.length!==b.length) return false; for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; };
  const fingerprint=d=>{ const u=new Uint32Array(d.buffer,d.byteOffset,d.length); let h1=2166136261,h2=5381; for(let i=0;i<u.length;i++){ h1=Math.imul(h1^u[i],16777619); h2=(Math.imul(h2,33)+u[i])|0; } return d.length+':'+(h1>>>0)+':'+(h2>>>0); };
  for(const g of groups.values()){
    const inst=INSTRUMENTS[g.inst], base=defaultParams(inst); let gain=0; for(const it of g.items) gain=Math.max(gain,it.a||0); if(!(gain>0)) gain=1;
    const keys=new Set(); g.items.forEach(it=>Object.keys(it.p).forEach(k=>keys.add(k)));
    for(const k of keys){ const cnt=new Map(); let best=null,bn=0; for(const it of g.items){ const s=JSON.stringify(it.p[k]),c=(cnt.get(s)||0)+1; cnt.set(s,c); if(c>bn){bn=c;best=it.p[k];} } base[k]=best; }
    base.gain=r6(gain);
    const notes=g.items.map(it=>{
      const nt={b:r6(it.t0/beat),l:it.len!=null?r6(it.len/beat):.25,m:it.m,v:r6((it.a||0)/gain)}; if(it.pan) nt.pan=r6(it.pan);
      const o={}; for(const k of keys){ if(JSON.stringify(it.p[k])!==JSON.stringify(base[k])) o[k]=it.p[k]===undefined?null:it.p[k]; }
      if(it.data){ clipsTotal++; const fp=fingerprint(it.data); let cid=null; for(const c of dedup.get(fp)||[]) if(sameData(P.clips[c],it.data)){ cid=c; break; }
        if(!cid){ cid='c'+(++ci); P.clips[cid]=it.data; if(!dedup.has(fp)) dedup.set(fp,[]); dedup.get(fp).push(cid); } o.cid=cid; }
      if(Object.keys(o).length) nt.o=o; if(it.call&&meta.noteCall) meta.noteCall.set(nt,it.call); return nt; }).sort((a,b)=>a.b-b.b);
    let name=guessName(g); seen[name]=(seen[name]||0)+1; if(seen[name]>1) name+=' '+seen[name];
    trs.push({id:uid(),name,inst:g.inst,params:base,vol:1,pan:0,mute:false,solo:false,ducked:g.buf==='mu',sc:g.inst==='kick',notes});
  }
  const rank=['kick','snare','clap','snap','hat','crash']; const ord=t=>{const i=rank.indexOf(t.inst);return i<0?100:i;};
  P.tracks=trs.map((t,i)=>({t,i})).sort((a,b)=>ord(a.t)-ord(b.t)||a.i-b.i).map(x=>x.t);
  if(meta.duckAt){ const R=800,N=Math.ceil((meta.seconds||0)*R)+2,T=new Float32Array(N); for(let i=0;i<N;i++) T[i]=clamp(meta.duckAt(i/R),0,1.5);
    P.sc.table=T; P.sc.rate=R; P.sc.mode='table'; let mn=1; for(const v of T) if(v<mn) mn=v; P.sc.depth=r6(clamp(1-mn,.05,.95)); P.sc.rel=.09; }
  return {project:P,stats:{tracks:P.tracks.length,notes:nItems,clips:ci,clipsTotal}};
}
// ───────────────────────── funciones auxiliares de una demo → plugins automáticos ─────────────────────────
// Una demo escrita a mano suele definir funciones (clack, tom, sub…) que llaman a add() una y otra vez. Al convertirla, en vez de hornear
// cada llamada como audio, se copia el código de la función a un plugin cuyos parámetros son los argumentos de la llamada. Antes de aceptarlo
// se compara con el audio horneado de varias llamadas reales; si no coincide, esa función se queda como clips (nunca un sonido roto).
function scanCode(src,onChar){   // recorre el código saltando cadenas, comentarios y expresiones regulares; onChar(ch,i) devuelve true para parar
  let prev='';
  for(let i=0;i<src.length;i++){ const c=src[i], d=src[i+1];
    if(c==='/'&&d==='/'){ while(i<src.length&&src[i]!=='\n') i++; continue; }
    if(c==='/'&&d==='*'){ i=src.indexOf('*/',i+2); if(i<0) return -1; i++; continue; }
    if(c==='"'||c==="'"||c==='`'){ for(i++;i<src.length&&src[i]!==c;i++) if(src[i]==='\\') i++; prev='a'; continue; }
    if(c==='/'&&(prev===''||'(,=:[!&|?{};+-*%<>~^'.includes(prev))){ let cls=false; for(i++;i<src.length;i++){ if(src[i]==='\\') i++; else if(src[i]==='[') cls=true; else if(src[i]===']') cls=false; else if(src[i]==='/'&&!cls) break; } prev='a'; continue; }
    if(onChar(c,i)) return i; if(!/\s/.test(c)) prev=c; }
  return -1;
}
function matchClose(src,i0,open,close){ let depth=0; const e=scanCode(src.slice(i0),(c)=>{ if(c===open) depth++; else if(c===close){ depth--; if(depth===0) return true; } return false; }); return e<0?-1:i0+e; }
function stripLiterals(src){ const out=src.split(''); let i=0; const n=src.length;   // mismo largo: cadenas y comentarios quedan en blanco
  while(i<n){ const c=src[i], d=src[i+1];
    if(c==='/'&&d==='/'){ while(i<n&&src[i]!=='\n'){ out[i]=' '; i++; } continue; }
    if(c==='/'&&d==='*'){ const e=src.indexOf('*/',i+2), end=e<0?n:e+2; for(;i<end;i++) if(src[i]!=='\n') out[i]=' '; continue; }
    if(c==='"'||c==="'"||c==='`'){ const s=i; for(i++;i<n&&src[i]!==c;i++) if(src[i]==='\\') i++; for(let j=s+1;j<i&&j<n;j++) if(src[j]!=='\n') out[j]=' '; i++; continue; }
    i++; }
  return out.join('');
}
function extractFunction(work,name){        // → {text, params:[…]} de «function name(…){…}» o null
  const re=new RegExp('(^|[\\n;{}])[ \\t]*function\\s+'+name.replace(/\$/g,'\\$')+'\\s*\\(','g'); const m=re.exec(work); if(!m) return null;
  const ps=m.index+m[0].length-1, pe=matchClose(work,ps,'(',')'); if(pe<0) return null;
  const bs=work.indexOf('{',pe); if(bs<0||work.slice(pe+1,bs).trim()) return null; const be=matchClose(work,bs,'{','}'); if(be<0) return null;
  const fs=work.indexOf('function',m.index+m[1].length);
  return {text:work.slice(fs,be+1),params:work.slice(ps+1,pe).split(',').map(s=>s.split('=')[0].trim()).filter(Boolean),hasDefaults:/=/.test(work.slice(ps+1,pe))};
}
function sceneDecls(work,names,skip){   // declaraciones «const x=…;» de una sola línea del cuerpo de la demo que la función usa (p. ej. sat)
  const depth=new Int16Array(work.length+1); let cur=0; scanCode(work,(c,i)=>{ if(c==='}') cur--; depth[i]=cur; if(c==='{') cur++; return false; });   // profundidad de llaves: solo cuentan las declaraciones del nivel de la demo (0 o 1), no las locales de otras funciones
  const have=new Map(), re=/^[ \t]*(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(.+?);[ \t]*(?:\/\/.*)?$/gm; let m; while((m=re.exec(work))){ const at=m.index+m[0].search(/\S/); if(depth[at]<=1&&!have.has(m[1])) have.set(m[1],m[0].trim()); }
  const out=[], done=new Set(); let want=[...names];
  for(let r=0;r<3&&want.length;r++){ const next=[]; for(const nm of want){ if(done.has(nm)||skip.has(nm)||!have.has(nm)) continue; done.add(nm); out.push(have.get(nm)); for(const id of stripLiterals(have.get(nm)).match(/(?<![\w$.])[A-Za-z_$][\w$]*/g)||[]) next.push(id); } want=next; }
  return out;
}
const AUTO_AMP=new Set(['a','amp','vol','g','gain','amp0']), AUTO_PITCH=new Set(['m','note','midi','pitch']), AUTO_LEN=new Set(['len','dur','l','L','length','d']);
function planAuto(name,evs,sig,work,title,kitKeys){      // → {spec,items} | {reason}
  const calls=new Map(); for(const e of evs){ if(!e.args) return {reason:'no pude capturar sus argumentos'}; let c=calls.get(e.args); if(!c){ c={args:e.args,evs:[]}; calls.set(e.args,c); } c.evs.push(e); }
  if(!sig||!sig.length) return {reason:'no pude leer su firma'}; if(sig.some(s=>s.startsWith('...'))) return {reason:'usa argumentos «...resto»'};
  const fx=extractFunction(work,name); if(!fx) return {reason:'no encontré su código'}; if(fx.hasDefaults) return {reason:'usa valores por defecto en los argumentos'};
  const L=[...calls.values()]; const bufs=new Set(evs.map(e=>e.buf)); if(bufs.size!==1) return {reason:'escribe en dos buffers'}; const buf=[...bufs][0];
  if(sig.length<1) return {reason:'sin argumentos'};
  const roles=[], vals=sig.map((_,i)=>L.map(c=>c.args[i]));
  for(let i=0;i<sig.length;i++){ const v=vals[i], pn=sig[i], allNum=v.every(x=>typeof x==='number'&&isFinite(x));
    if(i===0){ if(!allNum||!L.every(c=>Math.abs(c.args[0]-c.evs[0].t0)<1e-9)) return {reason:'su primer argumento no es el tiempo'}; roles.push({r:'t'}); continue; }
    if(allNum&&AUTO_AMP.has(pn)&&!roles.some(x=>x.r==='a')){ roles.push({r:'a'}); continue; }
    if(allNum&&AUTO_PITCH.has(pn)&&!roles.some(x=>x.r==='m')&&v.every(x=>x>=0&&x<=127)){ roles.push({r:'m'}); continue; }
    if(allNum&&AUTO_LEN.has(pn)&&!roles.some(x=>x.r==='len')&&v.every(x=>x>0)){ roles.push({r:'len'}); continue; }
    if(allNum) roles.push({r:'p',type:'num'}); else if(v.every(x=>typeof x==='boolean'||x===undefined)&&v.some(x=>x!==undefined)) roles.push({r:'p',type:'bool'}); else if(v.every(x=>x===undefined)) roles.push({r:'u'}); else return {reason:'el argumento «'+pn+'» no es un número'}; }
  const hasA=roles.some(x=>x.r==='a'), hasM=roles.some(x=>x.r==='m'), hasLen=roles.some(x=>x.r==='len');
  // parámetros del plugin
  const params=[{k:'gain',label:'Ganancia',min:0,max:1.5,step:.005,def:1}], pdefs=[];
  const nice=x=>{ const e=Math.pow(10,Math.floor(Math.log10(Math.max(1e-9,x)))-2); return +(Math.round(x/e)*e).toPrecision(2); };
  sig.forEach((pn,i)=>{ const ro=roles[i]; if(ro.r!=='p') return; const v=vals[i];
    if(ro.type==='bool'){ params.push({k:pn,label:pn,min:0,max:1,step:1,def:v.filter(Boolean).length*2>v.length?1:0}); }
    else { const lo=Math.min(...v), hi=Math.max(...v), span=hi-lo, pad=Math.max(span,Math.abs(hi),1e-3)*.5, mn=lo>=0?0:lo-pad, mx=hi+pad, cnt=new Map(); let best=v[0],bn=0; for(const x of v){ const c=(cnt.get(x)||0)+1; cnt.set(x,c); if(c>bn){bn=c;best=x;} }
      const allInt=v.every(Number.isInteger); params.push({k:pn,label:pn,min:+mn.toPrecision(3),max:+mx.toPrecision(3),step:allInt&&mx-mn>=20?1:nice(mx-mn),def:best}); } });
  const callArgs=sig.map((pn,i)=>{ const ro=roles[i]; return ro.r==='t'?'N.t':ro.r==='a'?'N.a*p.gain':ro.r==='m'?'N.midi':ro.r==='len'?'N.len':ro.r==='u'?'undefined':(ro.type==='bool'?'!!p.'+pn:'p.'+pn); }).join(', ');
  const localNames=new Set([...sig,'N','p','sr','mu','dr','beat','bar','BPM','add','K',...kitKeys]);
  const body=stripLiterals(fx.text), ids=new Set(body.match(/(?<![\w$.])[A-Za-z_$][\w$]*/g)||[]);
  const extra=sceneDecls(work,[...ids],new Set([...localNames,name]));
  const det=!/\brnd\s*\(|Math\.random/.test(stripLiterals(fx.text+extra.join('\n')));
  const id='auto-'+slug(title)+'-'+slug(name), dn=name+' · '+title;
  const kk=kitKeys.filter(k=>k!=='mu'&&k!=='dr'&&k!=='add'&&/^[A-Za-z_$][\w$]*$/.test(k));
  const code=`// Plugin generado automáticamente desde la función «${name}» de la demo «${title}».\n// Los argumentos de la función son los parámetros: ${sig.join(', ')}.\nregisterInstrument({\n  id:${JSON.stringify(id)}, name:${JSON.stringify(dn)}, kind:${hasM?"'melodic'":"'perc'"},${!hasM&&!hasLen?' oneShot:true,':''} buf:${JSON.stringify(buf)},\n  desc:${JSON.stringify('Generado desde la función '+name+'('+sig.join(', ')+') de «'+title+'».')},\n  params:${JSON.stringify(params)},\n  play(K,N){\n    const p=N.p, sr=N.sr, mu=N.buf, dr=N.buf, beat=N.beat, bar=N.bar, BPM=N.bpm;\n    const {${kk.join(',')}}=K;\n    ${hasA?'const add=K.add;':'const add=(b,t,l,f,amp,pan)=>K.add(b,t,l,f,(amp==null?1:amp)*N.a*p.gain,pan);'}\n${extra.map(s=>'    '+s).join('\n')}\n    ${fx.text.replace(/\n/g,'\n    ')}\n    ${name}(${callArgs});\n  }\n});\n`;
  const items=L.map(c=>{ const p={}; sig.forEach((pn,i)=>{ const ro=roles[i]; if(ro.r==='p') p[pn]=ro.type==='bool'?(c.args[i]?1:0):c.args[i]; });
    const g=(r)=>{ const i=roles.findIndex(x=>x.r===r); return i<0?null:c.args[i]; };
    return {inst:id,buf,t0:c.args[0],len:g('len'),m:g('m')==null?0:g('m'),a:hasA?g('a'):1,pan:0,p,call:c,gname:dn}; });
  return {spec:{id,name:dn,code,det,helper:name,buf,calls:L.length},items};
}
function uninstallPlugin(id){ removePlugin(id); delete INSTRUMENTS[id]; const i=INST_ORDER.indexOf(id); if(i>=0) INST_ORDER.splice(i,1); }
// compara el plugin con el audio horneado de las primeras llamadas reales → {ok, detail}
function verifyAuto(P,tr,spec,noteCall){
  const inst=INSTRUMENTS[spec.id], beat=60/P.bpm, picks=tr.notes.slice(0,4); let pass=0, worst=0; const detail=[];
  for(const nt of picks){ const c=noteCall.get(nt); if(!c) continue; let end=0; for(const e of c.evs) end=Math.max(end,e.t0+e.len);
    const dur=Math.min(60,end+.5), K1=Kit.make(SR,dur,7), K2=Kit.make(SR,dur,7); K1.sr=SR; K2.sr=SR;
    try{ inst.play(K1,noteArgs(K1,P,tr,nt,beat)); }catch(e){ return {ok:false,detail:'error al sonar: '+e.message}; }
    for(const e of c.evs){ const d=e.data, sr=SR; K2.add(e.buf==='mu'?K2.mu:K2.dr,e.t0,e.len,t=>d[Math.round(t*sr)]||0,e.amp,e.pan); }
    const A=(tr.ducked?K1.mu:K1.dr), B=(tr.ducked?K2.mu:K2.dr); let ok;
    if(spec.det){ let num=0,den=0; for(let ch=0;ch<2;ch++){ const a=A[ch],b=B[ch]; for(let i=0;i<a.length;i++){ const x=a[i]-b[i]; num+=x*x; den+=b[i]*b[i]; } } const rel=den>0?Math.sqrt(num/den):(num>0?1:0); worst=Math.max(worst,rel); ok=rel<.02; detail.push(rel.toExponential(1)); }
    else { const W=Math.max(1,Math.round(SR*.01)), ea=[],eb=[]; let sa=0,sb=0; const n=Math.min(A[0].length,B[0].length);
      for(let i=0;i<n;i+=W){ let x=0,y=0; for(let ch=0;ch<2;ch++) for(let j=i;j<Math.min(n,i+W);j++){ x+=A[ch][j]*A[ch][j]; y+=B[ch][j]*B[ch][j]; } ea.push(Math.sqrt(x)); eb.push(Math.sqrt(y)); sa+=x; sb+=y; }
      const ratio=sb>0?sa/sb:(sa>0?99:1); const ma=ea.reduce((s,v)=>s+v,0)/ea.length, mb=eb.reduce((s,v)=>s+v,0)/eb.length; let cov=0,va=0,vb=0; for(let i=0;i<ea.length;i++){ cov+=(ea[i]-ma)*(eb[i]-mb); va+=(ea[i]-ma)**2; vb+=(eb[i]-mb)**2; }
      const corr=va>0&&vb>0?cov/Math.sqrt(va*vb):(va===vb?1:0); ok=ratio>.5&&ratio<2&&corr>.85; detail.push('E×'+ratio.toFixed(2)+' r='+corr.toFixed(2)); }
    if(ok) pass++; }
  const n=Math.max(1,picks.length); return {ok:picks.length>0&&pass>=Math.ceil(n*.75),detail:detail.join(' ')+' · '+pass+'/'+picks.length};
}
async function recordDemo(src,opts){
  opts=opts||{};
  const m=/async\s+function\s+(render\w*)\s*\(/.exec(src); if(!m) throw new Error('No encontré una función async render…(sr, onProg) en el archivo.');
  const fnName=m[1], events=[]; let duckAt=null, seconds=0, seed=null;
  const bm=/\bBPM\s*=\s*([\d.]+)/.exec(src)||/([\d.]+)\s*BPM/i.exec(src); let bpm=bm?+bm[1]:(opts.bpm||120);
  const bake=(fn,len)=>{ const N=Math.max(0,Math.floor(len*SR)),d=new Float32Array(N); for(let i=0;i<N;i++) d[i]=fn(i/SR); return d; };
  let mBpm=null,mBars=null; const unknown={}, lastCall={}, sigs={};   // lastCall[nombre] = argumentos de la última llamada a esa función de la demo
  const recKit=(sr,secs,seed0)=>{
    seconds=secs; seed=seed0; const real=Kit.make(sr,.05,seed0), K=Object.assign({},real), rec=(fn,o)=>{ const ev=Object.assign({fn},o); if(fn==='add'&&ev.caller!=='inline') ev.args=lastCall[ev.caller]||null; events.push(ev); };
    K.n=Math.ceil(secs*sr);
    if(typeof demoKit==='function'){ const std=new Set(Object.keys(demoKit(44100,.01,1))); for(const k of Object.keys(real)) if(!std.has(k)&&typeof real[k]==='function'){ const f0=real[k]; K[k]=function(){ unknown[k]=(unknown[k]||0)+1; return f0.apply(this,arguments); }; } }   // funciones de un kit propio que el conversor no conoce
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
    K.add=(buf,t0,len,fn,amp,pan)=>rec('add',{buf:buf===real.mu?'mu':'dr',t0,len,amp,pan:pan||0,data:bake(fn,len),caller:callerName(fnName),args:null});
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
  const __enter=(name,args)=>{ if(!HELPERS[name]){ lastCall[name]=args; return false; } events.push({fn:'helper',name,args:args.map(x=>x&&typeof x==='object'?Object.assign({},x):x)}); return true; };
  const sm=stripMakeKit(src), work=sm.src, usedMakeKit=sm.used;
  const patched=work.replace(/(^|\n)([ \t]*)function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/g,(mm,pre,ws,name,args)=>{
    if(/[{\[.]/.test(args)) return mm; const list=args.split(',').map(s=>s.split('=')[0].trim()).filter(Boolean); sigs[name]=list;
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
  // funciones auxiliares → plugins automáticos (con verificación y plan B: los clips horneados de siempre)
  const kitKeys=Object.keys(Kit.make(SR,.05,1)), H0=new Map(), shortTitle=(String(title).replace(/^[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/,'').split(/\s+[─—–·|]|\s+\d+\s*BPM|\s*\(/)[0].trim()||'demo').slice(0,40); for(const ev of events){ if(ev.fn!=='add'||!ev.caller||ev.caller==='inline') continue; if(!H0.has(ev.caller)) H0.set(ev.caller,[]); H0.get(ev.caller).push(ev); }
  const failed=new Map(), few=new Set(); let res, okPlans=[];
  for(let guard=0;guard<30;guard++){
    const plans=[], planned=new Set();
    if(opts.auto!==false) for(const [name,evs] of H0){ if(failed.has(name)||few.has(name)||(opts.autoSkip&&opts.autoSkip.includes(name))) continue;
      if(new Set(evs.map(x=>x.args)).size<2){ few.add(name); continue; }
      let pl; try{ pl=planAuto(name,evs,sigs[name],work,shortTitle,kitKeys); }catch(err){ pl={reason:'error al analizarla: '+err.message}; }
      if(pl.reason){ failed.set(name,pl.reason); continue; }
      try{ installPlugin(pl.spec.code); }catch(err){ failed.set(name,'el plugin generado no compila: '+err.message); continue; }
      plans.push(pl); planned.add(name); }
    const ev2=events.filter(x=>!(x.fn==='add'&&planned.has(x.caller))); for(const pl of plans) for(const it of pl.items) ev2.push({fn:'auto',item:it});
    const noteCall=new WeakMap(); res=buildProject(ev2,{bpm,bars,seed,seconds,duckAt,title,noteCall}); let bad=0;
    for(const pl of plans){ const tr=res.project.tracks.find(t=>t.inst===pl.spec.id); let v; try{ v=tr?verifyAuto(res.project,tr,pl.spec,noteCall):{ok:false,detail:'sin pista'}; }catch(err){ v={ok:false,detail:err.message}; }
      pl.v=v; if(!v.ok){ failed.set(pl.spec.helper,'no coincide con el audio original ('+v.detail+')'); uninstallPlugin(pl.spec.id); bad++; } }
    if(!bad){ okPlans=plans; break; } }
  res.stats.auto=okPlans.map(pl=>({name:pl.spec.helper,id:pl.spec.id,calls:pl.spec.calls,exact:pl.spec.det,check:pl.v.detail}));
  res.stats.autoFailed=[...failed].map(([name,reason])=>({name,reason}));
  { const done=new Set(okPlans.map(pl=>pl.spec.helper)), H=new Map(); for(const ev of events){ if(ev.fn!=='add'||!ev.caller||ev.caller==='inline'||done.has(ev.caller)) continue; let h=H.get(ev.caller); if(!h){ h={name:ev.caller,clips:0,calls:new Set(),params:sigs[ev.caller]||[]}; H.set(ev.caller,h); } h.clips++; if(ev.args) h.calls.add(ev.args); }
    res.stats.helpers=[...H.values()].map(h=>({name:h.name,clips:h.clips,calls:h.calls.size||h.clips,params:h.params})).sort((a,b)=>b.clips-a.clips); }
  const ws=[]; if(res.stats.notes<8) ws.push('Casi no se registraron notas ('+res.stats.notes+'): esta demo probablemente usa un kit propio que el conversor no reconoce.');
  if(res.stats.clips>150) ws.push('Muchos clips ('+res.stats.clips+'): hay funciones propias que se hornean como audio y el proyecto pesará mucho.');
  const un=Object.keys(unknown); if(un.length) ws.push('La demo usa funciones de un kit propio que el conversor no conoce ('+un.map(k=>k+' ×'+unknown[k]).join(', ')+'): su sonido no entra en el proyecto.');
  res.warnings=ws; res.makeKit=usedMakeKit; return res;
}
//#CONVERTER-END
//#ENGINE-END
