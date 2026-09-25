/* Utilidades compartidas: perfiles, tiempos, acordes y línea de tiempo. */
(function () {
  const P = window.PARTITURA;

  // ---------- Perfiles ----------
  const PERFILES = [
    { id: "guitarra", grupo: "guitarra", tipo: "guitarra", nombre: "Guitarra", icono: "🎸",
      desc: "Guitarra con fuzz y reverb. Rasguea los acordes de la sección." },
    { id: "bateria", grupo: "bateria", tipo: "bateria", nombre: "Batería", icono: "🥁",
      desc: "Pads y patrones automáticos sincronizados al tempo." },
    { id: "teclado-1", grupo: "teclados", tipo: "teclado", preset: "pad", nombre: "Teclado 1 · Pad", icono: "🎹",
      desc: "Colchón de sintetizador ancho y lento." },
    { id: "teclado-2", grupo: "teclados", tipo: "teclado", preset: "epiano", nombre: "Teclado 2 · Campanas", icono: "🎹",
      desc: "Piano eléctrico brillante, notas cortas." },
    { id: "teclado-3", grupo: "teclados", tipo: "teclado", preset: "bajo", nombre: "Teclado 3 · Bajo", icono: "🎹",
      desc: "Bajo sintetizado con sub-octava." },
    { id: "teclado-4", grupo: "teclados", tipo: "teclado", preset: "lead", nombre: "Teclado 4 · Lead", icono: "🎹",
      desc: "Melodía con vibrato y glide." },
    { id: "ambiente-1", grupo: "ambiente", tipo: "ambiente", preset: "viento", nombre: "Ambiente 1 · Ruido", icono: "🌫️",
      desc: "Ruido filtrado que respira. Controla colores." },
    { id: "ambiente-2", grupo: "ambiente", tipo: "ambiente", preset: "drone", nombre: "Ambiente 2 · Drone", icono: "🌊",
      desc: "Drone que sigue la raíz del acorde. Controla colores." },
    { id: "ambiente-3", grupo: "ambiente", tipo: "ambiente", preset: "brillo", nombre: "Ambiente 3 · Brillo", icono: "✨",
      desc: "Destellos agudos de las notas del acorde. Controla colores." },
    { id: "ambiente-4", grupo: "ambiente", tipo: "ambiente", preset: "pulso", nombre: "Ambiente 4 · Pulso", icono: "💠",
      desc: "Arpegio lento con eco que sigue la progresión. Controla colores." },
  ];
  const nTeclados = Math.min(4, Math.max(2, P.teclados || 4));
  const perfilesActivos = PERFILES.filter(p => !(p.grupo === "teclados" && +p.id.split("-")[1] > nTeclados));

  // ---------- Tiempos ----------
  function aSeg(t) {
    if (typeof t === "number") return t;
    const partes = String(t).trim().split(":").map(Number);
    return partes.reduce((acc, v) => acc * 60 + v, 0);
  }
  function fmt(s) {
    s = Math.max(0, Math.floor(s));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  const DURACION = aSeg(P.duracion);
  const SECCIONES = P.secciones.map((s, i) => {
    const ini = aSeg(s.inicio);
    const fin = i + 1 < P.secciones.length ? aSeg(P.secciones[i + 1].inicio) : DURACION;
    return Object.assign({}, s, { idx: i, ini, fin, cpa: s.compasesPorAcorde || P.compasesPorAcorde || 1 });
  });
  const EVENTOS = (P.eventos || []).map(e => Object.assign({}, e, { seg: aSeg(e.t) })).sort((a, b) => a.seg - b.seg);
  const SEG_POR_COMPAS = (60 / P.bpm) * (P.compas || 4);

  function seccionEn(t) {
    for (let i = SECCIONES.length - 1; i >= 0; i--) if (t >= SECCIONES[i].ini) return SECCIONES[i];
    return SECCIONES[0];
  }
  function acordeEn(t) {
    const s = seccionEn(t);
    const dur = SEG_POR_COMPAS * s.cpa;
    const k = Math.floor(Math.max(0, t - s.ini) / dur);
    const i = k % s.acordes.length;
    const inicioAcorde = s.ini + k * dur;
    let siguiente;
    const tSig = inicioAcorde + dur;
    if (tSig >= s.fin) { const sn = SECCIONES[s.idx + 1]; siguiente = sn ? sn.acordes[0] : null; }
    else siguiente = s.acordes[(i + 1) % s.acordes.length];
    return { seccion: s, idx: i, nombre: s.acordes[i], siguiente, falta: tSig - t, color: s.colores[i % s.colores.length] };
  }

  function instrucciones(sec, perfil) {
    const ins = sec.instrucciones || {};
    const out = [];
    if (ins.todos) out.push({ quien: "Todos", texto: ins.todos });
    if (perfil.grupo !== perfil.id && ins[perfil.grupo]) out.push({ quien: nombreGrupo(perfil.grupo), texto: ins[perfil.grupo] });
    if (ins[perfil.id]) out.push({ quien: perfil.nombre, texto: ins[perfil.id], propio: true });
    return out;
  }
  function nombreGrupo(g) { return { teclados: "Teclados", ambiente: "Ambientes", guitarra: "Guitarra", bateria: "Batería" }[g] || g; }
  function eventoAplica(e, perfil) {
    const ps = e.perfiles || ["todos"];
    return ps.includes("todos") || ps.includes(perfil.id) || ps.includes(perfil.grupo);
  }

  // ---------- Acordes ----------
  const NOTAS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const CALIDADES = [
    ["maj7", [0, 4, 7, 11]], ["m7", [0, 3, 7, 10]], ["mmaj7", [0, 3, 7, 11]], ["m9", [0, 3, 7, 10, 14]],
    ["maj9", [0, 4, 7, 11, 14]], ["add9", [0, 4, 7, 14]], ["madd9", [0, 3, 7, 14]], ["sus2", [0, 2, 7]], ["sus4", [0, 5, 7]],
    ["dim", [0, 3, 6]], ["aug", [0, 4, 8]], ["m6", [0, 3, 7, 9]], ["6", [0, 4, 7, 9]], ["9", [0, 4, 7, 10, 14]],
    ["7", [0, 4, 7, 10]], ["5", [0, 7]], ["m", [0, 3, 7]], ["", [0, 4, 7]],
  ];
  function nota(str) {
    const m = /^([A-G])([#b]?)/.exec(str);
    if (!m) return null;
    return (NOTAS[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + 12) % 12;
  }
  function parseAcorde(nombre) {
    if (!nombre) return null;
    const [base, bajoStr] = nombre.split("/");
    const m = /^([A-G][#b]?)(.*)$/.exec(base.trim());
    if (!m) return null;
    const raiz = nota(m[1]);
    const resto = m[2];
    let intervalos = [0, 4, 7];
    for (const [q, iv] of CALIDADES) if (resto === q) { intervalos = iv; break; }
    if (!CALIDADES.some(([q]) => q === resto)) {
      for (const [q, iv] of CALIDADES) if (q && resto.startsWith(q)) { intervalos = iv; break; }
    }
    const bajo = bajoStr ? nota(bajoStr.trim()) : raiz;
    return { raiz, bajo, intervalos };
  }
  // Notas MIDI del acorde alrededor de una octava base
  function notasAcorde(nombre, octava = 4) {
    const a = parseAcorde(nombre);
    if (!a) return [];
    const base = 12 * (octava + 1) + a.raiz;
    return a.intervalos.map(i => base + i);
  }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  const NOMBRES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  function nombreNota(m) { return NOMBRES[m % 12] + (Math.floor(m / 12) - 1); }

  // ---------- Almacenamiento local (seguro) ----------
  const guardar = (k, v) => { try { localStorage.setItem("genesis:" + k, JSON.stringify(v)); } catch (e) {} };
  const leer = (k, d) => { try { const v = localStorage.getItem("genesis:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };

  window.G = {
    P, PERFILES, perfilesActivos, aSeg, fmt, DURACION, SECCIONES, EVENTOS, SEG_POR_COMPAS,
    seccionEn, acordeEn, instrucciones, eventoAplica, nombreGrupo,
    parseAcorde, notasAcorde, mtof, nombreNota, guardar, leer,
  };
})();
