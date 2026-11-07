// ═══════════════════════════════════════════════════════════════════════
//  INTERFAZ
// ═══════════════════════════════════════════════════════════════════════
const $=id=>document.getElementById(id);
function el(tag,props,...kids){
  const e=document.createElement(tag);
  if(props) for(const k in props){ const v=props[k];
    if(k==='class') e.className=v; else if(k==='style') e.style.cssText=v; else if(k==='text') e.textContent=v; else if(k==='html') e.innerHTML=v;
    else if(k.slice(0,2)==='on') e.addEventListener(k.slice(2),v); else e[k]=v; }
  for(const c of kids){ if(c==null||c===false) continue; e.append(c&&c.nodeType?c:document.createTextNode(String(c))); }
  return e;
}
const fmtNum=v=>{const a=Math.abs(v);return a>=100?v.toFixed(0):a>=10?v.toFixed(1):String(+v.toFixed(3));};
function toast(msg,kind){ const d=el('div',{class:'toast '+(kind||''),text:msg}); $('toasts').append(d); setTimeout(()=>d.remove(),kind==='err'?8000:3800); }
const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const midiName=m=>NOTE_NAMES[((Math.round(m)%12)+12)%12]+(Math.floor(Math.round(m)/12)-1);
const isBlack=m=>[1,3,6,8,10].includes(((Math.round(m)%12)+12)%12);
const trackColor=(i,a)=>'hsla('+((i*53+205)%360)+',70%,62%,'+(a==null?1:a)+')';
const download=(blob,name)=>{const a=el('a',{href:URL.createObjectURL(blob),download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),8000);};

// ───────────── estado ─────────────
let P=starterProject(), sel=0, selNotes=new Set(), cursorBeat=0, version=0, dirty=true, cache=null, rendering=false;
const rec={armed:false,active:false,open:new Map(),snap:new Set(),n:0}, clickNodes=[];   // grabación
let playLoopEnd=0;
const down=new Map();   // teclas/notas sostenidas ahora (para resaltarlas)
let mode='draw', snap=.25, BW=48, lastLen=.5, drag=null, kitName='incluido';
const KW=62, RUL=24;
let ctx=null, srcNode=null, playing=false, playIsProject=false, playStartCtx=0, playOffset=0, playLoop=false, playDur=0;
const demos=[];
const wrap=$('wrap'), cv=$('cv'), sp=$('sp');

// ───────────── audio / reproducción ─────────────
function ac(){ if(!ctx) ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'}); if(ctx.state==='suspended') ctx.resume(); return ctx; }
function toAudioBuffer(out){ const b=ac().createBuffer(2,out.L.length,SR); b.copyToChannel(out.L,0); b.copyToChannel(out.R,1); return b; }
function startPlayback(buf,offset,loop,isProject,delay){
  stopSource(); const a=ac(), s=a.createBufferSource(); s.buffer=buf; s.connect(a.destination); s.loop=!!loop;
  playLoopEnd=0; if(loop&&isProject){ s.loopStart=0; s.loopEnd=playLoopEnd=Math.min(buf.duration,tmap(P).sec(meter(P).total(P.bars))); if(offset>=playLoopEnd-.01) offset=0; }
  s.onended=()=>{ if(srcNode===s) stop(); };
  playStartCtx=a.currentTime+.02+(delay||0); playOffset=offset; playLoop=!!loop; playDur=buf.duration; playIsProject=!!isProject;
  s.start(playStartCtx,offset); srcNode=s; playing=true; $('bPlay').textContent='■ Detener'; acquireWake(); invalidate(); if(isProject) startMetro();
}
function stopSource(){ if(srcNode){ srcNode.onended=null; try{srcNode.stop();}catch(e){} srcNode=null; } }
function stop(){ stopMetro(); recFinish(); for(const o of clickNodes){ try{o.stop();}catch(e){} } clickNodes.length=0; stopSource(); playing=false; $('bPlay').textContent='▶ Play'; releaseWake(); invalidate(); }
function playheadBeat(){ if(!playing||!ctx||!playIsProject) return null; let pos=playOffset+Math.max(0,ctx.currentTime-playStartCtx); if(playLoop&&playDur>0) pos%=(playLoopEnd||playDur); return tmap(P).beat(pos); }
async function togglePlay(){
  if(playing){ stop(); return; }
  ac(); if(rendering) return;
  if(dirty||!cache){ if(!(await doRender())) return; }
  const beat=60/tmap(P).bpmAt(cursorBeat), count=(rec.armed&&$('recCount').checked)?meter(P).lenAt(cursorBeat)*beat:0;
  if(rec.armed){ rec.active=true; rec.n=0; rec.snap.clear(); rec.open.clear(); setLive(true); }
  startPlayback(cache.buf,clamp(tmap(P).sec(cursorBeat),0,Math.max(0,cache.dur-.1)),$('loop').checked,true,count);
  if(count){ { const nc=meter(P).barAt(cursorBeat).sig[0], gp=count/nc; for(let i=0;i<nc;i++) clickAt(playStartCtx-count+i*gp,i===0); } $('stat').textContent='⏺ Cuenta previa…'; $('stat').className='warn'; setTimeout(()=>{ if(playing&&rec.active) updateStat(); },count*1000+40); }
  updateStat();
}
function prog(p){ $('prog').style.width=(p*100)+'%'; }
function updateStat(){
  if(rendering) return; const s=$('stat');
  if(rec.active){ s.textContent='⏺ Grabando · '+rec.n+' notas'; s.className='warn'; return; }
  if(dirty){ s.textContent=cache?'● cambios sin renderizar':'● sin renderizar'; s.className='warn'; }
  else { s.textContent='✓ listo · '+cache.dur.toFixed(1)+' s'; s.className=''; }
}
async function doRender(){
  if(rendering) return false; rendering=true; stop(); const ver=version, t0=performance.now();
  $('stat').textContent='Renderizando…'; $('stat').className='';
  try{
    const out=await renderProject(P,prog);
    cache={L:out.L,R:out.R,dur:out.dur,buf:toAudioBuffer(out)}; dirty=(ver!==version);
    if(out.errors&&out.errors.length) toast('Error en «'+out.errors[0].track+'»: '+out.errors[0].msg,'err');
    rendering=false; updateGR(); updateStat(); $('stat').textContent+=' · render '+((performance.now()-t0)/1000).toFixed(1)+' s ('+out.stats.rendered+' de '+out.stats.tracks+' pistas nuevas'+(out.stats.fx?', '+out.stats.fx+' con efectos recalculados':'')+')'; return true;
  }catch(e){ console.error(e); toast('Error al renderizar: '+e.message,'err'); rendering=false; updateStat(); return false; }
  finally{ prog(0); rendering=false; }
}
let pvSrc=null;
function previewNote(n,tr){
  tr=tr||P.tracks[sel]; if(!tr) return;
  try{ const out=previewBuffer(P,tr,n), a=ac(); if(pvSrc){try{pvSrc.stop();}catch(e){}}
    const s=a.createBufferSource(); s.buffer=toAudioBuffer(out); s.connect(a.destination); s.start(); pvSrc=s; }
  catch(e){ console.error(e); toast('Error en la vista previa: '+e.message,'err'); }
}
let pvTimer=0;
function previewTrack(){ clearTimeout(pvTimer); pvTimer=setTimeout(()=>{ const tr=P.tracks[sel]; if(!tr) return; prewarm();
  const n=[...selNotes][0]||tr.notes[0]||{b:0,l:.5,m:INSTRUMENTS[tr.inst]&&INSTRUMENTS[tr.inst].kind==='perc'?0:60,v:1}; previewNote(n,tr); },160); }

// ───────────── pantalla activa (Wake Lock) ─────────────
let wl=null, wlVideo=null, wlTimer=0;
async function acquireWake(){
  if(!$('wake').checked||wl||wlVideo) return;
  try{ if('wakeLock' in navigator){ wl=await navigator.wakeLock.request('screen'); wl.addEventListener('release',()=>{wl=null;}); return; } }catch(e){}
  try{
    const c=document.createElement('canvas'); c.width=c.height=16; const g=c.getContext('2d'); let k=0;
    const v=document.createElement('video'); v.muted=true; v.loop=true; v.setAttribute('playsinline','');
    v.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;pointer-events:none';
    v.srcObject=c.captureStream(2); document.body.append(v); v.play().catch(()=>{}); wlVideo=v;
    wlTimer=setInterval(()=>{ g.fillStyle=(k++%2)?'#000':'#010101'; g.fillRect(0,0,16,16); },400);
  }catch(e){}
}
function releaseWake(){
  try{ if(wl) wl.release(); }catch(e){} wl=null; clearInterval(wlTimer);
  if(wlVideo){ try{wlVideo.pause();}catch(e){} wlVideo.remove(); wlVideo=null; }
}
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible'&&playing) acquireWake(); });

// ───────────── proyecto: cambios ─────────────
let asTimer=0;
function touch(){ histNote(); version++; dirty=true; updateStat(); refreshCounts(); invalidate();
  clearTimeout(asTimer); asTimer=setTimeout(()=>{ try{ if(Object.keys(P.clips).length) return; localStorage.setItem('demokit-studio-autosave',JSON.stringify(projectToJSON(P))); }catch(e){} },900); }
// ───────────── historial global: deshacer / rehacer de TODO el proyecto ─────────────
// Cada cambio guarda una foto del proyecto (JSON; los arreglos de audio —clips, tabla de sidechain— van por referencia).
// Los cambios continuos (sliders, arrastres, una toma grabada) se agrupan en una sola entrada.
const hist={undo:[],redo:[],last:null,open:false,timer:0,max:100,restoring:false};
function snapProject(){ const refs=[]; const json=JSON.stringify(P,(k,v)=>{ if(v&&ArrayBuffer.isView(v)){ refs.push(v); return {__ref:refs.length-1}; } return v; }); return {json,refs}; }
function histPush(s){ const t=hist.undo[hist.undo.length-1]; if(t&&t.json===s.json) return; hist.undo.push(s); if(hist.undo.length>hist.max) hist.undo.shift(); hist.redo.length=0; histBtns(); }
function histArm(){ clearTimeout(hist.timer); hist.timer=setTimeout(histClose,700); }
function histClose(){ if(drag||rec.active){ hist.timer=setTimeout(histClose,700); return; } hist.open=false; hist.last=snapProject(); }
function histReset(){ clearTimeout(hist.timer); hist.undo.length=0; hist.redo.length=0; hist.open=false; hist.last=snapProject(); histBtns(); }
function histNote(){ if(hist.restoring) return; if(!hist.open){ if(hist.last) histPush(hist.last); hist.open=true; } histArm(); }   // lo llama touch(): ya cambió algo
function pushUndo(){ if(hist.restoring) return; histPush(snapProject()); hist.open=true; histArm(); }                         // se llama ANTES de cambiar: cada llamada es un paso nuevo
function histBtns(){ const u=$('bUndo'),r=$('bRedo'); if(u) u.disabled=!hist.undo.length; if(r) r.disabled=!hist.redo.length; }
function applySnap(s){
  hist.restoring=true; try{
    P=JSON.parse(s.json,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)&&'__ref' in v&&Object.keys(v).length===1?s.refs[v.__ref]:v);
    sel=Math.max(0,Math.min(sel,P.tracks.length-1)); selNotes.clear(); drag=null; tSel=null; tDrag=null;
    $('pname').value=P.name; $('bpm').value=P.bpm; $('bars').value=P.bars; $('sig').value=sigStr();
    renderTracks(); renderInspector(); layoutSpacer(); touch(); invalidate(); prewarm(); refreshTempoUI();
  } finally{ hist.restoring=false; }
}
function histGo(from,to,label){
  if(rec.active){ toast('Detén la grabación antes de deshacer','err'); return; }
  clearTimeout(hist.timer); hist.open=false; const cur=snapProject(); let s=from.pop(); while(s&&s.json===cur.json) s=from.pop();
  if(!s){ histBtns(); toast('Nada que '+label,''); return; }
  to.push(cur); applySnap(s); hist.last=s; histBtns();
}
const undo=()=>histGo(hist.undo,hist.redo,'deshacer'), redo=()=>histGo(hist.redo,hist.undo,'rehacer');
function loadProject(proj){
  stop(); P=proj; sel=0; selNotes.clear(); tSel=null; tDrag=null; cursorBeat=0; cache=null; dirty=true; version++;
  $('pname').value=P.name; $('bpm').value=P.bpm; $('bars').value=P.bars; $('sig').value=sigStr();
  renderTracks(); renderInspector(); layoutSpacer(); centerTrack(); updateStat(); invalidate(); histReset(); refreshTempoUI(); populateAddInst();
  if(P.loadErrors&&P.loadErrors.length) toast('Plugins con error: '+P.loadErrors.join('; '),'err');
  if(P.loadWarnings&&P.loadWarnings.length) toast(P.loadWarnings.join(' '),'err');
  { const ki=kitInfo(), same=P.engine&&ki&&ki.id===P.engine.id;
    if(same&&(P.engine.c||'')!==(ki.c||'')){
      if(confirm('Este proyecto se guardó con el carácter «'+charName(P.engine.c)+'» del kit '+ki.id+' y ahora está en «'+charName(ki.c)+'».\n\n¿Cambiar el carácter a «'+charName(P.engine.c)+'»? (Vuelve a renderizar; si dices que no, suena con el actual.)')){ setKitChar(P.engine.c); rememberChar(); cache=null; dirty=true; syncKitChar(); updateStat(); } }
    else if(P.engine&&(!ki||ki.id!==P.engine.id)) toast('Este proyecto se hizo con el kit «'+P.engine.id+'»'+(P.engine.v?' '+P.engine.v:'')+' y ahora suena con '+(ki?'«'+ki.id+'»':'el kit incluido')+': puede sonar distinto. Cárgalo en «Demos y plugins».','err'); }
}
const sigStr=()=>(P.sig?P.sig[0]+'/'+P.sig[1]:'4/4');
function fitBars(){ let end=0; for(const t of P.tracks) for(const n of t.notes) end=Math.max(end,n.b+(n.l||.25)); const need=end>0?meter(P).barAt(end-1e-6).i+1:0; if(need>P.bars){ P.bars=need; $('bars').value=need; layoutSpacer(); } }

