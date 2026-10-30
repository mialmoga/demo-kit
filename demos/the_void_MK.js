// ── 🕳️ THE VOID ── 174 BPM · Dark DnB / Dubstep · Re menor · dificultad ●●●○○ ──
// Función: renderVoid(sr, onProg)  →  async, devuelve {L, R, dur} (Float32Array estéreo + segundos).
// Necesita: sleep(ms) y el kit makeKit (ver make_kit.js).
// Uso:  const r = await renderVoid(44100, p => console.log(p));   // p va de 0 a ~0.85
// ── 🕳️ THE VOID ───────────────────────────────────────────────
// 174 BPM · Re menor (Dm–Bb–Gm–A) · 64 compases (~88 s)
// intro(0-7) · build(8-15) · drop(16-31) · breakdown half-time(32-39) · drop final(40-59) · outro(60-63)

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

async function renderVoid(sr,onProg){
  const BARS=64, K=makeKit(sr,174,BARS,2.5,20261016);
  const {beat,bar,hz,T,add,syn,kick,snare,hat,crash,riser,mu,lpc,soft,rnd}=K;
  // reese: 4 sierras desafinadas, filtro de 2 polos con wobble sincronizado al pulso (rate = ondas por pulso)
  function reese(t0,len,f,a,rate,open){
    const det=[-16,-6,5,16], D=4, inc=det.map(d=>f*Math.pow(2,d/1200)/sr), ph=det.map(()=>rnd()*.5+.5);
    const iN=Math.floor((len+.03)*sr), rS=Math.floor(len*sr), ak=1/(.004*sr);
    let y1=0, y2=0, i=0;
    add(mu,t0,len+.03,t=>{
      let s=0;
      for(let k=0;k<D;k++){ let p=ph[k]+inc[k]; p-=Math.floor(p); ph[k]=p; s+=2*p-1; }
      const lf=.5-.5*Math.cos(6.2831853*rate*t/beat), kk=lpc(rate>0?150+2600*lf*lf:open);
      y1+=kk*(s/D*1.8-y1); y2+=kk*(y1-y2);
      i++;
      return soft(y2*2.4)*Math.min(1,i*ak)*(i>rS?Math.max(0,(iN-i)/(iN-rS)):1);
    },a,0);
  }
  const CH=[{r:38,tri:[62,65,69]},{r:34,tri:[58,62,65]},{r:31,tri:[55,58,62]},{r:33,tri:[57,61,64]}];
  const RP=[[1,1],[1,2],[2,2],[2,4]];            // ondas de wobble por pulso (1ª y 2ª mitad del compás)
  const duck=new Float32Array(BARS);

  for(let b=0;b<BARS;b++){
    const S=b<8?0:b<16?1:b<32?2:b<40?3:4, ch=CH[b%4], t0=T(b,0);
    const outro=(S===4&&b>=60), drop=(S===2||(S===4&&!outro));
    duck[b]= drop?.78 : S===1?.3 : 0;

    // pad oscuro (se abre en el breakdown y en el outro)
    const padA=[.5,.4,.18,.6,outro?.6:.18][S];
    const padLp=S===0?350+b*110 : S===3?700+(b-32)*150 : S===1?1100 : outro?1200:900;
    for(const m of ch.tri) syn(mu,t0,bar,hz(m),padA*.3,(m%3-1)*.4,{det:[-10,10],w:0,atk:.5,rel:.4,lp:padLp});

    // sub + reese
    if(drop) syn(mu,t0,bar,hz(ch.r),.3,0,{w:2,atk:.02,rel:.1,lp:200});
    if(S===3) syn(mu,t0,bar,hz(ch.r),.16,0,{w:2,atk:.1,rel:.3,lp:200});
    if(S===0&&b>=6) reese(t0,bar,hz(ch.r+12),.1,0,300);
    if(S===1) reese(t0,bar,hz(ch.r+12),.14+(b-8)*.01,0,300+(b-8)*140);
    if(drop){
      const [r1,r2]=RP[b%4], f=hz(ch.r+12), f2=hz(ch.r+12+(b%2?7:0));
      reese(t0,2*beat*.98,f,.22,r1,0);
      reese(T(b,2),2*beat*.98,f2,.22,r2,0);
    }

    // batería drum & bass
    if(S===3){                                   // half-time
      kick(T(b,0),.9,44,6); snare(T(b,2),.7);
      for(let i=0;i<8;i++) hat(T(b,i/2),.06,false,0);
    }else{
      if(b>=4){
        const lvl=S===0?.45:S===1?.7:outro?.6:1;
        kick(T(b,0),lvl); kick(T(b,2.5),lvl*.85);
        if(b>=6){ snare(T(b,1),.8*lvl); snare(T(b,3),.8*lvl); }
        if(drop){ snare(T(b,1.75),.2); snare(T(b,3.75),.16); }
      }
      if(b>=2) for(let i=0;i<16;i++) hat(T(b,i/4),(i%4===2?.12:.06)*(S===0?.7:1),i===10||i===14,i%2?.35:-.35);
    }
    if(b===14||b===15||b===38||b===39){          // redoble de tensión
      const dens=b%2===0?2:4, a0=b%2===0?.25:.35;
      for(let i=0;i<4*dens;i++) snare(T(b,i/dens),a0+.45*i/(4*dens));
    }
    if(b===16||b===40) crash(t0,.3);

    // notas espectrales del breakdown
    if(S===3) [[0,ch.tri[2]+12],[2,ch.tri[0]+24]].forEach(([p,m])=>
      syn(mu,T(b,p),beat*1.9,hz(m),.13,.2,{w:2,atk:.05,rel:.6,dec:.9,lp:2500}));
    // stabs rasposos en el drop final
    if(S===4&&drop) [0,1.5,3].forEach((p,i)=>
      syn(mu,T(b,p),beat*.3,hz(ch.tri[i%3]+12),.07,(i-1)*.4,{det:[-12,12],w:0,atk:.003,rel:.05,dec:5,lp:2600}));

    if(b%3===2){ if(onProg) onProg(b/BARS*.85); await sleep(0); }
  }
  riser(12); riser(36);
  kick(T(BARS,0),1,40,4); crash(T(BARS,0),.35);
  return K.mix(duck,.11);
}
