import subprocess,time
from playwright.sync_api import sync_playwright
new=open('/home/claude/work/kits/demo-kit-Evol.js').read(); old=open('/home/claude/work/kits/_evol_v11.js').read()
srv=subprocess.Popen(['python3','-m','http.server','8817','-d','/home/claude/work/pkg/demokit-build/out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
JS="""([nw,od])=>{ const N=()=>new Function(nw+'\\nreturn demoKit;')(), O=new Function(od+'\\nreturn demoKit;')(), out={};
 const song=(mk)=>{ const K=mk(44100,3,11); for(let i=0;i<8;i++){ K.kick(i*.3,1); K.hat(i*.3+.15,.6,i%4===3); } K.snare(.6,1); K.clap(1.2,.8); K.crash(1.5,.4);
   K.syn(K.mu,0,2,220,.15,0,{det:[-8,0,8],lp:t=>800+3000*Math.exp(-t*4)}); K.syn(K.mu,.5,1.5,110,.2,0,{det:[-5,5],w:1,lp:1500,res:3}); return K; };
 const stats=(K)=>{ let e=0,pk=0,nan=0,h=0; for(const b of [K.dr,K.mu]) for(const c of b) for(let i=0;i<c.length;i++){ const v=c[i]; if(!isFinite(v)) nan++; e+=v*v; pk=Math.max(pk,Math.abs(v)); if(i%5===0) h=(Math.imul(h,31)+Math.round(v*1e5))|0; } return {rms:Math.sqrt(e/(4*K.dr[0].length)),pk,nan,h}; };
 const base=stats(song(O)); const neutro=stats(song(N())); out.neutro_igual_a_v11=(base.h===neutro.h);
 for(const c of ['organico','digital']){ const f=N(); f.character=c; const a=stats(song(f)), b=stats(song(f)); out[c]={nan:a.nan,determinista:a.h===b.h,distinto_de_neutro:a.h!==neutro.h,rms_dB:+(20*Math.log10(a.rms/neutro.rms)).toFixed(2),pico_dB:+(20*Math.log10(a.pk/neutro.pk)).toFixed(2),check:kitCheck(f)}; }
 // dos notas iguales: orgánico varía, digital repite
 for(const c of ['organico','digital']){ const f=N(); f.character=c; const K=f(44100,2,5); K.kick(0,1); K.kick(1,1); const x=K.dr[0], a=x.slice(0,2000), b=x.slice(44100,46100); let d=0; for(let i=0;i<2000;i++) d=Math.max(d,Math.abs(a[i]-b[i])); out[c].dosBombos_difMax=+d.toFixed(3); }
 // una nota con {character} sin kit-level
 { const K=N()(44100,1,3); K.syn(K.mu,0,.5,220,.2,0,{character:'organico'}); K.syn(K.mu,.5,.4,220,.2,0,{character:'digital'}); let nn=0; for(const c of K.mu) for(const v of c) if(!isFinite(v)) nn++; out.porNota_nan=nn; }
 return out; }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.goto('http://localhost:8817/index.html'); pg.wait_for_timeout(1200)
    for k,v in pg.evaluate(JS,[new,old]).items(): print(k,v)
    print('errs',errs)
srv.terminate()
