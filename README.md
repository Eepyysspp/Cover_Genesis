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

Claves para `tocan`, `instrucciones` y `eventos`: `todos`, `guitarra`, `bateria`, `teclados`, `teclados-altos`, `teclados-bajos`, `teclado-1`…`teclado-4`, `ambiente`, `ambiente-principal`, `ambiente-extra`, `ambiente-1`…`ambiente-4`.
Cada músico ve las instrucciones de "todos", las de su grupo y las propias.

> La estructura (Intro / Desarrollo / Outro, 13 partes) y la dotación salen de la propuesta. El tempo (130 BPM) y los acordes (B♭m7 ↔ G♭maj7, resolución en D♭) se midieron en la grabación, y los tiempos de la propuesta se ajustaron al inicio de compás más cercano.
> La intro es **alargable**: el ambiente puede empezar antes y el director inicia el reloj cuando quiera seguir.

## Atajos de teclado

| Perfil | Teclas |
|---|---|
| Guitarra | `Espacio` rasgueo ↓ · `B` rasgueo ↑ · `1`–`9` acordes · `L` sostener · `Esc` apagar · `V` luces |
| Batería | `A S D F G H` pads · `Q` pulso · `W` sin platillos · `E` con platillos · `R` muro · `0` ninguno · `V` luces |
| Teclados | `A W S E D F T G Y H U J K O L P Ñ` piano · `Z`/`X` octava · `1`–`9` mantener acordes |
| Ambientes | `Espacio` encender/apagar · flechas mueven X/Y · `F` destello · `V` pantalla completa |

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
js/tocar.js       Interfaz, reloj y controles
css/estilo.css    Estilos
sonidos/          Sonidos propios (sonidos/extraidos/ no se publica: ver sonidos/LEEME.md)
```
