# Genesis · Orquesta de Laptops UC

Hub web para interpretar **“genesis”** de Robin Callaway (álbum *i saw an angel in the mirror*, 2024) con la Orquesta de Laptops UC.
Cada integrante abre la página, elige su perfil y toca desde el navegador. No hay que instalar nada.

## Perfiles

| Perfil | Qué hace |
|---|---|
| 🎸 Guitarra | Guitarra con fuzz y reverb. Rasguea los acordes de la sección y tiene un modo "sostener" para el muro de sonido. |
| 🥁 Batería | 6 pads (bombo, caja, hi-hat, hi-hat abierto, tom, crash) y patrones automáticos sincronizados al tempo. |
| 🎹 Teclados 1–4 | Pad, campanas (piano eléctrico), bajo y lead. Se toca con piano en pantalla, teclado del computador o teclado MIDI. Cuántos se usan (2, 3 o 4) se define en `teclados` de la partitura. |
| 🌫️ Ambientes 1–4 | Ruido, drone, brillo y pulso. Siguen los acordes y **controlan colores** que cambian con la progresión. Tienen pantalla completa para proyectar y editor de colores. |

Todos los perfiles pueden **cargar sonidos propios** (wav, mp3, ogg) desde la página, en "Cargar sonidos propios".

## Cómo se usa en un ensayo

1. Abre `index.html`, o la página publicada en GitHub Pages.
2. *(Opcional)* Elige una **hora de inicio común**. Todas las laptops parten a esa hora usando su propio reloj, así que conviene que los relojes estén sincronizados con internet (en Windows/macOS lo están por defecto).
3. Cada integrante elige su perfil y presiona **Activar audio y entrar**.
4. Sin hora común, cualquiera puede usar **▶ Iniciar ahora**. Para practicar, usa **Ir a sección** o haz clic en la línea de tiempo.

## Editar la obra: `js/partitura.js`

Es el único archivo que hay que tocar para adaptar la obra:

- `bpm`, `compas`, `duracion`
- `teclados`: 2, 3 o 4
- `secciones`: para cada sección, su `nombre`, `inicio` ("m:ss"), `acordes`, `compasesPorAcorde`, `colores` (uno por acorde) e `instrucciones` por perfil
- `eventos`: avisos que aparecen en pantalla en un tiempo dado
- `sonidos`: archivos de la carpeta `sonidos/` que reemplazan los sintetizados por defecto

Claves de instrucciones: `todos`, `guitarra`, `bateria`, `teclados`, `teclado-1`…`teclado-4`, `ambiente`, `ambiente-1`…`ambiente-4`.
Cada músico ve las instrucciones de "todos", las de su grupo y las propias.

> ⚠️ Las secciones, acordes, tempo y colores que vienen en el archivo son **provisorios**. Solo la duración (2:55) es la de la grabación. Hay que ajustarlos escuchando la canción.

## Atajos de teclado

| Perfil | Teclas |
|---|---|
| Guitarra | `Espacio` rasgueo ↓ · `B` rasgueo ↑ · `1`–`9` acordes · `L` sostener · `Esc` apagar |
| Batería | `A S D F G H` pads · `Q W E` patrones · `0` sin patrón |
| Teclados | `A W S E D F T G Y H U J K O L P Ñ` piano · `Z`/`X` octava · `1`–`9` mantener acordes |
| Ambientes | `Espacio` encender/apagar · flechas mueven X/Y · `F` destello · `V` pantalla completa |

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `genesis`, dentro de la organización OrquestaLaptopsUC) y sube esta carpeta.
2. En **Settings → Pages**, elige *Deploy from a branch*, rama `main`, carpeta `/ (root)`.
3. Queda publicado en `https://orquestalaptopsuc.github.io/genesis/`.

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
sonidos/          Sonidos propios opcionales
```
