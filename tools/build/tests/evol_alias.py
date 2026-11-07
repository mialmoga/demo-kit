import subprocess,time,numpy as np
from playwright.sync_api import sync_playwright
src=open('/home/claude/work/kits/demo-kit-Evol.js').read()
srv=subprocess.Popen(['python3','-m','http.server','8815','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""([src,m,w])=>{ const orig=window.__o||(window.__o=Kit.make), evol=new Function(src+'\\nreturn demoKit;')(); const f=440*Math.pow(2,(m-69)/12); const o={}; for(const [k,mk] of [['inc',orig],['evol',evol]]){ const K=mk(44100,1,3); K.syn(K.mu,0,.9,f,.3,0,{det:[0],w,lp:20000,filt:'off',atk:.002,drift:0}); o[k]=Array.from(K.mu[0].slice(8192,8192+32768)); } o.f=f; return o; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.goto('http://localhost:8815/index.html'); pg.wait_for_timeout(1200)
    for m in (84,96):
      for w,nm in ((0,'sierra'),(1,'cuadrada')):
        r=pg.evaluate(JS,[src,m,w]); f=r['f']; res=[]
        for k in ('inc','evol'):
            x=np.array(r[k]); N=len(x); X=np.abs(np.fft.rfft(x*np.hanning(N)))**2; fr=np.fft.rfftfreq(N,1/44100); h=fr/f; d=np.abs(h-np.round(h))*f; bin=44100/N
            ali=X[(d>4*bin)&(fr<20000)].sum(); res.append(10*np.log10(ali/X.sum()))
        print('nota %d %-8s f0=%.0f Hz  energía no armónica (aliasing): incluido %.1f dB · evol %.1f dB'%(m,nm,f,res[0],res[1]))
srv.terminate()
