// Plugin Demo Kit · AETHER CHOIR
// Coro sintético sin muestras: tres voces formánticas con deriva lenta, aire y armónicos.
// Arrastra este archivo al Studio o usa «Demos y plugins» → plugin.
registerInstrument({
  id: 'aether_choir',
  name: '♾️ Aether Choir',
  kind: 'melodic',
  desc: 'Coro sintético de tres voces: formantes móviles, aire, detune y halo armónico.',
  params: [
    { k:'gain', label:'Ganancia', min:0, max:1, step:.005, def:.22 },
    { k:'vowel', label:'Vocal', type:'choice', opts:['O','A','E','U'], vals:['o','a','e','u'], def:'o' },
    { k:'voices', label:'Voces', min:1, max:5, step:1, def:3 },
    { k:'spread', label:'Desafine (cents)', min:0, max:35, step:.5, def:9 },
    { k:'formant', label:'Movimiento formántico', min:0, max:1, step:.01, def:.35 },
    { k:'air', label:'Aire', min:0, max:1, step:.01, def:.12 },
    { k:'halo', label:'Armónico superior', min:0, max:1, step:.01, def:.22 },
    { k:'rate', label:'Deriva (Hz)', min:.03, max:1.5, step:.01, def:.18 },
    { k:'atk', label:'Ataque (s)', min:.01, max:2, step:.01, def:.28 },
    { k:'rel', label:'Release (s)', min:.03, max:3, step:.01, def:.65 },
    { k:'tone', label:'Brillo (Hz)', min:500, max:9000, step:25, def:4200 }
  ],
  play(K, n) {
    const p=n.p, sr=n.sr||44100, f=n.hz, TAU=6.283185307179586;
    const count=Math.max(1,Math.round(p.voices)), spread=p.spread;
    const det=Array.from({length:count},(_,i)=>count===1?0:(i/(count-1)-.5)*2*spread);
    const inc=det.map(c=>f*Math.pow(2,c/1200)/sr);
    const ph=det.map(()=>K.rnd()*.5+.5);
    const lp=K.lpc(p.tone), lpAir=K.lpc(1800);
    const formants={
      o:[430,850], a:[820,1350], e:[520,2200], u:[350,900]
    }[p.vowel]||[430,850];
    const f1=K.lpc(formants[0]), f2=K.lpc(formants[1]);
    let y1=0,y2=0,air=0;
    const L=n.len+p.rel;
    K.add(n.buf,n.t,L,t=>{
      let s=0;
      for(let i=0;i<count;i++){
        ph[i]+=inc[i]*(1+.0015*Math.sin(TAU*p.rate*t+i));
        ph[i]-=Math.floor(ph[i]);
        s+=Math.sin(TAU*ph[i]);
      }
      s/=count;
      const move=1+p.formant*.16*Math.sin(TAU*p.rate*t*.47);
      const a1=f1*move,a2=f2/move;
      y1+=a1*(s-y1); y2+=a2*(s-y2);
      air+=lpAir*(K.rnd()-air);
      const halo=Math.sin(TAU*ph[0]*2.003)*p.halo*.25;
      const env=Math.min(1,t/Math.max(.001,p.atk));
      const rel=t>n.len?Math.max(0,1-(t-n.len)/p.rel):1;
      return (y1*.7+y2*.42+halo+air*p.air*.7)*env*env*(3-2*env)*rel;
    },n.a*p.gain,n.pan);
  }
});