// ───────────── piano roll ─────────────
function trackInfo(tr){
  const inst=INSTRUMENTS[tr.inst];
  if(inst&&inst.kind==='perc'){ const n=Math.max(1,(inst.lanes||[1]).length); return {perc:true,rows:n,RH:n>1?30:44,lanes:inst.lanes||[{name:inst.name}]}; }
  let lo=24,hi=107; for(const n of tr.notes){ if(n.m<lo+2) lo=Math.floor(n.m)-2; if(n.m>hi-2) hi=Math.ceil(n.m)+2; }
  lo=Math.max(0,lo); hi=Math.min(127,hi); return {perc:false,lo,hi,rows:hi-lo+1,RH:16};
}
const visLen=(inst,n)=>inst&&inst.oneShot?.25:Math.max(n.l||.25,.05);
const snapB=x=>snap>0?Math.round(x/snap)*snap:x;
const pxToBeat=px=>(px-KW+wrap.scrollLeft)/BW;
const pyToM=(info,py)=>{ const ry=Math.floor((py-RUL+wrap.scrollTop)/info.RH); return info.perc?ry:info.hi-ry; };
function fitCanvas(){ const w=wrap.clientWidth,h=wrap.clientHeight; if(cv.style.width!==w+'px') cv.style.width=w+'px'; if(cv.style.height!==h+'px') cv.style.height=h+'px'; }
function layoutSpacer(){
  fitCanvas(); const tr=P.tracks[sel], info=tr?trackInfo(tr):{rows:1,RH:30};
  sp.style.width=(KW+(meter(P).total(P.bars)+8)*BW)+'px'; sp.style.height=(RUL+info.rows*info.RH+8)+'px'; sp.style.marginTop=(-cv.offsetHeight)+'px';
}
function centerTrack(){
  const tr=P.tracks[sel]; if(!tr) return; layoutSpacer(); const info=trackInfo(tr);
  if(info.perc){ wrap.scrollTop=0; return; }
  let m=60; if(tr.notes.length){ let s=0; for(const n of tr.notes) s+=n.m; m=s/tr.notes.length; }
  wrap.scrollTop=Math.max(0,RUL+(info.hi-m)*info.RH-wrap.clientHeight/2);
}
let raf=0, needDraw=true;
function invalidate(){ needDraw=true; if(!raf) raf=requestAnimationFrame(frame); }
function frame(){
  raf=0; const ph=playheadBeat();
  if(playing&&ph!=null){ const x=KW+ph*BW-wrap.scrollLeft; if(x>wrap.clientWidth-24||x<KW) wrap.scrollLeft=Math.max(0,ph*BW-20); }
  if(rec.active) recTick();
  if(needDraw||playing){ needDraw=false; draw(ph); }
  if(playing) raf=requestAnimationFrame(frame);
}
function draw(ph){
  fitCanvas(); const g=cv.getContext('2d'), dpr=window.devicePixelRatio||1, W=cv.clientWidth, H=cv.clientHeight; if(!W||!H) return;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); }
  g.setTransform(dpr,0,0,dpr,0,0); g.fillStyle='#0d0f14'; g.fillRect(0,0,W,H);
  const sx=wrap.scrollLeft, sy=wrap.scrollTop, tr=P.tracks[sel];
  const b0=Math.floor(sx/BW), b1=Math.ceil((sx+W-KW)/BW);
  if(!tr){ g.fillStyle='#aab3c9'; g.font='14px system-ui'; g.fillText('Agrega una pista con ＋ para empezar',KW+20,RUL+40); drawRuler(g,W,sx,b0,b1); return; }
  const info=trackInfo(tr), inst=INSTRUMENTS[tr.inst]||{kind:'melodic'}, RH=info.RH;
  const r0=Math.max(0,Math.floor(sy/RH)), r1=Math.min(info.rows-1,Math.ceil((sy+H-RUL)/RH));
  for(let r=r0;r<=r1;r++){ const y=RUL+r*RH-sy;
    g.fillStyle=info.perc?(r%2?'#10131a':'#0d0f14'):rowBg(info.hi-r); g.fillRect(KW,y,W-KW,RH);
    g.fillStyle=(!info.perc&&((info.hi-r)%12===0))?'#3a4258':'#212637'; g.fillRect(KW,y+RH-1,W-KW,1); }
  // rejilla vertical
  let sub=snap>0?snap:.25; while(sub*BW<7) sub*=2; const k0=Math.floor(b0/sub),k1=Math.ceil(b1/sub);
  for(let k=k0;k<=k1;k++){ const bt=k*sub, x=Math.round(KW+bt*BW-sx)+.5; if(x<KW) continue;
    const bar=Math.abs(bt-meter(P).barAt(bt).start)<1e-9, beat=Math.abs(bt-Math.round(bt))<1e-9;
    g.fillStyle=bar?'#4a5378':beat?'#2c3246':'#1f2433'; g.fillRect(x,RUL,1,H-RUL); }
  const endX=KW+meter(P).total(P.bars)*BW-sx; if(endX<W){ g.fillStyle='#00000066'; g.fillRect(Math.max(KW,endX),RUL,W,H); }
  // notas fantasma de otras pistas melódicas
  if(!info.perc){ P.tracks.forEach((o,i)=>{ if(i===sel||o.mute) return; const oi=INSTRUMENTS[o.inst]; if(!oi||oi.kind==='perc') return;
    g.fillStyle=trackColor(i,.16); for(const n of o.notes){ const x=KW+n.b*BW-sx,w=Math.max(2,(n.l||.25)*BW); if(x+w<KW||x>W) continue; const y=RUL+(info.hi-n.m)*RH-sy; if(y+RH<RUL||y>H) continue; g.fillRect(x,y+3,w-1,RH-6); } }); }
  // notas de la pista activa
  for(const n of tr.notes){
    const x=KW+n.b*BW-sx, w=Math.max(4,visLen(inst,n)*BW); if(x+w<KW||x>W) continue;
    const ri=info.perc?Math.round(n.m):(info.hi-n.m); if(ri<0||ri>info.rows) continue; const y=RUL+ri*RH-sy; if(y+RH<RUL||y>H) continue;
    const v=n.v==null?1:n.v; g.fillStyle=trackColor(sel,clamp(.35+.65*v,.2,1)); g.fillRect(x,y+1,w-1,RH-2);
    if(selNotes.has(n)){ g.strokeStyle='#fff'; g.lineWidth=1.5; g.strokeRect(x+.5,y+1.5,w-2,RH-3); }
    if(n.o&&Object.keys(n.o).some(k=>k!=='cid')){ g.fillStyle='#ffffffaa'; g.fillRect(x+w-6,y+3,3,3); }
    if(inst.lyrics&&n.w&&w>8){ g.save(); g.beginPath(); g.rect(Math.max(x,KW),y,w-1,RH); g.clip(); g.fillStyle='#0b0d14'; g.font='600 '+clamp(RH-5,9,13)+'px system-ui'; g.fillText(n.w,x+3,y+RH-Math.max(3,(RH-9)/2)); g.restore(); }
    else if(!info.perc&&w>30&&RH>=14){ g.fillStyle='#0b0d14'; g.font='10px system-ui'; g.fillText(midiName(n.m),x+3,y+RH-4); }
    if(LE&&LE.n===n){ g.strokeStyle='#ffd76a'; g.lineWidth=2; g.strokeRect(x+1,y+1,w-3,RH-2); }
  }
  if(drag&&drag.kind==='rubber'){ g.strokeStyle='#8fa8ff'; g.fillStyle='#8fa8ff22'; const x=Math.min(drag.x0,drag.x1),y=Math.min(drag.y0,drag.y1),w=Math.abs(drag.x1-drag.x0),h=Math.abs(drag.y1-drag.y0); g.fillRect(x,y,w,h); g.strokeRect(x+.5,y+.5,w,h); }
  // inicio de reproducción y cabezal
  const cx=KW+cursorBeat*BW-sx; if(cx>=KW){ g.strokeStyle='#8fa8ff'; g.setLineDash([4,4]); g.beginPath(); g.moveTo(cx+.5,RUL); g.lineTo(cx+.5,H); g.stroke(); g.setLineDash([]); }
  if(ph!=null){ const x=KW+ph*BW-sx; if(x>=KW){ g.fillStyle='#ff7ab8'; g.fillRect(x-1,0,2,H); } }
  // teclas / carriles
  const hl=new Set(down.values());
  if(hl.size){ g.fillStyle='#8fa8ff30'; for(const m of hl){ const ri=info.perc?Math.round(m):(info.hi-m); if(ri<0||ri>info.rows) continue; const y=RUL+ri*RH-sy; if(y+RH<RUL||y>H) continue; g.fillRect(KW,y,W-KW,RH-1); } }
  g.fillStyle='#12141b'; g.fillRect(0,RUL,KW,H-RUL);
  for(let r=r0;r<=r1;r++){ const y=RUL+r*RH-sy;
    if(info.perc){ g.fillStyle=hl.has(r)?'#41518f':'#1a1d27'; g.fillRect(0,y,KW-1,RH-1); g.fillStyle='#b8bdca'; g.font='11px system-ui'; g.fillText((info.lanes[r]&&info.lanes[r].name||'').slice(0,9),4,y+RH/2+4); }
    else { const m=info.hi-r; g.fillStyle=isBlack(m)?'#15171f':'#d9dce6'; g.fillRect(0,y,isBlack(m)?KW*.62:KW-1,RH-1); if(hl.has(m)){ g.fillStyle='#8fa8ff'; g.fillRect(0,y,isBlack(m)?KW*.62:KW-1,RH-1); } if(m%12===0){ g.fillStyle='#0b0d14'; g.font='10px system-ui'; g.fillText(midiName(m),KW-24,y+RH-4); } } }
  drawRuler(g,W,sx,b0,b1); drawAuto(ph); drawTempo(ph);
  if(ph!=null){ const x=KW+ph*BW-sx; if(x>=KW){ g.fillStyle='#ff7ab8'; g.beginPath(); g.moveTo(x-5,0); g.lineTo(x+5,0); g.lineTo(x,8); g.fill(); } }
}
function drawRuler(g,W,sx,b0,b1){
  g.fillStyle='#14161c'; g.fillRect(0,0,W,RUL); g.fillStyle='#272b36'; g.fillRect(0,RUL-1,W,1);
  g.save(); g.beginPath(); g.rect(KW,0,W-KW,RUL); g.clip(); g.fillStyle='#aab3c9'; g.font='11px system-ui';
  const mm=meter(P), BB=mm.bb, step=Math.max(1,Math.ceil(40/(BW*BB))), chg=new Set(sigPts(P).map(p=>p.bar)); chg.add(0);
  for(let bi=mm.barAt(b0).i;bi<=mm.barAt(b1).i+1;bi++){ const x=KW+mm.beatOfBar(bi)*BW-sx; if(bi%step&&!(bi>0&&chg.has(bi))) continue; g.fillStyle='#aab3c9'; g.fillRect(Math.round(x),RUL-8,1,8); g.fillText(String(bi+1),x+4,RUL-8);
    if(bi>0&&chg.has(bi)){ const sg=mm.sigAtBar(bi); g.fillStyle='#7ad7ff'; g.fillText(sg[0]+'/'+sg[1],x+4+g.measureText(String(bi+1)).width+5,RUL-8); g.fillStyle='#aab3c9'; } }
  { const L=markPts(P); if(L.length){ g.font='600 8px system-ui'; const end=mm.total(P.bars); for(let i=0;i<L.length;i++){ const m=L[i]; if(m.bar>=P.bars) break; const x0=KW+mm.beatOfBar(m.bar)*BW-sx, x1=KW+(i+1<L.length&&L[i+1].bar<P.bars?mm.beatOfBar(L[i+1].bar):end)*BW-sx; if(x1<KW||x0>W) continue;
      g.fillStyle=markColor(m); g.fillRect(Math.round(x0),0,Math.max(1,Math.round(x1-x0)-1),8); if(x1-x0>g.measureText(m.name).width+8){ g.fillStyle='#0d0f14'; g.fillText(m.name,Math.max(x0,KW)+3,7); } } } }
  const cx=KW+cursorBeat*BW-sx; g.fillStyle='#8fa8ff'; g.beginPath(); g.moveTo(cx-5,RUL-10); g.lineTo(cx+5,RUL-10); g.lineTo(cx,RUL-2); g.fill();
  g.restore(); g.fillStyle='#aab3c9'; g.font='10px system-ui'; g.fillText('compás',8,15);
}
function hit(tr,info,inst,px,py){
  const bx=pxToBeat(px), m=pyToM(info,py);
  for(let i=tr.notes.length-1;i>=0;i--){ const n=tr.notes[i]; if(Math.round(n.m)!==m) continue; const len=visLen(inst,n);
    if(bx>=n.b-1e-9&&bx<=n.b+len+4/BW){ const edge=!inst.oneShot&&(n.b+len-bx)*BW<7&&bx<=n.b+len+1e-9; return {n,edge}; } }
  return null;
}
function setCursor(b){ cursorBeat=Math.max(0,b); invalidate(); }
cv.addEventListener('pointerdown',e=>{
  if(mode==='nav'){ if(e.pointerType==='mouse'){ pan={x:e.clientX,y:e.clientY,sx:wrap.scrollLeft,sy:wrap.scrollTop}; try{ cv.setPointerCapture(e.pointerId); }catch(_){} cv.style.cursor='grabbing'; } return; } const tr=P.tracks[sel]; const r=cv.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
  if(py<RUL){ if(px>=KW) setCursor(snapB(pxToBeat(px))); return; }
  if(!tr) return; const info=trackInfo(tr), inst=INSTRUMENTS[tr.inst]||{kind:'melodic'}, bx=pxToBeat(px), m=pyToM(info,py);
  if(px<KW){ if(!info.perc&&m>=0&&m<=127) previewNote({b:0,l:.5,m,v:1}); else if(info.perc&&m>=0&&m<info.rows) previewNote({b:0,l:.5,m,v:1}); return; }
  cv.setPointerCapture(e.pointerId); const h=hit(tr,info,inst,px,py);
  if(mode==='erase'){ if(h){ pushUndo(); tr.notes.splice(tr.notes.indexOf(h.n),1); selNotes.delete(h.n); touch(); } return; }
  if(h){
    let tap=null; if(mode==='select'){ if(!selNotes.has(h.n)) selNotes.add(h.n); else tap=h.n; } else if(e.shiftKey){ if(selNotes.has(h.n)) selNotes.delete(h.n); else selNotes.add(h.n); } else if(!selNotes.has(h.n)) selNotes=new Set([h.n]);
    drag={kind:h.edge?'resize':'move',tap,startBeat:bx,startM:m,undone:false,orig:[...selNotes].map(n=>({n,b:n.b,m:n.m,l:n.l||.25}))};
    lyPtr=e.pointerType; clearTimeout(lyLP);
    if(inst.lyrics&&!h.edge&&mode!=='select'){
      const now=Date.now(); if(lyTap&&lyTap.n===h.n&&now-lyTap.t<380){ drag.openLyric=h.n; lyTap=null; } else lyTap={n:h.n,t:now};
      const x0=e.clientX,y0=e.clientY; lyLP=setTimeout(()=>{ if(drag&&drag.kind==='move'&&!drag.undone&&Math.abs(lastPX-x0)<7&&Math.abs(lastPY-y0)<7){ const n=h.n; drag=null; lyTap=null; openLyric(n); } },480);
    }
    if(!h.edge) previewNote(h.n); renderSelInfo(); invalidate(); return;
  }
  if(e.shiftKey||mode==='select'){ if(mode==='select'&&!e.shiftKey){ selNotes=new Set(); renderSelInfo(); invalidate(); } drag={kind:'rubber',x0:px,y0:py,x1:px,y1:py}; return; }
  if(info.perc?(m<0||m>=info.rows):(m<0||m>127)) return;
  pushUndo(); const b=Math.max(0,snap>0?Math.floor(bx/snap+1e-9)*snap:bx);
  const mm=info.perc?m:(KEY().fit&&scaleOn()?fitScale(m):m), n={b,l:inst.oneShot?.25:(inst.kind==='perc'?4:lastLen),m:mm,v:1}, extra=[];
  tr.notes.push(n); if(!info.perc) for(const m2 of chordPitches(mm).slice(1)){ const x={b,l:n.l,m:m2,v:1}; tr.notes.push(x); extra.push(x); }
  selNotes=new Set([n,...extra]); previewNote(n); for(const x of extra) previewNote(x); drag={kind:'draw',n,extra,start:b,moved:false}; touch(); renderSelInfo();
});
cv.addEventListener('pointermove',e=>{
  lastPX=e.clientX; lastPY=e.clientY; if(pan){ wrap.scrollLeft=pan.sx-(e.clientX-pan.x); wrap.scrollTop=pan.sy-(e.clientY-pan.y); return; } const tr=P.tracks[sel]; const r=cv.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
  if(!drag){ if(mode==='draw'&&tr&&px>=KW&&py>=RUL){ const info=trackInfo(tr),inst=INSTRUMENTS[tr.inst]||{}; const h=hit(tr,info,inst,px,py); cv.style.cursor=h?(h.edge?'ew-resize':'pointer'):'crosshair'; } else cv.style.cursor=mode==='erase'?'not-allowed':(mode==='select'?'crosshair':(mode==='nav'?'grab':'default')); return; }
  const info=trackInfo(tr), bx=pxToBeat(px), m=pyToM(info,py), minL=snap>0?snap:.0625;
  const undoOnce=()=>{ if(!drag.undone){ pushUndo(); drag.undone=true; } };
  if(drag.kind==='move'){
    const db=snapB(bx-drag.startBeat); let dm=m-drag.startM; if(info.perc&&info.rows===1) dm=0;
    if(db||dm){ undoOnce(); for(const o of drag.orig){ o.n.b=Math.max(0,r6(o.b+db)); o.n.m=info.perc?clamp(Math.round(o.m+dm),0,info.rows-1):clamp(o.m+dm,0,127); } touch(); }
  } else if(drag.kind==='resize'){
    const db=snapB(bx-drag.startBeat); undoOnce(); for(const o of drag.orig){ o.n.l=Math.max(minL,r6(o.l+db)); lastLen=o.n.l; } touch();
  } else if(drag.kind==='draw'){
    const L=snap>0?Math.ceil((bx-drag.start)/snap-1e-9)*snap:bx-drag.start;
    if(L>=minL&&Math.abs(L-drag.n.l)>1e-9&&!(INSTRUMENTS[tr.inst]||{}).oneShot){ drag.n.l=L; for(const x of drag.extra||[]) x.l=L; drag.moved=true; lastLen=L; touch(); }
  } else if(drag.kind==='rubber'){
    drag.x1=px; drag.y1=py; const xa=Math.min(drag.x0,px),xb=Math.max(drag.x0,px),ya=Math.min(drag.y0,py),yb=Math.max(drag.y0,py);
    const inst=INSTRUMENTS[tr.inst]||{}, ba=pxToBeat(xa), bb=pxToBeat(xb), top=info.perc?info.rows-1:127, ma=clamp(pyToM(info,yb),0,top), mb=clamp(pyToM(info,ya),0,top);   // el rectángulo puede pasarse de las filas: se recorta
    selNotes=new Set(tr.notes.filter(n=>n.b+visLen(inst,n)>=ba&&n.b<=bb&&Math.round(n.m)>=ma&&Math.round(n.m)<=mb)); invalidate();
  }
});
const endDrag=()=>{ if(pan){ pan=null; cv.style.cursor=mode==='nav'?'grab':''; } clearTimeout(lyLP); if(!drag) return; const k=drag.kind; const ol=drag.openLyric&&!drag.undone?drag.openLyric:null; if(ol){ drag=null; renderSelInfo(); invalidate(); openLyric(ol); return; } if(k==='move'&&drag.tap&&!drag.undone) selNotes.delete(drag.tap); drag=null; if(k!=='rubber') fitBars(); renderSelInfo(); invalidate(); };
cv.addEventListener('pointerup',endDrag); cv.addEventListener('pointercancel',endDrag);
cv.addEventListener('contextmenu',e=>{ e.preventDefault(); const tr=P.tracks[sel]; if(!tr) return; if(lyPtr==='touch'&&lyricInst()) return; /* en pistas con letra, mantener pulsado abre la letra, no borra */ const r=cv.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
  if(px<KW||py<RUL) return; const h=hit(tr,trackInfo(tr),INSTRUMENTS[tr.inst]||{},px,py); if(h){ pushUndo(); tr.notes.splice(tr.notes.indexOf(h.n),1); selNotes.delete(h.n); touch(); renderSelInfo(); } });

// ===== Letra sobre las notas (instrumentos con inst.lyrics) =====
let pan=null, LE=null, lyTap=null, lyLP=0, lyPtr='', lastPX=0, lastPY=0;
const lyricInst=()=>{ const tr=P.tracks[sel], i=tr&&INSTRUMENTS[tr.inst]; return i&&i.lyrics?i:null; };
const lySorted=tr=>[...tr.notes].sort((a,b)=>a.b-b.b||b.m-a.m);
const lyInp=document.createElement('input'); lyInp.id='lyInp'; lyInp.type='text'; lyInp.autocomplete='off'; lyInp.spellcheck=false; lyInp.setAttribute('autocorrect','off'); lyInp.setAttribute('autocapitalize','none'); lyInp.setAttribute('enterkeyhint','done'); lyInp.setAttribute('aria-label','Letra de la nota'); document.body.append(lyInp);
function lyPlace(){ if(!LE) return; const tr=P.tracks[sel]; if(!tr){ closeLyric(false); return; } const info=trackInfo(tr), RH=info.RH, n=LE.n, r=cv.getBoundingClientRect(), sx=wrap.scrollLeft, sy=wrap.scrollTop;
  const ri=info.perc?Math.round(n.m):(info.hi-n.m), x=KW+n.b*BW-sx, y=RUL+ri*RH-sy, w=Math.max(96,(n.l||.25)*BW);
  lyInp.style.left=Math.max(r.left+KW,Math.min(r.left+x,r.right-w-4))+'px'; lyInp.style.top=Math.max(r.top+RUL,Math.min(r.top+y+(RH-24)/2,r.bottom-26))+'px'; lyInp.style.width=w+'px'; }
function lyReveal(n){ const tr=P.tracks[sel], info=trackInfo(tr), RH=info.RH, W=wrap.clientWidth, H=wrap.clientHeight; const x=KW+n.b*BW-wrap.scrollLeft;
  if(x<KW+4||x>W-110) wrap.scrollLeft=Math.max(0,n.b*BW-(W-KW)/3);
  const ri=info.perc?Math.round(n.m):(info.hi-n.m), y=RUL+ri*RH-wrap.scrollTop; if(y<RUL||y>H-RH-4) wrap.scrollTop=Math.max(0,ri*RH-(H-RUL)/2); }
function openLyric(n){ const tr=P.tracks[sel]; if(!tr||!n||!lyricInst()) return; if(LE&&LE.n!==n) lyCommit(false);
  if(!LE) LE={undone:false}; LE.n=n; LE.old=n.w||''; selNotes=new Set([n]); lyReveal(n); lyInp.value=LE.old; lyInp.classList.add('on'); lyPlace(); lyInp.focus({preventScroll:true}); lyInp.select(); renderSelInfo(); invalidate(); }
function lyCommit(preview){ if(!LE) return; const v=lyInp.value.replace(/[\s]+/g,' ').trim(), n=LE.n; if(v!==(n.w||'')){ if(!LE.undone){ pushUndo(); LE.undone=true; } if(v) n.w=v; else delete n.w; touch(); LE.changed=true; if(preview&&v) { try{ previewNote(n); }catch(_){} } } LE.old=n.w||''; }
function closeLyric(commit){ if(!LE) return; if(commit!==false) lyCommit(true); LE=null; lyInp.classList.remove('on'); lyInp.blur(); renderSelInfo(); renderInspector(); invalidate(); }
function lyMove(d,skipCommit){ const tr=P.tracks[sel]; if(!LE||!tr) return; if(!skipCommit) lyCommit(true); const arr=lySorted(tr), i=arr.indexOf(LE.n), j=i+d;
  if(j<0) return; if(j>=arr.length){ closeLyric(false); return; } const n=arr[j]; LE.n=n; LE.old=n.w||''; selNotes=new Set([n]); lyReveal(n); lyInp.value=LE.old; lyPlace(); lyInp.select(); renderSelInfo(); invalidate(); }
lyInp.addEventListener('input',()=>{ if(!LE) return; const v=lyInp.value; if(!/[\s-]/.test(v)) return;
  // Espacio o guion (también el del teclado de Android): confirma lo escrito y salta a la siguiente nota. Un texto con varias palabras se reparte por las notas.
  const parts=v.split(/[\s-]+/), trailing=parts[parts.length-1]===''; if(trailing) parts.pop(); const toks=parts.filter(Boolean);
  if(!toks.length){ lyInp.value=LE.old; lyMove(1,true); return; }   // espacio solo: saltar sin tocar la palabra
  for(let i=0;i<toks.length-1;i++){ lyInp.value=toks[i]; lyMove(1); if(!LE) return; }
  if(trailing){ lyInp.value=toks[toks.length-1]; lyMove(1); } else { lyInp.value=toks[toks.length-1]; } });
lyInp.addEventListener('keydown',e=>{ if(!LE) return; e.stopPropagation();
  if(e.key==='Enter'){ e.preventDefault(); closeLyric(true); }
  else if(e.key==='Escape'){ e.preventDefault(); closeLyric(false); }
  else if(e.key==='Tab'){ e.preventDefault(); lyMove(e.shiftKey?-1:1); }
  else if(e.key==='Backspace'&&lyInp.value===''&&!e.repeat){ e.preventDefault(); lyMove(-1); }
  else if(e.code==='Space'&&lyInp.value===''&&LE.old){ /* se resuelve en input */ } });
lyInp.addEventListener('blur',()=>{ setTimeout(()=>{ if(LE&&document.activeElement!==lyInp) closeLyric(true); },120); });
wrap.addEventListener('scroll',()=>{ if(LE) lyPlace(); }); window.addEventListener('resize',()=>{ if(LE) lyPlace(); });
$('sLyric').onclick=()=>{ const tr=P.tracks[sel]; if(!tr||!lyricInst()) return; const n=lySorted(tr).find(x=>selNotes.has(x))||lySorted(tr)[0]; if(!n){ toast('Dibuja alguna nota primero','err'); return; } openLyric(n); };
function lyricPaste(){ const tr=P.tracks[sel], inst=lyricInst(); if(!tr||!inst) return; const txt=$('lyText').value, useSyl=$('lySyl').checked;
  const toks=useSyl?inst.syllables(txt):(txt.match(/[^\s]+/g)||[]); if(!toks.length){ $('lyInfo').textContent='No hay texto'; return; }
  const arr=lySorted(tr); if(!arr.length){ $('lyInfo').textContent='La pista no tiene notas'; return; }
  const from=Math.max(0,arr.findIndex(n=>selNotes.has(n))); pushUndo(); let k=0; for(let i=from;i<arr.length&&k<toks.length;i++,k++) arr[i].w=toks[k];
  touch(); invalidate(); renderSelInfo(); closeModal('lyModal'); toast(k+' sílabas repartidas'+(k<toks.length?' · sobraron '+(toks.length-k)+' (faltan notas)':''),k<toks.length?'err':'ok'); }
$('lyApply').onclick=lyricPaste;
wrap.addEventListener('scroll',invalidate);
wrap.addEventListener('wheel',e=>{ if(e.ctrlKey||e.metaKey){ e.preventDefault(); zoom(e.deltaY<0?1.15:1/1.15); } },{passive:false});
new ResizeObserver(()=>{ layoutSpacer(); invalidate(); }).observe(wrap);
function zoom(f){ const c=(wrap.scrollLeft+wrap.clientWidth/2-KW)/BW; BW=clamp(BW*f,6,260); layoutSpacer(); wrap.scrollLeft=Math.max(0,c*BW-(wrap.clientWidth/2-KW)); invalidate(); }
function setMode(m){ mode=m; for(const [id,k] of [['mDraw','draw'],['mNav','nav'],['mErase','erase'],['mSel','select']]) $(id).classList.toggle('on',k===m); cv.style.touchAction=m==='nav'?'auto':'none'; }

// teclado
document.addEventListener('keydown',e=>{
  const tg=e.target&&e.target.tagName;
  if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT'){   // deshacer/rehacer también funcionan con el foco en un slider, casilla o selector (no en cajas de texto, que tienen el suyo)
    const ty=e.target.type; if((e.ctrlKey||e.metaKey)&&/^[zy]$/i.test(e.key)&&(tg==='SELECT'||(tg==='INPUT'&&/^(checkbox|range|radio|button)$/.test(ty)))){ e.preventDefault(); if(e.key.toLowerCase()==='y'||e.shiftKey) redo(); else undo(); }
    return; }
  const tr=P.tracks[sel], ctrl=e.ctrlKey||e.metaKey;
  if(e.code==='Space'){ e.preventDefault(); togglePlay(); return; }
  if(ctrl&&e.key.toLowerCase()==='z'){ e.preventDefault(); if(e.shiftKey) redo(); else undo(); return; }
  if(ctrl&&e.key.toLowerCase()==='y'){ e.preventDefault(); redo(); return; }
  if(!tr) return;
  if(e.key==='Delete'||e.key==='Backspace'){ if(selNotes.size){ e.preventDefault(); delSel(); } }
  else if(ctrl&&e.key.toLowerCase()==='a'){ e.preventDefault(); selNotes=new Set(tr.notes); renderSelInfo(); invalidate(); }
  else if(ctrl&&e.key.toLowerCase()==='d'){ e.preventDefault(); dupSel(); }
  else if(e.key==='Enter'&&lyricInst()&&selNotes.size){ e.preventDefault(); openLyric(lySorted(tr).find(n=>selNotes.has(n))); }
  else if(e.key==='Escape'){ selNotes.clear(); renderSelInfo(); invalidate(); }
  else if(e.key==='Home'){ setCursor(0); wrap.scrollLeft=0; }
  else if(e.key.startsWith('Arrow')&&selNotes.size){ e.preventDefault(); const info=trackInfo(tr); pushUndo();
    const st=e.shiftKey?1:(snap>0?snap:.25); for(const n of selNotes){
      if(e.key==='ArrowLeft') n.b=Math.max(0,r6(n.b-st)); else if(e.key==='ArrowRight') n.b=r6(n.b+st);
      else if(e.key==='ArrowUp') n.m=info.perc?clamp(n.m-1,0,info.rows-1):clamp(n.m+(e.shiftKey?12:1),0,127);
      else if(e.key==='ArrowDown') n.m=info.perc?clamp(n.m+1,0,info.rows-1):clamp(n.m-(e.shiftKey?12:1),0,127); }
    fitBars(); touch(); }
});

// acciones sobre la selección: las usan el teclado y los botones de la franja
function delSel(){ const tr=P.tracks[sel]; if(!tr||!selNotes.size) return; pushUndo(); tr.notes=tr.notes.filter(n=>!selNotes.has(n)); selNotes.clear(); touch(); renderSelInfo(); }
function dupSel(){ const tr=P.tracks[sel]; if(!tr||!selNotes.size) return; pushUndo(); const arr=[...selNotes]; let a=Infinity,b=0; for(const n of arr){ a=Math.min(a,n.b); b=Math.max(b,n.b+(n.l||.25)); }
  let sh=b-a; if(snap>0) sh=Math.ceil(sh/snap-1e-9)*snap; const copies=arr.map(n=>Object.assign(JSON.parse(JSON.stringify(n)),{b:r6(n.b+sh)})); tr.notes.push(...copies); selNotes=new Set(copies); fitBars(); touch(); renderSelInfo(); }
function shiftSel(up){ const tr=P.tracks[sel]; if(!tr||!selNotes.size) return; const info=trackInfo(tr); pushUndo(); for(const n of selNotes) n.m=info.perc?clamp(n.m+(up?-1:1),0,info.rows-1):clamp(n.m+(up?1:-1),0,127); touch(); }
$('sDup').onclick=dupSel; $('sDel').onclick=delSel; $('sUp').onclick=()=>shiftSel(true); $('sDn').onclick=()=>shiftSel(false);
// la franja y la cabecera se pliegan; en pantallas chicas arrancan cerradas (el estado se recuerda en este navegador)
function rememberKit(name,src){ try{ localStorage.setItem('demokit-kit',JSON.stringify({name,src})); return true; }catch(e){ try{ localStorage.removeItem('demokit-kit'); }catch(_){} return false; } }
function restoreKit(){ let o=null; try{ o=JSON.parse(localStorage.getItem('demokit-kit')||'null'); }catch(e){ return; } if(!o||typeof o.src!=='string') return;
  try{ const f=new Function(o.src+'\nreturn demoKit;')(), k=f(8000,.05,1); if(!k||typeof k.syn!=='function'||typeof k.mix!=='function') throw new Error('el kit no expone syn/mix'); Kit.make=f; applyStoredChar(); bumpKit(); kitName=o.name||'propio'; cache=null; dirty=true; toast('Kit «'+kitName+'» restaurado (el que cargaste antes). Lo quitas en «Demos y plugins» → «Volver al kit incluido»','ok'); }
  catch(e){ console.error(e); try{ localStorage.removeItem('demokit-kit'); }catch(_){} toast('El kit guardado no funcionó ('+e.message+'): volví al kit incluido','err'); } }
