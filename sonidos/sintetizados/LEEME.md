# Sonidos sintetizados en Pure Data

Aquí se guardan los `.wav` que genera `pd/sintetizador_bajos_distorsionados.pd`.
El patch escribe en esta carpeta, así que no la borres.

Nombres: `bajo_<preset>_<nota>.wav`
- presets: `dist60` (0:32), `limpio` (1:17), `muro` (1:32), `final` (2:30) y `actual` (los sliders como estén)
- notas: `Bb1` (MIDI 34), `Gb1` (MIDI 30) y `Db2` (MIDI 37)

Son sonidos propios, no fragmentos de la grabación, así que **sí se pueden publicar** en GitHub.

## Usarlos en la página

En `js/partitura.js`, dentro de `sonidos`, por ejemplo para el teclado bajo/medio 1:

```js
"teclado-3": { archivo: "sonidos/sintetizados/bajo_dist60_Bb1.wav", base: 46 },
```

`base: 46` hace que el archivo suene a su altura real (Si♭1) con el teclado en octava 2, que es la del bajo.
Para usar Sol♭1 como referencia, pon `base: 42`.
Cada músico también puede cargar cualquiera de estos archivos desde "Cargar sonidos propios".

## Versión simple (`pd/bajo_distorsionado_simple.pd`)

Graba `bajo_34.wav` (Si♭1), `bajo_30.wav` (Sol♭1) y `bajo_37.wav` (Re♭2); el número es la nota MIDI.
Cada nueva grabación reemplaza el archivo de esa nota. Renómbralo si quieres guardar varias versiones.
En la partitura: `"teclado-3": { archivo: "sonidos/sintetizados/bajo_34.wav", base: 46 }`.
