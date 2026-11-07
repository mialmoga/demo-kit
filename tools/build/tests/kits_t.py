import subprocess,time,json
from playwright.sync_api import sync_playwright
A='/mnt/user-data/attachments/1810152a-e797-521f-ab5c-75496ee7a0a9/'
kits={'incluido':None,'ultra':open(A+'d74058eb-demo-kit-ultra-SAFE.js').read(),'pro':open(A+'bc073f2f-demo-kit-Pro_SAFE.js').read()}
srv=subprocess.Popen(['python3','-m','http.server','8804','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""async(src)=>{
  const orig=window.__origMake||(window.__origMake=Kit.make);
  Kit.make=src?new Function(src+'\\nreturn demoKit;')():orig; bumpKit(); cache=null; dirty=true; if(typeof stemCache!=='undefined') stemCache.clear();
  loadProject(newProject('t',120,4)); P.tracks=[];
  const mk=(id,notes,extra)=>{ const t=newTrack(id); Object.assign(t,extra||{}); t.notes=notes; P.tracks.push(t); return t; };
  mk('kick',[0,1,2,3,4,5,6,7].map(b=>({b:b*2,l:.25,m:0,v:1})));
  mk('pad',[{b:0,l:6,m:57,v:1},{b:8,l:6,m:60,v:1}]);
  mk('supersaw',[{b:0,l:2,m:57,v:1},{b:4,l:2,m:64,v:1}]);
  mk('reese',[{b:0,l:3,m:33,v:1},{b:8,l:3,m:36,v:1}]);
  mk('pluck',[0,1,2,3].map(b=>({b:b,l:.5,m:69,v:1})));
  mk('bell',[{b:0,l:1,m:72,v:1}]); mk('hat',[0,1,2,3].map(b=>({b:b,l:.25,m:0,v:1})));
  mk('sinte',[{b:0,l:3,m:84,v:1}],{params:Object.assign(defaultParams(INSTRUMENTS.sinte),{lp:12000,lpSweep:0})});   // filtro muy abierto: ¿estable?
  mk('sinte',[{b:0,l:3,m:45,v:1}],{params:Object.assign(defaultParams(INSTRUMENTS.sinte),{lp:60,lpSweep:9000,lpRate:2})});
  const out=await renderProject(P); const rows=[];
  for(const tr of P.tracks){ const c=stemCache.get(tr.id); let nan=0,pk=0,e=0,cnt=0; const buses=[]; for(const st of c.stems){ buses.push(st.bus); for(const q of st.q) for(let i=0;i<q.length;i+=3){ const v=q[i]*st.pk/32767; if(!isFinite(v)) nan++; pk=Math.max(pk,Math.abs(v)); e+=v*v; cnt++; } }
    rows.push([tr.inst+(tr.params&&tr.params.lp?'('+tr.params.lp+')':''),buses.join('/'),+pk.toFixed(3),+(Math.sqrt(e/Math.max(1,cnt))).toFixed(4),nan]); }
  let m=0,nn=0; for(let i=0;i<out.L.length;i++){ const v=out.L[i]; if(!isFinite(v)) nn++; else m=Math.max(m,Math.abs(v)); }
  // ¿el sidechain agacha al pad? compara el pad con y sin ducking
  const padT=P.tracks[1]; const duck=makeDuck(P,60/P.bpm); let g=0,gm=1; for(let i=0;i<out.L.length;i+=441){ const v=duck(i/SR); gm=Math.min(gm,v); }
  return {rows,master:{pico:+m.toFixed(3),nan:nn},duckMin:+gm.toFixed(3)};
}"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':800}); pg.on('dialog',lambda d:d.accept()); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8804/index.html'); pg.wait_for_timeout(1200)
    for k,src in kits.items():
        r=pg.evaluate(JS,src); print('\n==',k,'| master',r['master'],'| sidechain mínimo',r['duckMin'])
        for row in r['rows']: print('  %-16s bus=%-6s pico=%-6s rms=%-7s nan=%s'%tuple(row))
    b.close()
srv.kill(); print('ERRORES',errs)
