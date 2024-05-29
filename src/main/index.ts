import * as electron from "electron";
import * as native from "native";
import * as util from "../common/util";
import * as pubsub from "../common/pubsub";
import * as global from "./global";
import * as tray from "./tray";
import * as mainWindow from "./window/main";
import * as overlayHmdWindow from "./window/overlay-hmd";
import * as overlayWristWindow from "./window/overlay-wrist";
import * as vrchatLogWatcher from "./vrchat-log-watcher";

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
  const { app, ipcMain } = electron;

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
      tray.create();
      mainWindow.create();
      // overlayHmdWindow.create();
      // overlayWristWindow.create();
      setImmediate(() => vrchatLogWatcher.setup().catch(util.nop));
    } catch (err) {
      console.error(err);
      app.exit();
    }
  });

  app.on("will-quit", () => {
    mainWindow.destroy();
    overlayHmdWindow.destroy();
    overlayWristWindow.destroy();
  });

  app.on("quit", () => tray.destroy());
  app.on("activate", () => mainWindow.activate());
  app.on("second-instance", () => mainWindow.activate());

  pubsub.subscribe("tray:open", () => mainWindow.activate());
  pubsub.subscribe("tray:double-click", () => mainWindow.activate());
  pubsub.subscribe("tray:quit", () => {
    global.isAppQuit.value = true;
    setImmediate(() => app.quit());
  });

  ipcMain.handle("native:getRunningApp", () => native.getRunningApp());
  ipcMain.handle("native:playGame", (_e, arg) => native.playGame(arg));
  ipcMain.handle("native:startOverlay", () => native.startOverlay());
  ipcMain.handle("native:stopOverlay", () => native.stopOverlay());
  ipcMain.handle("native:getVRDeviceList", () => native.getVRDeviceList());
})();
