import subprocess,time
from playwright.sync_api import sync_playwright
K='/home/claude/work/kits/'
kits={'incluido':None,'ultra-SAFE (fix)':open(K+'demo-kit-ultra-SAFE_fix.js').read(),'Pro-SAFE (fix)':open(K+'demo-kit-Pro_SAFE_fix.js').read(),'Ultra (fix)':open(K+'demo-kit-Ultra_fix.js').read(),'Pro (fix)':open(K+'demo-kit-Pro_fix.js').read()}
srv=subprocess.Popen(['python3','-m','http.server','8809','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""async(src)=>{
  const orig=window.__o||(window.__o=Kit.make); Kit.make=src?new Function(src+'\\nreturn demoKit;')():orig; bumpKit();
  const res={}; 
  for(const [id,notes] of [['supersaw',()=>[0,4,8,12].map(b=>({b,l:3.5,m:57,v:1}))],['pad',()=>[0,8].map(b=>({b,l:7,m:57,v:1}))],['kick',()=>Array.from({length:32},(_,i)=>({b:i,l:.25,m:0,v:1}))]]){
    loadProject(newProject('t',120,8)); P.tracks=[]; const t=newTrack(id); t.notes=notes(); P.tracks.push(t); stemCache.clear();
    const a=performance.now(); await renderProject(P); res[id]=Math.round(performance.now()-a); }
  return res; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8809/index.html'); pg.wait_for_timeout(1000)
    for k,src in kits.items():
        pg.evaluate(JS,src); r=pg.evaluate(JS,src); print('%-18s supersaw(4 acordes de 5 voces)=%4d ms | pad=%4d ms | kick x32=%4d ms'%(k,r['supersaw'],r['pad'],r['kick']))
    b.close()
srv.kill()
