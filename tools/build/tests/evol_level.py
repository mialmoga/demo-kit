import subprocess,time,json,sys
from playwright.sync_api import sync_playwright
src=open('/home/claude/work/kits/demo-kit-Evol.js').read()
srv=subprocess.Popen(['python3','-m','http.server','8813','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""(src)=>{
  const orig=window.__o||(window.__o=Kit.make), evol=new Function(src+'\\nreturn demoKit;')();
  const res=[]; const ids=INST_ORDER.filter(id=>INSTRUMENTS[id].kind==='melodic'&&/synthDef|K\\.syn/.test(INSTRUMENTS[id].play.toString()));
  const rms=(o)=>{ let e=0; for(let i=0;i<o.L.length;i++) e+=o.L[i]*o.L[i]+o.R[i]*o.R[i]; return Math.sqrt(e/(2*o.L.length)); };
  const pk=(o)=>{ let m=0; for(let i=0;i<o.L.length;i++) m=Math.max(m,Math.abs(o.L[i]),Math.abs(o.R[i])); return m; };
  for(const id of ids){ for(const m of [36,48,57,69,84]){
    const P=newProject('t',120,4), tr=newTrack(id); tr.notes=[{b:0,l:2,m,v:1}]; P.tracks=[tr]; const r=[];
    for(const mk of [orig,evol]){ Kit.make=mk; const K=mk(44100,3,7); K.sr=44100; const inst=INSTRUMENTS[id]; inst.play(K,noteArgs(K,P,tr,{b:0,l:2*1,m,v:1},.5,0)); const o=K.mix(()=>1); r.push([rms(o),pk(o)]); }
    res.push([id,m,20*Math.log10(r[1][0]/r[0][0]),20*Math.log10(r[1][1]/r[0][1])]); } }
  Kit.make=orig; return res; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8813/index.html'); pg.wait_for_timeout(1200)
    r=pg.evaluate(JS,src); print(errs)
    by={}
    for id,m,dr,dp in r: by.setdefault(id,[]).append((m,dr,dp))
    for id,v in by.items(): print('%-9s'%id,' '.join('m%d:%+.1f/%+.1f'%x for x in v))
srv.terminate()
