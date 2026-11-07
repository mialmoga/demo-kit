import subprocess,time,json,sys
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8783','-d','/home/claude/repo'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
voz=open('/home/claude/repo/plugins/automata_vocal.js').read(); fm=open('/tmp/song/cristal_fm.js').read(); bs=open('/tmp/song/build_song.js').read()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8783/index.html'); pg.wait_for_timeout(1000)
    pg.evaluate("c=>ingest(new File([c],'automata_vocal.js'),{trusted:true})",voz); pg.evaluate("c=>ingest(new File([c],'cristal_fm.js'),{trusted:true})",fm); pg.wait_for_timeout(800)
    print('plugins:',pg.evaluate("!!INSTRUMENTS.voz+' '+!!INSTRUMENTS.cristalfm"))
    r=pg.evaluate("""bs=>{ const o=eval(bs); const P0={name:'Marea de ceniza',bpm:84,bars:o.BARS,sig:[4,4],seed:20261102,sc:{mode:'param',depth:.7,rel:.14,table:null,rate:800},master:{low:2,high:1.5,gain:.9,limit:true,ceil:.97},clips:{},tracks:o.tracks.map(fixTrack)};
      loadProject(P0); P.tempo=[{b:80,bpm:84},{b:112,bpm:112,ramp:true},{b:264,bpm:112},{b:292,bpm:68,ramp:true}]; P.sigs=[{bar:28,sig:[7,8]},{bar:44,sig:[4,4]}]; touch();
      return {tracks:P.tracks.length,notas:P.tracks.reduce((a,t)=>a+t.notes.length,0),bars:P.bars,total:meter(P).total(P.bars),dur:tmap(P).sec?tmap(P).sec(meter(P).total(P.bars)):null,loadErrors:P.loadErrors}; }""",bs)
    print(json.dumps(r))

    # hornear el barrido del respiro (compases 59 y 60: notas largas del Reese)
    rb=pg.evaluate("""()=>{ const tr=P.tracks.find(t=>t.id==='rees'); tr.alv=16; const L=[224,228]; const notes=tr.notes.filter(n=>L.some(b=>Math.abs(n.b-b)<1e-6)&&n.l===4); const r=bakeTrackNotes(P,tr,notes); touch(); return {horneadas:r.baked,compartidas:r.shared,bytes:r.bytes,pistas:P.tracks.length}; }""")
    print('hornear:',rb)
    st=pg.evaluate("""async()=>{ const out=await renderProject(P,()=>{}); let pk=0,e=0; for(const x of out.L){ pk=Math.max(pk,Math.abs(x)); e+=x*x; } return {sec:out.L.length/44100,pk,rms:Math.sqrt(e/out.L.length)}; }""")
    print('tras hornear:',st)
    import os; os.makedirs('/tmp/song/out',exist_ok=True)
    pg.evaluate("P.name='Marea de ceniza'")
    with pg.expect_download() as d: pg.click('#bCompact')
    d.value.save_as('/tmp/song/out/marea_de_ceniza.demokit.json')
    with pg.expect_download() as d: pg.click('#bDemoJs')
    d.value.save_as('/tmp/song/out/marea_de_ceniza.js')
    with pg.expect_download() as d: pg.click('#bMidiOut')
    d.value.save_as('/tmp/song/out/marea_de_ceniza.mid')
    with pg.expect_download() as d: pg.click('#bSave')
    d.value.save_as('/tmp/song/out/marea_de_ceniza_completo.demokit.json')
    print('errores',errs); b.close()
srv.kill()
