import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8787','-d','/home/claude/repo'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8787/index.html'); pg.wait_for_timeout(1000)
    r=pg.evaluate("""()=>{ const out={}; const SRr=SR; const N=SRr*2;
      const tone=(f,a)=>{ const L=new Float32Array(N); for(let i=0;i<N;i++) L[i]=a*Math.sin(2*Math.PI*f*i/SRr); return L; };
      const rmsDb=(X)=>{ let s=0,c=0; for(let i=N/2;i<N;i++){ s+=X[i]*X[i]; c++; } return 10*Math.log10(s/c); };
      const gain=(f,fx)=>{ const L=tone(f,.1), R=Float32Array.from(L), i0=rmsDb(L); const o=applyFx(L,R,fxOf({fx}),.5,N); return +(rmsDb(o.L)-i0).toFixed(2); };
      // EQ: ganancia pedida en cada frecuencia
      out.eqLow=[gain(60,{eq:{on:true,low:6}}),gain(1000,{eq:{on:true,low:6}})];
      out.eqHigh=[gain(12000,{eq:{on:true,high:-6}}),gain(1000,{eq:{on:true,high:-6}})];
      out.eqMid=[gain(2000,{eq:{on:true,mid:8,midF:2000,midQ:1}}),gain(250,{eq:{on:true,mid:8,midF:2000,midQ:1}}),gain(2000,{eq:{on:true,mid:-8,midF:2000,midQ:1}})];
      // compresor: curva estática (umbral −20, razón 4, sin codo): entrada −10 dB → salida −17.5 (reducción 7.5); entrada −30 → sin cambio
      const cs=(a,c)=>{ const L=tone(440,a), R=Float32Array.from(L); const o=applyFx(L,R,fxOf({fx:{comp:Object.assign({on:true,thr:-20,ratio:4,knee:0,atk:1,rel:50,makeup:0,mix:1},c||{})}}),.5,N); return +(rmsDb(o.L)-rmsDb(L)).toFixed(2); };
      out.compCurva={in_-10dB:null};
      out.compCurva={entrada_pico_-10dBFS:cs(Math.pow(10,-10/20)), entrada_pico_-30dBFS:cs(Math.pow(10,-30/20)), con_makeup6:cs(Math.pow(10,-10/20),{makeup:6}), mezcla_50:cs(Math.pow(10,-10/20),{mix:.5})};
      // ataque/liberación: ráfaga fuerte tras silencio, mido la ganancia en el tiempo
      { const L=new Float32Array(SRr), R=new Float32Array(SRr); for(let i=SRr*.2;i<SRr*.6;i++){ L[i]=R[i]=.5*Math.sin(2*Math.PI*440*i/SRr); } const L0=Float32Array.from(L); const O=applyFx(L,R,fxOf({fx:{comp:{on:true,thr:-20,ratio:10,knee:0,atk:20,rel:200,makeup:0,mix:1}}}),.5,SRr);
        const gAt=(t)=>{ const i=Math.floor(t*SRr); let a=0,b=0; for(let k=0;k<441;k++){ a+=O.L[i+k]**2; b+=L0[i+k]**2; } return +(10*Math.log10(a/b)).toFixed(1); };
        out.ataque_ms={g_5ms:gAt(.205),g_20ms:gAt(.22),g_100ms:gAt(.3),g_350ms:gAt(.55)}; }
      // transparente apagado: hash idéntico
      { const L=tone(440,.3), R=tone(550,.3); const L1=Float32Array.from(L), R1=Float32Array.from(R); const o=applyFx(L1,R1,fxOf({fx:{eq:{on:false,low:6},comp:{on:false}}}),.5,N); let same=o.L===L1; out.apagado_misma_referencia=same; }
      return out; }""".replace("out.compCurva={in_-10dB:null};","").replace("entrada_pico_-10dBFS","e_m10").replace("entrada_pico_-30dBFS","e_m30"))
    print(json.dumps(r,indent=1)); print('errores',errs); b.close()
srv.kill()
