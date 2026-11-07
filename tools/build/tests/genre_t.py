import subprocess,time,json
from playwright.sync_api import sync_playwright
OUT='/home/claude/work/pkg/demokit-build/out'
srv=subprocess.Popen(['python3','-m','http.server','8802','-d',OUT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1300,'height':900}); pg.on('dialog',lambda d:d.accept())
    pg.on('pageerror',lambda e:errs.append('PAGEERROR '+str(e)))
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and '404' not in m.text else None)
    pg.goto('http://localhost:8802/index.html'); pg.wait_for_timeout(1200)
    pg.click('#bGen'); pg.wait_for_timeout(300)
    print('CHIPS',pg.evaluate("()=>[...document.querySelectorAll('#genBody .gchips button')].map(b=>b.textContent)"))
    pg.click("#genBody .gchips button:nth-child(3)")   # Dubstep
    print('ESTRUCTURAS',pg.evaluate("()=>[...document.querySelectorAll('#genBody .gstr')].map(l=>l.textContent.replace(/\\s+/g,' ').slice(0,60))"))
    pg.screenshot(path='/home/claude/work/tests/genre_panel.png')
    pg.click("#genBody .gstr:nth-child(1)")
    pg.fill('#genBody input[type=number]','140'); pg.press('#genBody input[type=number]','Tab')
    print('DURACIONES tras BPM',pg.evaluate("()=>[...document.querySelectorAll('#genBody .gstr')].map(l=>l.textContent.replace(/\\s+/g,' ').slice(0,48))"))
    pg.check('#genBody .chk input'); pg.click('#genBody .btnrow .pri'); pg.wait_for_timeout(400)
    print('PROYECTO',pg.evaluate("()=>({name:P.name,bpm:P.bpm,bars:P.bars,sig:P.sig,key:P.key,genre:P.genre,marks:P.marks.map(m=>m.name+'@'+m.bar).join(' '),tracks:P.tracks.map(t=>t.inst).join(',')})"))
    print('SELECT',pg.evaluate("()=>[...$('addInst').querySelectorAll('optgroup')].map(g=>g.label+': '+[...g.children].map(o=>o.textContent.trim()).join(' | '))"))
    print('ESCALAS',pg.evaluate("()=>[...$('kScale').options].map(o=>o.textContent.trim()).join(' | ')"))
    print('JSON genre',pg.evaluate("()=>{const o=JSON.parse(JSON.stringify(projectToJSON(P,{compact:true}))); const Q=projectFromJSON(o); return [o.genre,Q.genre,Q.marks.length]}"))
    # género externo por archivo
    ok=pg.evaluate("""async()=>{ const g={format:'demokit-genres',genres:[{id:'reggae',name:'Reggae',desc:'prueba',bpm:[60,90],keys:['Mayor'],inst:{perc:['kick','snare'],acomp:['sub'],mel:['xx_noexiste']},structures:[{name:'Base',sections:[['Intro',4],['Verso',8]]}]},{name:'Roto',structures:[]}]}; await ingest(new File([JSON.stringify(g)],'reggae.json')); return [...GENRES.keys()]; }""")
    print('GENEROS tras archivo',ok, '| guardado:',pg.evaluate("()=>localStorage.getItem('demokit-genres')&&JSON.parse(localStorage.getItem('demokit-genres')).length"))
    print('TOAST',pg.evaluate("()=>[...document.querySelectorAll('.toast')].map(t=>t.textContent).slice(-2)"))
    pg.reload(); pg.wait_for_timeout(900); print('GENEROS tras recargar',pg.evaluate("()=>[...GENRES.keys()]"))
    b.close()
srv.kill(); print('ERRORES',errs)
