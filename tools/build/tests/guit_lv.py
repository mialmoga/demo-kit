import subprocess,time,numpy as np,sys
sys.path.insert(0,'/home/claude/work/tests')
from playwright.sync_api import sync_playwright
src=open('/home/claude/work/plugins/guitarra_acompanante.js').read()
srv=subprocess.Popen(['python3','-m','http.server','8822','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""async()=>{ const out={}; for(const id of ['pluck','pad','sinte','supersaw']){ loadProject(newProject('t',60,4)); P.tracks=[]; const t=newTrack(id); t.notes=[48,52,55,60].map(m=>({b:0,l:3,m,v:1})); P.tracks.push(t); const o=await renderProject(P); let e=0,pk=0; const n=Math.min(o.L.length,44100*4); for(let i=0;i<n;i++){ e+=o.L[i]*o.L[i]; pk=Math.max(pk,Math.abs(o.L[i])); } out[id]=[Math.sqrt(e/n),pk]; } return out; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.goto('http://localhost:8822/index.html'); pg.wait_for_timeout(1200)
    for k,v in pg.evaluate(JS).items(): print('%-9s rms %.4f pico %.3f'%(k,*v))
srv.terminate()
