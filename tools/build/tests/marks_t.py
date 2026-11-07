import subprocess,time,sys,json
from playwright.sync_api import sync_playwright
OUT='/home/claude/work/pkg/demokit-build/out'
srv=subprocess.Popen(['python3','-m','http.server','8801','-d',OUT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1300,'height':820}); pg.on('dialog',lambda d:d.accept())
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto('http://localhost:8801/index.html'); pg.wait_for_timeout(1200)
    # 1. categorías
    print('CATS',pg.evaluate("""()=>{ const c={}; for(const id of INST_ORDER){ const d=INSTRUMENTS[id]; (c[d.cat]=c[d.cat]||[]).push(id); } return c; }"""))
    print('SELECT',pg.evaluate("()=>[...$('addInst').querySelectorAll('optgroup')].map(g=>g.label+':'+g.children.length)"))
    # proyecto de prueba con notas para comparar audio
    pg.evaluate("""()=>{ P.bars=8; addTrack('kick'); addTrack('pad'); P.tracks[0].notes.push({b:0,l:.25,m:0,v:1},{b:4,l:.25,m:0,v:1}); P.tracks[1].notes.push({b:0,l:2,m:57,v:1}); touch(); }""")
    h0=pg.evaluate("""async()=>{ const r=await renderProject(P); const L=r.L||r[0]||r.left; let h=0; const a=L; for(let i=0;i<a.length;i+=7) h=(h*31+Math.round(a[i]*32767))|0; return {h,n:a.length}; }""")
    print('AUDIO sin marcas',h0)
    # 2. UI de marcas
    pg.click('#tempoOn'); pg.click('#tabMark'); pg.wait_for_timeout(200)
    info=pg.evaluate("()=>({KW,BW,lane:tcv.getBoundingClientRect().toJSON(), bb:meter(P).bb})")
    bw=info['BW']; r=info['lane']
    def clickbar(i,fx=0.05):
        x=r['x']+info['KW']+meter_beat(i)*bw+bw*fx*4; y=r['y']+30; pg.mouse.click(x,y)
    def meter_beat(i): return i*info['bb']
    pg.fill('#mName','Intro'); pg.press('#mName','Enter')
    clickbar(0); pg.click('#mQuick button:nth-child(2)')   # renombra Verso
    clickbar(1); pg.click('#mQuick button:nth-child(4)')   # Coro
    clickbar(3); pg.click('#mQuick button:nth-child(8)')   # Outro
    print('BW',bw,'lane',r['width']); print('MARCAS',pg.evaluate("()=>JSON.stringify(P.marks)"))
    # arrastrar la marca del compás 2 al 3
    x0=r['x']+info['KW']+meter_beat(1)*bw; y=r['y']+30
    pg.mouse.move(x0+1,y); pg.mouse.down(); pg.mouse.move(x0+bw*4*0.9,y,steps=6); pg.mouse.up()
    print('TRAS ARRASTRE',pg.evaluate("()=>JSON.stringify(P.marks)"))
    pg.screenshot(path='/home/claude/work/tests/marks_lane.png',clip={'x':0,'y':r['y']-130,'width':1300,'height':260})
    # undo/redo
    pg.evaluate("()=>undo()"); a=pg.evaluate("()=>JSON.stringify(P.marks)"); pg.evaluate("()=>redo()"); b2=pg.evaluate("()=>JSON.stringify(P.marks)")
    print('UNDO',a); print('REDO',b2)
    # round trip
    rt=pg.evaluate("()=>{ const o=projectToJSON(P,{compact:true}); const Q=projectFromJSON(JSON.parse(JSON.stringify(o))); return {saved:JSON.stringify(o.marks), back:JSON.stringify(Q.marks)}; }")
    print('ROUNDTRIP',rt, 'igual' if rt['saved']==rt['back'] else 'DISTINTO')
    # audio con marcas
    h1=pg.evaluate("""async()=>{ const r=await renderProject(P); const L=r.L||r[0]||r.left; let h=0; for(let i=0;i<L.length;i+=7) h=(h*31+Math.round(L[i]*32767))|0; return {h,n:L.length}; }""")
    print('AUDIO con marcas',h1,'IDENTICO' if h0==h1 else 'DISTINTO')
    # borrar con doble clic
    xm=r['x']+info['KW']+meter_beat(3)*bw; pg.mouse.dblclick(xm+1,y)
    print('TRAS BORRAR',pg.evaluate("()=>JSON.stringify(P.marks)"))
    # sin marcas → sin clave
    pg.evaluate("()=>{ pushUndo(); P.marks=[]; touch(); }")
    print('SIN MARCAS en JSON:', 'marks' in json.loads(pg.evaluate("()=>JSON.stringify(projectToJSON(P))")))
    # bug del botón Borrar en pestaña Compás
    pg.click('#tabSig'); print('BORRAR deshabilitado en pestaña Compás:',pg.evaluate("()=>$('sDel').disabled"))
    b.close()
srv.kill()
print('ERRORES',errs)
