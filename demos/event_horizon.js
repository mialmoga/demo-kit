// ── 🌑 EVENT HORIZON ── 140 BPM · Dubstep · Fa menor · dificultad ●○○○○ ──
// Función: renderVoidV2(sr, onProg)  →  async, devuelve {L, R, dur} (Float32Array estéreo + segundos).
// Necesita: sleep(ms) y el kit demoKit (ver demo_kit.js).
// Uso:  const r = await renderVoidV2(44100, p => console.log(p));   // p va de 0 a ~0.85
// ── EVENT HORIZON · dubstep en medio tiempo · 140 BPM · Fa menor frigio (Fm7–Gb–Fm7–Ebm) ──
// Recorrido (la pista sigue el volumen: fuerte = caída, suave = subida):
//   0-8 subida (cadena de montaña rusa) · 9-15 acercamiento al horizonte · 16-21 caída corta y violenta
//   22-27 paz y segunda subida · 28-34 la caída al revés (drop A en reversa real) · 35-49 picada que escala sin parar · 50 singularidad
async function renderVoidV2(sr,onProg){
  const BPM=140, beat=60/BPM, bar=beat*4, BARS=51, K=demoKit(sr,BARS*bar+2.5,20261018);
  const {n,mu,dr,hz,lpc,rnd,add,syn,kick,snare,clap,hat,crash,chop,riser,sweep}=K;
  const T=(b,p)=>b*bar+p*beat;
  // acordes (F=pedal en el sub): Fm7 · Gb · Fm7 · Ebm  → el b2 (Gb) es lo que le da el color "frigio" amenazante
  const CH=[{t:[53,56,60,63]},{t:[54,58,61,65]},{t:[53,56,60,63]},{t:[51,54,58,61]}];
  const KS={lo:42,hi:130,k:40,dec:7,len:.42,click:.4};                  // bombo grave y largo (medio tiempo)
  const sat=x=>x/(1+Math.abs(x));

  // growl: FM con índice modulado (rate en ciclos/s; 0 = índice fijo) → saturación → filtro que respira
  function growl(t0,len,m,a,rate,i0,i1,ratio){
    const f=hz(m), L=len+.04, r=ratio||2.01; let pc=0,pm=0,y=0;
    add(mu,t0,L,t=>{ pc+=f/sr; pm+=f*r/sr; pc-=Math.floor(pc); pm-=Math.floor(pm);
      const lf=.5+.5*Math.sin(6.2831853*rate*t), ix=i0+(i1-i0)*lf;
      const x=sat(2.6*Math.sin(6.2831853*pc+ix*Math.sin(6.2831853*pm)));
      y+=lpc(450+3200*lf)*(x-y);
      return y*Math.min(1,t/.008)*Math.min(1,(L-t)/.04)*1.3; },a,0);
  }
  // sub senoidal: fall=true arranca una octava arriba y cae · rise=true sube desde media octava abajo
  function sub(t0,len,m,a,fall,rise){ const f=hz(m); let ph=0;
    add(mu,t0,len,t=>{ const fx=fall?f*(1+Math.exp(-t*6)) : rise?f*(.5+.5*(1-Math.exp(-t*2.2))) : f;
      ph+=fx/sr; ph-=Math.floor(ph);
      return Math.sin(6.2831853*ph)*Math.min(1,t*40)*Math.min(1,(len-t)*30); },a,0);
  }
  function tail(t0,a){ let y=0; add(dr,t0,1.1,t=>{ y+=lpc(5500)*(rnd()-y); return y*Math.exp(-t*4.5)*Math.min(1,t/.01); },a,0); }   // cola larga del snare
  function tom(t0,a,f0){ add(dr,t0,.35,t=>Math.sin(2*Math.PI*(f0*.55*t+(f0*.45/18)*(1-Math.exp(-18*t))))*Math.exp(-t*9)*Math.min(1,t*500),a,0); }
  function rev(t0,len,a){ let p=0; add(mu,t0,len,t=>{ const x=rnd(), v=x-p*.3; p=x; const q=t/len; return v*q*q*q; },a,0); }   // platillo invertido
  function wash(t0,len,a,fc){ let y=0; add(mu,t0,len,t=>{ y+=lpc(fc)*(rnd()-y); return y*Math.min(1,t/.8)*Math.min(1,(len-t)/.8); },a,0); }
  function impact(t0,a){ add(mu,t0,1.4,t=>Math.sin(2*Math.PI*(32*t+(80/3)*(1-Math.exp(-3*t))))*Math.exp(-t*2.2),a,0); }
  // clack de la cadena de la montaña rusa (clic seco con un "tonk" metálico)
  function clack(t0,a){ let p=0; add(dr,t0,.07,t=>{ const x=rnd(), v=x-p*.5; p=x;
    return v*Math.exp(-t*140)*.7+Math.sin(2*Math.PI*(1200+600*Math.exp(-t*90))*t)*Math.exp(-t*160)*.5; },a,((t0*7)%1)-.5); }
  // ping de sonar: seno puro con ecos que se van apagando y rebotando de lado a lado (sustituye a las campanitas)
  function ping(t0,m,a){ const f=hz(m);
    for(let k=0;k<5;k++) add(mu,t0+k*.62,1.8,t=>(Math.sin(6.2831853*f*t)+.18*Math.sin(6.2831853*f*2.01*t))*Math.exp(-t*(2.4+k*.8))*Math.min(1,t*800),a*Math.pow(.55,k),k%2?.5:-.5); }

  // ── efectos sobre lo ya renderizado (música y batería) ──
  const S_=t=>Math.floor(t*sr);
  function stutter(t0,len,slice){                      // glitch: repite un trocito
    const s0=S_(t0), sl=Math.max(1,S_(slice)), Ln=Math.min(S_(len),n-s0); if(Ln<=0) return;
    for(const buf of [mu,dr]) for(let c=0;c<2;c++){ const B=buf[c]; for(let i=sl;i<Ln;i++) B[s0+i]=B[s0+(i%sl)]; }
  }
  function tapeStop(t0,len){                           // la cinta se frena hasta detenerse
    const s0=S_(t0), Ln=Math.min(S_(len),n-s0); if(Ln<=0) return;
    for(const buf of [mu,dr]) for(let c=0;c<2;c++){ const B=buf[c], src=B.slice(s0,s0+Ln); let pos=0;
      for(let i=0;i<Ln;i++){ const q=i/Ln; pos+=(1-q)*(1-q); const p0=Math.floor(pos), fr=pos-p0;
        const x0=src[Math.min(Ln-1,p0)], x1=src[Math.min(Ln-1,p0+1)]; B[s0+i]=(x0+(x1-x0)*fr)*(1-q*q); } }
  }
  function silence(t0,t1){ const a=S_(t0), b=Math.min(S_(t1),n); for(const buf of [mu,dr]) for(let c=0;c<2;c++) buf[c].fill(0,a,b); }
  function reversePlace(a0,a1,d0,g){                   // pega el audio [a0,a1) al revés a partir de d0
    const s0=S_(a0), s1=Math.min(S_(a1),n), d=S_(d0);
    for(const buf of [mu,dr]) for(let c=0;c<2;c++){ const B=buf[c]; for(let i=0;i<s1-s0&&d+i<n;i++) B[d+i]+=B[s1-1-i]*g; }
  }

  const mode=new Uint8Array(BARS);                                      // sidechain: 1 cada pulso · 2 bombo en 1 · 3 en 1 y 2.5 · 4 en 1, 2.5 y 4.5 · 5 cada pulso (fuerte)
  const RID=[[1,0,1,1,0,1,1,0,1,0,0,0],[1,0,1,1,0,1,1,0,1,1,0,1],[1,0,1,1,0,0,1,0,1,1,0,0],[1,1,1,0,1,1,0,1,1,0,0,0]];
  const PING=[65,72,68,75];
  function riddim(b,t0,acc0,off0,oct){                                  // riddim en tresillos (12 casillas por compás)
    const P=RID[b%4], sl=beat/3;
    for(let i=0;i<12;i++) if(P[i]){ const acc=(i%3===0), m=(i===8||i===9)?42:41;
      growl(t0+i*sl,sl*.82,m,acc?acc0:off0,0,acc?3:6,acc?6:11,acc?2.01:3.01);
      if(oct) growl(t0+i*sl,sl*.82,m+12,acc?.13:.09,0,acc?2:4,acc?5:8,1.5); }
  }
  const stab=(t0,ch,pos)=>{ for(const m of ch.t.slice(0,3))
    syn(mu,t0+pos*beat,beat*.3,hz(m+12),.08,((m%3)-1)*.3,{det:[-12,12],w:0,atk:.003,rel:.08,dec:5,lp:t=>400+2600*Math.exp(-t*10)}); };

  for(let b=0;b<BARS;b++){
    const S=b<=8?0:b<=15?1:b<=21?2:b<=27?3:b<=34?4:b<=41?5:b<=47?6:b<=49?7:8, ch=CH[b%4], t0=T(b,0);
    mode[b]= (b>=14&&b<=15)?1 : S===2?((b%2)?3:2) : S===5?3 : S===6?4 : S===7?5 : 0;

    // pad oscuro (casi nada en la subida y la paz, se abre en el acercamiento)
    const padA=[.1,.16,.1,.2,.05,.1,.1,.1,.06][S], padLp=S===0?260+b*40 : S===1?700+(b-9)*130 : S===3?600+(b-22)*130 : 700;
    for(const m of ch.t) syn(mu,t0,bar,hz(m),padA*.3,((m%5)-2)*.2,{det:[-12,12],w:0,atk:.9,rel:.6,lp:padLp});

    // ── 0-8 · LA SUBIDA: drone que se abre y clacks de cadena que aceleran ──
    if(S===0){
      syn(mu,t0,bar,hz(29),.2,0,{det:[-14,0,14],w:0,atk:1.2,rel:1,lp:140+b*55});
      if(b>=3) sub(t0,bar,29,.06+.015*(b-3));
      const sp=b<4?1:b<7?.5:.25;
      for(let p=0;p<4;p+=sp) clack(T(b,p),.07+.008*b);
      wash(t0,bar,.035,800);
    }
    // ── 9-15 · EL ACERCAMIENTO: growls cada vez más rápidos y más graves, latido, redoble ──
    if(S===1){
      const k=b-9;
      syn(mu,t0,bar,hz(29),.2,0,{det:[-14,0,14],w:0,atk:.6,rel:.6,lp:500+k*140});
      sub(t0,bar,29,.16+.025*k);
      growl(t0,bar*.95,41-k,.07+.016*k,(1+k*.5)/beat,2,7+k*.4,2.01);
      wash(t0,bar,.05,1200+k*300);
      if(b<=11) for(let p=0;p<4;p+=.25) clack(T(b,p),.1);
      if(b>=12) kick(t0,.5,KS);
      if(b>=14) for(let q=1;q<4;q++) kick(T(b,q),.55+.1*(b-14),KS);
      if(b>=14) for(let i=0;i<16;i++) hat(T(b,i/4),.04+.06*i/16,false,i%2?.3:-.3);
      else if(b>=12) for(let i=0;i<8;i++) hat(T(b,i/2),.05,false,i%2?.3:-.3);
    }
    // ── 16-21 · TE ATRAPA: caída corta y violenta (drop A) ──
    if(S===2){
      const slow=b<19;
      sub(t0,bar*.98,29,.5,b===16||b===19);
      growl(T(b,0),beat*1.9,41,.3,slow?1/(beat*2):1/beat,2,7,2.01);
      growl(T(b,2),beat*1.9,(b%2?42:41),.3,slow?1/beat:2/beat,3,9,3.01);
      if(!slow) stab(t0,ch,1.5);
      kick(T(b,0),1,KS); if(b%2===1) kick(T(b,1.5),.85,KS);
      snare(T(b,2),.95,{tone:195,nd:11,td:18,len:.32}); clap(T(b,2),.5); tail(T(b,2),.22);
      for(let i=0;i<8;i++) hat(T(b,i/2),i%2?.07:.035,false,i%2?.3:-.3);
      if(b===21){ for(let i=0;i<8;i++) hat(T(b,3+i/8),.05+.1*i/8,false,i%2?.3:-.3); [3,3.33,3.66].forEach((p,i)=>tom(T(b,p),.5,150-i*20)); }
    }
    // ── 22-27 · LA PAZ: pad, sub, pings de sonar, coro grave y la cadena otra vez, más lenta ──
    if(S===3){
      const k=b-22;
      sub(t0,bar,29,.12);
      ping(T(b,b%2?2.5:0),PING[(b>>1)%4],.1);
      if(b%2===1) ping(T(b,3.25),71,.05);                                // Si natural: tritono contra el Fa
      chop(t0,bar*.95,ch.t[b%2?2:0],.09,b%2?.25:-.25,'oo');
      wash(t0,bar,.05,1500);
      const sp=b<=24?1:.5;
      for(let p=0;p<4;p+=sp) clack(T(b,p),.07+.01*k);
    }
    // ── 28-34 · AL REVÉS: el drop A en reversa real (se añade después del bucle) + sub que sube ──
    if(S===4){ sub(t0,bar*.98,29,.25,false,true); wash(t0,bar,.08,5200); growl(t0,bar*.97,41,b>=32?.26:.12,1/beat,2,8,2.01); }
    // ── 35-49 · LA PICADA: riddim que no se asienta; u (0→1) sube el volumen y el brillo compás a compás ──
    if(S>=5&&S<=7){
      const lvl=S===5?0:S===6?1:2, u=(b-35)/14;
      sub(t0,bar*.98,29,.5,b%4===3);
      wash(t0,bar,.16+.05*u,6500);                                      // ruido de banda ancha: es lo que más "suena fuerte" para el juego
      if(b%2===1) crash(t0,.1+.06*u,1.8);
      growl(t0,bar*.97,41,.27+.04*lvl,(1+lvl)/beat,2,8,2.01);                // cama continua de growl: da el cuerpo que le faltaba al riddim
      riddim(b,t0,.26+.03*lvl+.02*u,.2+.02*lvl+.01*u,lvl>=1);
      if(lvl>=1||b%2===1) stab(t0,ch,3);
      kick(T(b,0),1,KS); kick(T(b,1.5),.85,KS);
      if(lvl>=1) kick(T(b,3.5),.8,KS);
      if(lvl===2) for(const q of [1,2,3]) kick(T(b,q),.75,KS);
      snare(T(b,2),.95,{tone:195,nd:11,td:18,len:.32}); clap(T(b,2),.5); tail(T(b,2),.22);
      if(b%2===1) snare(T(b,3.5),.2,{tone:230,nd:20,td:32});
      if(lvl>=1&&b%2===1) [3,3.33,3.66].forEach((p,i)=>snare(T(b,p),.3+.1*i,{tone:215,nd:16,td:26}));
      if(lvl===2&&b===49) for(let i=0;i<16;i++) snare(T(b,i/4),.3+.55*i/16,{tone:210,nd:14,td:24});
      if(lvl<2) for(let i=0;i<12;i++) hat(t0+i*beat/3,i%3===0?.08:.045,i===5||i===11,i%2?.3:-.3);
      else for(let i=0;i<24;i++) hat(t0+i*beat/6,i%6===0?.09:.05,false,i%2?.3:-.3);
      if(b===41||b===47) [3,3.33,3.66].forEach((p,i)=>tom(T(b,p),.5,150-i*20));
    }
    // ── 50 · LA SINGULARIDAD: caída del sub (el golpe final se añade después del bucle) ──
    if(S===8) sub(t0,bar*1.5,29,.6,true);

    if(b===16){ crash(t0,.3,2.6); impact(t0,.6); }
    if(b===14||b===15){                                                  // redoble de tensión
      const dens=b%2===0?2:4, a0=b%2===0?.2:.28;
      for(let i=0;i<4*dens;i++) snare(T(b,i/dens),a0+.4*i/(4*dens),{tone:200,nd:13,td:22});
    }
    if(b===35){ crash(t0,.25,2.2); impact(t0,.5); }
    if(b%3===2){ if(onProg) onProg(b/BARS*.85); await sleep(0); }
  }
  // transiciones largas
  riser(T(12,0),3*bar,.25); sweep(T(12,0),3*bar,120,1800,.05); rev(T(13,0),2*bar,.16);
  rev(T(26,1.5),beat*5,.12);
  rev(T(34,0),bar,.2); rev(T(41,0),bar,.2);
  riser(T(47,0),3*bar,.3); sweep(T(47,0),3*bar,120,2400,.06); rev(T(47,0),bar,.22);

  // la caída al revés: el drop A (compases 16-21) pegado en reversa en los compases 28-34
  reversePlace(T(16,0),T(22,0),T(28,0),.9);
  // el horizonte: la cinta se frena y queda un instante de silencio antes de caer; otro silencio en la cresta de la segunda subida
  tapeStop(T(15,2),1.5*beat); silence(T(15,3.5),T(16,0));
  silence(T(27,3),T(28,0));
  stutter(T(21,3),beat,beat/4); stutter(T(41,3),beat,beat/6); stutter(T(49,2.5),1.5*beat,beat/8);
  kick(T(50,0),1,KS); crash(T(50,0),.4,3.5); impact(T(50,0),.9);

  const KT={1:[0,1,2,3],2:[0],3:[0,1.5],4:[0,1.5,3.5],5:[0,1,2,3]};
  return K.mix(t=>{
    if(t>=BARS*bar) return 1;
    const b=Math.floor(t/bar), md=mode[b]; if(!md) return 1;
    const ph=(t-b*bar)/beat; let d=9; for(const k of KT[md]){ const x=ph-k; if(x>=0&&x<d) d=x; }
    return 1-(md===1?.35:.7)*Math.exp(-d*beat/.1);
  });
}
