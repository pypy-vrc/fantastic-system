declare global {
  interface Window {
    ipcRenderer: Electron.IpcRenderer;
  }
}

// oxlint-disable-next-line unicorn/require-module-specifiers
export {};
