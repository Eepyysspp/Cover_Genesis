# Sonidos propios

Pon aquí archivos de audio (`.wav`, `.mp3`, `.ogg`) y conéctalos en `js/partitura.js`, en la sección `sonidos`:

```js
sonidos: {
  guitarra: "sonidos/guitarra.wav",          // una nota; se transpone a cada acorde
  "teclado-1": "sonidos/pad.wav",            // una nota; se toca en todo el teclado
  "ambiente-2": "sonidos/textura.wav",       // loop; sigue la raíz del acorde
  bateria: { bombo: "sonidos/bombo.wav", caja: "sonidos/caja.wav" },
},
```

- Para sonidos con altura (guitarra, teclados, ambientes), la página asume la nota C4 (ambientes: C3). Cada músico puede cambiarla en "Nota base".
- Usa archivos cortos y livianos: idealmente menos de 5 MB, y nunca más de 25 MB si los subes desde la web de GitHub.
- Cada músico también puede cargar sonidos desde su propio computador sin subirlos al repositorio.
