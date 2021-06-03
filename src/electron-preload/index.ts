import * as electron from 'electron';

(function bootstrap(): void {
  const {ipcRenderer} = electron;
  electron.contextBridge.exposeInMainWorld('ipcRenderer', {
    on: ipcRenderer.on.bind(ipcRenderer),
    send: ipcRenderer.send.bind(ipcRenderer),
    invoke: ipcRenderer.invoke.bind(ipcRenderer)
  });
})();
