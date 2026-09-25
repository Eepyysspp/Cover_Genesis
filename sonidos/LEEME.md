# Sonidos

## `extraidos/`: sonidos aislados de la grabación oficial

Se separaron con procesamiento de señal (separación armónico/percusiva, filtros y detección de golpes) a partir de "genesis (Official Audio)".
La mezcla original es muy densa, así que algunos sonidos traen restos de otros instrumentos.

| Archivo | Uso en la página | Origen en la canción |
|---|---|---|
| `bateria_bombo.wav` | Batería → Bombo | golpe en el 1 del compás, Muro II (1:35) |
| `bateria_caja.wav` | Batería → Caja | golpe en el 2 o 4, Muro I (1:03) |
| `bateria_hihat.wav` / `bateria_hihat_abierto.wav` | Batería → Hi-hat / abierto | contratiempo agudo (2:17) |
| `bateria_platillo.wav` | Batería → Crash | platillo (0:54) |
| `bateria_pulso_intro.wav` | Batería → Tom | pulso grave de la intro (0:06) |
| `bajo_nota.wav` | Teclado bajo/medio 1 | Si♭1 sostenido (1:32) |
| `guitarra_acorde_Bbm.wav` / `_Gb.wav` / `_Db.wav` | Guitarra: B♭m7, G♭maj7 y D♭ | un compás de cada acorde (1:32, 1:29, 2:50) |
| `ambiente_ruido_loop.wav` | Ambiente extra · Ruido | textura del comienzo (0:00–0:03) |
| `ambiente_drone_loop.wav` | Ambiente · teclados bajos permanentes | intro "congelada" en Re♭ (sin el pulso) |
| `ambiente_brillo_loop.wav` | Ambiente extra · Brillo | agudos del muro en G♭ (1:29) |
| `ambiente_final_loop.wav` | Ambiente extra · Pulso | textura del final en Re♭ (2:46) |

⚠️ **Derechos:** son fragmentos de una grabación comercial de Robin Callaway. La carpeta está en `.gitignore`, así que **no se sube a GitHub**:
usarlos en ensayos es una cosa, pero publicarlos es distribuir parte de la grabación. Para subirlos, pide permiso al artista.
En el sitio publicado sin estos archivos, la página usa automáticamente los sonidos sintetizados.

Cómo usarlos:
- **En tu computador:** abre la carpeta con un servidor local (`python -m http.server` dentro de `Cover_Genesis/`) y entra a `http://localhost:8000`. Se cargan solos.
- **Desde la página publicada:** cada músico usa "Cargar sonidos propios" con el archivo de su perfil.

## Tus propios sonidos

Pon archivos (`.wav`, `.mp3`, `.ogg`) en esta carpeta y conéctalos en la sección `sonidos` de `js/partitura.js`:

```js
sonidos: {
  guitarra: { "Bbm7": { archivo: "sonidos/mi_acorde.wav", base: 46 } }, // un acorde grabado por nombre
  "teclado-1": { archivo: "sonidos/pad.wav", base: 60 },                // una nota; base = su nota MIDI
  "ambiente-2": "sonidos/textura.wav",                                   // loop; sigue la raíz del acorde
  bateria: { bombo: "sonidos/bombo.wav", caja: "sonidos/caja.wav" },
},
```

Usa archivos livianos: idealmente menos de 5 MB, y nunca más de 25 MB si los subes desde la web de GitHub.
