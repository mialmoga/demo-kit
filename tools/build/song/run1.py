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
    st=pg.evaluate("""async()=>{ const t0=performance.now(); const out=await renderProject(P,()=>{}); const sr=44100, N=out.L.length; let pk=0; const rows=[]; for(let s=0;s*sr<N;s+=5){ let e=0,m=0,c=0; for(let i=s*sr;i<Math.min(N,(s+5)*sr);i++){ const x=out.L[i]; e+=x*x; c++; m=Math.max(m,Math.abs(x)); } rows.push([s,+(20*Math.log10(Math.sqrt(e/c)+1e-9)).toFixed(1),+m.toFixed(2)]); pk=Math.max(pk,m); } return {sec:N/sr,render:+((performance.now()-t0)/1000).toFixed(1),pk,rows}; }""")
    print('dur',st['sec'],'render s',st['render'],'pico',st['pk']); print(' '.join('%d:%s/%s'%(r[0],r[1],r[2]) for r in st['rows']))
    print('errores',errs); b.close()
srv.kill()
