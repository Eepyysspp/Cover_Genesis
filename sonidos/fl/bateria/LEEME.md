# Batería

Golpes hechos en FL Studio con FLEX y procesados para acercarse a la batería de la grabación: oscura, con sala, comprimida y algo saturada.
**No son fragmentos de la grabación.** Son los sonidos por defecto del perfil Batería y de la batería en "Practicar con la orquesta".

## Cómo se hicieron

1. En FL se grabaron tres kits de FLEX (*Drum Power Kit*, *Drum Room Kit* y *Drum Standard Kit*) sin sus efectos internos (delay, reverb, limitador), con `../fuente/bateria_kits_render.mid`: cada pieza a 3 intensidades y 2 veces.
2. Se compararon con golpes de la grabación original (promedio de 40 bombos, 40 cajas, 104 hi-hats, 4 crash y 32 pulsos de la intro) por color espectral y caída. Los kits de FLEX resultaron mucho más brillantes y con mucho más sub en el bombo. Además, cada pieza tiene una sola muestra: la intensidad solo cambia el volumen.
3. Con `../fuente/procesar_bateria.py` (Python) se armó cada pieza:
   - bombo y caja: mezcla de Room (cuerpo) y Power (ataque);
   - ecualización hacia la original (suavizada, al 60 % y con límite), menos sub y más cuerpo en el bombo, y más cuerpo en 180–250 Hz en la caja;
   - compresión paralela, saturación tipo cinta y una sala corta (la caja con más cola, ~0,3 s a −20 dB);
   - **capas por intensidad**: *suave* (más oscura y limpia), *media* y *fuerte* (más brillante y saturada), como una batería real;
   - **dos tomas por capa** con pequeñas diferencias de afinación y color, que se alternan para que dos golpes seguidos no sean idénticos.

| Archivos | Pad | Notas |
|---|---|---|
| `bombo_{suave,media,fuerte}_{1,2}.wav` | Bombo | mono |
| `caja_{suave,media,fuerte}_{1,2}.wav` | Caja | |
| `hihat_{suave,media,fuerte}_{1,2}.wav` | Hi-hat | |
| `abierto.wav` | Hi-hat abierto | |
| `tom.wav` | Tom / pulso de la intro | corto y apagado, como el pulso de la grabación |
| `tom{grave,medio,agudo}_{suave,fuerte}_1.wav` | Toms de los redobles (notas MIDI 41/43, 45/47, 48/50) | |
| `crash.wav` | Crash | |

Formato: WAV de 16 bits a 32 kHz (la grabación casi no tiene contenido sobre 12 kHz), 1,9 MB en total.
En `js/partitura.js` (`sonidos.bateria`), `capas` define los archivos de cada intensidad; `hasta` es la intensidad máxima (0…1) de esa capa.

Igual que con los demás sonidos de FLEX: Image-Line permite usar sus sonidos en tu música; publicarlos sueltos en una página puede quedar en una zona gris de su licencia.
