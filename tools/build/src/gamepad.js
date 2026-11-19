// ── 🎮 Control: asigna palancas y gatillos de un control (Gamepad API) a los sliders visibles del panel de la pista.
//   Mapeo = {mod, src, target, mode, rate, inv}: mod = botón que hay que mantener (''= ninguno de los modificadores usados), src = LX LY RX RY LT RT,
//   target = «grupo|etiqueta» del slider (se busca en el panel, así sirve con cualquier instrumento o efecto que tenga ese slider), mode = rel (la palanca empuja el valor) o abs (la palanca es el valor).
const PAD_LS='demokit-pad', PAD_MODS=['A','B','X','Y','LB','RB'], PAD_BTN={A:0,B:1,X:2,Y:3,LB:4,RB:5}, PAD_SRC=[['RX','Palanca der. ↔'],['RY','Palanca der. ↕'],['LX','Palanca izq. ↔'],['LY','Palanca izq. ↕'],['RT','Gatillo der.'],['LT','Gatillo izq.']];
const padLoad=()=>{ try{ const o=JSON.parse(localStorage.getItem(PAD_LS)||'{}'); return {on:o.on!==false,maps:Array.isArray(o.maps)?o.maps:[],presets:o.presets&&typeof o.presets==='object'?o.presets:{}}; }catch(e){ return {on:true,maps:[],presets:{}}; } };
let PAD=padLoad(), padUI=null, padRaf=0, padPrev={}, padTimer=0, padLive='';
const padSave=()=>{ try{ localStorage.setItem(PAD_LS,JSON.stringify(PAD)); }catch(e){} };
function padSliders(){ const out=[]; for(const row of document.querySelectorAll('#insp .row')){ const inp=row.querySelector('input[type=range]'), lb=row.querySelector('label'); if(!inp||!lb) continue;
    const gh=row.closest('.fxg')&&row.closest('.fxg').querySelector('.fxh'), sc=row.closest('.sec')&&row.closest('.sec').querySelector('h4'), fd=row.closest('.fold')&&row.closest('.fold').querySelector('.nm');
    const grp=((gh||sc||fd||{}).textContent||'').trim().replace(/\s+/g,' ').slice(0,40); out.push({key:grp+'|'+lb.textContent.trim(),inp,grp,label:lb.textContent.trim()}); } return out; }
