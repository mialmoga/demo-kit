import subprocess,time,json,numpy as np
from playwright.sync_api import sync_playwright
src=open('/home/claude/work/plugins/guitarra_acompanante.js').read()
srv=subprocess.Popen(['python3','-m','http.server','8821','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""async([src,params,midi,len,bpm])=>{ const def=installPlugin(src); loadProject(newProject('t',bpm,8)); P.tracks=[]; const t=newTrack(def.id); Object.assign(t.params,params); t.notes=[{b:0,l:len,m:midi,v:1}]; P.tracks.push(t);
  const t0=performance.now(); const o=await renderProject(P); const ms=performance.now()-t0; let nan=0; for(const v of o.L) if(!isFinite(v)) nan++; return {ms,nan,sr:SR,L:Array.from(o.L),dur:o.L.length/SR}; }"""
def run(pg,params,midi=48,len=16,bpm=100):
    return pg.evaluate(JS,[src,params,midi,len,bpm])
if __name__=='__main__':
  with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept())
    pg.goto('http://localhost:8821/index.html'); pg.wait_for_timeout(1200)
    # 1 afinación: una sola cuerda (arpegio, 1 evento) → pico espectral
    r=run(pg,{'patron':'arpegio','pulsos':1,'cuerdas':6,'humaniza':0,'cuerpo':0,'circulo':'pop','ext':0},48,1,60)
    x=np.array(r['L']); sr=r['sr']; print('nan',r['nan'],'sr',sr,'dur',round(r['dur'],2))
    # nota 'A0' = bajo de C (raíz MI? C → midi 48 pc0 → root 48 → 130.8 Hz) en t=0
    seg=x[int(.01*sr):int(.9*sr)]; N=1<<17; X=np.abs(np.fft.rfft(seg*np.hanning(len(seg)),N)); fr=np.fft.rfftfreq(N,1/sr); i=np.argmax(X[(fr>100)&(fr<170)])+np.argmax(fr>100); f=fr[i]
    print('fundamental medida %.2f Hz vs C3 130.81 → %.1f cents'%(f,1200*np.log2(f/130.81)))
    # 2 decaimiento: RMS por ventana de 100 ms
    w=int(.1*sr); rms=[np.sqrt(np.mean(x[i:i+w]**2)) for i in range(0,min(len(x)-w,int(2.4*sr)),w)]; print('rms cada 100ms (dB rel):',[round(20*np.log10(v/max(rms)+1e-9),1) for v in rms[:16:2]])
    # 3 centroide por intérprete (rasgueo abajo)
    for it in ['infante','flamenco','bossa','ranchera','lofi']:
        r=run(pg,{'interprete':it,'patron':'abajo','pulsos':4,'humaniza':0},48,4,60); x=np.array(r['L']); seg=x[:int(1.5*sr)]; X=np.abs(np.fft.rfft(seg*np.hanning(len(seg))))**2; fr=np.fft.rfftfreq(len(seg),1/sr)
        print('%-9s centroide %5.0f Hz  pico %.3f  rms %.4f  nan %d  %.0f ms'%(it,(fr*X).sum()/X.sum(),np.abs(x).max(),np.sqrt(np.mean(x**2)),r['nan'],r['ms']))
    print(errs)
srv.terminate()
