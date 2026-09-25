/* Página de control de cada perfil: reloj, partitura, instrucciones y controles del instrumento. */
(function () {
  const { P, PERFILES, SECCIONES, EVENTOS, DURACION, fmt, seccionEn, acordeEn, instrucciones, toca, proximoCambio, eventoAplica, notasAcorde, nombreNota } = G;
  const { Motor, Guitarra, Bateria, Teclado, Ambiente, PADS, PATRONES } = window.Audio2;
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const perfil = PERFILES.find(p => p.id === params.get("p"));
  if (!perfil) { location.href = "index.html"; return; }

  document.title = `${perfil.nombre} · ${P.titulo}`;
  $("perfilNombre").textContent = perfil.icono + " " + perfil.nombre;
  $("obraNombre").textContent = `${P.titulo} — ${P.artista}`;
  $("ovIcono").textContent = perfil.icono;
  $("ovTitulo").textContent = perfil.nombre;
  $("ovDesc").textContent = perfil.desc;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const escribiendo = e => /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target.type !== "range";

  /* ============================== COLORES (personalizables) ============================== */
  let override = G.leer("colores", {});
  const coloresSec = s => (override[s.idx] && override[s.idx].length ? override[s.idx] : s.colores);
  const colorEn = t => { const a = acordeEn(t); const c = coloresSec(a.seccion); return c[a.idx % c.length]; };

  /* ============================== RELOJ ============================== */
  let inicio = null;      // epoch ms del compás 1 (null = detenido)
  let practica = 0;       // posición cuando está detenido
  const ahora = () => (inicio == null ? practica : (Date.now() - inicio) / 1000);
  const corriendo = () => inicio != null;

  function horaAEpoch(hhmmss) {
    const [h, m, s] = hhmmss.split(":").map(Number);
    const d = new Date(); d.setHours(h, m || 0, s || 0, 0);
    if (d.getTime() < Date.now() - 12 * 3600e3) d.setDate(d.getDate() + 1);
    return d.getTime();
  }
  $("btnIniciar").onclick = () => { inicio = Date.now() - practica * 1000; };
  $("btnProgramar").onclick = () => { if ($("hora").value) inicio = horaAEpoch($("hora").value); };
  $("btnDetener").onclick = () => { if (corriendo()) practica = Math.min(Math.max(0, ahora()), DURACION); inicio = null; alDetener(); };
  const irA = $("irA");
  irA.innerHTML = "<option value=''>Ir a sección…</option>" + SECCIONES.map(s => `<option value="${s.idx}">${fmt(s.ini)} ${esc(s.nombre)}</option>`).join("");
  irA.onchange = () => { if (irA.value === "") return; saltar(SECCIONES[+irA.value].ini); irA.value = ""; };
  function saltar(t) { if (corriendo()) inicio = Date.now() - t * 1000; else practica = t; }
  if (params.get("inicio")) $("hora").value = params.get("inicio");

  // Línea de tiempo
  const linea = $("linea");
  SECCIONES.forEach(s => {
    const d = document.createElement("div"); d.className = "seg";
    d.style.width = ((s.fin - s.ini) / DURACION * 100) + "%";
    d.textContent = s.nombre; d.dataset.idx = s.idx; linea.insertBefore(d, $("cursor"));
  });
  function pintarLinea() {
    [...linea.querySelectorAll(".seg")].forEach(d => {
      const c = coloresSec(SECCIONES[+d.dataset.idx]);
      d.style.background = `linear-gradient(90deg, ${c.join(",")}${c.length === 1 ? "," + c[0] : ""})`;
    });
  }
  pintarLinea();
  linea.addEventListener("click", e => {
    const r = linea.getBoundingClientRect(); saltar(((e.clientX - r.left) / r.width) * DURACION);
  });

  /* ============================== LUCES (colores de la obra) ============================== */
  const Luces = (() => {
    const canvas = $("visual"); let ctx2d = null, activo = false;
    let actual = [11, 16, 38], fase = 0, destello = 0; const datos = new Uint8Array(128);
    let cfg = { intens: () => 0.55, vel: () => 0.35, alPintar: null, alClic: null };
    function activar(c) { Object.assign(cfg, c || {}); activo = true; canvas.classList.remove("oculto"); ctx2d = canvas.getContext("2d"); }
    function desactivar() { activo = false; canvas.classList.add("oculto"); pantalla(false); }
    function pantalla(v) {
      document.body.classList.toggle("pantalla-completa", v);
      if (v && canvas.requestFullscreen) canvas.requestFullscreen().catch(() => {});
      if (!v && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
    $("salirVisual").onclick = () => pantalla(false);
    document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) document.body.classList.remove("pantalla-completa"); });
    canvas.addEventListener("click", () => { if (document.body.classList.contains("pantalla-completa")) { destellar(); cfg.alClic && cfg.alClic(); } });
    function destellar(f = 1) { destello = Math.max(destello, f); }
    function cuadro(t, dt) {
      if (!activo) return;
      const w = canvas.width = canvas.clientWidth * devicePixelRatio, h = canvas.height = canvas.clientHeight * devicePixelRatio;
      const objetivo = aRGB(colorEn(Math.min(Math.max(0, t), DURACION)));
      const k = 1 - Math.exp(-dt * 1.5);
      actual = actual.map((c, i) => c + (objetivo[i] - c) * k);
      let nivel = 0;
      if (Motor.analizador) { Motor.analizador.getByteFrequencyData(datos); nivel = datos.reduce((a, b) => a + b, 0) / datos.length / 255; }
      const intens = cfg.intens();
      fase += dt * cfg.vel();
      const brillo = Math.min(1.6, intens + nivel * 0.8);
      const [r, g, b] = actual.map(c => Math.min(255, c * brillo));
      ctx2d.fillStyle = `rgb(${r * 0.25},${g * 0.25},${b * 0.25})`; ctx2d.fillRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        const cx = w * (0.5 + 0.32 * Math.sin(fase * (0.7 + i * 0.3) + i * 2));
        const cy = h * (0.5 + 0.28 * Math.cos(fase * (0.5 + i * 0.25) + i));
        const rad = Math.max(w, h) * (0.35 + 0.15 * i + nivel * 0.3);
        const gr = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, rad);
        gr.addColorStop(0, `rgba(${r},${g},${b},${0.55 * intens + 0.1})`); gr.addColorStop(1, "rgba(0,0,0,0)");
        ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, w, h);
      }
      if (cfg.alPintar) cfg.alPintar(r, g, b, intens, destello);
      if (destello > 0.01) { ctx2d.fillStyle = `rgba(255,255,255,${destello * 0.8})`; ctx2d.fillRect(0, 0, w, h); destello *= Math.exp(-dt * 4); }
    }
    return { activar, desactivar, pantalla, destellar, cuadro, get activo() { return activo; } };
  })();
  // Botones de luces para guitarra y batería (si no hay intérpretes extra para los visuales)
  function controlesLuces() {
    const fila = el(`<div class="fila"><span class="muted small">Luces de la obra:</span></div>`);
    const on = el(`<button class="btn peq">💡 Luces <kbd>V</kbd></button>`);
    const proy = el(`<button class="btn peq">⛶ Proyectar</button>`);
    fila.append(on, proy);
    const toggle = () => { if (Luces.activo) Luces.desactivar(); else Luces.activar({ intens: () => 0.55, vel: () => 0.35 }); on.classList.toggle("on", Luces.activo); };
    on.onclick = toggle;
    proy.onclick = () => { if (!Luces.activo) toggle(); Luces.pantalla(true); };
    document.addEventListener("keydown", e => { if (!escribiendo(e) && !e.repeat && e.key.toLowerCase() === "v") toggle(); });
    return fila;
  }

  /* ============================== INSTRUMENTO ============================== */
  let inst = null;
  let alAcorde = () => {};   // lo define cada panel
  let alDetener = () => {};
  let alCuadro = () => {};   // animación por cuadro (ambientes)
  const panel = $("panel");

  function slider(label, obj, clave, onChange, min = 0, max = 1, paso = 0.01) {
    const l = document.createElement("label");
    l.innerHTML = `${label}<input type="range" min="${min}" max="${max}" step="${paso}" value="${obj[clave]}">`;
    l.querySelector("input").addEventListener("input", e => { obj[clave] = +e.target.value; onChange(); });
    return l;
  }
  function sliders(lista) { const d = document.createElement("div"); d.className = "sliders"; lista.forEach(x => d.appendChild(x)); return d; }
  function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }

  // Selector de nota base para sonidos propios con altura
  function selectorBase(valor) {
    const s = document.createElement("select");
    for (let m = 24; m <= 96; m++) s.add(new Option(nombreNota(m), m, false, m === valor));
    s.title = "Nota en la que está grabado tu sonido"; return s;
  }
  // Cargador de sonido propio
  function cargador(titulo, { base, alCargar, alQuitar }) {
    const box = el(`<div class="cargar"><div class="fila"><strong>${esc(titulo)}</strong><span class="estado-sonido">Sintetizado</span></div>
      <div class="fila"><input type="file" accept="audio/*"></div></div>`);
    const estado = box.querySelector(".estado-sonido"); const input = box.querySelector("input");
    let sel = null;
    if (base != null) { sel = selectorBase(base); const f = el(`<label class="fila small muted">Nota base </label>`); f.appendChild(sel); box.appendChild(f); }
    const quitar = el(`<button class="btn peq">Volver al sintetizado</button>`); box.querySelector(".fila:nth-child(2)").appendChild(quitar);
    input.onchange = async () => {
      const f = input.files[0]; if (!f) return;
      estado.textContent = "Cargando…";
      try { const b = await Motor.cargarArchivo(f); alCargar(b, sel ? +sel.value : null); estado.textContent = "Propio: " + f.name; }
      catch (e) { estado.textContent = "No se pudo leer ese archivo"; }
    };
    if (sel) sel.onchange = () => { if (estado.textContent.startsWith("Propio")) alCargar(null, +sel.value, true); };
    quitar.onclick = () => { alQuitar(); input.value = ""; estado.textContent = "Sintetizado"; };
    box.marcar = txt => { estado.textContent = txt; };
    return box;
  }
  function cajaSonidos(contenido) {
    const d = el(`<details class="cargar-box"><summary>🎚️ Cargar sonidos propios</summary>
      <p class="muted small" style="margin:8px 0">Usa un archivo de audio de tu computador (wav, mp3, ogg). Queda cargado solo en esta pestaña.</p></details>`);
    contenido.forEach(c => d.appendChild(c)); return d;
  }

  // Botones de acordes de la sección actual
  function botonesAcordes(onDown, onUp) {
    const cont = el(`<div class="acordes-btns"></div>`);
    let sec = null;
    function render(s) {
      if (s === sec) return; sec = s;
      cont.innerHTML = "";
      s.acordes.forEach((a, i) => {
        const b = el(`<button class="btn" data-i="${i}">${esc(a)} <kbd>${i + 1}</kbd></button>`);
        b.addEventListener("pointerdown", e => { e.preventDefault(); b.setPointerCapture(e.pointerId); onDown(a, b); });
        const up = () => onUp && onUp(a, b);
        b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up);
        cont.appendChild(b);
      });
    }
    return {
      el: cont, render,
      marcar(i) { [...cont.children].forEach((b, k) => b.classList.toggle("actual", k === i)); },
      acorde(i) { return sec && sec.acordes[i]; },
      boton(i) { return cont.children[i]; },
    };
  }

  /* ---------- GUITARRA ---------- */
  function panelGuitarra() {
    inst = new Guitarra();
    let acordeActual = acordeEn(ahora()).nombre;
    panel.appendChild(el(`<h3>Guitarra</h3>`));
    panel.appendChild(el(`<p class="muted small"><kbd>Espacio</kbd> rasguea el acorde actual hacia abajo, <kbd>B</kbd> hacia arriba.
      <kbd>1</kbd>–<kbd>9</kbd> rasguean los acordes de la sección. <kbd>L</kbd> sostener, <kbd>Esc</kbd> apagar.</p>`));
    const fila = el(`<div class="fila"></div>`);
    const abajo = el(`<button class="btn primario gran-btn">↓ Rasguear</button>`);
    const arriba = el(`<button class="btn gran-btn">↑ Arriba</button>`);
    const sost = el(`<button class="btn gran-btn">Sostener</button>`);
    const apagar = el(`<button class="btn gran-btn">Apagar</button>`);
    [abajo, arriba, sost, apagar].forEach(b => fila.appendChild(b));
    abajo.onpointerdown = e => { e.preventDefault(); inst.rasguear(acordeActual); };
    arriba.onpointerdown = e => { e.preventDefault(); inst.rasguear(acordeActual, true); };
    const toggleSost = () => { inst.p.sostener = !inst.p.sostener; sost.classList.toggle("on", inst.p.sostener); };
    sost.onclick = toggleSost; apagar.onclick = () => inst.apagar();
    const ab = botonesAcordes(a => inst.rasguear(a));
    panel.append(fila, el(`<div class="muted small">Acordes de la sección</div>`), ab.el,
      sliders([slider("Fuzz", inst.p, "fuzz", () => inst.aplicar()), slider("Tono", inst.p, "tono", () => inst.aplicar()),
               slider("Reverb", inst.p, "reverb", () => inst.aplicar()), slider("Volumen", inst.p, "vol", () => inst.aplicar())]));
    const rasgOrig = inst.rasguear.bind(inst);
    inst.rasguear = (...a) => { rasgOrig(...a); Luces.destellar(0.6); };
    panel.appendChild(controlesLuces());
    const carg = cargador("Sonido de guitarra (un acorde o nota; se transpone a la raíz)", { base: 60,
      alCargar: (b, base, soloBase) => { if (!soloBase) { inst.buffer = b; inst.porAcorde = {}; } inst.base = base; }, alQuitar: () => { inst.buffer = null; inst.porAcorde = {}; } });
    panel.appendChild(cajaSonidos([carg]));
    alAcorde = info => { acordeActual = info.nombre; ab.render(info.seccion); ab.marcar(info.idx); };
    alDetener = () => {};
    document.addEventListener("keydown", e => {
      if (escribiendo(e) || e.repeat) return;
      if (e.code === "Space") { e.preventDefault(); inst.rasguear(acordeActual); }
      else if (e.key === "b" || e.key === "B") inst.rasguear(acordeActual, true);
      else if (e.key === "l" || e.key === "L") toggleSost();
      else if (e.key === "Escape") inst.apagar();
      else if (/^[1-9]$/.test(e.key)) { const a = ab.acorde(+e.key - 1); if (a) inst.rasguear(a); }
    });
    return { sonidoDefecto: (b, clave, base) => {
      if (clave) inst.porAcorde[clave] = { buffer: b, base: base || 60 };
      else { inst.buffer = b; if (base) inst.base = base; }
      if (!inst.buffer) { inst.buffer = b; inst.base = base || 60; }
      carg.marcar("Propio (partitura)");
    } };
  }

  /* ---------- BATERÍA ---------- */
  function panelBateria() {
    inst = new Bateria();
    panel.appendChild(el(`<h3>Batería</h3>`));
    panel.appendChild(el(`<p class="muted small">Toca los pads con el mouse, el dedo o las teclas. Los patrones siguen el tempo de la obra (${P.bpm} BPM).</p>`));
    const pads = el(`<div class="pads"></div>`); const mapa = {};
    PADS.forEach(p => {
      const d = el(`<div class="pad" data-id="${p.id}">${esc(p.nombre)}<kbd>${p.tecla.toUpperCase()}</kbd></div>`);
      d.addEventListener("pointerdown", e => { e.preventDefault(); inst.tocar(p.id); });
      pads.appendChild(d); mapa[p.id] = d;
    });
    const fuerza = { bombo: 0.5, caja: 0.75, tom: 0.4, crash: 1, abierto: 0.35, hihat: 0 };
    inst.alGolpe = id => { const d = mapa[id]; if (d) { d.classList.add("golpe"); setTimeout(() => d.classList.remove("golpe"), 90); } if (fuerza[id]) Luces.destellar(fuerza[id]); };
    let ultimoPaso = null;
    const pats = el(`<div class="fila"><span class="muted small">Patrón:</span></div>`);
    const opciones = [["", "Ninguno", "0"], ["pulso", "Pulso (tom)", "Q"], ["sinplatillos", "Sin platillos", "W"], ["platillos", "Con platillos", "E"], ["muro", "Muro", "R"]];
    const botonesPat = opciones.map(([id, n, k]) => {
      const b = el(`<button class="btn peq">${n} <kbd>${k}</kbd></button>`);
      b.onclick = () => ponerPatron(id); pats.appendChild(b); return b;
    });
    function ponerPatron(id) { inst.p.patron = id || null; botonesPat.forEach((b, i) => b.classList.toggle("on", opciones[i][0] === id)); ultimoPaso = null; }
    ponerPatron("");
    panel.append(pads, pats, sliders([slider("Volumen", inst.p, "vol", () => inst.aplicar()), slider("Reverb", inst.p, "reverb", () => inst.aplicar())]), controlesLuces());

    const cargs = PADS.map(p => cargador(p.nombre, { alCargar: b => { inst.samples[p.id] = b; }, alQuitar: () => { delete inst.samples[p.id]; } }));
    panel.appendChild(cajaSonidos(cargs));

    // Secuenciador: agenda semicorcheas alineadas al reloj de la obra
    const pasoSeg = 60 / P.bpm / 4;
    let libreInicio = performance.now();
    setInterval(() => {
      if (!inst.p.patron || !Motor.ctx) return;
      const pat = PATRONES[inst.p.patron];
      const t = corriendo() ? ahora() : (performance.now() - libreInicio) / 1000;
      if (corriendo() && (t < 0 || t > DURACION)) return;
      const ventana = 0.12, tCtx = Motor.t;
      let k = Math.ceil(t / pasoSeg - 1e-6);
      if (ultimoPaso != null && k <= ultimoPaso) k = ultimoPaso + 1;
      if (ultimoPaso != null && k - ultimoPaso > 8) k = Math.ceil(t / pasoSeg); // tras un salto
      for (; k * pasoSeg < t + ventana; k++) {
        const paso = ((k % 16) + 16) % 16;
        const cuando = tCtx + (k * pasoSeg - t);
        for (const pad in pat) if (pat[pad][paso] === "x") inst.tocar(pad, Math.max(cuando, tCtx), paso % 4 === 0 ? 1 : 0.75);
        ultimoPaso = k;
      }
    }, 25);
    alDetener = () => { ultimoPaso = null; libreInicio = performance.now(); };
    document.addEventListener("keydown", e => {
      if (escribiendo(e) || e.repeat) return;
      const p = PADS.find(p => p.tecla === e.key.toLowerCase()); if (p) { inst.tocar(p.id); return; }
      const o = opciones.find(o => o[2].toLowerCase() === e.key.toLowerCase()); if (o) ponerPatron(o[0]);
    });
    return { sonidoDefecto: (b, pad) => { inst.samples[pad] = b; const i = PADS.findIndex(p => p.id === pad); if (i >= 0) cargs[i].marcar("Propio (partitura)"); } };
  }

  /* ---------- TECLADO ---------- */
  function panelTeclado() {
    inst = new Teclado(perfil.preset);
    const TECLAS = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j", "k", "o", "l", "p", "ñ"];
    panel.appendChild(el(`<h3>${esc(perfil.nombre)}</h3>`));
    panel.appendChild(el(`<p class="muted small">Teclas <kbd>A</kbd>–<kbd>Ñ</kbd> (fila del medio y la de arriba) como piano. <kbd>Z</kbd>/<kbd>X</kbd> cambian de octava.
      Mantén <kbd>1</kbd>–<kbd>9</kbd> o los botones para sostener los acordes de la sección. En rosado van las notas del acorde actual.
      También funciona con un teclado MIDI.</p>`));
    const ab = botonesAcordes((a, b) => { tocarAcorde(a, true); b.classList.add("on"); }, (a, b) => { tocarAcorde(a, false); b.classList.remove("on"); });
    const octEl = el(`<span class="badge"></span>`);
    const filaOct = el(`<div class="fila"><button class="btn peq">− Octava</button></div>`);
    const mas = el(`<button class="btn peq">+ Octava</button>`); filaOct.append(octEl, mas);
    const piano = el(`<div class="piano"></div>`);
    panel.append(el(`<div class="muted small">Acordes de la sección</div>`), ab.el, filaOct, piano,
      sliders([slider("Filtro", inst.p, "filtro", () => inst.aplicar()), slider("Distorsión", inst.p, "dist", () => inst.aplicar()),
               slider("Volumen", inst.p, "vol", () => inst.aplicar()), slider("Reverb", inst.p, "reverb", () => inst.aplicar())]));
    const carg = cargador("Sonido del teclado (una nota)", { base: 60,
      alCargar: (b, base, soloBase) => { inst.todoOff(); if (!soloBase) inst.buffer = b; inst.base = base; }, alQuitar: () => { inst.todoOff(); inst.buffer = null; } });
    panel.appendChild(cajaSonidos([carg]));

    const NEGRAS = [1, 3, 6, 8, 10];
    let teclasPiano = [];
    function dibujarPiano() {
      piano.innerHTML = ""; teclasPiano = [];
      const base = 12 * (inst.p.octava + 1), total = 25;
      const blancas = []; for (let i = 0; i < total; i++) if (!NEGRAS.includes(i % 12)) blancas.push(i);
      const ancho = 100 / blancas.length;
      for (let i = 0; i < total; i++) {
        const m = base + i, negra = NEGRAS.includes(i % 12);
        const k = document.createElement("div"); k.className = negra ? "n" : "b"; k.dataset.m = m;
        const pos = blancas.filter(x => x < i).length;
        k.style.left = (negra ? pos * ancho - ancho * 0.3 : pos * ancho) + "%";
        k.style.width = (negra ? ancho * 0.6 : ancho) + "%";
        k.textContent = (TECLAS[i] || "").toUpperCase() || (i % 12 === 0 ? nombreNota(m) : "");
        piano.appendChild(k); teclasPiano.push(k);
      }
      octEl.textContent = "Octava " + inst.p.octava;
      marcarGuia();
    }
    const activas = new Set();
    function noteOn(m) { if (activas.has(m)) return; activas.add(m); inst.on(m); marcar(m, true); }
    function noteOff(m) { if (!activas.has(m)) return; activas.delete(m); inst.off(m); marcar(m, false); }
    function marcar(m, on) { const k = piano.querySelector(`[data-m="${m}"]`); if (k) k.classList.toggle("act", on); }
    let guia = [];
    function marcarGuia() { teclasPiano.forEach(k => k.classList.toggle("guia", guia.includes(+k.dataset.m % 12))); }
    // Mouse / táctil sobre el piano
    const punteros = new Map();
    piano.addEventListener("pointerdown", e => { e.preventDefault(); piano.setPointerCapture(e.pointerId); mover(e); });
    piano.addEventListener("pointermove", e => { if (punteros.has(e.pointerId)) mover(e); });
    const soltar = e => { const m = punteros.get(e.pointerId); if (m != null) noteOff(m); punteros.delete(e.pointerId); };
    piano.addEventListener("pointerup", soltar); piano.addEventListener("pointercancel", soltar);
    function mover(e) {
      const bajo = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.parentElement === piano && x.dataset.m);
      const m = bajo ? +bajo.dataset.m : null, prev = punteros.get(e.pointerId);
      if (m === prev) return; if (prev != null) noteOff(prev); if (m != null) noteOn(m); punteros.set(e.pointerId, m);
    }
    function voicing(a) {
      const notas = notasAcorde(a, inst.p.octava);
      if (perfil.preset === "bajo" || perfil.preset === "lead") return notas.slice(0, 1);
      return notas;
    }
    const acordesSonando = new Map();
    function tocarAcorde(a, on) {
      if (on) { const ns = voicing(a); acordesSonando.set(a, ns); ns.forEach(noteOn); }
      else { (acordesSonando.get(a) || []).forEach(noteOff); acordesSonando.delete(a); }
    }
    filaOct.firstChild.onclick = () => cambiarOct(-1); mas.onclick = () => cambiarOct(1);
    function cambiarOct(d) { [...activas].forEach(noteOff); inst.p.octava = Math.min(6, Math.max(1, inst.p.octava + d)); dibujarPiano(); }
    dibujarPiano();

    const teclaDown = {};
    document.addEventListener("keydown", e => {
      if (escribiendo(e) || e.repeat || e.ctrlKey || e.metaKey) return;
      const k = e.key.toLowerCase(), i = TECLAS.indexOf(k);
      if (i >= 0) { const m = 12 * (inst.p.octava + 1) + i; teclaDown[k] = m; noteOn(m); e.preventDefault(); }
      else if (k === "z") cambiarOct(-1); else if (k === "x") cambiarOct(1);
      else if (/^[1-9]$/.test(k)) { const a = ab.acorde(+k - 1); if (a) { teclaDown[k] = a; tocarAcorde(a, true); const b = ab.boton(+k - 1); b && b.classList.add("on"); } }
    });
    document.addEventListener("keyup", e => {
      const k = e.key.toLowerCase(); const v = teclaDown[k]; if (v == null) return; delete teclaDown[k];
      if (typeof v === "number") noteOff(v); else { tocarAcorde(v, false); const b = ab.boton(+k - 1); b && b.classList.remove("on"); }
    });
    // MIDI
    if (navigator.requestMIDIAccess) navigator.requestMIDIAccess().then(acc => {
      const conectar = () => acc.inputs.forEach(inp => { inp.onmidimessage = ev => {
        const [st, n, v] = ev.data; const tipo = st & 0xf0;
        if (tipo === 0x90 && v > 0) { activas.delete(n); inst.on(n, v / 127); activas.add(n); marcar(n, true); }
        else if (tipo === 0x80 || (tipo === 0x90 && v === 0)) noteOff(n);
      }; });
      conectar(); acc.onstatechange = conectar;
    }).catch(() => {});
    alAcorde = info => {
      ab.render(info.seccion); ab.marcar(info.idx);
      const a = G.parseAcorde(info.nombre); guia = a ? a.intervalos.map(i => (a.raiz + i) % 12) : []; marcarGuia();
    };
    alDetener = () => { [...activas].forEach(noteOff); };
    return { sonidoDefecto: (b, _c, base) => { inst.buffer = b; if (base) inst.base = base; carg.marcar("Propio (partitura)"); } };
  }

  /* ---------- AMBIENTE (sonido + colores) ---------- */
  function panelAmbiente() {
    inst = new Ambiente(perfil.preset);
    panel.appendChild(el(`<h3>${esc(perfil.nombre)}</h3>`));
    panel.appendChild(el(`<p class="muted small"><kbd>Espacio</kbd> enciende/apaga. Arrastra en el recuadro: <b>X</b> = distorsión y brillo, <b>Y</b> = volumen e intensidad del color.
      <kbd>F</kbd> destello, <kbd>V</kbd> pantalla completa (para proyectar). Los colores siguen la progresión de la obra.</p>`));
    const fila = el(`<div class="fila"></div>`);
    const on = el(`<button class="btn primario gran-btn">Encender</button>`);
    const flash = el(`<button class="btn gran-btn">✦ Destello</button>`);
    const full = el(`<button class="btn gran-btn">⛶ Pantalla completa</button>`);
    fila.append(on, flash, full);
    const xy = el(`<div class="xy"><span class="et" style="left:8px;bottom:6px">limpio</span><span class="et" style="right:8px;bottom:6px">distorsión</span>
      <span class="et" style="left:8px;top:6px">intenso ↑</span><div class="punto"></div></div>`);
    const punto = xy.querySelector(".punto");
    panel.append(fila, xy, sliders([slider("Volumen", inst.p, "vol", () => inst.aplicar()), slider("Reverb", inst.p, "reverb", () => inst.aplicar())]));

    // Editor de colores
    const edit = el(`<details class="cargar-box"><summary>🎨 Personalizar colores</summary>
      <p class="muted small" style="margin:8px 0">Un color por acorde de cada sección. Los cambios quedan guardados en este navegador.
      Para compartirlos con toda la orquesta, copia el código y pégalo en <code>js/partitura.js</code>.</p><div class="colores-edit"></div>
      <div class="fila" style="margin-top:8px"><button class="btn peq" data-a="copiar">Copiar código</button><button class="btn peq" data-a="reset">Restablecer</button><span class="small muted" data-a="msg"></span></div></details>`);
    const lista = edit.querySelector(".colores-edit");
    function dibujarEditor() {
      lista.innerHTML = "";
      SECCIONES.forEach(s => {
        const f = el(`<div class="fila-col"><span>${esc(s.nombre)}</span></div>`);
        s.acordes.forEach((a, i) => {
          const actual = coloresSec(s);
          const inp = el(`<input type="color" title="${esc(a)}">`);
          inp.value = aHex(actual[i % actual.length]);
          inp.oninput = () => {
            const base = coloresSec(s).slice(); while (base.length < s.acordes.length) base.push(base[base.length % Math.max(1, base.length)] || "#000000");
            base[i] = inp.value; override[s.idx] = base; G.guardar("colores", override); pintarLinea();
          };
          const lab = el(`<label class="fila small" style="gap:3px"></label>`); lab.append(inp, document.createTextNode(a)); f.appendChild(lab);
        });
        lista.appendChild(f);
      });
    }
    edit.querySelector("[data-a=copiar]").onclick = () => {
      const txt = SECCIONES.map(s => `// ${s.nombre}\ncolores: ${JSON.stringify(coloresSec(s))},`).join("\n");
      const msg = edit.querySelector("[data-a=msg]");
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => msg.textContent = "Copiado ✓", () => { msg.textContent = "Copia manual:"; console.log(txt); prompt("Copia este texto:", txt); });
    };
    edit.querySelector("[data-a=reset]").onclick = () => { override = {}; G.guardar("colores", override); dibujarEditor(); pintarLinea(); };
    dibujarEditor();
    panel.appendChild(edit);

    const carg = cargador("Textura en loop (sigue la raíz del acorde)", { base: 48,
      alCargar: (b, base, soloBase) => { const e = inst.encendido; inst.apagar(); if (!soloBase) inst.buffer = b; inst.base = base; if (e) inst.encender(); },
      alQuitar: () => { const e = inst.encendido; inst.apagar(); inst.buffer = null; if (e) inst.encender(); } });
    panel.appendChild(cajaSonidos([carg]));

    const toggle = () => { if (inst.encendido) inst.apagar(); else inst.encender(); on.textContent = inst.encendido ? "Apagar" : "Encender"; on.classList.toggle("on", inst.encendido); };
    on.onclick = toggle;
    const hacerDestello = () => { Luces.destellar(); inst.destello(); };
    flash.onclick = hacerDestello;
    full.onclick = () => Luces.pantalla(true);
    const pantalla = v => Luces.pantalla(v);
    function ponerXY(x, y) {
      inst.p.x = Math.min(1, Math.max(0, x)); inst.p.y = Math.min(1, Math.max(0, y)); inst.aplicar();
      punto.style.left = inst.p.x * 100 + "%"; punto.style.top = (1 - inst.p.y) * 100 + "%";
    }
    ponerXY(inst.p.x, inst.p.y);
    const moverXY = e => { const r = xy.getBoundingClientRect(); ponerXY((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height); };
    xy.addEventListener("pointerdown", e => { e.preventDefault(); xy.setPointerCapture(e.pointerId); moverXY(e); });
    xy.addEventListener("pointermove", e => { if (e.buttons) moverXY(e); });

    document.addEventListener("keydown", e => {
      if (escribiendo(e) || e.repeat) return;
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      else if (e.key.toLowerCase() === "f") hacerDestello();
      else if (e.key.toLowerCase() === "v") pantalla(!document.body.classList.contains("pantalla-completa"));
      else if (e.key === "ArrowUp") ponerXY(inst.p.x, inst.p.y + 0.05);
      else if (e.key === "ArrowDown") ponerXY(inst.p.x, inst.p.y - 0.05);
      else if (e.key === "ArrowRight") ponerXY(inst.p.x + 0.05, inst.p.y);
      else if (e.key === "ArrowLeft") ponerXY(inst.p.x - 0.05, inst.p.y);
    });

    Luces.activar({
      intens: () => (inst.encendido ? 0.25 + inst.p.y * 0.75 : 0.18),
      vel: () => 0.1 + inst.p.x * 0.9,
      alClic: () => inst.destello(),
      alPintar: (r, g, b, intens, destello) => {
        xy.style.background = `radial-gradient(circle at ${inst.p.x * 100}% ${(1 - inst.p.y) * 100}%, rgba(${r},${g},${b},${0.35 + intens * 0.6}), rgba(${r * 0.15},${g * 0.15},${b * 0.15},.9) 75%)`;
        xy.style.boxShadow = destello > 0.01 ? `inset 0 0 0 999px rgba(255,255,255,${destello * 0.6})` : "";
      },
    });
    alAcorde = info => inst.afinar(info.nombre);
    alDetener = () => {};
    return { sonidoDefecto: (b, _c, base) => { inst.buffer = b; if (base) inst.base = base; carg.marcar("Propio (partitura)"); } };
  }

  function aRGB(c) {
    const cv = aRGB.cv || (aRGB.cv = document.createElement("canvas").getContext("2d"));
    cv.fillStyle = "#000"; cv.fillStyle = c; const h = cv.fillStyle;
    if (h[0] === "#") return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const m = h.match(/[\d.]+/g) || [0, 0, 0]; return m.slice(0, 3).map(Number);
  }
  function aHex(c) { return "#" + aRGB(c).map(v => Math.round(v).toString(16).padStart(2, "0")).join(""); }

  /* ============================== BUCLE PRINCIPAL ============================== */
  let ultimoAcorde = null, ultimoEvento = null, tAnterior = performance.now();
  const banner = $("banner"); let bannerHasta = 0;
  function cuadro() {
    const nowp = performance.now(), dt = Math.min(0.1, (nowp - tAnterior) / 1000); tAnterior = nowp;
    let t = ahora();
    if (corriendo() && t > DURACION + 3) { inicio = null; practica = 0; alDetener(); $("estado").textContent = "Fin de la obra"; }
    const tc = Math.min(Math.max(t, 0), DURACION);
    $("reloj").textContent = fmt(tc);
    $("cursor").style.left = (tc / DURACION * 100) + "%";
    $("estado").textContent = corriendo() ? (t < 0 ? "Esperando inicio" : t > DURACION ? "Fin de la obra" : "En curso") : "Detenido · práctica libre";
    $("cuenta").textContent = corriendo() && t < 0 ? `Comienza en ${Math.ceil(-t)} s` : "";

    const info = acordeEn(tc);
    const s = info.seccion;
    $("seccion").textContent = s.nombre;
    $("acorde").textContent = info.nombre;
    $("acordeSig").textContent = info.siguiente ? "→ " + info.siguiente : "";
    const durA = G.SEG_POR_COMPAS * s.cpa;
    $("barraAcorde").style.width = ((1 - info.falta / durA) * 100) + "%";
    const clave = s.idx + ":" + info.idx + ":" + info.nombre;
    if (clave !== ultimoAcorde) {
      ultimoAcorde = clave;
      alAcorde(info);
      document.documentElement.style.setProperty("--sec", colorEn(tc));
      $("instr").innerHTML = instrucciones(s, perfil).map(i => `<li class="${i.propio ? "propio" : ""}"><b>${esc(i.quien)}</b>${esc(i.texto)}</li>`).join("")
        || `<li class="muted">Sin instrucciones en esta sección.</li>`;
    }
    const sig = SECCIONES[s.idx + 1];
    if (sig) {
      const ins = instrucciones(sig, perfil).filter(i => i.propio || i.quien !== "Todos").map(i => i.texto);
      $("proxima").innerHTML = `<b>Siguiente: ${esc(sig.nombre)}</b> en ${fmt(sig.ini - tc)}${ins.length ? " — " + esc(ins.join(" ")) : ""}`;
    } else $("proxima").textContent = `Fin en ${fmt(DURACION - tc)}`;

    // Avisos (solo con el reloj en marcha)
    if (corriendo()) {
      const e = EVENTOS.find(e => eventoAplica(e, perfil) && t >= e.seg && t < e.seg + 0.5);
      if (e && e !== ultimoEvento) { ultimoEvento = e; banner.textContent = e.texto; banner.classList.add("ver"); bannerHasta = nowp + 3500; }
    }
    if (nowp > bannerHasta) banner.classList.remove("ver");
    // ¿Toco o no? + barra de carga de la sección
    const tocaAhora = toca(s, perfil), cambio = proximoCambio(tc, perfil);
    const et = $("toca");
    et.className = "estado-toca " + (tocaAhora ? "si" : "no");
    et.firstChild.textContent = tocaAhora ? "▶ TOCAS" : "⏸ SILENCIO";
    et.lastChild.textContent = cambio ? (cambio.entra ? `Entras en ${fmt(cambio.seccion.ini - tc)}` : `Paras en ${fmt(cambio.seccion.ini - tc)}`) : (tocaAhora ? "hasta el final" : "");
    $("barraSeccion").style.width = (((tc - s.ini) / (s.fin - s.ini)) * 100) + "%";
    $("restaSeccion").textContent = `${s.nombre} · quedan ${fmt(s.fin - tc)}`;
    Luces.cuadro(t, dt);
    alCuadro(t, dt);
    requestAnimationFrame(cuadro);
  }

  /* ============================== ACTIVAR ============================== */
  $("btnActivar").onclick = async () => {
    Motor.init();
    $("overlay").classList.add("oculto");
    const constructor = { guitarra: panelGuitarra, bateria: panelBateria, teclado: panelTeclado, ambiente: panelAmbiente }[perfil.tipo];
    const api = constructor();
    requestAnimationFrame(cuadro);
    if (params.get("inicio")) inicio = horaAEpoch(params.get("inicio"));
    // Sonidos por defecto desde la partitura
    const def = (P.sonidos || {})[perfil.id] || (P.sonidos || {})[perfil.grupo];
    try {
      // Formatos: "ruta.wav" · { archivo, base } · { clave: "ruta.wav" | { archivo, base }, … } (pads o acordes)
      const uno = async (v, clave) => {
        const o = typeof v === "string" ? { archivo: v } : v;
        api.sonidoDefecto(await Motor.cargarURL(o.archivo), clave, o.base);
      };
      if (typeof def === "string" || (def && def.archivo)) await uno(def);
      else if (def && typeof def === "object") for (const k in def) { try { await uno(def[k], k); } catch (e) { console.warn("Sonido no disponible:", k, e.message); } }
    } catch (e) { console.warn("No se pudo cargar el sonido de la partitura:", e.message); }
  };
})();
