import * as electron from 'electron';
import * as native from 'native';
import * as util from '../util';
import * as pubsub from '../pubsub';
import * as global from './global';
import * as tray from './tray';
import * as sqlite from './sqlite';
import * as mainWindow from './window/main';
import * as overlayHmdWindow from './window/overlay-hmd';
import * as overlayWristWindow from './window/overlay-wrist';
import * as gameLog from './game/log';

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

(function bootstrap(): void {
  const {app} = electron;

  app.setName('VRCX');

  if (process.platform === 'win32') {
    app.setAppUserModelId('moe.pypy.vrcx');
  }

  if (app.requestSingleInstanceLock() === false) {
    app.exit();
    return;
  }

  app.disableHardwareAcceleration();
  app.disableDomainBlockingFor3DAPIs();
  // app.enableSandbox();

  app.commandLine.appendSwitch(
    'disable-features',
    'CalculateNativeWinOcclusion'
  );
  app.commandLine.appendSwitch('disable-webgl');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-plugins-discovery');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  // app.commandLine.appendSwitch('ignore-certificate-errors');
  app.commandLine.appendSwitch('no-referrers');
  app.commandLine.appendSwitch('disable-extensions');
  app.commandLine.appendSwitch('disable-spell-checking');

  app.on('ready', () => {
    try {
      sqlite.open();
      tray.create();
      mainWindow.create();
      // overlayHmdWindow.create();
      // overlayWristWindow.create();
      setImmediate(() => {
        gameLog.watch().catch(util.nop);
      });
    } catch (err) {
      console.error(err);
      app.exit();
    }
  });

  app.on('will-quit', () => {
    mainWindow.destroy();
    overlayHmdWindow.destroy();
    overlayWristWindow.destroy();
  });

  app.on('quit', () => {
    tray.destroy();
    sqlite.close();
  });

  app.on('activate', () => {
    mainWindow.activate();
  });

  app.on('second-instance', () => {
    mainWindow.activate();
  });

  pubsub.subscribe('tray:quit', () => {
    global.isAppQuit.value = true;
    setImmediate(() => {
      app.quit();
    });
  });

  electron.ipcMain.handle('native:getRunningApp', () => native.getRunningApp());

  electron.ipcMain.handle('native:playGame', (_event, param: string) =>
    native.playGame(param)
  );

  electron.ipcMain.handle('native:startOverlay', () => native.startOverlay());
  electron.ipcMain.handle('native:stopOverlay', () => {
    native.stopOverlay();
  });
  electron.ipcMain.handle('native:getVRDeviceList', () =>
    native.getVRDeviceList()
  );
})();
