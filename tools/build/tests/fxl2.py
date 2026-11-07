import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8792','-d','/tmp/srv'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8792/new.html'); pg.wait_for_timeout(1000)
    print(pg.evaluate("""()=>{ const N=SR*2, r=[]; const L=new Float32Array(N); for(let i=0;i<N;i++) L[i]=.1*Math.sin(2*Math.PI*60*i/SR);
      const e=a=>{ let s=0; for(let i=N/2;i<N;i++) s+=a[i]*a[i]; return s; };
      for(const g of [-9,-4,6,10]){ const st=applyFx(Float32Array.from(L),Float32Array.from(L),fxOf({fx:{eq:{on:true,low:g}}}),.5,N);
        const ln=applyFx(Float32Array.from(L),Float32Array.from(L),fxOf({fx:{eq:{on:true,low:0}}}),.5,N,null,{'fx:eq.low':()=>g});
        r.push([g,+(10*Math.log10(e(st.L)/e(L))).toFixed(2),+(10*Math.log10(e(ln.L)/e(L))).toFixed(2)]); } return r; }"""))
    b.close()
srv.kill()
