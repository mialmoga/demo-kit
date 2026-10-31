# Demo Kit · referencia para escribir demos a mano

Hoja pensada para una IA (o una persona con prisa). Una **demo** es un archivo `.js` con una función `async` que sintetiza una canción completa con `demoKit` y devuelve el audio. No hay muestras ni librerías: todo se calcula muestra a muestra. La fuente de verdad es [`demo_kit.js`](demo_kit.js); esta hoja resume su uso. Un ejemplo mínimo para copiar está en [`../demos/ejemplo_metrico.js`](../demos/ejemplo_metrico.js).

## 1. Molde (copia y cambia)

```js
// ── Título de la demo · lo que quieras ──      ← el texto antes del primer «·» o «──» es el nombre
async function renderMiCancion(sr, onProg) {      // el nombre empieza con «render»
  const K = demoKit.metric(sr, 120, 16, 2.5, 20261015);   // (sr, BPM, BARS, cola en s, semilla)
  const { beat, bar, T } = K;                     // beat y bar en segundos · T(compás, pulso) → segundos

  for (let b = 0; b < 16; b++) {
    for (let i = 0; i < 4; i++) K.kick(T(b, i), 1);       // bombo en cada pulso
    K.snare(T(b, 1), .8); K.snare(T(b, 3), .8);
    K.syn(K.mu, T(b, 0), beat * 3.5, K.hz(45), .3, 0, { w: 2 });   // bajo senoidal (¡siempre pasa el objeto de opciones!)
    if (b % 4 === 3) { if (onProg) onProg(b / 16); await sleep(0); }   // progreso + ceder el hilo
  }
  return K.mix([0, 0, .8, .8, .8, .8, .8, .8, .8, .8, .8, .8, .8, .8, .8, .8], .13);   // devuelve {L, R, dur}
}
```

Reglas del contrato:
- Exactamente una función `async function render…(sr, onProg)`; `sr` es la frecuencia de muestreo (44100). `onProg(p)` es opcional (0..1).
- Termina siempre con `return K.mix(...)`. Devuelve `{L, R, dur}` (`Float32Array` estéreo + segundos).
- `sleep(ms)` existe como global en el estudio y en la librería. Fuera de ellos defínelo: `const sleep = ms => new Promise(r => setTimeout(r, ms));`.
- La forma clásica `demoKit(sr, segundos, semilla)` también vale (entonces pon `// BPM = 120 | BARS = 16` en un comentario para que el convertidor los encuentre). **Usa `demoKit.metric`**: BPM y BARS salen de la propia llamada.
- Determinista: misma semilla → mismo audio. El ruido sale de un solo generador, así que el **orden** de las llamadas importa un poco.

## 2. Tiempo

| | |
|---|---|
| `K.beat`, `K.bar` | duración de un pulso y de un compás (s) |
| `K.T(compás, pulso)` | segundos; ambos desde 0 y pueden ser fraccionarios: `T(2, 1.5)` = compás 3, pulso 2 y medio |
| `K.BPM`, `K.BARS` | los valores de la llamada |
| `K.hz(m)` | MIDI → Hz (`K.hz(69)` = 440). `syn` recibe **Hz**; `bell` y `chop` reciben **MIDI** |

Divisiones comunes: corchea `T(b, i/2)`, semicorchea `T(b, i/4)`, tresillo de corchea `T(b, i/3)`.

## 3. Funciones (todas con `K.`)

`t0` = inicio en segundos · `a` = amplitud · `pan` = −1 (izq) … 1 (der) · `len` = duración en segundos.

| Función | Firma | Notas |
|---|---|---|
| `kick` | `(t0, a, {lo=46, hi=151, k=30, dec=6.5, len=.45, click=.3})` | `lo` grave final, `hi` inicio del barrido, `dec` caída. Opciones opcionales |
| `snare` | `(t0, a, {tone=185, nd=20, td=28, len=.25})` | `nd` caída del ruido, `td` caída del tono |
| `clap` | `(t0, a)` | palma |
| `snap` | `(t0, a, pan)` | chasquido |
| `hat` | `(t0, a, abierto, pan)` | `abierto` true/false |
| `crash` | `(t0, a, len=2.4)` | |
| `syn` | `(buf, t0, len, f, a, pan, o)` | sintetizador. `buf` = `K.mu` (música, recibe sidechain) o `K.dr` (batería, no). `f` en **Hz**. **`o` es obligatorio** (puede ser `{}`) |
| `bell` | `(t0, midi, a, pan, len=1.4)` | campana / caja de música (siempre en `mu`) |
| `chop` | `(t0, len, midi, a, pan, vocal='oh')` | sílaba cantada; vocal: `'oh' 'ah' 'ee' 'oo'` |
| `riser` | `(t0, len, a)` | ruido que sube; úsalo antes de un drop |
| `sweep` | `(t0, len, f0, f1, a)` | seno que sube de `f0` a `f1` Hz |
| `add` | `(buf, t0, len, fn, amp, pan)` | **la base de todo**: `fn(t)` devuelve una muestra (−1..1), `t` = segundos desde `t0`. Úsalo para sonidos propios |
| `mix` | `(duck, dk=.13)` | cierra la canción (ver §5) |

