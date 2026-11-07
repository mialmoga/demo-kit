import subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8785','-d','/home/claude/repo'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8785/index.html'); pg.wait_for_timeout(1000)
    pg.evaluate("t=>ingest(new File([t],'m.demokit.json'))",open('/tmp/song/out/marea_de_ceniza.demokit.json').read()); pg.wait_for_timeout(2500)
    print(pg.evaluate("""async()=>{ P.tracks.forEach(t=>t.solo=(t.id==='voz')); const out=await renderProject(P,()=>{}); const sr=44100; const rms=(a,b)=>{let s=0;for(let i=a*sr;i<b*sr;i++)s+=out.L[i]**2;return +(10*Math.log10(s/((b-a)*sr)+1e-12)).toFixed(1)}; return {silencio_0_20:rms(0,20),verso1_47_57:rms(47,57),verso2_57_67:rms(57,67),intro_final_160_175:rms(160,175)}; }"""))
    b.close()
srv.kill()
