import { contextBridge, ipcRenderer } from "electron";

(function main() {
  contextBridge.exposeInMainWorld("ipcRenderer", {
    invoke: ipcRenderer.invoke.bind(ipcRenderer),
    on: ipcRenderer.on.bind(ipcRenderer),
    send: ipcRenderer.send.bind(ipcRenderer),
  });
})();
