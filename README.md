# Cover de Genesis · Orquesta de Laptops UC + guitarra

Propuesta de obra de Felipe Osorio (Tarea 1). Hub web para interpretar **“genesis”** de Robin Callaway (álbum *i saw an angel in the mirror*, 2024) con la Orquesta de Laptops UC.
Cada integrante abre la página, elige su perfil y toca desde el navegador. No hay que instalar nada.

## Perfiles (dotación de la propuesta)

| Perfil | Rol |
|---|---|
| 🎸 Guitarra | Guitarra real o sintetizada. Con guitarra real, la página sirve para el reloj, las entradas y las luces. |
| 🥁 Batería | Pads y patrones: **pulso** (intro), **sin platillos**, **con platillos** y **muro**. Puede manejar las luces. |
| 🎹 Teclados medios/altos 1 y 2 | Líneas medias. Suben a registro alto en 1:45. El 2 hace la subida de 1:27 y el desfase de 1:54. |
| 🎹 Teclados bajos/medios 1 y 2 | Línea grave. Al final hacen la 2.ª línea melódica y resuelven. |
| 🌊 Ambiente · teclados bajos permanentes | La 1.ª línea grave que se sostiene. X = distorsión, Y = volumen. Controla los colores (de azul a rojo). |
| 🌫️✨💠 Ambientes extra (opcionales) | Si hay integrantes extra: ruido, brillo y pulso, con colores. Se ocultan con `ocultar` en la partitura. |
| 🎼 Pistas MIDI · Multipista (opcional) | Todas las pistas MIDI del arreglo a la vez, cada una con su sonido: silenciar, solo, bucles, reverso, cruce. Para ensayar o remezclar en vivo. |

Cada pantalla muestra **▶ TOCAS / ⏸ SILENCIO**, cuánto falta para entrar o parar, una barra de carga de la sección y las instrucciones.
Los teclados tienen control de **distorsión**. Guitarra y batería tienen botón de **luces** para proyectar colores si no hay integrantes extra.

## Cómo se usa en un ensayo

1. Abre `index.html`, o la página publicada en GitHub Pages.
2. *(Opcional)* Elige una **hora de inicio común**. Todas las laptops parten a esa hora usando su propio reloj, así que conviene que los relojes estén sincronizados con internet (en Windows/macOS lo están por defecto).
3. Cada integrante elige su perfil y presiona **Activar audio y entrar**.
4. Sin hora común, cualquiera puede usar **▶ Iniciar ahora**. Para practicar, usa **Ir a sección** o haz clic en la línea de tiempo.

## Editar la obra: `js/partitura.js`

Es el único archivo que hay que tocar para adaptar la obra:

- `bpm`, `compas`, `duracion`
- `ocultar`: perfiles que no se muestran en el hub
- `secciones`: para cada sección, su `nombre`, `inicio` ("m:ss"), `acordes`, `compasesPorAcorde`, `colores` (uno por acorde), `tocan` (quién toca) e `instrucciones` por perfil
- `eventos`: avisos que aparecen en pantalla en un tiempo dado
- `sonidos`: archivos de la carpeta `sonidos/` que reemplazan los sintetizados por defecto
- `midi`: las pistas MIDI (`pistas`) y cuál toma cada perfil al entrar (`porPerfil`)
- `guiaXY`: dónde debe ir el punto X/Y de los ambientes en cada momento

Claves para `tocan`, `instrucciones` y `eventos`: `todos`, `guitarra`, `bateria`, `teclados`, `teclados-altos`, `teclados-bajos`, `teclado-1`…`teclado-4`, `ambiente`, `ambiente-principal`, `ambiente-extra`, `ambiente-1`…`ambiente-4`.
Cada músico ve las instrucciones de "todos", las de su grupo y las propias.

> La estructura (Intro / Desarrollo / Outro, 13 partes) y la dotación salen de la propuesta. El tempo (130 BPM) y los acordes (B♭m7 ↔ G♭maj7, resolución en D♭) se midieron en la grabación, y los tiempos de la propuesta se ajustaron al inicio de compás más cercano.
> La intro es **alargable**: el ambiente puede empezar antes y el director inicia el reloj cuando quiera seguir.

## Practicar con la orquesta

Cada perfil tiene un panel **🎧 Practicar con la orquesta**. Al activarlo, los demás instrumentos suenan con sus pistas MIDI (la de `midi.porPerfil` de cada uno), sincronizados con el reloj. Tú tocas tu parte encima.

- **Según la partitura**: cada instrumento entra y calla como dice `tocan` en cada sección. Cada fila muestra en vivo **▶ toca / ⏸ calla**. **Todo el arreglo** hace sonar todas las pistas siempre.
- Cada instrumento se puede activar o desactivar y tiene su propio volumen. Hay atajos: **Todos**, **Base: batería + bajos** y **Ninguno**, más un volumen general.
- Tu propia parte aparece apagada; puedes encenderla para escucharla de referencia. Los ambientes extra (opcionales) parten apagados.
- Parte y para con el reloj de la obra. Para practicar un tramo, elige la sección en «Ir a sección…» y presiona **▶ Iniciar ahora**. Las notas largas que ya venían sonando (como el drone del ambiente) entran aunque partas a la mitad.
- Lo que elijas queda guardado en el navegador para tu perfil.

## Pistas MIDI

