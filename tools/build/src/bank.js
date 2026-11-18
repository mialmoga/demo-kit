
// ═══════════════════════════════════════════════════════════════════════
//  BANCO DE SONIDOS · cada sección del proyecto = un «cue» (hover, click, release, error…)
//  Se exporta como ui_dk.js (sonidos dentro) o como carpeta (.js + audios). Este archivo tiene tres partes:
//   1) makeDKUI: el runtime que viaja dentro del .js exportado (se incrusta con makeDKUI.toString(): no puede usar nada de fuera)
//   2) bankBuild: renderiza cada cue (variantes, bucles, gates), los nivela y arma el manifiesto y los audios
//   3) el cuadro «🔊 Banco» del estudio: lista de cues, plantillas, prueba en vivo y exportación
// ═══════════════════════════════════════════════════════════════════════

// ───────────── 1) runtime (lo que corre en la interfaz / el juego) ─────────────
function makeDKUI(M,EMBED,SRC){
  const AC=typeof AudioContext!=='undefined'?AudioContext:(typeof webkitAudioContext!=='undefined'?webkitAudioContext:null);
  const R=()=>Math.random()*2-1, DKEV=['hover','leave','down','up','click','focus'];
  function load(opts){
    const O=Object.assign({base:null,context:null,destination:null,volume:1,theme:null,autounlock:true},opts||{});
    let ctx=O.context||null, out=null, vol=O.volume, muted=false, ok=false, error=null, theme=O.theme&&M.themes[O.theme]?O.theme:(M.theme||Object.keys(M.themes)[0]);
    const live=new Set(), mem={}, T=()=>M.themes[theme]||M.themes[Object.keys(M.themes)[0]];
    const getCtx=()=>{ if(!ctx){ if(!AC) throw new Error('Este navegador no tiene Web Audio'); ctx=new AC({latencyHint:'interactive'}); }
      if(!out){ out=ctx.createGain(); out.gain.value=muted?0:vol; out.connect(O.destination||ctx.destination); } return ctx; };
    const unlock=()=>{ try{ const c=getCtx(); return c.state==='suspended'?c.resume():Promise.resolve(); }catch(e){ return Promise.resolve(); } };
    const dec=ab=>new Promise((res,rej)=>{ const p=getCtx().decodeAudioData(ab,res,rej); if(p&&p.catch) p.catch(rej); });
    const ready=(async()=>{
      getCtx();
      if(EMBED){ const bin=atob(EMBED), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
        const buf=await dec(u.buffer); for(const t in M.themes) for(const id in M.themes[t].cues) for(const v of M.themes[t].cues[id].v){ v.b=buf; v.s=v.o||0; } }
      else { const base=O.base!=null?O.base:((SRC||'').replace(/[^\/]*$/,'')+(M.dir||'audio')+'/'), seen={};
        const get=f=>seen[f]||(seen[f]=fetch(base+f).then(r=>{ if(!r.ok) throw new Error('No pude cargar '+base+f+' ('+r.status+')'); return r.arrayBuffer(); }).then(dec));
        const jobs=[]; for(const t in M.themes) for(const id in M.themes[t].cues) for(const v of M.themes[t].cues[id].v) jobs.push(get(v.f).then(b=>{ v.b=b; v.s=0; }));
        await Promise.all(jobs); }
      ok=true; })();
    ready.catch(e=>{ error=e; console.error('[DKUI]',e); });
    if(O.autounlock&&typeof window!=='undefined'){ const f=()=>{ unlock(); for(const t of ['pointerdown','keydown','touchend']) window.removeEventListener(t,f,true); }; for(const t of ['pointerdown','keydown','touchend']) window.addEventListener(t,f,true); }
    const cue=n=>{ const c=T().cues[n]; return ok&&c?c:null; };
    const NUL={stop(){},up(){},ended:Promise.resolve(),playing:false};
    const pick=c=>{ const n=c.v.length; if(n===1) return c.v[0]; let i; do{ i=(Math.random()*n)|0; }while(i===c._last); c._last=i; return c.v[i]; };
    let trs=0;
    function params(c,o){ let semis=o.pitch||0; if(o.degree!=null&&M.key&&M.key.ivs.length){ const iv=M.key.ivs, n=iv.length, i=Math.round(o.degree)-1+(o.oct||0)*n; semis+=12*Math.floor(i/n)+iv[((i%n)+n)%n]-(c.tn||0)+trs; }
      const cents=semis*100+(c.jp?R()*c.jp:0), db=(c.jv?R()*c.jv:0)+(o.gain||0);
      return {rate:Math.pow(2,cents/1200)*(o.rate||1),gain:(o.volume==null?1:o.volume)*Math.pow(10,db/20),pan:o.pan||0,when:getCtx().currentTime+(o.delay||0)}; }
    function node(v,p){ const c=getCtx(), s=c.createBufferSource(), g=c.createGain(); s.buffer=v.b; s.playbackRate.value=p.rate; g.gain.value=p.gain; s.connect(g);
      if(p.pan&&c.createStereoPanner){ const pn=c.createStereoPanner(); pn.pan.value=Math.max(-1,Math.min(1,p.pan)); g.connect(pn); pn.connect(out); } else g.connect(out); return {s,g}; }
    function gate(c,o){ // exclusividad por grupo y enfriamiento; devuelve false si el cue no debe sonar ahora
      if(o._c) return true; const now=getCtx().currentTime*1000; if(c.cd&&c._t!=null&&now-c._t<c.cd) return false; c._t=now;
      if(c.g) for(const e of [...live]) if(e.g===c.g) e.stop(.03); return true; }
    function reg(c,h){ h.g=c.g||''; live.add(h); h.ended.then(()=>live.delete(h)); return h; }
    function stopNode(n,f){ const t=getCtx().currentTime; f=Math.max(.01,f==null?.05:f); try{ n.g.gain.cancelScheduledValues(t); n.g.gain.setValueAtTime(n.g.gain.value,t); n.g.gain.linearRampToValueAtTime(0,t+f); n.s.stop(t+f+.01); }catch(e){} }
    function endP(nodes){ return Promise.all(nodes.map(n=>new Promise(r=>{ n.s.onended=r; }))); }
    function play(name,o){ o=o||{}; if(Array.isArray(o.degree)){ const hs=o.degree.map((d,i)=>play(name,Object.assign({},o,{degree:d,delay:(o.delay||0)+i*(o.spread||0),_c:i>0}))); return {name,playing:true,stop:f=>hs.forEach(h=>h.stop(f)),up(){ hs.forEach(h=>h.up()); },ended:Promise.all(hs.map(h=>h.ended))}; }
      const c=cue(name); if(!c) return NUL; if(c.t==='gate'&&o.hold==null) o=Object.assign({hold:Math.max(.04,c.a||0)},o);
      if(c.t==='gate') return down(name,o); if(!gate(c,o)) return NUL; const v=pick(c), p=params(c,o), n=node(v,p);
      if(c.t==='loop'){ n.s.loop=true; n.s.loopStart=v.s; n.s.loopEnd=v.s+v.l; if(o.fade>0){ n.g.gain.setValueAtTime(0,p.when); n.g.gain.linearRampToValueAtTime(p.gain,p.when+o.fade); } n.s.start(p.when,v.s); }
      else n.s.start(p.when,v.s,v.l);
      return reg(c,{name,playing:true,stop:f=>stopNode(n,f),up(){},ended:endP([n])}); }
    function loop(name,o){ o=o||{}; const c=cue(name); if(!c) return NUL; if(c.t!=='loop') return play(name,o); return play(name,o); }
    function down(name,o){ o=o||{}; const c=cue(name); if(!c) return NUL; if(c.t!=='gate') return play(name,o); if(!gate(c,o)) return NUL;
      const v=pick(c), p=params(c,o), a=Math.max(0,c.a||0), h=v.h, A=node(v,p), nodes=[A]; let released=false;
      if(h-a>.02){ A.s.loop=true; A.s.loopStart=v.s+a; A.s.loopEnd=v.s+h; A.s.start(p.when,v.s); } else A.s.start(p.when,v.s,h);
      let endR; const endP2=new Promise(r=>{ endR=r; }); A.s.onended=()=>setTimeout(endR,0);
      const hd=reg(c,{name,playing:true,stop:f=>{ released=true; nodes.forEach(n=>stopNode(n,f)); },ended:endP2,
        up(){ if(released) return; released=true; const cx=getCtx(), t=Math.max(cx.currentTime,p.when), pos=(t-p.when)*p.rate, when=t+(pos<a?(a-pos)/p.rate:0);
          try{ A.g.gain.setValueAtTime(p.gain,when); A.g.gain.linearRampToValueAtTime(0,when+.012); A.s.stop(when+.02); }catch(e){}
          const tl=v.l-h; if(tl>.005){ const B=node(v,Object.assign({},p,{gain:p.gain})); B.g.gain.setValueAtTime(0,when); B.g.gain.linearRampToValueAtTime(p.gain,when+.004); B.s.start(when,v.s+h,tl); nodes.push(B); } }});
      if(o.hold!=null) setTimeout(()=>hd.up(),Math.max(0,o.hold*1000)); return hd; }
    const optsOf=(el,x)=>{ const o=typeof x==='object'&&x?Object.assign({},x):{}; if(el&&el.getAttribute){ const p=el.getAttribute('data-snd-pitch'), g=el.getAttribute('data-snd-vol'); if(p!=null&&o.pitch==null) o.pitch=+p; if(g!=null&&o.volume==null) o.volume=+g; } return o; };
    const nameOf=x=>typeof x==='object'&&x?x.cue:x, off=el=>!el||el.disabled||(el.getAttribute&&el.getAttribute('aria-disabled')==='true');
    const press=(name,o)=>{ const c=cue(name); const h=c&&c.t==='gate'?down(name,o):play(name,o); if(h===NUL) return null; const rel=()=>{ h.up(); window.removeEventListener('pointerup',rel,true); window.removeEventListener('pointercancel',rel,true); };
      window.addEventListener('pointerup',rel,true); window.addEventListener('pointercancel',rel,true); return h; };
    function bind(el,map){ const offs=[], on=(t,f)=>{ el.addEventListener(t,f); offs.push(()=>el.removeEventListener(t,f)); }, mouse=e=>e.pointerType!=='touch';
      if(map.hover) on('pointerenter',e=>{ if(mouse(e)&&!off(el)) play(nameOf(map.hover),optsOf(el,map.hover)); });
      if(map.leave) on('pointerleave',e=>{ if(mouse(e)&&!off(el)) play(nameOf(map.leave),optsOf(el,map.leave)); });
      if(map.focus) on('focus',()=>{ if(!off(el)) play(nameOf(map.focus),optsOf(el,map.focus)); });
      if(map.down||map.up) on('pointerdown',()=>{ if(off(el)) return; if(map.down) press(nameOf(map.down),optsOf(el,map.down)); if(map.up){ const f=()=>{ play(nameOf(map.up),optsOf(el,map.up)); window.removeEventListener('pointerup',f,true); }; window.addEventListener('pointerup',f,true); } });
      if(map.click) on('click',()=>{ if(!off(el)) play(nameOf(map.click),optsOf(el,map.click)); });
      return ()=>offs.forEach(f=>f()); }
    function attach(root){ root=root||document; const A=k=>'data-snd-'+k, find=(e,k)=>{ let n=e.target&&e.target.closest?e.target.closest('['+A(k)+']'):null; return n; }, offs=[], on=(t,f)=>{ root.addEventListener(t,f,true); offs.push(()=>root.removeEventListener(t,f,true)); };
      on('pointerover',e=>{ if(e.pointerType==='touch') return; const n=find(e,'hover'); if(n&&!off(n)&&!(e.relatedTarget&&n.contains(e.relatedTarget))) play(n.getAttribute(A('hover')),optsOf(n)); });
      on('pointerout',e=>{ if(e.pointerType==='touch') return; const n=find(e,'leave'); if(n&&!off(n)&&!(e.relatedTarget&&n.contains(e.relatedTarget))) play(n.getAttribute(A('leave')),optsOf(n)); });
      on('focusin',e=>{ const n=find(e,'focus'); if(n&&!off(n)) play(n.getAttribute(A('focus')),optsOf(n)); });
      on('pointerdown',e=>{ const n=find(e,'down'); if(n&&!off(n)) press(n.getAttribute(A('down')),optsOf(n)); const u=find(e,'up'); if(u&&!off(u)){ const f=()=>{ play(u.getAttribute(A('up')),optsOf(u)); window.removeEventListener('pointerup',f,true); }; window.addEventListener('pointerup',f,true); } });
      on('click',e=>{ const n=find(e,'click'); if(n&&!off(n)) play(n.getAttribute(A('click')),optsOf(n)); });
      return ()=>offs.forEach(f=>f()); }
    const ui={name:M.name,ready,get error(){ return error; },get loaded(){ return ok; },get context(){ return ctx; },
      play,loop,down,bind,attach,unlock,has:n=>!!(T().cues[n]),
      cues:()=>Object.keys(T().cues).map(id=>({id,type:T().cues[id].t,variants:T().cues[id].v.length,pitched:!!T().cues[id].p})),
      key:()=>M.key||null, transpose(n){ if(n!==undefined) trs=+n||0; return trs; },
      volume(v){ if(v===undefined) return vol; vol=Math.max(0,v); if(out&&!muted) out.gain.setTargetAtTime(vol,getCtx().currentTime,.01); return vol; },
      mute(b){ muted=b===undefined?!muted:!!b; if(out) out.gain.setTargetAtTime(muted?0:vol,getCtx().currentTime,.01); return muted; },
      stopAll(f){ for(const h of [...live]) h.stop(f); },
      theme(id){ if(id===undefined) return theme; if(M.themes[id]){ theme=id; } return theme; }, themes:()=>Object.keys(M.themes)};
    return ui; }
  return {name:M.name,load,manifest:M};
}