const lsGet=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, lsSet=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} }, smallScr=()=>matchMedia('(max-width:700px)').matches;
// ── carácter del kit (si el kit cargado lo soporta: demoKit.info.characters) ──
const CHAR_LBL={'':['Neutro','Sin variación añadida: el kit tal como suena de fábrica.'],organico:['Orgánico','Cada golpe y cada nota varían un poco, el filtro respira y hay saturación suave, como un equipo analógico.'],digital:['Digital','Exacto y repetible, con 12 bits y la mitad de frecuencia de muestreo: un grano retro.'],pro:['Pro','Sinte grueso por defecto (cinco voces), deriva viva, bombo con wavefolding y limitador suave en la mezcla.'],ultra:['Ultra','Como Pro, y además el filtro se abre con la fuerza de cada nota.']};
const charName=c=>(CHAR_LBL[c||'']||[c])[0];
// etiqueta «kit-carácter» para los nombres de los WAV exportados: evol-organico, ultimate-neutro, incluido…
function kitTag(){ const i=Kit.make&&Kit.make.info, L=kitChars();
  if(i&&typeof i.id==='string'){ const c=Kit.make.character; return slug(i.id)+(L.length?'-'+(c&&L.includes(c)?slug(c):'neutro'):''); }
  return kitName==='incluido'?'incluido':(slug(String(kitName).replace(/\.js$/i,'').replace(/^demo[-_ ]?kit[-_ ]?/i,''))||'kit'); }
function rememberChar(){ try{ const i=Kit.make&&Kit.make.info, c=Kit.make&&Kit.make.character; if(i&&c) localStorage.setItem('demokit-char',JSON.stringify({id:i.id,c})); else localStorage.removeItem('demokit-char'); }catch(e){} }
function applyStoredChar(){ try{ const o=JSON.parse(localStorage.getItem('demokit-char')||'null'), i=Kit.make&&Kit.make.info; if(o&&i&&o.id===i.id&&kitChars().includes(o.c)){ Kit.make.character=o.c; bumpKit(); } }catch(e){} }
function syncKitChar(){ const L=kitChars(), box=$('kitChar'); box.hidden=!L.length; if(!L.length){ $('kitCharSel').innerHTML=''; $('kitCharHint').textContent=''; return; } const sel=$('kitCharSel'); sel.innerHTML=''; for(const c of ['',...L]){ const [n,t]=CHAR_LBL[c]||[c,'']; sel.append(el('option',{value:c,text:n,title:t})); } sel.value=Kit.make.character||''; $('kitCharHint').textContent=(CHAR_LBL[sel.value]||[])[1]||''; }
function setMore(open,save){ $('rmore').hidden=!open; $('rMoreBtn').classList.toggle('on',open); $('rMoreBtn').setAttribute('aria-expanded',String(open)); if(save) lsSet('demokit-rmore',open?'1':'0'); }
$('rMoreBtn').onclick=()=>setMore($('rmore').hidden,true); { const v=lsGet('demokit-rmore'); setMore(v==null?!smallScr():v==='1'); }
const HDR=document.querySelector('header');
function setHead(open,save){ HDR.classList.toggle('hclosed',!open); $('hToggle').classList.toggle('on',open); $('hToggle').setAttribute('aria-expanded',String(open)); if(save) lsSet('demokit-head',open?'1':'0'); }
$('hToggle').onclick=()=>setHead(HDR.classList.contains('hclosed'),true); setHead(lsGet('demokit-head')==='1');

// metrónomo: clics programados por adelantado sobre el mismo reloj del audio (sigue compás, mapa de tempo, bucle y punto de inicio)
let metroT=null;
function stopMetro(){ if(metroT){ clearInterval(metroT); metroT=null; } }
function startMetro(){
  stopMetro(); if(!$('metro').checked||!playing||!playIsProject||!ctx) return;
  const A=ctx, tm=tmap(P), mm=meter(P), clicks=[]; for(let i=0;i<P.bars;i++){ const sg=mm.sigAtBar(i), b0=mm.beatOfBar(i), len=sg[0]*4/sg[1]; for(let k=0;k<sg[0];k++) clicks.push({b:b0+k*len/sg[0],acc:k===0}); }
  const per=clicks.length, loopLen=playLoop?(playLoopEnd||playDur):0, off=playOffset, t0=playStartCtx, secK=k=>tm.sec(clicks[k].b);
  const timeOf=(c,j)=>(c===0?t0-off:t0+(loopLen-off)+(c-1)*loopLen)+secK(j);
  let c=0,j=0; const adv=()=>{ j++; if(j>=per){ if(!loopLen) return false; j=0; c++; } return true; };
  for(let g=0;g<50000;g++){ if(!((c===0&&secK(j)<off-1e-6)||timeOf(c,j)<A.currentTime-.01)) break; if(!adv()) return; }   // salta lo que ya pasó
  const tick=()=>{ while(playing){ const t=timeOf(c,j); if(t>A.currentTime+.15) break; if(t>=A.currentTime-.01) clickAt(t,clicks[j].acc,.22); if(!adv()){ stopMetro(); break; } } };
  metroT=setInterval(tick,30); tick();
}
{ const v=lsGet('demokit-metro'); $('metro').checked=v==='1'; $('metro').onchange=()=>{ lsSet('demokit-metro',$('metro').checked?'1':'0'); if($('metro').checked) startMetro(); else stopMetro(); }; }
$('bKeys').onclick=()=>openModal('keysModal');
// ── Apariencia y rendimiento ──
function aprSync(){ const A=dkApr.get(); $('aprSkin').value=A.skin==='classic'?'classic':'glass'; $('aprBlur').checked=!!A.blur; $('aprFx').checked=!!A.fx; $('aprAnim').checked=!!A.anim; $('aprWarn').checked=!!A.warn; $('aprBlur').disabled=$('aprFx').disabled=A.skin==='classic'; }
$('bApr').onclick=()=>{ aprSync(); openModal('aprModal'); };
$('aprSkin').onchange=e=>{ dkApr.set('skin',e.target.value); aprSync(); };
for(const [id,k] of [['aprBlur','blur'],['aprFx','fx'],['aprAnim','anim'],['aprWarn','warn']]) $(id).onchange=e=>{ dkApr.set(k,e.target.checked); };
$('aprLite').onclick=()=>{ dkApr.set('blur',false); dkApr.set('fx',false); dkApr.set('anim',false); aprSync(); };
$('aprReset').onclick=()=>{ dkApr.reset(); aprSync(); };
let perfAsked=false;
window.__perfSlow=()=>{ const A=dkApr.get(); if(!A.warn||perfAsked||(!A.blur&&!A.fx)) return; perfAsked=true;
  const d=el('div',{class:'toast',text:'El movimiento va entrecortado. ¿Apago el desenfoque y el fondo animado?'}); const b=el('button',{class:'sm tact',text:'Apagar'}); b.onclick=()=>{ dkApr.set('blur',false); dkApr.set('fx',false); d.remove(); toast('Listo. Puedes volver a encenderlos en ⚙.','ok'); }; const n=el('button',{class:'sm tact',text:'No'}); n.onclick=()=>d.remove(); d.append(b,n); $('toasts').append(d); setTimeout(()=>d.remove(),15000); };
document.addEventListener('keydown',e=>{ if(e.key==='F1'){ e.preventDefault(); openModal('keysModal'); } });

// ───────────── pistas ─────────────
function selectTrack(i){ if(i===sel||!P.tracks[i]) return; recCloseAll(); sel=i; selNotes.clear(); for(const [j,r] of [...$('tlist').children].entries()) r.classList.toggle('sel',j===i); renderInspector(); renderSelInfo(); centerTrack(); invalidate(); }
function refreshCounts(){ [...$('tlist').children].forEach((r,i)=>{ const c=r.querySelector('.cnt'); if(c&&P.tracks[i]) c.textContent=P.tracks[i].notes.length+' notas'; }); }
function renameTrack(i,span){      // el teclado del teléfono solo se abre al tocar ✎
  const tr=P.tracks[i]; if(!tr) return; const inp=el('input',{class:'tname',value:tr.name,maxLength:40,'aria-label':'Nombre de la pista'}); span.replaceWith(inp); inp.focus(); inp.select(); let done=false;
  const fin=ok=>{ if(done) return; done=true; const v=inp.value.trim(); if(ok&&v&&v!==tr.name){ pushUndo(); tr.name=v; touch(); } renderTracks(); renderInspector(); };
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); fin(true); } else if(e.key==='Escape'){ e.preventDefault(); fin(false); } }); inp.addEventListener('blur',()=>fin(true)); inp.addEventListener('click',e=>e.stopPropagation()); }
function renderTracks(){
  const box=$('tlist'); box.innerHTML='';
  P.tracks.forEach((tr,i)=>{
    const inst=INSTRUMENTS[tr.inst];
    const row=el('div',{class:'trk'+(i===sel?' sel':''),style:inst?'border-left:3px solid '+CATS[catOf(inst)].color:'',title:inst?CATS[catOf(inst)].name:'',onclick:e=>{ if(!e.target.closest('input,button')) selectTrack(i); }},
      el('span',{class:'dot',style:'background:'+trackColor(i)}),
      (()=>{ const nm=el('span',{class:'tname',text:tr.name,title:tr.name}); return el('span',{class:'tn'},nm,el('button',{class:'sm ed',text:'✎',title:'Cambiar el nombre',onclick:e=>{ e.stopPropagation(); selectTrack(i); renameTrack(i,nm); }})); })(),
      el('span',{class:'btns'},
        el('button',{class:'sm mu'+(tr.mute?' act':''),text:'M',title:'Silenciar',onclick:e=>{ tr.mute=!tr.mute; e.target.classList.toggle('act',tr.mute); touch(); }}),
        el('button',{class:'sm sw'+(tr.solo?' act':''),text:'S',title:'Solo',onclick:e=>{ tr.solo=!tr.solo; e.target.classList.toggle('act',tr.solo); touch(); }})),
      el('span',{class:'mini'},el('span',{class:'cnt',text:tr.notes.length+' notas'}),
        el('input',{type:'range',min:0,max:1.5,step:.01,value:tr.vol,title:'Volumen',oninput:e=>{ tr.vol=+e.target.value; touch(); }})));
    if(!inst) row.title='Instrumento no disponible: '+tr.inst;
    box.append(row);
  });
}
function addTrack(instId){
  if(!INSTRUMENTS[instId]) return; const t=newTrack(instId); const base=t.name; let k=1; while(P.tracks.some(x=>x.name===t.name)) t.name=base+' '+(++k);
  P.tracks.push(t); sel=P.tracks.length-1; selNotes.clear(); renderTracks(); renderInspector(); centerTrack(); touch();
}
function populateAddInst(){
  const s=$('addInst'), cur=s.value; s.innerHTML=''; const gen=genreOf(P), afin=gen?genreInst(gen):new Set(), groups={}; for(const c of CAT_ORDER) groups[c]=[]; groups.user=[];
  for(const id of INST_ORDER){ const d=INSTRUMENTS[id]; if(d.hidden) continue; (d.user?groups.user:groups[catOf(d)]).push(d); }
  for(const g in groups){ if(!groups[g].length) continue; const og=el('optgroup',{label:g==='user'?'Plugins de usuario':CATS[g].name});
    for(const d of groups[g].slice().sort((a,b)=>(afin.has(b.id)?1:0)-(afin.has(a.id)?1:0))){ const on=afin.has(d.id), o=el('option',{value:d.id,text:(on?'● ':gen?'\u00a0\u00a0\u00a0':'')+d.name}); if(on) o.style.color=CATS[catOf(d)].color; og.append(o); }
    s.append(og); }
  if(cur&&INSTRUMENTS[cur]) s.value=cur;
}

// ───────────── inspector ─────────────
function sec(title,...kids){ return el('div',{class:'sec'},el('h4',{text:title}),...kids); }
function sliderRow(label,get,set,min,max,step,def,fmt){
  const v=get(), inp=el('input',{type:'range',min:Math.min(min,v),max:Math.max(max,v),step,value:v}), out=el('span',{class:'val'});
  const show=()=>{ out.textContent=(fmt||fmtNum)(+inp.value); };
  inp.addEventListener('input',()=>{ set(+inp.value); show(); }); inp.addEventListener('change',previewTrack);
  if(def!=null) inp.addEventListener('dblclick',()=>{ inp.value=def; set(def); show(); previewTrack(); });
  show(); return el('div',{class:'row'},el('label',{text:label,title:label}),inp,out);
}
function renderSelInfo(){ const sa=$('selAct'); if(sa) sa.hidden=!selNotes.size; const sl=$('sLyric'); if(sl) sl.hidden=!lyricInst(); const e=$('selInfo'); if(!e) return; const tr=P.tracks[sel]; e.textContent=tr?(tr.notes.length+' notas · '+selNotes.size+' seleccionadas'):''; const v=$('selVel'); if(v){ v.disabled=!selNotes.size; if(selNotes.size){ const x=[...selNotes][0].v; v.value=x==null?1:x; if(v.nextElementSibling) v.nextElementSibling.textContent=fmtNum(+v.value); } } }
function setFx(tr,g,k,v){ tr.fx=tr.fx||{}; tr.fx[g]=Object.assign({},FX_DEF[g],tr.fx[g]); tr.fx[g][k]=v; touch(); }
const FX_PRESETS={
  'Voz':{eq:{low:-3,mid:2.5,midF:3000,midQ:1,high:2},comp:{thr:-20,ratio:3,atk:8,rel:120,knee:6,makeup:3,mix:1}},
  'Bajo':{eq:{low:2,mid:-2,midF:300,midQ:1.2,high:-1},comp:{thr:-18,ratio:4,atk:20,rel:150,knee:6,makeup:3,mix:1}},
  'Bombo':{eq:{low:3,mid:-3,midF:400,midQ:1.5,high:1.5},comp:{thr:-14,ratio:4,atk:25,rel:80,knee:4,makeup:2,mix:1}},
  'Pegamento suave':{eq:null,comp:{thr:-14,ratio:2,atk:30,rel:200,knee:8,makeup:1.5,mix:1}},
  'Brillo':{eq:{low:0,mid:1.5,midF:5000,midQ:1,high:4},comp:null}};
function updateGR(){ const e=$('compGR'), tr=P.tracks[sel]; if(!e||!tr) return; const c=stemCache.get(tr.id), on=compOn(fxOf(tr).comp); e.textContent=!on?'':(c&&c.gr!=null&&c.fxKey)?('Reducción máxima: '+fmtNum(+c.gr.toFixed(1))+' dB'):'Reducción máxima: se muestra tras renderizar'; }
function fxBlock(tr){
  const T=[['1/16',.25],['1/8',.5],['1/8 punteado',.75],['1/4',1],['1/4 punteado',1.5],['1/2',2]];
  const group=(g,title,...rows)=>el('div',{class:'fxg'},
    el('label',{class:'chk fxh'},el('input',{type:'checkbox',checked:fxOf(tr)[g].on,onchange:e=>{ setFx(tr,g,'on',e.target.checked); renderInspector(); previewTrack(); }}),' '+title),
    ...(fxOf(tr)[g].on?rows:[]));
  const sl=(g,k,label,min,max,step,fmt)=>sliderRow(label,()=>fxOf(tr)[g][k],v=>setFx(tr,g,k,v),min,max,step,FX_DEF[g][k],fmt);
  const cur=fxOf(tr).delay.time, ts=el('select',{onchange:e=>{ setFx(tr,'delay','time',+e.target.value); previewTrack(); }},...T.map(([n,v])=>el('option',{value:v,text:n}))); ts.value=(T.find(x=>Math.abs(x[1]-cur)<1e-6)||T[2])[1];
  const fmtDb=v=>(v>0?'+':'')+fmtNum(v)+' dB', fmtHz=v=>v>=1000?fmtNum(+(v/1000).toFixed(2))+' kHz':Math.round(v)+' Hz', fmtMs=v=>fmtNum(v)+' ms';
  const ps=el('select',{onchange:e=>{ const p=FX_PRESETS[e.target.value]; if(!p) return; pushUndo(); tr.fx=tr.fx||{}; for(const g of ['eq','comp']){ if(p[g]) tr.fx[g]=Object.assign({},FX_DEF[g],p[g],{on:true}); else if(tr.fx[g]) tr.fx[g]=Object.assign({},tr.fx[g],{on:false}); } touch(); renderInspector(); previewTrack(); }},el('option',{value:'',text:'Elegir…'}),...Object.keys(FX_PRESETS).map(k=>el('option',{value:k,text:k})));
  const box=sec('Mezcla y efectos de la pista',
    el('p',{class:'desc',text:'Se aplican al audio de esta pista ya renderizado (EQ → compresor → delay → reverb): cambiarlos no vuelve a renderizar el instrumento. También salen en los stems.'}),
    el('div',{class:'row'},el('label',{text:'Preajuste'}),ps),
    group('eq','EQ',sl('eq','low','Graves (120 Hz)',-12,12,.5,fmtDb),sl('eq','mid','Medios',-12,12,.5,fmtDb),sl('eq','midF','Frec. medios',200,5000,10,fmtHz),sl('eq','midQ','Q de medios',.3,6,.05),sl('eq','high','Agudos (7 kHz)',-12,12,.5,fmtDb)),
    group('comp','Compresor',sl('comp','thr','Umbral',-48,0,.5,fmtDb),sl('comp','ratio','Razón',1,20,.1,v=>fmtNum(v)+':1'),sl('comp','atk','Ataque',.5,100,.5,fmtMs),sl('comp','rel','Liberación',10,800,5,fmtMs),sl('comp','knee','Codo',0,24,.5,fmtDb),sl('comp','makeup','Compensación',0,24,.5,fmtDb),sl('comp','mix','Mezcla (paralelo)',0,1,.01),el('div',{class:'hint',id:'compGR'})),
    group('delay','Delay',el('div',{class:'row'},el('label',{text:'Tiempo'}),ts),sl('delay','fb','Repeticiones',0,.92,.01),sl('delay','tone','Tono (Hz)',500,12000,50),sl('delay','mix','Mezcla',0,1,.01),
      el('label',{class:'chk',style:'margin:4px 0'},el('input',{type:'checkbox',checked:fxOf(tr).delay.pp,onchange:e=>{ setFx(tr,'delay','pp',e.target.checked); previewTrack(); }}),' ping-pong (rebota entre izquierda y derecha)')),
    group('reverb','Reverb',sl('reverb','size','Tamaño',0,1,.01),sl('reverb','damp','Amortiguación',0,1,.01),sl('reverb','mix','Mezcla',0,1,.01),sl('reverb','pre','Pre-delay (ms)',0,80,1)));
  setTimeout(updateGR,0); return box;
}
function setMaster(k,v){ P.master=Object.assign({},MASTER_DEF,P.master); P.master[k]=v; touch(); }
function masterBlock(){
  const M=()=>masterOf(P), fmtDb=v=>(v>0?'+':'')+fmtNum(v)+' dB';
  return sec('Master',el('p',{class:'desc',text:'Al final de la mezcla. Con todo neutro (0 dB, ganancia 1) no se toca el sonido original.'}),
    sliderRow('Graves (120 Hz)',()=>M().low,v=>setMaster('low',v),-12,12,.5,0,fmtDb),
    sliderRow('Agudos (7 kHz)',()=>M().high,v=>setMaster('high',v),-12,12,.5,0,fmtDb),
    sliderRow('Ganancia',()=>M().gain,v=>setMaster('gain',v),0,2,.01,1),
    el('label',{class:'chk',style:'margin:4px 0',title:'Limitador con anticipación: ningún pico pasa del techo'},el('input',{type:'checkbox',checked:M().limit,onchange:e=>setMaster('limit',e.target.checked)}),' limitador'),
    sliderRow('Techo del limitador',()=>M().ceil,v=>setMaster('ceil',v),.5,1,.01,.97));
}
function scBlock(){
  const sc=P.sc, hasT=!!sc.table, kids=[];
  kids.push(el('p',{class:'desc',text:'La música (pistas con «Ducked») baja de volumen cada vez que suena una pista marcada como disparador, normalmente el bombo.'}));
  if(hasT){ const s=el('select',{onchange:e=>{ sc.mode=e.target.value; touch(); }},el('option',{value:'table',text:'Curva de la demo (horneada)'}),el('option',{value:'param',text:'Paramétrico (pistas disparadoras)'})); s.value=sc.mode; kids.push(el('div',{class:'row'},el('label',{text:'Modo'}),s)); }
  kids.push(sliderRow('Profundidad',()=>sc.depth,v=>{ sc.depth=v; touch(); },0,.95,.01,.7));
  kids.push(sliderRow('Relajación (s)',()=>sc.rel,v=>{ sc.rel=v; touch(); },.02,.5,.01,.12));
  return sec('Sidechain del proyecto',...kids);
}
function renderInspector(){
  const box=$('insp'); box.innerHTML=''; const tr=P.tracks[sel]; refreshAutoUI(); syncKeyUI(); buildOsk();
  $('rtName').textContent=tr?(tr.name+(INSTRUMENTS[tr.inst]?' · '+INSTRUMENTS[tr.inst].name:'')):'—';
  if(!tr){ box.append(el('div',{class:'empty',text:'Agrega una pista con ＋ para empezar.'}),scBlock()); return; }
  const inst=INSTRUMENTS[tr.inst];
  if(!inst){ box.append(sec('Pista «'+tr.name+'»',el('p',{class:'desc',text:'Falta el instrumento «'+tr.inst+'» (¿un plugin no cargado?). Cárgalo desde «Demos y plugins» o «Cargar archivos…».'})),scBlock()); return; }
  const kids=[el('p',{class:'desc',text:inst.name+' — '+(inst.desc||'')}),
    sliderRow('Volumen',()=>tr.vol,v=>{ tr.vol=v; const r=$('tlist').children[sel]; if(r) r.querySelector('input[type=range]').value=v; touch(); },0,1.5,.01,1),
    sliderRow('Paneo',()=>tr.pan,v=>{ tr.pan=v; touch(); },-1,1,.01,0)];
  const chk=(txt,get,set,title)=>el('label',{class:'chk',title:title||''},el('input',{type:'checkbox',checked:get(),onchange:e=>{ set(e.target.checked); touch(); }}),txt);
  const cr=el('div',{class:'btnrow'}); if(!inst.buf) cr.append(chk('Ducked (le afecta el sidechain)',()=>tr.ducked,v=>{ tr.ducked=v; },'Escribe en el canal de la música (con sidechain) o en el de la batería (sin él)'));
  cr.append(chk('Dispara el sidechain',()=>tr.sc,v=>{ tr.sc=v; })); kids.push(cr);
  kids.push(el('div',{class:'btnrow'},
    el('button',{class:'sm',text:'Duplicar pista',onclick:()=>{ const c=JSON.parse(JSON.stringify(tr)); c.id=uid(); c.name=tr.name+' copia'; P.tracks.splice(sel+1,0,c); sel++; renderTracks(); renderInspector(); touch(); }}),
    el('button',{class:'sm danger',text:'Borrar pista',onclick:()=>{ if(tr.notes.length&&!confirm('¿Borrar «'+tr.name+'» con '+tr.notes.length+' notas?')) return; P.tracks.splice(sel,1); sel=Math.max(0,Math.min(sel,P.tracks.length-1)); selNotes.clear(); renderTracks(); renderInspector(); centerTrack(); touch(); }})));
  box.append(sec('Pista «'+tr.name+'»',...kids));
  const pk=[]; const npk=new Set(inst.noteParams||[]); const noteOv=tr.notes.filter(n=>n.o&&Object.keys(n.o).some(k=>k!=='cid'&&!npk.has(k))).length;
  if(inst.presets){ const names=Object.keys(inst.presets), ps=el('select',{onchange:e=>{ const p=inst.presets[names[+e.target.value-1]]; if(!p){ return; } for(const k in p) tr.params[k]=p[k]; touch(); renderInspector(); previewTrack(); }},el('option',{value:0,text:'Elegir…'}),...names.map((o,i)=>el('option',{value:i+1,text:o}))); pk.push(el('div',{class:'row'},el('label',{text:'Preajuste'}),ps)); }
  for(const d of inst.params){
    if(d.type==='choice'){ const vals=d.vals||d.opts.map((_,i)=>i); const s=el('select',{onchange:e=>{ tr.params[d.k]=vals[+e.target.value]; touch(); previewTrack(); }},...d.opts.map((o,i)=>el('option',{value:i,text:o}))); s.value=Math.max(0,vals.indexOf(tr.params[d.k]));
      pk.push(el('div',{class:'row'},el('label',{text:d.label}),s)); }
    else if(d.type==='text'){ pk.push(el('div',{class:'row'},el('label',{text:d.label}),el('input',{type:'text',value:tr.params[d.k]==null?'':tr.params[d.k],onchange:e=>{ tr.params[d.k]=e.target.value; touch(); }}))); }
    else pk.push(sliderRow(d.label,()=>tr.params[d.k],v=>{ tr.params[d.k]=v; touch(); },d.min,d.max,d.step,d.def));
  }
  if(tr.params.lpSrc) pk.push(el('div',{class:'hint',text:'Esta pista usa un filtro con función propia: '+tr.params.lpSrc}));
  if(noteOv) pk.push(el('div',{class:'hint',text:noteOv+' notas tienen ajustes propios (punto blanco) y no siguen estos controles.'}),
    el('div',{class:'btnrow'},el('button',{class:'sm',text:'Unificar: borrar ajustes por nota',onclick:()=>{ for(const n of tr.notes) if(n.o){ const keep={}; for(const k in n.o) if(k==='cid'||npk.has(k)) keep[k]=n.o[k]; if(Object.keys(keep).length) n.o=keep; else delete n.o; } touch(); renderInspector(); }})));
  box.append(sec('Parámetros del instrumento',...pk)); box.append(fxBlock(tr));
  const cp=['from','n','to','times'].map((k,i)=>el('input',{type:'number',min:1,value:[1,4,5,1][i],title:['desde el compás','cuántos compases','pegar en el compás','repeticiones'][i]}));
  const velRow=sliderRow('Velocidad',()=>1,v=>{ for(const n of selNotes) n.v=v; touch(); },0,1.5,.01,1); velRow.querySelector('input').id='selVel';
  box.append(sec('Notas',el('div',{id:'selInfo',class:'hint'}),
    velRow,...(inst.noteParams?[el('div',{class:'hint',text:'Por nota (solo las seleccionadas; sin selección, todas):'}),...inst.noteParams.map(k=>{ const d=inst.params.find(p=>p.k===k); if(!d) return null; const get=()=>{ const n=[...selNotes][0]; return n&&n.o&&n.o[k]!=null?n.o[k]:tr.params[k]; };
      return sliderRow(d.label+' (nota)',get,v=>{ const L=selNotes.size?[...selNotes]:tr.notes; for(const n of L){ (n.o||(n.o={}))[k]=v; } touch(); },d.min,d.max,d.step,d.def); }).filter(Boolean)]:[]),
    ...(inst.lyrics?[el('div',{class:'btnrow'},el('button',{class:'sm',text:'✎ Pegar letra…',onclick:()=>{ $('lyText').value=''; $('lyInfo').textContent=''; openModal('lyModal'); }}),el('button',{class:'sm danger',text:'Borrar letra',onclick:()=>{ if(!tr.notes.some(n=>n.w)) return; pushUndo(); for(const n of tr.notes) delete n.w; touch(); invalidate(); }}))]:[]),
    notesTools(),
    el('div',{class:'copyrow',style:'margin-top:8px'},'Copiar compás',cp[0],'×',cp[1],'→',cp[2],'repetir',cp[3],
      el('button',{class:'sm',text:'Copiar',onclick:()=>{ const [f,c,t,x]=cp.map(i=>Math.max(1,Math.round(+i.value)||1)); pushUndo(); const mmc=meter(P), b0=mmc.beatOfBar(f-1), len=mmc.beatOfBar(f-1+c)-b0; const src=tr.notes.filter(n=>n.b>=b0-1e-9&&n.b<b0+len-1e-9);
        for(let r=0;r<x;r++){ const off=mmc.beatOfBar(t-1)+r*len-b0; for(const n of src){ const k=JSON.parse(JSON.stringify(n)); k.b=r6(n.b+off); tr.notes.push(k); } }
        fitBars(); touch(); toast('Copiadas '+src.length*x+' notas','ok'); }}))));
  box.append(scBlock(),masterBlock()); renderSelInfo(); prewarm();
}