Opciones de `syn` (`o`):

| Opción | Significado | Por defecto |
|---|---|---|
| `w` | onda: 0 sierra, 1 cuadrada, 2 seno | 0 |
| `det` | arreglo de desafines en cents, una voz por elemento: `[-12, 0, 12]` | `[0]` |
| `atk`, `rel` | ataque y cierre (s) | .004, .06 |
| `dec` | caída exponencial por muestra del volumen (0 = sostenido; ~1.5–3 = pluck) | 0 |
| `lp` | filtro pasa-bajos: número (Hz) o función `t => Hz` | 3000 |

Ejemplos que se convierten bien: `lp: t => 900 + 4500 * Math.exp(-t * 14)` (el filtro se cierra: pluck), `det: [-16, -6, 5, 16]`.

Niveles orientativos de `a`: kick 1 · snare .8 · hat .2–.4 · bajos .3–.45 · pads y arpegios .08–.15 · campanas .1. `mix` limita el pico a .92, así que no hace falta ser preciso, pero si todo está a 1 se aplasta.

## 4. Canales y sidechain

Hay dos canales: **`K.dr`** (batería, intacto) y **`K.mu`** (música, se agacha con cada bombo). Casi todo lo melódico va en `K.mu`; los bajos que deben sonar «pegados» al bombo también.

## 5. Cierre: `K.mix`

- `K.mix([..un número por compás..], dk)` → `0` = sin sidechain, `.8` = fuerte; la música vuelve en cada pulso con constante `dk` (≈ .13 s).
- `K.mix(t => ganancia)` → control total: devuelve la ganancia de `mu` (1 = sin agachar) en el instante `t`.
- Incluye saturación suave, fundido de salida y tope de nivel.

## 6. Qué se convierte en proyecto editable (estudio → «Convertir en editable»)

| En la demo | En el estudio |
|---|---|
| `K.kick/snare/clap/snap/hat/crash` | pistas de batería |
| `K.syn(...)` | pistas «Sinte», agrupadas por onda, envolvente y desafine; `lp` como `t => A + B*Math.exp(-t*C)` o número queda editable |
| `K.bell/chop/riser/sweep` | sus instrumentos con parámetros |
| funciones propias **definidas en la demo** con estos nombres: `reese`, `growl`, `rim`, `wash`, `impact`, `bell` | instrumentos propios (se reconocen por nombre y firma, ver abajo) |
| `K.mix(...)` | curva de sidechain |
| `K.add(...)` con tu propia `fn` | **clip horneado**: suena igual pero no es editable y pesa. Evítalo si quieres editar; para sonidos nuevos usa un plugin |

Firmas reconocidas de las funciones propias: `reese(t0, len, midi, a, {lfo, lo, hi, drive})` · `reese(t0, len, Hz, a, rate, open)` (versión de 4 sierras) · `growl(t0, len, midi, a, rate)` · `rim(t0, a, pan)` · `wash(t0, len, a, fc)` · `impact(t0, a)` · `bell(t0, midi, a, pan, len)`.

No se convierte (queda fuera del proyecto): procesado hecho **después** de `K.mix` sobre `L`/`R`, y cualquier cosa que no pase por las funciones del kit. Una demo así igualmente suena en la librería y se puede bajar a WAV; solo que no se vuelve editable.

## 7. Trampas frecuentes

- `K.syn` sin el objeto `o` → error. Pasa `{}` como mínimo.
- Pasar MIDI a `syn` o Hz a `bell`/`chop`: suenan graves o agudos de más.
- Olvidar `return K.mix(...)`, o llamar a `mix` dos veces.
- Pasar pulsos donde se esperan segundos: usa siempre `T(compás, pulso)` o `beat * n`.
- Notas más largas que la canción se recortan solas; la cola de 2.5 s deja respirar la reverberación del final.
- Rendimiento: una canción de 90 s tarda de 1 a 3 s. Cede el hilo cada pocos compases con `await sleep(0)` para que la barra de progreso se mueva; evita bucles de miles de llamadas a `add` con funciones pesadas.

## 8. Cómo oír y probar

- **Estudio** (`demo_kit_studio.html`): «Demos y plugins» → suelta el archivo → «▶ Original» o «✎ Convertir en editable».
- **Librería** (`lib/demokit.min.js`): `const song = await DemoKit.load('mi_demo.js'); song.play({loop:true})`.
- Si la demo usa `makeKit` (de `make_kit.js`) también funciona: el estudio y la librería lo adaptan solos.
