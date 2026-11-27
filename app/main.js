/* Genesis · app de escritorio (versión 3).
   Cada laptop corre esta app. Una abre la SALA (maestro): lleva el reloj de la obra y lo anuncia en la red (Bonjour).
   Las demás (músicos) encuentran la sala solas y siguen ese reloj; al iniciar, todas parten juntas tras una cuenta
   regresiva. Cada app sirve la página v3 desde su propia copia (web/), así que el wifi solo lleva el reloj.
   No hace falta internet: solo que todas estén en el mismo router. */
const { app, BrowserWindow, ipcMain, powerSaveBlocker, session, Menu, shell, dialog, screen } = require("electron");
const http = require("http");
const dgram = require("dgram");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { Bonjour } = require("bonjour-service");

const WEB = app.isPackaged ? path.join(process.resourcesPath, "web") : path.join(__dirname, "web");
const UI = path.join(__dirname, "ui");
const PUERTO_PREFERIDO = 47800;
const CUENTA_MAX = 10;
const PUERTO_FARO = 47801;   // aviso UDP de la sala (respaldo de Bonjour)

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

/* ---------------- nombre de esta laptop ---------------- */
function nombreEquipo() {
  try { if (process.platform === "darwin") return execFileSync("scutil", ["--get", "ComputerName"], { encoding: "utf8" }).trim(); } catch (e) { /* sigue */ }
  return os.hostname().replace(/\.local$/i, "");
}
const EQUIPO = nombreEquipo();
function ips() {
  const out = [];
  for (const lista of Object.values(os.networkInterfaces())) for (const i of lista || []) if (i.family === "IPv4" && !i.internal) out.push(i.address);
  return out;
}

/* ---------------- reloj de la obra (solo cuenta cuando esta app es el maestro) ---------------- */
// t0: hora (ms) en que la obra estaría en 0:00 · pos: segundo de la obra detenida (o donde parte) · empieza: fin de la cuenta regresiva
const estado = { corriendo: false, t0: 0, pos: 0, version: 0, empieza: null,
  volSala: null, volVersion: 0 };   // volumen que el maestro fija para las demás laptops (0–1; null = cada una el suyo)
const sala = new Map();   // id → { nombre, rol, rtt, vol, son, maestro, visto }  (la página del propio maestro no cuenta)
let modo = null;          // "maestro" | "musico" | "solo" | null (pantalla de inicio)
const ahoraMs = () => Date.now();
function foto() {
  const n = ahoraMs();
  for (const [id, c] of sala) if (n - c.visto > 10000) sala.delete(id);
  return Object.assign({}, estado, {
    ms: n, servidor: "genesis", nombre: EQUIPO,
    sala: [...sala.values()].filter(c => n - c.visto < 3000 && !c.maestro).map(({ nombre, rol, rtt, vol, son }) => ({ nombre, rol, rtt, vol, son })),
  });
}
function aplicar(accion, t, cuenta) {
  const n = ahoraMs();
  const actual = estado.corriendo ? (estado.empieza && n < estado.empieza ? estado.pos : (n - estado.t0) / 1000) : estado.pos;
  const espera = Math.max(0, Math.min(CUENTA_MAX, +cuenta || 0)) * 1000;
  if (accion === "iniciar") {
    const desde = t == null ? actual : t;
    Object.assign(estado, { corriendo: true, pos: desde, t0: n + espera - desde * 1000, empieza: espera ? n + espera : null });
  } else if (accion === "pausar") Object.assign(estado, { corriendo: false, pos: actual, empieza: null });
  else if (accion === "ir") {
    const a = t == null ? 0 : t;
    if (estado.corriendo) Object.assign(estado, { pos: a, t0: n + espera - a * 1000, empieza: espera ? n + espera : null });
    else estado.pos = a;
  } else if (accion === "detener") Object.assign(estado, { corriendo: false, pos: 0, empieza: null });
  estado.version++;
}
function reiniciarReloj() { Object.assign(estado, { corriendo: false, t0: 0, pos: 0, empieza: null, volSala: null }); estado.version++; estado.volVersion++; sala.clear(); }