// ───────────── escalas, acordes, teclado en pantalla y herramientas de notas ─────────────
const SCALES={off:null,'Mayor':[0,2,4,5,7,9,11],'Menor natural':[0,2,3,5,7,8,10],'Menor armónica':[0,2,3,5,7,8,11],'Pentatónica mayor':[0,2,4,7,9],'Pentatónica menor':[0,3,5,7,10],'Dórica':[0,2,3,5,7,9,10],'Frigia':[0,1,3,5,7,8,10],'Mixolidia':[0,2,4,5,7,9,10],'Blues':[0,3,5,6,7,10]};
const CHORDS={off:{n:'Ninguno'},tri:{n:'Tríada',deg:[0,2,4],chr:[0,4,7]},sep:{n:'Séptima',deg:[0,2,4,6],chr:[0,4,7,10]},pow:{n:'Quinta (power)',deg:[0,4],chr:[0,7]},sus:{n:'Sus4',deg:[0,3,4],chr:[0,5,7]},oct:{n:'Octava',deg:[0,5],chr:[0,12]}};
let chordMode='off';
const KEY=()=>P.key||(P.key={root:0,scale:'off',fit:false});
const scaleOn=()=>!!SCALES[KEY().scale];
const inScale=m=>{ if(!scaleOn()) return false; const k=KEY(); return SCALES[k.scale].includes((((Math.round(m)-k.root)%12)+12)%12); };
function scaleIdx(m){ const k=KEY(), S=SCALES[k.scale], n=S.length, o=Math.floor((m-k.root)/12), r=m-k.root-12*o; let bi=0,bd=99; for(let i=0;i<=n;i++){ const s=i<n?S[i]:S[0]+12, d=Math.abs(s-r); if(d<bd){ bd=d; bi=i; } } return o*n+bi; }
function scaleMidi(i){ const k=KEY(), S=SCALES[k.scale], n=S.length, o=Math.floor(i/n); return k.root+12*o+S[((i%n)+n)%n]; }
const fitScale=m=>scaleOn()?clamp(scaleMidi(scaleIdx(Math.round(m))),0,127):m;
function chordPitches(m){ const c=CHORDS[chordMode]; if(!c||!c.deg) return [m]; if(scaleOn()){ const i=scaleIdx(Math.round(m)); return c.deg.map(d=>clamp(scaleMidi(i+d),0,127)); } return c.chr.map(d=>clamp(Math.round(m)+d,0,127)); }
function rowBg(m){ if(!scaleOn()) return isBlack(m)?'#0a0b10':'#0f1118'; const k=KEY(); if((((m-k.root)%12)+12)%12===0) return '#1d2a4a'; return inScale(m)?(isBlack(m)?'#111827':'#151e32'):(isBlack(m)?'#08090d':'#0c0e14'); }
{ const r=$('kRoot'),s=$('kScale'),c=$('kChord'); NOTE_NAMES.forEach((n,i)=>r.append(el('option',{value:i,text:n}))); for(const k of Object.keys(SCALES)) s.append(el('option',{value:k,text:k==='off'?'Ninguna':k}));
  for(const k of Object.keys(CHORDS)) c.append(el('option',{value:k,text:CHORDS[k].n}));
  r.onchange=()=>{ KEY().root=+r.value; touch(); buildOsk(); }; s.onchange=()=>{ KEY().scale=s.value; touch(); buildOsk(); }; $('kFit').onchange=e=>{ KEY().fit=e.target.checked; touch(); }; c.onchange=()=>{ chordMode=c.value; }; }
function syncKeyUI(){ const k=KEY(), gen=genreOf(P); $('kRoot').value=k.root; $('kFit').checked=!!k.fit;
  for(const o of $('kScale').options){ const af=!!gen&&gen.keys.includes(o.value); o.textContent=(af?'● ':gen?'\u00a0\u00a0\u00a0':'')+(o.value==='off'?'Ninguna':o.value); o.style.color=af?'#f3e3a0':''; } $('kScale').value=k.scale; }
// teclado en pantalla
let oskOn=false;
function buildOsk(){ const box=$('osk'); box.hidden=!oskOn; $('bOsk').classList.toggle('on',oskOn); if(!oskOn) return; box.innerHTML=''; const tr=P.tracks[sel]; if(!tr||!INSTRUMENTS[tr.inst]) return; const info=trackInfo(tr);
  const press=(k,id,m)=>{ k.dataset.m=m; k.onpointerdown=e=>{ e.preventDefault(); try{ k.setPointerCapture(e.pointerId); }catch(_){} k.classList.add('on'); liveOn(id,m,.85); }; const up=()=>{ k.classList.remove('on'); liveOff(id); }; k.onpointerup=up; k.onpointercancel=up; };
  if(info.perc){ for(let i=0;i<info.rows;i++){ const p=el('div',{class:'pad',text:(info.lanes[i]&&info.lanes[i].name)||'Golpe'}); press(p,'osk'+i,i); box.append(p); } return; }
  const lo=baseOct, hi=Math.min(127,baseOct+24);
  for(let m=lo;m<=hi;m++){ const pc=((m%12)+12)%12;
    if(isBlack(m)){ const w=el('span',{class:'bk'}),i=el('i',{title:midiName(m)}); press(i,'osk'+m,m); w.append(i); box.append(w); }
    else { const k=el('div',{class:'wk'+(inScale(m)?' sc':''),text:pc===0?midiName(m):''}); press(k,'osk'+m,m); box.append(k); } } }
$('bOsk').onclick=()=>{ oskOn=!oskOn; buildOsk(); };
// edición de notas: transponer, cuantizar, forzar a escala, copiar / pegar entre pistas
let noteClip=null;
const editNotes=()=>{ const tr=P.tracks[sel]; if(!tr) return []; return selNotes.size?[...selNotes]:tr.notes; };
function transposeSel(d){ const tr=P.tracks[sel]; if(!tr||trackInfo(tr).perc){ toast('La percusión no se transpone','err'); return; } const L=editNotes(); if(!L.length) return; pushUndo(); for(const n of L) n.m=clamp(n.m+d,0,127); touch(); renderSelInfo(); }
function quantizeSel(){ const tr=P.tracks[sel]; if(!tr) return; if(!(snap>0)){ toast('Elige una rejilla (no «libre») para cuantizar','err'); return; } const L=editNotes(); if(!L.length) return; pushUndo();
  for(const n of L){ n.b=Math.max(0,r6(Math.round(n.b/snap)*snap)); if(n.l!=null&&!(INSTRUMENTS[tr.inst]||{}).oneShot) n.l=Math.max(snap,r6(Math.round(n.l/snap)*snap)); } fitBars(); touch(); toast('Cuantizadas '+L.length+' notas a '+$('snap').selectedOptions[0].text,'ok'); }
function fitSel(){ const tr=P.tracks[sel]; if(!tr||trackInfo(tr).perc) return; if(!scaleOn()){ toast('Elige una escala primero','err'); return; } const L=editNotes(); if(!L.length) return; pushUndo(); for(const n of L) n.m=fitScale(n.m); touch(); }
function copySel(){ const tr=P.tracks[sel]; if(!tr||!selNotes.size){ toast('Selecciona notas para copiar','err'); return; } const L=[...selNotes], b0=Math.min(...L.map(n=>n.b)); noteClip={perc:trackInfo(tr).perc,notes:L.map(n=>Object.assign(JSON.parse(JSON.stringify(n)),{b:r6(n.b-b0)}))}; toast('Copiadas '+L.length+' notas','ok'); }
function pasteSel(){ const tr=P.tracks[sel]; if(!tr||!noteClip){ toast('No hay nada copiado','err'); return; } const info=trackInfo(tr); if(noteClip.perc!==info.perc&&!confirm('El origen y el destino son de distinto tipo (percusión / melódico): los tonos no coinciden. ¿Pegar igual?')) return;
  pushUndo(); const b0=snap>0?Math.round(cursorBeat/snap)*snap:cursorBeat, add=noteClip.notes.map(n=>{ const k=JSON.parse(JSON.stringify(n)); k.b=r6(n.b+b0); if(k.o&&k.o.cid) delete k.o; k.m=info.perc?clamp(Math.round(k.m),0,info.rows-1):clamp(k.m,0,127); return k; });
  tr.notes.push(...add); selNotes=new Set(add); fitBars(); touch(); renderSelInfo(); toast('Pegadas '+add.length+' notas en el compás '+(meter(P).barAt(b0).i+1),'ok'); }
function notesTools(){ const b=(t,f,title)=>el('button',{class:'sm',text:t,title:title||'',onclick:f}); const row=(...k)=>el('div',{class:'btnrow',style:'margin-top:6px'},...k);
  return el('div',{},el('div',{class:'hint',text:'Actúan sobre las notas seleccionadas (o toda la pista si no hay selección).'}),
    row(el('span',{class:'hint',text:'Transponer'}),b('−12',()=>transposeSel(-12)),b('−1',()=>transposeSel(-1)),b('+1',()=>transposeSel(1)),b('+12',()=>transposeSel(12))),
    row(b('Cuantizar',quantizeSel,'Alinea inicios y largos a la rejilla actual'),b('Forzar a escala',fitSel,'Mueve cada nota a la más cercana de la escala elegida')),
    row(b('Copiar  (Ctrl+C)',copySel),b('Pegar en el cursor  (Ctrl+V)',pasteSel,'Pega en la pista activa, incluso si copiaste de otra'))); }
document.addEventListener('keydown',e=>{ const tg=e.target&&e.target.tagName; if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT'||modalOpen()) return; if(!(e.ctrlKey||e.metaKey)) return; const k=e.key.toLowerCase();
  if(k==='c'){ e.preventDefault(); copySel(); } else if(k==='v'){ e.preventDefault(); pasteSel(); } });

// ───────────── automatización (carril bajo el piano roll) ─────────────
let autoKey='vol', autoShow=false, autoDrag=null; const acv=$('acv'), AP=10;
const fxLaneFmt=(k,v)=>{ const u=FX_LANES[k].unit; return u==='dB'?(v>0?'+':'')+fmtNum(+(+v).toFixed(1))+' dB':u==='Hz'?(v>=1000?fmtNum(+(v/1000).toFixed(2))+' kHz':Math.round(v)+' Hz'):(+v).toFixed(2); };
const autoFmt=(k,v)=>k.slice(0,3)==='fx:'?fxLaneFmt(k,v):k.slice(0,2)==='p:'?String(+(+v).toFixed(3)):k==='vol'||k==='vel'?v.toFixed(2):k==='pan'?(Math.abs(v)<.02?'C':(v<0?'L':'R')+Math.round(Math.abs(v)*100)):(cutHz(v)>=1000?(cutHz(v)/1000).toFixed(1)+' kHz':Math.round(cutHz(v))+' Hz');
const VEL_DEF={min:0,max:1.5,def:1,label:'Velocidad'}; const pdef=k=>{ const tr=P.tracks[sel], d=tr&&paramDef(INSTRUMENTS[tr.inst],k.slice(2)); return d?{min:d.min,max:d.max,def:d.def,step:d.step,label:d.label||d.k}:null; };
const fxdef=k=>{ const d=FX_LANES[k], tr=P.tracks[sel]; return d?{min:d.min,max:d.max,def:tr?fxOf(tr)[d.g][d.k]:d.min,step:d.unit==='dB'?.5:d.unit==='Hz'?10:.01,label:d.label}:AUTO_DEF.vol; };
const adef=k=>k==='vel'?VEL_DEF:k.slice(0,3)==='fx:'?fxdef(k):k.slice(0,2)==='p:'?(pdef(k)||AUTO_DEF.vol):AUTO_DEF[k]||AUTO_DEF.vol;
const autoY=(k,v,H)=>{ const d=adef(k); return AP+(1-(v-d.min)/(d.max-d.min))*(H-2*AP); };
const autoV=(k,y,H)=>{ const d=adef(k); let v=d.min+(1-(y-AP)/(H-2*AP))*(d.max-d.min); v=clamp(v,d.min,d.max); if(k.slice(0,2)==='p:'||k.slice(0,3)==='fx:'){ const st=d.step>0?d.step:.01; return +(Math.round(v/st)*st).toFixed(5); } v=Math.round(v*100)/100; if(k==='pan'&&Math.abs(v)<.04) v=0; return v; };
function refreshAutoUI(){ const tr=P.tracks[sel], s=$('autoK'); let cur=autoKey; s.innerHTML='';
  s.append(el('option',{value:'vel',text:'Velocidad de notas'})); for(const k of Object.keys(AUTO_DEF)){ const n=tr&&tr.auto&&tr.auto[k]?tr.auto[k].length:0; s.append(el('option',{value:k,text:AUTO_DEF[k].label+(n?' ●'+n:'')})); } const inst=tr&&INSTRUMENTS[tr.inst], ps=inst?inst.params.filter(d=>(d.type||'num')==='num'&&d.max>d.min):[];
  if(ps.length){ const g=el('optgroup',{label:'Parámetros del instrumento'}); for(const d of ps){ const L=tr.auto&&tr.auto['p:'+d.k], n=L?L.length:0; g.append(el('option',{value:'p:'+d.k,text:(d.label||d.k)+(n?' ●'+n:'')})); } s.append(g); }
  { const g=el('optgroup',{label:'Efectos de la pista'}); for(const k of Object.keys(FX_LANES)){ const L=tr&&tr.auto&&tr.auto[k], n=L?L.length:0; g.append(el('option',{value:k,text:FX_LANES[k].label+(n?' ●'+n:'')})); } s.append(g); }
  if(cur.slice(0,2)==='p:'&&!ps.some(d=>'p:'+d.k===cur)) autoKey=cur='vol';
  s.value=cur; const isP=cur.slice(0,2)==='p:', hasLanes=!!(tr&&inst&&paramLanes(tr,inst).length), isBake=!!(tr&&tr.bakeOf);
  $('autoLv').hidden=!isP; $('autoLv').value=tr&&tr.alv===16?'16':'8'; $('autoBake').hidden=!hasLanes; $('autoUnbake').hidden=!isBake;
  $('autoCtl').hidden=!autoShow; $('awrap').hidden=!autoShow; $('autoOn').classList.toggle('on',autoShow); }
function autoList(create){ const tr=P.tracks[sel]; if(!tr) return null; if(!tr.auto){ if(!create) return null; tr.auto={}; } if(!tr.auto[autoKey]){ if(!create) return null; tr.auto[autoKey]=[]; } return tr.auto[autoKey]; }
function drawAuto(ph){
  if(!autoShow) return; const W=wrap.clientWidth, H=124, dpr=window.devicePixelRatio||1; if(!W) return;
  if(acv.width!==Math.round(W*dpr)||acv.height!==Math.round(H*dpr)){ acv.width=Math.round(W*dpr); acv.height=Math.round(H*dpr); acv.style.width=W+'px'; }
  const g=acv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.fillStyle='#0d0f14'; g.fillRect(0,0,W,H); const sx=wrap.scrollLeft, k=autoKey, d=adef(k), tr=P.tracks[sel];
  let sub=snap>0?snap:.25; while(sub*BW<7) sub*=2; const b0=Math.floor(sx/BW), b1=Math.ceil((sx+W-KW)/BW);
  for(let i=Math.floor(b0/sub);i<=Math.ceil(b1/sub);i++){ const bt=i*sub,x=Math.round(KW+bt*BW-sx)+.5; if(x<KW) continue; const bar=Math.abs(bt-meter(P).barAt(bt).start)<1e-9, beat=Math.abs(bt-Math.round(bt))<1e-9; g.fillStyle=bar?'#4a5378':beat?'#2c3246':'#1f2433'; g.fillRect(x,0,1,H); }
  const endX=KW+meter(P).total(P.bars)*BW-sx; if(endX<W){ g.fillStyle='#00000066'; g.fillRect(Math.max(KW,endX),0,W,H); }
  const yd=Math.round(autoY(k,d.def,H))+.5; g.strokeStyle='#2f3548'; g.setLineDash([3,4]); g.beginPath(); g.moveTo(KW,yd); g.lineTo(W,yd); g.stroke(); g.setLineDash([]);
  g.fillStyle='#12141b'; g.fillRect(0,0,KW,H); g.fillStyle='#aab3c9'; g.font='10px system-ui'; g.fillText(d.label,6,14); g.fillText(autoFmt(k,d.max),6,AP+10); g.fillText(autoFmt(k,d.min),6,H-AP+10);
  const pts=k==='vel'?[]:(tr&&tr.auto&&tr.auto[k]?tr.auto[k].slice().sort((a,b)=>a.b-b.b):[]);
  g.save(); g.beginPath(); g.rect(KW,0,W-KW,H); g.clip();
  if(k==='vel'){ const col=trackColor(sel,1), y0=autoY(k,0,H); for(const n of (tr?tr.notes:[])){ const x=KW+n.b*BW-sx; if(x<KW-6||x>W) continue; const v=n.v==null?1:n.v, y=autoY(k,v,H); g.fillStyle=selNotes.has(n)?'#fff':col; g.fillRect(x-2,y,5,y0-y); g.beginPath(); g.arc(x+.5,y,4,0,7); g.fill(); }
    if(autoDrag&&autoDrag.vel){ const n=autoDrag.vel[0], x=KW+n.b*BW-sx, y=autoY(k,n.v==null?1:n.v,H); g.fillStyle='#e8eaf0'; g.font='11px system-ui'; g.fillText((n.v==null?1:n.v).toFixed(2),Math.min(x+8,W-50),Math.max(12,y-8)); }
    if(!tr||!tr.notes.length){ g.fillStyle='#6b7388'; g.font='12px system-ui'; g.fillText('Esta pista no tiene notas. Arrastra las puntas de las barras para cambiar la velocidad.',KW+12,H/2); } }
  else if(pts.length){ const col=trackColor(sel,1);
    if(k.slice(0,2)==='p:'){ const LV=tr.alv===16?16:8; g.strokeStyle='#ffffff14'; for(let i=0;i<LV;i++){ const y=Math.round(autoY(k,d.min+(d.max-d.min)*i/(LV-1),H))+.5; g.beginPath(); g.moveTo(KW,y); g.lineTo(W,y); g.stroke(); } } g.strokeStyle=col; g.lineWidth=2; g.beginPath(); g.moveTo(KW,autoY(k,pts[0].v,H));
    for(const p of pts) g.lineTo(KW+p.b*BW-sx,autoY(k,p.v,H)); g.lineTo(W,autoY(k,pts[pts.length-1].v,H)); g.stroke(); g.lineWidth=1;
    for(const p of pts){ const x=KW+p.b*BW-sx,y=autoY(k,p.v,H); g.fillStyle=autoDrag&&autoDrag.p===p?'#fff':col; g.beginPath(); g.arc(x,y,4.5,0,7); g.fill(); }
    if(k.slice(0,2)==='p:'){ const LV=tr.alv===16?16:8, dd=paramDef(INSTRUMENTS[tr.inst],k.slice(2)); if(dd){ g.strokeStyle='#e8eaf0'; for(const n of tr.notes){ const x=KW+n.b*BW-sx; if(x<KW-6||x>W) continue; const y=autoY(k,stepVal(dd,autoValue(pts,n.b),LV),H); g.beginPath(); g.arc(x,y,3,0,7); g.stroke(); } } }
    if(autoDrag){ const p=autoDrag.p,x=KW+p.b*BW-sx,y=autoY(k,p.v,H); g.fillStyle='#e8eaf0'; g.font='11px system-ui'; g.fillText(autoFmt(k,p.v),Math.min(x+8,W-70),Math.max(12,y-8)); } }
  else { g.fillStyle='#6b7388'; g.font='12px system-ui'; g.fillText('Sin curva: el parámetro queda fijo. Haz clic para poner el primer punto.',KW+12,H/2); }
  if(k.slice(0,3)==='fx:'&&tr&&!fxOf(tr)[FX_LANES[k].g].on){ g.fillStyle='#ffb86b'; g.font='11px system-ui'; g.textAlign='right'; g.fillText('«'+({eq:'EQ',comp:'Compresor',delay:'Delay',reverb:'Reverb'})[FX_LANES[k].g]+'» está apagado: enciéndelo en el panel de la pista para que la curva actúe',W-8,14); g.textAlign='left'; }
  g.restore();
  const cx=KW+cursorBeat*BW-sx; if(cx>=KW){ g.strokeStyle='#8fa8ff'; g.setLineDash([4,4]); g.beginPath(); g.moveTo(cx+.5,0); g.lineTo(cx+.5,H); g.stroke(); g.setLineDash([]); }
  if(ph!=null){ const x=KW+ph*BW-sx; if(x>=KW){ g.fillStyle='#ff7ab8'; g.fillRect(x-1,0,2,H); } }
}
function autoNear(e){ const r=acv.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top, L=autoList(false); let best=null,bd=1e9;
  if(L) for(const p of L){ const dx=KW+p.b*BW-wrap.scrollLeft-px, dy=autoY(autoKey,p.v,r.height)-py, dd=Math.hypot(dx,dy); if(dd<10&&dd<bd){ best=p; bd=dd; } } return {p:best,px,py,H:r.height}; }
