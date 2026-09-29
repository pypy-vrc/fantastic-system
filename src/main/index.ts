import { app, ipcMain } from "electron";
import native from "native";
import { nop } from "../common/util.ts";
import { subscribe } from "../common/pubsub.ts";
import { IS_APP_QUIT } from "./global.ts";
import { createTray, destroyTray } from "./tray.ts";
import {
  activateMainWindow,
  createMainWindow,
  destroyMainWindow,
} from "./window/main.ts";
import { destroyHmdWindow } from "./window/overlay-hmd.ts";
import { destroyWristWindow } from "./window/overlay-wrist.ts";
import { setupLogWatcher } from "./vrchat-log-watcher.ts";

// clear cache
// import { session } from "electron";

// export async function clearCaches() {
//   await clearCache();
//   await clearStorageData();
// }

// export async function clearCache() {
//   if (session.defaultSession) {
//     await session.defaultSession.clearCache();
//   }
// }

// export async function clearStorageData() {
//   if (!session.defaultSession) {
//     return;
//   }

//   await session.defaultSession.clearStorageData({
//     storages: [
//       "appcache",
//       "cookies",
//       "filesystem",
//       "indexdb",
//       "localstorage",
//       "shadercache",
//       "websql",
//       "serviceworkers",
//     ],
//     quotas: ["temporary", "persistent", "syncable"],
//   });
// }

(function main() {
  app.setName("senpai1");

  if (process.platform === "win32") {
    app.setAppUserModelId("moe.pypy.senpai1");
  }

  if (!app.requestSingleInstanceLock()) {
    app.exit();
    return;
  }

  ((cl) => {
    cl.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
    cl.appendSwitch("disable-webgl");
    cl.appendSwitch("disable-gpu");
    cl.appendSwitch("disable-plugins-discovery");
    cl.appendSwitch("disable-software-rasterizer");
    // cl.appendSwitch('ignore-certificate-errors');
    cl.appendSwitch("no-referrers");
    cl.appendSwitch("disable-extensions");
    cl.appendSwitch("disable-spell-checking");
  })(app.commandLine);

  app.disableHardwareAcceleration();
  app.disableDomainBlockingFor3DAPIs();
  // app.enableSandbox();

  app.on("ready", () => {
    try {
      createTray();
      createMainWindow();
      // createHmdWindow();
      // createWristWindow();
      setImmediate(() => setupLogWatcher().catch(nop));
    } catch (err) {
      console.error(err);
      app.exit();
    }
  });

  app.on("will-quit", () => {
    destroyMainWindow();
    destroyHmdWindow();
    destroyWristWindow();
  });

  app.on("quit", () => destroyTray());
  app.on("activate", () => activateMainWindow());
  app.on("second-instance", () => activateMainWindow());

  subscribe("tray:open", () => activateMainWindow());
  subscribe("tray:double-click", () => activateMainWindow());
  subscribe("tray:quit", () => {
    IS_APP_QUIT.value = true;
    setImmediate(() => app.quit());
  });

  ipcMain.handle("native:getRunningApp", () => native.getRunningApp());
  ipcMain.handle("native:playGame", (_e, arg) => native.playGame(arg));
  ipcMain.handle("native:startOverlay", () => native.startOverlay());
  ipcMain.handle("native:stopOverlay", () => native.stopOverlay());
  ipcMain.handle("native:getVRDeviceList", () => native.getVRDeviceList());
})();