/* ---------------- servidor: la página v3 (web/), la pantalla de inicio (ui/) y el reloj (api/) ---------------- */
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".mid": "audio/midi", ".png": "image/png",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".sf2": "application/octet-stream", ".sf3": "application/octet-stream" };
function responder(res, datos, codigo = 200) {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(codigo, { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
  res.end(cuerpo);
}
function archivo(res, raiz, ruta) {
  const f = path.normalize(path.join(raiz, decodeURIComponent(ruta)));
  if (!f.startsWith(raiz)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end("no existe"); }
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(f).toLowerCase()] || "application/octet-stream", "Content-Length": st.size, "Access-Control-Allow-Origin": "*" });
    fs.createReadStream(f).pipe(res);
  });
}
function manejar(req, res) {
  const u = new URL(req.url, "http://x"), ruta = u.pathname;
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }
  if (ruta.startsWith("/api/")) {
    // el reloj solo existe mientras esta app es el maestro (así nadie se une por error a una laptop que no abrió sala)
    if (modo !== "maestro") return responder(res, { error: "esta laptop no tiene la sala abierta" }, 404);
    if (ruta === "/api/hora") return responder(res, { ms: ahoraMs() });
    if (ruta === "/api/info") return responder(res, { ips: ips(), puerto: puerto, nombre: EQUIPO });
    if (ruta === "/api/reloj" && req.method === "GET") {
      const id = u.searchParams.get("id");
      const num = k => (u.searchParams.get(k) ? +u.searchParams.get(k) : null);
      if (id) sala.set(id, { nombre: u.searchParams.get("nombre") || "", rol: u.searchParams.get("rol") || "", rtt: num("rtt"), vol: num("vol"), son: u.searchParams.get("son") === "1", maestro: u.searchParams.get("yo") === "maestro", visto: ahoraMs() });
      return responder(res, foto());
    }
    if (ruta === "/api/reloj" && req.method === "POST") {
      let cuerpo = "";
      req.on("data", c => { cuerpo += c; if (cuerpo.length > 1e4) req.destroy(); });
      req.on("end", () => {
        try {
          const d = JSON.parse(cuerpo || "{}");
          if (d.accion === "volumen") {   // el maestro fija el volumen de todas las demás laptops (no toca el reloj)
            const v = +d.t;
            if (!(v >= 0 && v <= 1)) return responder(res, { error: "volumen entre 0 y 1" }, 400);
            estado.volSala = v; estado.volVersion++;
            return responder(res, foto());
          }
          if (!["iniciar", "pausar", "ir", "detener"].includes(d.accion)) return responder(res, { error: "acción desconocida" }, 400);
          aplicar(d.accion, d.t == null ? null : +d.t, d.cuenta);
          responder(res, foto());
        } catch (e) { responder(res, { error: e.message }, 400); }
      });
      return;
    }
    return responder(res, { error: "no existe" }, 404);
  }
  if (ruta.startsWith("/_app/")) return archivo(res, UI, ruta.slice(6));
  return archivo(res, WEB, ruta === "/" ? "v3.html" : ruta);
}
let puerto = PUERTO_PREFERIDO;
const servidor = http.createServer({ keepAliveTimeout: 15000 }, manejar);
servidor.headersTimeout = 20000;
function escuchar() {
  return new Promise(ok => {
    servidor.once("error", () => { servidor.listen(0, "0.0.0.0", () => { puerto = servidor.address().port; ok(); }); });   // ocupado: otro puerto
    servidor.listen(PUERTO_PREFERIDO, "0.0.0.0", () => { puerto = servidor.address().port; ok(); });
  });
}