function velTargets(e){ const tr=P.tracks[sel]; if(!tr) return null; const r=acv.getBoundingClientRect(), px=e.clientX-r.left; let best=null,bd=1e9; for(const n of tr.notes){ const d=Math.abs(KW+n.b*BW-wrap.scrollLeft-px); if(d<bd){ bd=d; best=n; } } if(!best||bd>8) return null;
  return selNotes.has(best)?[...selNotes]:tr.notes.filter(n=>Math.abs(n.b-best.b)<1e-6); }
function velSet(e){ const r=acv.getBoundingClientRect(); const v=autoV('vel',e.clientY-r.top,r.height); for(const n of autoDrag.vel) n.v=v; const s=$('selVel'); touch(); renderSelInfo(); }
acv.addEventListener('pointerdown',e=>{ if(e.button!==0) return; const tr=P.tracks[sel]; if(!tr) return; if(autoKey==='vel'){ const T=velTargets(e); if(!T) return; acv.setPointerCapture(e.pointerId); pushUndo(); autoDrag={vel:T}; velSet(e); return; } const h=autoNear(e); if(h.px<KW) return; acv.setPointerCapture(e.pointerId); pushUndo();
  let p=h.p; if(!p){ const L=autoList(true); p={b:Math.max(0,snapB(pxToBeat(h.px))),v:autoV(autoKey,h.py,h.H)}; L.push(p); }
  autoDrag={p}; touch(); refreshAutoUI(); });
acv.addEventListener('pointermove',e=>{ if(autoKey==='vel'){ if(autoDrag&&autoDrag.vel) velSet(e); else acv.style.cursor=velTargets(e)?'ns-resize':'default'; return; } const h=autoNear(e); if(!autoDrag){ acv.style.cursor=h.p?'grab':'crosshair'; return; }
  autoDrag.p.b=Math.max(0,r6(snapB(pxToBeat(h.px)))); autoDrag.p.v=autoV(autoKey,h.py,h.H); touch(); });
const autoEnd=()=>{ if(!autoDrag) return; const wasVel=!!autoDrag.vel; autoDrag=null; const L=wasVel?null:autoList(false); if(L) L.sort((a,b)=>a.b-b.b); invalidate(); };
acv.addEventListener('pointerup',autoEnd); acv.addEventListener('pointercancel',autoEnd);
function autoDel(e){ e.preventDefault(); if(autoKey==='vel') return; const h=autoNear(e); if(!h.p) return; pushUndo(); const L=autoList(false), tr=P.tracks[sel]; L.splice(L.indexOf(h.p),1); if(!L.length){ delete tr.auto[autoKey]; if(!Object.keys(tr.auto).length) delete tr.auto; } touch(); refreshAutoUI(); }
acv.addEventListener('dblclick',autoDel); acv.addEventListener('contextmenu',autoDel);
$('autoLv').onchange=e=>{ const tr=P.tracks[sel]; if(!tr) return; pushUndo(); if(e.target.value==='16') tr.alv=16; else delete tr.alv; touch(); invalidate(); };
$('autoBake').onclick=()=>{ const tr=P.tracks[sel]; if(!tr) return; let notes=tr.notes.filter(n=>selNotes.has(n)); const all=!notes.length;
  if(all){ notes=tr.notes.slice(); if(!notes.length){ toast('Esta pista no tiene notas','err'); return; } if(!confirm('Sin notas seleccionadas: se hornearán las '+notes.length+' notas de «'+tr.name+'». Cada nota se renderiza varias veces y el clip pesa al guardar el proyecto. ¿Continuar?')) return; }
  try{ pushUndo(); const r=bakeTrackNotes(P,tr,notes); selNotes.clear(); renderTracks(); renderInspector(); layoutSpacer(); touch(); invalidate();
    toast('Horneadas '+r.baked+' nota(s)'+(r.shared?' ('+r.shared+' comparten clip)':'')+' en «'+r.track.name+'» · +'+(r.bytes/1048576).toFixed(2)+' MB al guardar. «Deshornear» las devuelve a la pista original.','ok'); }
  catch(e){ console.error(e); toast('No pude hornear: '+e.message,'err'); } };
$('autoUnbake').onclick=()=>{ const bt=P.tracks[sel]; if(!bt||!bt.bakeOf) return; let notes=bt.notes.filter(n=>selNotes.has(n)); if(!notes.length) notes=bt.notes.slice();
  try{ pushUndo(); const n=unbakeTrackNotes(P,bt,notes); selNotes.clear(); sel=Math.max(0,Math.min(sel,P.tracks.length-1)); const src=P.tracks.findIndex(x=>x.id===bt.bakeOf); if(src>=0) sel=src; renderTracks(); renderInspector(); layoutSpacer(); centerTrack(); touch(); invalidate(); toast('Deshorneadas '+n+' nota(s)','ok'); }
  catch(e){ console.error(e); toast('No pude deshornear: '+e.message,'err'); } };
$('autoOn').onclick=()=>{ autoShow=!autoShow; refreshAutoUI(); invalidate(); };
$('autoK').onchange=e=>{ autoKey=e.target.value; refreshAutoUI(); invalidate(); };
$('autoClr').onclick=()=>{ const tr=P.tracks[sel]; if(autoKey==='vel'){ if(!tr||!tr.notes.length) return; pushUndo(); for(const n of tr.notes) n.v=1; touch(); renderSelInfo(); return; } if(!tr||!autoList(false)) return; pushUndo(); delete tr.auto[autoKey]; if(!Object.keys(tr.auto).length) delete tr.auto; touch(); refreshAutoUI(); };

// ───────────── pista de tempo (cambios de tempo y rampas) ─────────────
let tempoShow=false, tSel=null, tDrag=null, tMode='bpm', sS=null, mS=null, mDrag=null; const tcv=$('tcv'), TH=84, TP=10;
const MARK_QUICK=['Intro','Verso','Pre-coro','Coro','Puente','Drop','Break','Outro'];
const tList=create=>{ if(!P.tempo){ if(!create) return []; P.tempo=[]; } return P.tempo; };
const tRange=()=>{ const v=[P.bpm,...tList(false).map(p=>p.bpm)], mn=Math.min(...v), mx=Math.max(...v); return {lo:Math.max(20,Math.min(60,Math.floor(mn/10)*10-10)),hi:Math.min(400,Math.max(180,Math.ceil(mx/10)*10+10))}; };
const tY=(bpm,R)=>TP+(1-(bpm-R.lo)/(R.hi-R.lo))*(TH-2*TP);
const tBpmAt=(y,R)=>Math.round(clamp(R.lo+(1-(y-TP)/(TH-2*TP))*(R.hi-R.lo),20,400));
function refreshTempoUI(){ $('tbar').hidden=!tempoShow; $('twrap').hidden=!tempoShow; $('tempoOn').classList.toggle('on',tempoShow||tList(false).length>0||sigPts(P).length>0||(P.marks||[]).length>0);
  const L=tList(false); if(tSel&&tSel!=='init'&&!L.includes(tSel)) tSel=null; if(sS&&sS!=='init'&&!(P.sigs||[]).includes(sS)) sS=null; if(mS&&!(P.marks||[]).includes(mS)) mS=null;
  $('tabBpm').classList.toggle('on',tMode==='bpm'); $('tabSig').classList.toggle('on',tMode==='sig'); $('tabMark').classList.toggle('on',tMode==='mark'); $('tHint').hidden=tMode!=='bpm'; $('sHint').hidden=tMode!=='sig'; $('sCtl').hidden=tMode!=='sig'; $('mHint').hidden=tMode!=='mark'; $('mCtl').hidden=tMode!=='mark';
  if(tMode==='mark'){ if(mS&&document.activeElement!==$('mName')) $('mName').value=mS.name; $('mInfo').textContent=mS?'desde el compás '+(mS.bar+1)+' · ':'elige una marca o haz clic en la pista para poner una · '; $('mDelBtn').disabled=!mS; }
  if(tMode==='sig'){ if(sS){ const sg=sS==='init'?P.sig:sS.sig; $('sSel').value=sg[0]+'/'+sg[1]; } $('sInfo').textContent=sS?(sS==='init'?'inicial · ':'desde el compás '+(sS.bar+1)+' · '):'elige un compás y haz clic en la pista para ponerlo · '; $('sDelSig').disabled=!sS||sS==='init'; }
  $('tCtl').hidden=!tSel||tMode!=='bpm';
  if(tSel){ const init=tSel==='init', b=init?0:tSel.b; $('tInfo').textContent=(init?'inicial':'pulso '+fmtNum(b)+' (compás '+(meter(P).barAt(b).i+1)+')')+' · '; $('tBpm').value=init?P.bpm:tSel.bpm; $('tRamp').checked=!init&&!!tSel.ramp; $('tRamp').disabled=init; $('tDel').disabled=init; } }
function drawTempo(ph){
  if(!tempoShow) return; const W=wrap.clientWidth, H=TH, dpr=window.devicePixelRatio||1; if(!W) return;
  if(tcv.width!==Math.round(W*dpr)||tcv.height!==Math.round(H*dpr)){ tcv.width=Math.round(W*dpr); tcv.height=Math.round(H*dpr); tcv.style.width=W+'px'; }
  const g=tcv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.fillStyle='#0d0f14'; g.fillRect(0,0,W,H); const sx=wrap.scrollLeft, R=tDrag?tDrag.R:tRange(), tm=tmap(P);
  let sub=snap>0?snap:.25; while(sub*BW<7) sub*=2; const b0=Math.floor(sx/BW), b1=Math.ceil((sx+W-KW)/BW);
  for(let i=Math.floor(b0/sub);i<=Math.ceil(b1/sub);i++){ const bt=i*sub,x=Math.round(KW+bt*BW-sx)+.5; if(x<KW) continue; const bar=Math.abs(bt-meter(P).barAt(bt).start)<1e-9, beat=Math.abs(bt-Math.round(bt))<1e-9; g.fillStyle=bar?'#4a5378':beat?'#2c3246':'#1f2433'; g.fillRect(x,0,1,H); }
  const endX=KW+meter(P).total(P.bars)*BW-sx; if(endX<W){ g.fillStyle='#00000066'; g.fillRect(Math.max(KW,endX),0,W,H); }
  for(let v=Math.ceil(R.lo/20)*20;v<=R.hi;v+=20){ const y=Math.round(tY(v,R))+.5; g.fillStyle='#1c202c'; g.fillRect(KW,y,W-KW,1); }
  g.fillStyle='#12141b'; g.fillRect(0,0,KW,H); g.fillStyle='#aab3c9'; g.font='10px system-ui'; if(tMode==='bpm'){ g.fillText('Tempo',6,14); g.fillText(R.hi+' BPM',6,TP+10); g.fillText(R.lo+' BPM',6,H-TP+10); } else g.fillText(tMode==='sig'?'Compás':'Sección',6,14);
  drawMarkLane(g,W,H,sx);
  g.save(); g.beginPath(); g.rect(KW,0,W-KW,H); g.clip(); g.globalAlpha=tMode==='bpm'?1:.22;
  g.strokeStyle='#ffb86b'; g.lineWidth=2; g.beginPath(); for(let x=KW;x<=W;x++){ const y=tY(tm.bpmAt((x-KW+sx)/BW),R); if(x===KW) g.moveTo(x,y); else g.lineTo(x,y); } g.stroke(); g.lineWidth=1;
  const pts=[{init:true,b:0,bpm:P.bpm},...tList(false)];
  for(const p of pts){ const x=KW+p.b*BW-sx, y=tY(p.bpm,R); if(x<KW-8||x>W+8) continue; const sel=(p.init&&tSel==='init')||p===tSel; g.fillStyle=sel?'#fff':'#ffb86b';
    g.beginPath(); if(p.init){ g.moveTo(x,y-6); g.lineTo(x+6,y); g.lineTo(x,y+6); g.lineTo(x-6,y); g.closePath(); } else g.arc(x,y,p.ramp?5:4.5,0,7); g.fill();
    if(p.ramp&&!p.init){ g.strokeStyle='#0d0f14'; g.beginPath(); g.moveTo(x-2.5,y+2); g.lineTo(x+2.5,y-2); g.stroke(); }
    g.fillStyle='#e8eaf0'; g.font='10px system-ui'; g.fillText(String(p.bpm),Math.min(x+8,W-30),Math.max(11,y-8)); }
  g.globalAlpha=tMode==='sig'?1:.22; { const mm=meter(P); g.font='11px system-ui';
    for(const p of [{init:true,bar:0,sig:P.sig||[4,4]},...sigPts(P)]){ const x=KW+mm.beatOfBar(p.bar)*BW-sx; if(x<KW-60||x>W+8) continue; const sel=(p.init&&sS==='init')||p===sS, txt=p.sig[0]+'/'+p.sig[1], w=g.measureText(txt).width+10;
      g.fillStyle=sel?'#fff':'#7ad7ff'; g.fillRect(Math.round(x)-1,0,2,H); g.fillRect(Math.round(x),4,w,17); g.fillStyle='#0d0f14'; g.fillText(txt,x+5,16); } }
  g.globalAlpha=1; g.restore();
  const cx=KW+cursorBeat*BW-sx; if(cx>=KW){ g.strokeStyle='#8fa8ff'; g.setLineDash([4,4]); g.beginPath(); g.moveTo(cx+.5,0); g.lineTo(cx+.5,H); g.stroke(); g.setLineDash([]); }
  if(ph!=null){ const x=KW+ph*BW-sx; if(x>=KW){ g.fillStyle='#ff7ab8'; g.fillRect(x-1,0,2,H); } }
}
// secciones en la pista de tempo: franjas translúcidas con etiqueta abajo (a todo color solo en la pestaña Sección)
function drawMarkLane(g,W,H,sx){
  const L=markPts(P); if(!L.length) return; const mm=meter(P), act=tMode==='mark', end=mm.total(P.bars);
  g.save(); g.beginPath(); g.rect(KW,0,W-KW,H); g.clip(); g.font='600 10px system-ui';
  for(let i=0;i<L.length;i++){ const m=L[i]; if(m.bar>=P.bars) break; const b0=mm.beatOfBar(m.bar), b1=i+1<L.length&&L[i+1].bar<P.bars?mm.beatOfBar(L[i+1].bar):end, x0=KW+b0*BW-sx, x1=KW+b1*BW-sx; if(x1<KW||x0>W) continue;
    const col=markColor(m), sel=m===mS;
    g.globalAlpha=act?.2:.09; g.fillStyle=col; g.fillRect(x0,0,Math.max(1,x1-x0),H);
    g.globalAlpha=act?1:.45; g.fillStyle=sel?'#fff':col; g.fillRect(Math.round(x0),0,2,H);
    const tw=Math.min(g.measureText(m.name).width+10,Math.max(0,x1-x0-4)); if(tw>14){ g.fillRect(Math.round(x0)+2,H-19,tw,15); g.fillStyle='#0d0f14'; g.save(); g.beginPath(); g.rect(x0+2,H-19,tw,15); g.clip(); g.fillText(m.name,x0+7,H-8); g.restore(); } }
  g.restore();
}
function tNear(e){ const r=tcv.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top, R=tDrag?tDrag.R:tRange(); let best=null,bd=1e9;
  for(const p of [{init:true,b:0,bpm:P.bpm},...tList(false)]){ const dd=Math.hypot(KW+p.b*BW-wrap.scrollLeft-px,tY(p.bpm,R)-py); if(dd<11&&dd<bd){ best=p; bd=dd; } } return {p:best,px,py,R}; }
tcv.addEventListener('pointerdown',e=>{ if(e.button!==0) return; if(tMode==='sig') return sigDown(e); if(tMode==='mark') return markDown(e); const h=tNear(e); if(h.px<KW) return; try{ tcv.setPointerCapture(e.pointerId); }catch(_){}
  pushUndo(); let p=h.p;
  if(!p){ const b=Math.max(0,snapB(pxToBeat(h.px))); if(b<=1e-9){ tcv.releasePointerCapture&&0; return; } p={b:r6(b),bpm:tBpmAt(h.py,h.R),ramp:false}; tList(true).push(p); }
  tSel=p.init?'init':p; tDrag={p,R:h.R}; touch(); refreshTempoUI(); });
tcv.addEventListener('pointermove',e=>{ if(tMode==='sig') return sigMove(e); if(tMode==='mark') return markMove(e); const h=tNear(e); if(!tDrag){ tcv.style.cursor=h.p?'grab':'crosshair'; return; }
  const d=tDrag.p, bpm=tBpmAt(h.py,tDrag.R); if(d.init){ P.bpm=clamp(bpm,40,260); $('bpm').value=P.bpm; } else { d.bpm=bpm; d.b=Math.max(.25,r6(snapB(pxToBeat(h.px)))); }
  touch(); refreshTempoUI(); });
const tEnd=()=>{ if(mDrag){ mDrag=null; if(P.marks) P.marks.sort((a,b)=>a.bar-b.bar); invalidate(); return; } if(sDrag){ sDrag=null; layoutSpacer(); invalidate(); prewarm(); return; } if(!tDrag) return; tDrag=null; if(P.tempo) P.tempo.sort((a,b)=>a.b-b.b); invalidate(); prewarm(); };
tcv.addEventListener('pointerup',tEnd); tcv.addEventListener('pointercancel',tEnd);
function tDelete(p){ const L=tList(false), i=L.indexOf(p); if(i<0) return; pushUndo(); L.splice(i,1); if(!L.length) delete P.tempo; if(tSel===p) tSel=null; touch(); refreshTempoUI(); }
const tDel2=e=>{ e.preventDefault(); if(tMode==='mark'){ const h=mNear(e); if(h.p) mDelete(h.p); return; } if(tMode==='sig'){ const h=sNear(e); if(h.p&&h.p!=='init') sDelete(h.p); return; } const h=tNear(e); if(h.p&&!h.p.init) tDelete(h.p); }; tcv.addEventListener('dblclick',tDel2); tcv.addEventListener('contextmenu',tDel2);
// ── pestaña Compás: cambios de compás (solo en límites de compás) ──
let sDrag=null;
function sNear(e){ const r=tcv.getBoundingClientRect(), px=e.clientX-r.left, mm=meter(P); let best=null,bd=1e9; for(const p of ['init',...(P.sigs||[])]){ const bar=p==='init'?0:p.bar; const dd=Math.abs(KW+mm.beatOfBar(bar)*BW-wrap.scrollLeft-px); if(dd<12&&dd<bd){ best=p; bd=dd; } } return {p:best,px}; }
function sBarAt(px){ const mm=meter(P), b=pxToBeat(px), a=mm.barAt(Math.max(0,b)); return (b-a.start)>a.len/2?a.i+1:a.i; }
function sigDown(e){ const h=sNear(e); if(h.px<KW) return; try{ tcv.setPointerCapture(e.pointerId); }catch(_){}
  pushUndo(); let p=h.p;
  if(!p){ const i=sBarAt(h.px); if(i<1||i>=P.bars){ if(i<1) p='init'; else return; } else { p=(P.sigs||[]).find(q=>q.bar===i); if(!p){ const [a,b]=$('sSel').value.split('/').map(Number); p={bar:i,sig:[a,b]}; if(!P.sigs) P.sigs=[]; P.sigs.push(p); } } }
  sS=p; sDrag=p==='init'?null:{p}; touch(); layoutSpacer(); invalidate(); refreshTempoUI(); }
function sigMove(e){ if(!sDrag){ const h=sNear(e); tcv.style.cursor=h.p&&h.p!=='init'?'ew-resize':h.p?'pointer':'crosshair'; return; }
  const r=tcv.getBoundingClientRect(), i=clamp(sBarAt(e.clientX-r.left),1,P.bars-1); if(i!==sDrag.p.bar&&!(P.sigs||[]).some(q=>q!==sDrag.p&&q.bar===i)){ sDrag.p.bar=i; touch(); invalidate(); refreshTempoUI(); } }
function sDelete(p){ const L=P.sigs||[], i=L.indexOf(p); if(i<0) return; pushUndo(); L.splice(i,1); if(!L.length) delete P.sigs; if(sS===p) sS=null; touch(); layoutSpacer(); invalidate(); prewarm(); refreshTempoUI(); }
$('sSel').onchange=e=>{ if(!sS) return; const [a,b]=e.target.value.split('/').map(Number); pushUndo(); if(sS==='init'){ P.sig=[a,b]; $('sig').value=a+'/'+b; } else sS.sig=[a,b]; touch(); layoutSpacer(); invalidate(); prewarm(); refreshTempoUI(); };
$('sDelSig').onclick=()=>{ if(sS&&sS!=='init') sDelete(sS); };
// ── pestaña Sección: marcas con nombre en límites de compás (solo organizan, no cambian el audio) ──
function mNear(e){ const r=tcv.getBoundingClientRect(), px=e.clientX-r.left, mm=meter(P); let best=null,bd=1e9; for(const p of P.marks||[]){ if(p.bar>=P.bars) continue; const dd=Math.abs(KW+mm.beatOfBar(p.bar)*BW-wrap.scrollLeft-px); if(dd<12&&dd<bd){ best=p; bd=dd; } } return {p:best,px}; }
function markDown(e){ const h=mNear(e); if(h.px<KW) return; try{ tcv.setPointerCapture(e.pointerId); }catch(_){}
  let p=h.p; pushUndo();
  if(!p){ const i=sBarAt(h.px); if(i<0||i>=P.bars) return; p=(P.marks||[]).find(q=>q.bar===i); if(!p){ p={bar:i,name:$('mName').value.trim().slice(0,40)||'Sección'}; if(!P.marks) P.marks=[]; P.marks.push(p); } }
  mS=p; mDrag={p}; $('mName').value=p.name; touch(); invalidate(); refreshTempoUI(); }
