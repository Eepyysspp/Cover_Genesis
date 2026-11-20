/* Arma la app Genesis para Mac (Apple Silicon e Intel) y Windows.
     node construir.js            → las tres, en dist/ (Genesis-mac-arm64.zip, Genesis-mac-x64.zip, Genesis-windows-x64.zip)
     node construir.js mac-arm64  → solo esa (también: mac-x64, windows-x64, linux-x64 para pruebas)
     node construir.js --web      → solo copia la página v3 a web/ (para `npm start`)
   La página v3 y sus sonidos se copian desde la carpeta de la obra (..) a web/, que va dentro de la app.
   En Mac se firma "ad hoc" con rcodesign (variable RCODESIGN o en el PATH) si se arma fuera de un Mac; en un Mac,
   con codesign. Sin cuenta de desarrollador de Apple, la primera vez hay que autorizarla en Privacidad y seguridad. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RAIZ = path.resolve(__dirname, "..");
const WEB = path.join(__dirname, "web");
const DIST = path.join(__dirname, "dist");
const ARCHIVOS = ["v3.html", "css/v3.css", "js/partitura.js", "js/comun.js", "js/audio.js", "js/pistas_midi.js", "js/midi.js", "js/v3_reloj.js", "js/v3.js"];
const CARPETAS = ["sonidos", "midi"];
const OBJETIVOS = {
  "mac-arm64": { platform: "darwin", arch: "arm64" },
  "mac-x64": { platform: "darwin", arch: "x64" },
  "windows-x64": { platform: "win32", arch: "x64" },
  "linux-x64": { platform: "linux", arch: "x64" },
};

function copiarWeb() {
  fs.rmSync(WEB, { recursive: true, force: true });
  for (const f of ARCHIVOS) { fs.mkdirSync(path.dirname(path.join(WEB, f)), { recursive: true }); fs.copyFileSync(path.join(RAIZ, f), path.join(WEB, f)); }
  for (const c of CARPETAS) fs.cpSync(path.join(RAIZ, c), path.join(WEB, c), { recursive: true });
  console.log("web/ lista (" + ARCHIVOS.length + " archivos + " + CARPETAS.join(", ") + ")");
}

function firmarMac(appDir) {
  const app = path.join(appDir, "Genesis.app");
  if (process.platform === "darwin") return execFileSync("codesign", ["--force", "--deep", "--sign", "-", app], { stdio: "inherit" });
  const rc = process.env.RCODESIGN || "rcodesign";
  try { execFileSync(rc, ["sign", app], { stdio: ["ignore", "ignore", "inherit"] }); console.log("  firmada ad hoc"); }
  catch (e) { console.warn("  ⚠ sin rcodesign: en un Mac con Apple Silicon habrá que firmarla con `codesign --force --deep -s - Genesis.app`"); }
}

async function main() {
  copiarWeb();
  if (process.argv.includes("--web")) return;
  const { packager } = await import("@electron/packager");
  const pedidos = process.argv.slice(2).filter(a => OBJETIVOS[a]);
  const lista = pedidos.length ? pedidos : ["mac-arm64", "mac-x64", "windows-x64"];
  fs.mkdirSync(DIST, { recursive: true });
  for (const nombre of lista) {
    const o = OBJETIVOS[nombre], mac = o.platform === "darwin";
    console.log("→ " + nombre);
    const [dir] = await packager({
      dir: __dirname, out: DIST, overwrite: true, asar: true, prune: true,
      platform: o.platform, arch: o.arch, name: "Genesis", executableName: "Genesis",
      appBundleId: "cl.orquestalaptopsuc.genesis", appCategoryType: "public.app-category.music", appCopyright: "Orquesta de Laptops UC",
      icon: mac ? path.join(__dirname, "ui", "icono.icns") : undefined,   // el ícono de Windows necesita wine (rcedit): la ventana lo pone igual
      extraResource: [WEB],
      ignore: [/^\/dist($|\/)/, /^\/web($|\/)/, /^\/construir\.js$/, /^\/\.gitignore$/],
      darwinDarkModeSupport: true,
      // macOS 15+: permiso de "red local" (para encontrar la sala y hablar con el maestro)
      extendInfo: mac ? { NSLocalNetworkUsageDescription: "Genesis usa la red local para encontrar la sala del maestro y partir la obra a la vez.", NSBonjourServices: ["_genesis._tcp"] } : undefined,
    });
    if (mac && o.arch === "arm64") firmarMac(dir);   // Intel no exige firma; Apple Silicon sí (aunque sea ad hoc)
    const zip = path.join(DIST, `Genesis-${nombre}.zip`);
    fs.rmSync(zip, { force: true });
    // -y guarda los enlaces simbólicos (los necesita el framework de Electron en Mac)
    execFileSync("zip", ["-qry", zip, path.basename(dir)], { cwd: DIST });
    console.log("  " + path.basename(zip) + " · " + (fs.statSync(zip).size / 1048576).toFixed(0) + " MB");
  }
}
main().catch(e => { console.error(e); process.exit(1); });
