<div align="center">

![Demo Kit — Make sound from code](assets/banner.png)

# Demo Kit

**Make sound from code.**
Un pequeño estudio de síntesis procedural que corre en el navegador: piano roll, capas, instrumentos parametrizables, automatización, progresiones de acordes, plugins (una voz que canta la letra que escribas sobre las notas, una guitarra que acompaña, un instrumento «supremo» para sonidos mecánicos y de agua, una batería de pads…) y exportación a WAV, stems y MIDI, todo sobre `demo_kit.js`.

### 🎹 [Abrir Demo Kit en el navegador](https://mialmoga.github.io/demo-kit/)

![Demo Kit en acción](assets/screenshoot.png)

</div>

---

## Qué es

Demo Kit es un DAW de juguete (pero poderoso) contenido en **un solo archivo HTML**, sin dependencias, sin servidor, sin archivos de audio. Todo el sonido se calcula muestra a muestra en JavaScript con el kit de síntesis `demo_kit.js` (que va incrustado), el mismo con el que están hechas las demos de la carpeta `demos/`.

Se pueden componer piezas desde cero, o **cargar una demo y convertirla en un proyecto editable** (pistas, notas y parámetros) para ver cómo está construida. También funciona en el teléfono (hay una interfaz pensada para pantallas chicas) y se puede **instalar como app** desde el navegador (`site.webmanifest` y `sw.js`, solo en la versión en línea): una vez instalada o visitada, abre también sin conexión con lo que ya hayas cargado.

## Uso rápido

1. Abre la versión en línea: **<https://mialmoga.github.io/demo-kit/>**. O descarga `demo_kit_studio.html` y ábrelo con doble clic (no necesita servidor, y lleva sus iconos incrustados; la versión en línea `index.html` los toma de `favicon.ico` y `assets/`, y sin ellos funciona igual pero sin iconos).
2. «Demos y plugins» → «Cargar proyecto de ejemplo», y dale **Play**.
3. O arrastra algún demo de la carpeta demos/ a la ventana y pulsa **«✎ Convertir en editable»**. También puedes abrir lo que hay en las carpetas del repositorio desde la sección **En el repositorio** (ver más abajo).
4. Pulsa **?** (o `F1`) para ver la hoja de atajos y gestos.

| Archivo | Demo | Editable |
|---|---|---|
| `electronic_rush.js` | ⚡ Electronic Rush - Ws | sí |
| `the_void_MK.js` | 🕳️ The Void - Ws | sí |
| `cotton_sugar_MK.js` | 🍬 Cotton Sugar - Ws | sí |
| `event_horizon.js` | 🌑 Event Horizon - Ws | sí |
| `marshmallow_sky.js` | ☁️ Marshmallow Sky - Ws | sí |
| `dark_matter.js` | 🌌 Dark Matter - Ws | sí |
| `yo_soy_nan.js` | ♾️ You Soy NaN (by Éter) | sí |
| `la_casa_que_respira.js` | 👻 La casa que respira (by Ámbar) | sí |
| `kinetic_drift.js` | ⚙️ Kinetic Drift (by Éter) | sí |
| `neon_tidal.js` | 🌊 Neon Tidal (by Velvet) | sí |
| `phantom_minds_ear.js` | 👂 Phantom Mind's Ear (by Velvet) | sí |
| `marea_de_ceniza.js` | 🌀 Marea de Ceniza (by Ámbar) | sí |

