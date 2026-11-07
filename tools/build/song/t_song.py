import subprocess,time,sys,json,base64,numpy as np
from playwright.sync_api import sync_playwright
kit=open('/home/claude/work/kits/demo-kit-Evol.js').read(); song=open('/home/claude/work/song/Suenos_sin_dientes_Ambar.demokit.json',encoding='utf8').read()
srv=subprocess.Popen(['python3','-m','http.server','8831','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
SEC=[('Intro',0,32),('A 1ª mitad',32,64),('A 2ª mitad',64,96),('B',96,160),('A2',160,224),('Outro',224,300),('cola',300,320)]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; dl=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') else None)
    pg.on('dialog',lambda d:(dl.append(d.message[:120]),d.accept()))
    pg.goto('http://localhost:8831/index.html'); pg.wait_for_timeout(1200)
    pg.evaluate("src=>ingest(new File([src],'demo-kit-Evol.js'))",kit); pg.wait_for_timeout(800)
    r=pg.evaluate("""async ([s,SEC])=>{ const o=JSON.parse(s); loadProject(projectFromJSON(o)); const t0=performance.now(); const R=await renderProject(P); window.__R=R;
      const bt=60/P.bpm, out=[]; let nan=0,clip=0,pk=0; for(let i=0;i<R.L.length;i++){ const a=Math.abs(R.L[i]),c=Math.abs(R.R[i]); if(a!==a||c!==c) nan++; if(a>.99||c>.99) clip++; if(a>pk) pk=a; if(c>pk) pk=c; }
      for(const [nm,a,b] of SEC){ let l=0,r=0,m=0,i0=Math.floor(a*bt*SR),i1=Math.min(R.L.length,Math.floor(b*bt*SR)); for(let i=i0;i<i1;i++){ l+=R.L[i]*R.L[i]; r+=R.R[i]*R.R[i]; m=Math.max(m,Math.abs(R.L[i]),Math.abs(R.R[i])); } const n=i1-i0; out.push([nm,Math.sqrt(l/n),Math.sqrt(r/n),m]); }
      return {errs:P.loadErrors,warn:P.loadWarnings,tracks:P.tracks.length,ms:performance.now()-t0,n:R.L.length,sr:SR,nan,clip,pk,out}; }""",[song,SEC])
    print('errores de carga:',r['errs'],r['warn'],'| diálogos:',dl,'| consola:',errs[:5])
    print('pistas',r['tracks'],'| render %.1f s'%(r['ms']/1000),'| duración %.1f s | pico %.3f | >0.99: %d | NaN: %d'%(r['n']/r['sr'],r['pk'],r['clip'],r['nan']))
    for nm,l,r_,m in r['out']: print('%-11s rms L %.3f R %.3f (%.1f dBFS) pico %.3f'%(nm,l,r_,20*np.log10((l+r_)/2+1e-9),m))
    # audio a disco, en trozos
    n=r['n']; sr=r['sr']; CH=1<<20; chunks=[]
    for i in range(0,n,CH):
        s=pg.evaluate("""([i,c])=>{ const R=window.__R,e=Math.min(R.L.length,i+c),u=new Int16Array((e-i)*2); for(let k=i;k<e;k++){ u[(k-i)*2]=Math.max(-32768,Math.min(32767,Math.round(R.L[k]*32767))); u[(k-i)*2+1]=Math.max(-32768,Math.min(32767,Math.round(R.R[k]*32767))); } let s='',B=new Uint8Array(u.buffer); for(let j=0;j<B.length;j+=8192) s+=String.fromCharCode.apply(null,B.subarray(j,j+8192)); return btoa(s); }""",[i,CH])
        chunks.append(base64.b64decode(s))
    open('/home/claude/work/song/render.raw','wb').write(b''.join(chunks)); open('/home/claude/work/song/sr.txt','w').write(str(sr))
srv.terminate()