/* ---------------- encontrar la sala: Bonjour + faro UDP + barrido de la red ----------------
   Con muchas laptops en el mismo wifi, los avisos de Bonjour (multicast) se pierden seguido y las que abren la app
   después no veían la sala. Ahora la sala se encuentra por tres caminos a la vez y la lista se mantiene sola:
   · Bonjour, preguntando de nuevo cada 3 s;
   · un "faro": el maestro avisa por UDP (broadcast) cada segundo;
   · un barrido: cada músico pregunta directamente (HTTP) a cada IP de su red si tiene la sala abierta.
   Una sala sale de la lista si nadie la ve por 20 s. */
let bonjour = null, anuncio = null, buscador = null, refrescoBonjour = null;
const salas = new Map();   // "ip:puerto" → { nombre, ip, puerto, visto }
function avisarSalas() {
  const n = Date.now();
  for (const [k, v] of salas) if (n - v.visto > 20000) salas.delete(k);
  if (ventana && !ventana.isDestroyed()) ventana.webContents.send("salas", [...salas.values()].map(({ nombre, ip, puerto }) => ({ nombre, ip, puerto })));
}
function verSala(ip, puerto, nombre) {
  if (!ip) return;
  const k = ip + ":" + puerto, nueva = !salas.has(k);
  salas.set(k, { nombre: nombre || ip, ip, puerto: +puerto || PUERTO_PREFERIDO, visto: Date.now() });
  if (nueva) avisarSalas();
}
// direcciones de broadcast de cada red de esta laptop (p. ej. 192.168.0.255)
function redes() {
  const out = [];
  for (const lista of Object.values(os.networkInterfaces())) for (const i of lista || []) {
    if (i.family !== "IPv4" || i.internal || !i.netmask) continue;
    const a = i.address.split(".").map(Number), m = i.netmask.split(".").map(Number);
    out.push({ ip: i.address, broadcast: a.map((x, k) => (x & m[k]) | (~m[k] & 255)).join("."), base: a.slice(0, 3).join(".") });
  }
  return out;
}
let faro = null, faroIv = null, oido = null, barridoIv = null, barriendo = false;
function encenderFaro() {
  if (faro) return;
  faro = dgram.createSocket({ type: "udp4", reuseAddr: true });
  faro.on("error", () => { try { faro.close(); } catch (e) { /* nada */ } faro = null; });
  faro.bind(() => {
    try { faro.setBroadcast(true); } catch (e) { /* nada */ }
    const enviar = () => {
      const msg = Buffer.from(JSON.stringify({ g: "genesis", v: 3, nombre: EQUIPO, puerto }));
      for (const r of redes()) faro && faro.send(msg, PUERTO_FARO, r.broadcast, () => {});
      faro && faro.send(msg, PUERTO_FARO, "255.255.255.255", () => {});
    };
    enviar(); faroIv = setInterval(enviar, 1000);
  });
}
function apagarFaro() { clearInterval(faroIv); faroIv = null; if (faro) { try { faro.close(); } catch (e) { /* nada */ } faro = null; } }
function escucharFaros() {
  if (oido) return;
  oido = dgram.createSocket({ type: "udp4", reuseAddr: true });
  oido.on("error", () => { try { oido.close(); } catch (e) { /* nada */ } oido = null; });
  oido.on("message", (buf, info) => { try { const d = JSON.parse(buf); if (d.g === "genesis") verSala(info.address, d.puerto, d.nombre); } catch (e) { /* otro programa */ } });
  oido.bind(PUERTO_FARO);
}
// Barrido: pregunta a las 254 direcciones de cada red (de a 48 a la vez) si tienen la sala abierta
function preguntar(ip, p, ms = 900) {
  return new Promise(fin => {
    const r = http.get({ host: ip, port: p, path: "/api/info", timeout: ms }, res => {
      let d = ""; res.on("data", c => (d += c));
      res.on("end", () => { try { const j = JSON.parse(d); fin(res.statusCode === 200 && j.nombre ? j : null); } catch (e) { fin(null); } });
    });
    r.on("error", () => fin(null)); r.on("timeout", () => { r.destroy(); fin(null); });
  });
}
async function barrer() {
  if (barriendo) return; barriendo = true;
  try {
    const propias = ips(), objetivos = [];
    for (const r of redes()) for (let h = 1; h < 255; h++) { const ip = r.base + "." + h; if (!propias.includes(ip)) objetivos.push(ip); }
    let i = 0;
    const trabajador = async () => { while (i < objetivos.length && barridoIv) { const ip = objetivos[i++]; const j = await preguntar(ip, PUERTO_PREFERIDO); if (j) verSala(ip, j.puerto || PUERTO_PREFERIDO, j.nombre); } };
    await Promise.all(Array.from({ length: 48 }, trabajador));
  } finally { barriendo = false; avisarSalas(); }
}
function buscarSalas() {
  if (!bonjour) bonjour = new Bonjour();
  if (!buscador) {
    buscador = bonjour.find({ type: "genesis" });
    buscador.on("up", s => {
      const ip = (s.addresses || []).find(a => /^\d+\.\d+\.\d+\.\d+$/.test(a)) || s.referer && s.referer.address;
      verSala(ip, s.port, (s.txt && s.txt.nombre) || s.name);
    });
    refrescoBonjour = setInterval(() => { try { buscador && buscador.update(); } catch (e) { /* nada */ } avisarSalas(); }, 3000);
  }
  escucharFaros();
  if (!barridoIv) { barridoIv = setInterval(barrer, 8000); barrer(); }
}
function dejarDeBuscar() {
  if (buscador) { try { buscador.stop(); } catch (e) { /* nada */ } buscador = null; }
  clearInterval(refrescoBonjour); refrescoBonjour = null;
  clearInterval(barridoIv); barridoIv = null;
  if (oido) { try { oido.close(); } catch (e) { /* nada */ } oido = null; }
  salas.clear();
}
function anunciar() {
  if (!bonjour) bonjour = new Bonjour();
  if (!anuncio) anuncio = bonjour.publish({ name: "Genesis " + EQUIPO + " " + process.pid, type: "genesis", port: puerto, txt: { nombre: EQUIPO, v: "3" } });
  encenderFaro();
}
function dejarDeAnunciar() { if (anuncio) { try { anuncio.stop(); } catch (e) { /* nada */ } anuncio = null; } apagarFaro(); }

