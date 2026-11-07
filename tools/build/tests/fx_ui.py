import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8788','-d','/home/claude/repo'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':900}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8788/index.html'); pg.wait_for_timeout(1000)
    print('bloques:',pg.evaluate("[...document.querySelectorAll('.fxh')].map(e=>e.textContent.trim())"))
    # preset Bajo en la pista 4 (subfall) del proyecto inicial
    pg.evaluate("selectTrack(3)"); pg.wait_for_timeout(200)
    pg.evaluate("[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='Bajo')).value='Bajo'; [...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='Bajo')).dispatchEvent(new Event('change'))"); pg.wait_for_timeout(300)
    print('fx tras preajuste:',pg.evaluate("JSON.stringify({eq:P.tracks[3].fx.eq,comp:P.tracks[3].fx.comp})"))
    print('sliders EQ/comp visibles:',pg.evaluate("[...document.querySelectorAll('.row label')].map(l=>l.textContent).filter(t=>/Graves \\(120|Medios|Umbral|Razón|Ataque|Liberación|Codo|Compensación|paralelo/.test(t)).length"))
    r=pg.evaluate("""async()=>{ const a=await renderProject(P,()=>{}); updateGR(); const c=stemCache.get(P.tracks[3].id); return {gr:c.gr,txt:document.getElementById('compGR').textContent}; }""")
    print('render:',r)
    print('stems:',pg.evaluate("""async()=>{ const o=await renderProject(P,()=>{}); return Object.keys(stemCache).length||stemCache.size; }"""))
    # deshacer el preajuste
    pg.evaluate("undo()"); print('tras deshacer:',pg.evaluate("JSON.stringify(P.tracks[3].fx||0)"))
    pg.evaluate("redo()")
    # guardar y cargar
    print('roundtrip compacto:',pg.evaluate("JSON.stringify(projectFromJSON(JSON.parse(JSON.stringify(projectToJSON(P,{compact:true})))).tracks[3].fx.comp)"))
    pg.screenshot(path='/tmp/fx_ui.png'); print('errores',errs); b.close()
srv.kill()
