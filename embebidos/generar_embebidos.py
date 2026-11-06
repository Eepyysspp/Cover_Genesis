"""Genera embebidos/: copias en base64 (como .js) de los sonidos y de alphaTab, para que Cover_Genesis funcione
abriendo los archivos con doble clic, sin servidor ni internet (en file:// el navegador no deja usar fetch()).

Uso, desde la carpeta Cover_Genesis:   python embebidos/generar_embebidos.py
Vuelve a correrlo si cambias o agregas sonidos en js/partitura.js. Con servidor (GitHub Pages) esta carpeta no se usa.
"""
import base64
import pathlib
import re

raiz = pathlib.Path(__file__).resolve().parent.parent
codigo = "".join(p.read_text(encoding="utf8") for p in list(raiz.glob("js/*.js")) + list(raiz.glob("*.html")))
rutas = sorted(set(re.findall(r'"(sonidos/[^"]+\.wav)"', codigo)))
rutas += ["lib/alphatab/soundfont/sonivox.sf3", "lib/alphatab/alphaTab.min.js"]
for ruta in rutas:
    origen = raiz / ruta
    if not origen.exists():
        print("falta:", ruta)
        continue
    destino = raiz / "embebidos" / (ruta + ".js")
    destino.parent.mkdir(parents=True, exist_ok=True)
    datos = base64.b64encode(origen.read_bytes()).decode()
    destino.write_text(f'(window.ARCHIVOS_EMBEBIDOS = window.ARCHIVOS_EMBEBIDOS || {{}})["{ruta}"] =\n"{datos}";\n', encoding="utf8")
print(len(rutas), "archivos en embebidos/")