function markMove(e){ if(!mDrag){ const h=mNear(e); tcv.style.cursor=h.p?'ew-resize':'crosshair'; return; }
  const r=tcv.getBoundingClientRect(), i=clamp(sBarAt(e.clientX-r.left),0,P.bars-1); if(i!==mDrag.p.bar&&!(P.marks||[]).some(q=>q!==mDrag.p&&q.bar===i)){ mDrag.p.bar=i; touch(); invalidate(); refreshTempoUI(); } }
function mDelete(p){ const L=P.marks||[], i=L.indexOf(p); if(i<0) return; pushUndo(); L.splice(i,1); if(!L.length) delete P.marks; if(mS===p) mS=null; touch(); invalidate(); refreshTempoUI(); }
function mRename(v){ v=String(v).trim().slice(0,40); if(!v) return; if(mS){ if(mS.name===v) return; pushUndo(); mS.name=v; touch(); invalidate(); refreshTempoUI(); } }
$('mName').onchange=e=>{ if(mS) mRename(e.target.value); else if(!e.target.value.trim()) e.target.value='Sección'; };
$('mName').onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); e.target.blur(); } e.stopPropagation(); };
for(const q of MARK_QUICK) $('mQuick').append(el('button',{class:'sm',text:q,onclick:()=>{ $('mName').value=q; if(mS) mRename(q); }}));
$('mDelBtn').onclick=()=>{ if(mS) mDelete(mS); };
$('tabBpm').onclick=()=>{ tMode='bpm'; refreshTempoUI(); invalidate(); }; $('tabSig').onclick=()=>{ tMode='sig'; refreshTempoUI(); invalidate(); }; $('tabMark').onclick=()=>{ tMode='mark'; refreshTempoUI(); invalidate(); };
$('tempoOn').onclick=()=>{ tempoShow=!tempoShow; refreshTempoUI(); invalidate(); };
$('tBpm').onchange=e=>{ if(!tSel) return; pushUndo(); const v=clamp(Math.round(+e.target.value)||120,tSel==='init'?40:20,tSel==='init'?260:400); if(tSel==='init'){ P.bpm=v; $('bpm').value=v; } else tSel.bpm=v; touch(); refreshTempoUI(); prewarm(); };
$('tRamp').onchange=e=>{ if(!tSel||tSel==='init') return; pushUndo(); tSel.ramp=e.target.checked; touch(); refreshTempoUI(); };
$('tDel').onclick=()=>{ if(tSel&&tSel!=='init') tDelete(tSel); };

// ───────────── exportar compacto (para la librería) ─────────────
async function gzipSize(text){ try{ if(typeof CompressionStream==='undefined') return null; const s=new Blob([text]).stream().pipeThrough(new CompressionStream('gzip')); return (await new Response(s).blob()).size; }catch(e){ return null; } }
const kb=n=>n>=1048576?(n/1048576).toFixed(1)+' MB':(n/1024).toFixed(n<10240?1:0)+' KB';
async function exportCompact(){
  if(!P.tracks.some(t=>t.notes.length)){ toast('El proyecto está vacío','err'); return; }
  const rep=projectReport(P), text=JSON.stringify(projectToJSON(P,{compact:true})), gz=await gzipSize(text);
  download(new Blob([text],{type:'application/json'}),slug(P.name||'cancion')+'.demokit.json');
  let msg='«'+(P.name||'cancion')+'.demokit.json»: '+kb(text.length)+(gz?' (≈'+kb(gz)+' con gzip)':'')+' · '+rep.noteCount+' notas en '+rep.tracks+' pistas';
  if(rep.clipCount) msg+=' · ⚠ '+rep.clipCount+' clips horneados pesan '+kb(rep.clips)+' (el '+Math.round(100*rep.clips/rep.total)+'%): reemplázalos por instrumentos para que pese poquito';
  if(rep.plugins>2) msg+=' · lleva plugins ('+kb(rep.plugins)+'): la librería no los ejecuta sin allowPlugins';
  toast(msg,rep.clipCount?'err':'ok'); return {text,rep,gz};
}
$('bCompact').onclick=exportCompact;

