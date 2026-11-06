"""Cronómetro en red para Genesis (versión 2).

Una laptop (la del director) corre este programa. Sirve la página y lleva el reloj de la obra: todas las laptops
conectadas a la misma red (wifi o router, no hace falta internet) abren la dirección que se muestra al partir, y
el cronómetro corre igual en todas. Iniciar, pausar o saltar a una sección se hace desde la pantalla "Cronómetro".

Uso (desde la carpeta Cover_Genesis; solo necesita Python 3, sin instalar nada):

    python servidor.py            # puerto 8000
    python servidor.py 8080       # otro puerto

Si Windows pregunta por el firewall, hay que permitir el acceso en redes privadas.
"""
import json
import os
import socket
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PUERTO = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
CARPETA = os.path.dirname(os.path.abspath(__file__))

candado = threading.Lock()
# t0: hora del servidor (ms) en que la obra estaría en 0:00 · pos: segundo de la obra mientras está detenida
estado = {"corriendo": False, "t0": 0.0, "pos": 0.0, "version": 0}


def ahora_ms():
    return time.time() * 1000.0


def foto():
    with candado:
        e = dict(estado)
    e["ms"] = ahora_ms()
    e["servidor"] = "genesis"
    return e


def aplicar(accion, t):
    with candado:
        n = ahora_ms()
        actual = (n - estado["t0"]) / 1000.0 if estado["corriendo"] else estado["pos"]
        if accion == "iniciar":
            desde = actual if t is None else t
            estado.update(corriendo=True, t0=n - desde * 1000.0)
        elif accion == "pausar":
            estado.update(corriendo=False, pos=actual)
        elif accion == "ir":
            t = 0.0 if t is None else t
            if estado["corriendo"]:
                estado["t0"] = n - t * 1000.0
            else:
                estado["pos"] = t
        elif accion == "detener":
            estado.update(corriendo=False, pos=0.0)
        estado["version"] += 1


def direcciones():
    ips = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))   # no envía nada: solo elige la interfaz de la red local
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    try:
        for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
            ips.add(ip)
    except OSError:
        pass
    return sorted(ip for ip in ips if not ip.startswith("127."))


class Manejador(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "application/javascript", ".mjs": "application/javascript",
                      ".wasm": "application/wasm", ".sf3": "application/octet-stream", ".woff2": "font/woff2"}

    def __init__(self, *a, **k):
        super().__init__(*a, directory=CARPETA, **k)

    def log_message(self, formato, *args):   # solo se anotan los cambios del reloj
        pass

    def responder(self, datos, codigo=200):
        cuerpo = json.dumps(datos).encode()
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_GET(self):
        ruta = self.path.split("?")[0]
        if ruta.endswith("/api/reloj"):
            return self.responder(foto())
        if ruta.endswith("/api/hora"):
            return self.responder({"ms": ahora_ms()})
        if ruta.endswith("/api/info"):
            return self.responder({"ips": direcciones(), "puerto": PUERTO})
        return super().do_GET()

    def do_POST(self):
        if not self.path.split("?")[0].endswith("/api/reloj"):
            return self.responder({"error": "no existe"}, 404)
        try:
            largo = int(self.headers.get("Content-Length") or 0)
            datos = json.loads(self.rfile.read(largo) or b"{}")
            accion = datos.get("accion")
            if accion not in ("iniciar", "pausar", "ir", "detener"):
                return self.responder({"error": "acción desconocida"}, 400)
            t = datos.get("t")
            aplicar(accion, None if t is None else float(t))
            e = foto()
            seg = (e["ms"] - e["t0"]) / 1000.0 if e["corriendo"] else e["pos"]
            print(f"  reloj: {accion:8s} → {int(seg // 60)}:{int(seg % 60):02d} {'(corriendo)' if e['corriendo'] else '(detenido)'}")
            return self.responder(e)
        except (ValueError, TypeError) as err:
            return self.responder({"error": str(err)}, 400)


def main():
    servidor = ThreadingHTTPServer(("0.0.0.0", PUERTO), Manejador)
    print("\n  Genesis · cronómetro en red")
    print("  ---------------------------")
    ips = direcciones()
    if ips:
        print("  Cada laptop abre (misma red wifi / router):")
        for ip in ips:
            print(f"     http://{ip}:{PUERTO}/v2.html")
    print(f"  En esta laptop: http://localhost:{PUERTO}/v2.html")
    print("  Para cerrar: Ctrl+C\n")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n  Cronómetro cerrado.")


if __name__ == "__main__":
    main()