Las pistas del arreglo están en `midi/` (melodía, medio, pad, bajo, pedal F, ambiente y batería). Están a 130 BPM y empiezan en 0:00, así que calzan con el reloj de la obra.
Cada perfil tiene abajo un panel **🎼 Pistas MIDI** para tocar una pista con **su propio instrumento**: los controles del perfil (filtro, distorsión, fuzz, X/Y del ambiente) también la afectan. Cada perfil parte con una pista (`midi.porPerfil` en la partitura), pero se puede elegir cualquiera.

**Modos**
- **Seguir la obra** (`M`): la pista suena alineada con el reloj. Si el reloj está detenido, corre sola desde la posición de práctica.
- **Pulsar en orden** (`N`): tú pones el ritmo. Cada pulsación toca la nota o el acorde siguiente de la pista.
- **Pulsar lo que suena** (`N`): cada pulsación toca lo que la pista tiene sonando en ese momento de la obra.

**Transformaciones** (se pueden combinar)
- **Bucle** (`C`): repite ¼, ½, 1, 2 o 4 compases de lo que está sonando. Al quitarlo, la pista vuelve a donde estaría la obra.
- **Velocidad** ½ · ×1 · ×2, y **⟲ Sincronizar** para volver a alinear con el reloj.
- **Reverso** (`I`): lee cada compás (o el bucle) de atrás hacia adelante.
- **Espejo**: invierte la melodía (lo que sube, baja) sin salir de Re♭ mayor.
- **Arpegio** ↑/↓: separa los acordes en semicorcheas.
- **Ajustar al acorde**: lleva cada nota a la nota más cercana del acorde actual de la partitura. Sirve para que el bucle, la velocidad o el espejo sigan calzando con la armonía.
- **Cruce**: usa el ritmo de otra pista con las notas de la tuya. Por ejemplo, el bajo con el ritmo de la batería. Una pista de batería tocada en un teclado toca las notas del acorde actual.
- **Transponer**, **Densidad** (deja caer notas al azar), **Eco**, **Desfase** (como el de teclado 2 en 1:54), **Humanizar** y **Volumen MIDI**.

**Ambientes**: el panel X/Y está fusionado con las pistas MIDI.
- El sonido del ambiente (drone, loop, brillo o pulso) toma las **notas de su pista MIDI** en vez de solo la raíz del acorde. El botón 🎼 *Notas del MIDI* lo desactiva.
- Un **anillo guía** en el recuadro marca dónde poner el mouse en cada momento (X = distorsión, Y = intensidad). La línea punteada muestra hacia dónde va en los próximos segundos, y el anillo se pone verde cuando estás en el punto. Bajo el recuadro aparecen consejos (→ más distorsión, ↓ más suave, silencio…).
- 🤖 *Seguir la guía sola* (`G`) mueve el punto solo y enciende o apaga en los silencios. Si mueves el mouse o las flechas, vuelves a tomar el control.
- La guía se edita en `guiaXY` de la partitura: una lista de `[tiempo, X, Y]` por perfil o grupo.

**Extras**: cargar un `.mid` propio (cada pista del archivo aparece en la lista) y enviar las notas a un **puerto MIDI externo** (Pure Data, un DAW o un sintetizador; en Windows se puede usar loopMIDI). La batería sale por el canal 10.

Si agregas o cambias un `.mid`, decláralo en `midi.pistas` de la partitura y corre `python midi/empaquetar.py`. Así funciona también abriendo la página sin servidor.

## Atajos de teclado

| Perfil | Teclas |
|---|---|
| Guitarra | `Espacio` rasgueo ↓ · `B` rasgueo ↑ · `1`–`9` acordes · `L` sostener · `Esc` apagar · `V` luces |
| Batería | `A S D F G H` pads · `Q` pulso · `W` sin platillos · `E` con platillos · `R` muro · `0` ninguno · `V` luces |
| Teclados | `A W S E D F T G Y H U J K O L P Ñ` piano · `Z`/`X` octava · `1`–`9` mantener acordes |
| Ambientes | `Espacio` encender/apagar · flechas mueven X/Y · `G` seguir la guía sola · `F` destello · `V` pantalla completa |
| Pistas MIDI (todos) | `M` reproducir/detener · `N` pulsar · `C` bucle · `I` reverso |

## Publicar en GitHub Pages

1. Sube esta carpeta al repositorio (`Cover_Genesis`).
2. En **Settings → Pages**, elige *Deploy from a branch*, rama `main`, carpeta `/ (root)`.
3. Queda publicado en `https://eepyysspp.github.io/Cover_Genesis/`.

El sitio es HTML, CSS y JavaScript puros. No necesita compilarse, y el archivo `.nojekyll` evita que GitHub lo procese.
Para probarlo en tu computador, abre `index.html` en Chrome. Para cargar sonidos desde `sonidos/` mediante la partitura hace falta un servidor local, por ejemplo `python -m http.server`.

## Estructura

```
index.html        Hub: perfiles, hora común y partitura general
tocar.html        Página de control de cada perfil (?p=guitarra, ?p=teclado-2, …)
js/partitura.js   ← la obra: tempo, secciones, acordes, colores, instrucciones
js/comun.js       Perfiles, tiempos y acordes
js/audio.js       Síntesis de los instrumentos (Web Audio) y sampler
js/midi.js        Pistas MIDI: lector, reproductor sincronizado y modos creativos
js/pistas_midi.js Los .mid empaquetados (lo genera midi/empaquetar.py)
js/tocar.js       Interfaz, reloj y controles
css/estilo.css    Estilos
midi/             Pistas MIDI del arreglo + empaquetar.py
sonidos/          Sonidos propios (sonidos/extraidos/ no se publica: ver sonidos/LEEME.md)
```
