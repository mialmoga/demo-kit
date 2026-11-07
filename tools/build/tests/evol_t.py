import subprocess,time,json
from playwright.sync_api import sync_playwright
src=open('/home/claude/work/kits/demo-kit-Evol.js').read()
srv=subprocess.Popen(['python3','-m','http.server','8814','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""(src)=>{
  const orig=window.__o||(window.__o=Kit.make), evol=new Function(src+'\\nreturn demoKit;')(), out={};
  out.check=kitCheck(evol);
  const hash=(a)=>{ let h=0; for(let i=0;i<a.length;i+=7) h=(Math.imul(h,31)+Math.round(a[i]*1e5))|0; return h; };
  const run=(mk,o,f)=>{ const K=mk(44100,2,5); K.syn(K.mu,0,1,f||220,.2,0,o); return K.mu; };
  const a=run(evol,{det:[-9,0,9],lp:2500}), b=run(evol,{det:[-9,0,9],lp:2500}); out.determinista=hash(a[0])===hash(b[0])&&hash(a[1])===hash(b[1]);
  // barrido de corte y resonancia alta
  let bad=0, worst=0; for(const fc of [20,50,200,1000,5000,12000,20000,22050,40000]) for(const q of [.5,.7,3,10,24]) for(const filt of ['lp','bp','hp']) for(const w of [0,1,2]){ const m=run(evol,{det:[0,15],lp:fc,res:q,filt,w,drive:.5},110); for(const c of m) for(let i=0;i<c.length;i+=5){ if(!isFinite(c[i])) bad++; worst=Math.max(worst,Math.abs(c[i])); } }
  out.barrido={nan:bad,picoMax:+worst.toFixed(2)};
  const fn=run(evol,{det:[0],lp:t=>200+15000*Math.abs(Math.sin(t*20)),res:8},880); let nn=0; for(const c of fn) for(let i=0;i<c.length;i++) if(!isFinite(c[i])) nn++; out.lpFuncion={nan:nn};
  // aliasing: sierra de ~4.2 kHz (m=96), sin filtro; energía fuera de las armónicas (≈ aliasing)
  const alias=(mk)=>{ const K=mk(44100,.6,3); K.syn(K.mu,0,.5,hzM(96),.3,0,{det:[0],lp:20000,filt:'off',atk:.002}); const x=K.mu[0].slice(4096,4096+16384); const N=x.length, f0=hzM(96), bin=44100/N; let tot=0,ali=0; const re=new Float64Array(N/2); 
    for(let k=1;k<N/2;k+=1){ let r=0,i2=0; const w=2*Math.PI*k/N; for(let n=0;n<N;n+=8){ const v=x[n]*(0.5-0.5*Math.cos(2*Math.PI*n/N)); r+=v*Math.cos(w*n); i2-=v*Math.sin(w*n); } const pw=r*r+i2*i2; const fr=k*bin; const h=fr/f0, dist=Math.abs(h-Math.round(h))*f0; tot+=pw; if(dist>3*bin&&fr<20000) ali+=pw; } return 10*Math.log10(ali/tot); };
  function hzM(m){ return 440*Math.pow(2,(m-69)/12); }
  out.aliasing_dB={incluido:+alias(orig).toFixed(1),evol:+alias(evol).toFixed(1)};
  // tiempo de render
  const t=(mk)=>{ const K=mk(44100,12,5), t0=performance.now(); for(let i=0;i<40;i++) K.syn(K.mu,i*.25,.8,hzM(48+i%12),.1,0,{det:[-12,-6,0,6,12],lp:t=>1500+5500*Math.exp(-t*9)}); return performance.now()-t0; };
  t(orig); t(evol); out.ms={incluido:+t(orig).toFixed(0),evol:+t(evol).toFixed(0)};
  // declaración en el proyecto
  Kit.make=orig; const P0=newProject('x',120,4); out.sinKit=projectToJSON(P0).engine===undefined;
  Kit.make=evol; const J=JSON.parse(JSON.stringify(projectToJSON(P0))); out.conKit=J.engine;
  Kit.make=orig; const msgs=[]; const T=window.toast; window.toast=(m)=>msgs.push(m); const P1=projectFromJSON(J); loadProject(P1); window.toast=T; out.aviso=msgs.filter(m=>/kit/.test(m)).map(m=>m.slice(0,110));
  Kit.make=orig; return out; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8814/index.html'); pg.wait_for_timeout(1200)
    r=pg.evaluate(JS,src); print(json.dumps(r,indent=1,ensure_ascii=False)); print('errs',errs)
srv.terminate()
