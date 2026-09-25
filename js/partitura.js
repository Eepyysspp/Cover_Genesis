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

  // Sonidos por defecto (si un archivo no existe se usan los sintetizados).
  // sonidos/extraidos/ viene de la grabación oficial y NO se publica (ver sonidos/LEEME.md).
  sonidos: {
    guitarra: {
      "Bbm7":   { archivo: "sonidos/extraidos/guitarra_acorde_Bbm.wav", base: 46 },
      "Gbmaj7": { archivo: "sonidos/extraidos/guitarra_acorde_Gb.wav",  base: 42 },
      "Db":     { archivo: "sonidos/extraidos/guitarra_acorde_Db.wav",  base: 49 },
    },
    bateria: {
      bombo:   "sonidos/extraidos/bateria_bombo.wav",
      caja:    "sonidos/extraidos/bateria_caja.wav",
      hihat:   "sonidos/extraidos/bateria_hihat.wav",
      abierto: "sonidos/extraidos/bateria_hihat_abierto.wav",
      tom:     "sonidos/extraidos/bateria_pulso_intro.wav",
      crash:   "sonidos/extraidos/bateria_platillo.wav",
    },
    "teclado-3":  { archivo: "sonidos/extraidos/bajo_nota.wav", base: 46 }, // grabado en Si♭1; suena a su altura real en octava 2
    "ambiente-1": { archivo: "sonidos/extraidos/ambiente_drone_loop.wav",  base: 49 }, // teclados bajos permanentes (Re♭)
    "ambiente-2": { archivo: "sonidos/extraidos/ambiente_ruido_loop.wav",  base: 58 },
    "ambiente-3": { archivo: "sonidos/extraidos/ambiente_brillo_loop.wav", base: 54 },
    "ambiente-4": { archivo: "sonidos/extraidos/ambiente_final_loop.wav",  base: 49 },
  },
};
