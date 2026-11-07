import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8789','-d','/home/claude/repo'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
H="o=>{ const u=new Uint32Array(o.L.buffer,o.L.byteOffset,o.L.length); let h=2166136261; for(let i=0;i<u.length;i++) h=Math.imul(h^u[i],16777619); return h>>>0; }"
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept()); pg.goto('http://localhost:8789/index.html'); pg.wait_for_timeout(1000)
    j=pg.evaluate("""async H=>{ P.tracks.forEach((t,i)=>{ t.fx=t.fx||{}; t.fx.eq={on:true,low:3,mid:-2,midF:800,midQ:1,high:2}; if(i%2===0) t.fx.comp={on:true,thr:-20,ratio:4,atk:10,rel:120,knee:6,makeup:2,mix:.8}; }); touch(); const o=await renderProject(P,()=>{}); return {h:eval(H)(o),json:JSON.stringify(projectToJSON(P,{compact:true}))}; }""",H)
    print('estudio',j['h'])
    pg2=b.new_page(); pg2.on('pageerror',lambda e:errs.append(str(e))); pg2.goto('http://localhost:8789/ejemplo/libreria.html'); pg2.wait_for_timeout(800)
    pg2.add_script_tag(url='http://localhost:8789/lib/demokit.min.js'); pg2.wait_for_timeout(500)
    r=pg2.evaluate("async ([t,H])=>{ const s=await DemoKit.load(t,{cache:false}); return eval(H)(s); }",[j['json'],H]); print('librería',r,'| idéntico:',r==j['h'])
    print(errs); b.close()
srv.kill()
