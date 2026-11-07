import subprocess,time
from playwright.sync_api import sync_playwright
A='/mnt/user-data/attachments/1810152a-e797-521f-ab5c-75496ee7a0a9/'; K='/home/claude/work/kits/'
files={'incluido (src/demo_kit.js)':'/home/claude/work/pkg/demokit-build/src/demo_kit.js','Ultra.js 1ª':A+'13b08b4b-demo-kit-Ultra.js','Pro.js 1ª':A+'3466d575-demo-kit-Pro.js','ultra-SAFE orig':A+'d74058eb-demo-kit-ultra-SAFE.js','Pro_SAFE orig':A+'bc073f2f-demo-kit-Pro_SAFE.js','Ultra_fix':K+'demo-kit-Ultra_fix.js','Pro_fix':K+'demo-kit-Pro_fix.js','ultra-SAFE_fix':K+'demo-kit-ultra-SAFE_fix.js','Pro_SAFE_fix':K+'demo-kit-Pro_SAFE_fix.js'}
srv=subprocess.Popen(['python3','-m','http.server','8807','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.goto('http://localhost:8807/index.html'); pg.wait_for_timeout(1000)
    for k,f in files.items():
        src=open(f).read(); r=pg.evaluate("src=>kitCheck(new Function(src+'\\nreturn demoKit;')())",src)
        print('\n==',k,'->','SIN PROBLEMAS' if not r else ''); [print('   •',x) for x in r]
    # el confirm aparece al cargar de verdad y se puede cancelar
    msgs=[]; pg.on('dialog',lambda d:(msgs.append(d.message[:90]),d.dismiss()))
    pg.evaluate("src=>ingest(new File([src],'Ultra.js'))",open(A+'13b08b4b-demo-kit-Ultra.js').read()); pg.wait_for_timeout(500)
    print('\nDIÁLOGO al cargar Ultra.js:',msgs[:1],'| kit activo sigue siendo el incluido:',pg.evaluate("()=>Kit.make===demoKit || typeof kitName==='undefined' || kitName===null || kitName===''"))
    b.close()
srv.kill(); print('ERRORES',errs)
