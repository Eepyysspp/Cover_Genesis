"""Empaqueta los .mid de esta carpeta en js/pistas_midi.js.

Así las pistas MIDI funcionan también abriendo tocar.html directamente
(sin servidor local). Córrelo cada vez que agregues o cambies un .mid:

    python midi/empaquetar.py
"""
import base64
import pathlib

aqui = pathlib.Path(__file__).resolve().parent
raiz = aqui.parent
datos = {}
for f in sorted(aqui.glob("*.mid")):
    datos["midi/" + f.name] = base64.b64encode(f.read_bytes()).decode("ascii")

lineas = ",\n".join(f'  "{k}": "{v}"' for k, v in datos.items())
js = ("/* Generado por midi/empaquetar.py: los .mid de la carpeta midi/ en base64.\n"
      "   No lo edites a mano; cambia los .mid y vuelve a correr el script. */\n"
      "window.PISTAS_MIDI_DATOS = {\n" + lineas + "\n};\n")
(raiz / "js" / "pistas_midi.js").write_text(js, encoding="utf-8")
print(f"{len(datos)} archivos → js/pistas_midi.js")
