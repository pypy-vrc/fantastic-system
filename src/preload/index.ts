import * as electron from "electron";

(function main() {
  const { ipcRenderer } = electron;

  electron.contextBridge.exposeInMainWorld("ipcRenderer", {
    invoke: ipcRenderer.invoke.bind(ipcRenderer),
    on: ipcRenderer.on.bind(ipcRenderer),
    send: ipcRenderer.send.bind(ipcRenderer),
  });
})();
