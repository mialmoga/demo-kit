import subprocess,time
from playwright.sync_api import sync_playwright
src=open('/home/claude/work/plugins/guitarra_acompanante.js').read()
srv=subprocess.Popen(['python3','-m','http.server','8823','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""async(src)=>{ const def=installPlugin(src), I=INSTRUMENTS[def.id], opt=k=>I.params.find(q=>q.k===k).vals; const res={nan:0,pk:0,n:0,maxms:0};
 const hash=a=>{ let h=0; for(let i=0;i<a.length;i+=13) h=(Math.imul(h,31)+Math.round(a[i]*1e5))|0; return h; };
 const run=async(pr,m,len,bpm)=>{ loadProject(newProject('t',bpm||90,6)); P.tracks=[]; const t=newTrack(def.id); Object.assign(t.params,pr); t.notes=[{b:0,l:len||16,m:m||50,v:1}]; P.tracks.push(t); const t0=performance.now(); const o=await renderProject(P); res.maxms=Math.max(res.maxms,performance.now()-t0); return o.L; };
 for(const it of opt('interprete')) for(const pa of opt('patron')) for(const ci of opt('circulo')){ const L=await run({interprete:it,patron:pa,circulo:ci,ext:2,cuerdas:6,pulsos:ci==='quintas'?2:4},36+res.n%12); res.n++; for(const v of L){ if(!isFinite(v)) res.nan++; res.pk=Math.max(res.pk,Math.abs(v)); } }
 const a=await run({humaniza:1,patron:'idavuelta'},60), b=await run({humaniza:1,patron:'idavuelta'},60); res.determinista=hash(a)===hash(b);
 const c=await run({humaniza:0,patron:'abajo'},47,.5,200), d=await run({cuerdas:4,ext:0,pulsos:16,sustain:2.5,brillo:2,cuerpo:1,velo:2.5},90,3); res.cortas_ok=[c,d].every(L=>L.every(isFinite));
 res.defaultParams=I.params.length; return res; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8823/index.html'); pg.wait_for_timeout(1200)
    print(pg.evaluate(JS,src),errs)
srv.terminate()
