// ── COTTON SUGAR · future bass dulce · 150 BPM · Do mayor (Cmaj7–Am7–Fmaj7–G6) ──
// intro(0-7) cajita de música · build(8-15) · drop(16-31) · breakdown(32-39) · drop final(40-55)
async function renderCotton(sr,onProg){
  const BPM=150, beat=60/BPM, bar=beat*4, BARS=56, K=demoKit(sr,BARS*bar+2.5,20261016);
  const {mu,hz,syn,kick,snare,clap,snap,hat,crash,bell,chop,riser,sweep}=K;
  const T=(b,p)=>b*bar+p*beat;
  const CH=[{r:36,t:[60,64,67,71]},{r:33,t:[57,60,64,67]},{r:29,t:[53,57,60,64]},{r:31,t:[55,59,62,64]}];
  const KS={lo:52,hi:125,k:35,dec:8,len:.4};                    // bombo suave y redondo
  const duck=new Float32Array(BARS);
  for(let b=0;b<BARS;b++){
    const S=b<8?0:b<16?1:b<32?2:b<40?3:4, ch=CH[b%4], t0=T(b,0), drop=(S===2||S===4);
    duck[b]= drop?.7 : S===1?.2+(b-8)*.05 : 0;

    // pad aireado que se abre con la sección
    const padA=[.3,.24,.2,.3,.2][S], padLp=S===0?900+b*120 : S===3?1100+(b-32)*150 : S===1?1900 : 2600;
    for(const m of ch.t) syn(mu,t0,bar,hz(m),padA*.3,((m%5)-2)*.18,{det:[-9,9],w:0,atk:.5,rel:.5,lp:padLp});

    // cajita de música (intro, inicio del build y breakdown)
    if(S===0||S===3||(S===1&&b<12)){
      const pool=ch.t.map(m=>m+24), pat=S===1?[0,-1,2,-1,1,-1,3,-1]:[0,2,1,3,2,1,3,2];
      for(let i=0;i<8;i++) if(pat[i]>=0) bell(T(b,i/2),pool[pat[i]],S===3?.11:.09,i%2?.35:-.35);
    }
    if(drop){
      // acordes supersaw sincopados (el "rebote" del future bass)
      for(const p of [0,1.5,2.5,3.25]) for(const m of ch.t)
        syn(mu,T(b,p),beat*.4,hz(m+12),.1,((m%3)-1)*.3,{det:[-20,-10,0,10,20],w:0,atk:.004,rel:.12,dec:2.5,lp:t=>1500+5500*Math.exp(-t*9)});
      // pluck brillante en corcheas
      const pool=ch.t.map(m=>m+24), pat=(b%2)?[3,-1,2,-1,3,2,-1,2]:[3,-1,1,2,-1,1,2,-1];
      for(let i=0;i<8;i++) if(pat[i]>=0) syn(mu,T(b,i/2),beat*.42,hz(pool[pat[i]]),.1,i%2?.4:-.4,{det:[-6,6],w:0,atk:.003,rel:.05,dec:6,lp:t=>900+4500*Math.exp(-t*14)});
      // bajo redondo: sub + capa de sierra
      for(const [p,l] of [[0,.9],[1.5,.5],[2,.9],[3.5,.45]]){
        syn(mu,T(b,p),beat*l,hz(ch.r),.42,0,{w:2,atk:.01,rel:.08,dec:1.2,lp:900});
        syn(mu,T(b,p),beat*l,hz(ch.r+12),.1,0,{w:0,atk:.008,rel:.08,dec:3,lp:t=>300+900*Math.exp(-t*10)});
      }
      // sílabas "oh" (segunda mitad del primer drop y todo el final)
      if(S===4||b>=24) for(const [p,i] of [[1,3],[3.5,2]]) chop(T(b,p),beat*.5,ch.t[i]+12,.14,p>2?.4:-.4,'oh');
    }
    // batería
    if(drop){ kick(T(b,0),1,KS); kick(T(b,2.5),.9,KS); clap(T(b,2),.5); snap(T(b,3),.2,.3);
      for(let i=0;i<8;i++) hat(T(b,i/2),i%2?.1:.05,false,i%2?.3:-.3);
      hat(T(b,1.5),.12,true,.3); hat(T(b,3.5),.12,true,-.3); }
    if(S===1&&b>=8){ kick(T(b,0),.55,KS); kick(T(b,2),.5,KS); }
    if(S===1&&b>=10) for(let i=0;i<8;i++) hat(T(b,i/2),.06,false,i%2?.3:-.3);
    if(b===14||b===15||b===38||b===39){                          // redoble de tensión
      const dens=b%2===0?2:4, a0=b%2===0?.22:.3;
      for(let i=0;i<4*dens;i++) snare(T(b,i/dens),a0+.4*i/(4*dens),{tone:220,td:34});
    }
    if(b===16||b===40){                                          // destello de campanas al caer el drop
      crash(t0,.28);
      for(let k=0;k<8;k++) bell(t0+k*.06,ch.t[k%4]+36-Math.floor(k/4)*12,.1,k%2?.4:-.4);
    }
    if(b%3===2){ if(onProg) onProg(b/BARS*.85); await sleep(0); }
  }
  riser(T(12,0),4*bar,.45);  sweep(T(12,0),4*bar,300,2400,.07);
  riser(T(36,0),4*bar,.45);  sweep(T(36,0),4*bar,300,2400,.07);
  kick(T(BARS,0),1,KS); crash(T(BARS,0),.3);
  return K.mix(t=>{ const b=Math.min(BARS-1,Math.floor(t/bar)); return 1-(t<BARS*bar?duck[b]:0)*Math.exp(-(t%beat)/.14); });
}
