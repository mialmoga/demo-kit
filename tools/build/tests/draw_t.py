import subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8796','-d','/home/claude/repo'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1300,'height':800}); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8796/index.html'); pg.wait_for_timeout(1000)
    print(pg.evaluate("""()=>{ const t=(n)=>{ const a=performance.now(); for(let i=0;i<n;i++) draw(i*.01); return +((performance.now()-a)/n).toFixed(2); };
      selectTrack(4); const base=t(200); const tr=P.tracks[4]; for(let i=0;i<3000;i++) tr.notes.push({b:Math.random()*30,l:.25,m:48+Math.floor(Math.random()*24),v:1}); invalidate(); const dense=t(200);
      return {ms_por_fotograma_normal:base,ms_con_3000_notas:dense,notas_pista:tr.notes.length}; }"""))
    b.close()
srv.kill()
