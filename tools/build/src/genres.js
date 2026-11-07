// ───────────────────────── géneros: plantillas para «Nuevo desde género» ─────────────────────────
// Un género NO compone: solo pone el andamio (tempo, compás, escala, secciones) y marca con ● lo que le va bien (instrumentos y escalas).
// Formato de un género (también en archivos genres/*.json:  {"format":"demokit-genres","genres":[ … ]}  o un género suelto):
//   { id, name, desc,
//     bpm:[mínimo, máximo, típico],          sig:[pulsos, figura],
//     keys:['Menor natural','Dórica',…],      // escalas afines (nombres de las del teclado)
//     inst:{ perc:[ids], mel:[ids], acomp:[ids], fx:[ids] },   // instrumentos afines, por categoría
//     structures:[ { name, sections:[['Intro',8],['Verso',16],…] } ] }   // [nombre, compases]
const GENRES=new Map();
function normGenre(o){
  if(!o||typeof o!=='object') throw new Error('el género no es un objeto');
  const name=String(o.name||'').trim().slice(0,40); if(!name) throw new Error('falta el nombre del género');
  const id=slug(o.id||name), num=(v,d)=>Number.isFinite(+v)&&v!==null&&v!==''?+v:d;
  let b=Array.isArray(o.bpm)?o.bpm.map(x=>num(x,NaN)).filter(Number.isFinite):[]; if(b.length===2) b.push(Math.round((b[0]+b[1])/2)); if(b.length<3) b=[80,160,120];
  b=b.slice(0,3).map(x=>Math.max(40,Math.min(260,Math.round(x)))); const lo=Math.min(b[0],b[1]), hi=Math.max(b[0],b[1]); b=[lo,hi,Math.max(lo,Math.min(hi,b[2]))];
  const sig=Array.isArray(o.sig)&&o.sig[0]>0&&o.sig[1]>0?[+o.sig[0],+o.sig[1]]:[4,4];
  const inst={}; for(const c of CAT_ORDER) inst[c]=Array.isArray(o.inst&&o.inst[c])?o.inst[c].map(String):[];
  const structures=[]; for(const st of Array.isArray(o.structures)?o.structures:[]){
    const secs=[]; let tot=0; for(const x of Array.isArray(st.sections)?st.sections:[]){ const nm=String(Array.isArray(x)?x[0]:x&&x.name||'').trim().slice(0,40), n=Math.round(num(Array.isArray(x)?x[1]:x&&x.bars,0)); if(!nm||n<1||tot+n>256) continue; secs.push([nm,n]); tot+=n; }
    if(secs.length) structures.push({name:String(st.name||'Estructura').trim().slice(0,40),sections:secs}); }
  if(!structures.length) throw new Error('«'+name+'» no tiene ninguna estructura válida (secciones con nombre y compases; en total hasta 256 compases)');
  return {id,name,desc:String(o.desc||'').slice(0,300),bpm:b,sig,keys:Array.isArray(o.keys)?o.keys.map(String):[],inst,structures};
}
function registerGenre(o){ const g=normGenre(o); GENRES.set(g.id,g); return g; }
const genreOf=P=>(P&&P.genre&&GENRES.get(P.genre))||null;
const genreInst=g=>new Set(CAT_ORDER.flatMap(c=>g.inst[c]));
const structBars=st=>st.sections.reduce((a,s)=>a+s[1],0);
const structSecs=(st,bpm,sig)=>structBars(st)*sig[0]*4/sig[1]*60/bpm;       // duración en segundos (el pulso es la negra)
const fmtDur=s=>{ const t=Math.round(s); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); };

// géneros incluidos (los de tu carpeta genres/ y los que sueltes en el estudio se suman a estos o los reemplazan si usan el mismo id)
const GENRE_BUILTIN=[
 {id:'lofi',name:'Lo-fi',desc:'Beats polvorientos y cálidos: ritmo suelto, bajo suave, acordes con séptimas y mucho aire.',
  bpm:[70,90,82],sig:[4,4],keys:['Menor natural','Dórica','Pentatónica menor'],
  inst:{perc:['kick','snare','hat','snap','rim'],mel:['bell','pluck','chop'],acomp:['pad','sub'],fx:['wash']},
  structures:[
   {name:'Corta',sections:[['Intro',4],['Sección A',8],['Sección B',8],['Sección A',8],['Outro',4]]},
   {name:'Estándar',sections:[['Intro',8],['Sección A',16],['Sección B',16],['Sección A',16],['Outro',8]]}]},
 {id:'poprock',name:'Pop-rock',desc:'Verso–coro de toda la vida: batería, bajo, acompañamiento y una melodía que se quede.',
  bpm:[100,140,120],sig:[4,4],keys:['Mayor','Pentatónica mayor','Menor natural','Mixolidia'],
  inst:{perc:['kick','snare','hat','crash','clap'],mel:['sinte','pluck'],acomp:['sub','pad','arp'],fx:['riser','impact']},
  structures:[
   {name:'Corta',sections:[['Intro',4],['Verso',8],['Coro',8],['Verso',8],['Coro',8],['Puente',4],['Coro',8],['Outro',4]]},
   {name:'Clásica',sections:[['Intro',8],['Verso',16],['Pre-coro',8],['Coro',16],['Verso',16],['Pre-coro',8],['Coro',16],['Puente',8],['Coro',16],['Outro',8]]}]},
 {id:'dubstep',name:'Dubstep',desc:'Tensión y drop: intro oscura, subida, bajo pesado y un respiro antes del segundo golpe.',
  bpm:[138,150,140],sig:[4,4],keys:['Menor natural','Frigia','Menor armónica','Pentatónica menor'],
  inst:{perc:['kick','snare','hat','clap','crash'],mel:['sinte','chop'],acomp:['reese','reesemk','growl','sub','subfall','pad'],fx:['riser','sweep','impact','wash']},
  structures:[
   {name:'Corta',sections:[['Intro',8],['Build-up',8],['Drop',16],['Break',8],['Drop',16],['Outro',8]]},
   {name:'Estándar',sections:[['Intro',16],['Build-up',16],['Drop',20],['Break',16],['Drop',20],['Outro',12]]}]},
 {id:'synthwave',name:'Synthwave',desc:'Neón y carretera de noche: sintes anchos, bajo en corcheas, caja con eco y arpegios.',
  bpm:[80,118,100],sig:[4,4],keys:['Menor natural','Dórica','Pentatónica menor'],
  inst:{perc:['kick','snare','clap','hat'],mel:['sinte','pluck'],acomp:['supersaw','pad','arp','sub'],fx:['riser','sweep','impact']},
  structures:[
   {name:'Corta',sections:[['Intro',8],['Verso',16],['Estribillo',16],['Puente',8],['Estribillo',16],['Outro',8]]},
   {name:'Completa',sections:[['Intro',8],['Verso',16],['Estribillo',16],['Verso',16],['Estribillo',16],['Puente',8],['Estribillo',16],['Outro',8]]}]}];
