import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8786','-d','/home/claude/repo'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
new=open('/home/claude/repo/plugins/automata_vocal.js').read(); old=open('/tmp/automata_vocal.pre_legato.js').read(); fm=open('/tmp/song/cristal_fm.js').read(); bs=open('/tmp/song/build_song.js').read()
JS="""async([bs,leg])=>{ const o=eval(bs); const P0={name:'t',bpm:84,bars:o.BARS,sig:[4,4],seed:20261102,sc:{mode:'param',depth:.7,rel:.14,table:null,rate:800},master:{low:0,high:0,gain:1,limit:false,ceil:.97},clips:{},tracks:o.tracks.filter(t=>t.id==='voz').map(fixTrack)};
 loadProject(P0); P.tempo=[{b:80,bpm:84},{b:112,bpm:112,ramp:true},{b:264,bpm:112},{b:292,bpm:68,ramp:true}]; P.sigs=[{bar:28,sig:[7,8]},{bar:44,sig:[4,4]}]; if(leg!=null) P.tracks[0].params.legato=leg; touch();
 const out=await renderProject(P,()=>{}); const sr=44100, tm=tmap(P); const notes=P.tracks[0].notes.slice().sort((a,b)=>a.b-b.b);
 const u=new Uint32Array(out.L.buffer,out.L.byteOffset,out.L.length); let h=2166136261; for(let i=0;i<u.length;i++) h=Math.imul(h^u[i],16777619);
 const rms=(a,b)=>{ a=Math.max(0,a|0); b=Math.min(out.L.length,b|0); let s=0; for(let i=a;i<b;i++) s+=out.L[i]**2; return Math.sqrt(s/Math.max(1,b-a)); };
 const dips=[]; let maxJump=0; for(let k=1;k<notes.length;k++){ const pe=notes[k-1].b+notes[k-1].l; if(Math.abs(pe-notes[k].b)>1e-6) continue; const t=tm.sec(notes[k].b); const c=Math.floor(t*sr); let mn=1e9; for(let w=-25;w<=25;w+=5) mn=Math.min(mn,rms(c+w*44-440,c+w*44+440)); const around=(rms(c-4400,c-1500)+rms(c+1500,c+4400))/2; dips.push(+(20*Math.log10(mn/(around+1e-9))).toFixed(1)); for(let i=c-600;i<c+600;i++) maxJump=Math.max(maxJump,Math.abs(out.L[i]-out.L[i-1])); }
 return {h:h>>>0,dipMedio_dB:+(dips.reduce((a,b)=>a+b,0)/dips.length).toFixed(1),peorDip_dB:Math.min(...dips),saltoMax:+maxJump.toFixed(3),n:dips.length,sec:out.L.length/sr}; }"""
with sync_playwright() as p:
    b=p.chromium.launch()
    def run(code,leg):
        pg=b.new_page(); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8786/index.html'); pg.wait_for_timeout(800)
        pg.evaluate("c=>ingest(new File([c],'a.js'),{trusted:true})",code); pg.evaluate("c=>ingest(new File([c],'f.js'),{trusted:true})",fm); pg.wait_for_timeout(600)
        r=pg.evaluate(JS,[bs,leg]); pg.close(); return r
    print('plugin anterior       :',run(old,None))
    print('nuevo, legato 0       :',run(new,0))
    print('nuevo, legato .8      :',run(new,.8))
    print('nuevo, legato 1       :',run(new,1))
    b.close()
srv.kill()