function padRead(g,src){ const a=g.axes; switch(src){ case 'LX': return a[0]||0; case 'LY': return -(a[1]||0); case 'RX': return a[2]||0; case 'RY': return -(a[3]||0); case 'LT': return g.buttons[6]?g.buttons[6].value:0; case 'RT': return g.buttons[7]?g.buttons[7].value:0; } return 0; }
function padPad(){ for(const g of (navigator.getGamepads?navigator.getGamepads():[])) if(g&&g.connected) return g; return null; }
function padApply(inp,v){ const mn=+inp.min, mx=+inp.max, st=+inp.step||0; v=clamp(v,mn,mx); if(st>0) v=mn+Math.round((v-mn)/st)*st; v=+v.toFixed(4); if(v===+inp.value) return false; inp.value=v; inp.dispatchEvent(new Event('input')); return true; }
function padTick(){ padRaf=0; const g=padPad(); if(!g||!PAD.on){ if(padUI) padUI.state(g?'pausado':'sin control'); if(g||padUI) padRaf=requestAnimationFrame(padTick); return; }
  const now=performance.now(), dt=Math.min(.1,(now-(padTick.t||now))/1000); padTick.t=now;
  const held=new Set(PAD_MODS.filter(m=>g.buttons[PAD_BTN[m]]&&g.buttons[PAD_BTN[m]].pressed)), used=new Set(PAD.maps.map(m=>m.mod).filter(Boolean)); let any=false, sl=null;
  for(const m of PAD.maps){ if(!m.target) continue; const on=m.mod?held.has(m.mod):![...used].some(u=>held.has(u)); if(!on) continue;
    let v=padRead(g,m.src); const trig=m.src==='LT'||m.src==='RT', dz=trig?.04:.18; if(Math.abs(v)<dz){ continue; } v=Math.sign(v)*(Math.abs(v)-dz)/(1-dz); if(m.inv) v=-v;
    sl=sl||padSliders(); const s=sl.find(x=>x.key===m.target); if(!s) continue; const mn=+s.inp.min, mx=+s.inp.max;
    const ch=m.mode==='abs'?padApply(s.inp,trig?mn+Math.abs(v)*(mx-mn):mn+(v+1)/2*(mx-mn)):padApply(s.inp,+s.inp.value+Math.sign(v)*v*v*(mx-mn)*(m.rate||.5)*dt*(trig?1:1)); if(ch){ any=true; padLive=s.label; } }
  if(any){ clearTimeout(padTimer); padTimer=setTimeout(()=>{ for(const s of padSliders()) if(s.label===padLive){ s.inp.dispatchEvent(new Event('change')); break; } },350); }
  if(padUI) padUI.state('🎮 '+g.id.replace(/\s*\(.*$/,'').slice(0,40)+(held.size?' · '+[...held].join('+'):'')+(any?' · '+padLive:''));
  padRaf=requestAnimationFrame(padTick); }
const padStart=()=>{ if(!padRaf) padRaf=requestAnimationFrame(padTick); };
addEventListener('gamepadconnected',padStart); if(PAD.maps.length) padStart();
const PAD_EXAMPLES={'Espacio 3D':[{mod:'',src:'RX',target:'Espacio 3D (audífonos)|Izquierda ← → derecha',mode:'rel',rate:.25},{mod:'',src:'RY',target:'Espacio 3D (audífonos)|Atrás ← → adelante',mode:'rel',rate:.25},{mod:'',src:'RT',target:'Espacio 3D (audífonos)|Radio de la órbita',mode:'rel',rate:.25},{mod:'',src:'LT',target:'Espacio 3D (audífonos)|Radio de la órbita',mode:'rel',rate:.25,inv:true},{mod:'X',src:'LX',target:'Espacio 3D (audífonos)|Giro (vueltas por compás; − = al revés)',mode:'rel',rate:.2},{mod:'Y',src:'LY',target:'Espacio 3D (audífonos)|Abajo ↓ ↑ arriba',mode:'rel',rate:.25}]};
function openPad(){ if(padUI){ padUI.close(); return; }
  const box=el('div',{class:'card',style:'position:fixed;right:12px;bottom:12px;z-index:60;width:min(520px,calc(100vw - 24px));max-height:70vh;overflow:auto;padding:10px;font-size:12px;box-shadow:0 6px 24px #0006'}), stat=el('div',{style:'opacity:.8;margin:2px 0 6px'}), list=el('div');
  const sel=(opts,v,fn,w)=>{ const s=el('select',{style:w?'max-width:'+w:'',onchange:e=>fn(e.target.value)}); for(const [a,b] of opts) s.append(el('option',{value:a,text:b})); s.value=v; return s; };
  function draw(){ list.textContent=''; const sl=padSliders(), keys=new Set(sl.map(s=>s.key));
    if(!PAD.maps.length) list.append(el('p',{class:'desc',text:'Sin asignaciones. Elige una pista y pulsa «Añadir», o carga el ejemplo del Espacio 3D (enciende el efecto en la pista primero).'}));
    PAD.maps.forEach((m,i)=>{ const row=el('div',{style:'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:4px 0;padding:4px;border-radius:6px;background:#8884'});
      const tg=[['','— slider —'],...sl.map(s=>[s.key,(s.grp?s.grp+' · ':'')+s.label])]; if(m.target&&!keys.has(m.target)) tg.push([m.target,'(no visible) '+m.target.replace('|',' · ')]);
      row.append(sel([['','sin botón'],...PAD_MODS.map(x=>[x,x+' +'])],m.mod,v=>{ m.mod=v; padSave(); },'70px'),sel(PAD_SRC,m.src,v=>{ m.src=v; padSave(); },'120px'),'→',sel(tg,m.target,v=>{ m.target=v; padSave(); },'190px'),
        sel([['rel','empuja'],['abs','es el valor']],m.mode||'rel',v=>{ m.mode=v; padSave(); },'90px'),
        el('input',{type:'number',value:m.rate||.5,min:.05,max:4,step:.05,style:'width:48px',title:'Velocidad (modo «empuja»): recorridos del slider por segundo con la palanca a fondo',onchange:e=>{ m.rate=+e.target.value||.5; padSave(); }}),
        el('label',{class:'chk',title:'Invertir'},el('input',{type:'checkbox',checked:!!m.inv,onchange:e=>{ m.inv=e.target.checked; padSave(); }}),'⇅'),
        el('button',{class:'sm',text:'✕',onclick:()=>{ PAD.maps.splice(i,1); padSave(); draw(); }})); list.append(row); });
    const pre=Object.keys(PAD.presets), ex=Object.keys(PAD_EXAMPLES);
    foot.textContent=''; foot.append(el('button',{class:'sm',text:'+ Añadir',onclick:()=>{ PAD.maps.push({mod:'',src:'RX',target:'',mode:'rel',rate:.5}); padSave(); draw(); }}),
      sel([['','Ejemplos / guardados…'],...ex.map(n=>['e:'+n,'Ejemplo: '+n]),...pre.map(n=>['p:'+n,'Guardado: '+n])],'',v=>{ if(!v) return; const src=v[0]==='e'?PAD_EXAMPLES[v.slice(2)]:PAD.presets[v.slice(2)]; PAD.maps=JSON.parse(JSON.stringify(src)); padSave(); draw(); },'180px'),
      el('button',{class:'sm',text:'💾 Guardar como…',onclick:()=>{ const n=(prompt('Nombre del mapeo')||'').trim(); if(!n) return; PAD.presets[n]=JSON.parse(JSON.stringify(PAD.maps)); padSave(); draw(); }}),
      pre.length?el('button',{class:'sm',text:'🗑 Borrar guardado',onclick:()=>{ const n=prompt('Nombre del mapeo guardado a borrar:\n'+pre.join(', ')); if(n&&PAD.presets[n]){ delete PAD.presets[n]; padSave(); draw(); } }}):'',
      el('button',{class:'sm',text:'↻ Actualizar lista',title:'Vuelve a leer los sliders visibles',onclick:draw})); }
  const foot=el('div',{style:'display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px'});
  const on=el('label',{class:'chk'},el('input',{type:'checkbox',checked:PAD.on,onchange:e=>{ PAD.on=e.target.checked; padSave(); }}),' Activo'), x=el('button',{class:'sm',text:'✕',style:'float:right',onclick:()=>padUI.close()});
  box.append(x,el('b',{text:'🎮 Control'}),' ',on,stat,el('p',{class:'desc',text:'Un mapeo con botón (X, Y, A, B, LB, RB) solo actúa mientras lo mantienes; los de «sin botón» actúan cuando no mantienes ninguno de los botones usados. «Empuja»: la palanca mueve el slider y lo deja donde lo sueltes. Funciona con los sliders visibles del panel de la pista seleccionada.'}),list,foot);
  document.body.append(box); draw(); padStart(); const ob=new MutationObserver(()=>{ clearTimeout(padUI.t); padUI.t=setTimeout(()=>{ if(padUI&&!box.contains(document.activeElement)) draw(); },300); }); ob.observe($('insp'),{childList:true});
  padUI={t:0,state:s=>{ stat.textContent=s; },close:()=>{ ob.disconnect(); box.remove(); padUI=null; }}; padUI.state(padPad()?'🎮 conectado':'Conecta el control y presiona un botón');
}
