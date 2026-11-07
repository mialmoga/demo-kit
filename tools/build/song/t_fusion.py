import subprocess,time,json,base64,sys,numpy as np
from playwright.sync_api import sync_playwright
kit=open('/home/claude/work/kits/demo-kit-Evol.js').read(); song=open('/home/claude/work/song/La_rotita_con_voz.demokit.json',encoding='utf8').read()
M=json.load(open('/home/claude/work/song/fusion_meta.json')); S,C,O,TOT=M['S'],M['C'],M['O'],M['TOTAL']
SEC=[('Intro',0,8),('Verso',8,S),('Subida',S,C),('Cierre',C,O),('Outro',O,TOT)]
srv=subprocess.Popen(['python3','-m','http.server','8832','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""async ([s,SEC,mute,keep])=>{ const o=JSON.parse(s); loadProject(projectFromJSON(o)); if(mute) for(const t of P.tracks) if(t.id===mute) t.mute=true; const R=await renderProject(P); if(keep) window.__R=R;
  const bt=60/P.bpm,out=[]; let nan=0,clip=0,pk=0; for(let i=0;i<R.L.length;i++){ const a=Math.abs(R.L[i]),c=Math.abs(R.R[i]); if(a!==a||c!==c) nan++; if(a>.99||c>.99) clip++; if(a>pk) pk=a; if(c>pk) pk=c; }
  for(const [nm,a,b] of SEC){ let e=0,m=0,i0=Math.floor(a*4*bt*SR),i1=Math.min(R.L.length,Math.floor(b*4*bt*SR)); for(let i=i0;i<i1;i++){ e+=(R.L[i]*R.L[i]+R.R[i]*R.R[i])/2; m=Math.max(m,Math.abs(R.L[i]),Math.abs(R.R[i])); } out.push([nm,Math.sqrt(e/(i1-i0)),m]); }
  return {errs:P.loadErrors,warn:P.loadWarnings,n:R.L.length,sr:SR,nan,clip,pk,out}; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; dl=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:(dl.append(d.message[:80]),d.accept()))
    pg.goto('http://localhost:8832/index.html'); pg.wait_for_timeout(1200)
    pg.evaluate("src=>ingest(new File([src],'demo-kit-Evol.js'))",kit); pg.wait_for_timeout(800)
    full=pg.evaluate(JS,[song,SEC,None,True]); print('errores:',full['errs'],full['warn'],'| error de página:',errs[:3])
    n=full['n']; sr=full['sr']; CH=1<<20; chunks=[]
    for i in range(0,n,CH):
        s=pg.evaluate("""([i,c])=>{ const R=window.__R,e=Math.min(R.L.length,i+c),u=new Int16Array((e-i)*2); for(let k=i;k<e;k++){ u[(k-i)*2]=Math.max(-32768,Math.min(32767,Math.round(R.L[k]*32767))); u[(k-i)*2+1]=Math.max(-32768,Math.min(32767,Math.round(R.R[k]*32767))); } let s='',B=new Uint8Array(u.buffer); for(let j=0;j<B.length;j+=8192) s+=String.fromCharCode.apply(null,B.subarray(j,j+8192)); return btoa(s); }""",[i,CH]); chunks.append(base64.b64decode(s))
    open('/home/claude/work/song/rotita.raw','wb').write(b''.join(chunks)); open('/home/claude/work/song/sr.txt','w').write(str(sr))
    nov=pg.evaluate(JS,[song,SEC,'voz',False])
srv.terminate()
print('duración %.1f s | pico %.3f | >0.99: %d | NaN: %d'%(full['n']/full['sr'],full['pk'],full['clip'],full['nan']))
for (nm,r,pk),(_,rm,_) in zip(full['out'],nov['out']):
    v=max(0,r*r-rm*rm)**.5; print('%-7s total %.1f dBFS (pico %.2f) | música sola %.1f dBFS | voz ≈ %.1f dBFS  (voz−música %+.1f dB)'%(nm,20*np.log10(r+1e-9),pk,20*np.log10(rm+1e-9),20*np.log10(v+1e-9),20*np.log10((v+1e-9)/(rm+1e-9))))
