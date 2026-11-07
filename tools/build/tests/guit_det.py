import subprocess,time
from playwright.sync_api import sync_playwright
src=open('/home/claude/work/plugins/guitarra_acompanante.js').read()
srv=subprocess.Popen(['python3','-m','http.server','8824','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""async(src)=>{ const def=installPlugin(src); loadProject(newProject('t',90,6)); P.tracks=[]; const t=newTrack(def.id); Object.assign(t.params,{humaniza:1,patron:'idavuelta'}); t.notes=[{b:0,l:16,m:60,v:1}]; P.tracks.push(t);
 const hash=a=>{ let h=0; for(let i=0;i<a.length;i+=13) h=(Math.imul(h,31)+Math.round(a[i]*1e5))|0; return h; };
 const a=await renderProject(P); stemCache.clear(); const b=await renderProject(P); stemCache.clear();
 const J=JSON.stringify(projectToJSON(P)); const P2=projectFromJSON(JSON.parse(J)); const c=await renderProject(P2);
 return {mismoProyecto:hash(a.L)===hash(b.L),guardadoYReabierto:hash(a.L)===hash(c.L)}; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8824/index.html'); pg.wait_for_timeout(1200); print(pg.evaluate(JS,src))
srv.terminate()
