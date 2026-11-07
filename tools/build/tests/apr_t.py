import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8795','-d','/home/claude/repo'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
Q="""()=>({skin:document.documentElement.dataset.skin,glassOff:document.getElementById('skinGlass').disabled,blur:getComputedStyle(document.querySelector('header')).backdropFilter,bg:getComputedStyle(document.getElementById('bgfx')).display,hdrBorderR:getComputedStyle(document.querySelector('header')).borderRadius,trans:getComputedStyle(document.querySelector('button')).transitionDuration})"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1300,'height':800}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8795/index.html'); pg.wait_for_timeout(1000)
    print('defecto',pg.evaluate(Q))
    pg.click('#bApr'); pg.wait_for_timeout(300); pg.screenshot(path='/tmp/apr_modal.png')
    pg.select_option('#aprSkin','classic'); pg.wait_for_timeout(300); print('clásico',pg.evaluate(Q)); pg.click('[data-close=aprModal]'); pg.wait_for_timeout(200); pg.screenshot(path='/tmp/apr_classic.png')
    pg.reload(); pg.wait_for_timeout(800); print('tras recargar',pg.evaluate(Q))
    pg.evaluate("dkApr.set('skin','glass')"); pg.click('#bApr'); pg.uncheck('#aprBlur'); pg.uncheck('#aprFx'); pg.uncheck('#aprAnim'); print('ligero',pg.evaluate(Q))
    pg.evaluate("dkApr.set('blur',true); dkApr.set('fx',true)"); pg.evaluate("window.__perfSlow()"); pg.wait_for_timeout(200); print('toast:',pg.evaluate("document.getElementById('toasts').textContent"))
    pg.click('.toast button.tact'); pg.wait_for_timeout(300); print('tras Apagar',pg.evaluate("[dkApr.get().blur,dkApr.get().fx]"))
    pg.click('#aprReset'); print('reset',pg.evaluate("JSON.stringify(dkApr.get())"))
    print('errores',errs); b.close()
srv.kill()