// ───────────── exportar el proyecto como demo .js (con el proyecto dentro, para recuperarlo sin pérdidas) ─────────────
const utf8b64=s=>btoa(unescape(encodeURIComponent(s))), b64utf8=b=>decodeURIComponent(escape(atob(b)));
function embeddedProject(src){ const m=/__DEMOKIT_PROJECT__\s*=\s*\[([^\]]*)\]/.exec(src); if(!m) return null;
  try{ return JSON.parse(b64utf8([...m[1].matchAll(/"([^"]*)"/g)].map(x=>x[1]).join(''))); }catch(e){ return null; } }
function engineSource(){ const MB='//#ENGINE'+'-BEGIN', ME='//#ENGINE'+'-END';
  for(const s of document.scripts){ const t=s.textContent, a=t.indexOf(MB), b=t.indexOf(ME); if(a>=0&&b>a) return t.slice(a+MB.length,b); } return null; }
function exportDemoJs(){
  const eng=engineSource(); if(!eng){ toast('No pude leer el motor de esta página para incrustarlo','err'); return; }
  if(!P.tracks.some(t=>t.notes.length)){ toast('El proyecto está vacío','err'); return; }
  const words=slug(P.name||'cancion').split('-').filter(Boolean).map(w=>w[0].toUpperCase()+w.slice(1)).join(''), fn='render'+(/^[A-Za-z]/.test(words)?words:'P'+words);
  const b64=utf8b64(JSON.stringify(projectToJSON(P,{compact:true}))), chunks=[]; for(let i=0;i<b64.length;i+=110) chunks.push('    "'+b64.slice(i,i+110)+'"');
  const body=eng.replace('const SR=44100,','let SR=44100,');
  if(body===eng){ toast('No pude preparar el motor (SR)','err'); return; }
  const out=`// ── ${P.name||'Canción'} · exportada de Demo Kit ──
// BPM = ${P.bpm} | BARS = ${P.bars}${P.sig&&barBeats(P)!==4?' | SIG = '+P.sig[0]+'/'+P.sig[1]:''}
// Demo autónoma: lleva dentro el proyecto editable (__DEMOKIT_PROJECT__) y el motor de Demo Kit,
// así que suena igual que en el estudio y se puede volver a abrir con «Convertir en editable» sin pérdidas.
// Solo necesita que la página aporte demoKit (demo_kit.js), como cualquier demo.
async function ${fn}(sr, onProg) {
  const __DEMOKIT_PROJECT__ = [
${chunks.join(',\n')}
  ].join('');
  // ═══ motor de Demo Kit (incrustado) ═══${body}  // ═══ fin del motor ═══
  SR = sr || 44100;
  const P = projectFromJSON(JSON.parse(decodeURIComponent(escape(atob(__DEMOKIT_PROJECT__)))));
  return await renderProject(P, onProg);
}
`;
  download(new Blob([out],{type:'text/javascript'}),slug(P.name||'cancion')+'.js'); toast('Demo exportada ('+(out.length/1024).toFixed(0)+' KB). Ábrela en el estudio o cárgala en tu juego como cualquier demo.','ok');
  return out;
}
$('bDemoJs').onclick=exportDemoJs;

const BUILTIN_KIT=Kit.make;
$('kitCharSel').onchange=e=>{ setKitChar(e.target.value); rememberChar(); cache=null; dirty=true; syncKitChar(); updateStat(); toast('Carácter del kit: '+charName(e.target.value)+' (el siguiente Play vuelve a renderizar)','ok'); };
$('kitReset').onclick=()=>{ Kit.make=BUILTIN_KIT; bumpKit(); kitName='incluido'; try{ localStorage.removeItem('demokit-kit'); }catch(e){} cache=null; dirty=true; renderLib(); updateStat(); toast('Kit incluido restaurado','ok'); };
// ───────────── seguridad: el código ajeno solo se ejecuta si lo confirmas ─────────────
// Un plugin, un kit o un proyecto con plugins es JavaScript que corre con los mismos permisos que esta página.
function trustCode(titulo,detalle){ return confirm('⚠ '+titulo+'\n\n'+detalle+'\n\nEl código se ejecuta en tu navegador con los mismos permisos que esta página. Continúa solo si confías en quien lo hizo.\n\n¿Ejecutarlo?'); }
function projectFromFile(o,nombre){   // proyecto → pregunta por los plugins que aún no tienes instalados tal cual
  const nuevos=(o.plugins||[]).filter(u=>{ const t=USER_PLUGINS.find(x=>x.id===u.id); return !t||t.code!==u.code; });
  let allow=true; if(nuevos.length) allow=trustCode('«'+(nombre||o.name||'Proyecto')+'» trae '+nuevos.length+' plugin(s) con código propio',nuevos.map(u=>'• '+(u.name||u.id)+' ('+((u.code||'').length/1024).toFixed(1)+' KB)').join('\n'));
  return projectFromJSON(o,{allowPlugins:allow||!nuevos.length});
}
// ───────────── archivos, demos y plugins ─────────────
const demoName=(txt,fb)=>{ const m=/^\/\/\s*[─\-—–\s]*([^·\n]+?)\s*·/m.exec(txt); return m?m[1].trim():fb; };
async function ingest(file,opts){
  const name=file.name;
  if(/\.midi?$/i.test(name)){
    try{
      if(P.tracks.some(t=>t.notes&&t.notes.length)&&!confirm('Importar «'+name+'» crea un proyecto nuevo y reemplaza el actual (usa Guardar antes si lo quieres conservar). ¿Continuar?')){ toast('Importación cancelada'); return; }
      const r=midiToProject(new Uint8Array(await file.arrayBuffer()),name);
      loadProject(r.project); populateAddInst(); closeModal&&closeModal('libModal');
      toast('MIDI importado: '+r.stats.tracks+' pistas, '+r.stats.notes+' notas'+(r.warnings.length?' · '+r.warnings.join(' · '):'')+'. Los sonidos son una primera asignación: cámbialos a tu gusto.','ok');
    }catch(e){ console.error(e); toast('No pude importar «'+name+'»: '+e.message,'err'); }
    return;
  }
  const txt=await file.text();
  try{
    if(/^\s*\{/.test(txt)){ const o=JSON.parse(txt); if(o.format==='demokit-genres'){ const r=addGenres(o,opts); toast(r.ok.length?'Géneros listos: '+r.ok.join(', ')+(r.bad.length?' · con avisos: '+r.bad.join(' · '):''):'No pude leer géneros: '+r.bad.join(' · '),r.ok.length?'ok':'err'); return; } if(o.format==='demokit-studio'){ loadProject(projectFromFile(o,name)); populateAddInst(); toast('Proyecto «'+o.name+'» cargado','ok'); return; } }
    if(/function\s+demoKit\s*\(/.test(txt)){ if(!trustCode('Kit «'+name+'»',((txt.length/1024).toFixed(1))+' KB de código que reemplazará al kit incluido.')){ toast('Kit no cargado','err'); return; } const f=new Function(txt+'\nreturn demoKit;')(); const k=f(8000,.05,1); if(!k||typeof k.syn!=='function'||typeof k.mix!=='function') throw new Error('el kit no expone syn/mix'); const probs=kitCheck(f); if(probs.length&&!confirm('Revisé el kit «'+name+'» y encontré esto:\n\n• '+probs.join('\n• ')+'\n\n¿Cargarlo de todos modos?')){ toast('Kit no cargado','err'); return; } Kit.make=f; applyStoredChar(); bumpKit(); kitName=name; cache=null; dirty=true; const kept=rememberKit(name,txt); renderLib(); updateStat(); toast('Kit «'+name+'» cargado: los instrumentos y plugins lo usan desde ahora'+(kept?' y se recordará en este navegador':' (no pude guardarlo en este navegador: pesa demasiado; durará solo esta sesión)'),kept?'ok':'err'); return; }
    if(/async\s+function\s+render\w*\s*\(/.test(txt)){ const fn=/async\s+function\s+(render\w*)/.exec(txt)[1]; const d={name:demoName(txt,name.replace(/\.js$/,'')),fn,src:txt,out:null,trusted:!!(opts&&opts.trusted)}; const i=demos.findIndex(x=>x.name===d.name); if(i>=0) demos[i]=d; else demos.push(d); renderLib(); openModal('libModal'); toast('Demo «'+d.name+'» lista: reprodúcela o conviértela','ok'); return; }
    if(/registerInstrument\s*\(/.test(txt)){ if(!trustCode('Plugin «'+name+'»',((txt.length/1024).toFixed(1))+' KB de código. Empieza así:\n'+txt.slice(0,160).replace(/\s+/g,' ')+'…')){ toast('Plugin no instalado','err'); return; } const def=installPlugin(txt); populateAddInst(); renderLib(); toast('Plugin «'+def.name+'» registrado','ok'); return; }
    toast('No reconocí «'+name+'» (¿demo, plugin, kit o proyecto?)','err');
  }catch(e){ console.error(e); toast('Error con «'+name+'»: '+e.message,'err'); }
}
// ───────────── revisión de un kit al cargarlo (prueba corta: no sustituye a escucharlo) ─────────────
function kitCheck(make){
  const out=[], sr=SR||44100, E=a=>{ let e=0; for(let c=0;c<2;c++){ const x=a[c]; for(let i=0;i<x.length;i+=2) e+=x[i]*x[i]; } return e; }, bad=a=>{ for(let c=0;c<2;c++){ const x=a[c]; for(let i=0;i<x.length;i+=3) if(!isFinite(x[i])) return true; } return false; };
  const kit=(s)=>{ const K=make(sr,s,1); K.sr=sr; return K; };
  try{
    { const K=kit(.8); K.syn(K.mu,0,.25,220,.2,0,{det:[-8,0,8],lp:2000}); if(E(K.mu)<1e-9&&E(K.dr)>1e-9) out.push('K.syn ignora el búfer que se le pasa y suena siempre en la percusión: los pads y bajos no los agacha el sidechain.'); }
    { const K=kit(.9); K.syn(K.mu,0,.25,880,.2,0,{det:[0],lp:14000}); K.syn(K.mu,.3,.3,110,.2,0,{det:[-10,10],lp:t=>400+12000*Math.exp(-t*3)}); if(bad(K.mu)||bad(K.dr)) out.push('El filtro de K.syn se desborda (valores NaN) con cortes altos o barridos fuertes: la mezcla se corta mientras dura la nota.'); }
    { const K=kit(2.5), fns=[['kick',()=>K.kick(0,1)],['snare',()=>K.snare(.1,1)],['clap',()=>K.clap(.2,1)],['snap',()=>K.snap(.3,1)],['hat',()=>K.hat(.4,1)],['crash',()=>K.crash(.5,.5)],['bell',()=>K.bell(.6,69,.5)],['chop',()=>K.chop(.7,.3,60,.5)],['riser',()=>K.riser(.8,.5,.5)],['sweep',()=>K.sweep(1,.5,200,2000,.5)]];
      for(const [nm,f] of fns){ try{ f(); }catch(err){ out.push('K.'+nm+' falla: '+err.message); } }
      if(bad(K.dr)||bad(K.mu)) out.push('Alguna percusión o textura produce valores NaN.'); }
    const song=(mk)=>{ const K=mk(sr,2.5,1); for(let i=0;i<8;i++) K.kick(i*.25,1); K.syn(K.mu,0,2,220,.12,0,{det:[-6,0,6],lp:1800}); K.hat(.125,1); K.snare(.5,1); return K.mix(()=>1); };
    let r=null; try{ r=song(make); }catch(err){ out.push('K.mix falla al mezclar: '+err.message); }
    if(r){ if(bad([r.L,r.R])) out.push('K.mix devuelve valores NaN.'); else { const rms=o=>{ let e=0; for(let i=0;i<o.L.length;i++) e+=o.L[i]*o.L[i]; return Math.sqrt(e/o.L.length); }, db=20*Math.log10(rms(r)/rms(song(demoKit))); if(db>4) out.push('Con las mismas notas la mezcla sale '+db.toFixed(1)+' dB más fuerte que con el kit incluido: puede saturar (baja las ganancias o el empuje del kit).'); } }
  }catch(err){ out.push('La revisión no pudo terminar: '+err.message); }
  return out;
}
async function handleFiles(list){ for(const f of list) await ingest(f); }
// ───────────── el repositorio: demos/, plugins/, projects/ y project_examples/ aparecen solos ─────────────
// Funciona cuando el estudio se abre desde GitHub Pages o desde un servidor (python3 -m http.server): mira las carpetas junto a la página.
// · GitHub Pages: pregunta a la API de GitHub qué hay en la carpeta (no hace falta ningún índice).
// · Servidor local: lee el listado de la carpeta. · Cualquier hosting: acepta un manifest.json (en cada carpeta) con la lista de nombres;
//   el workflow .github/workflows/manifests.yml lo regenera solo en cada push, y entonces no se toca la API.
const REPO_GROUPS=[
  {id:'demos',title:'Demos',dirs:['demos'],ext:/\.js$/i,kind:'demo',what:'archivos .js de demos'},
  {id:'plugins',title:'Plugins de instrumento',dirs:['plugins'],ext:/\.js$/i,kind:'plugin',what:'archivos .js de plugins'},
  {id:'proyectos',title:'Proyectos',dirs:['projects'],ext:/\.json$/i,kind:'project',what:'archivos .demokit.json (proyectos guardados)'},
  {id:'generos',title:'Géneros',dirs:['genres','generos'],ext:/\.json$/i,kind:'genre',what:'archivos .json de géneros (formato demokit-genres)'},
  {id:'kits',title:'Kits de síntesis',dirs:['kits/bootleg'],ext:/^(?!make_kit|test_).*\.js$/i,kind:'kit',what:'archivos .js de kits (demoKit)'},
  {id:'ejemplos',title:'Ejemplos de proyectos',dirs:['project_examples'],ext:/\.json$/i,kind:'project',what:'archivos .demokit.json de ejemplo'}];
const REPO_BASE=()=>new URL('.',location.href).href;
async function fetchT(url,ms,opts){ const c=new AbortController(), t=setTimeout(()=>c.abort(),ms||8000); try{ return await fetch(url,Object.assign({signal:c.signal},opts||{})); } finally{ clearTimeout(t); } }
function ghRepo(){ const h=location.hostname; if(!/\.github\.io$/i.test(h)) return null; const seg=location.pathname.split('/')[1]; return {owner:h.split('.')[0],repo:seg&&!seg.includes('.')?seg:h}; }
async function listFolder(dir,ext0){            // → {status:'ok'|'missing'|'error', files:[{name,url,size}], src:'manifest'|'api'|'listado', note}
  const base=REPO_BASE(), gh=ghRepo(); let note=''; const ext={test:n=>ext0.test(n)&&!/(^|\/)manifest\.json$/i.test(n)};
  try{ const r=await fetchT(base+dir+'/manifest.json',5000); if(r.ok){ const j=await r.json(), arr=Array.isArray(j)?j:(j.files||[]); return {status:'ok',src:'manifest',files:arr.map(x=>typeof x==='string'?x:x.name).filter(n=>ext.test(n)).map(n=>({name:n,url:base+dir+'/'+encodeURI(n)}))}; } }catch(e){}
  if(gh){ try{ const r=await fetchT('https://api.github.com/repos/'+gh.owner+'/'+gh.repo+'/contents/'+dir,8000,{headers:{Accept:'application/vnd.github+json'}});
      if(r.status===404) return {status:'missing',files:[]};
      if(r.ok){ const j=await r.json(); if(Array.isArray(j)) return {status:'ok',src:'api',files:j.filter(x=>x.type==='file'&&ext.test(x.name)).map(x=>({name:x.name,url:base+dir+'/'+encodeURI(x.name),size:x.size}))}; }
      note=r.status===403||r.status===429?'GitHub limitó las consultas (reintenta en unos minutos)':'GitHub respondió '+r.status; }catch(e){ note='no pude hablar con GitHub'; } }
  try{ const r=await fetchT(base+dir+'/',6000); if(r.status===404) return {status:gh?'error':'missing',files:[],note};
    if(!r.ok) return {status:'error',files:[],note:note||('respondió '+r.status)};
    const html=await r.text(), files=[], seen=new Set(); for(const m of html.matchAll(/href="([^"#?]+)"/g)){ let n=m[1]; if(/^(\/|https?:|\.\.|mailto:)/i.test(n)||n.endsWith('/')) continue; try{ n=decodeURIComponent(n); }catch(e){} if(ext.test(n)&&!seen.has(n)){ seen.add(n); files.push({name:n,url:base+dir+'/'+encodeURI(n)}); } }
    return {status:'ok',src:'listado',files}; }catch(e){ return {status:'error',files:[],note:note||'no pude leer la carpeta'}; }
}
async function repoScan(force){
  if(location.protocol==='file:') return {offline:true};
  try{ if(!force){ const c=JSON.parse(sessionStorage.getItem('demokit-repo-cache')||'null'); if(c&&Date.now()-c.t<300000&&c.base===REPO_BASE()) return c.data; } }catch(e){}
  const data={}; await Promise.all(REPO_GROUPS.map(async g=>{ const res=await Promise.all(g.dirs.map(d=>listFolder(d,g.ext).then(r=>Object.assign(r,{dir:d})))); data[g.id]=res; }));
  try{ sessionStorage.setItem('demokit-repo-cache',JSON.stringify({t:Date.now(),base:REPO_BASE(),data})); }catch(e){}
  return data;
}
async function repoLoad(g,f){
  try{ if(g.kind==='project'&&P.tracks.some(t=>t.notes.length)&&!confirm('Esto reemplaza el proyecto actual. ¿Continuar?')) return;
    const r=await fetchT(f.url,20000); if(!r.ok) throw new Error('respondió '+r.status); const txt=await r.text(); await ingest(new File([txt],f.name),{trusted:g.kind==='demo',repo:true}); if(g.kind==='project') closeModal('libModal'); }
  catch(e){ console.error(e); toast('No pude cargar «'+f.name+'»: '+e.message,'err'); }
}
async function renderRepo(force){
  const box=$('repoList'); box.textContent='Mirando las carpetas del repositorio…'; const data=await repoScan(force); box.innerHTML='';
  if(data.offline){ box.append(el('div',{class:'hint',text:'Estás abriendo el estudio como archivo local, y desde ahí un navegador no puede mirar carpetas. Ábrelo desde GitHub Pages o con un servidor (por ejemplo «python3 -m http.server» dentro de la carpeta del repo) y aquí aparecerán solos los archivos de demos/, plugins/, projects/ y project_examples/.'})); return; }
  for(const g of REPO_GROUPS){ const res=data[g.id]||[], found=res.filter(r=>r.status==='ok'), files=found.flatMap(r=>r.files.map(f=>Object.assign({dir:r.dir},f)));
    const head=el('div',{class:'nm ft'},el('b',{text:g.title+(found.length?' · '+files.length:'')})); const sec=el('div',{class:'fold'},head); sec.dataset.fold='repo-'+g.id; applyFold(sec);
    if(g.kind==='demo'&&files.length>1){ const b=el('button',{class:'sm',style:'margin-left:8px',text:'Cargar todas',onclick:async e=>{ e.stopPropagation(); for(const f of files) await repoLoad(g,f); toast('Demos cargadas: '+files.length,'ok'); }}); head.append(b); }
    if(!found.length){ const err=res.find(r=>r.status==='error'); sec.append(el('div',{class:'hint',text:err?('No pude mirar «'+err.dir+'/»: '+(err.note||'error')+'.'):('No encontré la carpeta «'+g.dirs[0]+'/». Créala en tu repositorio (junto a index.html) y pon ahí tus '+g.what+': aparecerán aquí solos.')})); }
    else if(!files.length) sec.append(el('div',{class:'hint',text:'La carpeta «'+found[0].dir+'/» está vacía. Pon ahí tus '+g.what+'.'}));
    for(const f of files) sec.append(el('div',{class:'item'},el('div',{class:'nm'},el('b',{text:f.name}),el('small',{text:f.dir+'/'+(f.size?' · '+(f.size/1024).toFixed(1)+' KB':'')})),el('button',{class:'sm pri',text:g.kind==='project'?'Abrir':'Cargar',onclick:()=>repoLoad(g,f)})));
    box.append(sec); }
  if(ghRepo()&&REPO_GROUPS.some(g=>(data[g.id]||[]).some(r=>r.src==='api'))) box.append(el('div',{class:'hint',text:'Estas listas salieron de la API de GitHub, que limita las consultas (unas 60 por hora). Para no depender de ella, activa el workflow que genera los manifest.json solo (mira «Carpetas del repositorio» en el README).'}));
}
$('repoRefresh').onclick=e=>{ e.stopPropagation(); renderRepo(true); };
// listas plegables del cuadro «Demos y plugins»: flechita ▾/▸, el estado se recuerda en este navegador
const foldGet=()=>{ try{ return JSON.parse(localStorage.getItem('demokit-folds')||'{}'); }catch(e){ return {}; } };
function applyFold(sec){ sec.classList.toggle('closed',!!foldGet()[sec.dataset.fold]); }
document.addEventListener('click',e=>{ const ft=e.target.closest&&e.target.closest('.fold>.ft'); if(!ft||e.target.closest('button')) return; const sec=ft.parentElement; sec.classList.toggle('closed'); try{ const m=foldGet(); if(sec.classList.contains('closed')) m[sec.dataset.fold]=1; else delete m[sec.dataset.fold]; localStorage.setItem('demokit-folds',JSON.stringify(m)); }catch(err){} });
document.querySelectorAll('#libModal .fold').forEach(applyFold);
// una demo .js es código: la primera vez que se ejecuta una que no viene de las carpetas del repo se pide confirmación (se recuerda por contenido)
function hashStr(t){ let h=2166136261>>>0; for(let i=0;i<t.length;i++){ h^=t.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h.toString(36)+'.'+t.length.toString(36); }
function demoOk(d){
  if(d.trusted) return true; const h=hashStr(d.src); let L=[]; try{ L=JSON.parse(localStorage.getItem('demokit-trusted-demos')||'[]'); }catch(e){}
  if(L.includes(h)){ d.trusted=true; return true; }
  if(!trustCode('Demo «'+d.name+'» (no viene del repositorio)',((d.src.length/1024).toFixed(1))+' KB de código. Si aceptas, la recuerdo en este navegador y no vuelvo a preguntar por esta demo.')) return false;
  d.trusted=true; L.push(h); try{ localStorage.setItem('demokit-trusted-demos',JSON.stringify(L.slice(-300))); }catch(e){} return true;
}
async function playDemo(d){
  if(!demoOk(d)) return; ac(); stop(); try{ $('stat').textContent='Renderizando demo…'; const fn=compileDemo(d.src,d.fn,sleep);
    const out=await fn(SR,p=>prog(p)); d.out=out; prog(0); updateStat(); startPlayback(toAudioBuffer(out),0,false,false); }
  catch(e){ prog(0); updateStat(); console.error(e); toast('Error en la demo: '+e.message,'err'); }
}
async function demoWav(d){ if(!d.out){ if(!demoOk(d)) return; try{ const fn=compileDemo(d.src,d.fn,sleep); d.out=await fn(SR,p=>prog(p)); prog(0); }catch(e){ prog(0); toast('Error: '+e.message,'err'); return; } } download(encodeWav(d.out.L,d.out.R,SR),d.name.replace(/\W+/g,'_')+'_'+kitTag()+'.wav'); }
async function convertDemo(d){
  if(P.tracks.some(t=>t.notes.length)&&!confirm('Esto reemplaza el proyecto actual. ¿Continuar?')) return;
  const emb=embeddedProject(d.src); if(emb){ try{ loadProject(projectFromFile(emb,d.name)); populateAddInst(); closeModal('libModal'); toast('«'+d.name+'»: proyecto original recuperado sin pérdidas','ok'); }catch(e){ console.error(e); toast('No pude abrir el proyecto incrustado: '+e.message,'err'); } return; }
  if(!demoOk(d)) return;
  try{ toast('Convirtiendo «'+d.name+'»…'); await tick(); const {project,stats,warnings}=await recordDemo(d.src,{name:d.name}); loadProject(project); populateAddInst(); renderLib(); closeModal('libModal'); if(warnings&&warnings.length) setTimeout(()=>toast('⚠ '+warnings.join(' '),'err'),300);
    toast('«'+d.name+'» convertida: '+stats.tracks+' pistas, '+stats.notes+' notas'+(stats.auto&&stats.auto.length?' · '+stats.auto.length+' función(es) de la demo convertidas en plugins editables ('+stats.auto.map(a=>a.name).join(', ')+')':'')+(stats.autoFailed&&stats.autoFailed.length?' · se quedan como audio: '+stats.autoFailed.map(a=>a.name+' ('+a.reason+')').join('; '):'')+(stats.clips?(' y '+stats.clips+' clips horneados'+(stats.clipsTotal>stats.clips?' (de '+stats.clipsTotal+': los idénticos se guardan una sola vez)':'')+(stats.helpers&&stats.helpers.length?'. Salen de funciones de la demo: '+stats.helpers.slice(0,6).map(h=>h.name+' ×'+h.calls).join(', '):' (add() en línea que no se puede parametrizar)')):'')+'. Guarda el proyecto si quieres conservarlo.','ok'); }
  catch(e){ console.error(e); toast('No pude convertir: '+e.message,'err'); }
}
function renderLib(){
  const dl=$('demoList'); dl.innerHTML=''; if(!demos.length) dl.append(el('div',{class:'hint',text:'Aún no hay demos. Suelta un archivo .js arriba o cárgalo desde el repositorio.'}));
  for(const d of demos) dl.append(el('div',{class:'item'},el('div',{class:'nm'},el('b',{text:d.name}),el('small',{text:d.fn+'() · '+(d.src.length/1024).toFixed(1)+' KB'})),
    el('button',{class:'sm',text:'▶ Original',onclick:()=>playDemo(d)}),el('button',{class:'sm pri',text:'✎ Convertir en editable',onclick:()=>convertDemo(d)}),el('button',{class:'sm',text:'⬇ WAV',onclick:()=>demoWav(d)}),
    el('button',{class:'sm danger',text:'✕',onclick:()=>{ demos.splice(demos.indexOf(d),1); renderLib(); }})));
  const pl=$('plgList'); pl.innerHTML=''; if(!USER_PLUGINS.length) pl.append(el('div',{class:'hint',text:'Ninguno todavía.'}));
  for(const u of USER_PLUGINS) pl.append(el('div',{class:'item'},el('div',{class:'nm'},el('b',{text:u.name}),el('small',{text:u.id})),
    el('button',{class:'sm',text:'Editar',onclick:()=>openPlugin(u.code)}),el('button',{class:'sm',text:'＋ Pista',onclick:()=>{ addTrack(u.id); closeModal('libModal'); }}),
    el('button',{class:'sm danger',text:'Quitar',onclick:()=>{ removePlugin(u.id); delete INSTRUMENTS[u.id]; const i=INST_ORDER.indexOf(u.id); if(i>=0) INST_ORDER.splice(i,1); populateAddInst(); renderLib(); }})));
  syncKitChar(); $('kitInfo').textContent='Kit en uso: '+kitName+'. Puedes soltar un demo_kit.js propio (con funciones nuevas) para reemplazar el incluido: los plugins podrán usar sus funciones desde K. Se recuerda en este navegador hasta que pulses «Volver al kit incluido». Cómo escribir uno: README → «Extender el kit».'; $('kitReset').hidden=kitName==='incluido';
}
const openModal=id=>{ const was=$(id).classList.contains('show'); $(id).classList.add('show'); if(!was&&id==='libModal'&&typeof renderRepo==='function') renderRepo(false); }, closeModal=id=>$(id).classList.remove('show');
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
for(const m of ['libModal','plgModal']) $(m).addEventListener('pointerdown',e=>{ if(e.target.id===m) closeModal(m); });

const PLUGIN_TEMPLATE=`// Plugin de instrumento: usa cualquier cosa del demo kit (K).
// n = { t (seg), len (seg), midi, hz, a (amplitud), pan, p (parámetros), buf (K.mu | K.dr), lane, bpm, beat, sr }
registerInstrument({
  name: 'Campana FM',
  kind: 'melodic',                 // 'melodic' = piano roll con notas · 'perc' = carriles (lanes)
  params: [
    {k:'gain',  label:'Ganancia',    min:0,  max:1,  step:.005, def:.12},
    {k:'ratio', label:'Razón FM',    min:.5, max:8,  step:.01,  def:3.5},
    {k:'index', label:'Índice FM',   min:0,  max:12, step:.1,   def:4},
    {k:'decay', label:'Caída (1/s)', min:.5, max:12, step:.1,   def:3}
  ],
  play(K, n){
    const p=n.p, f=n.hz, L=n.len+1.2;
    K.add(n.buf, n.t, L, t=>{
      const env=Math.exp(-t*p.decay)*Math.min(1,t*500);
      const mod=Math.sin(2*Math.PI*f*p.ratio*t)*p.index*Math.exp(-t*p.decay*1.5);
      return Math.sin(2*Math.PI*f*t+mod)*env;
    }, n.a*p.gain, n.pan);
    K.bell(n.t, n.midi+12, n.a*.03, n.pan, 1.2);   // + una capa de campana del kit
  }
});`;
$('plgDoc').textContent=`K.add(buf, t0, len, fn, amp, pan)   fn(t) → muestra; t en segundos desde el inicio. Es la base de todo.
K.syn(buf, t0, len, f, a, pan, {det:[cents], w:0|1|2, atk, rel, dec, lp:Hz | t=>Hz})
K.bell(t0, midi, a, pan, len)            K.chop(t0, len, midi, a, pan, 'oh'|'ah'|'ee'|'oo')
K.kick(t0, a, {lo,hi,k,dec,len,click})   K.snare(t0, a, {tone,nd,td,len})
K.clap(t0,a)  K.snap(t0,a,pan)  K.hat(t0,a,abierto,pan)  K.crash(t0,a,len)
K.riser(t0,len,a)  K.sweep(t0,len,f0,f1,a)
K.rnd() → ruido determinista [-1,1)   K.hz(midi)   K.lpc(fc) → coeficiente de filtro de 1 polo
K.mu = canal de la música (le afecta el sidechain) · K.dr = canal de la batería
n.buf ya apunta a K.mu o K.dr según la opción «Ducked» de la pista. n.sr = frecuencia de muestreo.
Los parámetros declarados en params aparecen como controles en el inspector y llegan en n.p.
Si el closure de K.add guarda estado (filtros, fases), créalo dentro de play(): cada nota necesita el suyo.`;
function openPlugin(code){ $('plgCode').value=code||PLUGIN_TEMPLATE; openModal('plgModal'); }
$('plgTpl').onclick=()=>{ $('plgCode').value=PLUGIN_TEMPLATE; };
$('plgSave').onclick=()=>{ try{ const def=installPlugin($('plgCode').value); populateAddInst(); renderLib(); toast('Plugin «'+def.name+'» registrado y guardado en este navegador','ok'); }catch(e){ toast('Error en el plugin: '+e.message,'err'); } };
$('plgTest').onclick=()=>{ try{ const def=installPlugin($('plgCode').value); populateAddInst(); renderLib(); const t=newTrack(def.id); previewNote({b:0,l:1,m:def.kind==='perc'?0:60,v:1},t); }catch(e){ toast('Error en el plugin: '+e.message,'err'); console.error(e); } };
$('plgDl').onclick=()=>{ const m=/name\s*:\s*['"]([^'"]+)/.exec($('plgCode').value); download(new Blob([$('plgCode').value],{type:'text/javascript'}),(m?slug(m[1]):'plugin')+'.js'); };
$('plgCode').addEventListener('keydown',e=>{ if(e.key==='Tab'){ e.preventDefault(); const t=e.target,s=t.selectionStart; t.value=t.value.slice(0,s)+'  '+t.value.slice(t.selectionEnd); t.selectionStart=t.selectionEnd=s+2; } });

// ───────────── tocar en vivo: teclado de la compu y MIDI ─────────────
// Cada nota se renderiza una vez (largo fijo) y se guarda en una caché; tocar es solo disparar un buffer ya listo.
// Al soltar la tecla se hace un fundido de salida. Pedal de sustain (CC64) soportado.
const LIVE_LEN=2.2, LIVE_MAX=110;
const KEYMAP={KeyZ:0,KeyS:1,KeyX:2,KeyD:3,KeyC:4,KeyV:5,KeyG:6,KeyB:7,KeyH:8,KeyN:9,KeyJ:10,KeyM:11,Comma:12,KeyL:13,Period:14,Semicolon:15,Slash:16,
  KeyQ:12,Digit2:13,KeyW:14,Digit3:15,KeyE:16,KeyR:17,Digit5:18,KeyT:19,Digit6:20,KeyY:21,Digit7:22,KeyU:23,KeyI:24,Digit9:25,KeyO:26,Digit0:27,KeyP:28};
const PERC_KEYS=['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM'];
let liveEnabled=true, baseOct=60, sustain=false, midiAcc=null;
const voices=new Map(), sustained=new Set(), liveCache=new Map(), downCodes=new Map();
const liveKey=(tr,m)=>tr.inst+'|'+tr.pan+'|'+(tr.ducked?1:0)+'|'+P.bpm+'|'+m+'|'+JSON.stringify(tr.params)+'|'+JSON.stringify(tr.fx||0);
function liveBuf(tr,m){
  const k=liveKey(tr,m); let b=liveCache.get(k);
  if(b){ liveCache.delete(k); liveCache.set(k,b); return b; }
  b=toAudioBuffer(liveNoteBuffer(P,tr,m,LIVE_LEN)); liveCache.set(k,b);
  if(liveCache.size>LIVE_MAX) liveCache.delete(liveCache.keys().next().value); return b;
}
let pwToken=0, pwTimer=0;
function prewarm(){                       // deja listas, en segundo plano, las notas que se pueden tocar con el teclado de la compu
  clearTimeout(pwTimer); const tok=++pwToken; if(!liveEnabled) return; const tr=P.tracks[sel]; if(!tr||!INSTRUMENTS[tr.inst]) return;
  const info=trackInfo(tr), list=[]; if(info.perc){ for(let i=0;i<info.rows;i++) list.push(i); } else for(let k=0;k<=28;k++) list.push(clamp(baseOct+k,0,127));
  let i=0; const step=()=>{ if(tok!==pwToken||P.tracks[sel]!==tr) return; const t0=performance.now();
    while(i<list.length&&performance.now()-t0<12){ try{ liveBuf(tr,list[i]); }catch(e){ return; } i++; } if(i<list.length) pwTimer=setTimeout(step,0); };
  pwTimer=setTimeout(step,180);
}
function codeToNote(tr,code){
  const k=KEYMAP[code]; if(k==null) return null; const info=trackInfo(tr);
  if(info.perc){ if(info.rows===1) return 0; const i=PERC_KEYS.indexOf(code); return i>=0&&i<info.rows?i:null; }   // percusión: una tecla por carril
  return clamp(baseOct+k,0,127);
}
function midiToNote(tr,n){ const info=trackInfo(tr); return info.perc?(info.rows===1?0:((n-36)%info.rows+info.rows)%info.rows):n; }
function releaseVoice(v,t){ try{ const a=ctx,g=v.g.gain; g.cancelScheduledValues(a.currentTime); g.setValueAtTime(g.value,a.currentTime); g.linearRampToValueAtTime(0,a.currentTime+t); v.s.stop(a.currentTime+t+.02); }catch(e){} }
function liveOn1(id,m,vel){
  const tr=P.tracks[sel]; if(!tr||!INSTRUMENTS[tr.inst]) return; liveOff(id,true); let buf;
  try{ buf=liveBuf(tr,m); }catch(e){ console.error(e); toast('Error al tocar: '+e.message,'err'); return; }
  const a=ac(), s=a.createBufferSource(), g=a.createGain(); s.buffer=buf; g.gain.value=(tr.vol==null?1:tr.vol)*vel; s.connect(g); g.connect(a.destination); s.start();
  const v={s,g,oneShot:!!INSTRUMENTS[tr.inst].oneShot}; voices.set(id,v); down.set(id,m); s.onended=()=>{ if(voices.get(id)===v) voices.delete(id); }; invalidate(); oskSync(); recOn(id,m,vel,tr);
}
function liveOff1(id,hard){
  const had=down.delete(id), v=voices.get(id); if(had){ invalidate(); oskSync(); } if(!v){ recClose(id); return; }
  if(hard){ sustained.delete(id); voices.delete(id); releaseVoice(v,.015); recClose(id); return; }
  if(v.oneShot){ recClose(id); return; }                  // la percusión se deja sonar completa
  if(sustain){ sustained.add(id); return; }               // con el pedal abajo, la nota (y su grabación) sigue hasta soltarlo
  voices.delete(id); releaseVoice(v,.09); recClose(id);
}
function oskSync(){ if(!oskOn) return; const hl=new Set(down.values()); for(const k of $('osk').querySelectorAll('[data-m]')) k.classList.toggle('on',hl.has(+k.dataset.m)); }
const chordIds=new Map();
function liveOn(id,m,vel){ const tr=P.tracks[sel]; liveOn1(id,m,vel); if(chordIds.has(id)){ for(const x of chordIds.get(id)) liveOff1(x,true); chordIds.delete(id); }
  if(chordMode==='off'||!tr||trackInfo(tr).perc) return; const ex=chordPitches(Math.round(m)).slice(1); if(!ex.length) return; const ids=ex.map((p,i)=>id+'#'+i); ex.forEach((p,i)=>liveOn1(ids[i],p,vel*.85)); chordIds.set(id,ids); }
function liveOff(id,hard){ liveOff1(id,hard); const ids=chordIds.get(id); if(ids){ for(const x of ids) liveOff1(x,hard); if(hard) chordIds.delete(id); else if(!sustain) chordIds.delete(id); } }
function setSustain(on){ sustain=on; if(!on){ for(const id of sustained){ const v=voices.get(id); if(v){ voices.delete(id); releaseVoice(v,.12); } recClose(id); } sustained.clear(); } }
function allOff(){ recCloseAll(); for(const [id,v] of voices) releaseVoice(v,.05); voices.clear(); sustained.clear(); down.clear(); downCodes.clear(); invalidate(); oskSync(); }
const octName=()=>midiName(baseOct);
function setOctave(d){ baseOct=clamp(baseOct+d*12,0,96); $('oct').textContent=octName(); prewarm(); buildOsk(); }
function setLive(on){ liveEnabled=on; $('bLive').classList.toggle('on',on); if(!on) allOff(); else prewarm(); }
const modalOpen=()=>!!document.querySelector('.modal.show');
document.addEventListener('keydown',e=>{
  if(!liveEnabled||e.ctrlKey||e.metaKey||e.altKey||modalOpen()) return; const tg=e.target&&e.target.tagName; if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT') return;
  if(e.code==='Minus'||e.code==='NumpadSubtract'){ e.preventDefault(); if(!e.repeat) setOctave(-1); return; }
  if(e.code==='Equal'||e.code==='NumpadAdd'){ e.preventDefault(); if(!e.repeat) setOctave(1); return; }
  const tr=P.tracks[sel]; if(!tr) return; const m=codeToNote(tr,e.code); if(m==null) return;
  e.preventDefault(); if(e.repeat||downCodes.has(e.code)) return; const id='k'+e.code; downCodes.set(e.code,id); liveOn(id,m,1);
});
document.addEventListener('keyup',e=>{ const id=downCodes.get(e.code); if(id){ downCodes.delete(e.code); liveOff(id); } });
window.addEventListener('blur',()=>{ if(down.size||voices.size) allOff(); });
// MIDI (Web MIDI: Chrome, Edge, Opera; Firefox pide un permiso; Safari no lo soporta)
function onMidi(ev){
  const sv=$('midiIn').value; if(sv!=='all'&&ev.target&&ev.target.id!==sv) return; const d=ev.data; if(!d||d.length<2) return;
  const st=d[0]&0xF0, n=d[1], v=d.length>2?d[2]:0;
  if(st===0x90&&v>0){ const tr=P.tracks[sel]; if(tr&&liveEnabled) liveOn('m'+n,midiToNote(tr,n),Math.max(.05,v/127)); }
  else if(st===0x80||(st===0x90&&v===0)) liveOff('m'+n);
  else if(st===0xB0){ if(n===64) setSustain(v>=64); else if(n===120||n===123) allOff(); }
}
function refreshMidi(){
  const ins=[...midiAcc.inputs.values()], s=$('midiIn'), cur=s.value; s.innerHTML=''; s.append(el('option',{value:'all',text:'Todas las entradas'}));
  for(const i of ins){ i.onmidimessage=onMidi; s.append(el('option',{value:i.id,text:i.name||i.id})); } if([...s.options].some(o=>o.value===cur)) s.value=cur;
  s.hidden=!ins.length; $('bMidi').classList.toggle('on',ins.length>0); return ins;
}
$('bMidi').onclick=async()=>{
  if(!navigator.requestMIDIAccess){ toast('Este navegador no soporta Web MIDI. Usa Chrome, Edge u Opera (Firefox lo pide como permiso; Safari no lo tiene).','err'); return; }
  try{ if(!midiAcc){ midiAcc=await navigator.requestMIDIAccess(); midiAcc.onstatechange=()=>{ const n=refreshMidi().length; toast(n?('MIDI: '+n+' entrada(s) conectada(s)'):'MIDI: sin dispositivos','ok'); }; }
    const n=refreshMidi().length; toast(n?('MIDI listo: '+n+' entrada(s). Toca la pista activa.'):'MIDI activo, pero no veo ningún dispositivo. Conéctalo y se detecta solo.',n?'ok':''); }
  catch(e){ toast('No pude acceder a MIDI: '+(e.message||e.name),'err'); }
};
$('bLive').onclick=()=>setLive(!liveEnabled); $('oDn').onclick=()=>setOctave(-1); $('oUp').onclick=()=>setOctave(1); $('oct').textContent=octName();

// ───────────── grabar lo que tocas ─────────────
// Con ⏺ armado, al pulsar Play el proyecto suena como acompañamiento y lo que tocas se anota en la pista activa,
// en la posición exacta del cabezal (cuantizada a la rejilla si «cuantizar» está activo). Con bucle, cada vuelta suma notas (overdub).
function recBeat(){
  if(!ctx||!playing||!playIsProject) return null; let t=ctx.currentTime-playStartCtx; if(t<0) return null;      // t<0 = cuenta previa
  let p=playOffset+t-recLatMs()/1000;                                                       // compensa la latencia: lo que tocaste sonó antes de lo que oyes
  if(playLoop&&playLoopEnd>0) p=((p%playLoopEnd)+playLoopEnd)%playLoopEnd; else p=Math.max(0,p);
  return tmap(P).beat(p);
}
// latencia de grabación (ms): lo escrito en la casilla, o la latencia de salida del navegador si está vacía
const LAT_KEY='demokit-rec-latency';
function recLatMs(){ const v=$('recLat').value; if(v!=='') return Math.max(0,Math.min(500,+v||0)); return ctx&&ctx.outputLatency?Math.round(ctx.outputLatency*1000):0; }
(function(){ try{ const s=localStorage.getItem(LAT_KEY); if(s!==null&&s!=='') $('recLat').value=s; }catch(e){} })();
$('recLat').onchange=()=>{ try{ localStorage.setItem(LAT_KEY,$('recLat').value); }catch(e){} };
// calibración: 8 clics; el usuario toca al ritmo; la latencia es la mediana de (momento del toque − momento del clic)
let calib=null;
function startCalib(){
  if(calib||playing){ if(playing) toast('Detén la reproducción antes de calibrar','err'); return; } const a=ac(), gap=.6, t0=a.currentTime+.8, N=8, clicks=[], taps=[];
  for(let i=0;i<N;i++){ clickAt(t0+i*gap,i===0); clicks.push(t0+i*gap); }
  $('stat').textContent='🎚 Calibrando: toca cualquier tecla al ritmo de los clics…'; $('stat').className='warn'; $('bCalib').disabled=true; calib={};
  const tap=e=>{ if(e.type==='keydown'){ if(e.repeat||e.ctrlKey||e.metaKey||e.altKey) return; e.preventDefault(); e.stopImmediatePropagation(); } else if(e.target.id==='bCalib') return; taps.push(a.currentTime); };
  document.addEventListener('keydown',tap,true); document.addEventListener('pointerdown',tap,true);
  setTimeout(()=>{ document.removeEventListener('keydown',tap,true); document.removeEventListener('pointerdown',tap,true); calib=null; $('bCalib').disabled=false; updateStat();
    const d=[]; for(const t of taps){ let best=null; for(const c of clicks) if(best===null||Math.abs(t-c)<Math.abs(t-best)) best=c; if(Math.abs(t-best)<gap/2) d.push((t-best)*1000); }
    if(d.length<4){ toast('Pocos toques ('+d.length+'). Toca al ritmo de los 8 clics e inténtalo otra vez','err'); return; }
    d.sort((x,y)=>x-y); const med=d[d.length>>1], ms=Math.max(0,Math.round(med/5)*5), spread=d[d.length-1]-d[0];
    $('recLat').value=ms; $('recLat').onchange(); toast('Latencia: '+ms+' ms (de '+d.length+' toques'+(spread>120?'; muy irregulares, repite si puedes':'')+')','ok'); },(N*gap+1.4)*1000);
}
$('bCalib').onclick=startCalib;
const recQ=()=>$('recQ').checked&&snap>0;
function clickAt(t,accent,vol){ const a=ctx,o=a.createOscillator(),g=a.createGain(); o.frequency.value=accent?1500:1000;
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol||.35,t+.002); g.gain.exponentialRampToValueAtTime(.0001,t+.05);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+.06); clickNodes.push(o); o.onended=()=>{ const i=clickNodes.indexOf(o); if(i>=0) clickNodes.splice(i,1); }; }
function recLen(o,raw){ if(o.one) return .25; return r6(recQ()?Math.max(snap,Math.round(raw/snap)*snap):Math.max(.0625,raw)); }
function recOn(id,m,vel,tr){
  if(!rec.active) return; const raw=recBeat(); if(raw==null) return;                  // durante la cuenta previa no se graba
  recClose(id); if(!rec.snap.has(tr)){ pushUndo(); rec.snap.add(tr); }                // una toma = un solo Ctrl+Z
  let b=recQ()?Math.round(raw/snap)*snap:raw; const total=meter(P).total(P.bars); if(playLoop&&b>=total-1e-9) b-=total;
  const inst=INSTRUMENTS[tr.inst]; let n=tr.notes.find(x=>Math.abs(x.b-b)<1e-6&&Math.round(x.m)===m&&!(x.o&&x.o.cid));
  if(n) n.v=r6(vel); else { n={b:r6(b),l:.25,m,v:r6(vel)}; tr.notes.push(n); rec.n++; }   // misma nota en el mismo lugar (bucle): no se duplica
  rec.open.set(id,{n,tr,raw,one:!!inst.oneShot}); touch(); updateStat();
}
function recGrow(o){ const e=recBeat(); if(e==null) return; let raw=e-o.raw; if(raw<0&&playLoop) raw+=meter(P).total(P.bars); o.n.l=recLen(o,Math.max(0,raw)); }
function recClose(id){ const o=rec.open.get(id); if(!o) return; rec.open.delete(id); recGrow(o); }
function recCloseAll(){ for(const id of [...rec.open.keys()]) recClose(id); }
function recTick(){ for(const o of rec.open.values()) recGrow(o); }
function recFinish(){
  if(!rec.active) return; recCloseAll(); rec.active=false; const n=rec.n; rec.snap.clear(); rec.n=0;
  if(n){ fitBars(); touch(); renderSelInfo(); toast('Toma terminada: '+n+' nota'+(n>1?'s':'')+' nueva'+(n>1?'s':'')+'. Ctrl+Z la deshace.','ok'); } updateStat();
}
function setArmed(on){
  rec.armed=on; $('bRec').classList.toggle('armed',on); $('bRec').title=on?'Armado: pulsa Play (Espacio) para grabar':'Grabar lo que toques';
  if(on){ setLive(true); if(playing&&playIsProject&&!rec.active){ rec.active=true; rec.n=0; rec.snap.clear(); rec.open.clear(); updateStat(); toast('Grabando (punch-in)…'); } else if(!playing) toast('Grabación armada: pulsa Play o Espacio para empezar'+($('recCount').checked?' (con 1 compás de cuenta previa)':'')+'.'); }
  else if(rec.active) recFinish();
  invalidate();
}
$('bRec').onclick=()=>setArmed(!rec.armed);

// ───────────── exportar stems (.zip sin compresión, un WAV por pista) ─────────────
const CRC_T=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
function crc32(u8){ let c=0xFFFFFFFF; for(let i=0;i<u8.length;i++) c=CRC_T[(c^u8[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
async function makeZip(files){      // files: [{name, blob}]
  const enc=new TextEncoder(), parts=[], cd=[]; let off=0; const d=new Date();
  const dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xFFFF, dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xFFFF;
  for(const f of files){
    const data=new Uint8Array(await f.blob.arrayBuffer()), name=enc.encode(f.name), crc=crc32(data);
    const lh=new DataView(new ArrayBuffer(30)); lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0x0800,true); lh.setUint16(8,0,true); lh.setUint16(10,dt,true); lh.setUint16(12,dd,true);
    lh.setUint32(14,crc,true); lh.setUint32(18,data.length,true); lh.setUint32(22,data.length,true); lh.setUint16(26,name.length,true); lh.setUint16(28,0,true);
    parts.push(lh.buffer,name,data);
    const ch=new DataView(new ArrayBuffer(46)); ch.setUint32(0,0x02014b50,true); ch.setUint16(4,20,true); ch.setUint16(6,20,true); ch.setUint16(8,0x0800,true); ch.setUint16(10,0,true); ch.setUint16(12,dt,true); ch.setUint16(14,dd,true);
    ch.setUint32(16,crc,true); ch.setUint32(20,data.length,true); ch.setUint32(24,data.length,true); ch.setUint16(28,name.length,true); ch.setUint32(42,off,true); cd.push(ch.buffer,name);
    off+=30+name.length+data.length;
  }
  let cds=0; for(const c of cd) cds+=c.byteLength||c.length; const end=new DataView(new ArrayBuffer(22)); end.setUint32(0,0x06054b50,true); end.setUint16(8,files.length,true); end.setUint16(10,files.length,true); end.setUint32(12,cds,true); end.setUint32(16,off,true);
  return new Blob([...parts,...cd,end.buffer],{type:'application/zip'});
}
async function exportStems(){
  if(!P.tracks.some(t=>t.notes.length)){ toast('No hay notas que exportar.','err'); return; }
  if(rendering) return; rendering=true; stop(); $('stat').textContent='Renderizando stems…'; $('stat').className=''; const t0=performance.now();
  try{
    const r=await renderStems(P,prog); const used=new Set(), files=[];
    r.files.forEach((f,i)=>{ let nm=String(i+1).padStart(2,'0')+'_'+(f.name.replace(/[^\w\-áéíóúüñÁÉÍÓÚÜÑ ]+/g,'').trim().replace(/\s+/g,'_')||'pista'); while(used.has(nm)) nm+='_'; used.add(nm); files.push({name:nm+'.wav',blob:encodeWav(f.L,f.R,SR)}); });
    const zip=await makeZip(files); download(zip,(P.name||'proyecto').replace(/[^\w\-]+/g,'_')+'_'+kitTag()+'_stems.zip');
    if(r.errors.length) toast('Aviso en «'+r.errors[0].track+'»: '+r.errors[0].msg,'err');
    toast('Stems listos: '+files.length+' WAV en un ZIP ('+((performance.now()-t0)/1000).toFixed(1)+' s).','ok');
  }catch(e){ console.error(e); toast('Error al exportar stems: '+e.message,'err'); }
  finally{ prog(0); rendering=false; updateStat(); }
}
$('bStems').onclick=exportStems;

// ───────────── conexión de controles ─────────────
$('bPlay').onclick=togglePlay;
$('wake').onchange=e=>{ if(playing){ if(e.target.checked) acquireWake(); else releaseWake(); } };
$('pname').onchange=e=>{ P.name=e.target.value||'Sin título'; touch(); };
$('bpm').onchange=e=>{ P.bpm=clamp(+e.target.value||120,40,260); e.target.value=P.bpm; touch(); prewarm(); };
$('sig').onchange=e=>{ const [a,b]=e.target.value.split('/').map(Number); P.sig=[a,b]; layoutSpacer(); invalidate(); touch(); refreshTempoUI(); };
$('bars').onchange=e=>{ P.bars=clamp(Math.round(+e.target.value)||8,1,256); e.target.value=P.bars; layoutSpacer(); touch(); };
// ───────────── Nuevo desde género ─────────────
for(const o of GENRE_BUILTIN){ try{ registerGenre(o); }catch(e){ console.warn('género',o.id,e); } }
const GEN_LS='demokit-genres', genLoaded=new Set(); let GS=null;
function genSave(o){ try{ const id=slug(o.id||o.name), a=JSON.parse(localStorage.getItem(GEN_LS)||'[]').filter(x=>slug(x.id||x.name)!==id); a.push(o); localStorage.setItem(GEN_LS,JSON.stringify(a)); }catch(e){} }
try{ for(const o of JSON.parse(localStorage.getItem(GEN_LS)||'[]')){ try{ registerGenre(o); }catch(e){} } }catch(e){}
function addGenres(o,opts){ const list=Array.isArray(o.genres)?o.genres:(o&&o.name?[o]:[]), ok=[], bad=[];
  for(const x of list){ try{ const g=registerGenre(x); ok.push(g.name); if(!(opts&&opts.repo)) genSave(x); }catch(e){ bad.push(e.message); } }
  if($('genModal').classList.contains('show')) renderGenre(); return {ok,bad}; }
function genPick(id){ const g=GENRES.get(id), keep=GS||{name:'',tracks:false}, sc=g.keys.find(k=>SCALES[k])||'Menor natural';
  GS={gid:id,si:0,bpm:g.bpm[2],sig:g.sig.slice(),root:/mayor$/i.test(sc)||sc==='Mayor'?0:9,scale:sc,name:keep.name,tracks:keep.tracks}; }
function renderGenre(){
  const box=$('genBody'); box.innerHTML=''; if(!GENRES.size){ box.textContent='No hay géneros cargados.'; return; }
  if(!GS||!GENRES.has(GS.gid)) genPick([...GENRES.keys()][0]); const g=GENRES.get(GS.gid);
  const chips=el('div',{class:'gchips'}); for(const x of GENRES.values()) chips.append(el('button',{class:'sm'+(x.id===g.id?' on':''),text:x.name,onclick:()=>{ genPick(x.id); renderGenre(); }}));
  box.append(el('div',{class:'sec'},el('h4',{text:'1 · Género'}),chips,el('div',{class:'desc',text:g.desc||''})));
  const sl=el('div',{}), durs=[];
  g.structures.forEach((st,i)=>{ const d=el('span',{}); durs.push([st,d]);
    sl.append(el('label',{class:'gstr'+(i===GS.si?' on':'')},el('input',{type:'radio',name:'genStr',checked:i===GS.si,onchange:()=>{ GS.si=i; [...sl.children].forEach((c,j)=>c.classList.toggle('on',j===i)); }}),' ',el('b',{text:st.name}),' · '+structBars(st)+' compases · ≈ ',d,el('small',{text:st.sections.map(x=>x[0]+' '+x[1]).join(' · ')}))); });
  const upd=()=>{ for(const [st,d] of durs) d.textContent=fmtDur(structSecs(st,GS.bpm,GS.sig)); }; upd();
  box.append(el('div',{class:'sec'},el('h4',{text:'2 · Estructura'}),sl));
  const bpmIn=el('input',{type:'number',min:40,max:260,step:1,value:GS.bpm,style:'width:70px',onchange:e=>{ GS.bpm=clamp(Math.round(+e.target.value)||g.bpm[2],40,260); e.target.value=GS.bpm; upd(); }});
  const sigSel=el('select',{onchange:e=>{ GS.sig=e.target.value.split('/').map(Number); upd(); }}); const sl2=SIGS.slice(); if(!sl2.some(x=>x[0]===GS.sig[0]&&x[1]===GS.sig[1])) sl2.push(GS.sig); for(const [a,b] of sl2) sigSel.append(el('option',{value:a+'/'+b,text:a+'/'+b})); sigSel.value=GS.sig[0]+'/'+GS.sig[1];
  const rootSel=el('select',{onchange:e=>{ GS.root=+e.target.value; }}); NOTE_NAMES.forEach((n,i)=>rootSel.append(el('option',{value:i,text:n}))); rootSel.value=GS.root;
  const scSel=el('select',{onchange:e=>{ GS.scale=e.target.value; }}), names=Object.keys(SCALES).filter(k=>k!=='off');
  for(const k of names.filter(k=>g.keys.includes(k))) scSel.append(el('option',{value:k,text:'● '+k,style:'color:#f3e3a0'}));
  for(const k of [...names.filter(k=>!g.keys.includes(k)),'off']) scSel.append(el('option',{value:k,text:'\u00a0\u00a0\u00a0'+(k==='off'?'Ninguna':k)})); scSel.value=GS.scale;
  const nameIn=el('input',{type:'text',maxlength:60,placeholder:'Nueva rola · '+g.name,value:GS.name,style:'width:200px',oninput:e=>{ GS.name=e.target.value; }});
  box.append(el('div',{class:'sec'},el('h4',{text:'3 · Ajustes'}),el('div',{class:'gset'},el('label',{},'BPM ',bpmIn,el('span',{class:'hint',text:'típico '+g.bpm[0]+'–'+g.bpm[1]})),el('label',{},'Compás ',sigSel),el('label',{},'Nota ',rootSel),el('label',{},'Escala ',scSel),el('label',{},'Nombre ',nameIn))));
  const ins=el('div',{class:'sec'},el('h4',{text:'Instrumentos afines'})); GS.ids=[];
  for(const c of CAT_ORDER){ const L=g.inst[c].filter(id=>INSTRUMENTS[id]&&!INSTRUMENTS[id].hidden); if(!L.length) continue; GS.ids.push(...L);
    ins.append(el('div',{class:'gcat'},el('b',{text:CATS[c].name+':',style:'color:'+CATS[c].color}),...L.map(id=>el('span',{text:'● '+INSTRUMENTS[id].name,style:'color:'+CATS[c].color})))); }
  ins.append(el('div',{class:'hint',text:'Aparecerán primero y con ● en el selector de instrumentos y de escalas; los demás siguen disponibles.'}),
    el('label',{class:'chk'},el('input',{type:'checkbox',checked:GS.tracks,onchange:e=>{ GS.tracks=e.target.checked; }}),' Agregar también una pista por cada instrumento marcado'));
  box.append(ins,el('div',{class:'btnrow'},el('button',{class:'pri',text:'Crear proyecto',onclick:genCreate}),el('button',{text:'Cancelar',onclick:()=>closeModal('genModal')})));
}
function genCreate(){
  const g=GENRES.get(GS&&GS.gid), st=g&&g.structures[GS.si]; if(!st) return;
  if(P.tracks.some(t=>t.notes.length)&&!confirm('Crear un proyecto nuevo reemplaza el actual (usa Guardar antes si lo quieres conservar). ¿Continuar?')) return;
  const bars=structBars(st), np=newProject(GS.name.trim()||('Nueva rola · '+g.name),GS.bpm,bars);
  np.sig=GS.sig.slice(); np.genre=g.id; np.key={root:GS.root,scale:GS.scale,fit:false}; let at=0; np.marks=[]; for(const [nm,n] of st.sections){ np.marks.push({bar:at,name:nm}); at+=n; }
  loadProject(np); if(GS.tracks){ for(const id of GS.ids) addTrack(id); selectTrack(0); }
  closeModal('genModal'); toast('Proyecto «'+np.name+'» listo: '+bars+' compases a '+GS.bpm+' BPM, '+(GS.scale==='off'?'sin escala':NOTE_NAMES[GS.root]+' '+GS.scale)+', '+st.sections.length+' secciones en la regla.','ok');
}
async function genRepoSync(){          // géneros sueltos en genres/ del repositorio: aparecen solos (son datos, no código)
  if(location.protocol==='file:') return;
  try{ const data=await repoScan(false); let n=0;
    for(const r of (data.generos||[]).filter(r=>r.status==='ok')) for(const f of r.files){ if(genLoaded.has(f.url)) continue; genLoaded.add(f.url);
      try{ const rr=await fetchT(f.url,10000); if(!rr.ok) continue; const o=JSON.parse(await rr.text()); if(o.format!=='demokit-genres') continue; const out=addGenres(o,{repo:true}); n+=out.ok.length; if(out.bad.length) toast('Género «'+f.name+'»: '+out.bad.join(' · '),'err'); }catch(e){ console.warn(e); } }
    if(n&&$('genModal').classList.contains('show')) renderGenre();
  }catch(e){}
}
$('bGen').onclick=()=>{ renderGenre(); openModal('genModal'); genRepoSync(); };
$('bNew').onclick=()=>{ if(P.tracks.some(t=>t.notes.length)&&!confirm('¿Empezar un proyecto vacío? Se pierde lo no guardado.')) return; loadProject(newProject('Sin título',120,8)); };
$('bMidiOut').onclick=()=>{ try{ download(new Blob([projectToMidi(P)],{type:'audio/midi'}),(P.name||'proyecto').replace(/[^\w\-]+/g,'_')+'.mid'); toast('MIDI exportado (el sonido no viaja: solo notas, tempo, compás, volumen y pan)','ok'); }catch(e){ console.error(e); toast('No pude exportar MIDI: '+e.message,'err'); } };
$('bSave').onclick=()=>{ try{ download(new Blob([JSON.stringify(projectToJSON(P))],{type:'application/json'}),(P.name||'proyecto').replace(/[^\w\-]+/g,'_')+'.demokit.json'); }catch(e){ toast('No pude guardar: '+e.message,'err'); } };
$('bOpen').onclick=()=>$('fileIn').click(); $('bPick').onclick=()=>$('fileIn').click();
$('fileIn').onchange=async e=>{ await handleFiles([...e.target.files]); e.target.value=''; };
$('bLib').onclick=()=>{ renderLib(); openModal('libModal'); };
$('bExample').onclick=()=>{ loadProject(starterProject()); closeModal('libModal'); };
$('bNewPlg').onclick=()=>openPlugin();
$('bWav').onclick=async()=>{ if(dirty||!cache){ if(!(await doRender())) return; } download(encodeWav(cache.L,cache.R,SR),(P.name||'cancion').replace(/[^\w\-]+/g,'_')+'_'+kitTag()+'.wav'); };
$('bAdd').onclick=()=>addTrack($('addInst').value);
$('mDraw').onclick=()=>setMode('draw'); $('mNav').onclick=()=>setMode('nav'); $('mErase').onclick=()=>setMode('erase'); $('mSel').onclick=()=>setMode('select');
$('zIn').onclick=()=>zoom(1.25); $('zOut').onclick=()=>zoom(1/1.25);
{ const s=$('snap'); for(const [v,l] of [[1,'1/4'],[.5,'1/8'],[.25,'1/16'],[.125,'1/32'],[1/3,'1/8 tresillo'],[1/6,'1/16 tresillo'],[0,'libre']]) s.append(el('option',{value:v,text:l})); s.value=.25; s.onchange=()=>{ snap=+s.value; invalidate(); }; }
const drop=$('drop'); for(const ev of ['dragenter','dragover']) window.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.add('over'); });
for(const ev of ['dragleave','drop']) window.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.remove('over'); });
window.addEventListener('drop',e=>{ if(e.dataTransfer&&e.dataTransfer.files.length) handleFiles([...e.dataTransfer.files]); });

// ── Fullscreen ────────────────────────────────────────────────────────────────
const fsBtn = document.getElementById('fullscreen-btn');
if (fsBtn) {
    const updateFsIcon = () => {
        const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
        fsBtn.title = isFull ? 'Salir de pantalla completa' : 'Pantalla completa';
    };
    fsBtn.addEventListener('click', () => {
        const el = document.documentElement;
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
            (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        }
    });
    document.addEventListener('fullscreenchange',       updateFsIcon);
    document.addEventListener('webkitfullscreenchange', updateFsIcon);
}

// ───────────── arranque ─────────────
(function init(){
  try{ const raw=localStorage.getItem('demokit-studio-plugins'); if(raw){ for(const u of JSON.parse(raw)){ try{ const def=evalPlugin(u.code); registerInstrument(def,{user:true}); USER_PLUGINS.push({id:def.id,name:def.name,code:u.code}); }catch(e){ console.warn('plugin',u.id,e); } } } }catch(e){}
  restoreKit(); populateAddInst(); for(const [a,b] of SIGS){ $('sig').append(el('option',{value:a+'/'+b,text:a+'/'+b})); $('sSel').append(el('option',{value:a+'/'+b,text:a+'/'+b})); } $('sSel').value='3/4';
  try{ const raw=localStorage.getItem('demokit-studio-autosave'); if(raw){ const o=JSON.parse(raw); if(o&&o.format==='demokit-studio'&&o.tracks&&o.tracks.length){ P=projectFromJSON(o); toast('Sesión anterior restaurada. «Nuevo» o «Cargar proyecto de ejemplo» en Demos y plugins para empezar de cero.'); } } }catch(e){ console.warn('autosave',e); }
  $('pname').value=P.name; $('bpm').value=P.bpm; $('bars').value=P.bars; $('sig').value=sigStr(); setMode('draw');
  renderTracks(); renderInspector(); renderLib(); layoutSpacer(); centerTrack(); updateStat(); invalidate(); histReset();
  $('bUndo').onclick=undo; $('bRedo').onclick=redo;
  window.addEventListener('resize',()=>{ layoutSpacer(); invalidate(); });
  window.addEventListener('beforeunload',()=>{ releaseWake(); });
})();
