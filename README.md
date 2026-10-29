<div align="center">

![Demo Kit — Make sound from code](assets/banner.png)

# Demo Kit

**Make sound from code.**
Un pequeño estudio de síntesis procedural que corre en el navegador: piano roll, capas, instrumentos parametrizables y plugins, todo sobre `demo_kit.js`.

### 🎹 [Abrir Demo Kit en el navegador](https://mialmoga.github.io/demo-kit/)

</div>

---

## Qué es

Demo Kit es un DAW de juguete (pero poderoso) contenido en **un solo archivo HTML**, sin dependencias, sin servidor, sin archivos de audio. Todo el sonido se calcula muestra a muestra en JavaScript con el kit de síntesis `demo_kit.js` (que va incrustado), el mismo que genera las demos *The Void* y *Cotton Sugar*.

Se pueden componer piezas desde cero, o **cargar una demo y convertirla en un proyecto editable** (pistas, notas y parámetros) para ver cómo está construida.

## Uso rápido

1. Abre la versión en línea: **<https://mialmoga.github.io/demo-kit/>**. O descarga `demo_kit_studio.html` y ábrelo con doble clic (no necesita servidor; el favicon y las imágenes vienen de `favicon.ico` y `assets/`, así que sin ellos el HTML funciona igual pero sin iconos).
2. «Demos y plugins» → «Cargar proyecto de ejemplo», y dale **Play**.
3. O arrastra `the_void.js` / `cotton_sugar.js` a la ventana y pulsa **«✎ Convertir en editable»**.

> El audio solo se genera cuando pulsas Play o WAV: Demo Kit renderiza el proyecto completo y luego lo reproduce. Si cambias algo, el indicador de arriba a la derecha muestra «cambios sin renderizar» y el siguiente Play vuelve a renderizar.

## Funciones

- **Piano roll** con rejilla (1/4 a 1/32, tresillos o libre), zoom, notas fantasma de las otras pistas, selección múltiple, velocidad por nota y deshacer.
- **Pistas / capas ilimitadas**, cada una con su instrumento, volumen, paneo, mute y solo.
- **Instrumentos base parametrizables** (cada uno con sus sliders):
  - *Melódicos:* Sinte genérico, Supersaw, Pluck, Arpegio cuadrado, Pad, Sub, Sub con caída, Reese, Growl, Campana, Chop vocal.
  - *Percusión y efectos:* Bombo, Caja, Palma, Chasquido, Hi-hat (cerrado/abierto), Crash, Riser, Barrido, Viento, Impacto, Rim.
