import subprocess,time,sys
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8794','-d','/home/claude/repo'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1300,'height':800}); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8794/index.html'); pg.wait_for_timeout(1200)
    pg.evaluate("selectTrack(3)"); pg.wait_for_timeout(400); pg.screenshot(path=sys.argv[1]); b.close()
srv.kill()
