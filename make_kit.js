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
