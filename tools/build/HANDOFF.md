# Actualización 2026-11-07 (tarde) · nueva ubicación de la build
Las fuentes y los scripts viven ahora en el repo: **`tools/build/`** (ver `LEEME.md` ahí). Uso: `python3 tools/build/build.py` y `python3 tools/build/build_lib.py`; escriben en la raíz del repo (o en `$DK_REPO`). `build.py` también reescribe `const VERSION` de `sw.js` con un hash (ya no se sube a mano). Donde este documento diga `python3 build.py` o `out/`, léase esto. El panel «En el repositorio» ya no mira `proyectos/` (solo `projects/` y `project_examples/`). **Ojo:** el `lib/demokit.js` del repo está desactualizado respecto a `src/` (ver `PENDIENTES.md`, punto 25).

---

# Actualización 2026-11-07 (léela primero)

Esta sección va por delante del traspaso del 3 de noviembre, que sigue abajo y es válido en lo demás. La lista de trabajo está en `PENDIENTES.md` (también en el Project de Claude).

## Qué cambió desde el 3 de noviembre
- **Contrato de kit ampliado.** `demoKit.info = {id,name,version,stage,characters:[...]}` y `demoKit.character` (se pone antes de crear el kit; neutro = idéntico bit a bit al kit anterior). En `engine.js`: `kitChars()`, `kitInfo()`, `setKitChar()`. El proyecto guarda `engine:{id,v,c?}` solo si el kit activo tiene `info`; al abrir un proyecto con otro carácter, la interfaz pregunta (`loadProject` en `ui.js`). Selector «Carácter del kit» en `head.html` (`#kitChar`, `#kitCharSel`), etiquetas Neutro/Orgánico/Digital.
- **Kit Evol 1.2.0** (`kits/bootleg/demo-kit-Evol.js`): osciladores PolyBLEP, filtro TPT-SVF, percusión en capas, carácter orgánico/digital. Pruebas: `tests/test_evol.js` (Node) y `tests/evol_*.py`.
- **Panel del repositorio:** el grupo de kits solo lista `kits/bootleg` y excluye `make_kit*` y `test_*` (regex en `REPO_GROUPS`, `ui.js`).
- **Plugin `guitarra_acompanante.js`:** Karplus-Strong con retardo fraccionario, intérpretes, círculos y patrones. Una nota larga es un pasaje. Supone tempo constante dentro de una nota. Pruebas: `tests/guit_*.py`.
- **Plugin `automata_vocal.js`:** presets «El Brayan» y su familia.
- **Géneros:** `genres/latinos.json` y `electronica.json` junto a `reggae.json`. Marcadores de sección entran y salen como marcadores MIDI.
- **Regresión corregida (mía):** `projectFromJSON` leía `o.engine.c` con `o.engine` indefinido; ahora el bloque va entero dentro de `if(o.engine&&typeof o.engine.id==='string'){…}`. Atrapó el usuario. Motivo de la propuesta de prueba de humo (P2).

- **Arte del código:** `tools/art_code.js` (necesita `npm i acorn`). Reescribe cada `<script>` con una silueta ondulante; verifica que el AST sea idéntico y, si no, deja el script intacto. Ver `PENDIENTES.md` punto 33.

## Método de pruebas que funcionó
- Playwright en Python + `python3 -m http.server -d out` en un puerto distinto por prueba. Aceptar los diálogos con `pg.on('dialog', lambda d: d.accept())`.
- Cargar un kit: `ingest(new File([src],'demo-kit-Evol.js'))`. Cargar un proyecto: `loadProject(projectFromJSON(JSON.parse(texto)))`. Renderizar: `await renderProject(P)` devuelve `{L,R}` y la frecuencia es `SR`.
- **No devolver los Float32 completos con `Array.from`** (revienta la memoria con canciones de más de unos segundos). Calcular las métricas dentro de la página y sacar el audio en trozos de Int16 en base64 (ver `tests/t_song.py` y `song/t_fusion.py`).
- **Al comparar hashes de audio entre dos páginas, fija el `id` de cada pista** (`t.id='fijo0'`): `newTrack` lo genera al azar y cambia la semilla (y el audio).
- La semilla de cada pista sale de su `id`: una pista nueva no suena idéntica a otra con las mismas notas. Para comprobar determinismo, repetir sobre el mismo proyecto.
- Los scripts apuntan a rutas de mi contenedor (`/home/claude/work/...`): ajústalas.

## Las dos rolas de la ronda (generadores en `song/`)
- `song/make_song.py` genera «Sueños sin dientes (versión Ámbar)» desde cero: acordes alineados a compás, capas por sección, final en La mayor, JSON legible (un compás por línea).
- `song/fusion.py` fusiona «la rotita» y «voice» con los archivos originales de Brujo como entrada (los lee desde `/mnt/user-data/attachments/`): una sola línea de voz sin notas sueltas, tiempo real conservado (40 → 82 bpm, factor 2.05), ajuste a la escala blanca, subida con energía/cansancio automatizados, y mezcla con medición voz−música.
- Hallazgos útiles de los originales (ver `PENDIENTES.md`, puntos 6–12): cambiar el BPM no mueve notas, proyectos con largo muy superior al contenido, notas que se pisan en voz monofónica, plugins embebidos con versión vieja.
- **Aviso de método:** antes de diagnosticar un proyecto, lee los parámetros del instrumento (el `tono` de la voz desplaza las notas), no solo las notas.