// interfaz de mentira para probar el banco como lo sentiría un usuario (solo usa lo que el banco tiene; sin referencias externas: viaja en ejemplo.html)
function dkMock(ui,root){
  const has=n=>ui.has(n), E=(t,a,x)=>{ const e=document.createElement(t); for(const k in a||{}) e.setAttribute(k,a[k]); if(x!=null) e.textContent=x; return e; };
  if(!document.getElementById('dkm-css')){ const st=E('style',{id:'dkm-css'}); st.textContent='.dkm{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin:8px 0}.dkm section{border:1px solid rgba(128,128,160,.35);border-radius:10px;padding:8px 10px}.dkm h4{margin:0 0 6px;font:600 12px system-ui;opacity:.7}.dkm button,.dkm input,.dkm select{font:inherit;margin:2px}.dkm .it{padding:4px 6px;border-radius:6px;cursor:pointer}.dkm .it:hover{background:rgba(128,128,160,.25)}.dkm .on{outline:2px solid #8cf}'; document.head.append(st); }
  const box=E('div',{class:'dkm'}); root.append(box); const sec=(t)=>{ const s=E('section'); s.append(E('h4',0,t)); box.append(s); return s; };
  const btn=(p,label,at)=>{ const b=E('button',at,label); p.append(b); return b; };
  let s=sec('Botones'); if(has('click')) btn(s,'Botón',{'data-snd-hover':has('hover')?'hover':'','data-snd-click':'click'}); if(has('down')) btn(s,'Mantén presionado ⏺',{'data-snd-down':'down'}); if(has('up')&&has('down')===false) btn(s,'Soltar',{'data-snd-up':'up'});
  if(has('toggle_on')||has('toggle_off')){ s=sec('Interruptor'); const c=E('input',{type:'checkbox'}); c.addEventListener('change',()=>ui.play(c.checked?'toggle_on':'toggle_off')); const l=E('label'); l.append(c,' activar'); s.append(l); }
  if(has('tick')){ s=sec('Slider (el tono sigue al valor)'); const r=E('input',{type:'range',min:0,max:100,value:50}); let t=0; r.addEventListener('input',()=>{ const n=Date.now(); if(n-t>55){ t=n; ui.play('tick',{pitch:(r.value-50)*.12}); } }); s.append(r); }
  if(has('type')){ s=sec('Campo de texto'); const i=E('input',{type:'text',placeholder:'escribe…'}); i.addEventListener('keydown',e=>{ if(e.key.length===1||e.key==='Backspace') ui.play('type'); }); s.append(i); }
  if(has('tab')){ s=sec('Pestañas'); for(const n of ['Uno','Dos','Tres']) btn(s,n,{'data-snd-click':'tab'}); }
  if(has('open')||has('close')||has('back')){ s=sec('Paneles'); if(has('open')) btn(s,'Abrir',{'data-snd-click':'open'}); if(has('close')) btn(s,'Cerrar',{'data-snd-click':'close'}); if(has('back')) btn(s,'Atrás',{'data-snd-click':'back'}); }
  if(has('select')||has('hover')){ s=sec('Lista'); for(const n of ['Primera','Segunda','Tercera']){ const d=E('div',{class:'it','data-snd-hover':has('hover')?'hover':'','data-snd-click':has('select')?'select':''},n); s.append(d); } }
  const av=['success','error','warn','notify'].filter(has); if(av.length){ s=sec('Avisos'); for(const n of av) btn(s,n,{'data-snd-click':n}); }
  if(has('loading')){ s=sec('Cargando (bucle)'); let h=null; const b=btn(s,'Cargar ↻'); b.addEventListener('click',()=>{ if(h){ h.stop(.2); h=null; b.classList.remove('on'); } else { h=ui.loop('loading',{fade:.1}); b.classList.add('on'); } }); }
  const pc=ui.cues().filter(c=>c.pitched); for(const c of pc){ s=sec('Notas: '+c.id+' (por grados)'); for(let d=1;d<=8;d++) btn(s,String(d),{'data-snd-x':c.id}).addEventListener('pointerdown',()=>ui.play(c.id,{degree:d})); btn(s,'acorde').addEventListener('pointerdown',()=>ui.play(c.id,{degree:[1,3,5],spread:.06})); btn(s,'arpegio ↑').addEventListener('pointerdown',()=>ui.play(c.id,{degree:[1,3,5,8],spread:.09})); }
  ui.attach(box); return box; }

