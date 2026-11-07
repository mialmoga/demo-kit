import subprocess,time
from playwright.sync_api import sync_playwright
src=open('/home/claude/work/plugins/automata_vocal.js').read()
srv=subprocess.Popen(['python3','-m','http.server','8819','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""async(src)=>{ const def=installPlugin(src); loadProject(newProject('t',90,2)); P.tracks=[]; const t=newTrack(def.id); const pr=INSTRUMENTS[def.id].presets['El Brayan']; for(const k in pr) t.params[k]=pr[k];
 t.notes=[{b:0,l:1,m:62,v:1,w:'quiu'},{b:1,l:1,m:65,v:1,w:'bo'},{b:2,l:2,m:60,v:1,w:'hola'}]; P.tracks.push(t); const o=await renderProject(P); let e=0,pk=0,nan=0; for(const v of o.L){ if(!isFinite(v)) nan++; e+=v*v; pk=Math.max(pk,Math.abs(v)); } return {nan,rms:+Math.sqrt(e/o.L.length).toFixed(4),pico:+pk.toFixed(3),presets:Object.keys(INSTRUMENTS[def.id].presets),adn:t.params.adn}; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept())
    pg.goto('http://localhost:8819/index.html'); pg.wait_for_timeout(1200); print(pg.evaluate(JS,src),errs)
srv.terminate()
