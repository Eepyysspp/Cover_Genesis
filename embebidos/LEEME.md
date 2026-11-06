# embebidos/

Copias en base64 de los sonidos (`sonidos/…wav`), del banco de sonidos de la guitarra (`sonivox.sf3`) y de
`alphaTab.min.js`.

Sirven solo cuando la página se abre con doble clic, sin servidor (dirección `file://…`). En ese caso el navegador
no deja leer archivos con `fetch()`, y sin esta carpeta Square Woof, los sonidos de la partitura (FL) y el
reproductor de la guitarra no suenan. Con servidor o en GitHub Pages esta carpeta no se usa.

Si cambias o agregas sonidos en `js/partitura.js`, vuelve a generarla desde la carpeta `Cover_Genesis`:

    python embebidos/generar_embebidos.py