// ───────────── 2) armado del banco ─────────────
const BANK_LEVEL=-22;                                         // sonoridad objetivo de cada cue (LUFS sin compuerta, porque los sonidos de interfaz duran décimas de segundo)
const BANK_GAP=.1;                                            // silencio entre sonidos en el sprite (segundos)
const BANK_TEMPLATES={
  ui:{name:'interfaz',cues:[['hover','one'],['click','one'],['down','gate',2],['up','one'],['toggle_on','one'],['toggle_off','one'],['open','one'],['close','one'],['back','one'],['select','one'],['tab','one'],['tick','one'],['drag','gate',2],['drop','one'],['success','one'],['error','one'],['warn','one'],['notify','one'],['type','one'],['loading','loop',2]]},
  game:{name:'juego',cues:[['pickup','one'],['hit','one'],['jump','one'],['step','one'],['powerup','one'],['gameover','one'],['ambient','loop',2]]}};
function wavPCM(chs,sr){ const n=chs[0].length, c=chs.length, buf=new ArrayBuffer(44+n*c*2), v=new DataView(buf), ws=(o,s)=>{ for(let i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i)); };
  ws(0,'RIFF'); v.setUint32(4,36+n*c*2,true); ws(8,'WAVE'); ws(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,c,true); v.setUint32(24,sr,true); v.setUint32(28,sr*c*2,true); v.setUint16(32,c*2,true); v.setUint16(34,16,true); ws(36,'data'); v.setUint32(40,n*c*2,true);
  let o=44; for(let i=0;i<n;i++) for(let k=0;k<c;k++){ const x=chs[k][i], s=x>1?1:x<-1?-1:x; v.setInt16(o,Math.round(s*32767),true); o+=2; } return buf; }
