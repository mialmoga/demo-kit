import subprocess,time,sys,json
from playwright.sync_api import sync_playwright
src=open('/home/claude/work/kits/demo-kit-Evol.js').read()
srv=subprocess.Popen(['python3','-m','http.server','8816','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""(src)=>{ const orig=window.__o||(window.__o=Kit.make), evol=new Function(src+'\\nreturn demoKit;')(); const out={};
 const hits={kick:K=>K.kick(0,1),snare:K=>K.snare(0,1),clap:K=>K.clap(0,1),hat:K=>K.hat(0,1),hatO:K=>K.hat(0,1,true),crash:K=>K.crash(0,1)};
 for(const [nm,f] of Object.entries(hits)){ const r=[]; for(const mk of [orig,evol]){ const K=mk(44100,2.6,3); f(K); let e=0,pk=0,nan=0; for(const c of K.dr) for(const v of c){ if(!isFinite(v)) nan++; e+=v*v; pk=Math.max(pk,Math.abs(v)); } r.push([Math.sqrt(e/(2*K.dr[0].length)),pk,nan]); }
   out[nm]={rms:+(20*Math.log10(r[1][0]/r[0][0])).toFixed(2),pico:+(20*Math.log10(r[1][1]/r[0][1])).toFixed(2),nan:r[1][2],pk:+r[1][1].toFixed(2)}; }
 // determinismo y kitCheck
 const h=(mk)=>{ const K=mk(44100,1,9); K.kick(0,1);K.snare(.2,1);K.clap(.4,1);K.hat(.6,1); let x=0; for(let i=0;i<K.dr[0].length;i+=3) x=(Math.imul(x,31)+Math.round(K.dr[0][i]*1e5))|0; return x; };
 out.determinista=h(evol)===h(evol); out.check=kitCheck(evol); return out; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.goto('http://localhost:8816/index.html'); pg.wait_for_timeout(1200)
    r=pg.evaluate(JS,src)
    for k,v in r.items(): print(k,v)
srv.terminate()
