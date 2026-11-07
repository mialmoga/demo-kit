import subprocess,time,json,sys
from playwright.sync_api import sync_playwright
A='/mnt/user-data/attachments/1810152a-e797-521f-ab5c-75496ee7a0a9/'
K='/home/claude/work/kits/'
def rd(p): return open(p).read()
kits={'incluido':None,'SAFE_pro_fix':rd(K+'demo-kit-Pro_SAFE_fix.js'),'Ultra.js (1ª)':rd(A+'13b08b4b-demo-kit-Ultra.js'),'Pro.js (1ª)':rd(A+'3466d575-demo-kit-Pro.js')}
for extra in sys.argv[1:]:
    kits[extra.split('/')[-1]]=rd(extra)
srv=subprocess.Popen(['python3','-m','http.server','8806','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""async(src)=>{
  const orig=window.__origMake||(window.__origMake=Kit.make);
  Kit.make=src?new Function(src+'\\nreturn demoKit;')():orig; bumpKit(); cache=null; dirty=true; stemCache.clear();
  loadProject(newProject('t',120,4)); P.tracks=[];
  const mk=(id,notes,extra)=>{ const t=newTrack(id); Object.assign(t,extra||{}); t.notes=notes; P.tracks.push(t); return t; };
  mk('kick',[0,1,2,3,4,5,6,7].map(b=>({b:b*2,l:.25,m:0,v:1}))); mk('snare',[1,3,5,7].map(b=>({b:b*2,l:.25,m:0,v:1})));
  mk('pad',[{b:0,l:6,m:57,v:1},{b:8,l:6,m:60,v:1}]); mk('supersaw',[{b:0,l:2,m:57,v:1},{b:4,l:2,m:64,v:1}]);
  mk('reese',[{b:0,l:3,m:33,v:1},{b:8,l:3,m:36,v:1}]); mk('pluck',[0,1,2,3].map(b=>({b:b,l:.5,m:69,v:1}))); mk('hat',[0,1,2,3].map(b=>({b:b,l:.25,m:0,v:1})));
  let out,err=null; try{ out=await renderProject(P); }catch(e){ err=e.message; }
  const rows=[]; for(const tr of P.tracks){ const c=stemCache.get(tr.id); if(!c||!c.stems||!c.stems.length){ rows.push([tr.inst,'-','-','-','-']); continue; } let pk=0,e=0,d=0,nan=0,buses=new Set(); for(const st of c.stems){ buses.add(st.bus); const q=st.q[0]; let prev=0; for(let i=0;i<q.length;i++){ const v=q[i]*st.pk/32767; if(!isFinite(v)){ nan++; continue; } pk=Math.max(pk,Math.abs(v)); e+=v*v; d+=(v-prev)*(v-prev); prev=v; } }
    rows.push([tr.inst,[...buses].join('/'),+pk.toFixed(2),+(Math.sqrt(e/Math.max(1,c.stems[0].q[0].length))).toFixed(3),+(e?Math.sqrt(d/e):0).toFixed(2)+(nan?' NaN:'+nan:'')]); }
  let master=null; if(out){ let pk=0,e=0,cl=0,nn=0; for(let i=0;i<out.L.length;i++){ const v=out.L[i]; if(!isFinite(v)){ nn++; continue; } const a=Math.abs(v); pk=Math.max(pk,a); e+=v*v; if(a>.93) cl++; } master={pico:+pk.toFixed(3),rms:+Math.sqrt(e/out.L.length).toFixed(3),crest:+(pk/Math.sqrt(e/out.L.length)).toFixed(1),sobre93:+(100*cl/out.L.length).toFixed(2)+'%',nan:nn}; }
  return {err,rows,master};
}"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':800}); pg.on('dialog',lambda d:d.accept()); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8806/index.html'); pg.wait_for_timeout(1200)
    for k,src in kits.items():
        r=pg.evaluate(JS,src); print('\n==',k,'| ERROR:',r['err'],'| master',r['master'])
        for row in r['rows']: print('  %-9s bus=%-6s pico=%-5s rms=%-6s dureza=%s'%tuple(row))
    b.close()
srv.kill(); print('\n(dureza = energía de alta frecuencia relativa; más alta = más áspero/saturado)\nERRORES página',errs)
