/* Genesis · versión 3: la obra sin guitarra ni batería.
   La partitura (js/partitura.js) la comparten las versiones 1, 2 y 3, y la versión 1 todavía tiene guitarra y batería.
   Este archivo se carga justo después de la partitura, solo en la versión 3, y la adapta:
   · nombres de sección sin batería, platillos ni guitarra (la melodía la toca el Teclado líder)
   · instrucciones y avisos sin la batería, y textos que ya no hablan de guitarra, batería ni platillos */
(function () {
  const P = window.PARTITURA;
  if (!P) return;
  // NIVEL DE REFERENCIA POR ROL (dB), el mismo en la página y en la app. Se ajusta en el ensayo con el sistema de sonido
  // de la sala: 0 = como suena ahora; +3 ≈ un poco más fuerte; −3 ≈ un poco más suave; −6 ≈ la mitad.
  // Vale para cada laptop que toca ese rol y para la orquesta de ensayo. ("guitarra" es el id interno del Teclado líder.)
  P.niveles = {
    "teclado-1": 0,
    "teclado-2": 0,
    "teclado-3": -5,    // el bajo: sonaba ~14 dB sobre el resto y era lo que saturaba la mezcla y los parlantes
    "teclado-4": 0,
    "guitarra": 0,      // Teclado líder
    "ambiente-1": 0,    // Ambiente
    "ambiente-3": 0,    // Ambiente brillo
  };
  // Volumen general con que parte cada laptop al activar el sonido (0 a 1). El volumen del computador va aparte: fijarlo igual en todas.
  P.volumenGeneral = 0.8;
  const NOMBRES = {
    "Intro · Ritmo batería": "Intro · Drone en Re♭",
    "Intro · Guitarra y teclados": "Intro · Melodía y teclados",
    "Intro · Platillos y distorsión": "Intro · Distorsión",
    "Desarrollo · Sin platillos": "Desarrollo · Notas largas",
    "Desarrollo · Platillos": "Desarrollo · Crece",
    "Desarrollo 2 · Platillos": "Desarrollo 2 · Decrece",
    "Desarrollo 2 · Sin platillos": "Desarrollo 2 · Notas largas",
    "Intro 2 · Platillos y distorsión": "Intro 2 · Distorsión",
    "Intro 2 · Guitarra y teclados": "Intro 2 · Melodía y teclados",
    "Desenlace · Sin batería": "Desenlace · Suave",
  };
  // Textos que nombran la guitarra, la batería o los platillos → su versión sin ellos
  const TEXTOS = [
    [/Entran guitarra y teclados\./g, "Entran la melodía y los teclados."],
    [/entran guitarra y teclados/g, "entran la melodía y los teclados"],
    [/Entran los platillos y la distorsión en los teclados medios\./g, "Entra la distorsión en los teclados medios."],
    [/platillos y distorsión/g, "distorsión"],
    [/Desarrollo: la batería quita los platillos\. El /g, "Desarrollo: el "],
    [/^Sin platillos\. /g, ""],
    [/ ?Destellos con la batería\./g, ""],
    [/,? ?la batería\b[^.]*\./gi, "."],
  ];
  const limpiar = t => TEXTOS.reduce((s, [re, por]) => s.replace(re, por), String(t)).replace(/\.\./g, ".").trim();
  P.secciones.forEach(s => {
    if (NOMBRES[s.nombre]) s.nombre = NOMBRES[s.nombre];
    if (s.tocan) s.tocan = s.tocan.filter(id => id !== "bateria");
    if (s.instrucciones) {
      delete s.instrucciones.bateria;
      for (const k in s.instrucciones) s.instrucciones[k] = limpiar(s.instrucciones[k]);
    }
  });
  if (P.eventos) P.eventos = P.eventos
    .map(e => Object.assign({}, e, { perfiles: (e.perfiles || []).filter(p => p !== "bateria"), texto: limpiar(e.texto) }))
    .filter(e => e.perfiles.length && e.texto);
})();
