/* ==========================================================================
   PARTITURA — Cover de Genesis (Robin Callaway)
   Orquesta de Laptops UC + guitarra · propuesta de Felipe Osorio
   --------------------------------------------------------------------------
   ESTE ES EL ÚNICO ARCHIVO QUE NECESITAS EDITAR PARA ADAPTAR LA OBRA.

   · Estructura formal: la de la propuesta (Intro / Desarrollo / Outro).
   · Tempo y acordes: medidos en la grabación oficial. 130 BPM, 4/4,
     Re♭ mayor / Si♭ menor, progresión B♭m7 ↔ G♭maj7. Los tiempos de la
     propuesta están ajustados al inicio de compás más cercano (± 1 s).

   Tiempos: "m:ss" o "m:ss.s".  Acordes: Bbm7, Gbmaj7, Db, F#m, C5, Cadd9…
   tocan: quién toca en la sección. Claves posibles:
     todos · guitarra · bateria · teclados · teclados-altos (1 y 2) ·
     teclados-bajos (3 y 4) · teclado-1..4 · ambiente · ambiente-principal ·
     ambiente-extra · ambiente-1..4
   Las mismas claves sirven para "instrucciones" y "eventos".
   ========================================================================== */

// Patrón de dos compases por acorde que empieza en la 2.ª mitad de un bloque de G♭
const DOS_COMPASES = ["Gbmaj7", "Bbm7", "Bbm7", "Gbmaj7", "Gbmaj7", "Bbm7", "Bbm7", "Gbmaj7"];

