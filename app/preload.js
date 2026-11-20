/* Puente entre las páginas (inicio y v3) y la app: lo justo, sin acceso a Node desde la página. */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("genesisApp", {
  info: () => ipcRenderer.invoke("info"),
  abrirSala: () => ipcRenderer.invoke("abrir-sala"),
  unirme: (ip, puerto) => ipcRenderer.invoke("unirme", ip, puerto),
  solo: () => ipcRenderer.invoke("solo"),
  inicio: () => ipcRenderer.invoke("inicio"),
  abrirLuces: () => ipcRenderer.invoke("abrir-luces"),
  alSalas: f => ipcRenderer.on("salas", (_e, lista) => f(lista)),
});
