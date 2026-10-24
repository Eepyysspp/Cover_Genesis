/* ==========================================================================
   PISTAS MIDI — lector de archivos .mid, reproductor sincronizado con el
   reloj de la obra y modos creativos para tocarlos.

   Cada perfil puede tomar una pista (melodía, bajo, batería…) y tocarla con
   SU instrumento (los sliders de filtro/distorsión/fuzz también la afectan):
     · Seguir la obra    la pista suena alineada con el reloj (130 BPM).
     · Pulsar en orden   tú pones el ritmo: cada pulsación toca la nota/acorde
                         siguiente de la pista.
     · Pulsar lo que suena  cada pulsación toca lo que la pista tiene sonando
                         en ese momento de la obra.
   Transformaciones: bucle (¼ a 4 compases), velocidad ½/×2, reverso,
   espejo (en Re♭ mayor), arpegio, ajustar al acorde de la partitura,
   transponer, densidad, eco, desfase, humanizar y "cruce" (el ritmo de
   una pista con las notas de otra). Opcional: salida a un puerto MIDI
   externo (Pure Data, un DAW, un sintetizador).
   ========================================================================== */
(function () {
  const G = window.G;
  const { P, SEG_POR_COMPAS, DURACION, acordeEn, parseAcorde, notasAcorde, nombreNota } = G;
  const NEGRA = 60 / P.bpm;
  const COMPAS = SEG_POR_COMPAS;
  const ADELANTO = 0.15;       // s que se agendan por adelantado
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const el = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; };

  /* ============================== LECTOR SMF ============================== */
  function leerMIDI(buffer) {
    const d = new DataView(buffer);
    let p = 0;
    const u8 = () => d.getUint8(p++);
    const u16 = () => { const v = d.getUint16(p); p += 2; return v; };
    const u32 = () => { const v = d.getUint32(p); p += 4; return v; };
    const txt = n => { let s = ""; for (let i = 0; i < n; i++) s += String.fromCharCode(d.getUint8(p + i)); p += n; return s; };
    const vlq = () => { let v = 0, b; do { b = u8(); v = (v * 128) + (b & 0x7f); } while (b & 0x80); return v; };
    if (txt(4) !== "MThd") throw new Error("No es un archivo MIDI");
    const largoCab = u32(); const formato = u16(), nPistas = u16(), div = u16(); p += largoCab - 6;
    if (div & 0x8000) throw new Error("MIDI con tiempo SMPTE: no soportado");
    const tempos = [], crudas = [];
    for (let k = 0; k < nPistas && p + 8 <= d.byteLength; k++) {
      let id = txt(4), largo = u32();
      while (id !== "MTrk" && p + largo + 8 <= d.byteLength) { p += largo; id = txt(4); largo = u32(); }
      const fin = Math.min(d.byteLength, p + largo);
      let tick = 0, estado = 0, nombre = "";
      const ev = [];
      while (p < fin) {
        tick += vlq();
        let b = d.getUint8(p);
        if (b & 0x80) { p++; if (b < 0xf0) estado = b; }
        else if (estado) b = estado;
        else { p++; continue; }
        if (b === 0xff) {
          const tipo = u8(), l = vlq();
          if (tipo === 0x51 && l >= 3) tempos.push({ tick, us: (d.getUint8(p) << 16) | (d.getUint8(p + 1) << 8) | d.getUint8(p + 2) });
          else if (tipo === 0x03 && !nombre) { for (let i = 0; i < l; i++) nombre += String.fromCharCode(d.getUint8(p + i)); }
          p += l;
        } else if (b === 0xf0 || b === 0xf7) { p += vlq(); }
        else {
          const tipo = b & 0xf0, ch = b & 0x0f;
          const a = u8(), c = (tipo === 0xc0 || tipo === 0xd0) ? 0 : u8();
          if (tipo === 0x90 && c > 0) ev.push({ tick, on: true, m: a, v: c, ch });
          else if (tipo === 0x80 || tipo === 0x90) ev.push({ tick, on: false, m: a, ch });
        }
      }
      p = fin;
      crudas.push({ nombre, ev, ultimo: tick });
    }
    // Mapa de tempo (ticks → segundos)
    tempos.sort((a, b) => a.tick - b.tick);
    const mapa = [{ tick: 0, seg: 0, us: 500000 }];
    tempos.forEach(t => {
      const u = mapa[mapa.length - 1];
      if (t.tick === u.tick) u.us = t.us;
      else mapa.push({ tick: t.tick, seg: u.seg + (t.tick - u.tick) * u.us / 1e6 / div, us: t.us });
    });
    const seg = tick => { let m = mapa[0]; for (const x of mapa) { if (x.tick <= tick) m = x; else break; } return m.seg + (tick - m.tick) * m.us / 1e6 / div; };
    const pistas = [];
    crudas.forEach((c, i) => {
      const abiertas = new Map(), notas = [];
      c.ev.forEach(e => {
        const k = e.ch * 128 + e.m;
        if (e.on) { if (!abiertas.has(k)) abiertas.set(k, []); abiertas.get(k).push(e); }
        else { const pila = abiertas.get(k); const o = pila && pila.shift(); if (o) notas.push({ t: seg(o.tick), d: Math.max(0.02, seg(e.tick) - seg(o.tick)), m: o.m, v: o.v / 127, ch: o.ch }); }
      });
      abiertas.forEach(pila => pila.forEach(o => notas.push({ t: seg(o.tick), d: Math.max(0.05, seg(c.ultimo) - seg(o.tick)), m: o.m, v: o.v / 127, ch: o.ch })));
      if (!notas.length) return;
      const canal = notas[0].ch;
      pistas.push({ nombre: c.nombre || "Pista " + (i + 1), canal, bateria: canal === 9, notas });
    });
    return { formato, bpm: Math.round(60e6 / mapa[0].us), pistas };
  }

  /* ============================== PISTAS ============================== */
  function lb(arr, x, clave) { let a = 0, b = arr.length; while (a < b) { const m = (a + b) >> 1; if (clave(arr[m]) < x) a = m + 1; else b = m; } return a; }

  // Prepara una pista para consultas rápidas
  function preparar(base) {
    const notas = base.notas.slice().sort((a, b) => a.t - b.t || a.m - b.m);
    const porFin = notas.slice().sort((a, b) => (a.t + a.d) - (b.t + b.d));
    const grupos = [];
    notas.forEach(n => { const g = grupos[grupos.length - 1]; if (g && n.t - g.t < 0.012) g.notas.push(n); else grupos.push({ t: n.t, notas: [n] }); });
    const ms = notas.map(n => n.m);
    return Object.assign({}, base, {
      notas, porFin, grupos,
      maxD: Math.max(...notas.map(n => n.d)), min: Math.min(...ms), max: Math.max(...ms),
      fin: Math.max(...notas.map(n => n.t + n.d)),
    });
  }
  const inicios = (p, a, b) => { const out = []; for (let i = lb(p.notas, a, n => n.t); i < p.notas.length && p.notas[i].t < b; i++) out.push(p.notas[i]); return out; };
  const finales = (p, a, b) => { const out = []; for (let i = lb(p.porFin, a, n => n.t + n.d); i < p.porFin.length && p.porFin[i].t + p.porFin[i].d <= b; i++) if (p.porFin[i].t + p.porFin[i].d > a) out.push(p.porFin[i]); return out; };
  function sonando(p, x) {
    const out = []; const hasta = lb(p.notas, x + 1e-6, n => n.t);
    for (let i = hasta - 1; i >= 0 && p.notas[i].t >= x - p.maxD; i--) if (p.notas[i].t + p.notas[i].d > x) out.push(p.notas[i]);
    return out;
  }
  // Notas "de referencia" en x: las que suenan o, si no hay, el grupo más cercano
  function alrededor(p, x) {
    const s = sonando(p, x); if (s.length) return s;
    const i = lb(p.grupos, x, g => g.t);
    const sig = p.grupos[i], ant = p.grupos[i - 1];
    if (sig && sig.t - x < NEGRA) return sig.notas;
    return ant ? ant.notas : sig ? sig.notas : [];
  }

  // Datos embebidos (js/pistas_midi.js) para que funcione también abriendo el archivo sin servidor
  function base64ABuffer(b64) { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
  async function leerRuta(ruta) {
    const emb = (window.PISTAS_MIDI_DATOS || {})[ruta];
    if (emb) return base64ABuffer(emb);
    const r = await fetch(ruta); if (!r.ok) throw new Error(ruta + " → " + r.status);
    return await r.arrayBuffer();
  }
  // Carga las pistas definidas en partitura.js (midi.pistas)
  let cacheObra = null;
  function pistasDeLaObra() {
    if (cacheObra) return cacheObra;
    const defs = (P.midi && P.midi.pistas) || [];
    cacheObra = Promise.all(defs.map(async def => {
      try {
        const m = leerMIDI(await leerRuta(def.archivo));
        const todas = m.pistas.flatMap(x => x.notas);
        if (!todas.length) return null;
        return preparar({ id: def.id, nombre: def.nombre || m.pistas[0].nombre, preset: def.preset, archivo: def.archivo,
          bateria: def.bateria != null ? def.bateria : m.pistas.every(x => x.bateria), notas: todas });
      } catch (e) { console.warn("Pista MIDI no disponible:", def.archivo, e.message); return null; }
    })).then(l => l.filter(Boolean));
    return cacheObra;
  }
  async function pistasDeArchivo(file) {
    const m = leerMIDI(await file.arrayBuffer());
    const nombreArch = file.name.replace(/\.midi?$/i, "");
    return m.pistas.map((x, i) => preparar({ id: "propia-" + Date.now() + "-" + i, nombre: nombreArch + (m.pistas.length > 1 ? " · " + x.nombre : ""), bateria: x.bateria, notas: x.notas }));
  }

  /* ============================== TRANSFORMACIONES DE ALTURA ============================== */
  // Escala de Re♭ mayor (la tonalidad de la obra) para el espejo diatónico
  const PCS_ESCALA = [1, 3, 5, 6, 8, 10, 0];
  const ESCALA = []; for (let m = 0; m < 128; m++) if (PCS_ESCALA.includes(m % 12)) ESCALA.push(m);
  const idxEscala = m => { let mejor = 0; ESCALA.forEach((x, i) => { if (Math.abs(x - m) < Math.abs(ESCALA[mejor] - m)) mejor = i; }); return mejor; };
  function espejo(m, pivote) { const i = idxEscala(m), ip = idxEscala(pivote); return ESCALA[Math.min(ESCALA.length - 1, Math.max(0, 2 * ip - i))]; }
  function ajustarA(m, acorde) {
    const a = parseAcorde(acorde); if (!a) return m;
    const pcs = a.intervalos.map(i => (a.raiz + i) % 12);
    for (let k = 0; k <= 6; k++) { if (pcs.includes(((m - k) % 12 + 12) % 12)) return m - k; if (pcs.includes((m + k) % 12)) return m + k; }
    return m;
  }
  const acordeObra = r => acordeEn(Math.min(Math.max(0, r), DURACION - 0.01)).nombre;

  // Batería General MIDI → pads del perfil Batería
  const GM = { 35: "bombo", 36: "bombo", 37: "caja", 38: "caja", 39: "caja", 40: "caja", 41: "tom", 43: "tom", 45: "tom", 47: "tom", 48: "tom", 50: "tom",
    42: "hihat", 44: "hihat", 46: "abierto", 51: "abierto", 53: "abierto", 59: "abierto", 49: "crash", 52: "crash", 55: "crash", 57: "crash" };
  const PADS_ORDEN = ["bombo", "caja", "hihat", "abierto", "tom", "crash"];
  const padDeNota = m => GM[m] || PADS_ORDEN[((m % 6) + 6) % 6];
  // Batería → notas del acorde actual (cuando una pista de batería se toca con un instrumento melódico)
  const GOLPE_A_VOZ = { bombo: 0, tom: 0, caja: 2, hihat: 1, abierto: 3 };

  /* ============================== REPRODUCTOR ============================== */
  class Reproductor {
    /* reloj(): { t, corriendo }  — t = tiempo de la obra en segundos */
    constructor({ reloj, motor }) {
      this.reloj = reloj; this.motor = motor;
      this.capas = [];            // { pista, destino, mute, solo, vol, ptr }
      this.cfg = { modo: "seguir", vel: 1, reverso: false, bucle: 0, espejo: false, arpegio: 0, ajustar: false,
        transp: 0, densidad: 1, eco: 0, desfase: 0, humano: 0, volumen: 1, ritmoDe: null, soloExterna: false };
      this.activo = false; this.libre = null; this.rPrev = null; this.ancla = { r: 0, u: 0 }; this.L0 = 0;
      this.eraCorriendo = false; this.salida = null; this.alCambiar = () => {};
      this.timer = setInterval(() => this.tick(), 25);
    }
    /* ---------- Reloj ---------- */
    tiempo() {
      const c = this.reloj();
      if (c.corriendo) return c.t;
      if (this.libre) return this.libre.r0 + (performance.now() - this.libre.p0) / 1000;
      return c.t;
    }
    u(r) { return this.ancla.u + (r - this.ancla.r) * this.cfg.vel; }
    rDeU(u) { return this.ancla.r + (u - this.ancla.u) / this.cfg.vel; }
    get largoBucle() { return this.cfg.bucle * COMPAS; }
    get segReverso() { return this.cfg.bucle ? Math.min(this.largoBucle, COMPAS) : COMPAS; }
    get origen() { return this.cfg.bucle ? this.L0 : 0; }
    bucleMap(u) { const L = this.largoBucle; if (!L || u < this.L0) return u; return this.L0 + ((u - this.L0) % L); }
    revMap(x) { const s = this.segReverso, o = this.origen; const ini = o + Math.floor((x - o) / s) * s; return 2 * ini + s - x; }
    // Posición de la pista en el tiempo real r (para dibujar y para "pulsar lo que suena")
    posicion(r = this.tiempo()) {
      const u = this.activo ? this.u(r) : r;
      const x1 = this.bucleMap(u);
      return { r, u, x1, x: this.cfg.reverso ? this.revMap(x1) : x1 };
    }
    sincronizar(r = this.tiempo()) { this.ancla = { r, u: r }; this.rPrev = r; }

    /* ---------- Transporte ---------- */
    iniciar() {
      if (!this.capas.length) return;
      const c = this.reloj();
      this.libre = c.corriendo ? null : { r0: Math.max(0, c.t), p0: performance.now() };
      this.eraCorriendo = c.corriendo;
      this.activo = true; this.sincronizar(this.tiempo()); this.alCambiar();
      this.perseguirTodo(this.tiempo());
    }
    // Hace sonar las notas largas que ya venían sonando en r (al partir a mitad de una nota sostenida)
    perseguir(capa, r, antesDe = r) {
      if (this.cfg.reverso || !this.motor.ctx || capa.pista.bateria) return;
      const pos = this.posicion(r), limite = pos.x - (r - antesDe) * this.cfg.vel - 0.005;
      const ev = sonando(capa.pista, pos.x).filter(n => n.t < limite && n.t + n.d - pos.x > 0.1)
        .map(n => ({ capa, r, m: n.m, v: n.v * 0.9, d: (n.t + n.d - pos.x) / this.cfg.vel, bat: false, golpe: null }));
      if (ev.length) this.emitir(ev, r, true);
    }
    perseguirTodo(r) { this.capas.forEach(c => this.perseguir(c, r)); }
    detener() { this.activo = false; this.libre = null; this.rPrev = null; this.alCambiar(); }
    alternar() { this.activo ? this.detener() : this.iniciar(); }
    ponerVel(v) {
      if (this.activo && this.rPrev != null) this.ancla = { r: this.rPrev, u: this.u(this.rPrev) };
      this.cfg.vel = v; this.alCambiar();
    }
    ponerBucle(compases) {
      if (compases) {
        const L = compases * COMPAS, q = Math.min(L, COMPAS);
        const u = this.posicion().u;
        // Bucle "retenido": repite el tramo que está sonando (si es más largo que un compás, incluye los anteriores)
        if (!this.cfg.bucle || compases !== this.cfg.bucle) this.L0 = Math.max(0, Math.floor(u / q + 1e-6) * q - Math.max(0, L - COMPAS));
      }
      this.cfg.bucle = compases; this.alCambiar();
    }

    /* ---------- Agenda ---------- */
    tick() {
      if (!this.activo || !this.motor.ctx) return;
      const c = this.reloj();
      if (this.eraCorriendo && !c.corriendo) { this.detener(); return; }        // la obra se detuvo
      if (!this.eraCorriendo && c.corriendo) { this.libre = null; this.sincronizar(c.t); } // la obra partió
      this.eraCorriendo = c.corriendo;
      const r = this.tiempo();
      if (this.rPrev == null || r < this.rPrev - ADELANTO - 0.1 || r > this.rPrev + 0.4) { this.sincronizar(r); this.perseguirTodo(r); } // salto en la línea de tiempo
      if (!c.corriendo && this.libre) {
        const fin = Math.max(...this.capas.map(k => k.pista.fin));
        if (this.posicion(r).u > fin + 1 && !this.cfg.bucle) { this.detener(); return; }
      }
      const hasta = r + ADELANTO;
      if (hasta <= this.rPrev) return;
      this.procesar(this.rPrev, hasta, r);
      this.rPrev = hasta;
    }
    // Recorre el tramo real [ra, rb) y agenda las notas que caen ahí, con bucle y reverso
    procesar(ra, rb, rAhora) {
      const ua = this.u(ra), ub = this.u(rb);
      const tramos = [];
      const L = this.largoBucle;
      if (L && ub > this.L0) {
        let a = Math.max(ua, this.L0);
        if (ua < this.L0) tramos.push([ua, this.L0]);
        while (a < ub - 1e-9) {
          const k = Math.floor((a - this.L0) / L + 1e-9);
          const b = Math.min(ub, this.L0 + (k + 1) * L);
          tramos.push([a, b]); a = b;
        }
      } else tramos.push([ua, ub]);
      const eventos = [];
      tramos.forEach(([u0, u1]) => {
        const xs = this.bucleMap(u0), xe = xs + (u1 - u0);
        if (!this.cfg.reverso) {
          this.capas.forEach(capa => this.consultar(capa, xs, xe, false, x => this.rDeU(u0 + (x - xs)), eventos));
          return;
        }
        // Reverso: cada segmento (1 compás o el bucle) se lee de atrás hacia adelante
        const s = this.segReverso, o = this.origen;
        let a = xs;
        while (a < xe - 1e-9) {
          const ini = o + Math.floor((a - o) / s + 1e-9) * s, b = Math.min(xe, ini + s);
          const hi = 2 * ini + s - a, lo = 2 * ini + s - b;
          this.capas.forEach(capa => this.consultar(capa, lo, hi, true, y => this.rDeU(u0 + ((2 * ini + s - y) - xs)), eventos));
          a = b;
        }
      });
      this.emitir(eventos, rAhora);
    }
    // Busca notas de una capa en [a, b) (o (a, b] por su final si es reverso) y las pasa a eventos reales
    consultar(capa, a, b, rev, aReal, out) {
      const ritmo = this.cfg.ritmoDe && this.cfg.ritmoDe !== capa.pista ? this.cfg.ritmoDe : null;
      const fuente = ritmo || capa.pista;
      const hallados = rev ? finales(fuente, a, b) : inicios(fuente, a, b);
      const vistos = new Set();
      hallados.forEach(n => {
        const x = rev ? n.t + n.d : n.t;
        const r = aReal(x);
        if (!ritmo) { out.push({ capa, r, m: n.m, v: n.v, d: n.d / this.cfg.vel, bat: capa.pista.bateria, golpe: capa.pista.bateria ? padDeNota(n.m) : null }); return; }
        // Cruce: el ritmo viene de otra pista y las notas de esta
        const clave = Math.round(x * 50); if (vistos.has(clave)) return; vistos.add(clave);
        const d = Math.max(n.d, 0.12) / this.cfg.vel;
        const golpe = ritmo.bateria ? padDeNota(n.m) : null;
        alrededor(capa.pista, x).forEach(p => out.push({ capa, r, m: p.m, v: n.v, d, bat: capa.pista.bateria, golpe }));
      });
    }
    // Aplica transformaciones y manda los eventos a los instrumentos
    emitir(eventos, rAhora, inmediato = false) {
      if (!eventos.length) return;
      const cfg = this.cfg, M = this.motor;
      const haySolo = this.capas.some(k => k.solo);
      // Agrupa por capa y tiempo para densidad y arpegio
      const grupos = new Map();
      eventos.forEach(e => { const k = e.capa.id + ":" + Math.round(e.r * 100); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(e); });
      const finales2 = [];
      grupos.forEach(g => {
        if (cfg.densidad < 1 && Math.random() > cfg.densidad) return;
        const capa = g[0].capa;
        if (capa.mute || (haySolo && !capa.solo)) return;
        if (capa.activa && !capa.activa(g[0].r)) return;   // p. ej. solo cuando ese instrumento toca según la partitura
        if (capa.limite) { const lim = Math.max(0.05, capa.limite(g[0].r)); g.forEach(e => { e.d = Math.min(e.d, lim); }); }
        const melodico = !capa.destino.esBateria;
        let notas = g.map(e => Object.assign({}, e));
        // Altura
        notas.forEach(e => {
          if (e.bat && melodico) {          // golpe de batería → nota del acorde actual
            const voces = notasAcorde(acordeObra(e.r), capa.destino.octava ? capa.destino.octava() : 3);
            const i = GOLPE_A_VOZ[e.golpe];
            e.m = i == null ? voces[0] + 12 : voces[i % voces.length] + (e.golpe === "hihat" || e.golpe === "abierto" ? 12 : 0);
            e.d = Math.max(e.d, NEGRA * 0.5);
          }
          if (!e.bat || melodico) {
            if (cfg.espejo) e.m = espejo(e.m, Math.round((capa.pista.min + capa.pista.max) / 2));
            e.m += cfg.transp;
            if (cfg.ajustar) e.m = ajustarA(e.m, acordeObra(e.r));
            e.m = Math.min(127, Math.max(0, e.m));
          }
          if (!melodico) e.golpe = e.golpe || padDeNota(e.m);
        });
        // Arpegio: separa las notas simultáneas en semicorcheas
        if (cfg.arpegio && notas.length > 1) {
          notas.sort((a, b) => cfg.arpegio > 0 ? a.m - b.m : b.m - a.m);
          const paso = NEGRA / 4 / (inmediato ? 1 : cfg.vel);
          notas.forEach((e, i) => { e.r += i * paso; e.d = Math.max(0.08, e.d - i * paso); });
        }
        // Humanizar, desfase, volumen
        notas.forEach(e => {
          if (cfg.humano) { e.r += (Math.random() - 0.5) * 0.06 * cfg.humano; e.v *= 1 + (Math.random() - 0.5) * 0.5 * cfg.humano; }
          e.r += cfg.desfase; e.v = Math.min(1, e.v * cfg.volumen * (capa.vol == null ? 1 : capa.vol));
        });
        // Eco: repeticiones en corchea con puntillo
        const nEco = Math.round(cfg.eco * 4);
        const conEco = notas.slice();
        for (let k = 1; k <= nEco; k++) notas.forEach(e => conEco.push(Object.assign({}, e, { r: e.r + k * NEGRA * 0.75, v: e.v * Math.pow(0.55, k), eco: true })));
        finales2.push(...conEco);
      });
      // A tiempo del contexto de audio
      const ahoraCtx = M.t;
      const porDestino = new Map();
      finales2.forEach(e => {
        let t = ahoraCtx + (e.r - rAhora);
        if (t < ahoraCtx - 0.05) return;
        t = Math.max(t, ahoraCtx);
        e.tc = t;
        if (this.salida) this.enviarExterna(e);
        if (this.salida && cfg.soloExterna) return;
        const k = e.capa.id + ":" + Math.round(t * 200);
        if (!porDestino.has(k)) porDestino.set(k, []); porDestino.get(k).push(e);
      });
      porDestino.forEach(lista => {
        const dst = lista[0].capa.destino;
        if (dst.grupo && lista.length > 1) dst.grupo(lista.map(e => ({ m: e.m, v: e.v, d: e.d, golpe: e.golpe })), lista[0].tc);
        else lista.forEach(e => dst.nota(e.m, e.v, e.tc, e.d, e.golpe));
      });
    }
    enviarExterna(e) {
      const o = this.salida; if (!o) return;
      const ch = e.capa.destino.esBateria || e.bat ? 9 : (e.capa.canal || 0) % 16;
      const nota = e.capa.destino.esBateria && e.golpe ? ({ bombo: 36, caja: 38, hihat: 42, abierto: 46, tom: 45, crash: 49 }[e.golpe] || e.m) : e.m;
      const cuando = performance.now() + (e.tc - this.motor.t) * 1000;
      const vel = Math.max(1, Math.min(127, Math.round(e.v * 127)));
      try { o.send([0x90 | ch, nota, vel], cuando); o.send([0x80 | ch, nota, 0], cuando + Math.max(30, e.d * 1000)); } catch (err) {}
    }

    // Notas que suenan ahora en la pista de una capa, con transponer/espejo/ajustar aplicados
    // (lo usa el ambiente para afinar su drone con el arreglo)
    notasAhora(capa = this.capas[0], r = this.tiempo()) {
      if (!capa || capa.pista.bateria) return [];
      const pos = this.posicion(r), cfg = this.cfg;
      const ms = alrededor(capa.pista, Math.max(0, pos.x)).map(n => {
        let m = n.m;
        if (cfg.espejo) m = espejo(m, Math.round((capa.pista.min + capa.pista.max) / 2));
        m += cfg.transp;
        if (cfg.ajustar) m = ajustarA(m, acordeObra(r));
        return Math.min(127, Math.max(0, m));
      });
      return [...new Set(ms)].sort((a, b) => a - b);
    }

    /* ---------- Pulsar: tú pones el ritmo ---------- */
    pulsar(fuerza = 0.85) {
      if (!this.motor.ctx || !this.capas.length) return;
      const r = this.tiempo(), pos = this.posicion(r);
      const eventos = [];
      this.capas.forEach(capa => {
        const p = capa.pista;
        let notas;
        if (this.cfg.modo === "ahora") notas = alrededor(p, pos.x);
        else {
          const gs = p.grupos;
          // Si el reloj de la obra corre y el puntero quedó lejos, se reubica en el punto actual
          const lejos = capa.ptr == null || (this.reloj().corriendo && Math.abs(gs[capa.ptr].t - pos.x1) > COMPAS * 1.01);
          if (lejos) capa.ptr = Math.min(gs.length - 1, lb(gs, pos.x1 - 0.05, g => g.t));
          // Con bucle, el puntero se queda dentro del tramo
          const L = this.largoBucle;
          if (L) {
            const dentro = i => gs[i].t >= this.L0 - 1e-3 && gs[i].t < this.L0 + L - 1e-3;
            if (!dentro(capa.ptr)) { capa.ptr = lb(gs, this.L0 - 1e-3, g => g.t); if (capa.ptr >= gs.length || !dentro(capa.ptr)) capa.ptr = Math.max(0, capa.ptr - 1); }
          }
          notas = gs[capa.ptr].notas;
          const paso = this.cfg.reverso ? -1 : 1;
          let sig = capa.ptr + paso;
          if (L) { const ok = sig >= 0 && sig < gs.length && gs[sig].t >= this.L0 - 1e-3 && gs[sig].t < this.L0 + L - 1e-3;
            if (!ok) sig = paso > 0 ? lb(gs, this.L0 - 1e-3, g => g.t) : lb(gs, this.L0 + L - 1e-3, g => g.t) - 1; }
          capa.ptr = (sig + gs.length) % gs.length;
          capa.ultimoPulso = gs[(capa.ptr - paso + gs.length) % gs.length].t;
        }
        notas.forEach(n => eventos.push({ capa, r, m: n.m, v: Math.max(n.v, 0.3) * fuerza / 0.85, d: Math.min(n.d, COMPAS * 2), bat: p.bateria, golpe: p.bateria ? padDeNota(n.m) : null }));
      });
      this.emitir(eventos, r, true);
    }
  }

  /* ============================== PIANO ROLL ============================== */
  function dibujarRollo(canvas, rep, colorCapa) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width = canvas.clientWidth * devicePixelRatio, h = canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    if (!rep.capas.length) return;
    const pos = rep.posicion();
    const ventana = COMPAS * 4, izq = pos.x1 - COMPAS * 1.25;
    const X = x => (x - izq) / ventana * w;
    const visibles = rep.capas.filter(k => !k.mute);
    const todas = visibles.length ? visibles : rep.capas;
    let lo = Math.min(...todas.map(k => k.pista.min)) - 2, hi = Math.max(...todas.map(k => k.pista.max)) + 2;
    if (hi - lo < 14) { const c = (hi + lo) / 2; lo = c - 7; hi = c + 7; }
    const Y = m => h - (m - lo + 1) / (hi - lo + 1) * h, alto = Math.max(2, h / (hi - lo + 1) - 1);
    // Compases
    ctx.fillStyle = "rgba(255,255,255,.06)";
    for (let c = Math.floor(izq / COMPAS); c * COMPAS < izq + ventana; c++) { ctx.fillRect(X(c * COMPAS), 0, 1 * devicePixelRatio, h); }
    // Bucle
    if (rep.cfg.bucle) { ctx.fillStyle = "rgba(124,156,255,.12)"; ctx.fillRect(X(rep.L0), 0, X(rep.L0 + rep.largoBucle) - X(rep.L0), h); }
    // Ritmo de cruce
    if (rep.cfg.ritmoDe) {
      ctx.fillStyle = "rgba(255,255,255,.35)";
      inicios(rep.cfg.ritmoDe, izq, izq + ventana).forEach(n => ctx.fillRect(X(n.t), h - 6 * devicePixelRatio, 2 * devicePixelRatio, 6 * devicePixelRatio));
    }
    // Notas
    todas.forEach((capa, ci) => {
      const col = colorCapa(capa, ci);
      inicios(capa.pista, izq - capa.pista.maxD, izq + ventana).forEach(n => {
        const vivo = n.t <= pos.x && n.t + n.d > pos.x;
        ctx.fillStyle = vivo ? "#ffffff" : col;
        ctx.globalAlpha = vivo ? 1 : 0.35 + n.v * 0.5;
        ctx.fillRect(X(n.t), Y(n.m), Math.max(2, X(n.t + n.d) - X(n.t) - 1), alto);
      });
      ctx.globalAlpha = 1;
      if (rep.cfg.modo === "pulsar" && capa.ptr != null && capa.pista.grupos[capa.ptr]) {
        const g = capa.pista.grupos[capa.ptr]; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2 * devicePixelRatio;
        g.notas.forEach(n => ctx.strokeRect(X(n.t), Y(n.m), Math.max(4, X(n.t + n.d) - X(n.t) - 1), alto));
      }
    });
    // Cabezal: posición real que suena (con reverso puede ir hacia atrás)
    ctx.fillStyle = "#ff6b9a"; ctx.fillRect(X(pos.x) - devicePixelRatio, 0, 2 * devicePixelRatio, h);
    if (rep.cfg.reverso) { ctx.fillStyle = "rgba(255,107,154,.35)"; ctx.fillRect(X(pos.x1) - devicePixelRatio / 2, 0, devicePixelRatio, h); }
  }

  /* ============================== PANEL ============================== */
  /*  opciones: { contenedor, rep, perfil, crearDestino(pista) → destino, multipista, escribiendo(e) } */
  async function crearPanel(op) {
    const { contenedor, rep, perfil } = op;
    contenedor.classList.remove("oculto");
    contenedor.innerHTML = `<div class="fila" style="justify-content:space-between"><h3 style="margin:0">🎼 Pistas MIDI</h3><span class="muted small">Cargando pistas…</span></div>`;
    let pistas = await pistasDeLaObra();
    const porPerfil = (P.midi && P.midi.porPerfil) || {};
    const COLORES = ["#ff6b9a", "#7c9cff", "#ffd166", "#06d6a0", "#ef476f", "#a78bfa", "#4cc9f0", "#f4a261"];
    const colorCapa = (capa, i) => op.multipista ? COLORES[pistas.indexOf(capa.pista) % COLORES.length] || COLORES[i % COLORES.length] : getComputedStyle(document.documentElement).getPropertyValue("--accent2").trim() || "#7c9cff";

    contenedor.innerHTML = "";
    const cab = el(`<div class="fila" style="justify-content:space-between">
      <div><h3 style="margin:0">🎼 Pistas MIDI</h3>
      <div class="muted small">${op.multipista ? "Todas las pistas del arreglo, cada una con su sonido." : "Toca una pista del arreglo con tu instrumento: tus controles (filtro, distorsión, fuzz…) también la afectan."}</div></div>
      <span class="badge" data-r="estado">MIDI detenido</span></div>`);
    contenedor.appendChild(cab);
    const estadoEl = cab.querySelector("[data-r=estado]");

    // --- Pista(s) ---
    const filaPista = el(`<div class="fila midi-fila"></div>`);
    const selPista = el(`<select aria-label="Pista MIDI"></select>`);
    const selRitmo = el(`<select aria-label="Ritmo de otra pista" title="Cruce: usa el ritmo de otra pista con las notas de la tuya"></select>`);
    const capasBox = el(`<div class="midi-capas"></div>`);
    function opcionesPistas() {
      selPista.innerHTML = pistas.map((p, i) => `<option value="${i}">${esc(p.nombre)}${p.bateria ? " 🥁" : ""}</option>`).join("");
      selRitmo.innerHTML = `<option value="">— su propio ritmo —</option>` + pistas.map((p, i) => `<option value="${i}">ritmo de: ${esc(p.nombre)}</option>`).join("");
      selRitmo.value = rep.cfg.ritmoDe ? String(pistas.indexOf(rep.cfg.ritmoDe)) : "";
    }
    let capaUnica = null;
    function ponerPista(i) {
      const p = pistas[i]; if (!p) return;
      if (!capaUnica) { capaUnica = { id: "c0", pista: p, destino: op.crearDestino(p), vol: 1 }; rep.capas = [capaUnica]; }
      else { capaUnica.pista = p; capaUnica.ptr = null; }
      selPista.value = String(i); G.guardar("midi:pista:" + perfil.id, p.id);
    }
    function dibujarCapas() {
      capasBox.innerHTML = "";
      rep.capas.forEach((capa, i) => {
        const fila = el(`<div class="midi-capa"><span class="punto-color" style="background:${colorCapa(capa, i)}"></span><strong>${esc(capa.pista.nombre)}</strong></div>`);
        const mute = el(`<button class="btn peq" title="Silenciar">M</button>`), solo = el(`<button class="btn peq" title="Solo">S</button>`);
        const vol = el(`<input type="range" min="0" max="1.5" step="0.01" value="${capa.vol}" aria-label="Volumen de ${esc(capa.pista.nombre)}">`);
        const pulsa = el(`<button class="btn peq" title="Tocar esta pista con PULSAR">✋</button>`);
        const pintar = () => { mute.classList.toggle("on", !!capa.mute); solo.classList.toggle("on", !!capa.solo); pulsa.classList.toggle("on", !!capa.pulsa); };
        mute.onclick = () => { capa.mute = !capa.mute; pintar(); };
        solo.onclick = () => { capa.solo = !capa.solo; pintar(); };
        pulsa.onclick = () => { capa.pulsa = !capa.pulsa; pintar(); };
        vol.oninput = () => { capa.vol = +vol.value; };
        fila.append(mute, solo, pulsa, vol); pintar(); capasBox.appendChild(fila);
      });
    }
    if (op.multipista) {
      rep.capas = pistas.map((p, i) => ({ id: "c" + i, pista: p, destino: op.crearDestino(p), vol: 1, canal: i, pulsa: !p.bateria && i === 0 }));
      filaPista.append(el(`<span class="muted small">Cruce:</span>`), selRitmo);
      opcionesPistas();
      contenedor.append(capasBox, filaPista);
      dibujarCapas();
    } else {
      opcionesPistas();
      const guardada = G.leer("midi:pista:" + perfil.id, porPerfil[perfil.id]);
      const i0 = Math.max(0, pistas.findIndex(p => p.id === guardada));
      ponerPista(i0);
      selPista.onchange = () => { ponerPista(+selPista.value); selPista.blur(); };
      filaPista.append(el(`<span class="muted small">Pista:</span>`), selPista, el(`<span class="muted small">Cruce:</span>`), selRitmo);
      contenedor.append(filaPista);
    }
    selRitmo.onchange = () => { rep.cfg.ritmoDe = selRitmo.value === "" ? null : pistas[+selRitmo.value]; selRitmo.blur(); };

    // --- Transporte y modo ---
    const filaT = el(`<div class="fila midi-fila"></div>`);
    const play = el(`<button class="btn primario">▶ Reproducir MIDI <kbd>M</kbd></button>`);
    const pulsarBtn = el(`<button class="btn midi-pulsar" title="Mantén apretado o toca con el ritmo que quieras">✋ PULSAR <kbd>N</kbd></button>`);
    const sinc = el(`<button class="btn peq" title="Vuelve a alinear la pista con el reloj de la obra">⟲ Sincronizar</button>`);
    const modos = [["seguir", "Seguir la obra"], ["pulsar", "Pulsar en orden"], ["ahora", "Pulsar lo que suena"]];
    const segModo = el(`<div class="segmentado" role="group" aria-label="Modo"></div>`);
    const btnModo = modos.map(([id, n]) => { const b = el(`<button class="btn peq">${n}</button>`); b.onclick = () => ponerModo(id); segModo.appendChild(b); return b; });
    filaT.append(play, pulsarBtn, segModo, sinc);
    contenedor.appendChild(filaT);
    function ponerModo(id) {
      rep.cfg.modo = id; btnModo.forEach((b, i) => b.classList.toggle("on", modos[i][0] === id));
      if (id !== "seguir" && rep.activo) rep.detener();
      play.classList.toggle("oculto", id !== "seguir"); pulsarBtn.classList.toggle("oculto", id === "seguir");
      G.guardar("midi:modo:" + perfil.id, id);
    }
    play.onclick = () => rep.alternar();
    sinc.onclick = () => { rep.sincronizar(); rep.capas.forEach(c => c.ptr = null); };
    const pulsarAhora = () => {
      if (op.multipista) { const todas = rep.capas; const elegidas = todas.filter(c => c.pulsa); rep.capas = elegidas.length ? elegidas : todas; rep.pulsar(); rep.capas = todas; }
      else rep.pulsar();
      pulsarBtn.classList.add("golpe"); setTimeout(() => pulsarBtn.classList.remove("golpe"), 90);
      op.alPulsar && op.alPulsar();
    };
    pulsarBtn.addEventListener("pointerdown", e => { e.preventDefault(); pulsarAhora(); });

    // --- Rollo ---
    const rollo = el(`<canvas class="midi-rollo" title="Pista MIDI: el cabezal rosado es lo que suena"></canvas>`);
    contenedor.appendChild(rollo);

    // --- Transformaciones en el tiempo ---
    const filaB = el(`<div class="fila midi-fila"><span class="muted small">Bucle <kbd>C</kbd>:</span></div>`);
    const largos = [[0, "No"], [0.25, "¼"], [0.5, "½"], [1, "1"], [2, "2"], [4, "4"]];
    const segB = el(`<div class="segmentado"></div>`);
    const btnB = largos.map(([v, n]) => { const b = el(`<button class="btn peq">${n}</button>`); b.onclick = () => { rep.ponerBucle(v); if (v) ultimoBucle = v; pintarB(); }; segB.appendChild(b); return b; });
    let ultimoBucle = 1;
    const pintarB = () => btnB.forEach((b, i) => b.classList.toggle("on", largos[i][0] === rep.cfg.bucle));
    filaB.append(segB, el(`<span class="muted small">compases · Velocidad:</span>`));
    const vels = [[0.5, "½"], [1, "×1"], [2, "×2"]];
    const segV = el(`<div class="segmentado"></div>`);
    const btnV = vels.map(([v, n]) => { const b = el(`<button class="btn peq">${n}</button>`); b.onclick = () => { rep.ponerVel(v); pintarV(); }; segV.appendChild(b); return b; });
    const pintarV = () => btnV.forEach((b, i) => b.classList.toggle("on", vels[i][0] === rep.cfg.vel));
    filaB.appendChild(segV);
    contenedor.appendChild(filaB);

    const filaX = el(`<div class="fila midi-fila"></div>`);
    const toggle = (txt, titulo, get, set) => { const b = el(`<button class="btn peq" title="${esc(titulo)}">${txt}</button>`); const pintar = () => b.classList.toggle("on", !!get()); b.onclick = () => { set(); pintar(); }; pintar(); b.pintar = pintar; return b; };
    const bRev = toggle("⇄ Reverso <kbd>I</kbd>", "Lee cada compás (o el bucle) de atrás hacia adelante", () => rep.cfg.reverso, () => { rep.cfg.reverso = !rep.cfg.reverso; });
    const bEsp = toggle("◐ Espejo", "Invierte la melodía (lo que sube, baja) sin salir de Re♭ mayor", () => rep.cfg.espejo, () => { rep.cfg.espejo = !rep.cfg.espejo; });
    const bAju = toggle("🎯 Ajustar al acorde", "Lleva cada nota a la nota más cercana del acorde actual de la partitura", () => rep.cfg.ajustar, () => { rep.cfg.ajustar = !rep.cfg.ajustar; });
    const arps = ["Arpegio: no", "Arpegio ↑", "Arpegio ↓"];
    const bArp = el(`<button class="btn peq" title="Separa los acordes en semicorcheas">${arps[0]}</button>`);
    bArp.onclick = () => { rep.cfg.arpegio = rep.cfg.arpegio === 0 ? 1 : rep.cfg.arpegio === 1 ? -1 : 0; bArp.textContent = arps[rep.cfg.arpegio === 0 ? 0 : rep.cfg.arpegio === 1 ? 1 : 2]; bArp.classList.toggle("on", rep.cfg.arpegio !== 0); };
    filaX.append(bRev, bEsp, bArp, bAju);
    contenedor.appendChild(filaX);

    // --- Sliders ---
    const sl = (label, clave, min, max, paso, fmt = v => v) => {
      const l = el(`<label>${label} <span class="midi-val"></span><input type="range" min="${min}" max="${max}" step="${paso}" value="${rep.cfg[clave]}"></label>`);
      const val = l.querySelector(".midi-val"), inp = l.querySelector("input");
      const pintar = () => { val.textContent = fmt(rep.cfg[clave]); };
      inp.addEventListener("input", () => { rep.cfg[clave] = +inp.value; pintar(); }); pintar(); return l;
    };
    const sliders = el(`<div class="sliders"></div>`);
    sliders.append(
      sl("Transponer", "transp", -24, 24, 1, v => (v > 0 ? "+" : "") + v + " st"),
      sl("Densidad", "densidad", 0, 1, 0.01, v => Math.round(v * 100) + " %"),
      sl("Eco", "eco", 0, 1, 0.25, v => Math.round(v * 4) + " rep."),
      sl("Desfase", "desfase", 0, 0.5, 0.01, v => Math.round(v * 1000) + " ms"),
      sl("Humanizar", "humano", 0, 1, 0.01, v => Math.round(v * 100) + " %"),
      sl("Volumen MIDI", "volumen", 0, 1.5, 0.01, v => Math.round(v * 100) + " %"));
    contenedor.appendChild(sliders);

    // --- Extras: archivo propio y salida MIDI ---
    const extra = el(`<details class="cargar-box"><summary>📂 Cargar un .mid propio · salida MIDI externa</summary>
      <div class="cargar" style="margin-top:8px">
        <div class="fila"><input type="file" accept=".mid,.midi,audio/midi"><span class="estado-sonido" data-r="arch"></span></div>
        <p class="muted small" style="margin:0">Cada pista del archivo aparece en la lista. Conviene que esté a ${P.bpm} BPM y empiece en 0:00 para que calce con la obra.</p>
        <div class="fila"><span class="muted small">Enviar a puerto MIDI:</span><select data-r="salida"><option value="">— ninguno —</option></select>
          <label class="fila small muted" style="gap:4px"><input type="checkbox" data-r="soloExt"> solo externo (silencia el navegador)</label></div>
        <p class="muted small" style="margin:0">Sirve para tocar con Pure Data, un DAW o un sintetizador (en Windows: loopMIDI). La batería sale por el canal 10.</p>
      </div></details>`);
    contenedor.appendChild(extra);
    const inpArch = extra.querySelector("input[type=file]"), estArch = extra.querySelector("[data-r=arch]");
    inpArch.onchange = async () => {
      const f = inpArch.files[0]; if (!f) return;
      try {
        const nuevas = await pistasDeArchivo(f);
        if (!nuevas.length) throw new Error("sin notas");
        pistas = pistas.concat(nuevas);
        if (op.multipista) { nuevas.forEach((p, i) => rep.capas.push({ id: "c" + rep.capas.length, pista: p, destino: op.crearDestino(p), vol: 1, canal: rep.capas.length })); dibujarCapas(); }
        opcionesPistas();
        if (!op.multipista) ponerPista(pistas.length - nuevas.length);
        estArch.textContent = `${nuevas.length} pista(s) de ${f.name}`;
      } catch (e) { estArch.textContent = "No se pudo leer: " + e.message; }
    };
    const selSalida = extra.querySelector("[data-r=salida]"), chkSolo = extra.querySelector("[data-r=soloExt]");
    let accesoMIDI = null;
    if (navigator.requestMIDIAccess) {
      extra.addEventListener("toggle", () => {
        if (!extra.open || accesoMIDI) return;
        navigator.requestMIDIAccess().then(acc => {
          accesoMIDI = acc;
          const llenar = () => { const v = selSalida.value; selSalida.innerHTML = `<option value="">— ninguno —</option>` + [...acc.outputs.values()].map(o => `<option value="${esc(o.id)}">${esc(o.name)}</option>`).join(""); selSalida.value = v; };
          llenar(); acc.onstatechange = llenar;
        }).catch(() => { selSalida.innerHTML = `<option value="">(sin permiso MIDI)</option>`; });
      });
    } else selSalida.innerHTML = `<option value="">(este navegador no tiene Web MIDI)</option>`;
    selSalida.onchange = () => { rep.salida = accesoMIDI && selSalida.value ? accesoMIDI.outputs.get(selSalida.value) : null; };
    chkSolo.onchange = () => { rep.cfg.soloExterna = chkSolo.checked; };

    // --- Estado ---
    rep.alCambiar = () => {
      play.innerHTML = rep.activo ? "■ Detener MIDI <kbd>M</kbd>" : "▶ Reproducir MIDI <kbd>M</kbd>";
      play.classList.toggle("on", rep.activo);
      pintarB(); pintarV();
    };
    rep.alCambiar();
    ponerModo(G.leer("midi:modo:" + perfil.id, "seguir"));

    // --- Teclado ---
    document.addEventListener("keydown", e => {
      if (op.escribiendo(e) || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "m") { if (rep.cfg.modo === "seguir") rep.alternar(); else ponerModo("seguir"); }
      else if (k === "n") { if (rep.cfg.modo === "seguir") ponerModo("pulsar"); pulsarAhora(); }
      else if (k === "c") { rep.ponerBucle(rep.cfg.bucle ? 0 : ultimoBucle); pintarB(); }
      else if (k === "i") { rep.cfg.reverso = !rep.cfg.reverso; bRev.pintar(); }
    });

    // --- Animación ---
    (function cuadro() {
      dibujarRollo(rollo, rep, colorCapa);
      const pos = rep.posicion();
      const partes = [];
      if (rep.activo) partes.push(rep.libre ? "MIDI libre" : "MIDI con la obra");
      else partes.push(rep.cfg.modo === "seguir" ? "MIDI detenido" : "Modo pulsar");
      partes.push(G.fmt(Math.max(0, pos.x)));
      if (rep.cfg.vel !== 1) partes.push("×" + rep.cfg.vel);
      if (rep.cfg.bucle) partes.push("bucle " + largos.find(l => l[0] === rep.cfg.bucle)[1]);
      if (rep.cfg.reverso) partes.push("reverso");
      estadoEl.textContent = partes.join(" · ");
      estadoEl.classList.toggle("vivo", rep.activo);
      requestAnimationFrame(cuadro);
    })();
    return { rep, pistas: () => pistas };
  }

  /* ============================== PRACTICAR CON LA ORQUESTA ============================== */
  /* Los demás perfiles suenan con su pista MIDI (midi.porPerfil), sincronizados con el reloj.
     "Según la partitura": cada instrumento solo suena en las secciones donde le toca (tocan). */
  function destinoDe(pf, pista) {
    const A = window.Audio2;
    if (pista.bateria) { const b = new A.Bateria(); return { esBateria: true, nota: (m, v, t, d, golpe) => b.tocar(golpe || padDeNota(m), t, v) }; }
    if (pf.tipo === "guitarra") {
      const g = new A.Guitarra(); g.p.fuzz = 0.3; g.aplicar();
      return { octava: () => 3, nota: (m, v, t, d) => g.tocarNotas([m], { vel: v, t, dur: d }),
        grupo: (l, t) => g.tocarNotas(l.map(n => n.m), { vel: Math.max(...l.map(n => n.v)), t, dur: Math.max(...l.map(n => n.d)) }) };
    }
    const k = new A.Teclado(pf.tipo === "ambiente" ? "pad" : pf.preset || pista.preset || "epiano");
    if (pf.tipo === "ambiente") { k.p.reverb = 0.7; k.p.filtro = 0.35; k.aplicar(); }
    return { octava: () => k.p.octava, nota: (m, v, t, d) => k.nota(m, v, t, d) };
  }
  async function crearAcompanamiento({ contenedor, perfil, reloj, motor }) {
    const pistas = await pistasDeLaObra();
    const porPerfil = (P.midi && P.midi.porPerfil) || {};
    const rep = new Reproductor({ reloj, motor });
    rep.cfg.volumen = G.leer("orq:vol", 0.8);
    const guardado = G.leer("orq:" + perfil.id, null);   // { id: { on, vol } }
    // Una fila por intérprete de la orquesta (tú incluido, apagado: sirve de referencia)
    const filas = G.perfilesActivos.filter(pf => pf.tipo !== "multipista" && porPerfil[pf.id]).map(pf => {
      const pista = pistas.find(x => x.id === porPerfil[pf.id]);
      if (!pista) return null;
      const propio = pf.id === perfil.id;
      const g = guardado && guardado[pf.id];
      return { pf, pista, propio, capa: { id: "o-" + pf.id, pista, destino: null, vol: g ? g.vol : 1, mute: g ? !g.on : (propio || !!pf.opcional), canal: 0 } };
    }).filter(Boolean);
    let segunPartitura = G.leer("orq:partitura", true);
    const enObra = r => Math.min(Math.max(r, 0), DURACION - 0.01);
    filas.forEach(f => {
      f.capa.activa = r => !segunPartitura || G.toca(G.seccionEn(enObra(r)), f.pf);
      // Las notas se cortan cuando a ese instrumento le toca callar
      f.capa.limite = r => { if (!segunPartitura) return Infinity; const c = G.proximoCambio(enObra(r), f.pf); return c ? c.seccion.ini - r : Infinity; };
    });
    rep.capas = filas.map(f => f.capa);
    let encendida = false, creados = false;
    const guardar = () => { const o = {}; filas.forEach(f => o[f.pf.id] = { on: !f.capa.mute, vol: f.capa.vol }); G.guardar("orq:" + perfil.id, o); };

    contenedor.classList.remove("oculto");
    contenedor.innerHTML = "";
    const cab = el(`<div class="fila" style="justify-content:space-between;align-items:flex-start">
      <div><h3 style="margin:0">🎧 Practicar con la orquesta</h3>
      <div class="muted small">El resto de los instrumentos suena con sus pistas MIDI, al ritmo del reloj de la obra. Tú tocas tu parte encima.</div></div></div>`);
    const btn = el(`<button class="btn primario">🎧 Activar la orquesta</button>`);
    cab.appendChild(btn); contenedor.appendChild(cab);
    const aviso = el(`<div class="muted small orq-aviso"></div>`); contenedor.appendChild(aviso);

    const opciones = el(`<div class="fila midi-fila"></div>`);
    const segM = el(`<div class="segmentado"></div>`);
    const bPart = el(`<button class="btn peq" title="Cada instrumento entra y calla como dice la partitura">Según la partitura</button>`);
    const bTodo = el(`<button class="btn peq" title="Todas las pistas suenan siempre que tengan notas">Todo el arreglo</button>`);
    segM.append(bPart, bTodo);
    const rapidos = [["Todos", f => !f.propio], ["Base: batería + bajos", f => !f.propio && (f.pf.tipo === "bateria" || f.pf.sub === "teclados-bajos" || f.pf.sub === "ambiente-principal")], ["Ninguno", () => false]]
      .map(([n, fn]) => { const b = el(`<button class="btn peq">${esc(n)}</button>`); b.onclick = () => { filas.forEach(f => f.capa.mute = !fn(f)); pintar(); guardar(); }; return b; });
    const volL = el(`<label class="orq-vol muted small">Volumen orquesta <input type="range" min="0" max="1.5" step="0.01" value="${rep.cfg.volumen}"></label>`);
    volL.querySelector("input").oninput = e => { rep.cfg.volumen = +e.target.value; G.guardar("orq:vol", rep.cfg.volumen); };
    opciones.append(segM, ...rapidos, volL);
    contenedor.appendChild(opciones);
    bPart.onclick = () => { segunPartitura = true; G.guardar("orq:partitura", true); pintar(); };
    bTodo.onclick = () => { segunPartitura = false; G.guardar("orq:partitura", false); pintar(); };

    const lista = el(`<div class="orq-lista"></div>`);
    filas.forEach(f => {
      const fila = el(`<label class="orq-fila${f.pf.opcional ? " opcional" : ""}"><input type="checkbox"><span class="orq-icono">${f.pf.icono}</span>
        <span class="orq-nombre"><strong>${esc(f.pf.nombre)}</strong><span class="muted small">${f.propio ? "tu parte · como referencia" : esc(f.pista.nombre)}</span></span>
        <span class="orq-estado"></span><input type="range" min="0" max="1.5" step="0.01" value="${f.capa.vol}" aria-label="Volumen de ${esc(f.pf.nombre)}"></label>`);
      const [chk, vol] = fila.querySelectorAll("input");
      chk.onchange = () => { f.capa.mute = !chk.checked; pintar(); guardar(); };
      vol.oninput = () => { f.capa.vol = +vol.value; guardar(); };
      f.el = fila; f.chk = chk; f.estado = fila.querySelector(".orq-estado");
      lista.appendChild(fila);
    });
    contenedor.appendChild(lista);

    function pintar() {
      btn.innerHTML = encendida ? "■ Apagar la orquesta" : "🎧 Activar la orquesta";
      btn.classList.toggle("on", encendida);
      bPart.classList.toggle("on", segunPartitura); bTodo.classList.toggle("on", !segunPartitura);
      filas.forEach(f => { f.chk.checked = !f.capa.mute; f.el.classList.toggle("apagada", f.capa.mute); });
    }
    btn.onclick = () => {
      encendida = !encendida;
      if (encendida && !creados) { filas.forEach(f => f.capa.destino = destinoDe(f.pf, f.pista)); creados = true; }
      if (!encendida) rep.detener();
      pintar();
    };
    pintar();

    // Arranca y para junto con el reloj de la obra; muestra quién toca en la sección actual
    setInterval(() => {
      const c = reloj();
      if (encendida && c.corriendo && !rep.activo && c.t < DURACION) rep.iniciar();
      const t = Math.min(Math.max(c.t, 0), DURACION - 0.01), sec = G.seccionEn(t);
      filas.forEach(f => {
        const toca = !segunPartitura || G.toca(sec, f.pf);
        // Al entrar a una sección donde toca, suenan las notas largas que ya venían sonando
        if (toca && f.tocaba === false && rep.activo && c.corriendo) rep.perseguir(f.capa, c.t, sec.ini);
        f.tocaba = toca;
        f.estado.textContent = f.capa.mute ? "—" : toca ? "▶ toca" : "⏸ calla";
        f.estado.className = "orq-estado " + (f.capa.mute ? "" : toca ? "si" : "no");
        f.el.classList.toggle("sonando", encendida && rep.activo && !f.capa.mute && toca);
      });
      aviso.textContent = !encendida ? "Actívala y luego parte con ▶ Iniciar ahora (o elige una sección en «Ir a sección…»)."
        : c.corriendo ? (c.t < 0 ? "La orquesta entra cuando parta el reloj." : `Sonando con la orquesta · ${sec.nombre}`)
        : "Lista. Presiona ▶ Iniciar ahora para tocar con la orquesta.";
    }, 150);
    return { rep };
  }

  window.MIDI = { crearAcompanamiento, leerMIDI, preparar, pistasDeLaObra, pistasDeArchivo, Reproductor, crearPanel, padDeNota, espejo, ajustarA };
})();
