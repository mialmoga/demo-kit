import subprocess,time,json,base64
from playwright.sync_api import sync_playwright
import mido
srv=subprocess.Popen(['python3','-m','http.server','8810','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.on('dialog',lambda d:d.accept()); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8810/index.html'); pg.wait_for_timeout(1000)
    r=pg.evaluate("""()=>{ loadProject(newProject('Prueba MIDI',120,12)); addTrack('kick'); addTrack('pad');
      P.tracks[0].notes.push({b:0,l:.25,m:0,v:1},{b:4,l:.25,m:0,v:1}); P.tracks[1].notes.push({b:0,l:4,m:57,v:1}); 
      P.sigs=[{bar:4,sig:[7,8]}]; P.tempo=[{b:8,bpm:150,ramp:true}];
      P.marks=[{bar:0,name:'Intro'},{bar:2,name:'Verso'},{bar:5,name:'Coro ñ'},{bar:9,name:'Outro'}];
      const u=projectToMidi(P); let s=''; for(const x of u) s+=String.fromCharCode(x); return {b64:btoa(s),barsTicks:[0,2,5,9].map(i=>Math.round(meter(P).beatOfBar(i)*MIDI_PPQ))}; }""")
    raw=base64.b64decode(r['b64']); open('/home/claude/work/tests/out.mid','wb').write(raw)
    m=mido.MidiFile('/home/claude/work/tests/out.mid'); t=0; found=[]
    for msg in m.tracks[0]:
        t+=msg.time
        if msg.type=='marker': found.append((t,msg.text))
    print('mido lee marcadores:',found,'| ticks esperados:',r['barsTicks'],'| ppq',m.ticks_per_beat)
    # ida y vuelta por el importador del estudio
    rt=pg.evaluate("""b64=>{ const s=atob(b64), u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); const o=midiToProject(u,'x.mid'); return {marks:o.project.marks,warn:o.warnings,sigs:o.project.sigs,bars:o.project.bars}; }""",r['b64'])
    print('estudio reimporta:',json.dumps(rt['marks'],ensure_ascii=False),'| avisos:',rt['warn'],'| sigs:',rt['sigs'])
    # MIDI de otro programa: marcador fuera de compás, repetido en el mismo compás, y uno pasado el final
    mf=mido.MidiFile(ticks_per_beat=480); tr0=mido.MidiTrack(); mf.tracks.append(tr0); tr1=mido.MidiTrack(); mf.tracks.append(tr1)
    tr0.append(mido.MetaMessage('set_tempo',tempo=500000,time=0))
    tr0.append(mido.MetaMessage('marker',text='Verse 1',time=0)); tr0.append(mido.MetaMessage('marker',text='Chorus',time=int(480*4*2+480*0.9)))  # casi compás 3 (fuera de límite)
    tr0.append(mido.MetaMessage('marker',text='Chorus bis',time=10)); tr0.append(mido.MetaMessage('cue_marker',text='Final',time=480*4*20))
    tr1.append(mido.Message('program_change',program=0,time=0)); tr1.append(mido.Message('note_on',note=60,velocity=90,time=0)); tr1.append(mido.Message('note_off',note=60,velocity=0,time=480*4*6))
    mf.save('/home/claude/work/tests/ext.mid'); ext=open('/home/claude/work/tests/ext.mid','rb').read()
    ex=pg.evaluate("""b64=>{ const s=atob(b64), u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); const o=midiToProject(u,'ext.mid'); return {marks:o.project.marks,warn:o.warnings,bars:o.project.bars}; }""",base64.b64encode(ext).decode())
    print('MIDI externo:',json.dumps(ex['marks'],ensure_ascii=False),'| bars',ex['bars']); [print('   aviso:',w) for w in ex['warn']]
    # sin secciones: el MIDI no cambia de bytes respecto a antes (sin marcadores)
    n=pg.evaluate("()=>{ P.marks=[]; const u=projectToMidi(P); return u.length; }"); n2=pg.evaluate("()=>{ P.marks=[{bar:1,name:'A'}]; return projectToMidi(P).length; }"); print('bytes sin/con 1 marca:',n,n2)
    b.close()
srv.kill(); print('ERRORES',errs)