> Todas las marcadas - Ws forman parte del proyecto Wavesurfer  **<https://mialmoga.github.io/Wavesurfer/>**
>
> La carpeta `demos/` trae también `ejemplo_minimo` y `ejemplo_metrico`; la autoría de cada demo está en [Créditos](#créditos).

**Aviso de seguridad al ejecutar demos:** la primera vez que reproduces o conviertes una demo `.js` que no viene del repositorio, el estudio te pregunta antes de ejecutarla (es código). Recuerda tu respuesta por contenido, así que no vuelve a preguntar por la misma demo.

> El audio solo se genera cuando pulsas Play o WAV: Demo Kit renderiza el proyecto completo y luego lo reproduce. Si cambias algo, el indicador de la cabecera muestra «sin renderizar» y el siguiente Play vuelve a renderizar.

## Funciones

- **Piano roll** con rejilla (1/4 a 1/32, tresillos o libre), zoom, notas fantasma de las otras pistas, selección múltiple, velocidad por nota y **deshacer/rehacer global** (notas, pistas, parámetros, efectos, master, BPM… hasta 100 pasos; los sliders y arrastres cuentan como un solo paso). Con el ratón, **clic derecho** sobre una nota la borra; en pantallas táctiles hay modos **Dibujar / Navegar / Borrar / Seleccionar**.

- **Carpetas del repositorio:** en «Demos y plugins» aparece la sección **En el repositorio** con lo que haya en `demos/` (demos `.js`), `plugins/` (plugins `.js`), `genres/` (géneros `.json`), `kits/bootleg/` (kits de síntesis alternos `.js`; no lista los `test_*`), `projects/` (proyectos `.demokit.json` que no son los ejemplos oficiales) y `project_examples/` (los ejemplos oficiales). Cada archivo trae su botón **Cargar** / **Abrir** (y «Cargar todas» en demos). Los géneros son datos y se cargan directo; los kits y plugins son código y piden confirmación (ver [Kits alternos](#kits-alternos)).
  - Si una carpeta no existe, el estudio te dice cómo se llama y que la crees junto a `index.html`: en cuanto pongas archivos ahí, aparecen solos.
  - Cómo encuentra los archivos, en este orden: (1) un `manifest.json` dentro de la carpeta (una lista de nombres, p. ej. `["cancion.js","otra.js"]`); (2) la API de GitHub si está en GitHub Pages; (3) el listado de carpeta de un servidor local (`python3 -m http.server`).
  - **Recomendado:** el repo trae un workflow (`.github/workflows/manifests.yml`) que, en cada push a esas carpetas, regenera solo el `manifest.json` de cada una. Así el estudio nunca toca la API de GitHub (que limita a unas 60 consultas por hora) y funciona igual en cualquier hosting. Si el workflow no corre en tu fork, actívalo en la pestaña *Actions* o genera los manifest a mano con `node .github/scripts/gen-manifests.js` (el script y el workflow deben incluir `genres/` y `kits/bootleg/`).
  - Ojo: si existe un `manifest.json`, el estudio confía en él; si subes archivos sin que el workflow corra, no aparecerán hasta que se regenere.
  - Abriendo el HTML como archivo (`file://`) un navegador no puede mirar carpetas, y el estudio lo avisa. El código que cargues desde ahí pasa por la misma confirmación de seguridad que cualquier otro.

- **Compás:** selector junto a «Compases» (2/4, 3/4, 4/4, 5/4, 6/4, 7/4, 3/8, 5/8, 6/8, 7/8, 9/8, 12/8).
  - Cambia las líneas de compás y la regla, el bucle, el conteo de compases, el metrónomo, la cuenta previa de la grabación (un clic por tiempo del compás) y copiar/pegar por compases.
  - El «pulso» sigue siendo la negra: 6/8 son 3 pulsos por compás y 7/8 son 3.5. El selector es el compás **inicial**; los proyectos viejos abren como 4/4.
  - **Cambios a mitad de canción:** en la pista de tempo (siguiente punto), pestaña **Compás**: clic en un compás = cambio nuevo (con el compás elegido en el selector), arrastra para moverlo a otro compás, doble clic o clic derecho (o «Quitar cambio») para quitarlo.
  - Los cambios solo caen en límites de compás y **las notas no se mueven** (siguen en pulsos): lo que cambia es dónde caen las barras. En una demo `.js` exportada aparece como `// SIG = 3/4`.

- **Pista de tempo (♩ Tempo):** botón junto a «Compás». Abre un carril sobre el piano roll con dos pestañas, **BPM** y **Compás** (la que no está activa queda en transparencia). En la pestaña BPM está la curva de tempo.
  - El rombo del inicio es el BPM de arriba (arrástralo en vertical o cambia el número). **Clic** = punto nuevo (horizontal = pulso, vertical = BPM), **arrastra** para moverlo, **doble clic o clic derecho** para quitarlo.
  - Con un punto seleccionado puedes teclear su BPM exacto y marcar **«rampa hasta aquí»**: el tempo cambia gradualmente desde el punto anterior y llega a ese BPM en ese pulso (acelerando / ritardando); sin la marca salta de golpe.
  - Todo sigue el tempo: notas, sidechain, automatización, el eco (delay), el cursor, la grabación y el bucle; el wobble de un bajo toma el tempo del inicio de cada nota. Cambiar el tempo vuelve a renderizar las pistas.
  - Se guarda como `"tempo": [{"b":16,"bpm":90,"ramp":true}]` y la librería lo respeta.

- **Secciones de la canción** (🏷 Sección): tercera pestaña de la pista de tempo, junto a BPM y Compás. Marcas con nombre (Intro, Verso, Pre-coro, Coro, Puente, Drop, Break, Outro, o el que escribas) que aparecen en una franja sobre la regla.
  - **Clic** en un compás = marca nueva con el nombre del cuadro de texto; elige una marca y cambia el nombre o toca un atajo para renombrarla; **arrastra** para moverla de compás; **doble clic o clic derecho** para quitarla. Cada sección dura hasta la siguiente marca.
  - Solo organizan: **no cambian el sonido**. Se guardan en el proyecto (`marks`), entran en el deshacer y viajan en el MIDI (ver más abajo).

- **Nuevo desde género** (✨ Género): «destila» la estructura típica de un género para arrancar una rola rápido. Eliges género, una de sus estructuras (con duración aproximada según el BPM y el compás), y ajustas BPM, compás, tónica, escala y nombre; el estudio crea un proyecto nuevo con el tempo, el compás y la escala puestos y las **secciones ya marcadas** en la regla.
  - **Incluidos:** Lo-fi, Pop-rock, Dubstep y Synthwave.
  - **En `genres/`:** Cumbia, Bossa nova, Ranchera, Bolero y Ska (`latinos.json`), y House, Trap y Épica cinematográfica (`electronica.json`), más el ejemplo Reggae. Los géneros con guitarra marcan como afín la **Guitarra acompañante**.
  - **Instrumentos afines marcados:** los instrumentos y las escalas típicos del género salen primero y con un ● en los selectores (los demás siguen disponibles), y una casilla permite agregar además una pista por cada instrumento afín. Los instrumentos se agrupan en cuatro categorías, cada una con su color pastel: **percusión**, **melódicos**, **acompañamiento** y **efectos**; el borde de cada pista lleva el color de su categoría.
  - **Extensible:** un género es un archivo `.json` (`{"format":"demokit-genres","genres":[…]}`, ver [Géneros](#géneros-genres)). Suéltalo en la ventana, ponlo en `genres/` o créalo desde el propio panel; los géneros propios se recuerdan en el navegador. `genres/reggae.json` es un ejemplo completo.

- **Progresión de acordes del proyecto (♬ Acordes):** cuarta pestaña de la pista de tempo. Escribes tus acordes en texto, por ejemplo `Am7 | Dm7 G7 | Cmaj7 %`, y el proyecto los guarda (`prog`). Una franja sobre la regla dibuja cada acorde.
  - **Sintaxis:** `|` separa compases; varios acordes dentro de un compás lo dividen en partes iguales; un `%` solo repite el compás anterior; `%`, `.` o `_` entre acordes mantienen el anterior. La progresión se repite sobre los compases del proyecto.
  - **Acordes que entiende:** tríadas, `sus2`/`sus4`, `6`, `69`, `7`, `maj7`, `9`, `11`, `13`, `dim`, `ø`, `aug`, alteraciones (`b5`, `#9`, `alt`…) y bajo distinto con barra (`C/E`).
  - **«Generar pista de acordes»** crea una pista de pad con la progresión y opcionalmente otra de **bajo**. El selector de al lado elige el **voicing**: **Cerrado suave** (por defecto: cada acorde se coloca en la inversión y octava más cercanas al anterior, por eso una misma progresión puede salir en otra inversión al repetirse), **Cerrado fijo** (siempre en estado fundamental y cerca de do central, idéntico en cada vuelta), **Abierto (drop 2)** y **Abierto (drop 2+4)** (bajan una o dos notas una octava, más ancho), **Amplio (orquestal)** (notas repartidas en dos octavas; con «con bajo» activo se omite la fundamental porque ya la toca el bajo) y **Alternar cerrado/abierto** (cerrado en los compases impares, drop 2 en los pares). El navegador recuerda tu elección. Las notas ya dibujadas no se borran: los instrumentos que leen la progresión (la guitarra con «Del proyecto») simplemente las ignoran.
  - **Ayuda de acordes:** un panel plegable donde eliges una **raíz** y una **escala** y te muestra una tabla de acordes válidos por grado (sus2, tríada, sus4, séptima). Un clic en un cuadrito **suena** el acorde; el interruptor del panel permite también **agregarlo** a la progresión (arranca en «solo oír»).

- **Pistas / capas ilimitadas**, cada una con su instrumento, volumen, paneo, mute y solo.

- **Instrumentos base parametrizables** (cada uno con sus sliders; los plugins instalados se suman a esta lista):
  - *Melódicos:* Sinte genérico, Supersaw, Pluck, Arpegio cuadrado, Pad, Sub, Sub con caída, Reese, Growl, Campana, Chop vocal.
  - *Percusión y efectos:* Bombo, Caja, Palma, Chasquido, Hi-hat (cerrado/abierto), Crash, Riser, Barrido, Viento, Impacto, Rim.

- **Sidechain:** las pistas «ducked» (la música) bajan de volumen cada vez que suena una pista marcada como disparador (normalmente el bombo). Profundidad y relajación ajustables.

- **Efectos por pista** («Mezcla y efectos de la pista», en el inspector). Se aplican en este orden sobre el audio ya renderizado de la pista, así que moverlos **no vuelve a renderizar el instrumento**. También suenan al tocar en vivo y en la vista previa:
  - **EQ de 3 bandas:** graves (shelf en 120 Hz), medios (campana con frecuencia y Q ajustables) y agudos (shelf en 7 kHz), de ±12 dB.
  - **Potencia** (antes del EQ): graves profundos (shelf a 80 Hz, hasta +9 dB), cuerpo (campana a 300 Hz, hasta +12 dB), saturación (igualada en nivel RMS, así vuelve el sonido más denso sin hacerlo más fuerte), recorte de agudos (de 20 kHz a unos 3.5 kHz) y compresión «pegamento». Sirve para acercar bajos y percusiones a un carácter denso y oscuro; con todo en cero no cambia nada.
  - **Compresor:** umbral, razón, ataque, liberación, codo, compensación de ganancia y mezcla en paralelo. Un indicador muestra cuánto está comprimiendo (reducción máxima) la última vez que se renderizó.
  - **Delay** (tiempo en negras/corcheas, repeticiones, tono, mezcla, ping-pong) y **reverb** (tamaño, amortiguación, mezcla, pre-delay).
  - **Preajustes** de EQ y compresor: Voz, Bajo, Bombo, Pegamento suave y Brillo.

- **Automatización por pista:** botón «📈 Automatización» bajo el piano roll. Curvas de **volumen**, **paneo** y **filtro** (pasa-bajos de 80 Hz a 18 kHz) con puntos en pulsos: clic = punto, arrastrar = mover (respeta la rejilla), doble clic o clic derecho = quitar, `Ctrl+Z` deshace. Se aplican al mezclar, después de los efectos, así que editarlas no vuelve a renderizar el instrumento. Se oyen al dar Play, en el WAV y en los stems; no al tocar en vivo.

- **Parámetros del instrumento automatizables:** en el mismo selector del carril aparecen también los parámetros del instrumento de la pista (cutoff, índice FM, lo que tenga).
  - Estas curvas **escalonan**: el valor se toma al inicio de cada nota y se reparte en **8 niveles** (o **16**, con el selector «niveles»). El sonido por nota queda un poco «artificial» a propósito, como una característica.
  - Un parámetro fijado a mano en una nota (punto blanco) tiene prioridad sobre la curva. Cambiarlas vuelve a renderizar solo esa pista.

- **Efectos automatizables:** en el mismo selector, el grupo **«Efectos de la pista»** trae nueve curvas: EQ (graves, medios, frecuencia de medios, agudos), compresor (umbral, compensación, mezcla), mezcla del delay y mezcla de la reverb.
  - A diferencia de las del instrumento, estas curvas son **continuas** (interpolación lineal que sigue el mapa de tempo) y no vuelven a renderizar el instrumento: solo se recalculan los efectos.
  - Una curva **solo actúa si su efecto está encendido**; si no, el carril avisa. Sin curvas de efectos el audio es idéntico al de siempre. Se guardan en el proyecto, el compacto, la demo `.js` y la librería, pero no suenan al tocar en vivo.

- **Hornear barrido** (solo con parámetros automatizados): si quieres que el parámetro se mueva de forma **continua dentro de cada nota**, el botón «Hornear barrido» renderiza la nota seleccionada (o toda la pista) varias veces con el valor en distintos puntos y las funde.
  - Es caro, así que solo ocurre al pulsarlo. Las notas horneadas pasan a una pista «<nombre> · bake» (con audio estéreo guardado en el proyecto, que pesa), y las notas idénticas comparten el mismo clip.
  - **Deshornear** (con la pista bake seleccionada) las devuelve a su pista original, o `Ctrl+Z`.

- **Escalas y acordes:** elige tónica y escala (mayor, menor natural/armónica/melódica, mayor armónica, doble armónica mayor, pentatónicas, dórica, frigia, lidia, mixolidia, locria, napolitana mayor y menor, blues): el piano roll resalta las notas de la escala y la tónica. «Ajustar» mueve a la escala lo que dibujas, y el botón de forzar a la escala lleva a la nota más cercana lo ya dibujado. El selector **Acorde** (tríada, séptima, quinta, sus4, octava) hace que cada clic en el roll, cada tecla o cada nota MIDI suene y escriba el acorde completo, apilado sobre los grados de la escala si hay una elegida. La escala se guarda con el proyecto.

- **Teclado en pantalla** (🎹 Teclado): dos octavas para tocar con el ratón o el dedo, con los mismos acordes, grabación y efectos que el teclado de la compu. En pistas de percusión muestra un pad por carril (si hay más de cuatro, como en la [Batería de pads](#batería-de-pads-pluginsbateria_padsjs), los pads se acomodan en una rejilla).

- **Edición de notas:** transponer (±1, ±12), cuantizar inicios y largos a la rejilla, forzar a la escala, y copiar/pegar notas entre pistas (`Ctrl+C` / `Ctrl+V`, se pega en el cursor). Actúan sobre la selección, o sobre toda la pista si no hay. Todo se deshace con `Ctrl+Z`.
  - **Edición con el dedo:** el modo **↔ Estirar** solo cambia el tamaño de las notas (no mueve ni crea otras), y la franja de selección trae **← →** (mueven la selección según la rejilla) y **⇤ ⇥** (acortan o alargan según la rejilla). Junto al zoom hay un **Play** pequeño y, en «⋯ Más», un **⏮ Inicio** que lleva el cursor al principio de la composición.
  - **Notas que se pisan** en un instrumento monofónico (voz, o Forja con legato): se marcan en rojo, la pista muestra «⚠N» y aparece **recortar** (con doble confirmación; solo recorta las que empiezan en momentos distintos).

- **Carril de velocidad:** en el mismo carril de la automatización, «Velocidad de notas» muestra una barra por nota; arrástrala para cambiarla (si la nota está seleccionada, cambia toda la selección; si no, las notas que empiezan en ese pulso).

- **Master:** bloque **Potencia** (los mismos cinco ajustes de la pista, aplicados a toda la mezcla), graves y agudos (shelves de ±12 dB en 120 Hz y 7 kHz), ganancia y limitador con anticipación y techo ajustable. Con todo neutro el sonido original queda intacto.

- **Tocar en vivo** la pista activa con el teclado de la compu o con un controlador MIDI, para afinar parámetros escuchando (ver [abajo](#tocar-en-vivo)).

- **Grabar lo que tocas** en el piano roll, con cuenta previa, cuantizado, bucle con overdub y un solo `Ctrl+Z` por toma (ver [abajo](#grabar-lo-que-tocas)).

- **Plugins:** instrumentos nuevos escritos en JavaScript, con editor integrado. Si una demo `.js` repite funciones auxiliares (`clack`, `sub`, `ping`…), la conversión las convierte **automáticamente en plugins** (verificados contra el audio original, con plan B a clips): Event Horizon pasó de 284 clips a ninguno y de ~11 MB a ~140 KB.

- **Voz cantada (plugin `automata_vocal.js`):** un sintetizador de formantes en español. Escribes una sílaba o palabra sobre cada nota y la voz la canta con el tono de la nota (ver [Letra sobre las notas](#letra-sobre-las-notas-voz-cantada)).

- **Demos editables:** convierte las demos del kit en proyectos con pistas y notas.

- **Pantalla activa** mientras suena (Wake Lock, con un video invisible de respaldo en navegadores que no lo soportan).

- **Render por pista con caché:** cada pista se renderiza sola y se guarda. Editar una pista solo vuelve a renderizar esa pista, y cambiar volumen, mute o solo no renderiza nada. Un Play tras un cambio pequeño tarda una fracción de segundo.

- **Exportación a WAV** (estéreo, 16 bits, 44.1 kHz) y **a stems**: un ZIP con un WAV por pista (incluidas las silenciadas), con los efectos de cada pista pero sin el master, para seguir mezclando en otro DAW. El nombre del archivo lleva el kit y el carácter con que sonó (`nombre_evol-organico.wav`, `nombre_incluido.wav`), para comparar kits sin confundirse.
  - **Largo del proyecto:** si hay notas fuera del largo del proyecto (o sobra más de un compás vacío al final), al exportar WAV, stems o MIDI el estudio pregunta qué hacer: exportar solo el tiempo del proyecto, exportar todas las notas (hasta la última) sin tocar el proyecto, o **ajustar el proyecto**. El botón **Ajustar** junto a «Compases» acorta o alarga el proyecto a la última nota (`Ctrl+Z` lo deshace). Guardar, «Compacto» y «Demo .js» no preguntan: llevan todas las notas.

- **MIDI:** «⬇ MIDI» descarga un `.mid` con una pista por pista, más tempo, compás (con sus cambios), volumen y paneo (las pistas silenciadas salen con volumen 0; la automatización no se exporta). **Cargar archivos** acepta `.mid`/`.midi` y lo abre como **proyecto nuevo** (con los cambios de tempo y de compás que traiga; si un cambio de compás no cae en límite de compás, se ajusta y se avisa). Las **secciones** viajan como marcadores del `.mid` (eventos de texto, en el compás donde empiezan) y al importar se leen de vuelta, incluidos los «cue points» de otros programas; si un marcador no cae en un compás exacto se ajusta al más cercano y se avisa. Es para llevar las notas a otro programa y de vuelta: el sonido de Demo Kit no viaja en el MIDI.

- **Apariencia y rendimiento (⚙):** dos temas, **Cristal** (por defecto, con transparencias y desenfoque) y **Clásico**, con interruptores para el desenfoque, el fondo animado y las animaciones. Si el equipo va lento, el estudio lo avisa y propone apagarlos.

- **Pantalla completa:** toca el logo «dk» de la cabecera. El fondo (aurora y partículas) se queda quieto cuando no hay actividad y despierta con un toque, una tecla o Play.

- **Metrónomo:** casilla «metrónomo» en la cabecera; sigue el compás y el mapa de tempo, y suena también al grabar.

- **Guardar / cargar** proyectos `.demokit.json`. También hay autoguardado en el navegador (salvo en proyectos con clips horneados).

- **Guardar compacto** («⬇ Compacto»): el mismo `.demokit.json` pero para producción: notas en arreglos, sin los parámetros que son los de fábrica.
  - El ejemplo del estudio baja de 13.7 KB a 6 KB (≈1.3 KB con gzip). Al descargarlo muestra un **reporte de peso** y avisa si los clips horneados o los plugins lo inflan.
  - Las notas se guardan con 5 decimales de pulso (error menor a 0.01 ms); «Guardar» normal conserva todo tal cual.

- **Exportar como demo `.js`** («⬇ Demo .js»): una demo autónoma, con la forma `async function renderXxx(sr, onProg)` y `BPM`/`BARS` en el encabezado, que lleva dentro el proyecto editable y el motor del estudio.
  - Suena **igual** que en el estudio (la diferencia medida contra el render del estudio fue 0, con efectos, automatización y master) y solo necesita `demoKit`, como cualquier demo: sirve para cargarla en un juego como WAVESURFER.
  - Al cargarla de nuevo en el estudio, «Convertir en editable» recupera el proyecto **sin pérdidas** (incluye plugins usados, automatización, efectos, escala y clips).
  - Pesa unos 50 KB (el motor va incrustado); si el proyecto tiene clips horneados pesa mucho más.

## Controles

| Acción | Cómo |
|---|---|
| Crear nota | clic en el piano roll |
| Alargar al crear | clic y arrastrar |
| Cambiar el largo | arrastrar el borde derecho de la nota |
| Mover | arrastrar la nota (también vertical para cambiar el tono) |
| Seleccionar varias | `Shift` + arrastrar un recuadro, o `Shift` + clic |
| Borrar | `Supr` / `Retroceso`, clic derecho sobre la nota, el botón 🗑 de la selección, o modo «Borrar» |
| Escribir la letra de una nota (pistas de voz) | doble clic / doble toque, mantener pulsada la nota, `Intro` con la nota seleccionada, o el botón «✎ Letra» |
| Duplicar selección | `Ctrl/⌘ + D` |
| Seleccionar todo | `Ctrl/⌘ + A` |
| Deshacer / rehacer | `Ctrl/⌘ + Z` / `Ctrl/⌘ + Shift + Z` o `Ctrl + Y` (también los botones ↶ ↷ de la barra) |
| Mover selección | flechas (`Shift`: 1 pulso / 1 octava) |
| Punto de inicio de reproducción | clic en la regla de compases (`Inicio` lo lleva a 0) |
| Play / Stop | `Espacio` |
| Zoom | botones ＋ / −, o `Ctrl` + rueda |
| Escuchar una tecla | clic en el teclado de la izquierda |

El modo **✋ Navegar** sirve para desplazarse sin dibujar notas: con el dedo en pantallas táctiles, o arrastrando con el ratón. `F1` o el botón **?** abren la hoja completa de atajos y gestos. En pantallas chicas la cabecera se pliega, los botones de modo y deshacer quedan junto a la regla y los controles menos usados (rejilla, tocar, escala, acorde, teclado) viven bajo el botón **⋯**.

## Tocar en vivo

Con el botón **⌨ Tocar** activo, el teclado de la compu toca la pista seleccionada, como en FL Studio o Ableton. Mueve un slider del inspector, toca una tecla y escucha cómo cambia el sonido.

```
 2 3   5 6 7   9 0          fila de arriba:  octava de arriba (empieza en la octava +1)
Q W E R T Y U I O P

  S D   G H J   L ;         fila de abajo:   octava base (por defecto C4)
 Z X C V B N M , . /
```

- **Octava:** `−` / `=` (o los botones de la barra). La octava base se muestra junto al botón.
- **Percusión:** en pistas de un solo carril (bombo, caja…) cualquier tecla del mapa lo dispara. En pistas de varios carriles (hi-hat: cerrado/abierto), las teclas `Z X C V B N M , . /` son los carriles 1 a 10 y `S D G H J L` los carriles 11 a 16 (cada pad en pantalla muestra su tecla en la esquina).
- **MIDI:** pulsa **🎛 MIDI**, acepta el permiso del navegador y elige la entrada. Soporta velocidad, pedal de sustain (CC64) y «all notes off». En percusión, un teclado MIDI usa las notas a partir de C1 (36), una por carril. Web MIDI funciona en Chrome, Edge y Opera; Firefox lo pide como permiso y Safari no lo tiene. Necesita HTTPS (GitHub Pages lo cumple) o `localhost`.
- **Latencia:** cada nota se renderiza una vez y queda en caché; tocar es solo disparar un buffer ya listo. Al elegir una pista (o al soltar un slider) se precalientan en segundo plano las tres octavas del teclado. Una nota fuera de ese rango, o la primera tras cambiar un parámetro, tarda unos 10–50 ms en renderizarse.
- **Largo de las notas:** al tocar, cada nota dura como máximo ~2 s y, al soltar la tecla, tiene un fundido de salida de 90 ms. La percusión y los sonidos cortos suenan completos.
- Las teclas del modo **Tocar** no interfieren con los atajos de edición (todos usan `Ctrl`, flechas, `Supr`, `Espacio`…) y se desactivan solas mientras escribes en un campo de texto o hay una ventana abierta.

## Grabar lo que tocas

1. Elige la pista donde quieres grabar.
2. Pulsa **⏺ Grabar** (queda armado, en rojo). Es independiente de Play: puedes armarlo y desarmarlo cuando quieras.
3. Pulsa **Play** (o `Espacio`). Si «cuenta previa» está activo, hay un compás de metrónomo y la grabación empieza al terminar. El proyecto suena como acompañamiento desde el cursor (el punto de inicio que marcas en la regla).
4. Toca con el teclado de la compu o con MIDI. Las notas aparecen en el piano roll mientras las sostienes.
5. Pulsa Stop. Toda la toma se deshace con un solo `Ctrl+Z`.

Detalles:

- **Cuantizar** ajusta el inicio y el largo de cada nota a la **Rejilla** elegida. Con la rejilla en «libre» (o con cuantizar desactivado) se graba tal cual lo tocaste.
- **Bucle:** si está activo, el bucle cubre exactamente los compases del proyecto y cada vuelta suma notas encima (overdub). Tocar la misma nota en el mismo lugar no la duplica.
- **Punch-in:** si el proyecto ya está sonando y pulsas ⏺, empieza a grabar en ese momento. Si lo desarmas a la mitad, se cierra la toma.
- **Latencia:** entre que pulsas una tecla y que lo oyes pasan unos milisegundos, y las notas se grababan «tarde». La casilla **latencia (ms)** adelanta lo grabado esa cantidad; vacía = automática (la latencia de salida que reporta el navegador). Con **Calibrar** suenan 8 clics: toca cualquier tecla (o haz clic) al ritmo y se calcula y guarda tu valor (mediana de los toques; el navegador la recuerda). Es lo que corrige que lo grabado quede detrás del beat, sobre todo con Bluetooth.
- **Pedal de sustain** (MIDI): la nota grabada dura hasta que sueltas el pedal. La velocidad MIDI se guarda en cada nota.
- **Percusión:** las notas se graban en el carril correspondiente con largo fijo.
- Si cambias de pista durante la toma, las notas abiertas se cierran en su pista.
- Las notas grabadas no suenan en el acompañamiento hasta el siguiente render (Play vuelve a renderizar solo si hubo cambios). Mientras tocas, oyes tu instrumento en vivo, así que se siente igual.
- Si pasas del último compás, el proyecto se extiende solo (fuera de bucle).

## Convertir una demo en proyecto editable

Las demos del kit son funciones `async function renderXxx(sr, onProg)` que llaman a `K.kick`, `K.syn`, `K.bell`… directamente. Demo Kit las **ejecuta con un kit «grabador»**: cada llamada queda registrada (momento, parámetros, canal) en vez de sonar, y luego se agrupa en pistas con sus notas y parámetros más comunes. La curva de sidechain de la demo se guarda como tabla.

Resultado actual con las demos incluidas:

| Demo | Pistas | Notas | Clips horneados |
|---|---|---|---|
| Marshmallow Sky | 15 | 1928 | 0 |
| Dark Matter | 17 | 1693 | 8 |
| Event Horizon | 21 | 1288 | 0 (los 284 clips son ahora plugins automáticos) |
| Yo soy NaN | 11 | 322 | 0 |
| Ejemplo mínimo | 5 | 72 | 0 |

Electronic Rush (reescrita sobre `demoKit.metric`) ya se convierte; una demo que traiga su propio kit integrado no se convierte (suena y exporta a WAV, pero no es editable).

Límites a tener en cuenta:

- **No es idéntica muestra por muestra.** Las fases iniciales de los osciladores y el ruido salen de un generador que cambia con el orden de las llamadas. La energía por segundo coincide (diferencia media de ~3 % en Cotton Sugar y ~1 % en The Void), pero no son bit a bit iguales.
- Los `add()` sueltos con funciones propias que no se pueden parametrizar quedan como pista **«Clip»** con audio horneado (Dark Matter conserva 8). Funcionan, pero no son editables, y hacen que el proyecto guardado pese más. Rehacer esa pista con un instrumento como «Sub con caída» la vuelve editable.
- Las **funciones auxiliares** que la demo llama dos o más veces (`clack`, `sub`, `tail`, `tom`, `ping`, `rev`…) se convierten en **plugins automáticos** (`auto-<demo>-<función>`), verificados contra el audio horneado; si no pasan la verificación, se usan clips como respaldo. Las que dependen de ruido quedan equivalentes en energía (±0.5 dB por ventana de 50 ms), no idénticas.
- Los ajustes que cambian nota por nota (un filtro que se abre a lo largo de una sección, por ejemplo) se conservan por nota y se marcan con un punto blanco; hay un botón para unificarlos con los controles de la pista.
- La conversión reconoce funciones auxiliares conocidas (`reese`, `growl`, `rim`, `wash`, `impact`) por su nombre, y construye plugins para las demás que se repiten.

## Escribir demos compatibles (para humanos e IAs)

Una demo es un archivo `.js` con una función `async` que usa `demoKit` y devuelve el audio. Si solo usa las funciones nombradas del kit, **se convierte en un proyecto completamente editable**. *Yo soy NaN* la escribió una IA (Éter) viendo el kit y un par de ejemplos, y convirtió a la primera.

> 📖 **Referencia completa para escribir demos (pensada para IAs):** [`kits/REFERENCIA.md`](kits/REFERENCIA.md) — molde, firmas de todas las funciones, opciones de `syn`, qué se convierte y trampas frecuentes.
>
> 🧠 **¿Quieres entender cómo funciona el sonido por dentro?** [`kits/demo_kit_comentado.js`](kits/demo_kit_comentado.js) es el mismo kit, con el mismo resultado (se comprobó muestra por muestra), pero explicado línea por línea y sin dar nada por sabido: qué es una muestra, una envolvente, un filtro, el sidechain… Termina con una canción de ejemplo para copiar.

**El contrato (forma métrica, recomendada)**

```js
// ── Título de la demo · lo que quieras ──      ← el texto antes del primer «·» es el nombre del proyecto
async function renderLoQueSea(sr, onProg) {      // el nombre debe empezar con «render»
  const K = demoKit.metric(sr, 128, 16, 2.5, 20261015);   // BPM, compases, cola (s), semilla → la duración se calcula sola
  const { beat, bar, T } = K;                    // beat/bar en segundos · T(compás, pulso) → segundos
  K.kick(T(0, 0), 1);                            // compás 0, pulso 0
  K.syn(K.mu, T(1, 2), beat, 110, .3, 0, { w: 2 });
  return K.mix([0, 0, .8, .8 /* …uno por compás */], .13);   // sidechain por compás (0 = nada, .8 = fuerte), decae en cada pulso
}
```

`demoKit.metric(sr, BPM, BARS, tail, seed)` devuelve el mismo kit de siempre más `BPM, BARS, beat, bar, T(compás, pulso)` y `duckBars(arreglo, dk)`. El convertidor lee BPM y BARS directamente de esa llamada (sin regex ni comentarios) y `K.mix` acepta el arreglo por compás o una función `duckAt(t)`. La forma clásica `demoKit(sr, segundos, semilla)` sigue funcionando igual.

**Forma clásica** (sigue siendo válida)

```js
// BPM = 100 | BARS = 4                           ← en este caso el convertidor los busca con estos nombres en mayúsculas
async function renderLoQueSea(sr, onProg) {
  const K = demoKit(sr, BARS*bar + 2.5, 20261015);   // segundos totales (+2.5 s de cola) y semilla
  return K.mix(duckAt);                          // duckAt(t) → ganancia de la música (1 = sin sidechain)
}
```

**Demos hechas con `make_kit.js`** (`makeKit(sr,BPM,BARS,tail,seed)`, como `the_void_MK.js` y `cotton_sugar_MK.js`): el estudio y la librería las ejecutan y convierten solas, sustituyendo `makeKit` por un adaptador sobre `demoKit.metric` (el audio sale idéntico). El `reese` de 4 sierras y la campana en línea de esas demos se reconocen como «Reese 4 sierras (MK)» y «Campana (MK)».

**Qué se convierte en notas editables**

| En la demo | En el estudio |
|---|---|
| `K.kick` `K.snare` `K.clap` `K.snap` `K.hat` `K.crash` | pistas de batería (el hi-hat abierto va en el segundo carril) |
| `K.syn(buf, …)` | pistas «Sinte» (se agrupan por onda, envolvente y desafine), con ganancia, voces, filtro y envolvente como sliders |
| `K.bell` `K.chop` `K.riser` `K.sweep` | sus instrumentos, con parámetros |
| funciones propias llamadas `reese` `growl` `rim` `wash` `impact` `bell` | sus instrumentos (se reconocen por el nombre y la firma) |
| `K.mix(duckAt)`, la función que quieras | una curva de sidechain guardada como tabla |

**Qué no se convierte, y cómo evitarlo**

- `K.add` con una función propia (osciladores o filtros escritos a mano) queda como pista **«Clip»**: suena igual, pero no es editable. Para que sea editable, expresa ese sonido con `K.syn` o escribe un [plugin](#plugins-instrumentos-propios).
- Un filtro que no sea un número ni la forma `t => base + barrido * Math.exp(-t * velocidad)` se conserva como función propia, en vez de sliders. El sonido es idéntico; solo ese parámetro no es ajustable con un slider.
- Si no hay `BPM = N` (mayúsculas) ni «N BPM» en el archivo, se asume 120. Si no hay `BARS = N`, los compases se deducen de la duración.
- Los demos corren en la página con `demoKit` y `sleep` disponibles. No hay archivos ni red.

**Un ejemplo mínimo** (convierte en 5 pistas y 72 notas):

```js
// ── Ejemplo mínimo · demo para Demo Kit ──
// /demos/ejemplo_minimo.js
// BPM = 100 | BARS = 4
async function renderEjemplo(sr, onProg) {
  const BPM = 100, BARS = 4, beat = 60 / BPM, bar = beat * 4;
  const K = demoKit(sr, BARS * bar + 2.5, 20261015);
  const kicks = [];
  for (let b = 0; b < BARS; b++) {
    const t0 = b * bar;
    for (let i = 0; i < 4; i++) { K.kick(t0 + i * beat, 0.9); kicks.push(t0 + i * beat); }
    K.clap(t0 + beat, 0.5); K.clap(t0 + 3 * beat, 0.5);
    for (let h = 0; h < 8; h++) K.hat(t0 + h * beat / 2, h % 2 ? 0.1 : 0.2, false, h % 2 ? 0.3 : -0.3);
    [57, 60, 64].forEach(m => K.syn(K.mu, t0, bar * 0.95, K.hz(m), 0.1, 0, { w: 0, atk: 0.2, rel: 0.3, det: [-8, 0, 8], lp: 1200 }));
    K.syn(K.mu, t0, beat * 0.9, K.hz(33), 0.4, 0, { w: 2, atk: 0.01, rel: 0.1, lp: 400 });
    if (onProg) onProg(b / BARS);
  }
  const duckAt = t => { let g = 1; for (const k of kicks) { const d = t - k; if (d >= 0 && d < 0.25) g = Math.min(g, 0.4 + 0.6 * (d / 0.25)); } return g; };
  return K.mix(duckAt);
}
```

**Pedirle una demo a una IA:** pásale `demo_kit.js`, este ejemplo (o `yo_soy_nan.js`) y algo como:

> Escribe una demo para Demo Kit en el estilo del ejemplo: una sola función `async function renderXxx(sr, onProg)`, con `BPM = N` y `BARS = N` en el encabezado, que use solo funciones de `demoKit` (`kick`, `snare`, `clap`, `hat`, `syn`, `bell`, `chop`, `riser`, `sweep`, `crash`) y termine con `return K.mix(duckAt)`. Sin `K.add` propios. Estilo: …

## Plugins (instrumentos propios)

> 🛡 **Seguridad:** un plugin es JavaScript que se ejecuta con los mismos permisos que la página. Por eso el estudio **pregunta antes de ejecutar** código ajeno: al soltar un plugin `.js`, un kit propio, o al abrir un proyecto que trae plugins (se listan sus nombres y tamaño; si dices que no, el proyecto abre igual pero sin esos instrumentos). Si ya tienes ese plugin instalado tal cual, no vuelve a preguntar. Las demos `.js` se ejecutan solo cuando pulsas ▶ o Convertir, así que cárgalas solo si son tuyas o confías en ellas.

«Demos y plugins» → «Escribir un plugin nuevo» abre un editor con una plantilla. Un plugin es un objeto que llama a `registerInstrument`:

```js
registerInstrument({
  name: 'Campana FM',
  kind: 'melodic',                 // 'melodic' = piano roll · 'perc' = carriles
  params: [
    {k:'gain',  label:'Ganancia',  min:0,  max:1, step:.005, def:.12},
    {k:'ratio', label:'Razón FM',  min:.5, max:8, step:.01,  def:3.5},
    {k:'index', label:'Índice FM', min:0,  max:12, step:.1,  def:4},
    {k:'decay', label:'Caída (1/s)', min:.5, max:12, step:.1, def:3}
  ],
  play(K, n){
    const p = n.p, f = n.hz, L = n.len + 1.2;
    K.add(n.buf, n.t, L, t => {
      const env = Math.exp(-t*p.decay) * Math.min(1, t*500);
      const mod = Math.sin(2*Math.PI*f*p.ratio*t) * p.index * Math.exp(-t*p.decay*1.5);
      return Math.sin(2*Math.PI*f*t + mod) * env;
    }, n.a*p.gain, n.pan);
  }
});
```

**Definición**

| Campo | Descripción |
|---|---|
| `name`, `id` | nombre visible; `id` opcional (por defecto sale del nombre) |
| `version` | `'mayor.menor'` (ver [Versiones de plugins](#versiones-de-plugins)); sin el campo se toma `1.0` |
| `kind` | `'melodic'` o `'perc'` |
| `cat` | categoría para los géneros y los colores: `'perc'`, `'mel'`, `'acomp'` o `'fx'` |
| `params` | lista de controles; aparecen como sliders en el inspector. Tipos: número (`min`, `max`, `step`, `def`), `type:'choice'` con `opts` y `vals`, y `type:'text'` (cuadro de texto) |
| `lanes` | solo `perc`: carriles del piano roll (`[{name:'Cerrado'},{name:'Abierto'}]`) |
| `oneShot` | las notas se dibujan cortas (sonidos que no dependen del largo) |
| `mono` · `monoWhen(params)` | el instrumento es monofónico (`mono:true`, o `monoWhen` devuelve `true` según los parámetros de la pista, como el legato de Forja): el piano roll marca las notas que se pisan |
| `usesProg` | `true` = el instrumento lee la [progresión del proyecto](#funciones) (`n.chords`); al editar la progresión, solo esas pistas se vuelven a renderizar |
| `presetReset` | `true` = al elegir un preajuste, antes se devuelven todos los parámetros a su valor por defecto (así los preajustes no se mezclan entre sí) |
| `play(K, n)` | se llama una vez por nota |
| `lyrics` | `true` = el piano roll deja escribir una palabra sobre cada nota (llega en `n.note.w`) |
| `noteParams` | lista de claves de `params` que se ajustan **por nota** con sliders propios en «Notas» (guardadas en `o` de cada nota) |
| `presets`, `syllables` | opcionales: un objeto `{nombre: {param: valor}}` para el selector «Preajuste», y una función `texto → [sílabas]` para «Pegar letra…» |

**`n` (la nota)**

`t` (segundo de inicio) · `len` (segundos) · `midi` · `hz` · `lane` · `a` (amplitud: velocidad × volumen de pista) · `pan` · `p` (parámetros de la pista, ya con los valores propios de la nota y la automatización aplicados) · `buf` (canal destino) · `bpm` · `beat` · `bar` · `sr` · `note` · `clips`, y dos más para plugins que quieren saber qué hay alrededor:

- `link` = `{prevGap, prevMidi, nextGap, nextMidi}`: la distancia en segundos y la altura de la nota anterior y de la siguiente de la misma pista (`null` si no hay). Sirve para hacer **legato** (así lo hace Forja).
- `chords` = la lista de acordes de la progresión que caen dentro de la nota, `[{t0, t1, sym, root, bass, ivs, pcs}]`, con `t0` y `t1` en segundos **relativos al inicio de la nota** (llega `null` si el proyecto no tiene progresión).

**Parámetros con más ayuda en el inspector** (todo opcional; sin esto los controles salen en una lista como siempre):

- `sec: 'Nombre'` en un parámetro lo agrupa en una **sección plegable** del inspector (cada título muestra cuántos parámetros están activos).
- `on: p => bool` en un parámetro enciende o apaga un **puntito** junto a su nombre según si hoy influye en el sonido con los ajustes actuales (por ejemplo, la desafinación del unísono no influye si hay una sola voz). Sin `on`, el puntito queda encendido.
- Todos los instrumentos traen un botón **↺ Estado basal** debajo del preajuste, que devuelve todos sus parámetros a los valores por defecto (los ajustes por nota no se tocan).

`n.buf` apunta a `K.mu` (música, con sidechain) o `K.dr` (batería, sin él) según la casilla «Ducked» de la pista.

**`K` (el kit)**

```
K.add(buf, t0, len, fn, amp, pan)        fn(t) → muestra · la base de todo
K.syn(buf, t0, len, f, a, pan, {det:[cents], w:0|1|2, atk, rel, dec, lp:Hz | t=>Hz})
K.bell(t0, midi, a, pan, len)            K.chop(t0, len, midi, a, pan, 'oh'|'ah'|'ee'|'oo')
K.kick(t0, a, {lo,hi,k,dec,len,click})   K.snare(t0, a, {tone,nd,td,len})
K.clap(t0,a)  K.snap(t0,a,pan)  K.hat(t0,a,abierto,pan)  K.crash(t0,a,len)
K.riser(t0,len,a)   K.sweep(t0,len,f0,f1,a)
K.rnd()   K.hz(midi)   K.lpc(fc)
```

**Reglas de oro**

- El estado de un filtro o una fase (`let y=0`, `let ph=0`) se crea **dentro de `play()`**: cada nota necesita el suyo.
- Una excepción en `play()` desactiva esa pista en el render y aparece un aviso con el nombre de la pista; el resto sigue sonando.
- Los plugins se guardan en el navegador (`localStorage`), se pueden descargar como `.js` y se cargan arrastrándolos a la ventana. Si un proyecto usa un plugin, el plugin va incluido en el `.demokit.json`.
- Los campos de texto de un plugin (`type:'text'`) escuchan el resultado al cambiarlos.
- Si cargas **tu propio `demo_kit.js`** (con funciones nuevas), los instrumentos y plugins lo usan desde ese momento: lo que agregues a `K` queda disponible para los plugins.

### Versiones de plugins

Cada plugin puede declarar `version: 'mayor.menor'`. Mismo número mayor = compatible hacia atrás (solo se añaden parámetros u opciones). Lo que hace el estudio:

- **Un proyecto trae un plugin que no tienes instalado:** se usa como **copia temporal**: no se guarda en el navegador ni pisa nada. Un botón **Instalar** en la lista de plugins la vuelve permanente, y al guardar el proyecto el estudio te recuerda que hay un plugin temporal.
- **El del proyecto no es el mismo que el instalado:** siempre **pregunta**. Recomienda el más nuevo si al plugin instalado no le falta nada de lo que el proyecto usa, y la copia del proyecto si al instalado le faltan parámetros u opciones.
- **Sueltas un archivo de plugin más viejo que el instalado:** pregunta antes de bajar de versión.

## Letra sobre las notas (voz cantada)

El plugin [`plugins/automata_vocal.js`](plugins/automata_vocal.js) («Voz cantada (Autómata)») es el sintetizador de voz robótica en español *Autómata Vocal* convertido en instrumento: conversión del texto a fonemas, silabeo, formantes y un modelo glotal con «ADN» de voz. Cárgalo desde **En el repositorio → plugins** (o arrástralo a la ventana) y añade una pista con ese instrumento.

- **Escribir la letra:** doble clic o doble toque sobre una nota, mantenerla pulsada, `Intro` con una nota seleccionada, o el botón **✎ Letra**. Aparece un cuadro sobre la nota; la palabra se dibuja encima de la barra y se guarda en el proyecto. Cada nota canta lo que lleva escrito, repartiendo sus sílabas dentro de su duración, con el tono de la nota.
- **Saltar a la siguiente nota mientras escribes:** `Espacio`, guion `-` o `Tab` confirman la palabra y pasan a la siguiente nota (en el teclado de Android también funciona el `Espacio`). `Shift+Tab` o `Retroceso` con el cuadro vacío vuelven a la anterior; `Intro` cierra; `Esc` cancela. Un `Espacio` sin escribir nada salta la nota sin cambiarla. Si pegas varias palabras de golpe, se reparten una por nota. Una sesión de escritura es un solo paso de deshacer.
- **Pegar letra…** (en el inspector): partes un texto en sílabas y se reparte una por nota, en orden de tiempo, desde la nota seleccionada. **Borrar letra** quita todas las palabras de la pista.
- **Por nota: Energía, Sorpresa y Cansancio** (sliders en «Notas», para las notas seleccionadas o todas si no hay selección): energía = brillo y volumen, sorpresa = inflexión de tono al entrar y al terminar, cansancio = caída de tono, más aire y menos vibrato. Los demás controles (género, tono, formantes, aspereza, aire, vibrato, timbre, agua, coro de 1 a 4 voces, ADN…) son de la pista, con **preajustes**: Robot, Neutra, Grave, Aguda, Hueca y la familia de personajes de *El Brayan* (El Brayan, El Brayan seco, Brayan y su banda, Don Brayan y La Brayana).
- **Límites:** cada nota es una voz independiente (el slider **Legato** de la pista une cada nota con la anterior y la siguiente si están casi pegadas; en 0, cada nota es independiente); no hay modo hablado aparte (para una voz plana, deja Sorpresa y Cansancio en 0 y el vibrato bajo, con notas largas del mismo tono), y las voces guardadas en el `localStorage` del Autómata original no se importan.

## Guitarra acompañante (`plugins/guitarra_acompanante.js`)

Un instrumento que **toca acompañamientos en vez de notas sueltas**. Una nota larga en el piano roll es un *pasaje*: la altura de la nota elige la tónica (do, re, mi…) y su largo, cuánto tiempo acompaña. Dentro, la guitarra recorre una **secuencia de acordes** y toca un **patrón de mano derecha**; cada acorde dura los *pulsos por acorde* que elijas y la secuencia se repite hasta cubrir la nota. Dibujas una nota por sección (Verso, Coro…) y, con otra secuencia, patrón o intérprete en otra pista, cambias de aire.

- **Círculos:** Lo-fi romántico (I–vi–ii–V), Jazz 2-5-1, Bossa (I–#i°–ii–V), Andaluza (i–VII–VI–V), Menor (i–VI–III–VII), Pop (I–V–vi–IV), Ranchera (I–IV–V–I) y el círculo de quintas completo. Los acordes pueden ser tríadas, séptimas o novenas. Y **«Del proyecto»**: toca los acordes de la [progresión del proyecto](#funciones) (♬ Acordes) en vez de un círculo, con cada acorde en su compás.
- **Intérpretes:** Pedro Infante (caricia: rasgueo lento, yema, cálida), Flamenco (aporreado: rápido, uña, brillante), Bossa (suave), Ranchera (con uña) y Lo-fi (apagada). Cada uno cambia la velocidad del rasgueo, la dureza del ataque, el brillo y cuánto suena la cuerda.
- **Patrones:** abajo, balada, ida y vuelta, arpegio, bossa, ranchera, vals (3 pulsos), flamenco, y los arpegios ascendente, Travis (pulgar alternado), vals arpegiado, balada pop y clásico (p-i-m-a). Hay preajustes completos por estilo.
- **Muteo y golpe en la tapa:** los patrones de ranchera y de balada incluyen el *chuntata* (la mano apaga las cuerdas) y un golpe en la tapa; el parámetro *Muteo y golpes* regula cuánto suenan.
- **Retardo del cambio de acorde:** de −1 a +1 pulso. Retrasa el cambio (el acorde anterior sigue sonando hasta que entra el nuevo) o, con valores negativos, lo **anticipa**, como en la bossa.
- **Patrón escrito:** con el patrón «Personalizado (texto de abajo)» escribes el tuyo en el campo de texto. Elementos separados por espacio:

  | Elemento | Qué toca |
  |---|---|
  | `1`…`6` | una cuerda (`6` es la más grave); varias juntas, como `321`, suenan casi a la vez |
  | `.` | un silencio |
  | `D` `U` `C` `S` | rasgueo hacia abajo · hacia arriba (solo agudas) · golpe corto de cuatro cuerdas agudas · golpe seco de cuatro cuerdas (el acorde de la bossa) |
  | `B` `B5` `Bs` | bajo (raíz) · bajo en la quinta · bajo corto |
  | `M` `X` | muteo · golpe en la tapa |
  | `@nombre` | un patrón que ya existe (`@bossa`, `@abajo`, `@travis`…) |

  Los sufijos dicen cuánto dura hasta el siguiente elemento: nada = una negra, `-` = la mitad (corchea), `--` = un cuarto, `+` = el doble (blanca), `++` = cuatro pulsos; `>` acentúa y `~` suaviza. Las barras `|` se ignoran (para leer mejor). Ejemplos: `6- 3- 2- 1- 2- 3- 2- 3-` (arpegio de corcheas), `D D- U- U- D- U-` (rasgueo), `B C B5 C` (ranchera). El patrón se repite hasta que termina cada acorde, y un elemento mal escrito se ignora (si todo el texto queda inválido suena el patrón de base).
- **Un patrón por acorde:** separa varios con `;` y se reparten entre los acordes en orden, volviendo a empezar al final. `@arpegio ; D D- U- ; @bossa` arpegia el primer acorde, rasguea el segundo y toca la bossa en el tercero.
- **Sonido:** cada cuerda es un modelo físico de cuerda pulsada (Karplus-Strong con afinación fraccionaria; los agudos se apagan antes, como en una guitarra), con posición de la púa, golpe de uña y una caja de resonancia. Los retardos entre cuerdas y la fuerza de cada golpe varían un poco (parámetro *Humanización*), todo con la semilla de la pista: el mismo proyecto suena igual siempre.
- **La bossa se afinó contra grabaciones reales:** el patrón (de dos compases), la duración del rasgueo, el bajo corto y los acordes salen de medir cuatro anotaciones de bossa de **GuitarSet** (ver [Créditos](#créditos)) y de ajustarlos de oído. El resto de estilos sigue siendo una aproximación.
- **Compatibilidad:** solo usa `K.add` y `K.rnd`, así que funciona con el kit incluido y con los alternos. Asume un tempo constante dentro de cada nota (el del inicio de la nota); los cambios de acorde de la progresión del proyecto sí siguen el mapa de tempo, pero si hay un cambio de tempo en medio de un pasaje, lo más seguro es partirlo en dos notas.

## Forja (`plugins/forja.js`)

El «instrumento supremo»: un sintetizador de una voz por nota con muchísimo control sobre la onda y el legato, pensado para **sonidos mecánicos** (serruchos, motores, taladros, engranes) y **acuosos** (gotas, burbujas, arroyo, lluvia, olas), y con lo suficiente para inventar muchos más. Con el kit Ultimate hereda su carácter (digital, orgánico, pro, ultra) porque todo lo que escribe pasa por `K.add`, pero **todo el sonido está dentro del plugin**: suena igual con cualquier kit.

Los ajustes están en **14 secciones plegables**, con un puntito que se enciende cuando el parámetro está influyendo en el sonido y un botón **↺ Estado basal**. Los preajustes siempre parten del estado basal, así que no se mezclan entre sí.

| Sección | Qué hay |
|---|---|
| Generador | **Onda** (seno → triángulo → sierra → cuadrada, con ancho de pulso y PolyBLEP), **Pulsos de motor**, **Tabla de ondas** (hueca, vocal, metálica, zumbido, con morph y barrido), **Agua** y **Máquina**; unísono con desafinación, sincronía dura con barrido, FM |
| Onda 2 | segunda onda con su forma, semitonos y afinación fina |
| Motor y máquina | irregularidad, fallos de encendido, filo del golpe; de 1 a 8 **cilindros** con orden de encendido desigual; **engranes** (zumbido agudo con bandas laterales) |
| Agua | goteo, burbujeo, arroyo/lluvia y olas, con densidad, tamaño, dispersión y corriente (las burbujas suben de tono al formarse) |
| Ruido y carácter | ruido blanco, rosa o café; dientes (modulación de amplitud), aspereza, deriva de tono, saturación |
| Filtro | pasabajos, pasabandas, pasaaltos o peine, con envolvente y seguimiento del teclado |
| Volumen y envolvente | ataque, caída, sostenido, relajación |
| Tono | caída de tono al atacar; **inercia**, arranque desde abajo y apagado hacia abajo (el motor que sube y se apaga) |
| Ring, tubo y fuerza | ring mod, tubo resonante (peine con frecuencia propia), la fuerza de la nota abre el filtro |
| LFO | tono, corte y volumen |
| Azar | fuente aleatoria (escalón o suave) con cinco destinos: tono, corte, forma/tabla, plegador y volumen |
| Destructivos | plegador de onda, reducción de bits y de frecuencia de muestreo |
| Eco | ping-pong estéreo con cola, de 1/16 a 1/2 |
| Legato | **apagado (polifónico)**, **legato** (sin reataque) o **glissando**, con ventana y tiempo |

- **Legato opcional:** por defecto es polifónico. Con legato o glissando se vuelve monofónico: si la nota siguiente (o la anterior) está a menos de «Ventana» segundos, no se vuelve a atacar y el tono se desliza. El estudio marca las notas que se pisan.
- **Preajustes (21):** Serrucho, Motor diésel, Moto que acelera, Taladro, Turbina, Relojería, Gotas, Burbujas, Submarino, Robot averiado, Radio rota, Goteo, Burbujeo, Arroyo, Lluvia, Olas, V8, Bóxer, Engranes, Sirena y Turbo-dron.

## Batería de pads (`plugins/bateria_pads.js`)

Una sola pista de percusión con **16 pads** (v1.2). Cada golpe es una nota en su carril del piano roll, y con **⌨ Tocar** y el teclado en pantalla los pads quedan en una rejilla para **tocar y grabar ritmos al vuelo** sin cambiar de pista.

- **Sonido elegible por pad:** cada pad escoge entre 28 sonidos: Bombo, Bombo 808, Caja, Rim, Palma, Chasquido, Hi-hat cerrado, de pedal y abierto, Ride, Campana de ride, Crash, Tom grave/medio/agudo, Conga grave, aguda y seca (slap), Bongó, Timbal, Cencerro, Shaker, Pandero, Claves, Woodblock y Triángulo, más versiones metálicas del hi-hat cerrado y abierto. Los nombres de los carriles y de los pads siguen al sonido elegido.
- **Asignación de fábrica:** pads 1–12 como en la v1.0 (Bombo, Caja, Hi-hat cerrado, Hi-hat abierto, Palma, Rim, Tom grave, Tom medio, Tom agudo, Crash, Cencerro, Shaker) y 13 Ride, 14 Conga grave, 15 Conga aguda, 16 Conga seca.
- **Ajustes por pad:** cada pad tiene su sección con **sonido, volumen, tono (semitonos), duración (×) y paneo**; el puntito se apaga cuando un ajuste no aplica a ese sonido (por ejemplo, la duración de la palma).
- **Controles por sonido (v1.2):** además de volumen, tono, duración y paneo, cada pad tiene **Ruido (×)** (cuánto ruido lleva el crash, ride, hi-hat metálico, shaker, pandero, rim, toms, congas y la caja), **Brillo** (corte de agudos), **Ataque (ms)** (entrada suave), **Sub** (capa de graves sostenida del bombo y del bombo 808) y **Clic** (golpe del bombo). El puntito de cada control se apaga cuando no aplica al sonido elegido. El crash ahora es metal inarmónico más ruido, y el ruido se baja con **Ruido (×)**.
- **Preajustes de kit:** Kit básico, Kit lo-fi (seco), Kit 808, Kit latino, Kit de rock (ride y toms), Kit oscuro y denso y Kit orquestal.
- **Sonidos:** bombo, caja, palma, chasquido, hi-hats cerrado y abierto y crash son los del kit cargado (`K.kick`, `K.snare`…), así que cambian con el kit; el resto está sintetizado dentro del plugin y suena igual con cualquier kit.
- **Teclas:** `Z X C V B N M , . /` tocan los pads 1 a 10 y `S D G H J L` los pads 11 a 16.
- **MIDI:** por defecto cada pad responde a una nota consecutiva desde C1 (36, 37, 38…), como los pads tipo MPC. Con **MIDI: nota de cada pad → General MIDI**, cada pad responde a la nota de batería GM de su sonido (36 bombo, 38 caja, 42 hi-hat cerrado, 46 abierto, 51 ride…). La **exportación MIDI** usa el mismo mapa y va por el canal 10 (batería); en el modo consecutivo escribe 36 + carril.
- **Proyectos de la v1.0:** abren igual; los ajustes por pad guardados con las claves antiguas se siguen leyendo.

## Extender el kit

El kit (`demo_kit.js`) es solo una función `demoKit(sr, segundos, semilla)` que devuelve un objeto con herramientas. Puedes escribir **tu propia versión con funciones nuevas** y usarla sin tocar el HTML:

- **En el estudio:** suelta tu `demo_kit.js` en «Demos y plugins» (te pide confirmación, porque es código). Desde ese momento los instrumentos y los plugins usan tu kit y pueden llamar a tus funciones desde `K`, y el navegador lo recuerda entre visitas. El botón **«Volver al kit incluido»** lo quita.
- **En la librería:** `DemoKit.setKit(miDemoKit)` antes de `DemoKit.load(...)`.

**Cómo escribirlo.** Parte de una copia de [`kits/demo_kit.js`](kits/demo_kit.js) (o de la [versión comentada](kits/demo_kit_comentado.js), que explica cada pieza), agrega tus funciones dentro de `demoKit` y devuélvelas en el objeto final:

```js
function demoKit(sr, seconds, seed0) {
  /* …todo lo del kit original… */
  const pluck2 = (t0, midi, a) => syn(mu, t0, .3, hz(midi), a, 0, { dec: 6, lp: 1800 });   // tu función nueva
  return { n, dr, mu, rnd, hz, lpc, add, kick, snare, clap, snap, hat, crash, syn, bell, chop, riser, sweep, mix, pluck2 };
}
// si quieres que las demos con demoKit.metric sigan funcionando, copia también el bloque «demoKit.metric = …» del kit original
```

**Lo mínimo:** tu función debe llamarse `demoKit`, aceptar `(sr, seconds, seed)` y devolver al menos `syn` y `mix` (el estudio lo comprueba al cargarlo). Dos reglas que los kits ajenos rompen a menudo: `K.syn(buf, …)` debe escribir en el `buf` que recibe (no siempre en la percusión) y los filtros deben ser estables con cualquier corte. Conserva las funciones originales tal cual: si cambias su sonido, las canciones ya hechas sonarán distinto.

**Límites a tener presentes**
- El kit cargado en el estudio **se recuerda en el navegador** hasta que pulses «Volver al kit incluido» (si el kit guardado ya no carga, vuelve el incluido). Un proyecto solo recuerda con qué kit se hizo si ese kit se identifica con `demoKit.info = {id, name, version}` (como Evol): entonces el `.demokit.json` lleva `"engine": {"id": "evol", "v": "1.2.0"}` y el estudio avisa al abrirlo con otro kit. Un kit sin `info` no deja rastro (solo se guarda la versión del formato), y con el kit incluido no se escribe nada. Si abres un proyecto o un plugin que dependa de tus funciones sin cargar antes tu kit, fallará o sonará distinto.
- Al **convertir una demo** en proyecto, solo se registran las funciones conocidas del kit. Si la demo llama a una función tuya, el estudio lo avisa («funciones de un kit propio que el conversor no conoce»): el sonido no entra en el proyecto. Para que sea editable, hazla un **plugin** (instrumento con parámetros) que use tus funciones.
- Cambiar de kit invalida solo la caché de render del estudio; los proyectos guardados no se tocan.

### Kits alternos

El kit incluido **es y seguirá siendo el predeterminado**: así toda canción ya hecha suena siempre igual. Los demás son alternativas que se cargan a propósito, para quien prefiera otro carácter (cada sonido tiene lo suyo).

- **Cómo se cargan:** desde **En el repositorio → Kits de síntesis** (carpeta `kits/bootleg/`), o soltando el `.js` en la ventana. Siempre piden confirmación (es código) y, antes de reemplazar el kit, el estudio lo **revisa solo** con unas notas de prueba y avisa si: `K.syn` ignora el búfer que se le pasa (los pads y bajos no los agacharía el sidechain), el filtro se desborda (valores NaN) con cortes altos, alguna percusión falla, o la mezcla sale más de 4 dB más fuerte que con el kit incluido (puede saturar). Puedes cargarlo de todos modos.
- **`kits/bootleg/`:** los kits alternos que sí funcionan como reemplazo. Hoy son dos: **Evol** y **Ultimate** (abajo). Antes había una decena de versiones (Pro, Ultra, Fidelity y varias de Ultimate, hechas con Éter); su intención se rescató en un solo kit, que se comprobó contra los originales. Cada archivo pasa por la revisión automática al cargarlo, y cada carpeta trae una nota que explica qué es cada archivo.
- **Volver:** «Volver al kit incluido» en «Demos y plugins».

#### Evol

`demo-kit-Evol.js` (v1.2.0) es un kit alterno más fino para los **instrumentos de síntesis** y la **percusión**; el resto (snap, campana, chop, riser, sweep y mezcla) es idéntico al incluido. No necesita que cambies nada de lo que ya tienes: es un kit más, y el mejor modo de entenderlo es escucharlo con una canción tuya.

| Qué | Qué hace |
|---|---|
| Osciladores | sierra, cuadrada (con ancho de pulso) y seno con **PolyBLEP**: mucho menos aliasing arriba (medido en notas agudas: −31 a −37 dB de energía no armónica contra −13 a −18 dB del kit incluido, sin la deriva) |
| Filtro | **TPT-SVF**, estable con cualquier corte y resonancia (probado de 20 Hz a 40 kHz y Q hasta 24), con modos pasa-bajos, pasa-banda y pasa-altos |
| Voces | unísono **estéreo**: cada voz en su sitio del panorama y con una deriva lenta de afinación (con la semilla del kit, sin `Math.random`) |
| Envolventes | ataque suave y release exponencial |
| Percusión | bombo en capas (cuerpo, grave sostenido y golpe seco), caja con cuerpo y cresta, hi-hat metálico de seis cuadradas, palma de cuatro ráfagas y crash con brillo |
| Niveles | calibrados contra el kit incluido: casi todo a ±1 dB, así que cambiar de kit no obliga a remezclar |
| Reproducible | mismo proyecto y misma semilla → mismo audio (comprobado) |

`K.syn` acepta las mismas opciones de siempre (`det`, `atk`, `rel`, `w`, `dec`, `lp` en Hz o función del tiempo) y, opcionales: `filt` (`'lp'`, `'bp'`, `'hp'`, `'off'`), `res` (Q, .5–24), `drive` (0–1), `pw` (ancho de pulso), `sub` (sub-oscilador una octava abajo), `noise`, `kt` (seguimiento de tecla), `fenv: [octavas, caída_s]` (el corte sube y cae), `spread` (apertura estéreo) y `drift` (cents). Un plugin que use alguna de las opciones nuevas debe avisar que necesita Evol (con el kit incluido simplemente se ignoran).

**Carácter.** Con Evol (o Ultimate) cargado, en «Demos y plugins» → «Kit de síntesis» aparece el selector **Carácter del kit** (Neutro · Orgánico · Digital; con Ultimate, también Pro y Ultra). Es **global** (vale para toda la canción), se recuerda en el navegador y el siguiente Play vuelve a renderizar. Si abres un proyecto guardado con otro carácter, el estudio **pregunta** si quieres cambiarlo para que suene como se guardó. Para ir más fino (por instrumento o por nota) se usa un plugin o código: `demoKit.character = 'organico'` antes de crear el kit, o `K.syn(…, {character})` para una sola nota. Sin nada, es el neutro.
- `organico`: cada golpe y cada nota varían un poco (nivel, afinación, caída), el filtro «respira» y hay saturación suave, como un equipo analógico.
- `digital`: todo exacto y repetible, con reducción de bits (12) y de frecuencia de muestreo (mantiene cada 2 muestras). Lo aplica `K.add`, así que también afecta a lo que escriban los plugins.

#### Ultimate

`demo-kit-ultimate.js` (v1.0.0) es **Evol más extras opcionales**: rescata lo mejor de las propuestas de Éter y de las versiones Pro, Ultra y Fidelity. Su regla de oro: **nada actúa si no lo pides**; con las opciones de siempre suena igual, muestra por muestra, que Evol.

| Opción de `K.syn` / kit | Qué hace |
|---|---|
| `wavetable`, `wtIndex`, `morph` | tabla de ondas (0 = seno, 1 = cuadrada) |
| `amFreq`, `amDepth` | modulación de amplitud (trémolo rápido) |
| `ringModFreq` | modulación en anillo (timbre metálico) |
| `envSens`, `envAtk`, `envRel` | el filtro se abre según la fuerza de la nota |
| `comb`, `combTime`, `combFb` | filtro en peine |
| `delay`, `delayBeats`, `delayFb`, `delayMix`, `delayTail`, `bpm` | ping-pong estéreo por nota, con la cola sonando después de la nota |
| `lfo` | deriva de afinación lenta y viva |
| `K.kick(…, {fold})` | wavefolding del cuerpo del bombo |
| `demoKit.master = {limit:'maximizer', delay:{…}}` | limitador suave continuo y un delay en el bus maestro (para demos escritas a mano) |

Siempre activo (no cambia el sonido de algo válido): blindaje contra NaN e infinitos en `add`, `K.syn` y `K.mix`. Los caracteres **`pro`** (sinte grueso por defecto: cinco voces desafinadas, apertura estéreo, deriva LFO, bombo con wavefolding y limitador suave en la mezcla) y **`ultra`** (pro con el filtro abriéndose según la fuerza de cada nota) activan esos extras de un golpe; con ellos, `K.syn` sin opciones suena unos 6 dB más bajo que en Evol. Se identifica con `demoKit.info = {id:'ultimate', …}`, así que un proyecto hecho con él lo recuerda. Un plugin puede usar las opciones de Ultimate, pero debe avisar que las necesita (con otro kit simplemente se ignoran); [Forja](#forja-pluginsforjajs) prefiere hacerlo todo por dentro para no depender de ningún kit.

**Pruebas.** `node test_evol.js demo-kit-Evol.js demo_kit.js` (script sin navegador, en el repositorio) revisa el contrato del kit, el determinismo, un barrido de filtros sin NaN, los niveles contra el kit incluido y el carácter. Sirve para probar cualquier kit alterno: `node test_evol.js otro_kit.js demo_kit.js`.

## Usar la música en otros proyectos (librería) lib/

`demokit.min.js` (`demokit.js` es la versión legible, v1.5.0) es el kit, el motor y un reproductor, **sin interfaz**. Carga canciones `.demokit.json` (las del estudio) **o** demos `.js` escritas a mano, las sintetiza en el momento y las reproduce con Web Audio. No hay muestras: la canción es solo código o datos.

```html
<script src="demokit.min.js"></script>
<script>
  // dentro de un clic o toque (los navegadores exigen un gesto para sonar)
  const song = await DemoKit.load('musica/menu.demokit.json', {   // o 'demos/the_void_MK.js'
    onProgress: p => barra.style.width = p * 100 + '%'
  });
  const h = song.play({ loop: true, volume: 0.8, fadeIn: 1 });
  h.stop(1.5);              // con fundido de salida
</script>
```

| | |
|---|---|
| `DemoKit.load(fuente, opciones)` | `fuente`: URL, texto del archivo u objeto de proyecto (con parámetros automatizados, clips horneados, cambios de tempo y de compás; todo se respeta). `opciones`: `onProgress(p)`, `allowPlugins`, `cache` (activa por defecto) |
| `song.play({loop, volume, fadeIn, offset, loopStart, loopEnd})` | devuelve un manejador: `stop(fundido)`, `setVolume(v, fundido)`, `ended` (promesa) |
| `song.stop(fundido)` | detiene todas las reproducciones de esa canción |
| `song.L`, `song.R`, `song.duration`, `song.bpm`, `song.bars`, `song.name`, `song.warnings` | el audio (Float32Array a 44.1 kHz) y sus datos |
| `song.wav()` | `Blob` WAV |
| `song.cached` | `true` si el audio salió de la caché en lugar de renderizarse |
| `DemoKit.clearCache()` | borra la caché (promesa) |
| `DemoKit.unlock()`, `useContext(ctx, destino)`, `setVolume(v)`, `setKit(demoKit)` | integración con tu propio audio |

- **Bucle:** por defecto se repite hasta el final «musical» (`BARS` × compás), sin la cola de 2.5 s; puedes pasar `loopStart` / `loopEnd` en segundos.
- **Tiempo de síntesis:** de 1 a 3 s para una canción de 1.5 minutos (medido en Node con las demos de la carpeta `demos/`); un proyecto corto, una fracción de segundo. Hazlo en la pantalla de carga y guarda el `song`.
- **Caché (IndexedDB):** la primera vez la canción se renderiza y el audio queda guardado en el navegador; las siguientes cargas tardan milisegundos (`song.cached === true`). La llave mezcla el contenido del archivo, la versión de la librería, el código del kit en uso (`setKit` incluido) y `allowPlugins`, así que cualquier cambio la invalida sola. Guarda las 12 más recientes (una canción de 90 s ocupa unos 30 MB). Si IndexedDB no existe o falla (modo privado, Node), se renderiza normal. Desactívala con `{cache:false}`.
- **Versión del kit:** cada proyecto guarda `kit: N`. Si no coincide con la de la librería (o el estudio), `song.warnings` avisa de que puede sonar distinto. Se sube cuando un cambio del kit altera canciones ya guardadas.
- **Plugins:** el código de plugins que traiga un `.demokit.json` **no se ejecuta** salvo que pases `allowPlugins: true` (esas pistas se omiten y aparece un aviso en `song.warnings`). Las demos `.js` sí ejecutan su código: cárgalas solo si son tuyas o confías en ellas.
- **Cualquier demo con `async function render…(sr, onProg)` suena**, aunque no use `demoKit` (por ejemplo Electronic Rush, que lo trae todo integrado); solo las que usan las funciones del kit se pueden convertir en proyecto editable.
- La librería se genera con `build_lib.py` (en `tools/build/`) a partir de los mismos archivos del estudio, para que suenen idéntico.
- **Ojo con los kits alternos:** la librería todavía ignora el `engine` que trae un proyecto. Una canción hecha con Evol o Ultimate sonaría distinta con el kit incluido sin avisar, salvo que cargues antes el mismo kit con `DemoKit.setKit(...)`.
- `ejemplo/libreria.html` es una página mínima que carga y toca las demos de `demos/`, y `ejemplo/exportado.js` es un ejemplo de demo exportada desde el estudio. Necesitan un servidor (por ejemplo `python3 -m http.server` desde la raíz del repo), porque usan `fetch`.
- Los plugins que traiga un proyecto (incluida la voz cantada) solo suenan con `allowPlugins: true`.

## Formato de proyecto (`.demokit.json`)

```jsonc
{
  "format": "demokit-studio", "v": 1, "kit": 1,
  "name": "...", "bpm": 128, "bars": 8, "seed": 20261015,
  "sig": [3, 4],            // compás inicial (solo si no es 4/4); el pulso del proyecto es la negra
  "sigs": [{"bar": 8, "sig": [6, 8]}],   // cambios de compás (opcional); "bar" cuenta desde 0 (8 = el compás 9)
  "tempo": [{"b": 16, "bpm": 90, "ramp": true}],   // cambios de tempo (opcional); "bpm" de arriba es el tempo inicial
  "marks": [{"bar": 0, "name": "Intro"}, {"bar": 8, "name": "Verso"}],   // secciones (opcional); "bar" cuenta desde 0; no cambian el sonido
  "genre": "lofi",          // género con el que se creó (opcional, informativo)
  "prog": {"text": "Am7 | Dm7 G7 | Cmaj7 %"},   // progresión de acordes del proyecto (opcional); la leen los instrumentos con usesProg
  "engine": {"id": "evol", "v": "1.2.0", "c": "organico"},   // kit alterno con el que se hizo y su carácter (opcional; solo si el kit se identifica con demoKit.info)
  "sc": { "mode": "param|table", "depth": 0.7, "rel": 0.12, "rate": 800, "table": "<base64>" },
  "tracks": [{
    "name": "Bajo", "inst": "subfall", "vol": 1, "pan": 0,
    "mute": false, "solo": false, "ducked": true, "sc": false,
    "params": { "gain": 0.45, "decay": 0.9 },
    "notes": [{ "b": 0, "l": 3.6, "m": 36, "v": 1, "pan": 0, "o": {}, "w": "la" }],
    "auto": { "vol": [{"b": 0, "v": 1}], "p:cutoff": [{"b": 4, "v": 800}] },   // opcional: curvas; «p:<parámetro>» = parámetro del instrumento
    "alv": 16,                                   // opcional: niveles de las curvas de parámetro (8 por defecto)
    "fx": { "eq": {"on": true, "low": 2, "mid": 0, "midF": 1000, "midQ": 1, "high": 0},      // opcional: efectos de la pista
            "comp": {"on": true, "thr": -18, "ratio": 3, "atk": 10, "rel": 120, "knee": 6, "makeup": 0, "mix": 1},
            "delay": {"on": false}, "reverb": {"on": false} }
    // las curvas de efectos van en "auto" con claves «fx:<grupo>.<parámetro>»: "fx:eq.low", "fx:eq.mid", "fx:eq.midF", "fx:eq.high",
    //   "fx:comp.thr", "fx:comp.makeup", "fx:comp.mix", "fx:delay.mix", "fx:reverb.mix"
  }],
  "master": { "low": 0, "high": 0, "gain": 1, "limit": true, "ceil": 0.97 },   // opcional
  "clips": { "c1": "<base64 int16>" },
  "plugins": [{ "id": "...", "name": "...", "code": "..." }]
}
```

`b` = pulso de inicio, `l` = largo en pulsos, `m` = nota MIDI (en percusión, el carril), `v` = velocidad, `o` = parámetros propios de esa nota, `w` = palabra de la nota (instrumentos con letra). `kit` es la versión del kit con que se guardó (si no coincide, la librería avisa en `song.warnings`).

**Formato compacto** (`"v": 2`, el de «⬇ Compacto»): las notas van como arreglos `[b, l, m, v, pan, o, w]` en `n` (los últimos valores se omiten si son los de fábrica: `[0, 0.5, 60]` es una nota con velocidad 1 y sin paneo) y `params` solo trae lo que difiere del instrumento. El estudio y la librería leen los dos formatos.

## Géneros (`genres/`)

Un archivo de géneros es un `.json` con una lista; cada género describe qué proponer al crear un proyecto nuevo:

```jsonc
{
  "format": "demokit-genres",
  "genres": [{
    "id": "reggae", "name": "Reggae",
    "desc": "Pulso relajado con el golpe en el contratiempo…",
    "bpm": [60, 90, 75],           // mínimo, máximo y típico
    "sig": [4, 4],                 // compás
    "keys": ["Mayor", "Menor natural", "Pentatónica menor", "Mixolidia"],   // escalas afines (nombres como en el selector)
    "inst": {                      // instrumentos afines por categoría (ids del estudio o de plugins instalados)
      "perc": ["kick", "snare", "hat", "rim"], "mel": ["pluck", "bell"], "acomp": ["sub", "pad"], "fx": ["wash"]
    },
    "structures": [                // una o más; cada sección es [nombre, compases]
      { "name": "Corta", "sections": [["Intro", 4], ["Verso", 8], ["Coro", 8], ["Outro", 4]] }
    ]
  }]
}
```

El total de una estructura no puede pasar de 256 compases. Los ids de instrumento que no existan se ignoran. Para sumar un género: suelta el archivo en la ventana, ponlo en `genres/` (aparece en **En el repositorio → Géneros**) o crea uno desde el panel ✨ Género. Los instrumentos del estudio se reparten así: **percusión** (bombo, caja, palma, chasquido, hi-hat, crash, rim, clip), **melódicos** (sinte, pluck, campana, chop), **acompañamiento** (pad, supersaw, arpegio, sub, reese, growl) y **efectos** (riser, barrido, viento, impacto); un plugin cae en la categoría que declare con `cat` (`'perc'`, `'mel'`, `'acomp'` o `'fx'`) y, si no declara ninguna, en percusión o melódicos según su `kind`.

## Arquitectura

Todo vive en un solo `<script>` dentro del HTML:

| Parte | Responsabilidad |
|---|---|
| `demo_kit.js` | el kit de síntesis (osciladores, percusión, campana, chop, mezcla con sidechain y saturación suave) |
| Motor | registro de instrumentos, render por pista con caché de stems, mezcla, conversión de demos, WAV, (de)serialización. No toca el DOM |
| Interfaz | piano roll en `<canvas>`, pistas, inspector, modales, wake lock, carga de archivos |

El render es determinista (misma semilla → mismo audio) y se hace por bloques cediendo el hilo para que la interfaz no se congele.

**Construir desde las fuentes (`tools/build/`).** `index.html` y `demo_kit_studio.html` se generan: no se editan a mano. Las fuentes viven en `tools/build/src/` (`head.html`, `demo_kit.js`, `engine.js`, `ui.js`, `genres.js`, `tail.html`…) y `python3 tools/build/build.py` las une, escribe los dos HTML y reescribe solo la versión de `sw.js` (un hash del contenido, así que la app instalada se actualiza sin que nadie se acuerde de subir el número). `build_lib.py` hace lo mismo con la librería.

**Cómo funciona el render por pista.** Cada pista se renderiza en su propio kit y se guarda como un *stem* (audio de 16 bits recortado al tramo con sonido). La clave de caché de una pista es un hash de su instrumento, parámetros, paneo, notas, tempo, compases y versión del plugin o del kit, así que cualquier cambio que afecte el sonido invalida solo esa pista. La mezcla final (sidechain, saturación suave, fundido y limitador) se hace aparte con el `K.mix` del kit, y a ella llegan el volumen, el mute y el solo. Cada pista usa una semilla propia derivada de su identificador, de modo que dos pistas de ruido (el hi-hat y la caja, por ejemplo) no repiten la misma secuencia.

## Notas y límites conocidos

- El primer render de un proyecto completo tarda unos segundos (1.5–4 s con las demos incluidas, medido en Node). Después, con la caché, un cambio pequeño tarda de 0.1 a 1 s.
- La caché de stems ocupa memoria: unos 60–170 MB con las demos incluidas. Tiene un tope de 320 MB; al pasarlo se desalojan primero las pistas que no están sonando (se renderizan de nuevo cuando las necesites).
- Un stem exportado pasa por el mismo sidechain y saturación suave del master, solo con esa pista. La suma de todos los stems no es bit a bit idéntica al WAV de la mezcla completa, porque la saturación y el limitador no son lineales.
- El autoguardado en el navegador no se activa en proyectos con clips horneados (serían demasiado grandes): guarda con «Guardar».
- En iOS/Safari, el audio solo arranca tras un gesto del usuario (el botón Play ya lo es).
- Los parámetros del **instrumento** se automatizan escalonados por nota (8/16 niveles) salvo que hornees el barrido; los de los **efectos** (EQ, compresor, mezcla de delay y reverb) sí son continuos, pero no todos: el resto (razón, ataque, tiempo del delay, tamaño de la reverb…) no se automatizan. El paneo automatizado actúa como balance sobre el paneo fijo de la pista.
- Los clips horneados (barridos y conversiones) pesan: se guardan como audio dentro del proyecto. «⬇ Compacto» avisa cuánto.
- La demo exportada no es legible como código de síntesis (es el motor más los datos del proyecto); si quieres una demo escrita a mano, usa la guía de arriba.
- El MIDI exportado lleva las notas, no el sonido ni la automatización. Los efectos por pista (EQ, compresor, delay y reverb) tampoco viajan en el MIDI.
- La reverb tiene cola de ~0.8 s (tamaño .2) a ~5 s (tamaño 1) y su nivel está calibrado de forma aproximada, afínalo de oído. Los efectos añaden a la caché (unos 230 MB en The Void con 5 pistas con efectos; tope 320 MB).
- La grabación compensa la latencia de salida que reporta el navegador (ver «Latencia» arriba), pero con Bluetooth conviene calibrarla.

## Créditos

Demo Kit es de Brujo, hecho con la ayuda de varias IAs. **Ámbar** es Claude Sonnet 5.5, **Velvet** es ChatGPT y **Éter** es Gemini.

* Síntesis y estudio: Brujo, con Ámbar.
* Icono y banner: Velvet.
* Kit de síntesis (`kits/demo_kit.js`, `kits/demo_kit_comentado.js`) y librería (`lib/`): Ámbar.
* Secciones, géneros, categorías de instrumentos, marcadores MIDI, revisión de kits y kit Evol: Ámbar, a partir de ideas de Brujo y de una propuesta inicial de Éter para los géneros.
* Kit Ultimate: Ámbar, rescatando las propuestas de Éter y las versiones Pro, Ultra y Fidelity.
* Versiones de plugins, progresión de acordes y ayuda de acordes, edición táctil, avisos de notas que se pisan, ajuste del largo al exportar, panel de apariencia, secciones y puntitos del inspector: Ámbar, a partir de ideas y pruebas de Brujo.
* Forja, Batería de pads, patrones escritos de la guitarra: ideas de Brujo, construidos por Ámbar.

**Datos de referencia.** El patrón de bossa de la guitarra se afinó midiendo anotaciones de **GuitarSet**: Qingyang Xi, Rachel M. Bittner, Johan Pauwels, Xuzhou Ye y Juan P. Bello. (2019). *GuitarSet* (Version 1.1.0) [Dataset]. Zenodo. 19th International Society for Music Information Retrieval Conference (ISMIR), París, Francia. https://doi.org/10.5281/zenodo.3371780. El repositorio del conjunto usa licencia MIT y el registro de Zenodo, Creative Commons Attribution 4.0 (la cita solo se pide en publicaciones académicas; aquí se incluye de todos modos). Solo se usaron las anotaciones (tiempos y notas) para medir el ritmo y la manera de rasguear; no se incluye ni se reproduce audio del conjunto.

**Demos (`demos/`)**

| Archivo | Autoría |
|---|---|
| `cotton_sugar_MK.js` | Ámbar |
| `dark_matter.js` | Ámbar |
| `ejemplo_metrico.js` | Ámbar |
| `ejemplo_minimo.js` | Ámbar |
| `electronic_rush.js` | Ámbar |
| `event_horizon.js` | Ámbar |
| `kinetic_drift.js` | Éter |
| `la_casa_que_respira.js` | Ámbar |
| `marshmallow_sky.js` | Ámbar |
| `neon_tidal.js` | Velvet |
| `phantom_minds_ear.js` | Velvet |
| `the_void_MK.js` | Ámbar |
| `yo_soy_nan.js` | Éter |
| `marea_de_ceniza.js` | Ámbar |

**Plugins (`plugins/`)**

| Archivo | Autoría |
|---|---|
| `aether_choir.js` | Velvet |
| `automata_vocal.js` | Velvet y Ámbar (a partir del *Autómata Vocal* de Brujo) |
| `neuro_bloom.js` | Velvet |
| `theremin_fantasma.js` | Ámbar |
| `cristal_fm.js` | Ámbar |
| `guitarra_acompanante.js` | Ámbar (la idea de programar el acompañamiento salió de la «guitarrita» de Éter) |
| `forja.js` | Ámbar, a partir de la idea de Brujo del «instrumento supremo» |
| `bateria_pads.js` | Ámbar, a partir de la idea de Brujo |

**Kits alternos (`kits/bootleg/`)**

| Archivo | Autoría |
|---|---|
| `demo-kit-Evol.js` | Ámbar |
| `demo-kit-ultimate.js` | Ámbar, a partir de los kits originales de Brujo y Éter (Pro, Ultra, Ultimate y Fidelity) |

**Géneros (`genres/`)**

| Archivo | Autoría |
|---|---|
| `reggae.json`, `latinos.json`, `electronica.json` | Ámbar |

**Proyectos**

| Carpeta | Autoría |
|---|---|
| `project_examples/` (los ejemplos oficiales: demos convertidas a proyecto y rolas hechas en el estudio, como *Marea de ceniza*, *Sueños sin dientes* y *La rotita*) | Ámbar |
| `projects/` (proyectos que no son oficiales o no son de Ámbar; sirve de carpeta de prueba para quien clone el repo): una pieza de Brujo y `Nexo_Latente.demokit.json` | Brujo y Éter |
