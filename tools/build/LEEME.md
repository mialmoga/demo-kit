# tools/build · fuentes y build del estudio

El estudio (`index.html` y `demo_kit_studio.html`) y la librería (`lib/`) **se generan** desde esta carpeta. Si los editas a mano en el repo, el siguiente build los pisa: haz el cambio en `src/` (o pídeselo a Claude).

## Uso
```
python3 tools/build/build.py        # index.html, demo_kit_studio.html y la versión de sw.js → raíz del repo
python3 tools/build/build_lib.py    # lib/demokit.js y lib/demokit.min.js (necesita Node; usa npx terser)
```
Funcionan desde cualquier carpeta. Con `DK_REPO=/otra/ruta` escriben ahí en vez de la raíz del repo. Solo hace falta Python 3 (y Node para la librería).

## sw.js: la versión ya no se sube a mano
`build.py` reescribe únicamente la línea `const VERSION = '…'` de `sw.js` con `dk-` + un hash de `index.html` y de los archivos que el propio `sw.js` lista en `SHELL` (favicon, manifest, iconos). Si cambia el HTML o un icono, la versión cambia sola y la app instalada se actualiza. Si nada cambió, no toca el archivo. Si `sw.js` no tiene esa línea, la build se detiene con un error.
Ojo: si corres la build fuera del repo (sin los iconos al lado), avisa qué archivos del `SHELL` no encontró y la versión sale distinta de la que saldría en el repo. Es inofensivo (la app se actualiza una vez de más), pero conviene correrla en el repo.

## Qué hay aquí
```
src/head.html      <head>, CSS (con la piel de cristal), cabecera, modales
src/demo_kit.js    kit de síntesis (se incrusta tal cual)
src/engine.js      motor (marcadores //#CONVERTER-BEGIN/END y //#ENGINE-BEGIN/END para la librería)
src/genres.js      géneros base
src/ui.js          interfaz
src/tail.html      cierre del script + fondo vivo
src/player.js      reproductor de la librería (solo lib)
src/icon64.txt, icon180.txt   iconos en base64 para la versión sin conexión
build.py, build_lib.py
tests/, song/      scripts de prueba y generador de «Marea de ceniza» (ver abajo)
```
`../art_code.js` (arte del código) queda en `tools/`.

## Cuando subes cambios a mano
Haz un merge a tres bandas con `git merge-file` (tu archivo / la build base / la build nueva) y vuelve a partir `head.html`, `ui.js` y `tail.html` desde el resultado. Después de pegar tus cambios en `src/`, corre `build.py` y comprueba con `cmp` que la salida es tu archivo.

## tests/ y song/
Son scripts sueltos (Playwright, Node, Python) que usaron las sesiones anteriores. **Algunas rutas siguen apuntando al contenedor donde se escribieron** (`/home/claude/work/...`, `/home/claude/repo/...`, `/tmp/srv`) y varios usan archivos que no están en el repo (kits de prueba, adjuntos). Ajusta las rutas antes de correrlos. `build.py` y `build_lib.py` sí son independientes de la ubicación.
