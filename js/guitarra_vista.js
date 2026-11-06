/* Vista de la parte de guitarra (js/guitarra_parte.js) dibujada con alphaTab (lib/alphatab/).
   La usan guitarra.html (página para leer, escuchar e imprimir) y la página del perfil Guitarra
   (una línea horizontal que sigue el reloj de la obra, compás por compás). */
(function () {
  const RAIZ = "lib/alphatab/";
  // Abriendo la página con doble clic (file://) el navegador no deja usar fetch(): en ese caso los archivos se leen
  // de embebidos/<ruta>.js, los mismos archivos en base64 (copia sin internet en el sitio de la orquesta).
  const LOCAL = location.protocol === "file:";
  function base64ABuffer(b64) { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
  function leerEmbebido(ruta) {
    const datos = window.ARCHIVOS_EMBEBIDOS = window.ARCHIVOS_EMBEBIDOS || {};
    if (datos[ruta]) return Promise.resolve(base64ABuffer(datos[ruta]));
    return new Promise((ok, mal) => {
      const s = document.createElement("script"); s.src = "embebidos/" + ruta + ".js";
      s.onload = () => (datos[ruta] ? ok(base64ABuffer(datos[ruta])) : mal(new Error(ruta + " sin datos")));
      s.onerror = () => mal(new Error(ruta + " no está en embebidos/"));
      document.head.appendChild(s);
    });
  }
  let cargando = null;
  // alphaTab pesa ~1 MB: se carga solo cuando hace falta
  function cargarAlphaTab() {
    if (window.alphaTab) return Promise.resolve();
    if (!cargando) cargando = new Promise((ok, mal) => {
      const s = document.createElement("script"); s.src = RAIZ + "alphaTab.min.js";
      s.onload = () => ok(); s.onerror = () => mal(new Error("No se pudo cargar alphaTab"));
      document.head.appendChild(s);
    });
    return cargando;
  }

  /* crear(elemento, { horizontal, reproductor, escala, alListo })
     → { api, irACompas(n, fraccion), seguir(segundos) } */
  // Sin servidor, el trabajador (worker) de alphaTab no puede leer lib/alphatab/alphaTab.min.js desde el disco.
  // alphaTab crea su trabajador con un Blob que solo dice importScripts('…alphaTab.min.js'); aquí ese Blob se
  // reemplaza por el código completo de alphaTab, leído de embebidos/. Con servidor no se toca nada.
  let codigoTrabajador = null;
  function prepararTrabajadorLocal() {
    if (!LOCAL) return Promise.resolve();
    if (!codigoTrabajador) codigoTrabajador = leerEmbebido(RAIZ + "alphaTab.min.js").then(codigo => {
      const BlobOriginal = window.Blob;
      window.Blob = class extends BlobOriginal {
        constructor(partes, opciones) {
          const unaLinea = partes && partes.length === 1 && typeof partes[0] === "string" ? partes[0] : "";
          if (/^importScripts\('[^']*alphaTab\.min\.js'\)$/.test(unaLinea)) partes = [codigo];
          super(partes, opciones);
        }
      };
    }).catch(e => console.warn("alphaTab: sin el código embebido, el reproductor no funciona sin servidor:", e.message));
    return codigoTrabajador;
  }

  async function crear(el, op = {}) {
    await cargarAlphaTab();
    await prepararTrabajadorLocal();
    const AT = window.alphaTab, PG = window.PARTE_GUITARRA;
    const ajustes = {
      // rutas absolutas: el trabajador de alphaTab (worker) no resuelve rutas relativas
      core: { tex: true, engine: "svg", fontDirectory: new URL(RAIZ + "font/", document.baseURI).href, scriptFile: new URL(RAIZ + "alphaTab.min.js", document.baseURI).href,
        enableLazyLoading: !op.horizontal && !op.imprimir, logLevel: "warning",
        useWorkers: !LOCAL },   // sin servidor la partitura se dibuja en la misma página
      display: { layoutMode: op.horizontal ? AT.LayoutMode.Horizontal : AT.LayoutMode.Page, scale: op.escala || 0.9,
        resources: { mainGlyphColor: "#14121c", secondaryGlyphColor: "rgba(20,18,28,.55)", scoreInfoColor: "#14121c",
          barNumberColor: "#c2185b" } },
      player: op.reproductor ? { enablePlayer: true, enableCursor: true, enableUserInteraction: true,
        ...(LOCAL ? { outputMode: AT.PlayerOutputMode.WebAudioScriptProcessor } : { soundFont: new URL(RAIZ + "soundfont/sonivox.sf3", document.baseURI).href }),
        scrollElement: op.scrollElement || "html,body", scrollOffsetY: op.scrollOffsetY || 0 } : { enablePlayer: false },
    };
    const lienzo = document.createElement("div"); lienzo.className = "at-lienzo"; el.appendChild(lienzo);
    const api = new AT.AlphaTabApi(lienzo, ajustes);
    api.error.on(e => { console.warn("alphaTab:", e); if (op.alError) op.alError(e); });
    // sin servidor, el banco de sonidos del reproductor se entrega desde embebidos/
    if (LOCAL && op.reproductor) leerEmbebido(RAIZ + "soundfont/sonivox.sf3").then(b => api.loadSoundFont(new Uint8Array(b), false))
      .catch(e => console.warn("alphaTab: banco de sonidos no disponible sin servidor:", e.message));
    // Marca del compás actual (para seguir el reloj de la obra)
    const marca = document.createElement("div"); marca.className = "at-compas-actual"; marca.style.display = "none";
    const linea = document.createElement("div"); linea.className = "at-linea-actual"; linea.style.display = "none";
    lienzo.style.position = "relative"; lienzo.append(marca, linea);
    let listo = false, ultimo = -1;
    api.renderFinished.on(() => { listo = true; ultimo = -1; if (op.alListo) op.alListo(api); });
    api.tex(op.horizontal ? PG.texLinea : PG.tex);   // en la línea que sigue el reloj, cada compás de silencio se ve por separado

    // n = compás (1 = 0:00); fraccion = cuánto va del compás (0–1)
    function irACompas(n, fraccion = 0) {
      if (!listo || !api.renderer.boundsLookup) return;
      const total = api.score ? api.score.masterBars.length : 0;
      if (n < 1 || n > total) { marca.style.display = linea.style.display = "none"; ultimo = -1; return; }
      const b = api.renderer.boundsLookup.findMasterBarByIndex(n - 1); if (!b) return;
      const r = b.realBounds, v = b.visualBounds || r;
      Object.assign(marca.style, { display: "block", left: r.x + "px", top: v.y + "px", width: r.w + "px", height: v.h + "px" });
      Object.assign(linea.style, { display: "block", left: (r.x + r.w * fraccion) + "px", top: v.y + "px", height: v.h + "px" });
      if (n !== ultimo && op.scroller) {
        // el compás actual queda a un cuarto del ancho: se ve lo que viene
        const sc = op.scroller, objetivo = r.x - sc.clientWidth * 0.25;
        sc.scrollTo({ left: Math.max(0, objetivo), behavior: Math.abs(sc.scrollLeft - objetivo) > sc.clientWidth ? "auto" : "smooth" });
      }
      ultimo = n;
    }
    const seguir = seg => { const c = seg / PG.SEG_POR_COMPAS; irACompas(Math.floor(c) + 1, c - Math.floor(c)); };
    return { api, irACompas, seguir, ocultarMarca: () => { marca.style.display = linea.style.display = "none"; ultimo = -1; } };
  }

  // Sección de la guía en la que cae un compás
  const seccionDeCompas = n => (window.PARTE_GUITARRA.SECCIONES || []).find(s => n >= s.compases[0] && n <= s.compases[1]);
  window.VistaGuitarra = { crear, cargarAlphaTab, seccionDeCompas };
})();
