"""Cronómetro en red para Genesis (versiones 2 y 3).

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
# empieza: hora del servidor (ms) en que parte la obra tras la cuenta regresiva (versión 3; None = ya partió)
estado = {"corriendo": False, "t0": 0.0, "pos": 0.0, "version": 0, "empieza": None}
# laptops conectadas (versión 3): id → {nombre, rol, rtt, visto}
sala = {}


def ahora_ms():
    return time.time() * 1000.0


def foto():
    with candado:
        e = dict(estado)
        n = ahora_ms()
        e["sala"] = [{k: v for k, v in c.items() if k != "visto"} for c in sala.values() if n - c["visto"] < 3000]
    e["ms"] = ahora_ms()
    e["servidor"] = "genesis"
    return e


def anotar(consulta):
    """Un GET de una laptop de la versión 3 trae ?id=…&rol=…&nombre=…&rtt=…: así el maestro ve quién está."""
    from urllib.parse import parse_qs
    q = {k: v[0] for k, v in parse_qs(consulta).items()}
    if not q.get("id"):
        return
    try:
        rtt = float(q["rtt"]) if q.get("rtt") else None
    except ValueError:
        rtt = None
    with candado:
        sala[q["id"]] = {"nombre": q.get("nombre", ""), "rol": q.get("rol", ""), "rtt": rtt, "visto": ahora_ms()}


def aplicar(accion, t, cuenta=0.0):
    """cuenta (versión 3): segundos de cuenta regresiva antes de partir, para que todas las laptops partan juntas."""
    with candado:
        n = ahora_ms()
        if estado["corriendo"]:
            actual = estado["pos"] if estado["empieza"] and n < estado["empieza"] else (n - estado["t0"]) / 1000.0
        else:
            actual = estado["pos"]
        espera = max(0.0, min(10.0, cuenta)) * 1000.0
        if accion == "iniciar":
            desde = actual if t is None else t
            estado.update(corriendo=True, pos=desde, t0=n + espera - desde * 1000.0, empieza=(n + espera) if espera else None)
        elif accion == "pausar":
            estado.update(corriendo=False, pos=actual, empieza=None)
        elif accion == "ir":
            t = 0.0 if t is None else t
            if estado["corriendo"]:
                estado.update(pos=t, t0=n + espera - t * 1000.0, empieza=(n + espera) if espera else None)
            else:
                estado["pos"] = t
        elif accion == "detener":
            estado.update(corriendo=False, pos=0.0, empieza=None)
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

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")   # la app de escritorio (v3) pregunta desde su propia página
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

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
            if "?" in self.path:
                anotar(self.path.split("?", 1)[1])
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
            aplicar(accion, None if t is None else float(t), float(datos.get("cuenta") or 0))
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
            print(f"     http://{ip}:{PUERTO}/v2.html   (o /v3.html)")
    print(f"  En esta laptop: http://localhost:{PUERTO}/v2.html   (o /v3.html)")
    print("  Para cerrar: Ctrl+C\n")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n  Cronómetro cerrado.")


if __name__ == "__main__":
    main()
