// ── 🍬 COTTON SUGAR ── 140 BPM · Pop pastel · Do mayor · dificultad ●●●●● ──
// Función: renderCotton(sr, onProg)  →  async, devuelve {L, R, dur} (Float32Array estéreo + segundos).
// Necesita: sleep(ms) y el kit makeKit (ver make_kit.js).
// Uso:  const r = await renderCotton(44100, p => console.log(p));   // p va de 0 a ~0.85
// ── 🍬 COTTON SUGAR ───────────────────────────────────────────
// 140 BPM · Do mayor (C–Am–F–G) · 52 compases (~89 s)
// intro(0-7) · build(8-15) · drop dulce(16-31) · breakdown caja de música(32-39) · drop final(40-51)
// ── makeKit: kit de síntesis (WAVESURFER) ─────────────────────────────
// Devuelve las herramientas para componer: kick, snare, hat, syn, mix, etc.
function makeKit(sr,BPM,BARS,tail,seed0){
  const beat=60/BPM, bar=beat*4, n=Math.ceil((BARS*bar+tail)*sr);
  const dr=[new Float32Array(n),new Float32Array(n)], mu=[new Float32Array(n),new Float32Array(n)];
  let seed=seed0;
  const rnd=()=>{ seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/2147483648-1; };
  const hz=m=>440*Math.pow(2,(m-69)/12);
  const lpc=fc=>1-Math.exp(-2*Math.PI*Math.min(fc,sr*.45)/sr);
  const T=(b,p)=>b*bar+p*beat;
  const soft=x=>x<-3?-1:x>3?1:x*(27+x*x)/(27+9*x*x);   // tanh barato

  function add(buf,t0,len,fn,amp,pan){
    const s0=Math.max(0,Math.floor(t0*sr)), N=Math.min(Math.floor(len*sr),n-s0);
    const th=(pan+1)*Math.PI/4, gl=amp*Math.cos(th)*1.414, gr=amp*Math.sin(th)*1.414;
    for(let i=0;i<N;i++){ const v=fn(i/sr); buf[0][s0+i]+=v*gl; buf[1][s0+i]+=v*gr; }
  }
  const kick=(t0,a,f0,dk)=>{ f0=f0||46; dk=dk||6.5; add(dr,t0,.45,t=>{
    const ph=2*Math.PI*(f0*t+105/30*(1-Math.exp(-30*t)));
    return Math.sin(ph)*Math.exp(-t*dk)*Math.min(1,t*800)+Math.exp(-t*200)*.3; },a,0); };
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
  function riser(bs,a){
    const len=4*bar; let y=0;
    add(mu,T(bs,0),len,t=>{ const p=t/len, x=rnd(); y+=lpc(250+9000*p*p)*(x-y); return y*(.05+p*p*.9); },a||.5,0);
  }
  // mezcla: sidechain por pulso + saturación suave + fundido final
  function mix(duck,dkTime){
    const L=new Float32Array(n), R=new Float32Array(n), endT=BARS*bar, total=n/sr;
    let peak=0;
    for(let i=0;i<n;i++){
      const t=i/sr, b=Math.min(BARS-1,Math.floor(t/bar));
      const g=1-(t<endT?duck[b]:0)*Math.exp(-(t%beat)/(dkTime||.13));
      const fade=t>total-.6?Math.max(0,(total-t)/.6):1;
      L[i]=soft((dr[0][i]+mu[0][i]*g)*.9)*fade; R[i]=soft((dr[1][i]+mu[1][i]*g)*.9)*fade;
      peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));
    }
    if(peak>.92){ const k=.92/peak; for(let i=0;i<n;i++){ L[i]*=k; R[i]*=k; } }
    return {L,R,dur:total};
  }
  return {beat,bar,rnd,hz,lpc,T,soft,add,kick,snare,clap,hat,crash,syn,riser,mix,mu,dr};
}

