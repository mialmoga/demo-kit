// ── ⚡ ELECTRONIC RUSH ── 128 BPM · Electro · La menor · dificultad ●●○○○ ──
// Función: renderDemo(sr, onProg)  →  async, devuelve {L, R, dur} (Float32Array estéreo + segundos).
// Necesita: una función global sleep(ms) (p. ej. const sleep=ms=>new Promise(r=>setTimeout(r,ms))).
// Uso:  const r = await renderDemo(44100, p => console.log(p));   // p va de 0 a ~0.85
// ── DEMO ──────────────────────────────────────────────────────
// ── DEMO v4: sintetizador generativo ──────────────────────────
// 128 BPM · La menor (Am–F–C–G) · 48 compases (~92 s)
// intro(0-7) · build(8-15) · drop(16-31) · breakdown(32-39) · drop final(40-47)
async function renderDemo(sr,onProg){
  const BPM=128, beat=60/BPM, bar=beat*4, BARS=48, n=Math.ceil((BARS*bar+2.5)*sr);
  const dr=[new Float32Array(n),new Float32Array(n)], mu=[new Float32Array(n),new Float32Array(n)];
  let seed=20261012;
  const rnd=()=>{ seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/2147483648-1; };
  const hz=m=>440*Math.pow(2,(m-69)/12);
  const lpc=fc=>1-Math.exp(-2*Math.PI*Math.min(fc,sr*.45)/sr);
  const T=(b,p)=>b*bar+p*beat;

  function add(buf,t0,len,fn,amp,pan){
    const s0=Math.max(0,Math.floor(t0*sr)), N=Math.min(Math.floor(len*sr),n-s0);
    const th=(pan+1)*Math.PI/4, gl=amp*Math.cos(th)*1.414, gr=amp*Math.sin(th)*1.414;
    for(let i=0;i<N;i++){ const v=fn(i/sr); buf[0][s0+i]+=v*gl; buf[1][s0+i]+=v*gr; }
  }
  // percusión
  const kick=(t0,a)=>add(dr,t0,.45,t=>{
    const ph=2*Math.PI*(46*t+105/30*(1-Math.exp(-30*t)));
    return Math.sin(ph)*Math.exp(-t*6.5)*Math.min(1,t*800)+Math.exp(-t*200)*.3; },a,0);
  const snare=(t0,a)=>{ let p=0; add(dr,t0,.25,t=>{ const x=rnd(), v=x-p*.6; p=x;
    return v*Math.exp(-t*20)*.6+Math.sin(2*Math.PI*185*t)*Math.exp(-t*28)*.5; },a,0); };
  const clap=(t0,a)=>{ let p=0; add(dr,t0,.3,t=>{ const x=rnd(), v=x-p*.7; p=x;
    return v*(Math.exp(-(t%.011)*90)*(t<.033?1:0)+Math.exp(-t*14)*.7); },a,0); };
  const hat=(t0,a,open,pan)=>{ let p=0; add(dr,t0,open?.3:.07,t=>{ const x=rnd(), v=x-p; p=x;
    return v*Math.exp(-t*(open?13:75)); },a,pan||0); };
  const crash=(t0,a)=>{ let p=0; add(dr,t0,2.4,t=>{ const x=rnd(), v=x-p*.5; p=x;
    return v*Math.exp(-t*2.2); },a,0); };

  // sintetizador: w 0=sierra 1=cuadrada 2=seno · det en cents · lp en Hz (o función del tiempo)
  function syn(buf,t0,len,f,a,pan,o){
    const det=o.det||[0], D=det.length, inc=det.map(d=>f*Math.pow(2,d/1200)/sr), ph=det.map(()=>rnd()*.5+.5);
    const atk=o.atk||.004, rel=o.rel||.06, w=o.w||0, tot=len+rel;
    const lpf=typeof o.lp==='function', lpk=lpf?0:lpc(o.lp||3000);
    const dk=Math.exp(-(o.dec||0)/sr), ak=1/(atk*sr), rk=1/(rel*sr), iN=Math.floor(tot*sr), rS=iN-Math.floor(rel*sr);
    let y=0, e=1, i=0;
    add(buf,t0,tot,t=>{
      let s=0;
      for(let k=0;k<D;k++){
        let p=ph[k]+inc[k]; p-=Math.floor(p); ph[k]=p;
        s+= w===0 ? 2*p-1 : w===1 ? (p<.5?1:-1) : Math.sin(6.2831853*p);
      }
      y+=(lpf?lpc(o.lp(t)):lpk)*(s/D-y);
      e*=dk; i++;
      return y*Math.min(1,i*ak)*e*(i>rS?Math.max(0,(iN-i)*rk):1);
    },a,pan);
  }
  function riser(bs){
    const len=4*bar; let y=0;
    add(mu,T(bs,0),len,t=>{ const p=t/len, x=rnd(); y+=lpc(250+9000*p*p)*(x-y); return y*(.05+p*p*.9); },.5,0);
  }

  const CH=[{r:33,tri:[57,60,64]},{r:29,tri:[57,60,65]},{r:36,tri:[55,60,64]},{r:31,tri:[55,59,62]}];
  const ARP=[0,1,2,3,2,1,2,3,0,1,2,3,3,2,1,2];
  const MA=[3,-1,2,3,-1,1,2,-1], MB=[2,-1,3,-1,2,1,0,-1];
  const duck=new Float32Array(BARS);

  for(let b=0;b<BARS;b++){
    const S=b<8?0:b<16?1:b<32?2:b<40?3:4, ch=CH[b%4], t0=T(b,0), drop=(S===2||S===4);
    duck[b]= drop?.72 : S===1?.25+(b-8)*.05 : (S===0&&b>=6)?.1 : 0;

    // pad (respira: abierto en intro/breakdown, discreto en drops)
    const padA=[.5,.32,.2,.5,.2][S];
    const padLp=S===0?500+b*180 : S===3?900+(b-32)*250 : S===1?1800 : 2200;
    for(const m of ch.tri) syn(mu,t0,bar,hz(m),padA*.35,(m%3-1)*.4,{det:[-8,8],w:0,atk:.5,rel:.4,lp:padLp});

    // sub + bajo a contratiempo
    if(S===1||drop) syn(mu,t0,bar,hz(ch.r),.28,0,{w:2,atk:.02,rel:.1,lp:300});
    if(drop||(S===1&&b>=12))
      for(let k=0;k<4;k++) syn(mu,T(b,k+.5),beat*.45,hz(ch.r+12),.2,0,
        {det:[-6,6],w:0,atk:.004,rel:.05,dec:3,lp:t=>260+900*Math.exp(-t*14)});

    // arpegio de 16avos
    if((S===0&&b>=2)||S===1||drop){
      const oct=S>=2?12:0, pool=[ch.tri[0],ch.tri[1],ch.tri[2],ch.tri[0]+12].map(m=>m+oct);
      const aA=S===0?.07:S===1?.1:.12;
      for(let i=0;i<16;i++) syn(mu,T(b,i/4),beat*.22,hz(pool[ARP[i]]),aA,i%2?.35:-.35,
        {w:0,atk:.002,rel:.03,dec:9,lp:S===0?1400:2800});
    }
    // lead (a partir del compás 20 del primer drop y todo el drop final)
    if((S===2&&b>=20)||S===4){
      const pool=[...ch.tri.map(m=>m+12),ch.tri[0]+24], mo=b%2?MB:MA;
      for(let i=0;i<8;i++) if(mo[i]>=0)
        syn(mu,T(b,i/2),beat*.42,hz(pool[mo[i]]),.1,0,{det:[-10,10],w:1,atk:.006,rel:.08,dec:2.5,lp:3200});
    }
    // melodía del breakdown
    if(S===3) [[0,ch.tri[2]+12],[2,ch.tri[0]+24]].forEach(([p,m])=>
      syn(mu,T(b,p),beat*1.9,hz(m),.16,.2,{w:2,atk:.004,rel:.4,dec:1.4,lp:2500}));

    // batería
    if(S!==3&&b>=6) for(let k=0;k<4;k++) kick(T(b,k),S===0?.5:S===1?.75:1);
    if(S===0&&b>=4) for(let i=0;i<8;i++) hat(T(b,i/2),.1,false,i%2?.3:-.3);
    if(S===1||drop) for(let i=0;i<16;i++){
      const off=(i%4===2); hat(T(b,i/4),(off?.17:.09)*(S===1?.8:1),off,i%2?.3:-.3);
    }
    if(drop){ clap(T(b,1),.55); clap(T(b,3),.55); }
    if(b===14||b===15||b===38||b===39){          // redoble de tensión
      const dens=b%2===0?2:4, a0=b%2===0?.25:.35;
      for(let i=0;i<4*dens;i++) snare(T(b,i/dens),a0+.45*i/(4*dens));
    }
    if(b===16||b===40) crash(t0,.3);
    if(b%3===2){ if(onProg) onProg(b/BARS*.85); await sleep(0); }   // cede el hilo: la UI no se congela
  }
  riser(12); riser(36);
  kick(T(BARS,0),1); crash(T(BARS,0),.35);

  // mezcla: sidechain por golpe de bombo + saturación suave + fundido final
  const L=new Float32Array(n), R=new Float32Array(n), endT=BARS*bar, total=n/sr;
  let peak=0;
  const soft=x=>x<-3?-1:x>3?1:x*(27+x*x)/(27+9*x*x);   // tanh barato
  for(let i=0;i<n;i++){
    const t=i/sr, b=Math.min(BARS-1,Math.floor(t/bar));
    const g=1-(t<endT?duck[b]:0)*Math.exp(-(t%beat)/.13);
    const fade=t>total-.6?Math.max(0,(total-t)/.6):1;
    L[i]=soft((dr[0][i]+mu[0][i]*g)*.9)*fade; R[i]=soft((dr[1][i]+mu[1][i]*g)*.9)*fade;
    peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));
  }
  if(peak>.92){ const k=.92/peak; for(let i=0;i<n;i++){ L[i]*=k; R[i]*=k; } }
  return {L,R,dur:total};
}