## Lo que sigue siendo cierto de Brujo
Español de México, tono cálido; plan antes de construir salvo que diga «tú decides»; pruebas puntuales; honestidad con lo no probado; parte siempre de su `index.html`/README/piel. Cuando sube cambios: `sw.js` con `VERSION` nueva (pregúntale la actual; la propuesta P0 es automatizarlo en `build.py`).

---

# Demo Kit · traspaso a un hilo nuevo

Para quien tome el relevo: léelo entero, luego revisa la memoria del usuario (`/areas/estudio-demokit.md`, tiene la bitácora larga). Brujo (el usuario, español de México, tono cálido y bromista) lleva con Ámbar (Claude) todo el proyecto. Aquí ya se cumplieron todas las misiones planeadas y varias que surgieron en el camino; lo que sigue es pulido y ideas.

## Cómo trabaja Brujo (importante)
- Responde siempre en **español**, trato cercano; él bromea («jaja», «:)») y se agradece que le sigas el tono sin exagerar.
- **Antes de construir algo nuevo: explica el plan y espera su OK.** Si ya aprobó («dale», «va»), no repitas el plan. Un paso por turno suele gustarle.
- **Nada de suites de tests enormes** (gastan tokens). Pruebas puntuales de las piezas delicadas sí: medir, no suponer.
- Prefiere **describir qué falla y que tú lo arregles**. Él edita a mano su `README.md`, `ejemplo/libreria.html`, sus estilos (piel de cristal) y su `site.webmanifest`/PNG de iconos: **parte siempre de su versión** y no pises esos archivos; dale fragmentos de texto para el README.
- Sé honesto cuando algo no se pudo probar (por ejemplo, en un Android real). Reconoce errores sin dramatismo.
- Entrega con `SendUserFile` solo lo que cambió, con una línea de contexto; resume en pocas frases qué cambió y qué se probó.

## Qué es el proyecto
**Demo Kit** («Make sound from code»): estudio musical de **un solo HTML** (piano roll, pistas, plugins, efectos, automatización, master, exportación WAV/stems/MIDI/demo .js) sobre un kit de síntesis procedural (`demo_kit.js`). Repo `github.com/mialmoga/demo-kit`, Pages: https://mialmoga.github.io/demo-kit/. Además hay una **librería** sin interfaz (`lib/demokit.js` y `.min.js`, v1.4.0) que reproduce `.demokit.json` y demos `.js`.
Estructura del repo: `index.html` (en línea, PWA), `demo_kit_studio.html` (sin conexión, iconos en base64), `lib/`, `kits/` (demo_kit.js, demo_kit_comentado.js, make_kit.js, REFERENCIA.md), `plugins/`, `demos/`, `projects/`, `ejemplo/`, `assets/`, `favicon.ico`, `site.webmanifest`, `sw.js`, `.github/` (workflow que genera los `manifest.json` de carpetas), `README.md`.

## Este paquete
```
src/head.html      <head>, CSS (incluye SU piel de cristal en <style id="skinGlass">), cabecera, modales
src/demo_kit.js    kit de síntesis (se incrusta tal cual)
src/engine.js      motor: instrumentos, render por pista + caché de stems, fx, automatización, mezcla, serialización, WAV/MIDI, convertidor
src/ui.js          interfaz (piano roll en canvas, pistas, inspector, plugins, panel ⚙ apariencia…)
src/tail.html      cierre del script + fondo vivo (aurora/partículas, canvas #bgfx)
src/player.js      reproductor de la librería (solo lib)
src/icon64.txt, icon180.txt   base64 de los iconos para la versión sin conexión (icon180 = apple-touch con fondo sólido)
build.py           → out/index.html y out/demo_kit_studio.html (o $DK_REPO)
build_lib.py       → out/lib/demokit.js y demokit.min.js (usa `npx terser`)
tests/             scripts Playwright/Node que se usaron (ver abajo)
song/              generador de «Marea de ceniza» (demo ambicioso con todas las capacidades) y verificaciones
```
Uso: `python3 build.py && python3 build_lib.py` (necesita Python 3 y Node; Playwright+Chromium para los tests). Con `DK_REPO=/ruta/al/repo` escribe directo ahí. Se verificó que este paquete reproduce **byte a byte** los archivos actuales del repo.
Marcadores en engine.js: `//#CONVERTER-BEGIN/END` (lo que la lib no incluye) y `//#ENGINE-BEGIN/END`.
Ojo: si Brujo te pasa un `index.html` suyo con cambios, haz un **merge a tres bandas** (`git merge-file`: su archivo / la build base / tu build) y vuelve a partir `head.html`, `ui.js` y `tail.html` desde el resultado; así se hizo con su piel de cristal.
Al cambiar `index.html` o iconos, **sube `VERSION` en `sw.js`** (ahora `dk-v5`) para que la app instalada se actualice. El manifest usa color `#4a5578` (suyo). Los PNG de iconos y `site.webmanifest` los gestiona él.