window.PARTITURA = {
  titulo: "Cover de Genesis",
  artista: "Robin Callaway",
  album: "i saw an angel in the mirror (2024)",
  formato: "Orquesta de laptops + guitarra",
  duracion: "2:55",
  bpm: 130,
  compas: 4,
  compasesPorAcorde: 1,

  // Perfiles que no se muestran en el hub (por ejemplo, si no hay intérpretes extra):
  // ocultar: ["ambiente-3", "ambiente-4"],
  ocultar: [],

  nota:
    "En el álbum, Genesis funciona como la reconstrucción lenta posterior al colapso sonoro de “dote”: " +
    "el inicio o creación de algo, que pieza a pieza se va construyendo. Para nosotros puede ser el inicio de la Orquesta UC. " +
    "Dirección: mensajes y temporizadores en pantalla. Las personas a cargo del ambiente y las luces llevan los aumentos " +
    "de intensidad (de azules a rojos). Puede haber un director que dicte entradas y silencios.",

  secciones: [
    // ============================== INTRO ==============================
    {
      nombre: "Intro · Distorsión ambiente",
      inicio: "0:00",
      acordes: ["Db"], compasesPorAcorde: 4,
      colores: ["#0b1026"],
      tocan: ["ambiente"],
      instrucciones: {
        todos: "Solo ambiente. Esta parte es alargable: el ambiente puede empezar antes y el director inicia el reloj cuando quiera seguir.",
        "ambiente-principal": "Teclados bajos permanentes: Re♭ grave. Sube la distorsión (X) de a poco.",
        "ambiente-extra": "Ruido y textura muy suaves.",
      },
    },
    {
      nombre: "Intro · Ritmo batería",
      inicio: "0:03.7",
      acordes: ["Db"], compasesPorAcorde: 4,
      colores: ["#101a4a"],
      tocan: ["ambiente", "bateria"],
      instrucciones: {
        bateria: "Patrón PULSO (tecla Q): un golpe grave en cada tiempo.",
        ambiente: "Mantener. Colores azules oscuros.",
      },
    },
    {
      nombre: "Intro · Guitarra",
      inicio: "0:18.9",
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#1d2b64", "#23307a"],
      tocan: ["guitarra", "teclados-bajos"],
      instrucciones: {
        todos: "Guitarra con teclados bajos. Un acorde por compás: Bbm7 ↔ Gbmaj7.",
        guitarra: "Un rasgueo largo por compás. Deja sonar.",
        "teclados-bajos": "Raíz del acorde, una nota por compás (Si♭ / Sol♭).",
      },
    },
    {
      nombre: "Intro · Distorsión",
      inicio: "0:31.8",
      acordes: ["Gbmaj7", "Bbm7"],
      colores: ["#2a2f8f", "#3a2f9a"],
      tocan: ["bateria", "teclados", "ambiente"],
      instrucciones: {
        todos: "Batería + teclados medios y bajos + ambiente. Desde aquí los teclados van distorsionados.",
        teclados: "Sube la DISTORSIÓN (≈ 60 %) y déjala así.",
        "teclados-altos": "Registro medio: acordes del compás.",
        bateria: "Patrón SIN PLATILLOS (W).",
        guitarra: "Silencio. Entras en 0:39.",
      },
    },
    {
      nombre: "Intro · Todos",
      inicio: "0:39.2",
      acordes: ["Gbmaj7", "Bbm7"],
      colores: ["#4b2ca0", "#3a1c71"],
      tocan: ["bateria", "teclados", "ambiente", "guitarra"],
      instrucciones: {
        todos: "Entra la guitarra: todos tocan.",
        guitarra: "Rasgueos en cada compás, fuzz medio.",
        bateria: "SIN PLATILLOS (W).",
      },
    },
    // ============================== DESARROLLO ==============================
    {
      nombre: "Desarrollo · Sin platillos",
      inicio: "1:01.4",
      acordes: ["Gbmaj7", "Bbm7"],
      colores: ["#5b247a", "#4a206e"],
      tocan: ["bateria", "guitarra", "ambiente-principal"],
      instrucciones: {
        todos: "Batería sin platillos + guitarra + ambiente (teclados bajos permanentes).",
        bateria: "SIN PLATILLOS (W).",
        teclados: "Silencio.",
        "ambiente-extra": "Silencio (solo luces, si las llevas).",
      },
    },
    {
      nombre: "Desarrollo · Platillos",
      inicio: "1:08.7",
      acordes: ["Gbmaj7", "Bbm7"],
      colores: ["#7a1f7c", "#6b2a8a"],
      tocan: ["bateria", "guitarra", "ambiente", "teclados-bajos"],
      instrucciones: {
        bateria: "CON PLATILLOS (E).",
        "teclados-bajos": "Vuelven, distorsionados.",
        ambiente: "Sube la intensidad (Y). Colores hacia el violeta.",
      },
    },
    {
      nombre: "Desarrollo · Limpio",
      inicio: "1:16.1",
      acordes: ["Gbmaj7", "Bbm7"],
      colores: ["#3b3f8f", "#2c4a9a"],
      tocan: ["guitarra", "bateria", "teclados-bajos"],
      instrucciones: {
        todos: "Solo guitarra + batería sin platos + teclados bajos, SIN distorsión.",
        "teclados-bajos": "Distorsión a 0.",
        bateria: "SIN PLATILLOS (W).",
        "teclado-2": "Prepárate: subida aguda a 1:27.",
        ambiente: "Silencio. Baja el XY.",
      },
    },
    {
      nombre: "Desarrollo · Subida aguda",
      inicio: "1:27.2",
      acordes: ["Gbmaj7"], compasesPorAcorde: 4,
      colores: ["#6a3fb0"],
      tocan: ["guitarra", "bateria", "teclados-bajos", "teclado-2"],
      instrucciones: {
        "teclado-2": "Subida: escala ascendente de Sol♭ hacia el agudo (octava + con X).",
        todos: "Preparar la entrada del muro en 1:32.",
      },
    },
    {
      nombre: "Desarrollo · Muro",
      inicio: "1:32.7",
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#b0245e", "#c0392b"],
      tocan: ["bateria", "guitarra", "teclados", "ambiente"],
      instrucciones: {
        todos: "Ahora los acordes duran DOS compases. Teclados medios y bajos distorsionados.",
        bateria: "CON PLATILLOS (E).",
        teclados: "Distorsión ≈ 60 %. Acordes de dos compases.",
        ambiente: "Ambiente y luces hacia el rojo.",
      },
    },
    {
      nombre: "Desarrollo · Teclados altos",
      inicio: "1:45.7",
      acordes: DOS_COMPASES,
      colores: ["#ff4e50", "#ff7a3c", "#ff7a3c", "#ff4e50", "#ff4e50", "#ff7a3c", "#ff7a3c", "#ff4e50"],
      tocan: ["bateria", "guitarra", "teclados", "ambiente"],
      instrucciones: {
        todos: "Clímax: teclados altos, medios y bajos.",
        "teclados-altos": "Registro ALTO (octava +, tecla X).",
        "teclado-2": "En 1:54 haz un pequeño desfase: atrásate un poco respecto a teclado 1.",
        bateria: "MURO (R).",
        guitarra: "Fuzz alto, modo SOSTENER.",
        ambiente: "Rojo al máximo. Destellos con la batería.",
      },
    },
    // ============================== OUTRO ==============================
    {
      nombre: "Outro · Medios",
      inicio: "2:00.4",
      acordes: DOS_COMPASES,
      colores: ["#c0392b", "#9b2c6f", "#9b2c6f", "#c0392b", "#c0392b", "#9b2c6f", "#9b2c6f", "#c0392b"],
      tocan: ["guitarra", "teclados", "ambiente"],
      instrucciones: {
        todos: "Sale la batería. Guitarra + teclados medios + teclados bajos + ambiente.",
        "teclados-altos": "Vuelve a registro medio (octava −, tecla Z).",
        bateria: "Silencio desde aquí.",
      },
    },
    {
      nombre: "Outro · Dos líneas",
      inicio: "2:15.2",
      acordes: DOS_COMPASES,
      colores: ["#5b247a", "#3a1c71", "#3a1c71", "#5b247a", "#5b247a", "#3a1c71", "#3a1c71", "#5b247a"],
      tocan: ["teclados-bajos", "ambiente"],
      instrucciones: {
        todos: "Teclados bajos: 2.ª línea melódica. Ambiente marcado.",
        "teclados-bajos": "2.ª LÍNEA MELÓDICA sobre los acordes.",
        "ambiente-principal": "1.ª línea (permanente): se va desvaneciendo poco a poco hasta 2:30.",
        "ambiente-extra": "Ambiente MARCADO: colores y destellos claros.",
        guitarra: "Silencio.",
        "teclados-altos": "Silencio.",
      },
    },
    {
      nombre: "Outro · Resolución",
      inicio: "2:30.0",
      acordes: ["Gbmaj7", "Bbm7", "Bbm7", "Db", "Db", "Bbm7", "Bbm7", "Bbm7", "Bbm7", "Bbm7", "Db", "Db", "Db", "Db"],
      colores: ["#23307a", "#1d2b64", "#1d2b64", "#16204a", "#16204a", "#1d2b64", "#1d2b64", "#16204a", "#16204a", "#16204a", "#0b1026", "#0b1026", "#05070f", "#000000"],
      tocan: ["teclados-bajos"],
      instrucciones: {
        todos: "Solo teclados bajos: 2.ª línea, más limpia, y resuelve en Re♭.",
        "teclados-bajos": "Distorsión baja (≈ 20 %). Termina en Db y deja morir.",
        ambiente: "Silencio. Las luces se apagan hacia 2:55.",
      },
    },
  ],

  eventos: [
    { t: "0:03.7", perfiles: ["bateria"], texto: "Ritmo: patrón PULSO (Q)" },
    { t: "0:14", perfiles: ["todos"], texto: "En 5 s: guitarra + teclados bajos" },
    { t: "0:26.8", perfiles: ["todos"], texto: "En 5 s: batería + teclados con distorsión" },
    { t: "0:34.2", perfiles: ["guitarra"], texto: "En 5 s: entras" },
    { t: "0:56.4", perfiles: ["todos"], texto: "En 5 s: Desarrollo" },
    { t: "1:11.1", perfiles: ["teclados-bajos"], texto: "En 5 s: quita la distorsión" },
    { t: "1:27.2", perfiles: ["teclado-2"], texto: "¡Subida aguda!" },
    { t: "1:40.7", perfiles: ["teclados-altos"], texto: "En 5 s: registro ALTO" },
    { t: "1:54", perfiles: ["teclado-2"], texto: "Desfase" },
    { t: "1:55.4", perfiles: ["bateria"], texto: "En 5 s: la batería sale" },
    { t: "2:15.2", perfiles: ["ambiente-principal"], texto: "Empieza a desvanecer" },
    { t: "2:25", perfiles: ["teclados-bajos"], texto: "En 5 s: resolución" },
  ],

  // Pistas MIDI del arreglo (carpeta midi/). Están a 130 BPM y empiezan en 0:00, así que calzan con el reloj.
  // Cada perfil parte con la pista de "porPerfil"; en la página se puede cambiar por cualquier otra.
  // preset: el sonido que usa la pista en el perfil Multipista (pad, epiano, bajo, lead).
  // Si agregas o cambias un .mid, corre  python midi/empaquetar.py  para que funcione sin servidor.
  midi: {
    pistas: [
      { id: "melodia",  nombre: "Melodía",        archivo: "midi/genesis_melodia.mid",  preset: "lead" },
      { id: "medio",    nombre: "Medio",          archivo: "midi/genesis_medio.mid",    preset: "epiano" },
      { id: "pad",      nombre: "Pad (acordes)",  archivo: "midi/genesis_pad.mid",      preset: "pad" },
      { id: "bajo",     nombre: "Bajo",           archivo: "midi/genesis_bajo.mid",     preset: "bajo" },
      { id: "pedal",    nombre: "Pedal F",        archivo: "midi/genesis_pedal_F.mid",  preset: "lead" },
      { id: "ambiente", nombre: "Ambiente",       archivo: "midi/genesis_ambiente.mid", preset: "pad" },
      { id: "bateria",  nombre: "Batería",        archivo: "midi/genesis_bateria.mid" },
    ],
    porPerfil: {
      guitarra: "pad", bateria: "bateria",
      "teclado-1": "medio", "teclado-2": "melodia", "teclado-3": "bajo", "teclado-4": "pad",
      "ambiente-1": "ambiente", "ambiente-2": "ambiente", "ambiente-3": "pedal", "ambiente-4": "medio",
    },
    // midi/genesis_completo.mid tiene todas las pistas juntas (para abrirlo en un DAW o MuseScore).
  },

  // Guía del recuadro X/Y de los ambientes: dónde poner el mouse para que suene como debe.
  // [tiempo, X (0 = limpio … 1 = distorsión), Y (0 = silencio … 1 = intenso)].
  // Entre un punto y el siguiente la guía se mueve en línea recta; dos puntos muy juntos = cambio brusco.
  // Las notas que suenan las pone la pista MIDI del perfil (midi.porPerfil).
  // Se busca la clave más específica: ambiente-1 … ambiente-4, luego ambiente-principal / ambiente-extra.
  guiaXY: {
    "ambiente-principal": [
      ["0:00",   0.05, 0.40],   // entra limpio
      ["0:18.4", 0.45, 0.55],   // sube la distorsión de a poco
      ["0:18.9", 0.30, 0.00],   // silencio: guitarra + teclados bajos
      ["0:31.3", 0.30, 0.00],
      ["0:31.8", 0.35, 0.45],   // vuelve con batería y teclados
      ["0:39.2", 0.45, 0.60],   // todos
      ["1:08.2", 0.45, 0.55],   // desarrollo: sigue la línea permanente
      ["1:08.7", 0.50, 0.65],
      ["1:15.6", 0.60, 0.80],   // sube la intensidad (Y), hacia el violeta
      ["1:16.1", 0.20, 0.00],   // limpio: silencio, baja el XY
      ["1:32.2", 0.20, 0.00],
      ["1:32.7", 0.65, 0.80],   // muro: hacia el rojo
      ["1:45.7", 0.85, 0.95],   // clímax: rojo al máximo
      ["2:00.4", 0.70, 0.80],   // outro con los medios
      ["2:15.2", 0.55, 0.65],   // empieza a desvanecerse…
      ["2:30.0", 0.25, 0.00],   // …hasta apagarse
    ],
    "ambiente-extra": [
      ["0:00",   0.10, 0.20],   // ruido y textura muy suaves
      ["0:18.4", 0.25, 0.30],
      ["0:18.9", 0.25, 0.00],   // silencio
      ["0:31.3", 0.25, 0.00],
      ["0:31.8", 0.35, 0.40],
      ["0:39.2", 0.40, 0.50],
      ["1:00.9", 0.45, 0.55],
      ["1:01.4", 0.30, 0.00],   // silencio (solo luces)
      ["1:08.2", 0.30, 0.00],
      ["1:08.7", 0.50, 0.65],   // hacia el violeta
      ["1:15.6", 0.55, 0.70],
      ["1:16.1", 0.20, 0.00],   // silencio
      ["1:32.2", 0.20, 0.00],
      ["1:32.7", 0.65, 0.75],   // muro
      ["1:45.7", 0.85, 0.90],   // clímax
      ["2:00.4", 0.60, 0.70],
      ["2:15.2", 0.45, 0.85],   // ambiente MARCADO, limpio y claro
      ["2:29.5", 0.45, 0.80],
      ["2:30.0", 0.20, 0.00],   // silencio
    ],
  },

  // Sonidos por defecto (si un archivo no existe se usan los sintetizados).
  // sonidos/fl/ son sonidos propios hechos en FL Studio (FLEX) para imitar la grabación: SÍ se publican (ver sonidos/fl/LEEME.md).
  // Para ensayar con los fragmentos de la grabación oficial (sonidos/extraidos/, NO se publican),
  // cambia "sonidos/fl/…" por las rutas de sonidos/LEEME.md.
  sonidos: {
    guitarra: {
      "Bbm7":   { archivo: "sonidos/fl/guitarra_Bbm7.wav",   base: 46 },
      "Gbmaj7": { archivo: "sonidos/fl/guitarra_Gbmaj7.wav", base: 42 },
      "Db":     { archivo: "sonidos/fl/guitarra_Db.wav",     base: 49 },
    },
    bateria: {
      bombo:   "sonidos/fl/bateria_bombo.wav",
      caja:    "sonidos/fl/bateria_caja.wav",
      hihat:   "sonidos/fl/bateria_hihat.wav",
      abierto: "sonidos/fl/bateria_abierto.wav",
      tom:     "sonidos/fl/bateria_tom.wav",
      crash:   "sonidos/fl/bateria_crash.wav",
    },
    "teclado-1":  { archivo: "sonidos/fl/teclado_medio_Db4.wav", base: 61 }, // grabado en Re♭4, suena a su altura real
    "teclado-2":  { archivo: "sonidos/fl/teclado_agudo_F5.wav",  base: 77 }, // grabado en Fa5, suena a su altura real
    // real: la nota MIDI en que se grabó. "Practicar con la orquesta" la usa para que las pistas MIDI suenen a su altura;
    // base: 46 es para tocar a mano en octava 2.
    "teclado-3":  { archivo: "sonidos/fl/bajo_Bb1.wav",          base: 46, real: 34 }, // grabado en Si♭1; suena a su altura real en octava 2
    "teclado-4":  { archivo: "sonidos/fl/teclado_bajo2_Bb1.wav", base: 46, real: 34 }, // grabado en Si♭1; igual que el teclado 3
    "ambiente-1": { archivo: "sonidos/fl/ambiente_drone_Db.wav",  base: 49 }, // teclados bajos permanentes (Re♭)
    "ambiente-2": { archivo: "sonidos/fl/ambiente_ruido_Bb.wav",  base: 58 },
    "ambiente-3": { archivo: "sonidos/fl/ambiente_brillo_Gb.wav", base: 54 },
    "ambiente-4": { archivo: "sonidos/fl/ambiente_pulso_Db.wav",  base: 49 },
  },
};
