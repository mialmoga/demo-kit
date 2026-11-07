import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8784','-d','/home/claude/repo'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
O='/tmp/song/out/'
H="""out=>{ const u=new Uint32Array(out.L.buffer,out.L.byteOffset,out.L.length); let h=2166136261,pk=0,e=0; for(let i=0;i<u.length;i++){ h=Math.imul(h^u[i],16777619); const x=out.L[i]; pk=Math.max(pk,Math.abs(x)); e+=x*x; } return {h:h>>>0,pk:+pk.toFixed(3),rms:+Math.sqrt(e/out.L.length).toFixed(4),sec:+(out.L.length/44100).toFixed(2)}; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); res={}
    # 1) proyecto compacto en un navegador limpio (sin plugins instalados)
    pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:(print('  diálogo:',d.message[:110].replace('\\n',' ')),d.accept())); pg.goto('http://localhost:8784/index.html'); pg.wait_for_timeout(1000)
    txt=open(O+'marea_de_ceniza.demokit.json').read()
    pg.evaluate("t=>ingest(new File([t],'marea.demokit.json'))",txt); pg.wait_for_timeout(2500)
    print('abierto:',pg.evaluate("({n:P.name,pistas:P.tracks.length,notas:P.tracks.reduce((a,t)=>a+t.notes.length,0),tempo:(P.tempo||[]).length,sigs:(P.sigs||[]).length,err:P.loadErrors,warn:P.loadWarnings,voz:!!INSTRUMENTS.voz,fm:!!INSTRUMENTS.cristalfm,palabras:P.tracks.find(t=>t.inst==='voz').notes.filter(n=>n.w).length,esc:P.tracks.find(t=>t.inst==='voz').notes.filter(n=>n.o&&n.o.cansancio>0).length})"))
    res['proyecto']=pg.evaluate("async H=>{ const f=eval(H); return f(await renderProject(P,()=>{})); }",H); print('proyecto compacto →',res['proyecto'])
    # 2) la demo .js exportada
    pg2=b.new_page(); pg2.on('pageerror',lambda e:errs.append(str(e))); pg2.on('dialog',lambda d:d.accept()); pg2.goto('http://localhost:8784/index.html'); pg2.wait_for_timeout(1000)
    js=open(O+'marea_de_ceniza.js').read()
    res['demo']=pg2.evaluate("""async([src,H])=>{ const f=new Function('sleep','demoKit',src+';return renderMareaDeCeniza;')(ms=>Promise.resolve(),demoKit); const out=await f(44100); return eval(H)(out); }""",[js,H]); print('demo .js exportada →',res['demo'])
    print('convertir demo:',pg2.evaluate("""async src=>{ const {project,stats}=await recordDemo(src,{name:'m'}); return {pistas:project.tracks.length,notas:project.tracks.reduce((a,t)=>a+t.notes.length,0),clips:stats.clips,tempo:(project.tempo||[]).length,sigs:(project.sigs||[]).length}; }""",js))
    print('proyecto recuperado de la demo:',pg2.evaluate("""src=>{ const e=embeddedProject(src); const p=projectFromFile?projectFromFile(e,'m'):e; return {pistas:p.tracks.length,notas:p.tracks.reduce((a,t)=>a+t.notes.length,0),tempo:(p.tempo||[]).length,sigs:(p.sigs||[]).length,clips:Object.keys(p.clips||{}).length}; }""",js))
    print('idénticos proyecto vs demo:',res['proyecto']['h']==res['demo']['h'])
    # 3) MIDI
    import base64
    mid=base64.b64encode(open(O+'marea_de_ceniza.mid','rb').read()).decode()
    print('MIDI importado:',pg2.evaluate("""b64=>{ const u=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)); const r=midiToProject(u,'m'); const p=r.project||r; return {bars:p.bars,bpm:p.bpm,tempo:(p.tempo||[]).length,sigs:(p.sigs||[]).length,pistas:p.tracks.length,notas:p.tracks.reduce((a,t)=>a+t.notes.length,0),warn:(r.warnings||[]).slice(0,3)}; }""",mid))
    print('errores',errs); b.close()
srv.kill()
