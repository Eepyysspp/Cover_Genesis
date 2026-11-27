/* Reloj de la obra (versión 3).
   · En la app de escritorio (app/): un Mac es el MAESTRO y lleva el reloj; los demás (MÚSICOS) lo encuentran en la red
     y lo siguen. Al iniciar, el maestro no dice "parte ya" sino "parte a la hora X" (≈ 3 s después): todos alcanzan a
     enterarse y arrancan juntos, aunque el wifi tarde distinto en cada laptop. Cada laptop mide la diferencia entre su
     hora y la del maestro (la medición de viaje más corto, la más exacta) y vuelve a medir cada 10 s.
   · En el navegador: con servidor.py funciona igual que en la v2 (cronómetro en red); sin servidor (GitHub Pages o el
     archivo abierto con doble clic) cada laptop tiene su propio cronómetro.
   Parámetros de la página: ?app=maestro | ?app=musico&maestro=http://IP:PUERTO | ?app=solo  (&nombre=… para la sala) */
(function () {
  const q = new URLSearchParams(location.search);
  const APP = q.get("app") || "";
  const BASE = (q.get("maestro") || "").replace(/\/?$/, q.get("maestro") ? "/" : "");
  const NOMBRE = q.get("nombre") || "";
  const CUENTA = 3;   // segundos de cuenta regresiva al iniciar en red
  const ID = (() => { try { let v = sessionStorage.getItem("v3:id"); if (!v) { v = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("v3:id", v); } return v; } catch (e) { return Math.random().toString(36).slice(2, 10); } })();
  const st = { modo: "local", corriendo: false, pos: 0, base: 0, t0: 0, empieza: null, offset: 0, rtt: null, conectado: false, version: -1,
    practica: false, app: APP, maestro: APP === "maestro", sala: [], rol: "",
    vol: null, son: false, volVersion: null, volSala: null };   // vol/son: los de esta laptop (se informan al maestro)
  const oyentes = [], oyentesVol = [];
  const avisar = () => oyentes.forEach(f => { try { f(st); } catch (e) { console.warn(e); } });
  const enRed = () => st.modo === "red" && !st.practica;
  const horaMaestro = () => Date.now() + st.offset;

  function ahora() {
    if (enRed()) {
      if (!st.corriendo) return st.pos;
      if (st.empieza != null && horaMaestro() < st.empieza) return st.pos;   // cuenta regresiva: todavía no parte
      return (horaMaestro() - st.t0) / 1000;
    }
    return st.corriendo ? (performance.now() - st.base) / 1000 : st.pos;
  }
  // segundos que faltan para que parta la obra (0 si ya partió o está detenida)
  const cuenta = () => (enRed() && st.corriendo && st.empieza != null ? Math.max(0, (st.empieza - horaMaestro()) / 1000) : 0);

  const url = ruta => BASE + ruta;
  async function api(metodo, cuerpo) {
    const extra = metodo === "GET" ? `?id=${ID}&rol=${encodeURIComponent(st.rol)}&nombre=${encodeURIComponent(NOMBRE)}&rtt=${st.rtt == null ? "" : st.rtt}&vol=${st.vol == null ? "" : st.vol}&son=${st.son ? 1 : 0}${st.maestro ? "&yo=maestro" : ""}` : "";
    const r = await fetch(url("api/reloj") + extra, { method: metodo, cache: "no-store",
      headers: cuerpo ? { "Content-Type": "application/json" } : undefined, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    if (!r.ok) throw new Error("reloj " + r.status);
    return r.json();
  }
  function aplicarEstado(e) {
    if (!e || e.servidor !== "genesis") return;
    const cambio = e.version !== st.version || e.corriendo !== st.corriendo || !st.conectado;
    Object.assign(st, { corriendo: e.corriendo, pos: e.pos, t0: e.t0, empieza: e.empieza != null ? e.empieza : null, version: e.version, conectado: true });
    if (e.sala) st.sala = e.sala;
    // volumen fijado por el maestro: se aplica una vez por cada cambio (también al unirse tarde a la sala)
    if (e.volVersion != null && e.volVersion !== st.volVersion) {
      st.volVersion = e.volVersion; st.volSala = e.volSala;
      if (e.volSala != null) oyentesVol.forEach(f => { try { f(e.volSala); } catch (err) { console.warn(err); } });
    }
    if (cambio) avisar();
  }
  // Diferencia de hora con el maestro: se queda con la medición de viaje más corto
  async function sincronizar(n = 8) {
    let mejor = null;
    for (let i = 0; i < n; i++) {
      try {
        const a = Date.now(), j = await (await fetch(url("api/hora"), { cache: "no-store" })).json(), b = Date.now();
        if (!mejor || b - a < mejor.rtt) mejor = { rtt: b - a, off: j.ms - (a + b) / 2 };
      } catch (e) { /* se intenta de nuevo */ }
    }
    if (mejor) { st.offset = mejor.off; st.rtt = mejor.rtt; }
    return !!mejor;
  }
  let ciclo = null;
  async function conectar() {
    if (APP === "solo") return false;
    if (!BASE && !/^https?:$/.test(location.protocol)) return false;
    let e;
    try { e = await api("GET"); } catch (err) { return false; }
    if (!e || e.servidor !== "genesis") return false;
    st.modo = "red";
    await sincronizar();
    aplicarEstado(e); avisar();
    if (!ciclo) {
      ciclo = setInterval(async () => {
        if (st.practica) return;
        try { aplicarEstado(await api("GET")); }
        catch (err) { if (st.conectado) { st.conectado = false; avisar(); } }
      }, 250);
      setInterval(() => sincronizar(5), 10000);
    }
    return true;
  }
  async function info() { try { return await (await fetch(url("api/info"), { cache: "no-store" })).json(); } catch (e) { return null; } }

  // Controles. En red se le piden al maestro (la respuesta ya trae el estado nuevo).
  async function enviar(accion, t) {
    if (enRed()) {
      // iniciar (o saltar mientras corre) parte tras una cuenta regresiva, para que todas las laptops alcancen a enterarse
      const cuenta = accion === "iniciar" || (accion === "ir" && st.corriendo) ? CUENTA : 0;
      try { aplicarEstado(await api("POST", { accion, t, cuenta })); } catch (e) { st.conectado = false; avisar(); }
      return;
    }
    const actual = ahora();
    if (accion === "iniciar") { st.base = performance.now() - (t == null ? actual : t) * 1000; st.corriendo = true; }
    else if (accion === "pausar") { st.pos = actual; st.corriendo = false; }
    else if (accion === "ir") { if (st.corriendo) st.base = performance.now() - t * 1000; else st.pos = t; }
    else if (accion === "detener") { st.corriendo = false; st.pos = 0; }
    avisar();
  }
  function practicarSolo(si) {
    if (si === st.practica) return;
    const t = ahora(); st.practica = si;
    if (si) { st.pos = t; st.base = performance.now() - t * 1000; st.corriendo = false; }
    avisar();
  }
  // ¿Puede manejar el reloj esta laptop? (sin red: siempre; en red: el maestro, o el rol Cronómetro con servidor.py)
  const manda = esDirector => !enRed() || st.maestro || (esDirector && APP !== "musico");

  window.RelojV3 = {
    estado: st, ahora, cuenta, conectar, info, practicarSolo, enRed, manda,
    ponerRol: rol => { st.rol = rol || ""; },
    iniciar: t => enviar("iniciar", t), pausar: () => enviar("pausar"), ir: t => enviar("ir", t), detener: () => enviar("detener"),
    alCambiar: f => oyentes.push(f),
    // volumen de la sala (app): el maestro lo fija para todas las demás laptops con un clic
    alVolumenSala: f => oyentesVol.push(f),
    informarVolumen: (vol, son) => { st.vol = Math.round(vol * 100) / 100; st.son = !!son; },
    fijarVolumenSala: async v => {
      if (!enRed() || !st.maestro) return false;
      try { aplicarEstado(await api("POST", { accion: "volumen", t: v })); return true; } catch (e) { return false; }
    },
  };
})();
