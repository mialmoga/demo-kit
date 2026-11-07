import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8793','-d','/home/claude/repo'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1300,'height':900}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8793/index.html'); pg.wait_for_timeout(1200)
    r=pg.evaluate("""async()=>{ const out={}; P.tracks.forEach((t,i)=>t.solo=(i===3)); const tr=P.tracks[3];
      const rms=(X,t0,t1)=>{ let s=0,n=0; for(let i=Math.floor(t0*SR);i<Math.floor(t1*SR)&&i<X.length;i++){s+=X[i]*X[i];n++;} return Math.sqrt(s/Math.max(1,n)); };
      const dur=P.bars*barBeats(P)*60/P.bpm; const end=P.bars*barBeats(P);
      let a=await renderProject(P,()=>{}); const base=Float32Array.from(a.L);
      tr.fx=Object.assign(fxOf(tr),{eq:Object.assign({},fxOf(tr).eq,{on:true,low:0,mid:0,high:0})});
      tr.auto=tr.auto||{}; tr.auto['fx:eq.low']=[{b:0,v:-12},{b:end/2,v:-12},{b:end,v:12}];
      let c=await renderProject(P,()=>{}); const lane=c.L;
      const q=[.1,.3,.5,.7,.9].map(f=>{ const t0=dur*f-.4,t1=dur*f+.4; return +(20*Math.log10(rms(lane,t0,t1)/rms(base,t0,t1))).toFixed(2); });
      out.gananciaGravesRel=q;
      // invalidar caché: otra curva
      tr.auto['fx:eq.low']=[{b:0,v:12},{b:end,v:12}]; let d=await renderProject(P,()=>{}); out.cache_cambia=+(20*Math.log10(rms(d.L,dur*.1-.4,dur*.1+.4)/rms(base,dur*.1-.4,dur*.1+.4))).toFixed(2);
      tr.auto['fx:eq.low']=[{b:0,v:-12},{b:end/2,v:-12},{b:end,v:12}];
      // ida y vuelta
      const j=JSON.parse(JSON.stringify(projectToJSON(P,{compact:true}))); const P2=projectFromJSON(j); out.roundtrip=JSON.stringify(P2.tracks[3].auto['fx:eq.low'])===JSON.stringify(tr.auto['fx:eq.low']);
      return out; }""")
    print(json.dumps(r))
    # UI
    pg.evaluate("selectTrack(3)"); pg.wait_for_timeout(200); pg.evaluate("autoShow=true; refreshAutoUI(); invalidate();"); 
    print('opciones fx:',pg.evaluate("[...$('autoK').querySelectorAll('optgroup')].map(g=>g.label+':'+g.children.length+':'+[...g.children].map(o=>o.textContent).slice(0,3).join('|'))"))
    pg.evaluate("autoKey='fx:eq.low'; refreshAutoUI(); invalidate();"); pg.wait_for_timeout(300)
    pg.evaluate("P.tracks[3].fx.eq.on=false; refreshAutoUI(); invalidate();"); pg.wait_for_timeout(300); pg.screenshot(path='/tmp/fxl_off.png')
    pg.evaluate("P.tracks[3].fx.eq.on=true; autoKey='fx:comp.thr'; refreshAutoUI(); invalidate();"); pg.wait_for_timeout(300)
    print('fmt:',pg.evaluate("[autoFmt('fx:eq.low',6),autoFmt('fx:eq.low',-3.5),autoFmt('fx:eq.midF',2500),autoFmt('fx:eq.midF',800),autoFmt('fx:comp.thr',-20),autoFmt('fx:reverb.mix',.35)]"))
    print('adef:',pg.evaluate("JSON.stringify(adef('fx:eq.midF'))"), pg.evaluate("autoV('fx:eq.low',30,124)"))
    print('errores',errs); b.close()
srv.kill()