## Modelo de datos (resumen)
Proyecto `P={name,bpm,bars,sig,sigs,tempo,seed,sc,master,tracks,clips,key?}`. Pista `{id,name,inst,params,vol,pan,mute,solo,ducked,sc,fx?,auto?,alv?,bakeOf?,notes:[{b,l,m,v,pan,o,w}]}`. Formato compacto: notas como `[b,l,m,v,pan,o,w]`.
- `tr.fx={eq:{on,low,mid,midF,midQ,high},comp:{on,thr,ratio,atk,rel,knee,makeup,mix},delay:{on,time,fb,tone,mix,pp},reverb:{on,size,damp,mix,pre}}` (defaults en `FX_DEF`). Orden: EQ → compresor → delay → reverb, sobre los stems ya renderizados (`fxStems`/`applyFx`); la clave de caché `fxKey` incluye las curvas.
- `tr.auto`: claves `'vol'`, `'pan'`, `'cut'`, `'p:<param>'` (parámetro del instrumento, escalonado por nota, 8/16 niveles; «hornear» para barrido continuo) y `'fx:<grupo>.<param>'` (9 curvas continuas: eq.low/mid/midF/high, comp.thr/makeup/mix, delay.mix, reverb.mix; `FX_LANES`). Puntos `{b,v}`; `autoSampler(pts,beat,tm)` es con estado (índices de muestra ascendentes). Las curvas fx solo actúan con el efecto encendido.
- Mapa de tempo `tmap(P)` (`sec(b)`, `constant`) y de compases `meter(P)`; el «pulso» es la negra.
- Legato de voz: el motor pasa a cada nota `n.link` (hueco/tono de vecinas); el plugin `automata_vocal.js` tiene slider «Legato».
- Plugins: `registerInstrument`, confirmación de seguridad antes de ejecutar código ajeno; plugins incluidos en el proyecto solo suenan en la lib con `allowPlugins:true`.

## Apariencia (última entrega)
Panel **⚙ Apariencia y rendimiento**: tema *Cristal* (defecto) o *Clásico* (la hoja `#skinGlass` se desactiva), interruptores de desenfoque (`data-blur`), fondo animado (`data-fx`, hook `window.__bgfx.enable`), animaciones (`data-anim`), aviso de lentitud (`window.__perfSlow`), modo ligero y restablecer. Preferencias en `localStorage['dk-apr']` (`window.dkApr`). Medido: repintar el piano roll cuesta ~0.3 ms/fotograma (0.85 ms con 3 000 notas); el espectro con `mix-blend-mode:screen`, el desenfoque y el fondo son lo que más pesa en móvil (sin medir en un teléfono real).

## Cómo se probó (método)
Playwright headless + `python3 -m http.server -d <repo>` en puertos distintos (8777–8796 usados); en las pruebas hay que aceptar los diálogos de confianza (`pg.on('dialog', lambda d: d.accept())`). Comparaciones por hash de muestras (identidad antes/después), mediciones con tonos (ganancia del EQ, curva del compresor), y la lib contra el estudio (`tests/fx_lib.py`). Los scripts apuntan a `/home/claude/repo` y `/tmp/srv`: ajusta rutas. Cosas que ya mordieron: `id` duplicado (`sDel` → `sDelSig`), comentarios `//` que se tragan la línea siguiente, `applyFx` devuelve copias si hay EQ/compresor, no usar spread con arreglos de 200k elementos, variable `mx` repetida en `compFx` (arreglada).

## Estado: todo entregado
Estudio completo (piano roll, instrumentos, sidechain, fx por pista con EQ/compresor, automatización de vol/pan/filtro/parámetros/efectos, hornear, escalas/acordes, teclado en pantalla, tempo y compás variables, MIDI, metrónomo, atajos, letras sobre notas y voz con legato, kit propio persistente, carpetas del repo, PWA instalable y offline, undo global, exportación compacta y demo .js), librería v1.4 con caché IndexedDB, demo «Marea de ceniza» (`song/`), README revisado, piel de cristal + temas + panel de rendimiento.

## Ideas abiertas (nada aprobado todavía; pregunta antes)
- Más preajustes de efectos (hoy: Voz, Bajo, Bombo, Pegamento suave, Brillo).
- Pulir las letras en un Android real (teclado, Espacio entre notas); no hay prueba en dispositivo.
- Interruptor para el espectro del piano roll si se confirma que pesa en móvil.
- Automatizar más parámetros de efectos (razón, ataque, tiempo de delay…) — hoy solo los 9 listados.
- Mantener README al día (Brujo lo edita; dale texto).