function bankLoud(L,R,sr){ const a=kWeight(L,sr), b=kWeight(R,sr); let s=0; for(let i=0;i<a.length;i++) s+=a[i]*a[i]+b[i]*b[i]; s/=Math.max(1,a.length); return s>0?-.691+10*Math.log10(s):-Infinity; }
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
async function bankRenderCue(q,variant,sr){
  const Q=cueProject(P,q,variant); if(!Q.tracks.length) return null;
  const saved=new Map(stemCache), t0=TAIL, s0=SR, o0=OSF, h0=HQ, RS=sr<44100?44100:sr, was=exportBusy;
  stemCache.clear(); TAIL=q.c.tail==null?(q.c.type==='loop'?0:1.5):q.c.tail; SR=RS; OSF=1; HQ=false; exportBusy=true;
  try{ const o=await renderProject(Q,null); let L=o.L, R=o.R; if(RS!==sr){ L=await decimatePow2(L,sr,RS/sr); R=await decimatePow2(R,sr,RS/sr); } return {L,R}; }
  finally{ TAIL=t0; SR=s0; OSF=o0; HQ=h0; exportBusy=was; stemCache.clear(); for(const [k,v] of saved) stemCache.set(k,v); } }
// opts: {sr, mono, level:true}. Devuelve {M (manifiesto), sprite (Float32 canales + offsets), clips:[{id,v,L,R,h}], report}
async function bankBuild(opts,onProg){
  const sr=opts.sr||48000, qs=bankCues(P), report=[], themeId=(P.bank&&P.bank.theme)||'default', cues={}, items=[];
  if(!qs.length) throw new Error('No hay secciones: crea marcas en la barra de secciones o usa una plantilla.');
  const dup=qs.find(q=>q.dup); if(dup) throw new Error('Hay dos cues con el mismo nombre «'+dup.c.id+'». Cada sección necesita un nombre distinto.');
  for(let k=0;k<qs.length;k++){ const q=qs[k], raws=[]; if(onProg) onProg(k/qs.length);
    for(let v=0;v<q.c.vars;v++){ const r=await bankRenderCue(q,v,sr); if(!r){ report.push({id:q.c.id,type:q.c.type,empty:true}); break; } raws.push(bankShape(q,r.L,r.R,sr)); await tick(); }
    if(!raws.length) continue;
    let gdb=q.c.vol, lu=null, tp=null, lim=false;
    if(opts.level!==false){ const r0=raws[0]; lu=bankLoud(r0.L,r0.R,sr); let pk=0; for(const r of raws){ pk=Math.max(pk,truePeakOf(r.L,r.R)); } const want=isFinite(lu)?BANK_LEVEL-lu:0, cap=pk>0?-1-dB(pk):0;
      gdb=Math.min(want,cap); lim=want>cap+.05; gdb+=q.c.vol; }
    const g=Math.pow(10,gdb/20); let pk=0; for(const r of raws){ r.L=gainArr(r.L,g); r.R=gainArr(r.R,g); pk=Math.max(pk,expoPeak(r.L,r.R)); }
    if(pk>.995){ const f=.995/pk; for(const r of raws){ r.L=gainArr(r.L,f); r.R=gainArr(r.R,f); } gdb+=dB(f); pk=.995; }
    if(opts.mono) for(const r of raws){ const m=new Float32Array(r.L.length); for(let i=0;i<m.length;i++) m[i]=(r.L[i]+r.R[i])/2; r.L=m; r.R=m; }
    let tn=0; if(q.c.pit){ if(q.c.tn!=null) tn=q.c.tn; else { const Q0=cueProject(P,q,0); let best=null; for(const tr of Q0.tracks){ const ins=INSTRUMENTS[tr.inst]; if(!ins||ins.kind==='perc') continue; for(const nt of tr.notes) if(!best||nt.b<best.b-1e-9||(Math.abs(nt.b-best.b)<1e-9&&nt.m<best.m)) best=nt; }
        if(best){ const r=KEY().root; tn=((best.m-r)%12+12)%12; if(tn>=6) tn-=12; } } }
    const tpAfter=dB(truePeakOf(raws[0].L,raws[0].R)), dur=raws[0].L.length/sr, a=raws[0].a||0;
    const warn=[]; if(q.c.type==='one'&&/^(hover|leave|focus)/.test(q.c.id)&&dur>.4) warn.push('dura '+Math.round(dur*1000)+' ms: un hover largo se siente pesado'); if(q.c.type==='one'&&dur>3) warn.push('dura '+dur.toFixed(1)+' s');
    if(lim) warn.push('el techo de pico impidió llegar a la sonoridad común (queda más bajo que los demás)');
    report.push({id:q.c.id,type:q.c.type,vars:raws.length,dur,gain:gdb,lufs:lu,tp:tpAfter,warn});
    cues[q.c.id]={p:q.c.pit?1:undefined,tn:q.c.pit?tn:undefined,t:q.c.type,jp:q.c.jp||undefined,jv:q.c.jv||undefined,g:q.c.grp||undefined,cd:q.c.cd||undefined,a:q.c.type==='gate'?+a.toFixed(4):undefined,v:[]};
    raws.forEach((r,i)=>items.push({id:q.c.id,i,L:r.L,R:r.R,h:r.h||0})); }
  if(!items.length) throw new Error('Ningún cue tiene notas dentro de su sección.');
  let key; if(items.some(it=>cues[it.id].p)){ const k=KEY(), ivs=SCALES[k.scale]||SCALES['Mayor']; key={root:k.root,scale:SCALES[k.scale]?k.scale:'Mayor',ivs}; if(!SCALES[k.scale]) report.push({id:'(tonalidad)',type:'',warn:['el proyecto no tiene escala elegida: usé '+NOTE_NAMES[k.root]+' Mayor para los cues con ♪']}); }
  const ch=opts.mono?1:2, M={format:'demokit-bank',v:1,key,name:P.name||'banco',sr,ch,theme:themeId,themes:{[themeId]:{name:themeId==='default'?'Predeterminado':themeId,cues}},made:'Demo Kit'};
  return {M,items,report,sr,ch}; }