- **Sidechain:** las pistas «ducked» (la música) bajan de volumen cada vez que suena una pista marcada como disparador (normalmente el bombo). Profundidad y relajación ajustables.
- **Tocar en vivo** la pista activa con el teclado de la compu o con un controlador MIDI, para afinar parámetros escuchando (ver [abajo](#tocar-en-vivo)).
- **Grabar lo que tocas** en el piano roll, con cuenta previa, cuantizado, bucle con overdub y un solo `Ctrl+Z` por toma (ver [abajo](#grabar-lo-que-tocas)).
- **Plugins:** instrumentos nuevos escritos en JavaScript, con editor integrado.
- **Demos editables:** convierte las demos del kit en proyectos con pistas y notas.
- **Pantalla activa** mientras suena (Wake Lock, con un video invisible de respaldo en navegadores que no lo soportan).
- **Exportación a WAV** (estéreo, 16 bits, 44.1 kHz). No hay exportación MIDI a propósito: el kit suena mejor que cualquier sinte MIDI genérico.
- **Guardar / cargar** proyectos `.demokit.json`.

## Controles

| Acción | Cómo |
|---|---|
| Crear nota | clic en el piano roll |
| Alargar al crear | clic y arrastrar |
| Cambiar el largo | arrastrar el borde derecho de la nota |
| Mover | arrastrar la nota (también vertical para cambiar el tono) |
| Seleccionar varias | `Shift` + arrastrar un recuadro, o `Shift` + clic |
| Borrar | `Supr` / `Retroceso`, clic derecho sobre la nota, o modo «Borrar» |
| Duplicar selección | `Ctrl/⌘ + D` |
| Seleccionar todo | `Ctrl/⌘ + A` |
| Deshacer | `Ctrl/⌘ + Z` |
| Mover selección | flechas (`Shift`: 1 pulso / 1 octava) |
| Punto de inicio de reproducción | clic en la regla de compases (`Inicio` lo lleva a 0) |
| Play / Stop | `Espacio` |
| Zoom | botones ＋ / −, o `Ctrl` + rueda |
| Escuchar una tecla | clic en el teclado de la izquierda |

En pantallas táctiles hay un modo **✋ Navegar** para desplazarse con el dedo sin dibujar notas.

## Tocar en vivo

Con el botón **⌨ Tocar** activo, el teclado de la compu toca la pista seleccionada, como en FL Studio o Ableton. Mueve un slider del inspector, toca una tecla y escucha cómo cambia el sonido.

```
 2 3   5 6 7   9 0          fila de arriba:  octava de arriba (empieza en la octava +1)
Q W E R T Y U I O P

  S D   G H J   L ;         fila de abajo:   octava base (por defecto C4)
 Z X C V B N M , . /
```

- **Octava:** `−` / `=` (o los botones de la barra). La octava base se muestra junto al botón.
- **Percusión:** en pistas de un solo carril (bombo, caja…) cualquier tecla del mapa lo dispara. En pistas de varios carriles (hi-hat: cerrado/abierto), las teclas `Z X C V B N M` son los carriles 1, 2, 3…
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
- **Pedal de sustain** (MIDI): la nota grabada dura hasta que sueltas el pedal. La velocidad MIDI se guarda en cada nota.
- **Percusión:** las notas se graban en el carril correspondiente con largo fijo.
- Si cambias de pista durante la toma, las notas abiertas se cierran en su pista.
- Las notas grabadas no suenan en el acompañamiento hasta el siguiente render (Play vuelve a renderizar solo si hubo cambios). Mientras tocas, oyes tu instrumento en vivo, así que se siente igual.
- Si pasas del último compás, el proyecto se extiende solo (fuera de bucle).

## Convertir una demo en proyecto editable

Las demos del kit son funciones `async function renderXxx(sr, onProg)` que llaman a `K.kick`, `K.syn`, `K.bell`… directamente. Demo Kit las **ejecuta con un kit «grabador»**: cada llamada queda registrada (momento, parámetros, canal) en vez de sonar, y luego se agrupa en pistas con sus notas y parámetros más comunes. La curva de sidechain de la demo se guarda como tabla.

Resultado actual con las demos incluidas:

| Demo | Pistas | Notas |
|---|---|---|
| Cotton Sugar | 15 | 1928 |
| The Void | 17 | 1693 |

Límites a tener en cuenta:

- **No es idéntica muestra por muestra.** Las fases iniciales de los osciladores y el ruido salen de un generador que cambia con el orden de las llamadas. La energía por segundo coincide (diferencia media de ~3 % en Cotton Sugar y ~1 % en The Void), pero no son bit a bit iguales.
- Los `add()` con funciones propias que no se pueden parametrizar (el sub del drop de The Void, por ejemplo) quedan como pista **«Clip»** con audio horneado. Funcionan, pero no son editables, y hacen que el proyecto guardado pese más (≈ 9 MB en The Void). Rehacer esa pista con un instrumento como «Sub con caída» la vuelve editable.
- Los ajustes que cambian nota por nota (un filtro que se abre a lo largo de una sección, por ejemplo) se conservan por nota y se marcan con un punto blanco; hay un botón para unificarlos con los controles de la pista.
- La conversión reconoce funciones auxiliares conocidas (`reese`, `growl`, `rim`, `wash`, `impact`) por su nombre. Una demo con helpers nuevos los trata como `add()` horneados.

## Plugins (instrumentos propios)

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
| `kind` | `'melodic'` o `'perc'` |
| `params` | lista de controles; aparecen como sliders en el inspector. Tipos: número (`min`, `max`, `step`, `def`) y `type:'choice'` con `opts` y `vals` |
| `lanes` | solo `perc`: carriles del piano roll (`[{name:'Cerrado'},{name:'Abierto'}]`) |
| `oneShot` | las notas se dibujan cortas (sonidos que no dependen del largo) |
| `play(K, n)` | se llama una vez por nota |

**`n` (la nota)**

`t` (segundo de inicio) · `len` (segundos) · `midi` · `hz` · `lane` · `a` (amplitud: velocidad × volumen de pista) · `pan` · `p` (parámetros de la pista) · `buf` (canal destino) · `bpm` · `beat` · `bar` · `sr` · `note` · `clips`.

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
- Si cargas **tu propio `demo_kit.js`** (con funciones nuevas), los instrumentos y plugins lo usan desde ese momento: lo que agregues a `K` queda disponible para los plugins.

## Formato de proyecto (`.demokit.json`)

```jsonc
{
  "format": "demokit-studio", "v": 1,
  "name": "...", "bpm": 128, "bars": 8, "seed": 20261015,
  "sc": { "mode": "param|table", "depth": 0.7, "rel": 0.12, "rate": 800, "table": "<base64>" },
  "tracks": [{
    "name": "Bajo", "inst": "subfall", "vol": 1, "pan": 0,
    "mute": false, "solo": false, "ducked": true, "sc": false,
    "params": { "gain": 0.45, "decay": 0.9 },
    "notes": [{ "b": 0, "l": 3.6, "m": 36, "v": 1, "pan": 0, "o": {} }]
  }],
  "clips": { "c1": "<base64 int16>" },
  "plugins": [{ "id": "...", "name": "...", "code": "..." }]
}
```

`b` = pulso de inicio, `l` = largo en pulsos, `m` = nota MIDI (en percusión, el carril), `v` = velocidad, `o` = parámetros propios de esa nota.

## Arquitectura

Todo vive en un solo `<script>` dentro del HTML:

| Parte | Responsabilidad |
|---|---|
| `demo_kit.js` | el kit de síntesis (osciladores, percusión, campana, chop, mezcla con sidechain y saturación suave) |
| Motor | registro de instrumentos, render de proyectos, conversión de demos, WAV, (de)serialización. No toca el DOM |
| Interfaz | piano roll en `<canvas>`, pistas, inspector, modales, wake lock, carga de archivos |

El render es determinista (misma semilla → mismo audio) y se hace por bloques cediendo el hilo para que la interfaz no se congele.

## Notas y límites conocidos

- Un render completo tarda unos segundos (2–6 s para proyectos del tamaño de las demos en un portátil normal).
- El autoguardado en el navegador no se activa en proyectos con clips horneados (serían demasiado grandes): guarda con «Guardar».
- En iOS/Safari, el audio solo arranca tras un gesto del usuario (el botón Play ya lo es).
- No hay exportación MIDI, ni efectos por pista (reverb/delay): por ahora todo pasa por el sidechain y la saturación suave del kit.
- La grabación **no compensa la latencia** de tu equipo (teclado, interfaz de audio o Bluetooth); el tiempo se toma cuando llega la tecla o el mensaje MIDI. Con audífonos Bluetooth puede sentirse desfasada.

## Créditos

- Síntesis y estudio: Brujo, con Claude.
- Icono y banner: Velvet.
