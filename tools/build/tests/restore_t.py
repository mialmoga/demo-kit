import subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8820','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); logs=[]; errs=[]; pg.on('console',lambda m:logs.append(m.text) if m.type in('warning','error') else None); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept())
    pg.goto('http://localhost:8820/index.html'); pg.wait_for_timeout(1000)
    print('sin engine:',pg.evaluate("()=>{ const P0=newProject('a',120,2); const t=newTrack('kick'); t.notes=[{b:0,l:1,m:0,v:1}]; P0.tracks=[t]; const j=JSON.parse(JSON.stringify(projectToJSON(P0))); const P=projectFromJSON(j); return {tracks:P.tracks.length,engine:P.engine===undefined}; }"))
    pg.evaluate("()=>{ const P0=newProject('a',120,2); const t=newTrack('kick'); t.notes=[{b:0,l:1,m:0,v:1}]; P0.tracks=[t]; loadProject(P0); touch(); }"); pg.wait_for_timeout(1500)
    pg.reload(); pg.wait_for_timeout(1500)
    print('restaurada tras recargar:',pg.evaluate("()=>({name:P.name,tracks:P.tracks.length})"),'| avisos:',[l for l in logs if 'autosave' in l],'| errores:',errs)
    print('con engine evol:',pg.evaluate("()=>{ const P=projectFromJSON({format:'demokit-studio',name:'x',bpm:120,bars:2,tracks:[],engine:{id:'evol',v:'1.2.0',c:'organico'}}); return P.engine; }"))
srv.terminate()
