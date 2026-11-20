/* Genesis · versión 3 · ventana de luces (luces.html), para proyectar en el escenario.
   La laptop del Ambiente (en la app, la del maestro) manda por un BroadcastChannel ("genesis-luces") el estado de la obra
   unas 30 veces por segundo: color de la sección, acorde, guía X/Y del ambiente (X = distorsión, Y = intensidad), si
   suena y si la obra corre. Esta ventana solo dibuja:
   · fondo con el color de la sección, más alto y más brillante cuanto mayor es la intensidad (Y)
   · un destello suave en cada cambio de acorde
   · parpadeo y grano que crecen con la distorsión (X)
   · todo baja a negro cuando el ambiente se apaga, la obra se detiene o termina */
(function () {
  const lienzo = document.querySelector("canvas"), g = lienzo.getContext("2d"), info = document.getElementById("info");
  let W = 0, H = 0;
  function medir() { const d = Math.min(2, window.devicePixelRatio || 1); W = lienzo.width = Math.round(innerWidth * d); H = lienzo.height = Math.round(innerHeight * d); }
  addEventListener("resize", medir); medir();

  const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ""); const n = m ? parseInt(m[1], 16) : 0x7c9cff; return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mezcla = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  // estado que llega y estado que se dibuja (suavizado)
  let meta = { color: "#000000", x: 0, y: 0, on: false, corriendo: false, fin: false, acorde: "", seccion: "" }, ultimo = 0;
  const vis = { rgb: [0, 0, 0], x: 0, y: 0, nivel: 0, destello: 0 };
  let acordePrevio = null, mostrarDatos = false;

  const canal = "BroadcastChannel" in window ? new BroadcastChannel("genesis-luces") : null;
  if (canal) canal.onmessage = e => {
    const d = e.data; if (!d || d.tipo !== "luz") return;
    if (d.acorde !== acordePrevio) { if (acordePrevio != null && d.corriendo) vis.destello = 1; acordePrevio = d.acorde; }
    meta = d; ultimo = performance.now();
  };

  let tPrev = performance.now();
  function cuadro(n) {
    const dt = Math.min(0.1, (n - tPrev) / 1000); tPrev = n;
    const vivo = n - ultimo < 2000;   // ¿llegan datos del Ambiente?
    // nivel general: encendido y con la obra corriendo = pleno; detenido = tenue; apagado / fin / sin datos = negro
    const objetivo = !vivo || meta.fin || !meta.on ? 0 : meta.corriendo ? 1 : 0.35;
    const k = 1 - Math.exp(-dt / 0.7);
    vis.nivel += (objetivo - vis.nivel) * (1 - Math.exp(-dt / (objetivo < vis.nivel ? 1.6 : 0.5)));
    vis.rgb = mezcla(vis.rgb, hex(meta.color), k);
    vis.x += (meta.x - vis.x) * k; vis.y += (meta.y - vis.y) * k;
    vis.destello = Math.max(0, vis.destello - dt / 0.6);

    const [r, gg, b] = vis.rgb, y = vis.y, x = vis.x, nivel = vis.nivel;
    // parpadeo con la distorsión
    const parpadeo = 1 - x * 0.22 * (0.5 + 0.5 * Math.sin(n / 1000 * 2 * Math.PI * 11)) * (Math.random() * 0.6 + 0.4);
    const brillo = nivel * (0.45 + 0.55 * y) * parpadeo + vis.destello * 0.35 * nivel;
    g.globalCompositeOperation = "source-over";
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    // halo principal: sube con la intensidad
    const cy = H * (0.85 - 0.5 * y), rad = Math.hypot(W, H) * (0.35 + 0.45 * y);
    const halo = g.createRadialGradient(W / 2, cy, 0, W / 2, cy, rad);
    const c = (m, a) => `rgba(${Math.round(r * m)},${Math.round(gg * m)},${Math.round(b * m)},${a})`;
    halo.addColorStop(0, c(1.15, Math.min(1, brillo)));
    halo.addColorStop(0.45, `rgba(${Math.round(x * 200 + r * 0.25)},${Math.round(gg * 0.15)},${Math.round((1 - x) * 110 + b * 0.25)},${Math.min(1, brillo * 0.75)})`);
    halo.addColorStop(1, "rgba(0,0,0,1)");
    g.fillStyle = halo; g.fillRect(0, 0, W, H);
    // destello del cambio de acorde: un velo claro que se apaga
    if (vis.destello > 0) { g.globalCompositeOperation = "lighter"; g.fillStyle = c(0.9, vis.destello * 0.25 * nivel); g.fillRect(0, 0, W, H); }
    // grano con la distorsión
    if (x > 0.08 && nivel > 0.05) {
      g.globalCompositeOperation = "lighter";
      const puntos = Math.round(x * 900 * nivel);
      for (let i = 0; i < puntos; i++) { const a = Math.random() * 0.18 * x * nivel; g.fillStyle = c(1.3, a); g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    }
    g.globalCompositeOperation = "source-over";
    // datos (I) o espera
    const sola = !vivo;
    info.classList.toggle("sola", !mostrarDatos);
    info.style.opacity = mostrarDatos || sola ? "" : "0";
    if (mostrarDatos && vivo) info.innerHTML = `<b>${meta.seccion}</b> · ${meta.acorde} · X ${Math.round(meta.x * 100)} % · Y ${Math.round(meta.y * 100)} % · ${meta.on ? "encendido" : "apagado"}${meta.corriendo ? "" : " · detenido"}`;
    else if (sola) info.innerHTML = `<b>Genesis · luces</b> · esperando al Ambiente… · doble clic: pantalla completa · I: mostrar/ocultar datos`;
    requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);

  // pantalla completa con doble clic (o F) · I muestra los datos · el cursor se esconde quieto
  const pantalla = () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else document.documentElement.requestFullscreen().catch(() => {}); };
  addEventListener("dblclick", pantalla);
  addEventListener("keydown", e => { if (e.key === "f" || e.key === "F") pantalla(); if (e.key === "i" || e.key === "I") mostrarDatos = !mostrarDatos; });
  let reposo = null;
  addEventListener("mousemove", () => { document.body.classList.remove("quieto"); clearTimeout(reposo); reposo = setTimeout(() => document.body.classList.add("quieto"), 2000); });
  document.body.classList.add("quieto");
})();
