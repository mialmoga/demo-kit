#!/usr/bin/env python3
"""Genera lib/demokit.js y lib/demokit.min.js en la raíz del repo, o en $DK_REPO (necesita Node: usa `npx terser`, se instala solo la primera vez)."""
import pathlib, subprocess, re, os, shutil
here = pathlib.Path(__file__).resolve().parent; d = here/'src'
repo = pathlib.Path(os.environ['DK_REPO']) if os.environ.get('DK_REPO') else here.parents[1]; out = repo/'lib'; out.mkdir(parents=True, exist_ok=True)
eng = (d/'engine.js').read_text()
eng = re.sub(r'//#CONVERTER-BEGIN\n.*?//#CONVERTER-END\n','',eng,flags=re.S)   # el convertidor demo→proyecto es del estudio; la librería no lo usa
eng = eng.replace('//#ENGINE'+'-BEGIN\n','').replace('//#ENGINE'+'-END\n','')
src = ''.join(['/* Demo Kit · librería v1.2 — https://github.com/mialmoga/demo-kit */\n;(function(){\n', (d/'demo_kit.js').read_text(), '\n', eng, '\n', (d/'player.js').read_text(), '\n})();\n'])
(out/'demokit.js').write_text(src)
tz = shutil.which('terser') or None
cmd = ([tz] if tz else ['npx','--yes','terser']) + [str(out/'demokit.js'), '-c', '-m', '--comments', '/Demo Kit/', '-o', str(out/'demokit.min.js')]
subprocess.run(cmd, check=True)
print('demokit.js', (out/'demokit.js').stat().st_size, '| demokit.min.js', (out/'demokit.min.js').stat().st_size)