async function renderCotton(sr,onProg){
  const BARS=52, K=makeKit(sr,140,BARS,2.5,20261015);
  const {beat,bar,hz,T,add,syn,kick,snare,clap,hat,crash,riser,mu}=K;
  // campanita / caja de música: parciales inarmónicos que se apagan rápido
  const bell=(t0,m,a,pan,len)=>{
    const f=hz(m);
    add(mu,t0,len||1.3,t=>{
      const w=6.2831853*f*t;
      return (Math.sin(w)*Math.exp(-t*3.2)+Math.sin(w*2.756)*.35*Math.exp(-t*7)+Math.sin(w*5.404)*.12*Math.exp(-t*12))*Math.min(1,t*1500);
    },a,pan);
  };
  const CH=[{r:48,s:36,tri:[60,64,67]},{r:45,s:33,tri:[57,60,64]},{r:41,s:29,tri:[57,60,65]},{r:43,s:31,tri:[55,59,62]}];
  // estribillo de 4 compases: [posición en pulsos, nota MIDI, duración en pulsos]
  const HK=[
    [[0,76,.5],[.5,79,.5],[1,84,1],[2.5,79,.5],[3,76,1]],
    [[0,76,.5],[.5,81,.5],[1,84,1],[2.5,81,.5],[3,76,1]],
    [[0,77,.5],[.5,81,.5],[1,84,1],[2.5,81,.5],[3,77,1]],
    [[0,79,.5],[.5,83,.5],[1,86,1],[2,83,.5],[2.5,79,.5],[3,74,1]]];
  const HK4B=[[0,79,.5],[.5,83,.5],[1,86,.5],[1.5,88,.5],[2,86,1],[3,83,1]];
  const ARP=[0,1,2,3,2,1,2,3], BASS=[[0,0],[.5,12],[1.5,0],[2,0],[2.5,12],[3.5,7]];
  const duck=new Float32Array(BARS);

  for(let b=0;b<BARS;b++){
    const S=b<8?0:b<16?1:b<32?2:b<40?3:4, g=b%4, ch=CH[g], t0=T(b,0), drop=(S===2||S===4);
    duck[b]= drop?.5 : S===1?.18 : 0;

    // pad de seno, suave y brillante
    const padA=[.42,.3,.2,.5,.2][S];
    for(const m of ch.tri) syn(mu,t0,bar,hz(m),padA*.3,((m%5)-2)*.2,{det:[-7,7],w:2,atk:.35,rel:.4,lp:3000});

    // sub + bajo pizzicato saltarín
    if(drop) syn(mu,t0,bar,hz(ch.s),.22,0,{w:2,atk:.02,rel:.1,lp:300});
    if(drop||(S===1&&b>=12)) for(const [p,o] of BASS)
      syn(mu,T(b,p),beat*.4,hz(ch.r+o),.17,0,{w:0,atk:.003,rel:.04,dec:7,lp:t=>300+1500*Math.exp(-t*16)});

    // arpegio de campanitas
    if((S===0&&b>=2)||S===1||drop||S===3){
      const pool=[ch.tri[0]+12,ch.tri[1]+12,ch.tri[2]+12,ch.tri[1]+24], aA=S===0?.09:S===3?.1:.07;
      for(let i=0;i<8;i++) bell(T(b,i/2),pool[ARP[i]],aA,i%2?.35:-.35,.9);
    }
    // estribillo: lead cuadrado + campanita en los drops; solo caja de música en el breakdown
    const lead=(S===2&&b>=20)||S===4;
    if(lead||S===3){
      const hk=(g===3&&((b>>2)&1))?HK4B:HK[g];
      for(const [p,m,d] of hk){
        const tt=T(b,p);
        if(lead){ syn(mu,tt,d*beat*.92,hz(m),.085,0,{det:[-8,8],w:1,atk:.005,rel:.08,dec:2,lp:4200}); bell(tt,m,.07,.2,1.1); }
        else bell(tt,m,.15,.15,1.8);
      }
    }
    // stabs de acorde a contratiempo
    if(drop) for(const p of [.5,2.5]) for(const m of ch.tri)
      syn(mu,T(b,p),beat*.18,hz(m+12),.03,0,{w:1,atk:.003,rel:.04,lp:3200});

    // batería pop
    if(S!==3&&b>=6) for(let k=0;k<4;k++) kick(T(b,k),S===0?.4:S===1?.65:.85,52,8);
    if(S===0&&b>=4) for(let i=0;i<8;i++) hat(T(b,i/2),.07,false,i%2?.3:-.3);
    if(S===1||drop) for(let i=0;i<16;i++){ const off=(i%4===2); hat(T(b,i/4),off?.15:.05,off,i%2?.3:-.3); }
    if(drop){ clap(T(b,1),.5); clap(T(b,3),.5); }
    if(b===14||b===15||b===38||b===39){          // redoble de tensión
      const dens=b%2===0?2:4, a0=b%2===0?.2:.3;
      for(let i=0;i<4*dens;i++) snare(T(b,i/dens),a0+.4*i/(4*dens));
    }
    if(b===16||b===40) crash(t0,.28);
    if(b%3===2){ if(onProg) onProg(b/BARS*.85); await sleep(0); }
  }
  riser(12); riser(36);
  kick(T(BARS,0),1,52,8); crash(T(BARS,0),.3);
  for(const m of [84,88,91]) bell(T(BARS,0),m,.14,0,2.2);   // acorde final de campanitas
  return K.mix(duck,.15);
}
