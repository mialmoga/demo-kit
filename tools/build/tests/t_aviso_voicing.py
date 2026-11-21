# Prueba del aviso de patrón inválido (guitarra v1.5) y del reinicio del voicing por vuelta.
# Uso: python3 -I t_aviso_voicing.py <carpeta con index.html> <plugins/guitarra_acompanante.js>   (Playwright + Chromium)
import asyncio, sys, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8811','-d',sys.argv[1]],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
src=open(sys.argv[2],encoding='utf-8').read()
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(); pg=await b.new_page()
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:asyncio.ensure_future(d.accept()))
        await pg.goto('http://localhost:8811/index.html'); await pg.wait_for_timeout(1200)
        # 1) voicing: progToNotes con y sin cycle (progresión de 2 compases repetida en 8)
        r=await pg.evaluate('''()=>{ const P=newProject?newProject():null; return typeof progToNotes }''')
        print('progToNotes',r)
        res=await pg.evaluate('''()=>{ P.bars=8; P.prog={text:'Cmaj7 | Am7 | Dm7 | G7'}; 
          const a=progToNotes(P,{voicing:'suave',cycle:false}), c=progToNotes(P,{voicing:'suave',cycle:true});
          const key=o=>o.chords.map(x=>x.ms.join(',')).join(' / ');
          const n=progChords(P).cycleBars;
          return {cycleBars:n, nChords:a.chords.length, first_eq_a:key({chords:a.chords.slice(0,4)}), second_a:key({chords:a.chords.slice(4,8)}),
                  first_c:key({chords:c.chords.slice(0,4)}), second_c:key({chords:c.chords.slice(4,8)}), same_default: key(progToNotes(P,{voicing:'suave'}))===key(a)} }''')
        for k,v in res.items(): print(k,v)
        print('cycle on: cycle1==cycle0 ->', res['first_c']==res['second_c'], '| cycle off: equal ->', res['first_eq_a']==res['second_a'])
        # 2) plugin con aviso
        out=await pg.evaluate('''(src)=>{ (0,eval)(src); const inst=INSTRUMENTS['guitarra_acomp']; const d=inst.params.find(x=>x.k==='patronTxt');
          const t=(p)=>d.check(p);
          return [inst.version, t({patron:'custom',patronTxt:''}), t({patron:'abajo',patronTxt:'D U'}), t({patron:'custom',patronTxt:'D U zz 9 @nada'}), t({patron:'custom',patronTxt:'6- 3- 2- 1- ; D D- U- | @bossa'}), t({patron:'custom',patronTxt:'xx yy'})] }''', src)
        for o in out: print(repr(o))
        # 3) UI: añadir pista con el plugin, poner texto malo y ver el aviso
        ui=await pg.evaluate('''()=>{ const tr=newTrack('guitarra_acomp','Guitarra'); P.tracks.push(tr); sel=P.tracks.length-1; tr.params.patron='custom'; renderTracks(); renderInspector(); 
            const w=[...document.querySelectorAll('.pwarn')]; return w.length }''')
        print('pwarn nodes',ui)
        inp=pg.locator('input[type=text]').filter(has=None)
        # buscar el input de texto de la fila del patrón
        handle=await pg.evaluate_handle('''()=>[...document.querySelectorAll('.row')].find(r=>r.querySelector('label')&&r.querySelector('label').textContent.startsWith('Patrón escrito')).querySelector('input')''')
        await handle.as_element().fill('D U qq 7')
        await pg.wait_for_timeout(200)
        print('aviso visible:', await pg.evaluate('''()=>document.querySelector('.pwarn').textContent'''))
        await handle.as_element().fill('D U')
        print('aviso tras corregir:', repr(await pg.evaluate('''()=>document.querySelector('.pwarn').textContent''')))
        # 4) casilla
        print('cCyc', await pg.evaluate('''()=>({exists:!!document.getElementById('cCyc'),checked:document.getElementById('cCyc').checked})'''))
        print('errores de página:',errs)
        await b.close()
asyncio.run(main()); srv.terminate()
