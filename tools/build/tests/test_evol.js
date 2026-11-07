// Pruebas del kit Evol (y de cualquier kit alterno) sin navegador.   node test_evol.js [kit.js] [demo_kit.js]
// Por defecto: ./demo-kit-Evol.js contra ./demo_kit.js (el kit incluido). Imprime una línea por prueba y sale con código 1 si algo falla.
const fs=require('fs'), load=f=>new Function(fs.readFileSync(f,'utf8')+'\nreturn demoKit;')();
const evol=load(process.argv[2]||'./demo-kit-Evol.js'), base=load(process.argv[3]||'./demo_kit.js'), SR=44100;
let fails=0; const ok=(c,m,x)=>{ console.log((c?'OK   ':'FALLA')+' '+m+(x?'  '+x:'')); if(!c) fails++; };
const buses=K=>[K.dr[0],K.dr[1],K.mu[0],K.mu[1]];
const stat=K=>{ let e=0,pk=0,nan=0,h=0,n=0; for(const c of buses(K)) for(let i=0;i<c.length;i++){ const v=c[i]; if(!isFinite(v)) nan++; e+=v*v; n++; pk=Math.max(pk,Math.abs(v)); if(i%5===0) h=(Math.imul(h,31)+Math.round(v*1e5))|0; } return {rms:Math.sqrt(e/n),pk,nan,h}; };
const db=(a,b)=>20*Math.log10(a/b);
// 1. contrato del kit
const K0=evol(SR,.1,1); for(const k of ['n','dr','mu','rnd','hz','lpc','add','kick','snare','clap','snap','hat','crash','syn','bell','chop','riser','sweep','mix']) if(!(k in K0)) ok(false,'falta K.'+k);
ok(typeof evol.metric==='function','demoKit.metric existe'); ok(evol.info&&evol.info.id,'se identifica (demoKit.info)',JSON.stringify(evol.info));
// 2. determinismo
const song=(mk,c)=>{ if(c!==undefined) mk.character=c; const K=mk(SR,3,11); for(let i=0;i<8;i++){ K.kick(i*.3,1); K.hat(i*.3+.15,.6,i%4===3); } K.snare(.6,1); K.clap(1.2,.8); K.crash(1.5,.4); K.bell(.2,72,.3,0); K.chop(.8,.4,60,.3,0); K.riser(1,1,.2); K.sweep(1.2,1,200,3000,.2);
  K.syn(K.mu,0,2,220,.15,0,{det:[-8,0,8],lp:t=>800+3000*Math.exp(-t*4)}); K.syn(K.mu,.5,1.5,110,.2,0,{det:[-5,5],w:1,lp:1500,res:3}); mk.character=undefined; return K; };
ok(stat(song(evol)).h===stat(song(evol)).h,'misma semilla → mismo audio');
// 3. estabilidad: barrido de corte, resonancia, modos y ondas
let nan=0; for(const fc of [20,200,1000,5000,12000,20000,40000]) for(const q of [.5,3,24]) for(const filt of ['lp','bp','hp']) for(const w of [0,1,2]){ const K=evol(SR,.4,2); K.syn(K.mu,0,.2,110,.2,0,{det:[0,15],lp:fc,res:q,filt,w,drive:.5}); nan+=stat(K).nan; }
ok(nan===0,'sin NaN en el barrido de filtros',nan?nan+' valores':'');
// 4. niveles contra el kit incluido (RMS, dB)
// promedia 8 semillas: con varias voces desafinadas el nivel de una sola nota cambia hasta ±3 dB según cómo caigan las fases
const lv=(name,f)=>{ const r=[evol,base].map(mk=>{ let e=0; for(let s=1;s<=8;s++){ const K=mk(SR,2.6,s); f(K); const q=stat(K).rms; e+=q*q; } return Math.sqrt(e/8); }); const d=db(r[0],r[1]); ok(Math.abs(d)<=1.5,'nivel '+name,d.toFixed(1)+' dB'); };
lv('bombo',K=>K.kick(0,1)); lv('caja',K=>K.snare(0,1)); lv('palma',K=>K.clap(0,1)); lv('hat',K=>K.hat(0,1)); lv('hat abierto',K=>K.hat(0,1,true)); lv('crash',K=>K.crash(0,1));
for(const [nm,o,m] of [['sinte',{det:[-10,0,10],lp:3000},57],['sinte grave',{det:[-10,0,10],lp:3000},36],['supersaw',{det:[-20,-10,0,10,20],lp:t=>1500+5500*Math.exp(-t*9),dec:2.5},57],['cuadrada',{det:[0],w:1,lp:2500},69],['sub',{det:[0],w:2,lp:300},36]]) lv(nm,K=>K.syn(K.mu,0,1.5,K.hz(m),.15,0,o));
// 5. carácter (si el kit lo trae)
if(evol.info&&evol.info.characters) for(const c of evol.info.characters){ const a=stat(song(evol,c)), b=stat(song(evol,c)), n=stat(song(evol)); ok(a.nan===0&&a.h===b.h&&a.h!==n.h,'carácter «'+c+'»: sin NaN, determinista y distinto del neutro',db(a.rms,n.rms).toFixed(1)+' dB'); }
console.log(fails?'\n'+fails+' prueba(s) fallaron':'\nTodo bien'); process.exit(fails?1:0);
