/* ==========================================================================
   PARTITURA — Cover de Genesis (Robin Callaway)
   Orquesta de Laptops UC + guitarra · propuesta de Felipe Osorio
   --------------------------------------------------------------------------
   ESTE ES EL ÚNICO ARCHIVO QUE NECESITAS EDITAR PARA ADAPTAR LA OBRA.

   · Estructura formal: la de la propuesta (Intro / Desarrollo / Outro).
   · Tempo y acordes: medidos en la grabación oficial. 130 BPM, 4/4,
     Re♭ mayor / Si♭ menor, progresión B♭m7 ↔ G♭maj7.
   · Entradas y silencios: siguen a las pistas MIDI de midi/ (cada sección
     empieza en un compás exacto del MIDI).

   Tiempos: "m:ss" o "m:ss.s".  Acordes: Bbm7, Gbmaj7, Db, F#m, C5, Cadd9…
   tocan: quién toca en la sección. Claves posibles:
     todos · guitarra · bateria · teclados · teclados-altos (1 y 2) ·
     teclados-bajos (3 y 4) · teclado-1..4 · ambiente · ambiente-principal ·
     ambiente-extra · ambiente-1..4
   Las mismas claves sirven para "instrucciones" y "eventos".
   ========================================================================== */

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

  // Las secciones siguen a las pistas MIDI (midi/): cada una empieza justo en un compás del MIDI
  // (compás n = (n − 1) × 1,846 s) y "tocan" dice quién tiene notas en su pista en ese tramo.
  // Si cambias una pista MIDI, revisa aquí quién toca.
  secciones: [
    // ============================== INTRO ==============================
    {
      nombre: "Intro · Distorsión ambiente",
      inicio: "0:00",                      // compases 1–2
      acordes: ["Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#0b1026"],
      tocan: ["ambiente-1", "ambiente-2"],
      instrucciones: {
        todos: "Solo ambiente. Esta parte es alargable: el ambiente puede empezar antes y el director inicia el reloj cuando quiera seguir.",
        "ambiente-principal": "Colchón de G♭ sobre Si♭ grave. Sube la distorsión (X) de a poco.",
        "ambiente-2": "Ruido y textura muy suaves.",
      },
    },
    {
      nombre: "Intro · Ritmo batería",
      inicio: "0:03.69",                   // compases 3–10
      acordes: ["Db"], compasesPorAcorde: 4,
      colores: ["#101a4a"],
      tocan: ["bateria", "ambiente-1", "ambiente-2"],
      instrucciones: {
        bateria: "SIN PLATILLOS (W): bombo y caja, sin hi-hat.",
        ambiente: "Drone en Re♭. Colores azules oscuros.",
      },
    },
    {
      nombre: "Intro · Guitarra y teclados",
      inicio: "0:18.46",                   // compases 11–18
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#1d2b64", "#23307a"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "Entran guitarra y teclados. Un acorde por compás: B♭m7 ↔ G♭maj7. Todo limpio todavía.",
        guitarra: "Melodía: A♭–D♭–C… (ver tu pista MIDI). La frase dura 4 compases.",
        "teclado-1": "Arpegio medio en negras: F–B♭–F–A♭ sobre B♭m7, D♭ largo sobre G♭.",
        "teclado-2": "Silencio. Entras en 0:40 con el Fa agudo.",
        "teclado-3": "Raíz del acorde, una nota por compás (Si♭ / Sol♭).",
        "teclado-4": "Colchón: los acordes completos, una vez por compás.",
        bateria: "SIN PLATILLOS (W).",
        "ambiente-4": "Pulso suave sobre la línea media.",
      },
    },
    {
      nombre: "Intro · Platillos y distorsión",
      inicio: "0:33.23",                   // compases 19–22
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#2a2f8f", "#3a2f9a"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "Entran los platillos y la distorsión en los teclados medios.",
        teclados: "Sube la DISTORSIÓN (≈ 60 %) y déjala así.",
        "teclado-3": "Bajo todavía limpio.",
        guitarra: "Arriba alternas Do y Mi♭ (ver tu pista MIDI). Al final de esta parte callas.",
        "teclado-2": "Silencio. Entras en 0:40 con el Fa agudo.",
        bateria: "CON PLATILLOS (E).",
      },
    },
    {
      nombre: "Intro · Pedal F",
      inicio: "0:40.62",                   // compases 23–34
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#4b2ca0", "#3a1c71"],
      tocan: ["bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-3", "ambiente-4"],
      instrucciones: {
        todos: "Sale la melodía y entra el pedal agudo en Fa.",
        "ambiente-3": "PEDAL F: Fa agudo sostenido sobre los dos acordes.",
        "teclado-2": "PEDAL F: Fa agudo sostenido sobre los dos acordes, junto con ambiente 3.",
        guitarra: "Silencio. Vuelves en 1:17 con el solo.",
        bateria: "CON PLATILLOS (E).",
      },
    },
    // ============================== DESARROLLO ==============================
    {
      nombre: "Desarrollo · Sin platillos",
      inicio: "1:02.77",                   // compases 35–38
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#5b247a", "#4a206e"],
      tocan: ["bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-3", "ambiente-4"],
      instrucciones: {
        todos: "Desarrollo: la batería quita los platillos. El arpegio medio se queda en notas largas.",
        bateria: "SIN PLATILLOS (W).",
        "teclado-1": "Notas largas: Fa sobre B♭m7, Sol♭ sobre G♭.",
        "teclado-2": "Sigue el Fa agudo.",
        guitarra: "Silencio.",
      },
    },
    {
      nombre: "Desarrollo · Platillos",
      inicio: "1:10.15",                   // compases 39–42
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#7a1f7c", "#6b2a8a"],
      tocan: ["bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-3", "ambiente-4"],
      instrucciones: {
        bateria: "CON PLATILLOS (E).",
        ambiente: "Sube la intensidad (Y). Colores hacia el violeta.",
        "teclado-2": "Sigue el Fa agudo; lo sueltas en 1:17.",
        guitarra: "Silencio. Entras en 1:17 con el solo.",
      },
    },
    {
      nombre: "Desarrollo · Limpio",
      inicio: "1:17.54",                   // compases 43–47
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#3b3f8f", "#2c4a9a"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "Todo SIN distorsión. Vuelve la melodía (solo).",
        teclados: "Distorsión a 0.",
        guitarra: "SOLO: la melodía otra vez, A♭–D♭–C…",
        "teclado-2": "Silencio (sale el pedal).",
        bateria: "SIN PLATILLOS (W).",
        "ambiente-3": "Silencio (sale el pedal).",
      },
    },
    {
      nombre: "Desarrollo · Bisagra en Sol♭",
      inicio: "1:26.77",                   // compases 48–50
      acordes: ["Gbmaj7"], compasesPorAcorde: 4,
      colores: ["#6a3fb0"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "G♭ se alarga TRES compases. Prepara el muro de 1:32.",
        guitarra: "Sostén el Do agudo.",
      },
    },
    {
      nombre: "Desarrollo · Muro",
      inicio: "1:32.31",                   // compases 51–58
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#b0245e", "#c0392b"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "Ahora los acordes duran DOS compases. La melodía sigue igual.",
        teclados: "Distorsión ≈ 60 %. Acordes de dos compases.",
        bateria: "CON PLATILLOS (E).",
        ambiente: "Ambiente y luces hacia el rojo.",
      },
    },
    {
      nombre: "Desarrollo · Teclados altos",
      inicio: "1:47.08",                   // compases 59–66
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#ff4e50", "#ff7a3c"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "Clímax.",
        guitarra: "Variante de la melodía con Fa agudo. En 1:54 haz un pequeño desfase: atrásate un poco. Fuzz alto.",
        bateria: "CON PLATILLOS (E), o MURO (R) si quieres más.",
        ambiente: "Rojo al máximo. Destellos con la batería.",
      },
    },
    // ============================== OUTRO ==============================
    {
      nombre: "Outro · Medios",
      inicio: "2:01.85",                   // compases 67–74
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#c0392b", "#9b2c6f"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "Outro: siguen todos; la melodía con Fa hace sus dos últimas frases.",
        bateria: "CON PLATILLOS (E).",
      },
    },
    {
      nombre: "Outro · Dos líneas",
      inicio: "2:16.62",                   // compases 75–82
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#5b247a", "#3a1c71"],
      tocan: ["bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-3", "ambiente-4"],
      instrucciones: {
        todos: "Sale la melodía, vuelve el pedal en Fa. Las líneas bajas empiezan a bajar de volumen.",
        "teclado-2": "PEDAL F otra vez, hasta 2:48.",
        guitarra: "Silencio. Vuelves solo para el final (2:48).",
        "ambiente-3": "PEDAL F otra vez.",
        "ambiente-principal": "Empieza a desvanecerse poco a poco.",
        teclados: "Baja el volumen de a poco.",
      },
    },
    {
      nombre: "Outro · Sin batería",
      inicio: "2:31.38",                   // compases 83–91
      acordes: ["Bbm7"], compasesPorAcorde: 1,
      colores: ["#23307a"],
      tocan: ["teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-3", "ambiente-4"],
      instrucciones: {
        todos: "Sale la batería. Queda B♭m7 (el bajo baja a La♭ un momento).",
        "teclado-3": "Distorsión baja (≈ 20 %): más limpio.",
        bateria: "Silencio desde aquí.",
      },
    },
    {
      nombre: "Outro · Resolución en Re♭",
      inicio: "2:48.00",                   // compases 92–95
      acordes: ["Db"], compasesPorAcorde: 4,
      colores: ["#0b1026"],
      tocan: ["guitarra", "teclado-1", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "Resuelve en Re♭ y deja morir.",
        guitarra: "Últimas notas: Re♭–Mi♭–Re♭.",
        "teclado-2": "Silencio.",
        "ambiente-3": "Silencio. Las luces se apagan hacia 2:55.",
      },
    },
  ],

  eventos: [
    { t: "0:03.69", perfiles: ["bateria"], texto: "Ritmo: SIN PLATILLOS (W)" },
    { t: "0:13.46", perfiles: ["todos"], texto: "En 5 s: entran guitarra y teclados" },
    { t: "0:28.23", perfiles: ["todos"], texto: "En 5 s: platillos y distorsión" },
    { t: "0:35.62", perfiles: ["guitarra"], texto: "En 5 s: silencio" },
    { t: "0:35.62", perfiles: ["teclado-2", "ambiente-3"], texto: "En 5 s: entras (pedal F)" },
    { t: "0:57.77", perfiles: ["todos"], texto: "En 5 s: Desarrollo" },
    { t: "1:12.54", perfiles: ["teclados"], texto: "En 5 s: quita la distorsión" },
    { t: "1:12.54", perfiles: ["guitarra"], texto: "En 5 s: vuelve la melodía (solo)" },
    { t: "1:12.54", perfiles: ["teclado-2"], texto: "En 5 s: silencio" },
    { t: "1:21.77", perfiles: ["todos"], texto: "En 5 s: G♭ largo (3 compases)" },
    { t: "1:27.31", perfiles: ["todos"], texto: "En 5 s: MURO, acordes de 2 compases" },
    { t: "1:42.08", perfiles: ["guitarra"], texto: "En 5 s: variante con Fa" },
    { t: "1:54.46", perfiles: ["guitarra"], texto: "Desfase" },
    { t: "2:11.62", perfiles: ["guitarra"], texto: "En 5 s: silencio" },
    { t: "2:11.62", perfiles: ["teclado-2", "ambiente-3"], texto: "En 5 s: vuelve el pedal F" },
    { t: "2:16.62", perfiles: ["ambiente-principal"], texto: "Empieza a desvanecer" },
    { t: "2:26.38", perfiles: ["bateria"], texto: "En 5 s: la batería sale" },
    { t: "2:43.00", perfiles: ["todos"], texto: "En 5 s: resolución en Re♭" },
  ],

  // Efectos automáticos: cómo suena cada instrumento en cada parte. Se aplican solos en "Practicar con la orquesta"
  // y en la página de cada perfil si está activo 🎛️ Efectos automáticos (tocar un control lo desactiva).
  // Claves como en "tocan" (todos, teclados, teclados-bajos, teclado-3, guitarra, bateria…); la más específica gana.
  // Valores 0…1. Un par [a, b] va de a hasta b a lo largo de la parte (subidas y fundidos).
  //   teclados: dist (distorsión) · filtro (brillo) · reverb · vol (1 = normal)
  //   guitarra: fuzz · tono · reverb · vol        batería: vol · reverb · drive (saturación del bus)
  // Los ambientes siguen su guía X/Y (guiaXY): X = distorsión, Y = intensidad.
  efectos: [
    { desde: "0:00",    todos: { reverb: 0.6 } },
    { desde: "0:03.69", bateria: { vol: [0.63, 0.98], reverb: 0.35, drive: 0.08 } },                              // la batería entra de a poco
    { desde: "0:18.46", teclados: { dist: 0, filtro: 0.44, reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.05, filtro: 0.32 },
                        guitarra: { fuzz: 0.15, tono: 0.38, reverb: 0.45 }, bateria: { vol: 0.98, reverb: 0.3, drive: 0.12 } },
    { desde: "0:33.23", teclados: { dist: [0.3, 0.6], filtro: 0.52, reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.1, filtro: 0.36 },
                        guitarra: { fuzz: 0.27, tono: 0.41, reverb: 0.45 }, bateria: { vol: 1.09, reverb: 0.28, drive: 0.2 } },
    { desde: "0:40.62", teclados: { dist: 0.6, filtro: 0.56, reverb: 0.4 }, "teclado-2": { dist: 0.15, filtro: 0.6, reverb: 0.65 },
                        "teclado-3": { vol: 1.6, dist: 0.25, filtro: 0.36 }, bateria: { vol: 1.09, reverb: 0.28, drive: 0.2 } },
    { desde: "1:02.77", teclados: { dist: 0.5, filtro: 0.48, reverb: 0.45 }, "teclado-1": { filtro: 0.4 },
                        "teclado-3": { vol: 1.6, dist: 0.25, filtro: 0.36 }, bateria: { vol: 0.98, reverb: 0.3, drive: 0.15 } },
    { desde: "1:10.15", teclados: { dist: [0.5, 0.65], filtro: [0.48, 0.58], reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.3, filtro: 0.4 },
                        bateria: { vol: 1.09, reverb: 0.28, drive: 0.22 } },
    { desde: "1:17.54", teclados: { dist: 0, filtro: 0.4, reverb: 0.5 }, guitarra: { fuzz: 0.09, tono: 0.46, reverb: 0.55 },   // todo limpio: el solo
                        bateria: { vol: 0.86, reverb: 0.35, drive: 0.05 } },
    { desde: "1:26.77", teclados: { dist: [0, 0.45], filtro: [0.4, 0.64], reverb: 0.45 }, guitarra: { fuzz: [0.09, 0.3], tono: 0.45 }, // subida al muro
                        bateria: { vol: [0.86, 1.15], reverb: 0.3, drive: [0.05, 0.25] } },
    { desde: "1:32.31", teclados: { dist: 0.65, filtro: 0.62, reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.35, filtro: 0.44 },
                        guitarra: { vol: 0.85, fuzz: 0.39, tono: 0.45, reverb: 0.5 }, bateria: { vol: 1.15, reverb: 0.25, drive: 0.3 } },
    { desde: "1:47.08", teclados: { dist: 0.75, filtro: 0.7, reverb: 0.42 }, "teclado-3": { vol: 1.6, dist: 0.4, filtro: 0.48 },              // clímax
                        guitarra: { vol: 0.85, fuzz: 0.48, tono: 0.49, reverb: 0.55 }, bateria: { vol: 1.15, reverb: 0.25, drive: 0.38 } },
    { desde: "2:01.85", teclados: { dist: 0.6, filtro: 0.58, reverb: 0.45 }, "teclado-3": { vol: 1.6, dist: 0.3, filtro: 0.4 },
                        guitarra: { vol: 0.85, fuzz: [0.39, 0.3], tono: 0.45, reverb: 0.55 }, bateria: { vol: 1.06, reverb: 0.28, drive: 0.25 } },
    { desde: "2:16.62", teclados: { dist: [0.6, 0.35], filtro: [0.58, 0.44], reverb: 0.5, vol: [1, 0.6] }, "teclado-2": { reverb: 0.75 }, // se desvanece
                        bateria: { vol: [1.03, 0.69], reverb: 0.32, drive: [0.25, 0.1] } },
    { desde: "2:31.38", teclados: { dist: 0.3, filtro: 0.4, reverb: 0.55, vol: 0.6 }, "teclado-3": { dist: 0.2, vol: 0.75 }, "teclado-4": { vol: 0.65 } },
    { desde: "2:48.00", teclados: { dist: [0.2, 0.05], filtro: [0.4, 0.24], reverb: [0.5, 0.8], vol: [0.6, 0] },                   // resuelve y muere
                        guitarra: { fuzz: 0.18, tono: 0.38, reverb: [0.6, 0.85], vol: [0.9, 0] } },
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
      guitarra: "melodia", bateria: "bateria",
      "teclado-1": "medio", "teclado-2": "pedal", "teclado-3": "bajo", "teclado-4": "pad",
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
      ["0:00",    0.05, 0.40],   // entra limpio
      ["0:18.46", 0.30, 0.50],   // entran guitarra y teclados
      ["0:33.23", 0.45, 0.60],   // platillos y distorsión
      ["1:02.77", 0.45, 0.55],   // desarrollo: sigue la línea permanente
      ["1:10.15", 0.55, 0.70],   // sube la intensidad, hacia el violeta
      ["1:17.04", 0.60, 0.75],
      ["1:17.54", 0.15, 0.45],   // limpio: sin distorsión
      ["1:31.81", 0.20, 0.50],
      ["1:32.31", 0.65, 0.80],   // muro: hacia el rojo
      ["1:47.08", 0.85, 0.95],   // clímax: rojo al máximo
      ["2:01.85", 0.70, 0.80],   // outro
      ["2:16.62", 0.55, 0.65],   // empieza a desvanecerse…
      ["2:48.00", 0.25, 0.30],   // …resolución en Re♭
      ["2:55",    0.10, 0.00],   // se apaga
    ],
    "ambiente-extra": [
      ["0:00",    0.10, 0.20],   // ruido y textura muy suaves
      ["0:18.46", 0.25, 0.35],
      ["0:33.23", 0.40, 0.50],
      ["1:10.15", 0.50, 0.65],   // hacia el violeta
      ["1:17.04", 0.55, 0.70],
      ["1:17.54", 0.15, 0.35],   // limpio
      ["1:31.81", 0.20, 0.40],
      ["1:32.31", 0.65, 0.75],   // muro
      ["1:47.08", 0.85, 0.90],   // clímax
      ["2:01.85", 0.60, 0.70],
      ["2:16.62", 0.45, 0.85],   // ambiente MARCADO, limpio y claro
      ["2:48.00", 0.25, 0.40],
      ["2:55",    0.10, 0.00],   // se apaga
    ],
  },

  // Sonidos por defecto (si un archivo no existe se usan los sintetizados).
  // sonidos/fl/ son sonidos propios hechos en FL Studio (FLEX) para imitar la grabación: SÍ se publican (ver sonidos/fl/LEEME.md).
  // Para ensayar con los fragmentos de la grabación oficial (sonidos/extraidos/, NO se publican),
  // cambia "sonidos/fl/…" por las rutas de sonidos/LEEME.md.
  sonidos: {
    guitarra: {
      nota:     { archivo: "sonidos/fl/guitarra_nota_Db5.wav", base: 73 }, // una nota: melodía y pistas MIDI
      "Bbm7":   { archivo: "sonidos/fl/guitarra_Bbm7.wav",   base: 46 },
      "Gbmaj7": { archivo: "sonidos/fl/guitarra_Gbmaj7.wav", base: 42 },
      "Db":     { archivo: "sonidos/fl/guitarra_Db.wav",     base: 49 },
    },
    // Batería: kits de FLEX (Room + Power) procesados para sonar como la grabación (ver sonidos/fl/bateria/LEEME.md).
    // capas: de suave a fuerte ("hasta" = intensidad 0…1); cada capa tiene dos tomas que se alternan.
    bateria: {
      bombo:    { capas: [{ hasta: 0.62, archivos: ["sonidos/fl/bateria/bombo_suave_1.wav", "sonidos/fl/bateria/bombo_suave_2.wav"] }, { hasta: 0.84, archivos: ["sonidos/fl/bateria/bombo_media_1.wav", "sonidos/fl/bateria/bombo_media_2.wav"] }, { hasta: 1, archivos: ["sonidos/fl/bateria/bombo_fuerte_1.wav", "sonidos/fl/bateria/bombo_fuerte_2.wav"] }] },
      caja:     { capas: [{ hasta: 0.62, archivos: ["sonidos/fl/bateria/caja_suave_1.wav", "sonidos/fl/bateria/caja_suave_2.wav"] }, { hasta: 0.84, archivos: ["sonidos/fl/bateria/caja_media_1.wav", "sonidos/fl/bateria/caja_media_2.wav"] }, { hasta: 1, archivos: ["sonidos/fl/bateria/caja_fuerte_1.wav", "sonidos/fl/bateria/caja_fuerte_2.wav"] }] },
      hihat:    { capas: [{ hasta: 0.62, archivos: ["sonidos/fl/bateria/hihat_suave_1.wav", "sonidos/fl/bateria/hihat_suave_2.wav"] }, { hasta: 0.84, archivos: ["sonidos/fl/bateria/hihat_media_1.wav", "sonidos/fl/bateria/hihat_media_2.wav"] }, { hasta: 1, archivos: ["sonidos/fl/bateria/hihat_fuerte_1.wav", "sonidos/fl/bateria/hihat_fuerte_2.wav"] }] },
      abierto:  "sonidos/fl/bateria/abierto.wav",
      tom:      "sonidos/fl/bateria/tom.wav",            // el pulso grave de la intro
      tomgrave: { capas: [{ hasta: 0.75, archivos: ["sonidos/fl/bateria/tomgrave_suave_1.wav"] }, { hasta: 1, archivos: ["sonidos/fl/bateria/tomgrave_fuerte_1.wav"] }] },
      tommedio: { capas: [{ hasta: 0.75, archivos: ["sonidos/fl/bateria/tommedio_suave_1.wav"] }, { hasta: 1, archivos: ["sonidos/fl/bateria/tommedio_fuerte_1.wav"] }] },
      tomagudo: { capas: [{ hasta: 0.75, archivos: ["sonidos/fl/bateria/tomagudo_suave_1.wav"] }, { hasta: 1, archivos: ["sonidos/fl/bateria/tomagudo_fuerte_1.wav"] }] },
      crash:    "sonidos/fl/bateria/crash.wav",
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

  // Sonidos extra que cada teclado puede elegir en su página (selector "Sonido") y en "Practicar con la orquesta".
  // muestras: una o más grabaciones; se usa la más cercana al registro del perfil. real = nota MIDI que suena de verdad.
  catalogo: [
    { id: "square-woof", nombre: "Square Woof (FL)", muestras: [
      { archivo: "sonidos/fl/square_woof_Db2.wav", real: 37 },   // FLEX · Square Woof (Arksun Cityscape), suena en Re♭2
      { archivo: "sonidos/fl/square_woof_Db3.wav", real: 49 },   // suena en Re♭3
    ] },
  ],
};
