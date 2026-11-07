import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8791','-d','/tmp/srv'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
JS="""()=>{ const out={}; const T=4, N=SR*T;
 const tone=(f,a)=>{ const L=new Float32Array(N); for(let i=0;i<N;i++) L[i]=a*Math.sin(2*Math.PI*f*i/SR); return L; };
 const win=(X,t)=>{ const i=Math.floor(t*SR); let s=0; for(let k=0;k<4410;k++) s+=X[i+k]*X[i+k]; return s/4410; };
 const db=(a,b)=>+(10*Math.log10(a/b)).toFixed(2);
 const FX=(o)=>fxOf({fx:o});
 // EQ graves: rampa -12→+12 dB en 4 s
 { const lane={'fx:eq.low':i=>-12+24*i/N}; const L=tone(60,.1), R=Float32Array.from(L); const o=applyFx(L,R,FX({eq:{on:true,low:0}}),.5,N,null,lane);
   const r=[]; for(const t of [.3,1,2,3,3.7]){ const e=-12+24*(t+.05)/T; r.push([+e.toFixed(1),db(win(o.L,t),win(L,t))]); } out.eqLow60=r;
   const L2=tone(2000,.1), R2=Float32Array.from(L2); const o2=applyFx(L2,R2,FX({eq:{on:true,low:0}}),.5,N,null,lane); out.eqLow_on_2k=[db(win(o2.L,.3),win(L2,.3)),db(win(o2.L,3.5),win(L2,3.5))]; }
 // EQ medios con frecuencia automatizada: tono 2k, mid +9, midF 500→4000 (la ganancia en 2k debe subir y bajar)
 { const lane={'fx:eq.midF':i=>500*Math.pow(8,i/N)}; const L=tone(2000,.1), R=Float32Array.from(L); const o=applyFx(L,R,FX({eq:{on:true,mid:9,midF:1000,midQ:1}}),.5,N,null,lane);
   out.eqMidF=[.2,1,2,3,3.8].map(t=>db(win(o.L,t),win(L,t))); }
 // compresor: umbral -40→0 con tono -10 dBFS
 { const lane={'fx:comp.thr':i=>-40+40*i/N}; const a=Math.pow(10,-10/20), L=tone(440,a), R=Float32Array.from(L); const o=applyFx(L,R,FX({comp:{on:true,thr:-20,ratio:4,knee:0,atk:5,rel:80,makeup:0,mix:1}}),.5,N,null,lane);
   out.compThr=[[.5,-40+40*.55/T],[2,-40+40*2.05/T],[3.5,-40+40*3.55/T]].map(([t,th])=>[+th.toFixed(1),db(win(o.L,t),win(L,t))]); }
 // delay mezcla 0→1
 { const lane={'fx:delay.mix':i=>Math.min(1,i/N)}; const L=new Float32Array(N); for(let i=0;i<N;i+=SR/4){ for(let k=0;k<2000;k++) L[i+k]=.3*Math.sin(2*Math.PI*440*k/SR); } const R=Float32Array.from(L);
   const f0=FX({delay:{on:true,mix:0,time:.75,fb:.5}}); const o=applyFx(L,R,f0,.5,N+SR,null,lane);
   let d=new Float32Array(N); for(let i=0;i<N;i++) d[i]=o.L[i]-L[i]; out.delayWetEarlyLate=[win(d,.6)<win(d,3.3), +win(d,.6).toExponential(2), +win(d,3.3).toExponential(2)]; }
 // reverb mezcla 0→1
 { const lane={'fx:reverb.mix':i=>Math.min(1,i/N)}; const L=new Float32Array(N); for(let i=0;i<N;i+=SR/2){ for(let k=0;k<1500;k++) L[i+k]=.3*Math.sin(2*Math.PI*330*k/SR); } const R=Float32Array.from(L);
   const o=applyFx(L,R,FX({reverb:{on:true,mix:0,size:.6,pre:0,damp:.5}}),.5,N+SR,null,lane);
   let d=new Float32Array(N); for(let i=0;i<N;i++) d[i]=o.L[i]-L[i]; out.reverbWet=[win(d,.7)<win(d,3.2), +win(d,.7).toExponential(2), +win(d,3.2).toExponential(2)]; }
 // clics: tono 100 Hz, barrido rápido del EQ y del umbral; salto máximo entre muestras vs el esperado
 { const L=tone(100,.2), R=Float32Array.from(L); const lane={'fx:eq.low':i=>(i%SR<SR/2?-12:12)}; // salto brusco ±12 dB cada medio segundo: peor caso
   const o=applyFx(L,R,FX({eq:{on:true,low:0}}),.5,N,null,lane); let mx=0,mi=0; for(let i=1;i<N;i++){ mx=Math.max(mx,Math.abs(o.L[i]-o.L[i-1])); mi=Math.max(mi,Math.abs(L[i]-L[i-1])); } out.clic_salto_max_vs_entrada=[+mx.toFixed(4),+mi.toFixed(4),+(mx/mi).toFixed(2)]; }
 // sin curvas: salida idéntica por hash
 { const L=tone(440,.3), R=tone(550,.3); const f={eq:{on:true,low:5,mid:-3,midF:900,midQ:1.2,high:2},comp:{on:true,thr:-18,ratio:3,knee:3,atk:5,rel:90,makeup:2,mix:.8},delay:{on:true,mix:.3,time:.75,fb:.4},reverb:{on:true,mix:.25,size:.6,pre:10,damp:.5}};
   const o=applyFx(Float32Array.from(L),Float32Array.from(R),FX(f),.5,N); let h=0; for(let i=0;i<o.L.length;i+=7) h=(h*31+Math.round(o.L[i]*1e6)+Math.round(o.R[i]*1e6))|0; out.hash=h+'/'+o.L.length; }
 return out; }"""
with sync_playwright() as p:
    b=p.chromium.launch()
    for f in ('old','new'):
        pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8791/%s.html'%f); pg.wait_for_timeout(1200)
        if f=='old':
            r=pg.evaluate(JS.replace("applyFx(Float32Array.from(L)","applyFx(Float32Array.from(L)")) if False else None
            # old no soporta curvas: solo el hash
            h=pg.evaluate("""()=>{ const N=SR*4; const L=new Float32Array(N),R=new Float32Array(N); for(let i=0;i<N;i++){L[i]=.3*Math.sin(2*Math.PI*440*i/SR);R[i]=.3*Math.sin(2*Math.PI*550*i/SR);} const f={eq:{on:true,low:5,mid:-3,midF:900,midQ:1.2,high:2},comp:{on:true,thr:-18,ratio:3,knee:3,atk:5,rel:90,makeup:2,mix:.8},delay:{on:true,mix:.3,time:.75,fb:.4},reverb:{on:true,mix:.25,size:.6,pre:10,damp:.5}}; const o=applyFx(L,R,fxOf({fx:f}),.5,N); let h=0; for(let i=0;i<o.L.length;i+=7) h=(h*31+Math.round(o.L[i]*1e6)+Math.round(o.R[i]*1e6))|0; return h+'/'+o.L.length; }""")
            print('hash viejo',h)
        else:
            r=pg.evaluate(JS); print(json.dumps(r)); 
        print(f,'errores',errs)
    b.close()
srv.kill()
