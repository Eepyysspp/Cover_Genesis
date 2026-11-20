/* Genesis · versión 3: la versión 2 lista para tocar en red local con la app de escritorio (app/).
   Igual que la v2 (partitura, sonidos de FL Studio, pistas MIDI, motor de audio), más:
   · reloj en red con maestro: todos parten a la vez tras una cuenta regresiva (js/v3_reloj.js)
   · limitador al final de la mezcla (sin clipping aunque suenen muchas notas)
   · teclado MIDI USB para los teclados (sin el límite de teclas del teclado del computador) */
(function () {
  const { Motor, Teclado, Ambiente } = window.Audio2;
  const { P, PERFILES, DURACION, SECCIONES, SEG_POR_COMPAS, fmt, seccionEn, acordeEn, toca, proximoCambio, instrucciones,
    efectosEn, guiaXYEn, parseAcorde, guardar, leer } = window.G;
  const R = window.RelojV3;
  const APP = window.genesisApp || null;   // la app de escritorio (app/preload.js), si la página corre ahí

  /* ============================== utilidades ============================== */
  const $ = (s, raiz = document) => raiz.querySelector(s);
  const el = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lim = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const PC = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
  const ESCALA = new Set([1, 3, 5, 6, 8, 10, 0]);   // Re♭ mayor: la tonalidad de la obra
  const bonito = n => (n || "").replace(/([A-G])b/g, "$1♭").replace(/([A-G])#/g, "$1♯");
  const nombreNota = m => PC[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  const tObra = t => lim(t, 0, DURACION - 0.01);
  const enAudio = t => Motor.t + (t - R.ahora());   // segundo de la obra → reloj de audio
  // con una ventana abierta, las teclas no tocan el instrumento
  const escribiendo = e => (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target.type !== "range") || !!document.querySelector("dialog[open]");
  function lb(arr, x, clave) { let a = 0, b = arr.length; while (a < b) { const m = (a + b) >> 1; if (clave(arr[m]) < x) a = m + 1; else b = m; } return a; }
  const tonosDe = nombre => { const a = parseAcorde(nombre); return a ? a.intervalos.map(i => (a.raiz + i) % 12) : []; };

  /* ============================== ventanas emergentes ============================== */
  // Una ventana encima de la pantalla: se cierra con ✕, con Esc o tocando fuera de ella.
  function abrirVentana(titulo, contenido, { clase = "", alCerrar } = {}) {
    const d = el(`<dialog class="ventana ${clase}"><div class="v-marco">
      <div class="v-cab"><h2>${titulo}</h2><button class="btn v-cerrar" aria-label="Cerrar">✕</button></div>
      <div class="v-cuerpo"></div></div></dialog>`);
    $(".v-cuerpo", d).append(contenido);
    $(".v-cerrar", d).onclick = () => d.close();
    d.addEventListener("pointerdown", e => { if (e.target === d) d.close(); });   // fuera del marco = el fondo oscuro
    d.addEventListener("close", () => { d.remove(); if (alCerrar) alCerrar(); });
    document.body.appendChild(d); d.showModal();
    $(".v-cerrar", d).focus();
    return d;
  }

  // Ayuda del teclado (se abre sola la primera vez y con el botón "? Cómo funciona")
  function ayudaTeclado() {
    const tecla = (cls, txt = "") => `<span class="mini-tecla ${cls}">${txt}</span>`;
    abrirVentana("🎹 Cómo funciona el teclado", el(`<div class="ayuda-tec">
      <section><h3>1 · Los colores te dicen qué suena bien</h3>
        <p>Las marcas cambian solas con cada acorde de la partitura. Puedes tocar <b>cualquier tecla</b>: la disonancia está permitida.</p>
        <ul class="lista-colores">
          <li>${tecla("t-acorde")}<span><b>De color:</b> notas del acorde que suena ahora. Siempre encajan.</span></li>
          <li>${tecla("t-acorde t-raiz")}<span><b>Con un punto:</b> la raíz del acorde, la nota más firme (buena para el bajo).</span></li>
          <li>${tecla("t-escala")}<span><b>Blanca o negra normal:</b> de la escala de la obra (Re♭ mayor). Suena con tensión: úsala de paso.</span></li>
          <li>${tecla("t-fuera")}<span><b>Rayada:</b> fuera de la escala. Choca a propósito: disonancia.</span></li>
          <li>${tecla("t-guia")}<span><b>Borde rosado:</b> lo que toca tu parte en el arreglo grabado. Síguelo si te pierdes.</span></li>
          <li>${tecla("t-sig")}<span><b>Círculo punteado:</b> nota del acorde que viene (aparece unos segundos antes del cambio).</span></li>
          <li>${tecla("t-on")}<span><b>Rosado:</b> la tecla que estás tocando.</span></li>
        </ul></section>
      <section><h3>2 · Cómo suena</h3>
        <p>Cada nota suena <b>mientras mantienes apretada</b> su tecla, como un piano, y se apaga al soltar. <b>✋ Soltar todo</b> (o <kbd>Esc</kbd>) apaga todo de una vez.</p></section>
      <section><h3>3 · Cuando cambia el acorde: glissando</h3>
        <p>Las notas que siguen sonando en el cambio <b>se deslizan solas</b> y llegan justo con el acorde nuevo. Así no hace falta seguir el tempo al soltar las notas. Las teclas de la nota del acorde que viene se marcan antes del cambio.</p>
        <p>Con el botón <b>🎚️ Cambio de acorde</b> (en <b>⚙️ Sonido · Tocar · Efectos</b>, debajo del piano) eliges si van a la nota del acorde más cercana, si se mueven todas juntas (conservan la disonancia) o si se quedan quietas, y cuánto dura el deslizamiento.</p></section>
      <section><h3>4 · Efectos</h3>
        <p>Con <b>🎛️ Efectos automáticos</b> encendido, la distorsión, el brillo, la reverb y el volumen cambian solos en cada parte de la obra. Si mueves un control a mano, el modo automático se apaga hasta que lo vuelvas a encender.</p></section>
      <section><h3>5 · Notas que caen</h3>
        <p>Sobre el piano caen las notas de <b>tu parte del arreglo</b>. Cuando una nota <b>toca el piano</b>, tócala; su largo es cuánto mantenerla. Las líneas horizontales marcan los cambios de acorde.</p>
        <p>La nota que está sonando se pone amarilla. Puedes apagarlas o cambiar su velocidad en <b>⚙️ Sonido · Tocar · Efectos</b>, debajo del piano. Es una guía, no una obligación: improvisar sigue valiendo.</p></section>
      <section><h3>Tocar con el teclado de la computadora</h3>
        <div class="atajos">
          <p>El piano tiene <b>una tecla ancha por nota, todas en la fila A</b> (A S D F G H J K L Ñ): las notas que pide tu parte y, para completar hasta 10, otras de la escala de la obra (Re♭ mayor), un poco más apagadas, para improvisar. Las notas que caen solo llegan a tus notas.</p>
          <div class="oct-pc"><div class="fila-teclas blancas">${"ASDFGHJKLÑ".split("").map(c => `<kbd>${c}</kbd>`).join("")}</div></div>
          <p class="muted small">De izquierda a derecha, de la nota más grave a la más aguda. Cada tecla del piano muestra su nota y su letra. Los números no tocan notas.</p>
          <p><kbd>←</kbd> <kbd>→</kbd> bajar o subir octava · <kbd>Esc</kbd> soltar todo · <kbd>?</kbd> esta ayuda</p>
          <p class="muted small">¿Tienes un teclado MIDI USB? Conéctalo y toca: cada nota suena tal cual (arriba aparece «🎹 MIDI» con su nombre).</p>
        </div></section>
    </div>`), { clase: "ancha" });
  }

  /* ============================== roles ============================== */
  const pf = id => PERFILES.find(p => p.id === id);
  const ROLES = [
    { id: "teclado-1", titulo: "Teclado 1", sub: "Arpegio · notas graves", icono: "🎹" },
    { id: "teclado-2", titulo: "Teclado 2", sub: "Arpegio · notas agudas y pedal", icono: "🎹" },
    { id: "teclado-3", titulo: "Teclado 3", sub: "Bajo/medio · el bajo", icono: "🎹" },
    { id: "teclado-4", titulo: "Teclado 4", sub: "Bajo/medio · voz interior", icono: "🎹" },
    { id: "guitarra", titulo: "Teclado líder", sub: "La melodía · Square Woof", icono: "🎹" },
    { id: "ambiente-1", titulo: "Ambiente", sub: "Base grave · colores", icono: "🌊" },
    { id: "ambiente-3", titulo: "Ambiente brillo", sub: "Agudo · brillo", icono: "✨" },
    { id: "director", titulo: "Cronómetro", sub: "Reloj grande y control", icono: "⏱️" },
  ];
  const DIRECTOR = { id: "director", grupo: "todos", tipo: "director", nombre: "Cronómetro" };

  /* ============================== sonidos ============================== */
  // Muestras que se sostienen: se repiten (con un fundido) para que una nota mantenida pueda durar lo que quieras
  const BUCLES = {
    "sonidos/fl/teclado_agudo_F5.wav": [1.0, 3.4], "sonidos/fl/bajo_Bb1.wav": [0.9, 3.5], "sonidos/fl/teclado_bajo2_Bb1.wav": [0.9, 3.55],
    "sonidos/fl/square_woof_Db2.wav": [0.9, 3.5], "sonidos/fl/square_woof_Db3.wav": [0.9, 3.5],
  };
  const cacheSon = new Map();
  function cargarSonido(ruta) {
    if (!cacheSon.has(ruta)) cacheSon.set(ruta, Motor.cargarURL(ruta).then(b => conBucle(b, BUCLES[ruta])).catch(e => { cacheSon.delete(ruta); throw e; }));
    return cacheSon.get(ruta);
  }
  function conBucle(buffer, region) {
    if (!region) return { buffer, bucle: null };
    const sr = buffer.sampleRate, ini = Math.floor(region[0] * sr), fin = Math.min(buffer.length, Math.floor(region[1] * sr));
    const xf = Math.min(Math.floor(0.25 * sr), ini);
    const nuevo = Motor.ctx.createBuffer(buffer.numberOfChannels, fin, sr);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const a = buffer.getChannelData(c), b = nuevo.getChannelData(c);
      b.set(a.subarray(0, fin));
      // fundido de potencia constante: el final del bucle se mezcla con lo que viene justo antes del inicio
      for (let i = 0; i < xf; i++) { const k = i / xf, j = fin - xf + i; b[j] = a[j] * Math.cos(k * Math.PI / 2) + a[ini - xf + i] * Math.sin(k * Math.PI / 2); }
    }
    return { buffer: nuevo, bucle: [ini / sr, fin / sr] };
  }
  let pistasProm = null;
  const pistas = () => (pistasProm = pistasProm || window.MIDI.pistasDeLaObra());
  // La pista de cada perfil. Con un "reparto" (partitura → midi.reparto), se juntan las pistas indicadas y se
  // quedan solo las alturas que le tocan a ese perfil (así los teclados 1 y 2 se reparten la línea de la pista Medio).
  const cacheReparto = new Map();
  async function pistaDe(id) {
    const rep = P.midi && P.midi.reparto && P.midi.reparto[id];
    if (rep) {
      if (!cacheReparto.has(id)) cacheReparto.set(id, pistas().then(ps => {
        const notas = rep.pistas.flatMap(pid => { const p = ps.find(x => x.id === pid); return p ? p.notas : []; }).filter(n => rep.notas.includes(n.m));
        return notas.length ? window.MIDI.preparar({ id: "reparto-" + id, nombre: "Reparto " + id, notas: notas.map(n => Object.assign({}, n)) }) : null;
      }));
      return cacheReparto.get(id);
    }
    const pid = P.midi && P.midi.porPerfil[id]; return pid ? (await pistas()).find(p => p.id === pid) || null : null;
  }
  // volumen propio de una altura de la pista del perfil (1 si no tiene)
  const volNota = (id, m) => { const v = P.midi && P.midi.reparto && P.midi.reparto[id] && P.midi.reparto[id].volumen; return v && v[m] != null ? v[m] : 1; };
  // Piano en carriles: las notas que pide tu parte (todas) más notas de la escala de la obra (Re♭ mayor) para improvisar,
  // hasta llenar la fila A S D F G H J K L Ñ. Primero las de la escala que caen entre tus notas, después alternando
  // una más grave y una más aguda.
  const MAX_CARRILES = 10;
  function carrilesConEscala(requeridas, maximo = MAX_CARRILES) {
    if (!requeridas.length || requeridas.length > maximo) return null;
    const enEscala = m => ESCALA.has(((m % 12) + 12) % 12), set = new Set(requeridas);
    const lo = requeridas[0], hi = requeridas[requeridas.length - 1];
    for (let m = lo; m <= hi && set.size < maximo; m++) if (enEscala(m)) set.add(m);
    let abajo = lo - 1, arriba = hi + 1, turno = 0;
    while (set.size < maximo && (abajo > 12 || arriba < 108)) {
      if (turno++ % 2 === 0) { while (!enEscala(abajo)) abajo--; if (abajo > 12) set.add(abajo--); }
      else { while (!enEscala(arriba)) arriba++; if (arriba < 108) set.add(arriba++); }
    }
    return [...set].sort((a, b) => a - b);
  }

  /* Programador de notas MIDI: en cada cuadro agenda las notas de los próximos instantes (en el reloj de audio) */
  function programador(pista, alNota) {
    let cursor = -1, ultimo = null;
    return (t, corriendo) => {
      if (!pista || !corriendo) { cursor = -1; ultimo = null; return; }
      if (cursor < 0 || ultimo == null || t < ultimo - 0.05 || t > ultimo + 0.6) cursor = lb(pista.notas, t, n => n.t);
      const hasta = t + 0.25;
      while (cursor < pista.notas.length && pista.notas[cursor].t < hasta) { const n = pista.notas[cursor++]; if (n.t >= t - 0.03) alNota(n, enAudio(n.t)); }
      ultimo = t;
    };
  }

  /* ============================== efectos automáticos ============================== */
  // La tabla "efectos" de la partitura mueve los controles en cada parte. Si mueves un control a mano, se apaga.
  function efectosAuto(perfil, inst, mapa, alAplicar, { escala = () => 1, guardarlo = true } = {}) {
    const base = Object.assign({}, inst.p), pintores = [], porDefecto = {};
    for (const k in mapa) if (k !== "vol") porDefecto[mapa[k]] = base[k];   // sin dato en la tabla = como parte el instrumento
    let activo = guardarlo ? leer("v3:efectos:" + perfil.id, true) : true, ultimo = 0;
    return {
      get activo() { return activo; },
      alCambiar(f) { pintores.push(f); },
      poner(v) { activo = v; if (guardarlo) guardar("v3:efectos:" + perfil.id, v); pintores.forEach(f => f()); },
      cuadro(t) {
        if (!activo || performance.now() - ultimo < 120) return; ultimo = performance.now();
        const e = efectosEn(tObra(t), perfil, porDefecto); let cambio = false;
        for (const k in mapa) {
          const v = k === "vol" ? base.vol * (e.vol != null ? e.vol : 1) * escala() : e[mapa[k]] != null ? e[mapa[k]] : base[k];
          if (v != null && Math.abs((inst.p[k] || 0) - v) > 0.004) { inst.p[k] = v; cambio = true; }
        }
        if (cambio) { inst.aplicar(); if (alAplicar) alAplicar(); }
      },
    };
  }
  // Un deslizador ligado a inst.p[clave]. Moverlo a mano apaga los efectos automáticos.
  function deslizador(etiqueta, inst, clave, auto, { min = 0, max = 1, paso = 0.01 } = {}) {
    const caja = el(`<label class="desliz"><span>${esc(etiqueta)}</span><input type="range" min="${min}" max="${max}" step="${paso}"><b></b></label>`);
    const inp = $("input", caja), val = $("b", caja);
    const mostrar = () => { inp.value = inst.p[clave]; val.textContent = Math.round(((inst.p[clave] - min) / (max - min)) * 100) + " %"; };
    inp.addEventListener("input", () => { inst.p[clave] = +inp.value; inst.aplicar(); mostrar(); if (auto && auto.activo) auto.poner(false); });
    caja.mostrar = mostrar; mostrar();
    return caja;
  }
  function botonAuto(auto, deslizadores) {
    const b = el(`<button class="chip" title="La partitura mueve los efectos en cada parte; si mueves un control a mano, se apaga">🎛️ Efectos automáticos</button>`);
    const pintar = () => { b.classList.toggle("on", auto.activo); deslizadores.forEach(d => d.mostrar()); };
    b.onclick = () => auto.poner(!auto.activo);
    auto.alCambiar(pintar); pintar();
    return { b, pintar };
  }

  /* ============================== pantalla "ahora" ============================== */
  function crearAhora(perfil) {
    const caja = el(`<section class="ahora">
      <div class="fila-estado"><div class="estado" data-r="estado">—</div><div class="cuenta" data-r="cuenta"></div></div>
      <div class="seccion"><span data-r="sec">—</span><span class="tiempo" data-r="tiempo">0:00</span></div>
      <div class="acordes"><div class="acorde" data-r="ac">—</div><div class="sig"><small>luego</small><span data-r="sig">—</span></div></div>
      <div class="barra"><i data-r="barra"></i></div>
    </section>`);
    const r = k => $(`[data-r=${k}]`, caja);
    let previo = "";
    return {
      caja,
      cuadro(t) {
        const tc = tObra(t), sec = seccionEn(tc), ac = acordeEn(tc), fin = t >= DURACION;
        const tocaYa = perfil.tipo === "director" || toca(sec, perfil);
        const prox = perfil.tipo === "director" ? null : proximoCambio(tc, perfil);
        const dur = SEG_POR_COMPAS * sec.cpa;
        r("tiempo").textContent = fmt(Math.max(0, t)) + " / " + fmt(DURACION);
        r("barra").style.width = (100 * (1 - ac.falta / dur)).toFixed(1) + "%";
        caja.style.setProperty("--color", ac.color || "#7c9cff");
        const clave = [sec.idx, ac.nombre, ac.siguiente, tocaYa, fin, R.estado.corriendo].join("|");
        if (prox) r("cuenta").textContent = (prox.entra ? "entras en " : "callas en ") + fmt(prox.seccion.ini - tc);
        else r("cuenta").textContent = "";
        if (clave === previo) return; previo = clave;
        r("estado").textContent = fin ? "■ FIN" : perfil.tipo === "director" ? (R.estado.corriendo ? "▶ EN MARCHA" : "⏸ DETENIDO") : tocaYa ? "▶ TOCAS" : "⏸ SILENCIO";
        caja.classList.toggle("silencio", !tocaYa && !fin); caja.classList.toggle("toca", tocaYa && !fin);
        r("sec").textContent = sec.nombre;
        r("ac").textContent = bonito(ac.nombre);
        r("sig").textContent = ac.siguiente ? bonito(ac.siguiente) : "fin";
      },
    };
  }

  /* ============================== barra del cronómetro ============================== */
  function crearBarraReloj(esDirector) {
    const caja = el(`<div class="reloj-barra">
      <button class="btn grande" data-r="play">▶ Iniciar</button>
      <button class="btn" data-r="inicio" title="Volver a 0:00">⏮</button>
      <select data-r="ir" aria-label="Ir a sección"></select>
      <span class="red" data-r="red"></span>
      <button class="chip" data-r="sala" hidden title="Quiénes están conectados a tu sala">👥 Sala</button>
      <button class="chip" data-r="solo" hidden title="Deja de seguir al cronómetro en red y usa uno propio">Practicar solo</button>
    </div>`);
    const r = k => $(`[data-r=${k}]`, caja);
    const sel = r("ir");
    sel.add(new Option("Ir a sección…", ""));
    SECCIONES.forEach(s => sel.add(new Option(`${fmt(s.ini)} · ${s.nombre}`, s.ini)));
    r("play").onclick = () => (R.estado.corriendo ? R.pausar() : R.iniciar(R.ahora() >= DURACION ? 0 : undefined));
    r("inicio").onclick = () => R.ir(0);
    sel.onchange = () => { if (sel.value !== "") R.ir(+sel.value); sel.value = ""; };
    r("solo").onclick = () => R.practicarSolo(!R.estado.practica);
    r("sala").onclick = () => ventanaSala();
    const pintarSala = () => {
      const st = R.estado, n = st.sala.length;
      r("sala").hidden = !(st.maestro && st.modo === "red");
      r("sala").textContent = `👥 ${n} ${n === 1 ? "laptop" : "laptops"}`;
    };
    const relojSala = setInterval(() => { if (!caja.isConnected) return clearInterval(relojSala); pintarSala(); }, 1000);
    function pintar() {
      const st = R.estado, red = st.modo === "red", manda = R.manda(esDirector);
      pintarSala();
      r("play").textContent = st.corriendo ? "⏸ Pausa" : "▶ Iniciar";
      [r("play"), r("inicio"), sel].forEach(x => { x.hidden = !manda; });
      r("solo").hidden = !red || (esDirector && !st.maestro) || st.maestro; r("solo").classList.toggle("on", st.practica);
      r("red").className = "red " + (!red ? "local" : st.practica ? "local" : st.conectado ? "ok" : "mal");
      r("red").textContent = !red ? "Cronómetro propio" : st.practica ? "Practicando solo" : st.conectado
        ? (st.maestro ? "🎛️ Maestro · tú inicias la obra para todos" : st.app === "musico" ? "🔗 Conectado · el maestro inicia la obra"
          : esDirector ? "🔗 En red · controlas el cronómetro" : "🔗 En red · lo maneja el Cronómetro") : "⚠ Sin conexión con el maestro";
    }
    R.alCambiar(pintar); pintar();
    return caja;
  }

  /* ============================== notas que caen (como osu!mania) ============================== */
  // Las notas de la pista MIDI de tu parte caen hacia el piano; cuando lo tocan, hay que tocarlas.
  // piano: el elemento con las teclas (.tecla[data-m]); mapear(m) lleva una nota de la pista a una tecla visible.
  // Secciones libres (partitura → libre: true): ahí no caen notas, cada uno improvisa
  const LIBRES = SECCIONES.filter(s => s.libre).map(s => [s.ini, s.fin]);
  const enLibre = t => LIBRES.some(([a, b]) => t >= a && t < b);
  const VELOCIDADES = [[4, "Lenta"], [2.6, "Normal"], [1.7, "Rápida"]];
  function crearCascada(pista, piano, mapear) {
    const caja = el(`<div class="cascada"><div class="cascada-lienzo"><canvas></canvas></div></div>`);
    // encender/apagar y velocidad: van en el panel de ajustes (debajo del piano)
    const controles = el(`<div class="fila">
        <button class="chip" data-r="on" title="Las notas de tu parte caen hacia el piano: tócalas cuando lleguen">🎼 Notas que caen</button>
        <label class="campo en-linea">Velocidad <select data-r="vel"></select></label>
      </div>`);
    const r = x => $(`[data-r="${x}"]`, controles), lienzo = $("canvas", caja), marco = $(".cascada-lienzo", caja), g = lienzo.getContext("2d");
    const notas = pista.notas, durMax = notas.reduce((a, n) => Math.max(a, n.d), 0);
    let activo = leer("v3:cascada", true), mirar = leer("v3:cascadaVel", 2.6);
    VELOCIDADES.forEach(([v, n]) => r("vel").add(new Option(n, v)));
    r("vel").value = mirar;
    r("vel").onchange = e => { mirar = +e.target.value; guardar("v3:cascadaVel", mirar); };
    const pintarOn = () => { r("on").classList.toggle("on", activo); marco.hidden = !activo; r("vel").closest("label").hidden = !activo; };
    r("on").onclick = () => { activo = !activo; guardar("v3:cascada", activo); pintarOn(); medir(); };
    pintarOn();

    // columnas: la posición de cada tecla del piano
    let cols = new Map(), ancho = 0, alto = 0, dpr = 1;
    function medir() {
      const base = piano.getBoundingClientRect(); cols = new Map();
      piano.querySelectorAll(".tecla").forEach(t => {
        const b = t.getBoundingClientRect();
        const pc = t.querySelector(".pc");
        cols.set(+t.dataset.m, { x: b.left - base.left, w: b.width, negra: t.classList.contains("negra"), letra: pc ? pc.textContent : "" });
      });
      dpr = window.devicePixelRatio || 1; ancho = marco.clientWidth; alto = marco.clientHeight;
      lienzo.width = Math.round(ancho * dpr); lienzo.height = Math.round(alto * dpr);
      lienzo.style.width = ancho + "px"; lienzo.style.height = alto + "px";
    }
    const ro = window.ResizeObserver ? new ResizeObserver(medir) : null;
    if (ro) { ro.observe(piano); ro.observe(marco); } else window.addEventListener("resize", medir);

    // sin juego: no hay puntaje, racha ni avisos; las notas solo muestran qué tocar y cuándo
    function reiniciar() {}
    function golpe() {}
    function rect(x, y, w, h, rad) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, rad); else g.rect(x, y, w, h); g.fill(); }
    function dibujar(tc, corriendo) {
      if (!activo) return;
      if (!ancho || cols.size === 0) medir();
      const W = ancho, H = alto, porSeg = H / mirar;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      // carriles: un fondo más oscuro bajo las teclas negras
      cols.forEach(c => { if (c.negra) { g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(c.x, 0, c.w, H); } });
      cols.forEach((c, m) => { if (!c.negra && m % 12 === 0) { g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(c.x, 0, 1, H); } });
      // cambios de acorde que vienen: una línea con el nombre
      let x = tc;
      g.font = "600 12px system-ui, sans-serif"; g.textBaseline = "bottom";
      for (let k = 0; k < 8; k++) {
        const a = acordeEn(tObra(x)); if (!a.siguiente || a.falta == null) break;
        const tCambio = x + a.falta; if (tCambio > tc + mirar) break;
        const y = H - (tCambio - tc) * porSeg, sig = acordeEn(tObra(tCambio + 0.01));
        g.fillStyle = sig.color || "#7c9cff"; g.globalAlpha = 0.55; g.fillRect(0, y, W, 1.5); g.globalAlpha = 1;
        g.fillStyle = "rgba(242,239,248,.85)"; g.fillText(bonito(a.siguiente), 6, y - 2);
        x = tCambio + 0.02;
      }
      // notas
      const desde = lb(notas, tc - durMax - 0.5, n => n.t);
      for (let i = desde; i < notas.length && notas[i].t <= tc + mirar; i++) {
        const n = notas[i]; if (n.t + n.d < tc - 0.3 || enLibre(n.t)) continue;
        const c = cols.get(mapear(n.m)); if (!c) continue;
        const yIni = H - (n.t - tc) * porSeg, h = Math.max(8, n.d * porSeg);
        const suena = n.t <= tc && tc < n.t + n.d;
        g.fillStyle = suena ? "#ffd36b" : c.negra ? "#b98bff" : "#ff6b9a";
        const pad = c.negra ? 1 : 2;
        rect(c.x + pad, yIni - h, c.w - pad * 2, h, Math.min(6, c.w / 3));
        g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(c.x + pad + 2, yIni - 4, c.w - pad * 2 - 4, 3);   // el borde que golpea
      }
      // la letra de cada carril, justo sobre la tecla
      g.textAlign = "center"; g.textBaseline = "alphabetic"; g.font = "800 13px system-ui, sans-serif";
      cols.forEach(c => { if (!c.letra) return; g.fillStyle = c.negra ? "rgba(185,139,255,.55)" : "rgba(242,239,248,.42)"; g.fillText(c.letra, c.x + c.w / 2, H - (c.negra ? 26 : 9)); });
      g.textAlign = "start"; g.textBaseline = "bottom";
      // secciones libres: una franja "IMPROVISA" en vez de notas
      LIBRES.forEach(([a, b]) => {
        if (b < tc || a > tc + mirar) return;
        const y0 = H - (Math.min(b, tc + mirar) - tc) * porSeg, y1 = H - (Math.max(a, tc) - tc) * porSeg;
        g.fillStyle = "rgba(124,156,255,.10)"; g.fillRect(0, y0, W, y1 - y0);
        g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(242,239,248,.9)"; g.font = "800 22px system-ui, sans-serif";
        const yc = (y0 + y1) / 2, falta = b - Math.max(a, tc);
        g.fillText("IMPROVISA", W / 2, yc - 12);
        g.font = "600 13px system-ui, sans-serif"; g.fillStyle = "rgba(242,239,248,.7)";
        g.fillText(tc >= a ? `libre con tus teclas · quedan ${fmt(falta)}` : `en ${Math.ceil(a - tc)} s`, W / 2, yc + 14);
        g.textAlign = "start"; g.textBaseline = "bottom";
      });
      // la línea donde se toca (el borde del piano)
      g.fillStyle = "rgba(255,107,154,.9)"; g.fillRect(0, H - 3, W, 3);
    }
    return { caja, controles, dibujar, golpe, medir, reiniciar, destruir() { if (ro) ro.disconnect(); else window.removeEventListener("resize", medir); } };
  }

  /* ============================== teclado ============================== */
  // El piano muestra solo el registro de tu parte (al menos una octava). Teclado de la computadora:
  // teclas blancas en la fila del medio (A S D F G H J K L Ñ) y cada negra en la tecla de arriba que queda en ese hueco
  // (entre A y S → Q, entre S y D → W, …, hasta I/O). Se usa la posición física de la tecla (e.code): da igual el idioma.
  const FILA_BLANCAS = ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon"];
  const FILA_NEGRAS = ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO"];
  const letraPC = code => code === "Semicolon" ? "Ñ" : code.replace(/^Key|^Digit/, "");
  const esNegra = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
  // Registro del piano para una pista: de la nota más grave a la más aguda, ampliado a una octava como mínimo,
  // con blancas en los bordes y a lo más 10 blancas (las que caben en la fila A–Ñ)
  function registroDe(notas, desplaz, porDefecto) {
    let lo, hi;
    if (notas && notas.length) { lo = Infinity; hi = -Infinity; notas.forEach(n => { lo = Math.min(lo, n.m + desplaz); hi = Math.max(hi, n.m + desplaz); }); }
    else { lo = porDefecto; hi = porDefecto + 12; }
    // si la parte usa menos de una octava, el piano parte en el Do de abajo (más fácil de ubicar) y mide al menos una octava
    if (hi - lo < 12) { const lo2 = lo - (((lo % 12) + 12) % 12); if (Math.max(lo2 + 12, hi) - lo2 <= 16) { hi = Math.max(lo2 + 12, hi); lo = lo2; } else { const c = (lo + hi) / 2; lo = Math.floor(c - 6); hi = lo + 12; } }
    while (esNegra(lo)) lo--;
    while (esNegra(hi)) hi++;
    const blancas = m => { let n = 0; for (let x = lo; x <= m; x++) if (!esNegra(x)) n++; return n; };
    while (blancas(hi) > FILA_BLANCAS.length) { hi--; while (esNegra(hi)) hi--; }
    return [lo, hi];
  }
  async function crearTeclado(perfil, caja) {
    // el "Teclado líder" usa el perfil de la guitarra (id "guitarra"): toca la melodía con preset lead
    const id = perfil.id, k = new Teclado(perfil.preset || "lead"), pista = await pistaDe(id);
    k.p.vol *= nivelDe(id); k.aplicar();   // nivel de referencia del rol (partitura → niveles)
    const defFL0 = P.sonidos && P.sonidos[id];
    const defFL = defFL0 && !defFL0.archivo && defFL0.nota ? defFL0.nota : defFL0;   // la guitarra guarda su sample en .nota
    const desplaz = defFL && defFL.real != null ? defFL.base - defFL.real : 0;   // los teclados bajos se tocan una octava arriba de cómo suenan
    // con carriles, el piano son solo las notas de tu parte, una por tecla en la fila A S D F…
    const requeridas = pista ? [...new Set(pista.notas.map(n => n.m + desplaz))].sort((a, b) => a - b) : [];
    const carriles0 = carrilesConEscala(requeridas), esRequerida = m => requeridas.includes(m - 12 * octavas);
    const [lo0, hi0] = carriles0 ? [carriles0[0], carriles0[carriles0.length - 1]] : registroDe(pista && pista.notas, desplaz, 12 * (k.p.octava + 1));
    const enCarriles = () => carriles0 ? carriles0.map(m => m + 12 * octavas) : null;
    let octavas = leer("v3:octd:" + id, 0), inicio = lo0 + 12 * octavas, fin = hi0 + 12 * octavas;
    const teclaDe = new Map();   // e.code → nota MIDI del piano visible
    let bucle = null;
    const voces = new Map();   // tecla → { v, m0, actual, fija }
    // Cada nota suena mientras mantienes apretada su tecla (no hay notas fijas ni acorde automático)
    const mantener = false;
    let modo = leer("v3:modo:" + id, "cercana"), deslizT = leer("v3:desliz:" + id, 0.5);

    caja.innerHTML = "";
    const opciones = el(`<div class="paso">
      <div class="paso-cab"><span class="n">1</span><b>Sonido</b><button class="btn btn-ayuda" data-r="ayuda" title="Cómo funciona el teclado">? Cómo funciona</button></div>
      <div class="fila"><span class="sonido-fijo" title="El sonido de todos los teclados">🎛️ Square Woof · FL Studio</span>
        <div class="grupo-oct"><button class="btn" data-r="oct-" title="Bajar una octava (←)">− oct</button><span data-r="oct"></span><button class="btn" data-r="oct+" title="Subir una octava (→)">+ oct</button></div></div>
    </div>`);
    const toques = el(`<div class="paso">
      <div class="paso-cab"><span class="n">2</span><b>Tocar</b></div>
      <div class="fila"><button class="btn" data-r="soltar" title="Apaga todas las notas que suenan">✋ Soltar todo <kbd>Esc</kbd></button>
        <button class="btn btn-glis" data-r="glis" title="Qué hacen las notas que siguen sonando cuando cambia el acorde"></button></div>
      <p class="explica">La nota suena <b>mientras mantienes apretada</b> la tecla (mouse, dedo o teclado de la computadora) y se apaga al soltar.</p>
    </div>`);
    const estado = el(`<div class="estado-tec" aria-live="polite"></div>`);
    const piano = el(`<div class="piano" role="group" aria-label="Teclado"></div>`);
    const leyenda = el(`<div class="leyenda"><span class="l-acorde">nota del acorde: suena segura</span><span class="l-raiz">raíz del acorde</span>
      <span class="l-escala">de la escala: tensión</span><span class="l-fuera">fuera de la escala: disonancia</span>
      <span class="l-guia">lo que toca tu parte en el arreglo</span><span class="l-sig">nota del acorde que viene</span></div>`);
    // "Cuando cambia el acorde" vive en una ventana que se abre con su botón
    const glis = el(`<div class="glis-ventana">
      <div class="fila"><label class="campo">Las notas que siguen sonando
        <select data-r="modo">
          <option value="cercana">se deslizan a la nota del acorde más cercana</option>
          <option value="paralelo">se mueven junto con el acorde (conservan la tensión)</option>
          <option value="quieto">se quedan donde están</option>
        </select></label>
      <label class="campo corto">El deslizamiento dura <input type="range" min="0.05" max="2" step="0.05" data-r="desliz"><b data-r="deslizv"></b></label></div>
      <p class="explica">Deja una nota apretada (o fija) cuando llega el cambio: se desliza sola y llega justo con el acorde nuevo, sin tener que seguir el tempo.</p>
    </div>`);
    const fx = el(`<div class="efectos"></div>`);
    const pasoFx = el(`<div class="paso"><div class="paso-cab"><span class="n">3</span><b>Efectos</b></div></div>`);
    pasoFx.appendChild(fx);
    // tu parte, llevada a la octava visible del piano
    const mapear = m0 => { let m = m0 + desplaz + 12 * octavas; if (carriles0) return m; while (m < inicio) m += 12; while (m > fin) m -= 12; return m; };
    const cascada = pista && pista.notas.length ? crearCascada(pista, piano, mapear) : null;
    // Sonido, Tocar y Efectos van debajo del instrumento, en un panel que se abre al hacer clic (cerrado al entrar)
    const ajustes = el(`<details class="ajustes"><summary><span>⚙️ Sonido · Tocar · Efectos</span><small>octava, soltar todo, cambio de acorde, notas que caen y efectos</small></summary><div class="ajustes-cuerpo"></div></details>`);
    const pasoCascada = cascada ? el(`<div class="paso"><div class="paso-cab"><span class="n">3</span><b>Notas que caen</b></div></div>`) : null;
    if (cascada) { pasoCascada.appendChild(cascada.controles); $(".n", pasoFx).textContent = "4"; }
    $(".ajustes-cuerpo", ajustes).append(opciones, toques, ...(pasoCascada ? [pasoCascada] : []), pasoFx);
    caja.append(...(cascada ? [cascada.caja] : []), piano, leyenda, ajustes);   // (la línea "Acorde ahora / Suenan" ya no se muestra)
    const r = (x, raiz = caja) => $(`[data-r="${x}"]`, raiz);

    // sonido
    // Sonido: todos los teclados usan Square Woof (FL Studio); de sus dos muestras se elige la más cercana a tu registro.
    // Su volumen se iguala con el del sample que tenía antes cada teclado (Square Woof suena más fuerte).
    const SONIDO_TECLADOS = "square-woof";
    let ajusteVol = 1;
    async function ponerSonido() {
      try {
        const c = (P.catalogo || []).find(x => x.id === SONIDO_TECLADOS);
        const centro = (inicio + fin) / 2 - desplaz;
        const mu = c.muestras.slice().sort((a, b) => Math.abs(a.real - centro) - Math.abs(b.real - centro))[0];
        const s = await cargarSonido(mu.archivo);
        if (defFL) { try { ajusteVol = lim(rmsDe((await cargarSonido(defFL.archivo)).buffer) / rmsDe(s.buffer), 0.3, 2); } catch (e) { ajusteVol = 1; } }
        k.buffer = s.buffer; bucle = s.bucle; k.base = mu.real + desplaz; return;
      } catch (e) { console.warn("sonido:", e.message); }
      k.buffer = null; bucle = null; ajusteVol = 1;   // sin la muestra, el sintetizador del teclado
    }
    await ponerSonido();

    // voces
    function crearVoz(m, vel, t) {
      if (!k.buffer) return k.crearVoz(m, vel, t);
      const ctx = Motor.ctx, g = ctx.createGain(), s = ctx.createBufferSource();
      s.buffer = k.buffer; s.playbackRate.value = Math.pow(2, (m - k.base) / 12);
      if (bucle) { s.loop = true; s.loopStart = bucle[0]; s.loopEnd = bucle[1]; }
      g.connect(k.filtro); s.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * ajusteVol, t + 0.008);
      s.start(t);
      return { g, fuentes: [s], rel: 0.45 };
    }
    function on(m, fija = false, vel = 0.85) {
      if (voces.has(m)) return;
      voces.set(m, { v: crearVoz(m, vel * volNota(id, m - desplaz - 12 * octavas), Motor.t), m0: m, actual: m, cents: 0, fija });
      pintarTeclas();
    }
    function off(m) {
      const x = voces.get(m); if (!x) return;
      Motor.soltar(x.v.g, Motor.t, x.v.rel, x.v.fuentes); voces.delete(m); pintarTeclas();
    }
    function soltarTodo() { [...voces.keys()].forEach(off); pintarOpciones(); }
    // Glissando: se mueve el "detune" de cada fuente (en centésimas) desde donde está hasta la nota nueva
    function deslizar(x, destino, t0, dur) {
      const cents = (destino - x.m0) * 100;
      x.v.fuentes.forEach(f => {
        if (!f.detune || (f.frequency && f.frequency.value < 30)) return;   // el vibrato no se desliza
        f.detune.cancelScheduledValues(t0); f.detune.setValueAtTime(x.cents, t0); f.detune.linearRampToValueAtTime(cents, t0 + dur);
      });
      x.cents = cents; x.actual = destino;
    }
    function destinos(lista, viejo, nuevo) {
      const tn = tonosDe(nuevo), ocupados = new Set();
      const a = parseAcorde(nuevo), b = parseAcorde(viejo);
      let paso = a && b ? ((a.raiz - b.raiz) % 12 + 12) % 12 : 0; if (paso > 6) paso -= 12;
      return lista.map(x => {
        if (modo === "quieto" && !x.fija) return x.actual;
        if (modo === "paralelo" && !x.fija) return x.actual + paso;
        // la nota del acorde más cercana que no esté ocupada (con empate, hacia abajo)
        for (let d = 0; d <= 12; d++) for (const s of [-1, 1]) {
          const c = x.actual + s * d;
          if (tn.includes(((c % 12) + 12) % 12) && !ocupados.has(c)) { ocupados.add(c); return c; }
        }
        return x.actual;
      });
    }
    function cambiarAcorde(viejo, nuevo, tAudio) {
      const lista = [...voces.values()];
      if (!lista.length || !nuevo) return;
      const dur = deslizT, t0 = Math.max(Motor.t, tAudio - dur);   // llega justo con el acorde nuevo
      destinos(lista, viejo, nuevo).forEach((d, i) => deslizar(lista[i], d, t0, Math.max(0.03, tAudio - t0)));
      setTimeout(pintarTeclas, Math.max(0, (tAudio - Motor.t) * 1000));
    }

    // teclas
    let teclas = [];
    function dibujarPiano() {
      piano.innerHTML = "";
      teclaDe.clear();
      teclas = [];
      const carriles = enCarriles();
      piano.classList.toggle("en-carriles", !!carriles);
      // con carriles: una tecla ancha por nota, todas en la fila A S D F…; si no, el piano cromático
      const notas = carriles || Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
      const blancas = carriles ? notas : notas.filter(m => !esNegra(m));
      const ancho = 100 / blancas.length;
      for (const m of notas) {
        const negra = !carriles && esNegra(m);
        const libre = carriles && !esRequerida(m);
        const t = el(`<button class="tecla ${negra ? "negra" : "blanca"}${carriles ? " carril" + (esNegra(m) ? " alterada" : "") + (libre ? " libre" : "") : ""}" data-m="${m}" tabindex="-1"${libre ? ' title="Nota libre de la escala: para improvisar"' : ""}><span class="nom"></span><i class="pc"></i></button>`);
        if (negra) { const iz = blancas.indexOf(m - 1); t.style.left = `calc(${(iz + 1) * ancho}% - ${ancho * 0.31}%)`; t.style.width = ancho * 0.62 + "%"; }
        else t.style.width = ancho + "%";
        // blanca n → fila A–Ñ; negra entre la blanca n y la n+1 → la tecla de arriba en ese hueco (Q, W, E…)
        const nb = blancas.filter(b => b < m).length, code = negra ? FILA_NEGRAS[nb - 1] : FILA_BLANCAS[nb];
        if (code) { teclaDe.set(code, m); $(".pc", t).textContent = letraPC(code); }
        t.addEventListener("pointerdown", e => { e.preventDefault(); if (t.hasPointerCapture(e.pointerId)) t.releasePointerCapture(e.pointerId); pulsar(m); });
        t.addEventListener("pointerup", () => soltarTecla(m));
        t.addEventListener("pointerleave", e => { if (e.buttons) soltarTecla(m); });
        t.addEventListener("pointerenter", e => { if (e.buttons && !mantener) pulsar(m); });   // arrastrar el dedo = glissando de teclas
        piano.appendChild(t); teclas.push(t);
      }
      r("oct", opciones).textContent = nombreNota(inicio) + "–" + nombreNota(fin);
      ultimoPintado = "";
      pintarTeclas();
      if (cascada) { cascada.medir(); cascada.reiniciar(); }
    }
    function pulsar(m, vel) {
      const nueva = !voces.has(m);
      if (mantener) { voces.has(m) ? off(m) : on(m, false, vel); } else on(m, false, vel);
      if (cascada && nueva) cascada.golpe(m, tObra(R.ahora()));
    }
    function soltarTecla(m) { if (!mantener) { const x = voces.get(m); if (x && !x.fija) off(m); } }
    let ultimoPintado = "", guia = [], sigTonos = [];
    function pintarTeclas() {
      const ac = acordeEn(tObra(R.ahora())), a = parseAcorde(ac.nombre), tn = tonosDe(ac.nombre);
      const suenan = new Set([...voces.values()].map(x => x.actual)), apretadas = new Set(voces.keys());
      const clave = [ac.nombre, [...suenan].join(","), [...apretadas].join(","), guia.join(","), sigTonos.join(",")].join("|");
      if (clave === ultimoPintado) return; ultimoPintado = clave;
      teclas.forEach(t => {
        const m = +t.dataset.m, pc = m % 12;
        t.classList.toggle("acorde", tn.includes(pc)); t.classList.toggle("raiz", !!a && pc === a.raiz);
        t.classList.toggle("escala", !tn.includes(pc) && ESCALA.has(pc)); t.classList.toggle("fuera", !ESCALA.has(pc));
        t.classList.toggle("on", apretadas.has(m)); t.classList.toggle("suena", suenan.has(m) && !apretadas.has(m));
        t.classList.toggle("guia", guia.includes(m)); t.classList.toggle("sig", sigTonos.includes(pc) && !tn.includes(pc));
        $(".nom", t).textContent = t.classList.contains("carril") ? nombreNota(m) : tn.includes(pc) || pc === 0 ? PC[pc] + (pc === 0 ? Math.floor(m / 12) - 1 : "") : "";
      });
      caja.style.setProperty("--color", ac.color || "#7c9cff");
    }
    function pintarOpciones() {
      r("modo", glis).value = modo; r("desliz", glis).value = deslizT; r("deslizv", glis).textContent = deslizT.toFixed(2).replace(".", ",") + " s";
      r("glis", toques).textContent = `🎚️ Cambio de acorde: ${{ cercana: "se deslizan", paralelo: "se mueven juntas", quieto: "quietas" }[modo]} · ${deslizT.toFixed(2).replace(".", ",")} s`;
    }
    r("soltar", toques).onclick = () => soltarTodo();
    r("oct-", opciones).onclick = () => mover(-12); r("oct+", opciones).onclick = () => mover(12);
    function mover(d) {
      soltarTodo();
      const o = lim(octavas + Math.sign(d), -3, 3); if (o === octavas || lo0 + 12 * o < 12 || hi0 + 12 * o > 108) return;
      octavas = o; inicio = lo0 + 12 * o; fin = hi0 + 12 * o; guardar("v3:octd:" + id, o); dibujarPiano();
      ponerSonido();   // la muestra de Square Woof más cercana al registro nuevo
    }
    r("modo", glis).onchange = e => { modo = e.target.value; guardar("v3:modo:" + id, modo); pintarOpciones(); };
    r("glis", toques).onclick = () => abrirVentana("🎚️ Cuando cambia el acorde", glis, { alCerrar: () => glis.remove() });
    r("desliz", glis).oninput = e => { deslizT = +e.target.value; guardar("v3:desliz:" + id, deslizT); pintarOpciones(); };
    r("ayuda", opciones).onclick = () => ayudaTeclado();
    dibujarPiano(); pintarOpciones();

    // Línea de estado: qué suena ahora y adónde va al cambiar de acorde
    let estadoPrevio = "";
    function pintarEstado(ac) {
      const lista = [...voces.values()].sort((a, b) => a.actual - b.actual);
      let html;
      if (!lista.length) {
        html = `Acorde ahora: <b class="ac">${esc(bonito(ac.nombre))}</b> · toca una tecla de color: son sus notas (el punto marca la raíz).`;
      } else {
        html = `Suenan: <b>${lista.map(x => nombreNota(x.actual)).join(" · ")}</b>`;
        if (ac.siguiente && ac.falta < Math.max(2.5, deslizT + 0.6)) {
          const ds = destinos(lista, ac.nombre, ac.siguiente);
          const van = lista.map((x, i) => [x.actual, ds[i]]).filter(([a, d]) => a !== d);
          const quedan = lista.length - van.length;
          const que = !van.length ? "todas se quedan (ya están en el acorde)"
            : van.map(([a, d]) => `<b>${nombreNota(a)} → ${nombreNota(d)}</b>`).join(", ") + (quedan ? ` (${quedan === 1 ? "la otra se queda" : "las demás se quedan"})` : "");
          html += ` <span class="va">· con <b class="ac">${esc(bonito(ac.siguiente))}</b> en ${Math.max(0, ac.falta).toFixed(1).replace(".", ",")} s: ${que}</span>`;
        }
      }
      if (html !== estadoPrevio) { estadoPrevio = html; estado.innerHTML = html; }
    }

    // efectos
    const auto = efectosAuto(perfil, k, mapaEfectosTeclado(perfil), () => ds.forEach(d => d.mostrar()));
    const ds = [deslizador("Distorsión", k, "dist", auto), deslizador("Brillo", k, "filtro", auto), deslizador("Reverb", k, "reverb", auto),
      deslizador("Volumen", k, "vol", auto, { max: 1.5 })];
    const ba = botonAuto(auto, ds);
    fx.append(ba.b, ...ds);

    // teclado de la computadora
    const abajo = new Map();   // e.code → la nota que encendió (aunque cambies de octava mientras la mantienes)
    const alBajar = e => {
      if (escribiendo(e) || e.repeat || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); return mover(-12); }
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); return mover(12); }
      if (e.key === "Escape") { soltarTodo(); return; }
      if (e.key === "?") { ayudaTeclado(); return; }
      const m = teclaDe.get(e.code); if (m == null || e.altKey) return;
      e.preventDefault(); abajo.set(e.code, m); pulsar(m);
    };
    const alSubir = e => { const m = abajo.get(e.code); if (m != null) { abajo.delete(e.code); soltarTecla(m); } };
    // si la ventana pierde el foco con teclas apretadas, se sueltan
    const alPerderFoco = () => { abajo.forEach(m => soltarTecla(m)); abajo.clear(); };
    window.addEventListener("blur", alPerderFoco);
    document.addEventListener("keydown", alBajar); document.addEventListener("keyup", alSubir);

    // la primera vez, la ayuda se abre sola
    if (!leer("v3:ayudaTec", false)) { guardar("v3:ayudaTec", true); setTimeout(ayudaTeclado, 400); }

    // cada cuadro: glissando a tiempo con el cambio de acorde, guía MIDI y marcas
    let acordeActual = acordeEn(tObra(R.ahora())).nombre, agendado = null;
    // teclado MIDI USB: la nota que tocas suena tal cual (con el cambio de octava de ← →), sin límite de teclas
    const midiAbajo = new Map();
    function midi(enciende, n, v) {
      if (enciende) { const m = n + desplaz + 12 * octavas; if (midiAbajo.has(n)) soltarTecla(midiAbajo.get(n)); midiAbajo.set(n, m); pulsar(m, 0.3 + 0.55 * (v / 127)); }
      else { const m = midiAbajo.get(n); if (m != null) { midiAbajo.delete(n); soltarTecla(m); } }
    }
    return {
      midi,
      ayuda: (carriles0 ? "Teclas A S D F G H J K L Ñ: tus notas, de grave a aguda" : "A–Ñ teclas blancas · Q–O negras")
        + " · ← → octava · Esc soltar todo · ? ayuda · también puedes tocar con un teclado MIDI USB",
      cuadro(t, dt, corriendo) {
        auto.cuadro(t);
        const tc = tObra(t), ac = acordeEn(tc);
        if (corriendo && ac.siguiente && ac.falta <= deslizT + 0.12) {
          const cuando = Math.round((tc + ac.falta) * 20);
          if (agendado !== cuando) { agendado = cuando; cambiarAcorde(ac.nombre, ac.siguiente, enAudio(tc + ac.falta)); acordeActual = ac.siguiente; }
        } else if (ac.nombre !== acordeActual && !(corriendo && agendado != null && tc < agendado / 20 + 0.3)) {
          cambiarAcorde(acordeActual, ac.nombre, Motor.t + deslizT); acordeActual = ac.nombre;   // salto o reloj detenido
        }
        if (ac.nombre === acordeActual && agendado != null && agendado / 20 < tc - 0.5) agendado = null;
        // guía: notas de tu pista MIDI que suenan ahora, llevadas a la octava visible
        guia = pista && !enLibre(tc) ? window.MIDI.sonando(pista, tc).map(n => mapear(n.m)) : [];
        if (cascada) cascada.dibujar(tc, corriendo && t >= 0 && t < DURACION);
        sigTonos = ac.falta < 2.2 && ac.siguiente ? tonosDe(ac.siguiente) : [];
        pintarTeclas(); pintarEstado(ac);
      },
      destruir() { soltarTodo(); document.removeEventListener("keydown", alBajar); document.removeEventListener("keyup", alSubir); window.removeEventListener("blur", alPerderFoco); if (cascada) cascada.destruir(); },
    };
  }

  /* ============================== recuadro X/Y (ambiente) ============================== */
  function crearXY(perfil, { alMover, etiquetas = ["limpio", "distorsión", "intenso ↑"] }) {
    const caja = el(`<div class="xy-caja">
      <div class="xy" tabindex="0"><span class="et a">${etiquetas[0]}</span><span class="et b">${etiquetas[1]}</span><span class="et c">${etiquetas[2]}</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline class="camino" points=""/></svg>
        <div class="anillo"><span></span></div><div class="punto"></div></div>
      <div class="xy-info"><b data-r="consejo"></b>
        <button class="chip" data-r="auto" title="El punto sigue la guía solo; si lo mueves, vuelves a tomar el control">🤖 Seguir la guía sola (G)</button></div>
    </div>`);
    const xy = $(".xy", caja), punto = $(".punto", caja), anillo = $(".anillo", caja), camino = $(".camino", caja);
    const consejo = $("[data-r=consejo]", caja), bAuto = $("[data-r=auto]", caja);
    let x = 0.4, y = 0.5, auto = leer("v3:xyauto:" + perfil.id, true);
    const tieneGuia = !!guiaXYEn(0, perfil);
    if (!tieneGuia) { bAuto.hidden = true; anillo.hidden = true; auto = false; }
    const pintarAuto = () => bAuto.classList.toggle("on", auto);
    const ponerAuto = v => { auto = v && tieneGuia; guardar("v3:xyauto:" + perfil.id, auto); pintarAuto(); };
    bAuto.onclick = () => ponerAuto(!auto); pintarAuto();
    function poner(nx, ny) { x = lim(nx); y = lim(ny); punto.style.left = x * 100 + "%"; punto.style.top = (1 - y) * 100 + "%"; alMover(x, y); }
    const mover = e => { ponerAuto(false); const rc = xy.getBoundingClientRect(); poner((e.clientX - rc.left) / rc.width, 1 - (e.clientY - rc.top) / rc.height); };
    xy.addEventListener("pointerdown", e => { e.preventDefault(); xy.setPointerCapture(e.pointerId); mover(e); });
    xy.addEventListener("pointermove", e => { if (e.buttons) mover(e); });
    return {
      caja, poner, get x() { return x; }, get y() { return y; }, get auto() { return auto; }, ponerAuto,
      flecha(dx, dy) { ponerAuto(false); poner(x + dx, y + dy); },
      // devuelve la guía (o null); con "auto" mueve el punto hacia ella
      cuadro(t, dt, encendido, color) {
        const tc = tObra(t), g = tieneGuia ? guiaXYEn(tc, perfil) : null;
        const rr = Math.round(90 + x * 165), gg = Math.round(40 + (1 - x) * 60), bb = Math.round(120 * (1 - x) + 40);
        xy.style.background = `radial-gradient(circle at ${x * 100}% ${(1 - y) * 100}%, rgba(${rr},${gg},${bb},${encendido ? 0.35 + y * 0.55 : 0.12}), rgba(10,8,18,.92) 72%), ${color || "#111"}22`;
        if (!g) { consejo.textContent = encendido ? "" : "Apagado · Espacio para encender"; return null; }
        anillo.style.left = g.x * 100 + "%"; anillo.style.top = (1 - g.y) * 100 + "%";
        const pts = []; for (let i = 0; i <= 16; i++) { const f = guiaXYEn(tObra(tc + i * 0.5), perfil); pts.push((f.x * 100).toFixed(1) + "," + ((1 - f.y) * 100).toFixed(1)); }
        camino.setAttribute("points", pts.join(" "));
        const dx = g.x - x, dy = g.y - y, silencio = g.y < 0.03;
        const ok = silencio ? (!encendido || y < 0.08) : Math.hypot(dx, dy) < 0.1 && encendido;
        anillo.classList.toggle("ok", ok); anillo.classList.toggle("silencio", silencio);
        $("span", anillo).textContent = silencio ? "silencio" : "";
        consejo.textContent = silencio ? (encendido && y >= 0.08 ? "Silencio: baja o apaga (Espacio)" : "Silencio ✓")
          : !encendido ? "Enciende (Espacio) y ve al anillo" : ok ? "En el punto ✓"
          : [Math.abs(dx) > 0.06 ? (dx > 0 ? "→ más distorsión" : "← más limpio") : "", Math.abs(dy) > 0.06 ? (dy > 0 ? "↑ más intenso" : "↓ más suave") : ""].filter(Boolean).join(" · ");
        if (auto) { const kk = 1 - Math.exp(-dt * 4); poner(x + dx * kk, y + dy * kk); }
        return g;
      },
    };
  }

  /* ============================== ambiente ============================== */
  async function crearAmbiente(perfil, caja) {
    const a = new Ambiente(perfil.preset), def = P.sonidos && P.sonidos[perfil.id], pista = await pistaDe(perfil.id);
    a.p.vol *= nivelDe(perfil.id); a.aplicar();   // nivel de referencia del rol
    if (def) { try { const s = await cargarSonido(def.archivo); a.buffer = s.buffer; a.base = def.base; } catch (e) { console.warn(e.message); } }
    caja.innerHTML = "";
    const fila = el(`<div class="fila opciones"><button class="btn grande" data-r="on">Encender</button>
      <button class="chip" data-r="midi" title="Las notas siguen tu pista MIDI; si no, la raíz de cada acorde">🎼 Notas del MIDI</button>
      <button class="chip" data-r="luces" title="Abre los colores de la obra en otra ventana, para el proyector (L)">🖥️ Ventana de luces (proyector)</button></div>`);
    const xy = crearXY(perfil, { alMover: (x, y) => { a.p.x = x; a.p.y = y; a.aplicar(); } });
    const fx = el(`<div class="efectos"></div>`);
    caja.append(fila, xy.caja, fx);
    const bOn = $("[data-r=on]", fila), bMidi = $("[data-r=midi]", fila);
    let usarMidi = leer("v3:ambmidi:" + perfil.id, true);
    const pintar = () => { bOn.textContent = a.encendido ? "Apagar" : "Encender"; bOn.classList.toggle("on", a.encendido); bMidi.classList.toggle("on", usarMidi); };
    const alternar = () => { if (a.encendido) a.apagar(); else { a.afinar(acordeEn(tObra(R.ahora())).nombre, 0.01); a.encender(); } pintar(); };
    bOn.onclick = () => { xy.ponerAuto(false); alternar(); };
    bMidi.onclick = () => { usarMidi = !usarMidi; guardar("v3:ambmidi:" + perfil.id, usarMidi); if (!usarMidi) a.afinarNotas(null); pintar(); };
    $("[data-r=luces]", fila).onclick = abrirLuces;
    const ds = [deslizador("Volumen", a, "vol", null), deslizador("Reverb", a, "reverb", null)];
    fx.append(...ds);
    xy.poner(a.p.x, a.p.y); pintar();
    const alBajar = e => {
      if (escribiendo(e)) return;
      if (e.code === "Space") { e.preventDefault(); xy.ponerAuto(false); alternar(); }
      else if (e.key.toLowerCase() === "g") xy.ponerAuto(!xy.auto);
      else if (e.key.toLowerCase() === "l") abrirLuces();
      else if (/^Arrow/.test(e.key)) { e.preventDefault(); const d = { ArrowUp: [0, 0.05], ArrowDown: [0, -0.05], ArrowRight: [0.05, 0], ArrowLeft: [-0.05, 0] }[e.key]; xy.flecha(...d); }
    };
    document.addEventListener("keydown", alBajar);
    let acorde = null;
    return {
      ayuda: "Espacio enciende/apaga · flechas mueven X/Y · G sigue la guía · L abre la ventana de luces (proyector)",
      cuadro(t, dt) {
        const tc = tObra(t), ac = acordeEn(tc);
        if (ac.nombre !== acorde) { acorde = ac.nombre; a.afinar(acorde, 0.6); }
        if (usarMidi && pista) { const ns = window.MIDI.sonando(pista, tc).map(n => n.m); if (ns.length) a.afinarNotas(ns, 0.6); }
        const g = xy.cuadro(t, dt, a.encendido, ac.color);
        if (xy.auto && g) { if (g.y >= 0.03 && !a.encendido) alternar(); else if (g.y < 0.03 && a.encendido && xy.y < 0.03) alternar(); }
        // la ventana de luces (luces.html) dibuja lo que manda el ambiente: color, acorde y la X/Y
        if (canalLuces && performance.now() - ultimaLuz > 33) {
          ultimaLuz = performance.now();
          canalLuces.postMessage({ tipo: "luz", color: ac.color || "#7c9cff", acorde: bonito(ac.nombre), seccion: seccionEn(tc).nombre, x: xy.x, y: xy.y,
            on: a.encendido, corriendo: R.estado.corriendo && t < DURACION && R.cuenta() <= 0, fin: t >= DURACION });
        }
      },
      destruir() { a.apagar(); if (canalLuces) canalLuces.postMessage({ tipo: "luz", color: "#000000", x: 0, y: 0, on: false, corriendo: false, fin: false, acorde: "", seccion: "" }); document.removeEventListener("keydown", alBajar); },
    };
  }

  // Ventana de luces: en la app se abre en la pantalla extra (proyector) si hay una; en el navegador, como ventana aparte
  const canalLuces = "BroadcastChannel" in window ? new BroadcastChannel("genesis-luces") : null;
  let ultimaLuz = 0;
  function abrirLuces() {
    if (APP && APP.abrirLuces) return APP.abrirLuces();
    const w = window.open("luces.html", "genesis-luces", "popup,width=960,height=540");
    if (!w) alert("El navegador bloqueó la ventana: permite las ventanas emergentes para esta página.");
  }

  /* ============================== cronómetro (director) ============================== */
  async function crearDirector(perfil, caja) {
    caja.innerHTML = "";
    const lista = el(`<ol class="secciones"></ol>`);
    SECCIONES.forEach(s => {
      const li = el(`<li><button><span class="t">${fmt(s.ini)}</span><span class="n">${esc(s.nombre)}</span><span class="a">${s.acordes.map(bonito).join(" · ")}</span></button></li>`);
      li.style.setProperty("--color", s.colores[0]);
      $("button", li).onclick = () => R.ir(s.ini);
      lista.appendChild(li);
    });
    const red = el(`<div class="info-red"></div>`);
    const orq = el(`<p class="muted small">Para oír el arreglo completo en esta laptop, abre <b>🎧 Orquesta</b> (arriba a la derecha).</p>`);
    caja.append(red, orq, lista);
    if (R.estado.maestro) {
      const i = await R.info();
      red.innerHTML = `🎛️ <b>Eres el maestro.</b> Las demás laptops abren la app Genesis → <b>Unirme a una sala</b> y eligen esta`
        + (i && i.ips.length ? ` (o escriben <code>${i.ips.map(esc).join("</code> o <code>")}</code>).` : ".")
        + ` Al iniciar hay una cuenta regresiva de 3 s y todas parten juntas.`;
    } else if (R.estado.app === "musico") red.innerHTML = `🔗 <b>Conectado al maestro.</b> El cronómetro lo maneja el maestro.`;
    else if (R.estado.modo === "red") {
      const i = await R.info();
      red.innerHTML = i && i.ips.length
        ? `🔗 <b>Cronómetro en red.</b> Cada laptop (en la misma red) abre: ${i.ips.map(ip => `<code>http://${esc(ip)}:${i.puerto}/v3.html</code>`).join(" o ")}`
        : `🔗 <b>Cronómetro en red.</b> Las demás laptops abren esta misma dirección cambiando <code>localhost</code> por la IP de esta laptop.`;
    } else red.innerHTML = `⏱️ <b>Cronómetro propio.</b> Para que todas las laptops partan juntas, usen la <b>app Genesis</b> (escritorio): un Mac abre la sala como maestro y los demás se unen por el wifi (no hace falta internet).`;
    let previo = -1;
    return {
      ayuda: "Espacio inicia/pausa · ← → secciones",
      cuadro(t, dt, corriendo) {
        const idx = seccionEn(tObra(t)).idx;
        if (idx !== previo) { previo = idx; [...lista.children].forEach((li, i) => { li.classList.toggle("actual", i === idx); li.classList.toggle("pasada", i < idx); }); }
      },
      teclas(e) {
        if (e.code === "Space") { e.preventDefault(); R.estado.corriendo ? R.pausar() : R.iniciar(); }
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault(); const s = seccionEn(tObra(R.ahora())), d = e.key === "ArrowRight" ? 1 : (R.ahora() - s.ini > 2 ? 0 : -1);
          const n = SECCIONES[lim(s.idx + d, 0, SECCIONES.length - 1)]; R.ir(n.ini);
        }
      },
      destruir() {},
    };
  }

  /* ============================== acompañamiento: la orquesta ============================== */
  // Para ensayar: esta laptop toca las pistas MIDI del arreglo. Se elige qué partes suenan y con qué sample.
  const PARTES_ORQ = [
    // def: el sample de FL con que se iguala el volumen; son: el sonido (los teclados, siempre Square Woof)
    { id: "teclado-1", tipo: "teclado", nombre: "Teclado 1", sub: "arpegio, notas graves", icono: "🎹", def: "teclado-1", son: "square-woof" },
    { id: "teclado-2", tipo: "teclado", nombre: "Teclado 2", sub: "arpegio agudo y pedal", icono: "🎹", def: "teclado-2", son: "square-woof" },
    { id: "teclado-3", tipo: "teclado", nombre: "Teclado 3", sub: "el bajo", icono: "🎹", def: "teclado-3", son: "square-woof" },
    { id: "teclado-4", tipo: "teclado", nombre: "Teclado 4", sub: "voz interior", icono: "🎹", def: "teclado-4", son: "square-woof" },
    { id: "ambiente-1", tipo: "ambiente", nombre: "Ambiente", sub: "base grave", icono: "🌊", def: "ambiente-1" },
    { id: "guitarra", tipo: "teclado", nombre: "Teclado líder", sub: "la melodía", icono: "🎹", def: "gtr-nota", son: "square-woof" },
  ];
  const BASE_ORQ = ["teclado-3", "ambiente-1"];
  // Samples con altura (los de FL Studio). real = la nota MIDI que suena de verdad.
  const MUESTRAS = (() => {
    const s = P.sonidos || {}, d = (k, nombre) => s[k] && { id: k, nombre, archivo: s[k].archivo, real: s[k].real != null ? s[k].real : s[k].base };
    const g = s.guitarra && s.guitarra.nota;
    return [
      d("teclado-1", "Teclado medio · FL"), d("teclado-2", "Teclado agudo · FL"), d("teclado-3", "Bajo · FL"), d("teclado-4", "Bajo/medio 2 · FL"),
      ...(P.catalogo || []).map(c => ({ id: c.id, nombre: c.nombre.replace(" (FL)", "") + " · FL", muestras: c.muestras })),
      g && { id: "gtr-nota", nombre: "Líder (una nota) · FL", archivo: g.archivo, real: g.base },
      d("ambiente-1", "Ambiente drone · FL"), d("ambiente-3", "Ambiente brillo · FL"),
    ].filter(Boolean);
  })();
  const sonPropio = def => def.son || def.def;   // el sonido de la partitura de cada parte
  function opcionesDe(tipo) {
    if (tipo === "teclado") return [["square-woof", "Square Woof · FL"]];
    const ms = MUESTRAS.map(m => [m.id, m.nombre]);
    return [...ms, ["sint", tipo === "ambiente" ? "Sintetizado (drone suave)" : "Sintetizado"]];
  }
  // Volumen de cada sample (para que al cambiarlo la parte no suba ni baje de golpe)
  const rmsCache = new WeakMap();
  function rmsDe(buffer) {
    if (!rmsCache.has(buffer)) {
      const d = buffer.getChannelData(0), n = Math.min(d.length, Math.floor(buffer.sampleRate * 2)); let a = 0;
      for (let i = 0; i < n; i++) a += d[i] * d[i];
      rmsCache.set(buffer, Math.sqrt(a / Math.max(1, n)) || 0.05);
    }
    return rmsCache.get(buffer);
  }
  // Los ambientes son sonidos sostenidos: en la orquesta se repiten (bucle) para durar lo que dura la nota
  const cacheOrq = new Map();
  function cargarMuestraOrq(ruta) {
    if (BUCLES[ruta] || !/ambiente_/.test(ruta)) return cargarSonido(ruta);
    if (!cacheOrq.has(ruta)) cacheOrq.set(ruta, Motor.cargarURL(ruta).then(b => conBucle(b, [Math.min(1, b.duration * 0.25), b.duration - 0.12])).catch(e => { cacheOrq.delete(ruta); throw e; }));
    return cacheOrq.get(ruta);
  }
  const mediana = notas => { const ms = notas.map(n => n.m).sort((a, b) => a - b); return ms.length ? ms[ms.length >> 1] : 60; };
  // Si el sample está muy lejos del registro de la parte, se toca en otra octava (para no deformarlo)
  function octavasPara(real, med) {
    const d = real - med;
    return Math.abs(d) > 14 ? Math.sign(d) * 12 * Math.ceil((Math.abs(d) - 12) / 12) : 0;
  }
  function vozMuestra(k, s, real, m, vel, t, dur) {
    const ctx = Motor.ctx, g = ctx.createGain(), f = ctx.createBufferSource();
    f.buffer = s.buffer; f.playbackRate.value = Math.pow(2, (m - real) / 12);
    if (s.bucle) { f.loop = true; f.loopStart = s.bucle[0]; f.loopEnd = s.bucle[1]; }
    f.connect(g); g.connect(k.filtro);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + 0.008);
    f.start(t);
    Motor.liberar(g, t + Math.max(0.04, dur), 0.5, [f]);
  }
  const MAPA_TEC = { dist: "dist", filtro: "filtro", reverb: "reverb", vol: "vol" };
  // el teclado líder sigue la fila "guitarra" de la tabla de efectos: fuzz → distorsión, tono → brillo
  const MAPA_LIDER = { dist: "fuzz", filtro: "tono", reverb: "reverb", vol: "vol" };
  function mapaEfectosTeclado(perfil) { return perfil.id === "guitarra" ? MAPA_LIDER : MAPA_TEC; }

  // Crea una parte de la orquesta con el sonido elegido → { inst, efx, prog, cuadro?, destruir, octavas }
  async function crearParteOrq(def, son, escala) {
    const perfil = pf(def.id), pista = await pistaDe(def.id);
    if (!pista) return null;
    const parte = { id: def.id, son, golpe: 0, octavas: 0 };
    const aviso = f => (n, at) => { parte.golpe = performance.now() + Math.max(0, at - Motor.t) * 1000; f(n, at); };
    let inst, alNota, mapa = MAPA_TEC;
    if (son === "sint" && def.tipo === "ambiente") {
      inst = new Ambiente("drone"); alNota = (n, at) => inst.nota(n.m, n.v, at, n.d); mapa = {};
    } else if (son === "sint") {
      inst = new Teclado(def.tipo === "guitarra" ? "lead" : perfil.preset); alNota = (n, at) => inst.nota(n.m, n.v * volNota(def.id, n.m), at, n.d);
    } else {
      // un sample de FL: se toca con la cadena de efectos de un teclado
      const mu0 = MUESTRAS.find(m => m.id === son) || MUESTRAS[0], med = mediana(pista.notas);
      const mu = mu0.muestras ? mu0.muestras.slice().sort((a, b) => Math.abs(a.real - med) - Math.abs(b.real - med))[0] : mu0;
      inst = new Teclado(def.tipo === "ambiente" ? "pad" : def.tipo === "guitarra" ? "lead" : perfil.preset || "lead");
      if (def.id === "guitarra") mapa = MAPA_LIDER;
      const s = await cargarMuestraOrq(mu.archivo);
      // igualar el volumen con el sample que la parte usa normalmente
      const propio = MUESTRAS.find(m => m.id === def.def);
      let ref = rmsDe(s.buffer);
      if (propio && propio.archivo) { try { ref = rmsDe((await cargarMuestraOrq(propio.archivo)).buffer); } catch (e) {} }
      else if (def.tipo === "guitarra") ref = 0.6 * ref;
      const ajuste = lim(ref / rmsDe(s.buffer), 0.25, 4);
      parte.octavas = son === def.def || def.tipo === "teclado" ? 0 : octavasPara(mu.real, med) / 12;   // los teclados suenan en su registro   // con su propio sample, la parte suena como siempre
      const sube = parte.octavas * 12;
      alNota = (n, at) => vozMuestra(inst, s, mu.real, n.m + sube, n.v * ajuste * volNota(def.id, n.m), at, n.d);
    }
    parte.inst = inst;
    inst.p.vol *= nivelDe(def.id); inst.aplicar();   // la orquesta de ensayo usa el mismo nivel de referencia
    parte.efx = efectosAuto(perfil, inst, mapa, null, { escala, guardarlo: false });
    parte.base = inst.p.vol;
    parte.prog = alNota ? programador(pista, aviso(alNota)) : null;
    const destruir = parte.destruir;
    parte.destruir = () => {
      if (destruir) destruir(); else if (inst.apagar) inst.apagar();
      inst.out.volumen.gain.setTargetAtTime(0, Motor.t, 0.05);
    };
    return parte;
  }

  function crearOrquesta() {
    const guardado = leer("v3:orq", {}) || {};
    const conf = { vol: guardado.vol != null ? guardado.vol : 0.6, on: Object.assign({}, guardado.on), son: Object.assign({}, guardado.son) };
    const partes = new Map();   // id → parte creada (o { cargando })
    const oyentes = [];
    let activa = false, propio = null, propioSuena = false, version = 0;
    const factor = () => conf.vol;
    const avisar = () => oyentes.forEach(f => f());
    const guardarConf = () => guardar("v3:orq", conf);
    const suena = id => id === propio ? propioSuena : conf.on[id] !== false;
    const sonDe = def => def.tipo === "teclado" ? "square-woof" : conf.son[def.id] || def.def;

    async function sincronizar() {
      const v = ++version;
      for (const def of PARTES_ORQ) {
        const quiere = activa && suena(def.id), son = sonDe(def), x = partes.get(def.id);
        if (x && (!quiere || x.son !== son)) { if (x.destruir) x.destruir(); partes.delete(def.id); }
        if (quiere && !partes.has(def.id)) {
          const marca = { cargando: true, son }; partes.set(def.id, marca); avisar();
          crearParteOrq(def, son, factor).then(p => {
            if (partes.get(def.id) !== marca) { if (p) p.destruir(); return; }   // mientras cargaba se cambió de opinión
            if (!p) { partes.delete(def.id); avisar(); return; }
            partes.set(def.id, p); p.inst.p.vol = p.base * conf.vol; p.inst.aplicar(); avisar();
          }).catch(e => { console.warn("orquesta:", def.id, e); if (partes.get(def.id) === marca) partes.delete(def.id); avisar(); });
        }
      }
      if (v === version) avisar();
    }
    return {
      conf, PARTES: PARTES_ORQ,
      get activa() { return activa; },
      get propio() { return propio; },
      suena, sonDe,
      parte: id => partes.get(id) || null,
      sonando: () => PARTES_ORQ.filter(d => activa && suena(d.id)).length,
      alCambiar(f) { oyentes.push(f); return () => { const i = oyentes.indexOf(f); if (i >= 0) oyentes.splice(i, 1); }; },
      encender(si) { activa = si; sincronizar(); },
      ponerSuena(id, si) { if (id === propio) propioSuena = si; else { conf.on[id] = si; guardarConf(); } sincronizar(); },
      ponerVarias(ids) { PARTES_ORQ.forEach(d => { const si = ids.includes(d.id); if (d.id === propio) propioSuena = si; else conf.on[d.id] = si; }); guardarConf(); sincronizar(); },
      ponerSonido(id, son) { conf.son[id] = son; guardarConf(); sincronizar(); },
      ponerSonidos(mapa) { Object.assign(conf.son, mapa); guardarConf(); sincronizar(); },
      volumen(v) { conf.vol = v; guardarConf(); partes.forEach(p => { if (p.inst) { p.inst.p.vol = p.base * v; p.inst.aplicar(); } }); },
      // tu propio rol viene apagado: lo tocas tú
      rol(id) { propio = id === "director" ? null : id; propioSuena = false; sincronizar(); },
      cuadro(t, corriendo) {
        partes.forEach(p => { if (!p.inst) return; p.efx.cuadro(t); if (p.prog) p.prog(t, corriendo); if (p.cuadro) p.cuadro(t, corriendo); });
      },
    };
  }

  // La ventana de la orquesta
  function ventanaOrquesta(orq) {
    const caja = el(`<div class="orq">
      <p class="muted small">Para ensayar: esta laptop toca las partes del arreglo siguiendo el cronómetro. Elige cuáles suenan y con qué sample. Tu propio rol viene apagado porque lo tocas tú.</p>
      <div class="fila orq-master"><button class="btn grande" data-r="on"></button>
        <label class="desliz"><span>Volumen</span><input type="range" min="0" max="1.2" step="0.01" data-r="vol"><b data-r="volv"></b></label></div>
      <div class="fila orq-atajos"><span class="muted small">Elegir:</span>
        <button class="chip" data-r="todos">Todos</button><button class="chip" data-r="ninguno">Ninguno</button>
        <button class="chip" data-r="base" title="Teclado 3 (el bajo) y Ambiente">Solo la base</button>
        <button class="chip" data-r="otros" title="Todos menos tu rol">Todos menos yo</button></div>
      <div class="fila orq-atajos"><span class="muted small">Sonidos de todos:</span>
        <button class="chip" data-r="son-fl" title="Cada instrumento con su sample de la partitura, hecho en FL Studio">🎛️ FL Studio (los tuyos)</button>
        <button class="chip" data-r="son-sint" title="El ambiente con el sonido sintetizado en el navegador (los teclados siguen con Square Woof)">🧪 Sintetizados en el navegador</button></div>
      <ul class="orq-lista"></ul>
    </div>`);
    const r = x => $(`[data-r="${x}"]`, caja), lista = $(".orq-lista", caja), filas = {};
    orq.PARTES.forEach(def => {
      const li = el(`<li class="orq-fila">
        <label class="orq-nombre"><input type="checkbox"><span class="orq-punto" aria-hidden="true"></span><span class="ico">${def.icono}</span>
          <span><b>${esc(def.nombre)}</b><small></small></span></label>
        <select aria-label="Sample de ${esc(def.nombre)}"></select>
        <span class="orq-nota muted small"></span></li>`);
      const sel = $("select", li);
      opcionesDe(def.tipo).forEach(([v, n]) => sel.add(new Option(n + (v === sonPropio(def) && def.tipo !== "teclado" ? " (de la partitura)" : ""), v)));
      if (def.tipo === "teclado") sel.disabled = true;
      $("input", li).onchange = e => orq.ponerSuena(def.id, e.target.checked);
      sel.onchange = () => orq.ponerSonido(def.id, sel.value);
      lista.appendChild(li); filas[def.id] = li;
    });
    const todos = orq.PARTES.map(d => d.id);
    r("todos").onclick = () => orq.ponerVarias(todos);
    r("ninguno").onclick = () => orq.ponerVarias([]);
    r("base").onclick = () => orq.ponerVarias(BASE_ORQ);
    r("otros").onclick = () => orq.ponerVarias(todos.filter(id => id !== orq.propio));
    // todos los instrumentos a la vez: los samples de FL Studio (los de la partitura) o los sintetizados
    const SINT = {};
    r("son-fl").onclick = () => orq.ponerSonidos(Object.fromEntries(orq.PARTES.map(d => [d.id, sonPropio(d)])));
    r("son-sint").onclick = () => orq.ponerSonidos(Object.fromEntries(orq.PARTES.map(d => [d.id, SINT[d.tipo] || "sint"])));
    r("on").onclick = () => orq.encender(!orq.activa);
    r("vol").value = orq.conf.vol;
    r("vol").oninput = e => { orq.volumen(+e.target.value); pintar(); };
    function pintar() {
      const b = r("on");
      b.textContent = orq.activa ? "⏸ Detener la orquesta" : "▶ Escuchar la orquesta"; b.classList.toggle("on", orq.activa);
      r("volv").textContent = Math.round(orq.conf.vol * 100) + " %";
      const sons = orq.PARTES.map(d => orq.sonDe(d));
      r("son-fl").classList.toggle("on", orq.PARTES.every((d, i) => sons[i] === sonPropio(d)));
      r("son-sint").classList.toggle("on", orq.PARTES.every((d, i) => d.tipo === "teclado" || sons[i] === (SINT[d.tipo] || "sint")));
      orq.PARTES.forEach(def => {
        const li = filas[def.id], si = orq.suena(def.id), p = orq.parte(def.id), tuyo = def.id === orq.propio;
        $("input", li).checked = si; $("select", li).value = orq.sonDe(def);
        li.classList.toggle("apagada", !si); li.classList.toggle("tuyo", tuyo);
        $("small", li).textContent = [def.sub, tuyo ? "tu rol" : ""].filter(Boolean).join(" · ");
        let nota = "";
        if (si && orq.activa) nota = p && p.cargando ? "cargando…" : p && p.octavas ? `${p.octavas > 0 ? "↑" : "↓"} ${Math.abs(p.octavas)} oct (para que el sample no se deforme)` : "";
        else if (si) nota = "lista";
        $(".orq-nota", li).textContent = nota;
      });
    }
    const quitar = orq.alCambiar(pintar); pintar();
    // el punto de cada parte se ilumina cuando toca una nota
    let vivo = true;
    (function latir() {
      if (!vivo) return;
      const ahora = performance.now();
      orq.PARTES.forEach(def => { const p = orq.parte(def.id); filas[def.id].classList.toggle("toca", !!(p && p.golpe && ahora - p.golpe < 160 && ahora >= p.golpe - 10)); });
      requestAnimationFrame(latir);
    })();
    abrirVentana("🎧 Orquesta", caja, { clase: "ancha", alCerrar: () => { vivo = false; quitar(); } });
  }

  /* ============================== versión 3: limitador, MIDI, cuenta regresiva, sala ============================== */
  // Limitador al final de la mezcla: compresor rápido + saturación suave, así la suma de muchas notas no se corta (clipping)
  function limitador() {
    if (!Motor.ctx || Motor.limitador) return;
    const ctx = Motor.ctx, lim = ctx.createDynamicsCompressor(), sat = ctx.createWaveShaper(), post = ctx.createGain();
    lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.15;
    const n = 4096, curva = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curva[i] = Math.tanh(1.5 * x) / Math.tanh(1.5); }
    sat.curve = curva; sat.oversample = "2x"; post.gain.value = 0.94;
    Motor.comp.disconnect();
    Motor.comp.connect(lim); lim.connect(sat); sat.connect(post); post.connect(ctx.destination);
    if (Motor.analizador) Motor.comp.connect(Motor.analizador);
    Motor.limitador = lim;
    Motor.master.gain.value = 0;   // al abrir, en silencio: el sonido se activa con 🔊
    aplicarVolGeneral();
  }
  // Nivel de referencia por rol (dB, en js/v3_obra.js) → factor de volumen
  const nivelDe = id => Math.pow(10, (((P.niveles || {})[id]) || 0) / 20);
  // Volumen general: cada laptop abre en SILENCIO y con el mismo volumen; el botón 🔊 activa el sonido
  let sonidoOn = false, volGeneral = P.volumenGeneral != null ? P.volumenGeneral : 0.8;
  function aplicarVolGeneral() {
    if (Motor.ctx && Motor.limitador) Motor.master.gain.setTargetAtTime(sonidoOn ? 0.9 * volGeneral : 0, Motor.t, 0.04);
    const b = $("#btnSonido"), r = $("#volGeneral");
    if (b) { b.textContent = sonidoOn ? "🔊 Sonido activo" : "🔇 Activar sonido"; b.classList.toggle("on", sonidoOn); b.classList.toggle("apagado", !sonidoOn); }
    if (r) { r.value = volGeneral; r.disabled = !sonidoOn; $("#volGeneralV").textContent = Math.round(volGeneral * 100) + " %"; }
    document.body.classList.toggle("sin-sonido", !sonidoOn);
  }
  $("#btnSonido").onclick = () => { Motor.init(); limitador(); sonidoOn = !sonidoOn; aplicarVolGeneral(); };
  $("#volGeneral").oninput = e => { volGeneral = +e.target.value; aplicarVolGeneral(); };
  aplicarVolGeneral();
  // Teclado MIDI USB: las notas van al instrumento de la pantalla (los teclados)
  let midiListo = false;
  async function iniciarMidi() {
    if (midiListo || !navigator.requestMIDIAccess) return; midiListo = true;
    try {
      const acc = await navigator.requestMIDIAccess();
      const alMensaje = ev => {
        const [s, n, v] = ev.data, tipo = s & 0xf0;
        if (!actual || !actual.midi) return;
        if (tipo === 0x90 && v > 0) actual.midi(true, n, v);
        else if (tipo === 0x80 || (tipo === 0x90 && v === 0)) actual.midi(false, n, v);
      };
      const revisar = () => {
        const ins = [...acc.inputs.values()];
        ins.forEach(i => { i.onmidimessage = alMensaje; });
        const c = $("#chipMidi"); c.hidden = !ins.length; c.textContent = "🎹 MIDI: " + ins.map(i => i.name).join(", "); c.title = "Teclado MIDI conectado: toca los teclados";
      };
      acc.onstatechange = revisar; revisar();
    } catch (e) { console.warn("MIDI:", e.message); }
  }
  // Cuenta regresiva grande cuando el maestro inicia (todas las laptops parten juntas al llegar a 0)
  const cuentaAtras = el(`<div class="cuenta-atras" hidden><small>La obra parte en</small><b></b><em class="aviso-sonido">🔇 Tu sonido está apagado: actívalo arriba (🔊)</em></div>`);
  document.body.appendChild(cuentaAtras);
  let cuentaPrevia = -1;
  function pintarCuentaAtras() {
    const c = R.cuenta(), n = c > 0 ? Math.ceil(c) : 0;
    if (n === cuentaPrevia) return; cuentaPrevia = n;
    cuentaAtras.hidden = !n; $("b", cuentaAtras).textContent = n;
  }
  // La sala del maestro: quiénes están conectados, con qué rol y cuánto tarda su wifi
  function ventanaSala() {
    const cuerpo = el(`<div class="sala"><p class="muted small">Las laptops aparecen al abrir la app → <b>Unirme a una sala</b>. Retardo = ida y vuelta por el wifi (lo que importa es que sea estable; el inicio ya lo compensa).</p><ul class="sala-lista"></ul></div>`);
    const lista = $(".sala-lista", cuerpo), nombreRol = id => { const r = ROLES.find(x => x.id === id); return r ? r.icono + " " + r.titulo : "eligiendo rol…"; };
    const pintar = () => {
      const s = R.estado.sala;
      lista.innerHTML = s.length ? s.map(c => `<li><b>${esc(c.nombre || "laptop")}</b><span>${esc(nombreRol(c.rol))}</span><small>${c.rtt != null ? Math.round(c.rtt) + " ms" : "—"}</small></li>`).join("")
        : `<li class="muted">Nadie más todavía.</li>`;
    };
    pintar(); const iv = setInterval(pintar, 1000);
    R.info().then(i => { if (i && i.ips && i.ips.length) $("p", cuerpo).insertAdjacentHTML("afterend", `<p class="small">Si una laptop no encuentra la sala sola, que escriba la IP de esta: <code>${i.ips.map(esc).join("</code> o <code>")}</code></p>`); });
    abrirVentana("👥 Sala", cuerpo, { alCerrar: () => clearInterval(iv) });
  }
  // La dirección de la página con el rol (sin perder ?app=…&maestro=… de la app de escritorio)
  function conRol(id) {
    const q = new URLSearchParams(location.search);
    if (id) q.set("rol", id); else q.delete("rol");
    const s = q.toString(); return location.pathname + (s ? "?" + s : "");
  }

  /* ============================== aplicación ============================== */
  const pantallaInicio = $("#inicio"), escenario = $("#escenario");
  function dibujarInicio() {
    const grilla = $(".roles", pantallaInicio), extras = $(".roles-extra", pantallaInicio) || grilla;
    // en la app, el Ambiente lo toca el maestro (junto con la ventana de luces): los músicos no lo ven
    const st = R.estado;
    ROLES.filter(r => !(st.app === "musico" && r.id === "ambiente-1")).forEach(r => {
      const deMaestro = st.maestro && r.id === "ambiente-1";
      const b = el(`<button class="rol ${r.id === "director" ? "director" : ""}${deMaestro ? " maestro" : ""}"><span class="ico">${r.icono}</span><b>${esc(r.titulo)}${deMaestro ? " · maestro" : ""}</b><small>${esc(deMaestro ? "Tu rol: base grave, colores y luces del proyector" : r.sub)}</small></button>`);
      b.onclick = () => entrar(r.id);
      (r.extra ? extras : grilla).appendChild(b);
    });
  }
  let actual = null, ahoraUI = null, rolId = null;
  async function entrar(id) {
    Motor.init(); limitador(); iniciarMidi();
    rolId = id; guardar("v3:rol", id); R.ponerRol(id);
    history.replaceState(null, "", conRol(id));
    const rol = ROLES.find(r => r.id === id) || ROLES[0];
    const perfil = id === "director" ? DIRECTOR : pf(id);
    pantallaInicio.hidden = true; escenario.hidden = false;
    document.body.classList.toggle("modo-director", id === "director");
    $("#rolNombre").textContent = rol.icono + " " + rol.titulo;
    const colAhora = $("#colAhora"), inst = $("#instrumento");
    colAhora.innerHTML = ""; inst.innerHTML = `<p class="muted">Cargando sonidos…</p>`;
    ahoraUI = crearAhora(perfil);
    colAhora.append(ahoraUI.caja, crearBarraReloj(id === "director"));
    if (actual && actual.destruir) actual.destruir();
    orquesta().rol(id);
    const fab = id === "director" ? crearDirector : id.startsWith("ambiente") ? crearAmbiente : crearTeclado;
    actual = await fab(perfil, inst);
    $("#ayuda").textContent = actual.ayuda || "";
  }
  function salir() {
    if (actual && actual.destruir) actual.destruir(); actual = null;
    if (orq) orq.encender(false);
    escenario.hidden = true; pantallaInicio.hidden = false; history.replaceState(null, "", conRol(null)); R.ponerRol("");
    document.body.classList.remove("modo-director");
  }
  // la orquesta (ensayo): una sola para toda la página; se maneja desde su ventana
  let orq = null;
  const bOrquesta = $("#btnOrquesta");
  function orquesta() {
    if (!orq) {
      orq = crearOrquesta();
      orq.alCambiar(() => {
        const n = orq.sonando();
        bOrquesta.classList.toggle("on", orq.activa);
        bOrquesta.innerHTML = orq.activa ? `🎧 Orquesta <span class="insignia">${n} ${n === 1 ? "parte" : "partes"}</span>` : "🎧 Orquesta";
      });
    }
    return orq;
  }
  bOrquesta.onclick = () => ventanaOrquesta(orquesta());
  $("#btnCambiar").onclick = salir;
  document.addEventListener("keydown", e => { if (!escribiendo(e) && actual && actual.teclas) actual.teclas(e); });

  let tPrevio = performance.now(), finPedido = false;
  function cuadro() {
    const n = performance.now(), dt = Math.min(0.1, (n - tPrevio) / 1000); tPrevio = n;
    if (actual && Motor.ctx) {
      let t = R.ahora();
      if (t >= DURACION && R.estado.corriendo && !R.enRed()) { R.pausar(); R.ir(DURACION); t = DURACION; }
      else if (t >= DURACION + 1 && R.estado.corriendo && R.estado.maestro && !finPedido) { finPedido = true; R.pausar().then(() => R.ir(DURACION)).finally(() => { finPedido = false; }); }
      const corriendo = R.estado.corriendo && t < DURACION;
      ahoraUI.cuadro(t);
      pintarCuentaAtras();
      try { actual.cuadro(t, dt, corriendo); } catch (e) { console.error(e); }
      if (orq && orq.activa) orq.cuadro(t, corriendo);
    }
    requestAnimationFrame(cuadro);
  }

  async function iniciar() {
    dibujarInicio();
    if (APP) { const h = $("#enlaceHub"); h.textContent = "⟵ Salir de la sala"; h.title = "Volver a la pantalla de inicio de la app"; h.removeAttribute("href"); h.onclick = e => { e.preventDefault(); APP.inicio(); }; }
    const enRed = await R.conectar();
    const st = R.estado;
    $("#estadoRed").textContent = !enRed ? (st.app === "musico" ? "⚠ No encuentro al maestro" : "⏱️ Cronómetro propio")
      : st.maestro ? "🎛️ Maestro · sala abierta" : st.app === "musico" ? "🔗 Conectado al maestro" : "🔗 Cronómetro en red";
    $("#estadoRed").className = "chip-estado " + (enRed ? "ok" : st.app === "musico" ? "mal" : "");
    if (!enRed && st.app === "musico") setTimeout(async function reintentar() {   // el maestro todavía no abre la sala: se sigue intentando
      if (await R.conectar()) { $("#estadoRed").textContent = "🔗 Conectado al maestro"; $("#estadoRed").className = "chip-estado ok"; } else setTimeout(reintentar, 2000);
    }, 2000);
    let q = new URLSearchParams(location.search).get("rol");
    if (!q && R.estado.maestro) q = "ambiente-1";   // la laptop maestro toca el Ambiente
    if (q && ROLES.some(r => r.id === q)) {
      // el audio necesita un toque para empezar
      const ov = el(`<div class="overlay"><button class="btn grande">▶ Entrar como ${esc(ROLES.find(r => r.id === q).titulo)}</button><button class="btn" data-r="otro">Elegir otro rol</button></div>`);
      document.body.appendChild(ov);
      $(".grande", ov).onclick = () => { ov.remove(); entrar(q); };
      $("[data-r=otro]", ov).onclick = () => { ov.remove(); history.replaceState(null, "", conRol(null)); };
    }
    requestAnimationFrame(cuadro);
  }
  iniciar();
})();
