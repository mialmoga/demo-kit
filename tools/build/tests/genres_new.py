import subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8825','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
fs={f:open('/home/claude/work/genres/'+f).read() for f in ('latinos.json','electronica.json')}
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept())
    pg.goto('http://localhost:8825/index.html'); pg.wait_for_timeout(1000)
    a=pg.evaluate("()=>GENRES.size")
    for n,t in fs.items(): pg.evaluate("([n,t])=>ingest(new File([t],n))",[n,t]); pg.wait_for_timeout(300)
    print('géneros antes/después:',a,pg.evaluate("()=>GENRES.size"),pg.evaluate("()=>[...GENRES.values()].map(g=>g.name)"),errs)
srv.terminate()
