/* PARTE DE GUITARRA REAL — partitura + tablatura (alphaTex, la dibuja alphaTab en lib/alphatab/)
   Compás 1 = 0:00 del reloj de la obra (130 BPM, 4/4: un compás = 1,846 s), así que el número de compás
   de la partitura es el mismo que el del reloj. La guitarra toca en los compases 11–22, 43–74 y 92–95.

   Es una parte propia sobre los acordes de la obra (B♭m7 · G♭maj7 · D♭): arpegios, muro y líneas solistas
   pensadas para guitarra eléctrica. No es la melodía de la grabación original.

   Afinación estándar, sin cejilla. Casi todo pasa alrededor del traste 9: B♭m7, G♭maj7 y D♭ comparten
   arriba el Re♭ del traste 9 en la 1.ª cuerda, que queda sonando como un pedal. */
(function () {
  const R = n => Array(n).fill("r.1").join(" | ");   // n compases de silencio

  // Acordes (de la 1.ª a la 6.ª cuerda, x = no suena)
  const ACORDES = [
    ["Bbm7", "9 9 10 8 x x", 8, "B♭m7 · arpegio (traste 8)"],
    ["Gbmaj7", "9 11 10 11 9 x", 9, "G♭maj7 · arpegio (traste 9)"],
    ["Db", "9 9 10 11 x x", 9, "D♭ · final (traste 9)"],
    ["Bbm", "x x 6 8 8 6", 6, "B♭m · muro (traste 6)"],
    ["Gbmaj7 ", "x x 3 3 4 2", 2, "G♭maj7 · muro (traste 2)"],
  ];

  // Arpegios (corcheas, se dejan sonar)
  const ARP_BB = "8.4{lr} 10.3{lr} 9.2{lr} 9.1{lr} 9.2{lr} 10.3{lr} 9.1{lr} 9.2{lr}";
  const ARP_GB = "9.5{lr} 11.4{lr} 10.3{lr} 11.2{lr} 9.1{lr} 11.2{lr} 10.3{lr} 11.4{lr}";
  const ARP_BB2 = "8.4{lr} 10.3{lr} 9.2{lr} 9.1{lr} 11.1{h} 9.1{lr} 9.2{lr} 10.3{lr}";        // con pull-off Mi♭ → Re♭
  const ARP_GB2 = "9.5{lr} 11.4{lr} 10.3{lr} 11.2{lr} 9.1{h} 11.1{h} 9.1{lr} 11.2{lr}";        // hammer y pull Re♭ ↔ Mi♭
  // Para poner propiedades de golpe en una nota suelta hay que escribir la duración: 8.4.8{…}
  const arp = (patron, nombre, extra) => {
    const [primera, ...resto] = patron.split(" ");
    const base = primera.replace(/\{[^}]*\}/, "");
    const notaProps = (primera.match(/\{[^}]*\}/) || [""])[0];
    return `${base}${notaProps}.8{ch "${nombre}"${extra ? ` txt "${extra}"` : ""}} ${resto.join(" ")}`;
  };
  const MURO_BB = "(6.6 8.5 8.4 6.3)";
  const MURO_GB = "(2.6 4.5 3.4 3.3)";
  const muro = (acorde, nombre, extra) => `${acorde}.8{ch "${nombre}"${extra ? ` txt "${extra}"` : ""}} ${Array(7).fill(acorde).join(" ")}`;

  const compases = [
    // 1–10 · intro sin guitarra
    `\\section "Intro (0:00)"` + " " + R(10),
    // 11–18 · Intro · Guitarra y teclados (0:18) — arpegio limpio
    `\\section "A · Intro (0:18)" :8 ` + arp(ARP_BB, "Bbm7", "fuzz 15 % · deja sonar"),
    arp(ARP_GB, "Gbmaj7"), arp(ARP_BB, "Bbm7"), arp(ARP_GB, "Gbmaj7"),
    arp(ARP_BB2, "Bbm7"), arp(ARP_GB2, "Gbmaj7"), arp(ARP_BB2, "Bbm7"), arp(ARP_GB2, "Gbmaj7"),
    // 19–22 · Platillos y distorsión (0:33) — acorde + díadas en corcheas
    `\\section "B · Platillos (0:33)" (8.4 10.3 9.2 9.1).4{ch "Bbm7" txt "fuzz 27 %"} :8 ` + Array(6).fill("(9.2 9.1)").join(" "),
    `(9.5 11.4 10.3 11.2 9.1).4{ch "Gbmaj7"} :8 ` + Array(6).fill("(11.2 9.1)").join(" "),
    `(8.4 10.3 9.2 9.1).4{ch "Bbm7"} :8 ` + Array(6).fill("(9.2 9.1)").join(" "),
    `(9.5 11.4 10.3 11.2 9.1).4{ch "Gbmaj7"} :8 ` + Array(4).fill("(11.2 9.1)").join(" ") + ` r.4{txt "callas"}`,
    // 23–42 · silencio (pedal F y desarrollo)
    `\\section "Silencio (0:40)" ` + R(20),
    // 43–47 · Desarrollo · Limpio (1:17) — solo limpio
    `\\section "C · Solo (1:17)" 13.1.4{d ch "Bbm7" txt "limpio · reverb 55 %"} 11.1.8 9.1{v}.2`,
    `11.2.4{ch "Gbmaj7"} 9.1.4 13.1{sib v}.2`,
    `11.1.4{d ch "Bbm7"} 9.1.8 11.2{v}.2`,
    `13.2{v}.2{ch "Gbmaj7" txt "Do: color lidio"} 11.2.4 9.2.4`,
    `10.3.2{ch "Bbm7"} 9.2.4 11.2.4`,
    // 48–50 · Bisagra en Sol♭ (1:26) — swell y Do agudo
    `\\section "D · Bisagra (1:26)" (9.5 11.4 10.3 11.2 9.1).1{vs ch "Gbmaj7" txt "swell"}`,
    `13.2{v}.1{txt "sube el fuzz"}`,
    `-.2{vw}.1`,
    // 51–58 · Muro (1:32) — corcheas abajo
    `\\section "E · Muro (1:32)" :8 ` + muro(MURO_BB, "Bbm", "fuzz 39 % · todo abajo"),
    muro(MURO_BB, "Bbm"), muro(MURO_GB, "Gbmaj7 "), muro(MURO_GB, "Gbmaj7 "),
    muro(MURO_BB, "Bbm"), muro(MURO_BB, "Bbm"), muro(MURO_GB, "Gbmaj7 "), muro(MURO_GB, "Gbmaj7 "),
    // 59–66 · Teclados altos (1:47) — clímax: notas largas arriba
    `\\section "F · Clímax (1:47)" 13.1.1{ch "Bbm7" txt "fuzz 48 % (el máximo) · vibrato ancho"}`,
    `11.1.2 9.1{v}.2`,
    `9.1{sl}.2{ch "Gbmaj7"} 13.1.2`,
    `14.1.2 13.1{v}.2`,
    `13.1.4{d ch "Bbm7" txt "1:54 · atrásate un poco"} 11.1.8 9.1.2`,
    `11.2{v}.1`,
    `13.2.2{ch "Gbmaj7"} 9.1.2`,
    `13.1{vw}.1`,
    // 67–74 · Outro · Medios (2:01) — vuelve el arpegio, con más saturación, y se apaga
    `\\section "G · Outro (2:01)" :8 ` + arp(ARP_BB, "Bbm7", "fuzz 39 % → 30 %"),
    arp(ARP_BB2, "Bbm7"), arp(ARP_GB, "Gbmaj7"), arp(ARP_GB2, "Gbmaj7"),
    arp(ARP_BB, "Bbm7"), arp(ARP_BB2, "Bbm7"),
    `9.5{lr}.4{ch "Gbmaj7"} 11.4{lr}.4 10.3{lr}.4 11.2{lr}.4`,
    `(9.5 11.4 10.3 11.2 9.1).1{fo txt "deja morir"}`,
    // 75–91 · silencio
    `\\section "Silencio (2:16)" ` + R(17),
    // 92–95 · Resolución en Re♭ (2:48)
    `\\section "H · Final (2:48)" 11.4{lr}.4{ch "Db" txt "fuzz 18 % · reverb sube"} 10.3{lr}.4 9.2{lr}.4 9.1{lr}.4`,
    `(11.4 10.3 9.2 9.1).1{vs}`,
    `9.1{lr}.4 9.2{lr}.4 10.3{lr}.4 11.4{lr}.4`,
    `(11.4 10.3 9.2 9.1).1{fo fermata medium}`,
  ];

  // alphaTab dibuja la marca de sección y el nombre del acorde en la misma línea: en el primer compás de cada
  // sección el acorde va en la línea de texto de abajo ("B♭m7 · fuzz 15 %"), así no se tapan.
  const moverAcorde = c => !c.startsWith("\\section") ? c : c.replace(/ch "([^"]*)"(?: txt "([^"]*)")?/, (_, ac, txt) => `txt "${ac.trim()}${txt ? " · " + txt : ""}"`);

  // silenciosJuntos: los compases de silencio seguidos se dibujan como un solo compás con el número (para leer e imprimir)
  const armar = silenciosJuntos => [
    `\\title "Genesis · guitarra real"`,
    `\\subtitle "Cover de la Orquesta de Laptops UC · parte propia sobre los acordes de la obra"`,
    `\\tempo 130`,
    `\\defaultBarNumberDisplay allBars`,
    `.`,
    `\\track "Guitarra" "Gtr."${silenciosJuntos ? " { multiBarRest }" : ""}`,
    `\\staff {score tabs}`,
    `\\tuning (E4 B3 G3 D3 A2 E2) {label "Afinación estándar"}`,
    ...ACORDES.map(([n, cuerdas, ff]) => `\\chord ("${n}" ${cuerdas}) {firstfret ${ff}}`),
    `\\ks Db \\ts 4 4`,
    compases.map(moverAcorde).join(" |\n") + " |",
  ].join("\n").replace(/"([BGD])b/g, '"$1♭');   // nombres con bemol de verdad: B♭m7, G♭maj7, D♭

  // Guía por sección: lo mismo que la partitura, en palabras (también la usa la página de guitarra)
  const SECCIONES = [
    { compases: [1, 10], hora: "0:00", nombre: "Intro (ambiente y batería)", toca: false,
      texto: "Silencio. Cuenta 10 compases: entras en 0:18." },
    { compases: [11, 18], hora: "0:18", nombre: "A · Intro con guitarra", toca: true, fuzz: "15 % (casi limpio)", tono: "oscuro", reverb: "media",
      texto: "Arpegio en corcheas, dejando sonar todo. Un compás B♭m7 (traste 8), uno G♭maj7 (traste 9). Desde el compás 15, el pull-off Mi♭ → Re♭ en la 1.ª cuerda." },
    { compases: [19, 22], hora: "0:33", nombre: "B · Platillos y distorsión", toca: true, fuzz: "27 %", tono: "oscuro", reverb: "media",
      texto: "Primer tiempo: el acorde completo. Después, corcheas con las dos cuerdas de arriba. En el último tiempo del compás 22 callas." },
    { compases: [23, 42], hora: "0:40", nombre: "Pedal F y desarrollo", toca: false,
      texto: "Silencio (20 compases). Vuelves en 1:17 con el solo." },
    { compases: [43, 47], hora: "1:17", nombre: "C · Solo limpio", toca: true, fuzz: "apagado", tono: "medio", reverb: "55 %",
      texto: "Todo el grupo baja: el solo va limpio y cantado, con vibrato en las notas largas. El Do del compás 46 sobre G♭maj7 da el color lidio." },
    { compases: [48, 50], hora: "1:26", nombre: "D · Bisagra en Sol♭", toca: true, fuzz: "de 9 % a 30 %", tono: "medio", reverb: "media",
      texto: "G♭maj7 entrando con la perilla de volumen (o un pedal), y después el Do agudo sostenido mientras subes el fuzz hacia el muro." },
    { compases: [51, 58], hora: "1:32", nombre: "E · Muro", toca: true, fuzz: "39 %", tono: "medio", reverb: "media",
      texto: "Corcheas parejas, todo hacia abajo. B♭m en el traste 6 y G♭maj7 en el traste 2, dos compases cada uno." },
    { compases: [59, 66], hora: "1:47", nombre: "F · Clímax", toca: true, fuzz: "48 % (el máximo)", tono: "medio-brillante", reverb: "55 %",
      texto: "Notas largas y agudas por encima del muro de los teclados. En 1:54 (compás 63) atrásate un poquito: es el desfase de la propuesta." },
    { compases: [67, 74], hora: "2:01", nombre: "G · Outro", toca: true, fuzz: "de 39 % a 30 %", tono: "medio", reverb: "55 %",
      texto: "Vuelve el arpegio del comienzo, con más saturación. En los dos últimos compases se apaga: negras y un acorde que dejas morir." },
    { compases: [75, 91], hora: "2:16", nombre: "Dos líneas y sin batería", toca: false,
      texto: "Silencio (17 compases). Vuelves para el final en 2:48." },
    { compases: [92, 95], hora: "2:48", nombre: "H · Resolución en Re♭", toca: true, fuzz: "18 %", tono: "oscuro", reverb: "sube hasta mucha",
      texto: "Re♭ arriba en el traste 9: arpegio, swell, arpegio de vuelta y el acorde final que se apaga con el volumen." },
  ];

  window.PARTE_GUITARRA = { tex: armar(true), texLinea: armar(false), SECCIONES, ACORDES, SEG_POR_COMPAS: 60 / 130 * 4 };
})();
