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
  duracion: "6:36.92",
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
    // ============================== PRIMERA MITAD: INTRO · DESARROLLO · OUTRO ==============================
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
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "Entran guitarra y teclados. Un acorde por compás: B♭m7 ↔ G♭maj7. Todo limpio todavía.",
        guitarra: "Melodía: A♭–D♭–C… (ver tu pista MIDI). La frase dura 4 compases.",
        "teclado-1": "Arpegio en negras A MEDIAS con el teclado 2: tú tocas el Fa (y el Re♭ largo sobre G♭); el teclado 2 toca el Si♭ y el La♭ entre medio.",
        "teclado-2": "Arpegio en negras A MEDIAS con el teclado 1: entre sus Fa tocas el Si♭ y el La♭ (F–B♭–F–A♭).",
        "teclado-3": "Raíz del acorde, una nota por compás (Si♭ / Sol♭).",
        "teclado-4": "Voz interior, a la par del bajo: una nota por compás (Fa sobre B♭m7, Sol♭ sobre G♭).",
        bateria: "SIN PLATILLOS (W).",
        "ambiente-4": "Pulso suave sobre la línea media.",
      },
    },
    {
      nombre: "Intro · Platillos y distorsión",
      inicio: "0:33.23",                   // compases 19–22
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#2a2f8f", "#3a2f9a"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        "teclado-1": "Sigue el arpegio con el teclado 2: tus notas son las graves: Re♭, Fa y Sol♭.",
        todos: "Entran los platillos y la distorsión en los teclados medios.",
        teclados: "Sube la DISTORSIÓN (≈ 20 %) y déjala así.",
        "teclado-3": "Bajo todavía limpio.",
        guitarra: "Arriba alternas Do y Mi♭ (ver tu pista MIDI). Al final de esta parte callas.",
        "teclado-2": "Sigue el arpegio con el teclado 1: tus notas son las agudas: La♭, Si♭, Do y Re♭.",
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
        "teclado-2": "PEDAL F: mantén el Fa agudo (tu tecla más aguda) sobre los dos acordes, junto con ambiente 3, y con la otra mano sigue tus notas del arpegio.",
        guitarra: "Silencio. Vuelves en 1:17 con el solo.",
        bateria: "CON PLATILLOS (E).",
      },
    },
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
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "Todo SIN distorsión. Vuelve la melodía (solo).",
        teclados: "Distorsión a 0.",
        guitarra: "SOLO: la melodía otra vez, A♭–D♭–C…",
        "teclado-2": "Suelta el Fa agudo. Sigue el arpegio con el teclado 1: La♭ y Do.",
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
        "teclado-2": "Silencio: en esta parte solo toca el teclado 1.",
        todos: "G♭ se alarga TRES compases. Prepara el muro de 1:32.",
        guitarra: "Sostén el Do agudo.",
      },
    },
    {
      nombre: "Desarrollo · Muro",
      inicio: "1:32.31",                   // compases 51–58
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#b0245e", "#c0392b"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        "teclado-2": "Arpegio con el teclado 1: tus notas son las agudas: La♭, Si♭, Do y Re♭.",
        "teclado-1": "Arpegio con el teclado 2: tus notas son las graves: Re♭, Fa y Sol♭.",
        todos: "Ahora los acordes duran DOS compases. La melodía sigue igual.",
        teclados: "Distorsión ≈ 20 %. Acordes de dos compases.",
        bateria: "CON PLATILLOS (E).",
        ambiente: "Ambiente y luces hacia el rojo.",
      },
    },
    {
      nombre: "Desarrollo · Teclados altos",
      inicio: "1:47.08",                   // compases 59–66
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#ff4e50", "#ff7a3c"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        "teclado-2": "Arpegio con el teclado 1: tus notas son las agudas: La♭, Si♭, Do y Re♭.",
        "teclado-1": "Arpegio con el teclado 2: tus notas son las graves: Re♭, Fa y Sol♭.",
        todos: "Clímax.",
        guitarra: "Variante de la melodía con Fa agudo. En 1:54 haz un pequeño desfase: atrásate un poco. Distorsión alta.",
        bateria: "CON PLATILLOS (E), o MURO (R) si quieres más.",
        ambiente: "Rojo al máximo. Destellos con la batería.",
      },
    },
    {
      nombre: "Outro · Medios",
      inicio: "2:01.85",                   // compases 67–74
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#c0392b", "#9b2c6f"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        "teclado-2": "Arpegio con el teclado 1: tus notas son las agudas: La♭, Si♭, Do y Re♭.",
        "teclado-1": "Arpegio con el teclado 2: tus notas son las graves: Re♭, Fa y Sol♭.",
        todos: "Outro: siguen todos; la melodía con Fa hace sus dos últimas frases.",
        bateria: "CON PLATILLOS (E).",
      },
    },
    {
      nombre: "Outro · Dos líneas",
      inicio: "2:16.62",    // compases 75–82
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#5b247a", "#3a1c71"],
      tocan: ["bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-3", "ambiente-4"],
      instrucciones: {
        todos: "Sale la melodía, vuelve el pedal en Fa. Las líneas bajas bajan de volumen.",
        "teclado-2": "PEDAL F otra vez (tu tecla más aguda) y, encima, tus notas del arpegio.",
        guitarra: "Silencio.",
        "ambiente-3": "PEDAL F otra vez.",
        "ambiente-principal": "Empieza a desvanecerse poco a poco.",
        teclados: "Baja el volumen de a poco.",
      },
    },
    // ============================== ESPEJO: OUTRO 2 · DESARROLLO 2 (al revés) ==============================
    {
      nombre: "Outro · Dos líneas 2",
      inicio: "2:31.38",    // compases 83–90
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#5b247a", "#3a1c71"],
      tocan: ["bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-3", "ambiente-4"],
      instrucciones: {
        todos: "La obra vuelve sobre sus pasos: sigue el pedal en Fa y las líneas bajas VUELVEN A SUBIR de volumen.",
        "teclado-2": "PEDAL F (tu tecla más aguda) y, encima, tus notas del arpegio.",
        guitarra: "Silencio.",
        "ambiente-3": "PEDAL F.",
        "ambiente-principal": "Vuelve a crecer poco a poco.",
        teclados: "Sube el volumen de a poco.",
      },
    },
    {
      nombre: "Outro · Medios 2",
      inicio: "2:46.15",    // compases 91–98
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#c0392b", "#9b2c6f"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        "teclado-2": "Arpegio con el teclado 1: tus notas son las agudas: La♭, Si♭, Do y Re♭.",
        "teclado-1": "Arpegio con el teclado 2: tus notas son las graves: Re♭, Fa y Sol♭.",
        todos: "Siguen todos; vuelve la melodía con Fa.",
        bateria: "CON PLATILLOS (E).",
      },
    },
    {
      nombre: "Desarrollo 2 · Teclados altos",
      inicio: "3:00.92",    // compases 99–106
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#ff4e50", "#ff7a3c"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        "teclado-2": "Arpegio con el teclado 1: tus notas son las agudas: La♭, Si♭, Do y Re♭.",
        "teclado-1": "Arpegio con el teclado 2: tus notas son las graves: Re♭, Fa y Sol♭.",
        todos: "Clímax otra vez.",
        guitarra: "Variante de la melodía con Fa agudo. Distorsión alta.",
        bateria: "CON PLATILLOS (E), o MURO (R) si quieres más.",
        ambiente: "Rojo al máximo.",
      },
    },
    {
      nombre: "Desarrollo 2 · Muro",
      inicio: "3:15.69",    // compases 107–114
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#b0245e", "#c0392b"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        "teclado-2": "Arpegio con el teclado 1: tus notas son las agudas: La♭, Si♭, Do y Re♭.",
        "teclado-1": "Arpegio con el teclado 2: tus notas son las graves: Re♭, Fa y Sol♭.",
        todos: "Muro: acordes de DOS compases.",
        teclados: "Distorsión ≈ 20 %.",
        bateria: "CON PLATILLOS (E).",
        ambiente: "Ambiente y luces todavía en rojo.",
      },
    },
    {
      nombre: "Desarrollo 2 · Bisagra en Sol♭",
      inicio: "3:30.46",    // compases 115–117
      acordes: ["Gbmaj7"], compasesPorAcorde: 4,
      colores: ["#6a3fb0"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        "teclado-2": "Silencio: en esta parte solo toca el teclado 1.",
        todos: "G♭ se alarga TRES compases: el muro se desarma y la distorsión baja.",
        guitarra: "Sostén el Do agudo.",
      },
    },
    {
      nombre: "Desarrollo 2 · Limpio",
      inicio: "3:36.00",    // compases 118–122
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#3b3f8f", "#2c4a9a"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "Todo SIN distorsión. La melodía otra vez (solo).",
        teclados: "Distorsión a 0.",
        guitarra: "SOLO: la melodía, A♭–D♭–C…",
        "teclado-2": "Sigue el arpegio con el teclado 1: La♭ y Do.",
        bateria: "SIN PLATILLOS (W).",
        "ambiente-3": "Silencio.",
      },
    },
    {
      nombre: "Desarrollo 2 · Platillos",
      inicio: "3:45.23",    // compases 123–126
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#7a1f7c", "#6b2a8a"],
      tocan: ["bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-3", "ambiente-4"],
      instrucciones: {
        bateria: "CON PLATILLOS (E).",
        ambiente: "Baja la intensidad (Y) de a poco.",
        "teclado-2": "Vuelve el Fa agudo largo (pedal).",
        guitarra: "Silencio.",
        teclados: "La distorsión baja de a poco.",
      },
    },
    {
      nombre: "Desarrollo 2 · Sin platillos",
      inicio: "3:52.62",    // compases 127–130
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#5b247a", "#4a206e"],
      tocan: ["bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-3", "ambiente-4"],
      instrucciones: {
        todos: "Sin platillos. El arpegio medio en notas largas. Después viene la improvisación.",
        bateria: "SIN PLATILLOS (W).",
        "teclado-1": "Notas largas: Fa sobre B♭m7, Sol♭ sobre G♭.",
        "teclado-2": "Sigue el Fa agudo.",
        guitarra: "Silencio.",
      },
    },
    // ============================== IMPROVISACIÓN ==============================
    {
      nombre: "Improvisación",
      inicio: "4:00.00",    // compases 131–162 (1:00)
      libre: true,                          // sin notas que caen: cada uno improvisa
      acordes: ["Bbm7", "Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#6b2a8a", "#b0245e"],
      tocan: ["guitarra", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-3"],
      instrucciones: {
        todos: "IMPROVISACIÓN (1 min): B♭m7 ↔ G♭maj7, dos compases cada uno. No caen notas: toca libre con tus teclas (las del acorde suenan seguras). Escucha y deja espacio.",
        "teclado-3": "Puedes sostener la raíz (Si♭ / Sol♭) como base o improvisar en lo grave.",
        "teclado-4": "Puedes sostener la voz interior (Fa / Sol♭) junto al bajo o improvisar en el registro medio.",
        ambiente: "Los efectos suben y bajan solos, entre el desarrollo y el outro: sigue la guía X/Y.",
      },
    },
    // ============================== INTRO 2 (al revés) ==============================
    {
      nombre: "Intro 2 · Pedal F",
      inicio: "4:59.08",    // compases 163–174
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#4b2ca0", "#3a1c71"],
      tocan: ["bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-3", "ambiente-4"],
      instrucciones: {
        todos: "Intro al revés: pedal agudo en Fa sobre los dos acordes.",
        "teclado-2": "PEDAL F: mantén el Fa agudo (tu tecla más aguda) y con la otra mano sigue tus notas del arpegio.",
        "ambiente-3": "PEDAL F: Fa agudo sostenido.",
        guitarra: "Silencio.",
        bateria: "CON PLATILLOS (E).",
      },
    },
    {
      nombre: "Intro 2 · Platillos y distorsión",
      inicio: "5:21.23",    // compases 175–178
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#2a2f8f", "#3a2f9a"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        "teclado-1": "Sigue el arpegio con el teclado 2: tus notas son las graves: Re♭, Fa y Sol♭.",
        "teclado-2": "Sigue el arpegio con el teclado 1: tus notas son las agudas: La♭, Si♭, Do y Re♭.",
        todos: "Vuelve la melodía; la distorsión de los teclados medios baja de a poco.",
        teclados: "Baja la DISTORSIÓN hasta casi limpio.",
        "teclado-3": "Bajo limpio.",
        guitarra: "Arriba alternas Do y Mi♭ (ver tu pista MIDI).",
        bateria: "CON PLATILLOS (E).",
      },
    },
    {
      nombre: "Intro 2 · Guitarra y teclados",
      inicio: "5:28.62",    // compases 179–186
      acordes: ["Bbm7", "Gbmaj7"],
      colores: ["#1d2b64", "#23307a"],
      tocan: ["guitarra", "bateria", "teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        todos: "Todo limpio: un acorde por compás, B♭m7 ↔ G♭maj7. Al final de esta parte salen la melodía y los teclados.",
        guitarra: "Melodía: A♭–D♭–C… (ver tu pista MIDI).",
        "teclado-1": "Arpegio A MEDIAS con el teclado 2: tú tocas el Fa (y el Re♭ largo sobre G♭).",
        "teclado-2": "Arpegio A MEDIAS con el teclado 1: entre sus Fa tocas el Si♭ y el La♭.",
        "teclado-3": "Raíz del acorde, una nota por compás (Si♭ / Sol♭).",
        "teclado-4": "Voz interior, a la par del bajo: una nota por compás (Fa sobre B♭m7, Sol♭ sobre G♭).",
        bateria: "SIN PLATILLOS (W).",
      },
    },
    {
      nombre: "Intro 2 · Ritmo",
      inicio: "5:43.38",    // compases 187–194
      acordes: ["Db"], compasesPorAcorde: 4,
      colores: ["#101a4a"],
      tocan: ["bateria", "ambiente-1", "ambiente-2"],
      instrucciones: {
        todos: "Salen los teclados: queda el drone en Re♭.",
        bateria: "SIN PLATILLOS (W): bombo y caja.",
        ambiente: "Drone en Re♭. Colores azules oscuros.",
      },
    },
    {
      nombre: "Intro 2 · Distorsión ambiente",
      inicio: "5:58.15",    // compases 195–196
      acordes: ["Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#0b1026"],
      tocan: ["ambiente-1", "ambiente-2"],
      instrucciones: {
        todos: "Solo ambiente, casi limpio. Después vuelven los teclados para el desenlace.",
        "ambiente-principal": "Colchón de G♭ sobre Si♭ grave. Baja la distorsión (X).",
      },
    },
    // ============================== DESENLACE ==============================
    {
      nombre: "Desenlace · Sin batería",
      inicio: "6:01.85",    // compases 197–205
      acordes: ["Bbm7"], compasesPorAcorde: 1,
      colores: ["#23307a"],
      tocan: ["teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-3", "ambiente-4"],
      instrucciones: {
        todos: "Desenlace: vuelven los teclados sobre B♭m7, suave (el bajo baja a La♭ un momento).",
        "teclado-2": "Mantén el Fa agudo y sigue tus notas del arpegio (las agudas).",
        "teclado-3": "Distorsión muy baja (≈ 5 %): más limpio.",
        bateria: "Silencio.",
      },
    },
    {
      nombre: "Desenlace · Hacia Re♭",
      inicio: "6:18.46",    // compases 206–207
      acordes: ["Gbmaj7"], compasesPorAcorde: 2,
      colores: ["#2c2a6e"],
      tocan: ["teclado-1", "teclado-2", "teclado-3", "teclado-4", "ambiente-1"],
      instrucciones: {
        todos: "G♭maj7 dos compases: la cadencia suave que lleva al final.",
        "teclado-2": "Suelta el Fa agudo: una nota (Si♭) y silencio.",
        "teclado-1": "Sol♭ largo.",
      },
    },
    {
      nombre: "Desenlace · Resolución en Re♭",
      inicio: "6:22.15",    // compases 208–215
      acordes: ["Db"], compasesPorAcorde: 8,
      colores: ["#0b1026"],
      tocan: ["guitarra", "teclado-1", "teclado-3", "teclado-4", "ambiente-1", "ambiente-2", "ambiente-4"],
      instrucciones: {
        "teclado-1": "Re♭ largo: la resolución es tuya.",
        todos: "Resuelve en Re♭, LENTO (8 compases), y deja morir.",
        guitarra: "Últimas notas, lentas: Re♭–Mi♭–Re♭.",
        "teclado-2": "Silencio.",
        "ambiente-3": "Silencio. Las luces se apagan hacia el final.",
      },
    },
  ],

  eventos: [
    { t: "0:03.69", perfiles: ["bateria"], texto: "Ritmo: SIN PLATILLOS (W)" },
    { t: "0:13.46", perfiles: ["todos"], texto: "En 5 s: entran guitarra y teclados" },
    { t: "0:28.23", perfiles: ["todos"], texto: "En 5 s: platillos y distorsión" },
    { t: "0:35.62", perfiles: ["guitarra"], texto: "En 5 s: silencio" },
    { t: "0:35.62", perfiles: ["teclado-2", "ambiente-3"], texto: "En 5 s: Fa agudo largo (pedal F)" },
    { t: "0:57.77", perfiles: ["todos"], texto: "En 5 s: Desarrollo" },
    { t: "1:12.54", perfiles: ["teclados"], texto: "En 5 s: quita la distorsión" },
    { t: "1:12.54", perfiles: ["guitarra"], texto: "En 5 s: vuelve la melodía (solo)" },
    { t: "1:12.54", perfiles: ["teclado-2"], texto: "En 5 s: suelta el Fa agudo" },
    { t: "1:21.77", perfiles: ["todos"], texto: "En 5 s: G♭ largo (3 compases)" },
    { t: "1:27.31", perfiles: ["todos"], texto: "En 5 s: MURO, acordes de 2 compases" },
    { t: "1:42.08", perfiles: ["guitarra"], texto: "En 5 s: variante con Fa" },
    { t: "1:54.46", perfiles: ["guitarra"], texto: "Desfase" },
    { t: "2:11.62", perfiles: ["guitarra"], texto: "En 5 s: silencio" },
    { t: "2:11.62", perfiles: ["teclado-2", "ambiente-3"], texto: "En 5 s: vuelve el pedal F" },
    { t: "2:16.62", perfiles: ["ambiente-principal"], texto: "Empieza a desvanecer" },
    { t: "2:26.38", perfiles: ["todos"], texto: "En 5 s: la obra vuelve hacia atrás (Dos líneas 2)" },
    { t: "3:31.00", perfiles: ["teclados"], texto: "En 5 s: quita la distorsión" },
    { t: "3:40.23", perfiles: ["teclado-2", "ambiente-3"], texto: "En 5 s: vuelve el Fa agudo largo" },
    { t: "3:55.00", perfiles: ["todos"], texto: "En 5 s: IMPROVISACIÓN (1 min)" },
    { t: "4:54.08", perfiles: ["todos"], texto: "En 5 s: Intro 2" },
    { t: "4:54.08", perfiles: ["teclado-2", "ambiente-3"], texto: "En 5 s: Fa agudo largo (pedal F)" },
    { t: "5:38.38", perfiles: ["teclados"], texto: "En 5 s: salen los teclados" },
    { t: "5:56.85", perfiles: ["todos"], texto: "En 5 s: desenlace" },
    { t: "6:13.46", perfiles: ["teclado-2"], texto: "En 5 s: suelta el Fa agudo" },
    { t: "6:17.15", perfiles: ["todos"], texto: "En 5 s: resolución en Re♭ (lenta)" },
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
    { desde: "0:03.69", bateria: { vol: [0.63, 0.98], reverb: 0.35, drive: 0.03 } },                              // la batería entra de a poco
    { desde: "0:18.46", teclados: { dist: 0, filtro: 0.42, reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.02, filtro: 0.32 },
                        guitarra: { fuzz: 0.05, tono: 0.38, reverb: 0.45 }, bateria: { vol: 0.98, reverb: 0.3, drive: 0.04 } },
    { desde: "0:33.23", teclados: { dist: [0.11, 0.22], filtro: 0.46, reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.04, filtro: 0.36 },
                        guitarra: { fuzz: 0.1, tono: 0.4, reverb: 0.45 }, bateria: { vol: 1.09, reverb: 0.28, drive: 0.07 } },
    { desde: "0:40.62", teclados: { dist: 0.22, filtro: 0.48, reverb: 0.4 }, "teclado-2": { dist: 0.05, filtro: 0.5, reverb: 0.65 },
                        "teclado-3": { vol: 1.6, dist: 0.09, filtro: 0.36 }, bateria: { vol: 1.09, reverb: 0.28, drive: 0.07 } },
    { desde: "1:02.77", teclados: { dist: 0.18, filtro: 0.44, reverb: 0.45 }, "teclado-1": { filtro: 0.4 },
                        "teclado-3": { vol: 1.6, dist: 0.09, filtro: 0.36 }, bateria: { vol: 0.98, reverb: 0.3, drive: 0.05 } },
    { desde: "1:10.15", teclados: { dist: [0.18, 0.23], filtro: [0.44, 0.49], reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.11, filtro: 0.4 },
                        bateria: { vol: 1.09, reverb: 0.28, drive: 0.08 } },
    { desde: "1:17.54", teclados: { dist: 0, filtro: 0.4, reverb: 0.5 }, guitarra: { fuzz: 0.03, tono: 0.42, reverb: 0.55 },   // todo limpio: el solo
                        bateria: { vol: 0.86, reverb: 0.35, drive: 0.02 } },
    { desde: "1:26.77", teclados: { dist: [0, 0.16], filtro: [0.4, 0.52], reverb: 0.45 }, guitarra: { fuzz: [0.03, 0.11], tono: 0.42 }, // subida al muro
                        bateria: { vol: [0.86, 1.15], reverb: 0.3, drive: [0.02, 0.09] } },
    { desde: "1:32.31", teclados: { dist: 0.23, filtro: 0.51, reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.13, filtro: 0.42 },
                        guitarra: { vol: 0.85, fuzz: 0.14, tono: 0.42, reverb: 0.5 }, bateria: { vol: 1.15, reverb: 0.25, drive: 0.11 } },
    { desde: "1:47.08", teclados: { dist: 0.27, filtro: 0.55, reverb: 0.42 }, "teclado-3": { vol: 1.6, dist: 0.14, filtro: 0.44 },              // clímax
                        guitarra: { vol: 0.85, fuzz: 0.17, tono: 0.43, reverb: 0.55 }, bateria: { vol: 1.15, reverb: 0.25, drive: 0.14 } },
    { desde: "2:01.85", teclados: { dist: 0.22, filtro: 0.49, reverb: 0.45 }, "teclado-3": { vol: 1.6, dist: 0.11, filtro: 0.4 },
                        guitarra: { vol: 0.85, fuzz: [0.14, 0.11], tono: 0.42, reverb: 0.55 }, bateria: { vol: 1.06, reverb: 0.28, drive: 0.09 } },
    { desde: "2:16.62", teclados: { dist: [0.22, 0.13], filtro: [0.49, 0.42], reverb: 0.5, vol: [1, 0.6] }, "teclado-2": { reverb: 0.75 }, // se desvanece
                        bateria: { vol: [1.03, 0.69], reverb: 0.32, drive: [0.09, 0.04] } },
    { desde: "2:31.38", teclados: { dist: [0.13, 0.22], filtro: [0.42, 0.49], reverb: 0.5, vol: [0.6, 1] }, "teclado-2": { reverb: 0.75 }, bateria: { vol: [0.69, 1.03], reverb: 0.32, drive: [0.04, 0.09] } },   // Dos líneas 2: vuelve a subir
    { desde: "2:46.15", teclados: { dist: 0.22, filtro: 0.49, reverb: 0.45 }, "teclado-3": { vol: 1.6, dist: 0.11, filtro: 0.4 }, guitarra: { vol: 0.85, fuzz: [0.11, 0.14], tono: 0.42, reverb: 0.55 }, bateria: { vol: 1.06, reverb: 0.28, drive: 0.09 } },   // Medios 2
    { desde: "3:00.92", teclados: { dist: 0.27, filtro: 0.55, reverb: 0.42 }, "teclado-3": { vol: 1.6, dist: 0.14, filtro: 0.44 }, guitarra: { vol: 0.85, fuzz: 0.17, tono: 0.43, reverb: 0.55 }, bateria: { vol: 1.15, reverb: 0.25, drive: 0.14 } },   // Desarrollo 2 · Teclados altos (clímax)
    { desde: "3:15.69", teclados: { dist: 0.23, filtro: 0.51, reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.13, filtro: 0.42 }, guitarra: { vol: 0.85, fuzz: 0.14, tono: 0.42, reverb: 0.5 }, bateria: { vol: 1.15, reverb: 0.25, drive: 0.11 } },   // Muro 2
    { desde: "3:30.46", teclados: { dist: [0.16, 0], filtro: [0.52, 0.4], reverb: 0.45 }, guitarra: { fuzz: [0.11, 0.03], tono: 0.42 }, bateria: { vol: [1.15, 0.86], reverb: 0.3, drive: [0.09, 0.02] } },   // Bisagra 2: baja desde el muro
    { desde: "3:36.00", teclados: { dist: 0, filtro: 0.4, reverb: 0.5 }, guitarra: { fuzz: 0.03, tono: 0.42, reverb: 0.55 }, bateria: { vol: 0.86, reverb: 0.35, drive: 0.02 } },   // Limpio 2
    { desde: "3:45.23", teclados: { dist: [0.23, 0.18], filtro: [0.49, 0.44], reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.11, filtro: 0.4 }, bateria: { vol: 1.09, reverb: 0.28, drive: 0.08 } },   // Platillos 2
    { desde: "3:52.62", teclados: { dist: 0.18, filtro: 0.44, reverb: 0.45 }, "teclado-1": { filtro: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.09, filtro: 0.36 }, bateria: { vol: 0.98, reverb: 0.3, drive: 0.05 } },   // Sin platillos 2
    { desde: "4:00.00", teclados: { dist: [0.23, 0.13], filtro: [0.51, 0.42], reverb: [0.4, 0.5], vol: [1, 0.75] }, "teclado-2": { reverb: [0.4, 0.75] }, "teclado-3": { vol: [1.6, 1.3], dist: [0.13, 0.09], filtro: [0.42, 0.4] }, guitarra: { vol: 0.85, fuzz: [0.14, 0.08], tono: [0.42, 0.4], reverb: [0.5, 0.6] } },   // improvisación: del desarrollo al outro y de vuelta
    { desde: "4:14.77", teclados: { dist: [0.13, 0.23], filtro: [0.42, 0.51], reverb: [0.5, 0.4], vol: [0.75, 1] }, "teclado-2": { reverb: [0.75, 0.4] }, "teclado-3": { vol: [1.3, 1.6], dist: [0.09, 0.13], filtro: [0.4, 0.42] }, guitarra: { vol: 0.85, fuzz: [0.08, 0.14], tono: [0.4, 0.42], reverb: [0.6, 0.5] } },
    { desde: "4:29.54", teclados: { dist: [0.23, 0.13], filtro: [0.51, 0.42], reverb: [0.4, 0.5], vol: [1, 0.75] }, "teclado-2": { reverb: [0.4, 0.75] }, "teclado-3": { vol: [1.6, 1.3], dist: [0.13, 0.09], filtro: [0.42, 0.4] }, guitarra: { vol: 0.85, fuzz: [0.14, 0.08], tono: [0.42, 0.4], reverb: [0.5, 0.6] } },
    { desde: "4:44.31", teclados: { dist: [0.13, 0.23], filtro: [0.42, 0.51], reverb: [0.5, 0.4], vol: [0.75, 1] }, "teclado-2": { reverb: [0.75, 0.4] }, "teclado-3": { vol: [1.3, 1.6], dist: [0.09, 0.13], filtro: [0.4, 0.42] }, guitarra: { vol: 0.85, fuzz: [0.08, 0.14], tono: [0.4, 0.42], reverb: [0.6, 0.5] } },
    { desde: "4:59.08", teclados: { dist: 0.22, filtro: 0.48, reverb: 0.4 }, "teclado-2": { dist: 0.05, filtro: 0.5, reverb: 0.65 }, "teclado-3": { vol: 1.6, dist: 0.09, filtro: 0.36 }, bateria: { vol: 1.09, reverb: 0.28, drive: 0.07 } },   // Intro 2 · Pedal F
    { desde: "5:21.23", teclados: { dist: [0.22, 0.11], filtro: 0.46, reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.04, filtro: 0.36 }, guitarra: { fuzz: 0.1, tono: 0.4, reverb: 0.45 }, bateria: { vol: 1.09, reverb: 0.28, drive: 0.07 } },   // Platillos y distorsión 2: la distorsión baja
    { desde: "5:28.62", teclados: { dist: 0, filtro: 0.42, reverb: 0.4 }, "teclado-3": { vol: 1.6, dist: 0.02, filtro: 0.32 }, guitarra: { fuzz: 0.05, tono: 0.38, reverb: 0.45 }, bateria: { vol: 0.98, reverb: 0.3, drive: 0.04 } },   // Guitarra y teclados 2
    { desde: "5:43.38", bateria: { vol: [0.98, 0.63], reverb: 0.35, drive: 0.03 } },   // Ritmo 2
    { desde: "5:58.15", todos: { reverb: 0.6 } },   // Distorsión ambiente 2
    { desde: "6:01.85", teclados: { dist: 0.11, filtro: 0.4, reverb: 0.55, vol: 0.6 }, "teclado-3": { dist: 0.07, vol: 0.75 }, "teclado-4": { vol: 0.65 } },   // desenlace: vuelven los teclados, suaves
    { desde: "6:18.46", teclados: { dist: [0.11, 0.07], filtro: [0.4, 0.36], reverb: [0.55, 0.62], vol: 0.6 }, "teclado-3": { dist: 0.05, vol: 0.75 }, "teclado-4": { vol: 0.65 } },   // G♭maj7: cadencia plagal
    { desde: "6:22.15", teclados: { dist: [0.06, 0.03], filtro: [0.36, 0.32], reverb: [0.62, 0.75], vol: [0.6, 0.42] }, "teclado-3": { dist: 0.04, vol: [0.75, 0.5] }, "teclado-4": { vol: [0.65, 0.45] }, guitarra: { fuzz: 0.04, tono: 0.38, reverb: [0.65, 0.78], vol: [0.85, 0.6] } },   // Re♭: se apaga despacio…
    { desde: "6:29.54", teclados: { dist: [0.03, 0], filtro: [0.32, 0.24], reverb: [0.75, 0.9], vol: [0.42, 0] }, "teclado-3": { dist: 0.02, vol: [0.5, 0] }, "teclado-4": { vol: [0.45, 0] }, guitarra: { fuzz: 0.02, tono: [0.38, 0.34], reverb: [0.78, 0.9], vol: [0.6, 0] } },   // …y muere
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
    // Reparto (versión 2): la línea de la pista Medio se divide entre los teclados 1 y 2 por altura, así cada uno
    // toca pocas notas y se van alternando (F–B♭–F–A♭ = 1–2–1–2). notas: alturas MIDI que le tocan a cada uno.
    // volumen: { altura: factor } para que una nota suene más baja (o más alta) que las demás, a mano y en la orquesta.
    reparto: {
      "teclado-1": { pistas: ["medio"], notas: [61, 65, 66] },           // Re♭4, Fa4, Sol♭4
      "teclado-2": { pistas: ["medio", "pedal"], notas: [68, 70, 72, 73, 77],  // La♭4, Si♭4, Do5, Re♭5 y el Fa5 del pedal
                     volumen: { 77: 0.4 } },   // el Fa agudo del pedal suena largo y se come al resto: va más bajo (≈ −8 dB)
      "teclado-4": { pistas: ["pad"], notas: [53, 54] },              // voz interior del pad: Fa3 (B♭m7) / Sol♭3 (G♭maj7), una por compás como el bajo
    },
    // midi/genesis_completo.mid tiene todas las pistas juntas (para abrirlo en un DAW o MuseScore).
  },

  // Guía del recuadro X/Y de los ambientes: dónde poner el mouse para que suene como debe.
  // [tiempo, X (0 = limpio … 1 = distorsión), Y (0 = silencio … 1 = intenso)].
  // Entre un punto y el siguiente la guía se mueve en línea recta; dos puntos muy juntos = cambio brusco.
  // Las notas que suenan las pone la pista MIDI del perfil (midi.porPerfil).
  // Se busca la clave más específica: ambiente-1 … ambiente-4, luego ambiente-principal / ambiente-extra.
  guiaXY: {
    // X = distorsión, Y = intensidad. La segunda mitad es el espejo de la primera (Outro 2 y Desarrollo 2 = compases 35–82 al revés;
    // Intro 2 = compases 1–34 al revés). En la improvisación va y viene entre el desarrollo y el outro; el desenlace se apaga despacio.
    "bateria": [
      ["0:00.00", 0.10, 0.00],
      ["0:03.60", 0.10, 0.00],
      ["0:03.69", 0.12, 0.30],
      ["0:18.46", 0.25, 0.55],
      ["0:33.23", 0.45, 0.65],
      ["1:02.77", 0.35, 0.55],
      ["1:10.15", 0.50, 0.65],
      ["1:17.04", 0.55, 0.68],
      ["1:17.54", 0.05, 0.38],
      ["1:26.77", 0.08, 0.42],
      ["1:32.31", 0.75, 0.85],
      ["1:47.08", 0.92, 0.95],
      ["2:01.85", 0.70, 0.80],
      ["2:16.62", 0.55, 0.70],
      ["2:31.28", 0.30, 0.30],
      ["2:31.37", 0.30, 0.02],
      ["2:31.38", 0.30, 0.02],
      ["2:31.39", 0.30, 0.00],
      ["2:31.49", 0.30, 0.30],
      ["2:46.15", 0.55, 0.70],
      ["3:00.92", 0.70, 0.80],
      ["3:15.69", 0.92, 0.95],
      ["3:30.46", 0.75, 0.85],
      ["3:36.00", 0.08, 0.42],
      ["3:45.23", 0.05, 0.38],
      ["3:45.73", 0.55, 0.68],
      ["3:52.62", 0.50, 0.65],
      ["3:59.99", 0.35, 0.55],
      ["3:60.00", 0.35, 0.55],
      ["4:00.00", 0.75, 0.85],
      ["4:14.77", 0.55, 0.70],
      ["4:29.54", 0.75, 0.85],
      ["4:44.31", 0.55, 0.70],
      ["4:59.07", 0.75, 0.85],
      ["4:59.08", 0.35, 0.55],
      ["5:28.62", 0.45, 0.65],
      ["5:43.39", 0.25, 0.55],
      ["5:58.16", 0.12, 0.30],
      ["5:58.25", 0.10, 0.00],
      ["6:01.84", 0.10, 0.00],
      ["6:01.85", 0.30, 0.00],
      ["6:36.92", 0.30, 0.00],
    ],
    "ambiente-principal": [
      ["0:00.00", 0.05, 0.40],
      ["0:18.46", 0.30, 0.50],
      ["0:33.23", 0.45, 0.60],
      ["1:02.77", 0.45, 0.55],
      ["1:10.15", 0.55, 0.70],
      ["1:17.04", 0.60, 0.75],
      ["1:17.54", 0.15, 0.45],
      ["1:31.81", 0.20, 0.50],
      ["1:32.31", 0.65, 0.80],
      ["1:47.08", 0.85, 0.95],
      ["2:01.85", 0.70, 0.80],
      ["2:16.62", 0.55, 0.65],
      ["2:31.37", 0.41, 0.49],
      ["2:31.38", 0.41, 0.49],
      ["2:46.15", 0.55, 0.65],
      ["3:00.92", 0.70, 0.80],
      ["3:15.69", 0.85, 0.95],
      ["3:30.46", 0.65, 0.80],
      ["3:30.96", 0.20, 0.50],
      ["3:45.23", 0.15, 0.45],
      ["3:45.73", 0.60, 0.75],
      ["3:52.62", 0.55, 0.70],
      ["3:59.99", 0.45, 0.55],
      ["3:60.00", 0.45, 0.55],
      ["4:00.00", 0.65, 0.80],
      ["4:14.77", 0.55, 0.65],
      ["4:29.54", 0.65, 0.80],
      ["4:44.31", 0.55, 0.65],
      ["4:59.07", 0.65, 0.80],
      ["4:59.08", 0.45, 0.55],
      ["5:28.62", 0.45, 0.60],
      ["5:43.39", 0.30, 0.50],
      ["6:01.84", 0.05, 0.40],
      ["6:01.85", 0.40, 0.48],
      ["6:18.46", 0.33, 0.40],
      ["6:22.15", 0.25, 0.30],
      ["6:29.54", 0.18, 0.18],
      ["6:36.92", 0.08, 0.00],
    ],
    "ambiente-extra": [
      ["0:00.00", 0.10, 0.20],
      ["0:18.46", 0.25, 0.35],
      ["0:33.23", 0.40, 0.50],
      ["1:10.15", 0.50, 0.65],
      ["1:17.04", 0.55, 0.70],
      ["1:17.54", 0.15, 0.35],
      ["1:31.81", 0.20, 0.40],
      ["1:32.31", 0.65, 0.75],
      ["1:47.08", 0.85, 0.90],
      ["2:01.85", 0.60, 0.70],
      ["2:16.62", 0.45, 0.85],
      ["2:31.37", 0.36, 0.64],
      ["2:31.38", 0.36, 0.64],
      ["2:46.15", 0.45, 0.85],
      ["3:00.92", 0.60, 0.70],
      ["3:15.69", 0.85, 0.90],
      ["3:30.46", 0.65, 0.75],
      ["3:30.96", 0.20, 0.40],
      ["3:45.23", 0.15, 0.35],
      ["3:45.73", 0.55, 0.70],
      ["3:52.62", 0.50, 0.65],
      ["3:59.99", 0.48, 0.62],
      ["4:00.00", 0.65, 0.75],
      ["4:14.77", 0.45, 0.85],
      ["4:29.54", 0.65, 0.75],
      ["4:44.31", 0.45, 0.85],
      ["4:59.07", 0.65, 0.75],
      ["4:59.08", 0.48, 0.62],
      ["5:28.62", 0.40, 0.50],
      ["5:43.39", 0.25, 0.35],
      ["6:01.84", 0.10, 0.20],
      ["6:01.85", 0.36, 0.64],
      ["6:18.46", 0.30, 0.50],
      ["6:22.15", 0.25, 0.40],
      ["6:29.54", 0.18, 0.22],
      ["6:36.92", 0.08, 0.00],
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
