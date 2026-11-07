import subprocess,time,json
from playwright.sync_api import sync_playwright
src=open('/home/claude/work/kits/demo-kit-Evol.js').read()
srv=subprocess.Popen(['python3','-m','http.server','8818','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
H="""async()=>{ loadProject(newProject('t',120,2)); P.tracks=[]; const t=newTrack('sinte'); t.notes=[{b:0,l:2,m:60,v:1}]; P.tracks.push(t); const o=await renderProject(P); let h=0; for(let i=0;i<o.L.length;i+=11) h=(Math.imul(h,31)+Math.round(o.L[i]*1e5))|0; return h; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':900}); errs=[]; dl=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    def on_dialog(d): dl.append(d.message[:140]); d.accept()
    pg.on('dialog',on_dialog)
    pg.goto('http://localhost:8818/index.html'); pg.wait_for_timeout(1200)
    print('1 kit incluido → selector oculto:',pg.evaluate("()=>{ renderLib(); return $('kitChar').hidden; }"))
    pg.evaluate("src=>ingest(new File([src],'demo-kit-Evol.js'))",src); pg.wait_for_timeout(800)
    print('2 Evol cargado → selector visible:',pg.evaluate("()=>!$('kitChar').hidden"),'| opciones:',pg.evaluate("()=>[...$('kitCharSel').options].map(o=>o.text)"))
    h0=pg.evaluate(H)
    pg.evaluate("v=>{ const s=$('kitCharSel'); s.value=v; s.onchange({target:s}); }",'organico'); pg.wait_for_timeout(300); h1=pg.evaluate(H)
    pg.evaluate("v=>{ const s=$('kitCharSel'); s.value=v; s.onchange({target:s}); }",'digital'); pg.wait_for_timeout(300); h2=pg.evaluate(H)
    print('3 render distinto por carácter:',len({h0,h1,h2})==3,'| car. activo:',pg.evaluate("()=>Kit.make.character"))
    pg.evaluate("v=>{ const s=$('kitCharSel'); s.value=v; s.onchange({target:s}); }",'organico'); pg.wait_for_timeout(200)
    j=pg.evaluate("()=>JSON.stringify(projectToJSON(P).engine)"); print('4 proyecto guardado lleva:',j)
    # abrir ese proyecto con el carácter en neutro → pregunta
    pg.evaluate("()=>{ window.__j=JSON.stringify(projectToJSON(P)); }"); pg.evaluate("v=>{ const s=$('kitCharSel'); s.value=v; s.onchange({target:s}); }",''); dl.clear()
    pg.evaluate("()=>loadProject(projectFromJSON(JSON.parse(window.__j)))"); pg.wait_for_timeout(300)
    print('5 pregunta al abrir:',dl,'| car. tras aceptar:',pg.evaluate("()=>Kit.make.character"),'| select:',pg.evaluate("()=>$('kitCharSel').value"))
    # persistencia tras recargar
    pg.reload(); pg.wait_for_timeout(1500)
    print('6 tras recargar: kit',pg.evaluate("()=>kitName"),'| car:',pg.evaluate("()=>Kit.make.character"),'| select:',pg.evaluate("()=>$('kitCharSel').value"))
    # volver al incluido
    pg.evaluate("()=>$('kitReset').click()"); pg.wait_for_timeout(300)
    print('7 kit incluido otra vez → oculto:',pg.evaluate("()=>$('kitChar').hidden"),'| engine en proyecto nuevo:',pg.evaluate("()=>projectToJSON(newProject('x',120,2)).engine===undefined"))
    pg.evaluate("()=>loadProject(projectFromJSON(JSON.parse(window.__j)||{}))") if False else None
    print('errores',errs)
srv.terminate()
