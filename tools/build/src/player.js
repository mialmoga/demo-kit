// ═══════════════════════════════════════════════════════════════════════
//  DEMO KIT · librería para usar en otros proyectos (sin interfaz)
//  Carga y renderiza canciones .demokit.json (proyectos del estudio) o demos .js «a mano»,
//  y las reproduce con Web Audio. Todo se sintetiza en el momento: no hay muestras.
// ═══════════════════════════════════════════════════════════════════════
persistPlugins=function(){};            // en la librería no se escribe en localStorage
const LIB_VERSION='1.4.0';
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
