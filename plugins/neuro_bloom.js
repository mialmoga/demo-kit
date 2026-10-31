// Plugin Demo Kit · NEURO BLOOM
// Bajo neuro/reese de nota individual: unísono desafinado, FM, dos polos y wobble sincronizable.
// Arrastra este archivo al Studio o usa «Demos y plugins» → plugin.
registerInstrument({
  id: 'neuro_bloom',
  name: 'Neuro Bloom',
  kind: 'melodic',
  desc: 'Bajo neuro procedural con unísono, modulación FM, filtro wobble y saturación.',
  params: [
    { k:'gain', label:'Ganancia', min:0, max:1, step:.005, def:.34 },
    { k:'voices', label:'Voces', min:1, max:7, step:1, def:4 },
    { k:'spread', label:'Desafine (cents)', min:0, max:45, step:.5, def:16 },
    { k:'wobble', label:'Wobble (Hz)', min:.1, max:12, step:.1, def:2.4 },
    { k:'depth', label:'Profundidad del filtro', min:0, max:1, step:.01, def:.72 },
    { k:'fm', label:'Índice FM', min:0, max:12, step:.1, def:3.5 },
    { k:'ratio', label:'Ratio FM', min:1, max:4, step:.01, def:2.01 },
    { k:'low', label:'Filtro mínimo (Hz)', min:60, max:1500, step:5, def:130 },
    { k:'high', label:'Filtro máximo (Hz)', min:200, max:9000, step:10, def:3200 },
    { k:'drive', label:'Saturación', min:.5, max:8, step:.1, def:2.8 },
    { k:'atk', label:'Ataque (s)', min:.001, max:.2, step:.001, def:.006 },
    { k:'rel', label:'Release (s)', min:.01, max:.5, step:.005, def:.08 }
  ],
  play(K,n) {
    const p=n.p,sr=n.sr||44100,f=n.hz,TAU=6.283185307179586;
    const count=Math.max(1,Math.round(p.voices));
    const det=Array.from({length:count},(_,i)=>count===1?0:(i/(count-1)-.5)*2*p.spread);
    const inc=det.map(c=>f*Math.pow(2,c/1200)/sr);
    const ph=det.map(()=>K.rnd()*.5+.5);
    let mod=0,y1=0,y2=0;
    const L=n.len+p.rel;
    K.add(n.buf,n.t,L,t=>{
      let s=0;
      for(let i=0;i<count;i++){
        ph[i]+=inc[i]; ph[i]-=Math.floor(ph[i]);
        s+=2*ph[i]-1;
      }
      s/=count;
      const wob=.5-.5*Math.cos(TAU*p.wobble*t);
      const fm=Math.sin(TAU*f*p.ratio*t)*p.fm*(.35+.65*wob);
      const x=Math.tanh((s+Math.sin(TAU*f*t+fm)*.45)*p.drive);
      const fc=p.low+(p.high-p.low)*p.depth*wob;
      const c=K.lpc(fc);
      y1+=c*(x-y1); y2+=c*(y1-y2);
      const a=Math.min(1,t/Math.max(.001,p.atk));
      const r=t>n.len?Math.max(0,1-(t-n.len)/p.rel):1;
      return y2*a*r;
    },n.a*p.gain,n.pan);
  }
});