/* ---------------- ventana ---------------- */
let ventana = null, bloqueo = null;
const pagina = (p, q = {}) => `http://127.0.0.1:${puerto}/${p}?` + new URLSearchParams(Object.assign({ nombre: EQUIPO }, q)).toString();
function irAlInicio() {
  dejarDeAnunciar(); modo = null; reiniciarReloj();
  if (bloqueo != null) { powerSaveBlocker.stop(bloqueo); bloqueo = null; }
  buscarSalas();
  ventana.loadURL(`http://127.0.0.1:${puerto}/_app/inicio.html`);
}
function entrar(nuevo, q) {
  modo = nuevo; dejarDeBuscar();
  if (bloqueo == null) bloqueo = powerSaveBlocker.start("prevent-display-sleep");   // que la pantalla no se apague tocando
  if (modo === "maestro") anunciar(); else dejarDeAnunciar();
  ventana.loadURL(pagina("v3.html", q));
}
function crearVentana() {
  ventana = new BrowserWindow({
    width: 1280, height: 860, minWidth: 900, minHeight: 600, backgroundColor: "#0b0a12", title: "Genesis", icon: path.join(__dirname, "ui", "icono.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), backgroundThrottling: false, contextIsolation: true, nodeIntegration: false },
  });
  ventana.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  ventana.on("closed", () => { ventana = null; if (luces && !luces.isDestroyed()) luces.close(); });
  irAlInicio();
}
// Ventana de luces (luces.html): los colores de la obra para el proyector. Si hay una segunda pantalla, se abre ahí a
// pantalla completa; si no, como ventana normal. La alimenta la página del Ambiente (BroadcastChannel "genesis-luces").
let luces = null;
function abrirLuces() {
  if (luces && !luces.isDestroyed()) { luces.show(); luces.focus(); return; }
  const principal = screen.getPrimaryDisplay(), extra = screen.getAllDisplays().find(d => d.id !== principal.id);
  const b = extra ? extra.bounds : { x: undefined, y: undefined, width: 960, height: 540 };
  luces = new BrowserWindow({
    x: b.x, y: b.y, width: extra ? b.width : 960, height: extra ? b.height : 540, fullscreen: !!extra, backgroundColor: "#000000",
    title: "Genesis · Luces", autoHideMenuBar: true, icon: path.join(__dirname, "ui", "icono.png"),
    webPreferences: { backgroundThrottling: false, contextIsolation: true, nodeIntegration: false },
  });
  luces.setMenuBarVisibility(false);
  luces.on("closed", () => { luces = null; });
  luces.loadURL(`http://127.0.0.1:${puerto}/luces.html`);
}

ipcMain.handle("info", () => ({ nombre: EQUIPO, ips: ips(), puerto, version: app.getVersion(), plataforma: process.platform }));
ipcMain.handle("abrir-sala", () => { reiniciarReloj(); entrar("maestro", { app: "maestro" }); });
ipcMain.handle("solo", () => entrar("solo", { app: "solo" }));
ipcMain.handle("unirme", async (_e, ip, p) => {
  p = +p || PUERTO_PREFERIDO;
  // antes de entrar, se comprueba que esa laptop tenga la sala abierta
  const ok = await new Promise(fin => {
    const r = http.get({ host: ip, port: p, path: "/api/reloj", timeout: 2500 }, res => { let d = ""; res.on("data", c => (d += c)); res.on("end", () => { try { fin(JSON.parse(d).servidor === "genesis"); } catch (e) { fin(false); } }); });
    r.on("error", () => fin(false)); r.on("timeout", () => { r.destroy(); fin(false); });
  });
  if (!ok) return { ok: false };
  dejarDeBuscar();
  entrar("musico", { app: "musico", maestro: `http://${ip}:${p}/` });
  return { ok: true };
});
ipcMain.handle("inicio", () => irAlInicio());
ipcMain.handle("abrir-luces", () => abrirLuces());

app.whenReady().then(async () => {
  // permisos: teclado MIDI (y nada más)
  session.defaultSession.setPermissionRequestHandler((_wc, permiso, cb) => cb(permiso === "midi" || permiso === "midiSysex"));
  session.defaultSession.setPermissionCheckHandler((_wc, permiso) => permiso === "midi" || permiso === "midiSysex");
  await escuchar();
  const mac = process.platform === "darwin";
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(mac ? [{ role: "appMenu" }] : []),
    { label: "Genesis", submenu: [
      { label: "Volver al inicio (salir de la sala)", accelerator: "CmdOrCtrl+Shift+H", click: () => ventana && irAlInicio() },
      { label: "Ventana de luces (proyector)", accelerator: "CmdOrCtrl+L", click: () => abrirLuces() },
      { type: "separator" }, { role: "reload", label: "Recargar" }, { role: "togglefullscreen", label: "Pantalla completa" },
      { role: "toggleDevTools", label: "Herramientas de desarrollo" },
      ...(mac ? [] : [{ type: "separator" }, { role: "quit", label: "Salir" }]),
    ] },
    { role: "editMenu", label: "Edición" },
  ]));
  crearVentana();
  app.on("activate", () => { if (!ventana) crearVentana(); });
}).catch(e => { dialog.showErrorBox("Genesis", String(e && e.stack || e)); app.quit(); });

app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => { dejarDeAnunciar(); try { if (bonjour) bonjour.destroy(); } catch (e) { /* nada */ } });
