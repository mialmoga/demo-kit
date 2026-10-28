// ── THE VOID · dark drum & bass con medio tiempo dubstep · 174 BPM · Re menor (Dm7–Bbmaj7–Gm7–A7) ──
// intro(0-7) vacío · build(8-15) · drop DnB(16-31) · breakdown medio tiempo(32-39) · drop final(40-55) · cierre pesado(56-63)
async function renderVoid(sr,onProg){
  const BPM=174, beat=60/BPM, bar=beat*4, BARS=64, K=demoKit(sr,BARS*bar+2.5,20261017);
  const {mu,dr,hz,lpc,rnd,add,syn,kick,snare,clap,hat,crash,bell,riser,sweep}=K;
  const T=(b,p)=>b*bar+p*beat;
  const CH=[{r:38,t:[50,53,57,60]},{r:34,t:[46,50,53,57]},{r:31,t:[43,46,50,53]},{r:33,t:[45,49,52,55]}];
  const KS={lo:48,hi:140,k:45,dec:9,len:.3,click:.45};                 // bombo seco y rápido
  const sat=x=>x/(1+Math.abs(x));

  // reese: tres sierras desafinadas → filtro de 2 polos que se abre y se cierra → saturación
  function reese(t0,len,m,a,o){
    const f=hz(m), cents=[-17,0,17], inc=cents.map(c=>f*Math.pow(2,c/1200)/sr), ph=cents.map(()=>rnd()*.5+.5);
    const lfo=o.lfo||0, lo=o.lo||300, hi=o.hi||1400, drive=o.drive||2.2, L=len+.05; let y1=0,y2=0;
    add(mu,t0,L,t=>{ let s=0;
      for(let k=0;k<3;k++){ ph[k]+=inc[k]*(1+.002*Math.sin(t*2.1+k)); ph[k]-=Math.floor(ph[k]); s+=2*ph[k]-1; }
      const c=lpc(lo+(hi-lo)*(.5+.5*Math.sin(6.2831853*lfo*t))); y1+=c*(s/3-y1); y2+=c*(y1-y2);
      return sat(y2*drive)*Math.min(1,t/.01)*Math.min(1,(L-t)/.05)*1.2; },a,0);
  }
  // growl: FM con índice modulado por un LFO al ritmo (el "wob" dubstep) → saturación → filtro que respira
  function growl(t0,len,m,a,rate){
    const f=hz(m), L=len+.04; let pc=0,pm=0,y=0;
    add(mu,t0,L,t=>{ pc+=f/sr; pm+=f*2.01/sr; pc-=Math.floor(pc); pm-=Math.floor(pm);
      const lf=.5+.5*Math.sin(6.2831853*rate*t), x=sat(2.5*Math.sin(6.2831853*pc+(1.5+6*lf)*Math.sin(6.2831853*pm)));
      y+=lpc(500+3000*lf)*(x-y);
      return y*Math.min(1,t/.008)*Math.min(1,(L-t)/.04)*1.3; },a,0);
  }
  function rim(t0,a,pan){ let p=0; add(dr,t0,.1,t=>{ const x=rnd(), v=x-p*.5; p=x; return Math.sin(2*Math.PI*880*t)*Math.exp(-t*70)+v*Math.exp(-t*90)*.6; },a,pan); }   // clic seco
  function wash(t0,len,a,fc){ let y=0; add(mu,t0,len,t=>{ y+=lpc(fc)*(rnd()-y); return y*Math.min(1,t/.8)*Math.min(1,(len-t)/.8); },a,0); }
  function impact(t0,a){ add(mu,t0,1.1,t=>Math.sin(2*Math.PI*(35*t+(85/3)*(1-Math.exp(-3*t))))*Math.exp(-t*2.6),a,0); }   // sub que cae

  const mode=new Uint8Array(BARS);                                      // para el sidechain: 1 build · 2 DnB · 3 medio tiempo
  for(let b=0;b<BARS;b++){
    const S=b<8?0:b<16?1:b<32?2:b<40?3:b<56?4:5, ch=CH[b%4], t0=T(b,0), dnb=(S===2||S===4), half=(S===3||S===5);
    mode[b]= dnb?2 : half?3 : S===1&&b>=10?1 : 0;

    // pad oscuro y viento
    const padA=[.2,.15,.1,.14,.1,.12][S], padLp=S===0?300+b*40 : S===3?500+(b-32)*60 : 700;
    for(const m of ch.t) syn(mu,t0,bar,hz(m),padA*.3,((m%5)-2)*.2,{det:[-12,12],w:0,atk:.9,rel:.6,lp:padLp});
    if(S<=1||S===3) wash(t0,bar,S===3?.07:.05,S===3?2500:1500);
    if(S===0||S===3) bell(T(b,b%2?2.5:0),ch.t[(b>>1)%4]+24,.1,b%2?.35:-.35,2);   // campana lejana

    // graves: sub + reese
    if(S>=1||b>=6){
      const sA=S===0?.12:dnb?.45:S===3?.14:.2;
      add(mu,t0,bar*.97,t=>Math.sin(2*Math.PI*hz(ch.r)*t)*Math.min(1,t*40)*(dnb?Math.exp(-t*.9):1)*Math.min(1,(bar*.97-t)*30),sA,0);
    }
    if(dnb){
      reese(T(b,0),beat*2.4,ch.r+12,.42,{lfo:S===4?1/beat:1/(beat*2),lo:260,hi:S===4?1900:1400});
      reese(T(b,2.5),beat*1.4,ch.r+12,.4,{lfo:S===4?1/beat:1/(beat*2),lo:260,hi:S===4?1900:1400});
      for(const p of [1.5,3.5]) for(const m of ch.t.slice(0,3))
        syn(mu,T(b,p),beat*.22,hz(m+12),.1,((m%3)-1)*.3,{det:[-10,10],w:0,atk:.003,rel:.05,dec:6,lp:t=>300+2800*Math.exp(-t*12)});
      if(S===4&&b%8===7) growl(T(b,2),beat*1.9,ch.r+12,.2,3/beat);                    // relleno de "wob" antes de cambiar
    }
    if(half){
      growl(T(b,0),beat*1.85,ch.r+12,S===5?.18:.1,2/beat);
      growl(T(b,2),beat*1.85,ch.r+15,S===5?.18:.1,S===5?4/beat:2/beat);
    }
    if(S===1&&b>=12) reese(t0,bar,ch.r+12,.13,{lfo:1/(beat*2),lo:200,hi:300+(b-12)*220});

    // batería
    if(dnb){
      kick(T(b,0),1,KS); kick(T(b,2.5),.9,KS);
      snare(T(b,1),.85,{tone:235,nd:14,td:24}); snare(T(b,3),.85,{tone:235,nd:14,td:24});
      snare(T(b,1.75),.12,{tone:200,nd:22,td:40}); snare(T(b,3.75),.12,{tone:200,nd:22,td:40});
      for(let i=0;i<8;i++) hat(T(b,i/2),i%2?.16:.08,false,i%2?.3:-.3);
      hat(T(b,3.5),.18,true,.3);
    }
    if(S===4||(S===2&&b>=24)){                                   // arpegio oscuro (más tráfico en la segunda mitad)
      const pool=ch.t.map(m=>m+24), pat=(b%2)?[3,-1,2,3,-1,1,2,-1]:[2,3,-1,1,2,-1,3,1];
      for(let i=0;i<8;i++) if(pat[i]>=0) syn(mu,T(b,i/2),beat*.4,hz(pool[pat[i]]),.09,i%2?.4:-.4,{det:[-8,8],w:1,atk:.003,rel:.05,dec:7,lp:t=>700+3200*Math.exp(-t*13)});
    }
    if(S===4||(S===2&&b>=20)) for(const p of [.5,1.25,2,3.25]) rim(T(b,p),.16,(p>2?.4:-.4));   // sincopa extra = más tráfico
    if(half){
      kick(T(b,0),1,KS); snare(T(b,2),.95,{tone:210,nd:12,td:20,len:.3}); clap(T(b,2),.45);
      for(let i=0;i<8;i++) hat(T(b,i/2),i%2?.06:.03,false,i%2?.3:-.3);
      if(S===5&&b%2===1) kick(T(b,3.5),.8,KS);
    }
    if(S===1&&b>=8) for(let k=0;k<4;k++) kick(T(b,k),.3+.4*(b-8)/8,KS);
    if(S===1&&b>=10) for(let i=0;i<8;i++) hat(T(b,i/2),.06,false,i%2?.3:-.3);
    if(b===14||b===15||b===38||b===39){
      const dens=b%2===0?2:4, a0=b%2===0?.25:.32;
      for(let i=0;i<4*dens;i++) snare(T(b,i/dens),a0+.45*i/(4*dens),{tone:240,nd:15,td:26});
    }
    if(b===16||b===40||b===56){ crash(t0,.3,2.2); impact(t0,.55); }
    if(b%3===2){ if(onProg) onProg(b/BARS*.85); await sleep(0); }
  }
  for(const b of [12,36]){ riser(T(b,0),4*bar,.3); sweep(T(b,0),4*bar,120,1800,.05); }
  kick(T(BARS,0),1,KS); crash(T(BARS,0),.32); impact(T(BARS,0),.6);

  // sidechain "a la medida" de cada tipo de patrón (DnB: bombos en 1 y 2.5 · medio tiempo: solo el 1 · build: cada pulso)
  const KT={1:[0,1,2,3],2:[0,2.5],3:[0]};
  return K.mix(t=>{
    if(t>=BARS*bar) return 1;
    const b=Math.floor(t/bar), md=mode[b]; if(!md) return 1;
    const ph=(t-b*bar)/beat; let d=9; for(const k of KT[md]){ const x=ph-k; if(x>=0&&x<d) d=x; }
    return 1-(md===2?.78:md===3?.6:.35)*Math.exp(-d*beat/.09);
  });
}
