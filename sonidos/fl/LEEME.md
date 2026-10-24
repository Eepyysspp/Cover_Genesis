# Sonidos hechos en FL Studio

Sonidos propios para imitar el timbre de "genesis", hechos en FL Studio 2026 con el instrumento FLEX.
**No son fragmentos de la grabación**, así que se pueden publicar en GitHub.
Son los sonidos por defecto de la página: `sonidos` en `js/partitura.js` apunta a esta carpeta.

Se tocaron a 130 BPM desde `fuente/genesis_render_sonidos.mid` (una nota o acorde por espacio de 4 compases) y se exportaron en un solo WAV.
Después cada sonido se recortó, se normalizó (pico en −1 dB; los loops de ambiente en −3 dB) y los ambientes se convirtieron en loops con fundido cruzado.

| Archivo | Perfil en la página | Preset de FLEX | Nota grabada · `base` |
|---|---|---|---|
| `guitarra_Bbm7.wav` / `guitarra_Gbmaj7.wav` / `guitarra_Db.wav` | Guitarra (un acorde por nombre) | Distortion Guitar (General MIDI) | B♭m7, G♭maj7, D♭ · 46 / 42 / 49 |
| `teclado_medio_Db4.wav` | Teclado medio/alto 1 | Polysynth | Re♭4 · 61 |
| `teclado_agudo_F5.wav` | Teclado medio/alto 2 | Sweep Pad | Fa5 · 77 |
| `bajo_Bb1.wav` | Teclado bajo/medio 1 | Synth Bass 2 | Si♭1 · 46 (suena a su altura real en octava 2) |
| `teclado_bajo2_Bb1.wav` | Teclado bajo/medio 2 | SynthBass 101 | Si♭1 · 46 |
| `ambiente_drone_Db.wav` | Ambiente · teclados bajos permanentes (loop) | PAD Deep Space (Core Synths) | Re♭2 + Re♭3 · 49 |
| `ambiente_ruido_Bb.wav` | Ambiente extra · Ruido (loop) | SFX Noise Case (Melodic Techno) | Si♭3 · 58 |
| `ambiente_brillo_Gb.wav` | Ambiente extra · Brillo (loop) | Halo Pad | Sol♭3 + Sol♭4 + Re♭5 · 54 |
| `ambiente_pulso_Db.wav` | Ambiente extra · Pulso (loop de 8 tiempos) | Synpluck Cave | Re♭3 en corcheas · 49 |
| `bateria_bombo/caja/hihat/abierto/tom/crash.wav` | Batería (pads) | Drum Power Kit | notas GM 36, 38, 42, 46, 45, 49 |

Los sonidos salen **sin distorsión**: la distorsión la ponen los controles de la página, así cada músico la ajusta en vivo como pide la partitura.
Si se quiere el bajo ya distorsionado, están las versiones de Pure Data en `sonidos/sintetizados/`.

## Cambiar o rehacer un sonido

1. Importa `fuente/genesis_render_sonidos.mid` en FL Studio con *File › Import › MIDI file* (tipo de canal: FLEX) y carga en cada canal el preset de la tabla. En el laptop de Felipe el proyecto ya armado está en la carpeta de proyectos de FL como `Project_2Genesis_sonidos.flp`.
2. Cambia el preset del canal que quieras (en FLEX, el buscador de presets).
3. Exporta el patrón con *File › Export › Wave file* (modo *Pattern*).
4. Cada sonido ocupa 4 compases (7,38 s a 130 BPM), en el orden de la tabla de arriba. Corta el tuyo y reemplaza el archivo con el mismo nombre.

Mantén cada archivo bajo 5 MB.