function bankPackSprite(B){ const gap=Math.round(B.sr*BANK_GAP); let n=0; for(const it of B.items) n+=it.L.length+gap;
  const chs=B.ch===1?[new Float32Array(n)]:[new Float32Array(n),new Float32Array(n)]; let o=0; const M=B.M, cues=M.themes[M.theme].cues;
  for(const it of B.items){ chs[0].set(it.L,o); if(B.ch===2) chs[1].set(it.R,o); const v={o:+(o/B.sr).toFixed(5),l:+(it.L.length/B.sr).toFixed(5)}; if(it.h) v.h=+it.h.toFixed(5); cues[it.id].v[it.i]=v; o+=it.L.length+gap; }
  return {M,wav:wavPCM(chs,B.sr)}; }
function bankPackFiles(B,dir){ const M=B.M, cues=M.themes[M.theme].cues, files=[]; M.dir=dir;
  for(const it of B.items){ const f=it.id+'_'+(it.i+1)+'.wav', v={f,l:+(it.L.length/B.sr).toFixed(5)}; if(it.h) v.h=+it.h.toFixed(5); cues[it.id].v[it.i]=v; files.push({name:dir+'/'+f,blob:new Blob([wavPCM(B.ch===1?[it.L]:[it.L,it.R],B.sr)],{type:'audio/wav'})}); }
  return {M,files}; }
