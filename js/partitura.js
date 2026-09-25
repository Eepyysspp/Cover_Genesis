/* ==========================================================================
   PARTITURA — Genesis (Robin Callaway) · Orquesta de Laptops UC
   --------------------------------------------------------------------------
   ESTE ES EL ÚNICO ARCHIVO QUE NECESITAS EDITAR PARA ADAPTAR LA OBRA.

   ⚠ Las secciones, acordes, tempo y colores de abajo son PROVISORIOS.
     Solo la duración total (2:55) viene de la grabación original.
     Escucha la canción y ajusta cada valor.

   Tiempos: "m:ss" desde el inicio de la obra (ej: "1:25").
   Acordes: C, Cm, C7, Cmaj7, Cm7, Csus2, Csus4, Cadd9, C5, Cdim, Caug,
            con # o b (F#m, Bb) y bajo opcional (G/B).
   Colores: cualquier color CSS ("#ff3366", "rebeccapurple", "hsl(200 80% 50%)").
   ========================================================================== */

window.PARTITURA = {
  titulo: "Genesis",
  artista: "Robin Callaway",
  album: "i saw an angel in the mirror (2024)",
  duracion: "2:55",

  bpm: 80,              // PROVISORIO: tempo en negras por minuto
  compas: 4,            // tiempos por compás
  compasesPorAcorde: 1, // valor por defecto; cada sección puede cambiarlo

  // Cuántos teclados se usan en esta presentación: 2, 3 o 4
  teclados: 4,

  // ------------------------------------------------------------------------
  // Secciones: cada una dura hasta el "inicio" de la siguiente.
  // instrucciones: textos por perfil. Claves posibles:
  //   todos · guitarra · bateria · teclados · teclado-1..4 · ambiente · ambiente-1..4
  //   (el perfil específico se muestra junto al de su grupo y al de "todos")
  // ------------------------------------------------------------------------
  secciones: [
    {
      nombre: "Intro",
      inicio: "0:00",
      acordes: ["Em", "Cmaj7"],
      compasesPorAcorde: 2,
      colores: ["#0b1026", "#1d2b64"],
      instrucciones: {
        todos: "Silencio que se abre. Entran solo los ambientes.",
        ambiente: "Suban el volumen muy lento (eje Y). Colores oscuros.",
        "ambiente-1": "Empiezas tú: ruido suave, casi imperceptible.",
        guitarra: "Esperar. Prepara fuzz bajo y reverb alta.",
        bateria: "Esperar.",
        teclados: "Esperar.",
        "teclado-1": "Desde 0:10: notas largas del acorde, muy suave.",
      },
    },
    {
      nombre: "Verso",
      inicio: "0:20",
      acordes: ["Em", "C", "G", "D"],
      colores: ["#1d2b64", "#3a1c71", "#5b247a", "#2c3e7a"],
      instrucciones: {
        todos: "Pulso tranquilo. Escuchar al grupo.",
        guitarra: "Rasgueos lentos, uno por acorde. Fuzz bajo.",
        bateria: "Patrón SUAVE. Solo hi-hat y bombo.",
        teclados: "Sigue los acordes marcados en pantalla.",
        "teclado-3": "Bajo: la raíz de cada acorde, una vez por compás.",
        ambiente: "Mantener el drone. Colores siguen la progresión.",
      },
    },
    {
      nombre: "Construcción",
      inicio: "0:55",
      acordes: ["C", "G", "D", "Em"],
      colores: ["#5b247a", "#9b2c6f", "#c0392b", "#7a1f5c"],
      instrucciones: {
        todos: "Crecer de a poco hasta el muro.",
        guitarra: "Sube el fuzz. Rasgueos más seguidos.",
        bateria: "Patrón COMPLETO. Crash al inicio de cada 4 compases.",
        teclados: "Más volumen y abre el filtro poco a poco.",
        ambiente: "Mueve el XY hacia arriba y a la derecha.",
      },
    },
    {
      nombre: "Muro",
      inicio: "1:25",
      acordes: ["Em", "C", "G", "D"],
      colores: ["#ff4e50", "#f9d423", "#ff9a3c", "#ff2e63"],
      instrucciones: {
        todos: "Clímax: pared de sonido. Todo al máximo, sin saturar.",
        guitarra: "Modo SOSTENER + fuzz alto. Deja sonar.",
        bateria: "Patrón MURO. Crashes libres.",
        teclados: "Acordes sostenidos, octava arriba.",
        ambiente: "Destellos libres con los golpes de la batería.",
      },
    },
    {
      nombre: "Caída",
      inicio: "2:10",
      acordes: ["Cmaj7", "G", "D", "Em"],
      colores: ["#7a1f5c", "#3a1c71", "#1d2b64", "#16213e"],
      instrucciones: {
        todos: "Bajar la energía. Que se disuelva.",
        guitarra: "Última nota larga y apagar a 2:30.",
        bateria: "Patrón SUAVE y detener a 2:25.",
        teclados: "Solo notas largas. Bajen volumen.",
        ambiente: "Colores vuelven al azul. Bajen el XY.",
      },
    },
    {
      nombre: "Final",
      inicio: "2:35",
      acordes: ["Em"],
      compasesPorAcorde: 4,
      colores: ["#0b1026", "#000000"],
      instrucciones: {
        todos: "Solo ambientes. Fade out hasta el silencio.",
        ambiente: "Bajen el volumen de a poco. A 2:55 todo en negro.",
        "teclado-1": "Última nota Em, dejar morir.",
      },
    },
  ],

  // ------------------------------------------------------------------------
  // Avisos puntuales: aparecen como banner unos segundos antes de su tiempo.
  // perfiles: ["todos"] o lista de perfiles/grupos.
  // ------------------------------------------------------------------------
  eventos: [
    { t: "0:50", perfiles: ["todos"], texto: "En 5 s: Construcción" },
    { t: "1:20", perfiles: ["todos"], texto: "En 5 s: ¡MURO!" },
    { t: "1:25", perfiles: ["bateria"], texto: "¡Crash!" },
    { t: "2:25", perfiles: ["bateria"], texto: "Detener batería" },
    { t: "2:30", perfiles: ["guitarra"], texto: "Apagar guitarra" },
  ],

  // ------------------------------------------------------------------------
  // Sonidos propios por defecto (opcional). Pon archivos en la carpeta
  // sonidos/ y escribe su ruta. Si queda vacío se usan los sintetizados.
  // Cada músico también puede cargar sus propios archivos desde la página.
  // ------------------------------------------------------------------------
  sonidos: {
    // guitarra: "sonidos/guitarra.wav",
    // "teclado-1": "sonidos/pad.wav",
    // "ambiente-2": "sonidos/textura.wav",
    // bateria: { bombo: "sonidos/bombo.wav", caja: "sonidos/caja.wav" },
  },
};
