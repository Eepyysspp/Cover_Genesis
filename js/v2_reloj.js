/* Reloj de la obra (versión 2).
   · En red: si la página viene de servidor.py, el cronómetro lo lleva ese servidor y todas las laptops lo comparten.
     Cada laptop mide la diferencia entre su hora y la del servidor (el mejor de varios intentos) y después
     calcula el tiempo de la obra por su cuenta, así que un corte breve de la red no lo detiene.
   · Local: sin servidor (GitHub Pages o abriendo el archivo), cada laptop tiene su propio cronómetro. */
(function () {
  const st = { modo: "local", corriendo: false, pos: 0, base: 0, t0: 0, offset: 0, rtt: null, conectado: false, version: -1, practica: false };
  const oyentes = [];
  const avisar = () => oyentes.forEach(f => { try { f(st); } catch (e) { console.warn(e); } });
  const enRed = () => st.modo === "red" && !st.practica;

  function ahora() {
    if (enRed()) return st.corriendo ? (Date.now() + st.offset - st.t0) / 1000 : st.pos;
    return st.corriendo ? (performance.now() - st.base) / 1000 : st.pos;
  }

  async function api(metodo, cuerpo) {
    const r = await fetch("api/reloj", { method: metodo, cache: "no-store",
      headers: cuerpo ? { "Content-Type": "application/json" } : undefined, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    if (!r.ok) throw new Error("reloj " + r.status);
    return r.json();
  }
  function aplicarEstado(e) {
    if (!e || e.servidor !== "genesis") return;
    const cambio = e.version !== st.version || e.corriendo !== st.corriendo;
    Object.assign(st, { corriendo: e.corriendo, pos: e.pos, t0: e.t0, version: e.version, conectado: true });
    if (cambio) avisar();
  }
  // Diferencia de hora con el servidor: se queda con la medición de viaje más corto (la más exacta)
  async function sincronizar() {
    let mejor = null;
    for (let i = 0; i < 6; i++) {
      try {
        const a = Date.now(), j = await (await fetch("api/hora", { cache: "no-store" })).json(), b = Date.now();
        if (!mejor || b - a < mejor.rtt) mejor = { rtt: b - a, off: j.ms - (a + b) / 2 };
      } catch (e) { /* se intenta de nuevo */ }
    }
    if (mejor) { st.offset = mejor.off; st.rtt = mejor.rtt; }
  }
  async function conectar() {
    if (!/^https?:$/.test(location.protocol)) return false;
    let e;
    try { e = await api("GET"); } catch (err) { return false; }
    if (!e || e.servidor !== "genesis") return false;
    st.modo = "red";
    await sincronizar();
    aplicarEstado(e); avisar();
    setInterval(async () => {
      if (st.practica) return;
      try { aplicarEstado(await api("GET")); }
      catch (err) { if (st.conectado) { st.conectado = false; avisar(); } }
    }, 400);
    setInterval(sincronizar, 20000);
    return true;
  }
  async function info() { try { return await (await fetch("api/info", { cache: "no-store" })).json(); } catch (e) { return null; } }

  // Controles. En red se le piden al servidor (y la respuesta ya trae el estado nuevo).
  async function enviar(accion, t) {
    if (enRed()) { try { aplicarEstado(await api("POST", { accion, t })); } catch (e) { st.conectado = false; avisar(); } return; }
    const actual = ahora();
    if (accion === "iniciar") { st.base = performance.now() - (t == null ? actual : t) * 1000; st.corriendo = true; }
    else if (accion === "pausar") { st.pos = actual; st.corriendo = false; }
    else if (accion === "ir") { if (st.corriendo) st.base = performance.now() - t * 1000; else st.pos = t; }
    else if (accion === "detener") { st.corriendo = false; st.pos = 0; }
    avisar();
  }
  // Practicar solo: deja de seguir al servidor (cronómetro propio) hasta volver a activarlo
  function practicarSolo(si) {
    if (si === st.practica) return;
    const t = ahora(); st.practica = si;
    if (si) { st.pos = t; st.base = performance.now() - t * 1000; st.corriendo = false; }
    avisar();
  }

  window.RelojV2 = {
    estado: st, ahora, conectar, info, practicarSolo,
    enRed, iniciar: t => enviar("iniciar", t), pausar: () => enviar("pausar"), ir: t => enviar("ir", t), detener: () => enviar("detener"),
    alCambiar: f => oyentes.push(f),
  };
})();
