#!/usr/bin/env python3
"""Genera las dos versiones del estudio desde src/ y actualiza la versión del service worker.

Uso (desde cualquier carpeta):   python3 tools/build/build.py
  Escribe en la raíz del repo (dos carpetas arriba de este archivo). Con DK_REPO=/otra/ruta escribe ahí.
   index.html            → en línea (iconos por archivo, manifest y service worker)
   demo_kit_studio.html  → sin conexión (iconos incrustados en base64, sin manifest ni SW)
   sw.js                 → solo cambia la línea `const VERSION = '…'`: 'dk-' + hash de index.html y de los
                           archivos que el propio sw.js precachea (SHELL). Así la app instalada se actualiza sola.
"""
import pathlib, os, re, hashlib

here = pathlib.Path(__file__).resolve().parent; d = here/'src'
repo = pathlib.Path(os.environ['DK_REPO']) if os.environ.get('DK_REPO') else here.parents[1]
repo.mkdir(parents=True, exist_ok=True)

online = ''.join([(d/'head.html').read_text(encoding='utf-8'), (d/'demo_kit.js').read_text(encoding='utf-8'), '\n',
                  (d/'engine.js').read_text(encoding='utf-8'), '\n', (d/'genres.js').read_text(encoding='utf-8'), '\n',
                  (d/'ui.js').read_text(encoding='utf-8'), (d/'tail.html').read_text(encoding='utf-8')])
D64 = 'data:image/png;base64,' + (d/'icon64.txt').read_text().strip(); D180 = 'data:image/png;base64,' + (d/'icon180.txt').read_text().strip()
offline = []; hit = 0
for line in online.split('\n'):
    if line.strip().startswith('<link rel="manifest"') or 'serviceWorker.register' in line: continue
    s = line.strip()
    if s.startswith('<link rel="icon"'): line = '<link rel="icon" type="image/png" href="%s">' % D64; hit += 1
    elif s.startswith('<link rel="apple-touch-icon"'): line = '<link rel="apple-touch-icon" href="%s">' % D180; hit += 1
    elif s.startswith('<div class="brand">') and 'src="assets/icon.png"' in line:
        line = line.replace('src="assets/icon.png"', 'src="%s"' % D64).replace("onerror=\"this.onerror=null;this.src='favicon.ico'\" ", ''); hit += 1
    offline.append(line)
assert hit == 3, 'se esperaban 3 reemplazos de iconos, hubo %d' % hit
offline = '\n'.join(offline)
for nombre, contenido in (('index.html', online), ('demo_kit_studio.html', offline)):
    with open(repo/nombre, 'w', encoding='utf-8', newline='\n') as f: f.write(contenido)      # siempre LF, también en Windows
print('en línea', len(online), '| sin conexión', len(offline), '| reemplazos', hit, '→', repo)

# ── service worker: versión automática ──────────────────────────────────────────────────────────
sw = repo/'sw.js'
if not sw.exists():
    print('AVISO: no hay sw.js en', repo, '→ no se actualizó la versión del service worker')
else:
    txt = sw.read_bytes().decode('utf-8')          # bytes: se conservan los saltos de línea del archivo
    m = re.search(r"const VERSION = '([^']*)';", txt)
    if not m: raise SystemExit("ERROR: sw.js no tiene la línea  const VERSION = '…';  — no se tocó nada")
    shell = re.search(r"const SHELL = \[(.*?)\];", txt, re.S)
    names = re.findall(r"'(\./[^']*)'", shell.group(1)) if shell else []
    h = hashlib.sha1(); h.update(b'index.html\0'); h.update(online.encode('utf-8'))
    missing = []
    for n in sorted(set(names)):
        if n in ('./', './index.html'): continue
        f = repo/n[2:]
        if f.is_file(): h.update(n.encode()+b'\0'); h.update(f.read_bytes())
        else: missing.append(n)
    ver = 'dk-' + h.hexdigest()[:8]
    if missing: print('AVISO: estos archivos del SHELL no están en', repo, '(no entran al hash):', ', '.join(missing))
    if m.group(1) != ver:
        sw.write_bytes((txt[:m.start(1)] + ver + txt[m.end(1):]).encode('utf-8'))
        print('sw.js VERSION', m.group(1), '→', ver)
    else: print('sw.js VERSION sin cambios (%s)' % ver)