const bankJs=(M,embed,tag)=>`// ── ${M.name} · banco de sonidos de Demo Kit (${tag}) ──
// Uso:   const ui = DKUI.load();   ui.play('click');   ui.bind(boton,{hover:'hover',click:'click'});   ui.attach(document);   // data-snd-click="click"
// Cues: ${Object.keys(M.themes[M.theme].cues).join(', ')}
(function(g){
  const SRC=(typeof document!=='undefined'&&document.currentScript&&document.currentScript.src)||'';
  const MANIFEST=${JSON.stringify(M)};
  const EMBED=${embed?JSON.stringify(embed):'null'};
  ${makeDKUI.toString()}
  const bank=makeDKUI(MANIFEST,EMBED,SRC), D=g.DKUI=g.DKUI||{banks:{}}; D.banks[bank.name]=bank; if(!D.load) D.load=o=>bank.load(o);
})(typeof globalThis!=='undefined'?globalThis:window);
`;
function bankExample(M,jsName){ const ids=Object.keys(M.themes[M.theme].cues), cs=M.themes[M.theme].cues;
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${M.name} · prueba del banco</title>
<style>body{font:15px system-ui;background:#10131c;color:#dde;margin:0;padding:20px}h1{font-size:18px}button{font:inherit;margin:4px;padding:10px 14px;border-radius:8px;border:1px solid #445;background:#1b2030;color:#eef;cursor:pointer}button:hover{background:#262d44}small{color:#99a}</style>
<h1>${M.name} <small>· ${ids.length} sonidos</small></h1><p><small>Toca los botones. Los «gate» se mantienen: suenan mientras los tienes presionados y al soltar suena la cola.</small></p><div id="b"></div>
<script src="${jsName}"><\/script><script>
${dkMock.toString()}
const ui=DKUI.load(); ui.ready.then(()=>{ dkMock(ui,document.body); const box=document.getElementById('b'); box.before(Object.assign(document.createElement('h1'),{textContent:'Todos los cues'})); for(const c of ui.cues()){ const b=document.createElement('button'); b.textContent=c.id+(c.type==='gate'?' ⏺':c.type==='loop'?' ↻':''); b.setAttribute('data-snd-'+(c.type==='gate'?'down':'click'),c.id); box.append(b); } ui.attach(box); }).catch(e=>{ document.body.insertAdjacentHTML('beforeend','<p style="color:#f88">'+e.message+' (si abriste el archivo directo, usa un servidor local: python3 -m http.server)</p>'); });
<\/script>`; }

// ───────────── 3) cuadro «🔊 Banco» ─────────────
const BANK_PREF='demokit-bank-export';
const bankPrefs=()=>{ try{ return Object.assign({mode:'embed',sr:48000,ch:'mono',level:true},JSON.parse(localStorage.getItem(BANK_PREF)||'{}')); }catch(e){ return {mode:'embed',sr:48000,ch:'mono',level:true}; } };
let bankLive=null;      // instancia de prueba (el mismo runtime que se exporta)
function bankSetCue(mk,key,val,def){ pushUndo(); mk.cue=mk.cue||{}; if(val===def||val===''||val==null) delete mk.cue[key]; else mk.cue[key]=val; if(!Object.keys(mk.cue).length) delete mk.cue; touch(); }
function bankTemplate(key){ const T=BANK_TEMPLATES[key]; P.bank=P.bank||{v:1,theme:'default'}; pushUndo(); const empty=!(P.marks&&P.marks.length)&&!P.tracks.some(t=>t.notes.length);
  P.marks=P.marks||[]; const have=new Set(bankCues(P).map(q=>q.c.id)); let at=0; for(const m of P.marks) at=Math.max(at,m.bar+1); if(empty){ P.bpm=240; P.sig=[4,4]; delete P.sigs; at=0; }
  let n=0; for(const [name,type,bars] of T.cues){ if(have.has(cueSlug(name))) continue; const m={bar:at,name}; if(type!=='one') m.cue={type}; P.marks.push(m); at+=bars||1; n++; }
  P.bars=Math.min(256,Math.max(P.bars,at)); P.marks.sort((a,b)=>a.bar-b.bar); $('bpm').value=P.bpm; $('bars').value=P.bars; $('sig').value=sigStr(); touch(); layoutSpacer(); invalidate(); return n; }
async function bankAudition(q,btn){ if(rendering||exportBusy) return; const t=btn.textContent; btn.textContent='…'; try{ const sr=44100, r=await bankRenderCue(q,0,sr); if(!r){ toast('«'+q.mk.name+'» no tiene notas dentro de su sección.','err'); return; }
    const sh=bankShape(q,r.L,r.R,sr), a=ac(), b=a.createBuffer(2,sh.L.length,sr); b.copyToChannel(sh.L,0); b.copyToChannel(sh.R,1); const s=a.createBufferSource(); s.buffer=b; s.connect(a.destination); s.start(); }
  catch(e){ console.error(e); toast('Error: '+e.message,'err'); } finally{ btn.textContent=t; } }
function openBank(){
  P.bank=P.bank||{v:1,theme:'default'}; const m=el('div',{class:'modal show'}), done=()=>{ m.remove(); if(bankLive){ try{ bankLive.stopAll(0); }catch(e){} } }; m.addEventListener('click',e=>{ if(e.target===m) done(); });
  const body=el('div'), pf=bankPrefs(), card=el('div',{class:'card',style:'max-width:900px;width:100%'});
  const num=(v,min,max,step,w,fn,tt)=>el('input',{type:'number',value:v,min,max,step,title:tt||'',style:'width:'+(w||52)+'px',onchange:e=>fn(+e.target.value)});
  const sel=(opts,v,fn,tt)=>{ const s=el('select',{title:tt||'',onchange:e=>fn(e.target.value)}); for(const [a,b] of opts) s.append(el('option',{value:a,text:b})); s.value=v; return s; };
  function draw(){ body.textContent=''; const qs=bankCues(P);
    if(!qs.length) body.append(el('p',{class:'desc',text:'Todavía no hay cues. Cada sección (marca) del proyecto es un sonido: crea marcas en la barra de secciones del panel de tempo, o parte de una plantilla.'}));
    else{ const tb=el('table',{style:'width:100%;border-collapse:collapse;font-size:12px'}), hd=el('tr'); for(const h of ['','Nombre (id)','Tipo','Tomas','dB','Tono ±¢','Vol ±dB','Grupo','Espera ms','Ataque s','Soltar s','♪','Nota base','Dura']) hd.append(el('th',{text:h,style:'text-align:left;font-weight:600;padding:3px 4px;white-space:nowrap'})); tb.append(hd);
      for(const q of qs){ const c=q.c, mk=q.mk, gt=c.type==='gate', tr=el('tr',{style:q.dup?'background:#a002':''});
        const td=(...k)=>{ const d=el('td',{style:'padding:2px 4px'}); d.append(...k); tr.append(d); return d; };
        const pb=el('button',{class:'sm',text:'▶',title:'Escuchar este cue (primera toma)',onclick:()=>bankAudition(q,pb)});
        td(pb); td(el('input',{value:mk.name,style:'width:120px',title:'id para el código: '+c.id,onchange:e=>{ pushUndo(); mk.name=e.target.value.trim().slice(0,40)||'Sección'; touch(); draw(); }}),el('br'),el('small',{text:c.id+(q.dup?' ⚠ repetido':'')}));
        td(sel([['one','disparo'],['loop','bucle'],['gate','gate']],c.type,v=>{ bankSetCue(mk,'type',v,'one'); draw(); },'disparo: suena y termina · bucle: se repite sin costura · gate: presionar, mantener, soltar'));
        td(num(c.vars,1,6,1,44,v=>{ bankSetCue(mk,'vars',v,1); },'Tomas distintas (semilla del azar); el runtime elige una sin repetir la anterior'));
        td(num(c.vol,-24,12,.5,52,v=>bankSetCue(mk,'vol',v,0),'Ajuste fino de volumen, después de nivelar')); td(num(c.jp,0,1200,5,56,v=>bankSetCue(mk,'jp',v,0),'Variación aleatoria de tono al sonar, en centésimas de semitono'));
        td(num(c.jv,0,12,.5,48,v=>bankSetCue(mk,'jv',v,0),'Variación aleatoria de volumen al sonar'));
        td(el('input',{value:c.grp,style:'width:60px',title:'Cues del mismo grupo se cortan entre sí (open/close…)',onchange:e=>bankSetCue(mk,'grp',e.target.value.trim(),'')}));
        td(num(c.cd,0,5000,10,56,v=>bankSetCue(mk,'cd',v,0),'Tiempo mínimo entre dos disparos del mismo cue'));
        td(gt?num(c.att,0,10,.01,52,v=>bankSetCue(mk,'att',v,0),'Ataque: lo que suena antes de que empiece a repetirse la zona de mantener'):el('span',{text:'—'})); td(gt?num(c.rel,0,60,.01,52,v=>bankSetCue(mk,'rel',v,0),'Momento (desde el inicio del cue) donde acaba la zona que se repite y empieza la cola de soltar. 0 = al final de la sección'):el('span',{text:'—'}));
        td(el('input',{type:'checkbox',checked:c.pit,title:'Cue afinado (una nota): se puede tocar por grados de la escala con ui.play(id,{degree:3})',onchange:e=>{ bankSetCue(mk,'pit',e.target.checked,false); draw(); }}));
        td(c.pit?el('input',{type:'number',value:c.tn==null?'':c.tn,placeholder:'auto',min:-36,max:36,step:1,style:'width:52px',title:'Semitonos sobre la tónica en que suena este cue. Vacío = se toma de la primera nota que compusiste dentro del cue',onchange:e=>bankSetCue(mk,'tn',e.target.value===''?null:+e.target.value,null)}):el('span',{text:'—'}));
        td(el('span',{text:q.sec.toFixed(2)+' s'})); tb.append(tr); }
      body.append(el('div',{style:'overflow:auto;max-height:44vh'},tb)); }
    { const k=KEY(), kr=sel(NOTE_NAMES.map((n,i)=>[i,n]),k.root,v=>{ $('kRoot').value=v; $('kRoot').onchange(); }), ks=sel(Object.keys(SCALES).map(n=>[n,n==='off'?'Ninguna':n]),k.scale,v=>{ $('kScale').value=v; $('kScale').onchange(); });
      body.append(el('div',{class:'row',style:'grid-template-columns:150px auto auto 1fr;margin-top:8px',title:'Es la misma «Escala» del piano roll. Los cues con ♪ se tocan por grados de esta escala.'},el('label',{text:'Tonalidad del banco'}),kr,ks,el('small',{text:' para los cues con ♪ (ui.play(\'nota\',{degree:3}))'}))); }
    body.append(el('div',{style:'display:flex;gap:8px;flex-wrap:wrap;margin:8px 0'},
      el('button',{text:'＋ Plantilla de interfaz',title:'hover, click, down, up, toggle, open, close, tick, success, error, loading…',onclick:()=>{ const n=bankTemplate('ui'); toast(n?'Plantilla: '+n+' cues nuevos (uno por compás).':'Ya están todos los cues de la plantilla.','ok'); draw(); }}),
      el('button',{text:'＋ Plantilla de juego',onclick:()=>{ const n=bankTemplate('game'); toast(n?'Plantilla: '+n+' cues nuevos.':'Ya están todos los cues de la plantilla.','ok'); draw(); }}),
      el('button',{text:'🎮 Probar en vivo',class:'pri',title:'Construye el banco con el mismo runtime que se exporta y te deja tocarlo',onclick:()=>bankTry(live,info)})));
    const live=el('div',{style:'display:flex;flex-wrap:wrap;gap:6px;margin:6px 0'}), info=el('p',{class:'desc'}); body.append(live,info);
    const o=pf, sm=sel([['embed','Un solo .js con los sonidos dentro'],['folder','Carpeta: .js + audios (.zip)']],o.mode,v=>{ o.mode=v; sv(); }), sr=sel([[48000,'48 kHz'],[44100,'44.1 kHz'],[22050,'22.05 kHz (más ligero)']],o.sr,v=>{ o.sr=+v; sv(); }), sc=sel([['mono','Mono (recomendado)'],['stereo','Estéreo']],o.ch,v=>{ o.ch=v; sv(); }),
      lv=el('input',{type:'checkbox',checked:!!o.level,onchange:e=>{ o.level=e.target.checked; sv(); }}); const sv=()=>{ try{ localStorage.setItem(BANK_PREF,JSON.stringify(o)); }catch(e){} };
    const row=(l,x,h)=>el('div',{class:'row',title:h||'',style:'grid-template-columns:150px minmax(0,1fr)'},el('label',{text:l}),x);
    body.append(row('Formato',sm),row('Frecuencia',sr),row('Canales',sc),row('Nivelar sonoridad',el('label',{},lv,' que ningún cue suene más fuerte que otro (techo −1 dBTP)')));
    body.append(el('div',{style:'display:flex;gap:8px;margin-top:10px'},el('button',{class:'pri',text:'⬇ Exportar banco',onclick:()=>bankExport(o,info)}),el('button',{text:'Cerrar',onclick:done})));
  }
  card.append(el('h3',{text:'🔊 Banco de sonidos'}),el('p',{class:'desc',text:'Cada sección del proyecto es un cue con nombre. Compón el sonido dentro de su sección (un compás = un cue en la plantilla; a 240 BPM dura 1 s). Se exporta como librería ui_dk.js lista para cargar en una interfaz o un juego.'}),body); m.append(card); document.body.append(m); draw(); }
async function bankExport(o,info){ if(rendering||exportBusy) return; rendering=true; stop(); $('stat').textContent='Armando el banco…'; $('stat').className=''; info.textContent='Renderizando cues…'; const t0=performance.now();
  try{ const B=await bankBuild({sr:o.sr,mono:o.ch==='mono',level:o.level},p=>{ prog(p); }), nm=slug(P.name||'banco').replace(/-/g,'_')+'_dk', rep=B.report;
    let kb;
    if(o.mode==='embed'){ const {M,wav}=bankPackSprite(B), js=bankJs(M,u8ToB64(new Uint8Array(wav)),'sonidos incluidos'); kb=js.length/1024; download(new Blob([js],{type:'text/javascript'}),nm+'.js'); }
    else { const {M,files}=bankPackFiles(B,nm), js=bankJs(M,null,'audios en la carpeta '+nm+'/'); files.unshift({name:nm+'.js',blob:new Blob([js],{type:'text/javascript'})},{name:'ejemplo.html',blob:new Blob([bankExample(M,nm+'.js')],{type:'text/html'})},{name:nm+'.json',blob:new Blob([JSON.stringify(M,null,1)],{type:'application/json'})});
      const zip=await makeZip(files); kb=zip.size/1024; download(zip,nm+'.zip'); }
    const w=rep.filter(r=>r.warn&&r.warn.length||r.empty);
    info.textContent=rep.filter(r=>!r.empty).length+' cues · '+(kb>1024?(kb/1024).toFixed(1)+' MB':kb.toFixed(0)+' KB')+' · '+((performance.now()-t0)/1000).toFixed(1)+' s'+(w.length?' · ⚠ '+w.map(r=>r.id+': '+(r.empty?'sin notas en su sección':r.warn.join('; '))).join(' | '):'');
    toast('Banco exportado: '+nm+(o.mode==='embed'?'.js':'.zip'),'ok');
  }catch(e){ console.error(e); info.textContent='Error: '+e.message; toast('Error al exportar el banco: '+e.message,'err'); }
  finally{ prog(0); rendering=false; updateStat(); } }
// prueba en vivo: arma el banco (sonidos incluidos) y lo carga con el runtime exportable
async function bankTry(box,info){ if(rendering||exportBusy) return; rendering=true; stop(); info.textContent='Armando el banco de prueba…'; box.textContent='';
  try{ const B=await bankBuild({sr:44100,mono:true,level:bankPrefs().level},p=>prog(p)), {M,wav}=bankPackSprite(B), rt=makeDKUI(M,u8ToB64(new Uint8Array(wav)),''); if(bankLive) bankLive.stopAll(0); const ui=bankLive=rt.load({context:ac()}); await ui.ready;
    info.textContent='Listo. Los botones con ⏺ son gates (mantén presionado); ↻ son bucles (clic para empezar / parar). Mueve el puntero encima para probar el hover.'; const loops={};
    for(const c of ui.cues()){ const b=el('button',{text:c.id+(c.type==='gate'?' ⏺':c.type==='loop'?' ↻':''),style:'min-width:70px'});
      if(c.type==='gate'){ let h=null; b.onpointerdown=e=>{ h=ui.down(c.id); }; const up=()=>{ if(h){ h.up(); h=null; } }; b.onpointerup=up; b.onpointerleave=up; }
      else if(c.type==='loop'){ b.onclick=()=>{ if(loops[c.id]){ loops[c.id].stop(.2); loops[c.id]=null; b.classList.remove('on'); } else { loops[c.id]=ui.loop(c.id,{fade:.1}); b.classList.add('on'); } }; }
      else b.onclick=()=>ui.play(c.id);
      if(ui.has('hover')&&c.type==='one'&&c.id!=='hover') b.onpointerenter=e=>{ if(e.pointerType!=='touch') ui.play('hover'); };
      box.append(b); }
    const mk=el('div',{style:'width:100%'}); box.append(mk); dkMock(ui,mk);
  }catch(e){ console.error(e); info.textContent='Error: '+e.message; }
  finally{ prog(0); rendering=false; updateStat(); } }
