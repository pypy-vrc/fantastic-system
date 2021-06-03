import * as path from 'path';
import * as electron from 'electron';
import * as native from 'native';
import * as util from '../../util';

let window: electron.BrowserWindow | undefined = void 0;

export function create(): void {
  if (window !== void 0) {
    return;
  }

  window = new electron.BrowserWindow({
    width: 512,
    height: 512,
    resizable: false,
    fullscreenable: false,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#FF000000',
    hasShadow: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(electron.app.getAppPath(), './dist/preload.js'),
      sandbox: false,
      enableRemoteModule: false,
      defaultEncoding: 'utf-8',
      backgroundThrottling: false,
      offscreen: true,
      contextIsolation: true,
      additionalArguments: ['--disable-spell-checking'],
      disableDialogs: true,
      spellcheck: false,
      enableWebSQL: false
    }
  });

  window.webContents.userAgent = window.webContents.userAgent.replace(
    /(vrcx|electron)\/.+? /gi,
    ''
  );

  window.on('close', onWindowClose);
  window.webContents.on('paint', onPaint);
  window.webContents.setFrameRate(30);

  window.webContents.openDevTools();

  // _window.loadURL(
  //     'https://testdrive-archive.azurewebsites.net/performance/fishbowl/'
  // );

  window.loadFile('./dist/overlay-wrist.html').catch(util.nop);
}

export function destroy(): void {
  try {
    window?.destroy();
    window = void 0;
  } catch (err) {
    console.error(err);
  }
}

export function send(channel: string, ...args: any[]): void {
  window?.webContents.send(channel, ...args);
}

function onWindowClose(_event: Electron.Event): void {
  window?.webContents.closeDevTools();
}

function onPaint(
  _event: Electron.Event,
  {x, y, width, height}: Electron.Rectangle,
  image: Electron.NativeImage
): void {
  native.setOverlayFrameBuffer(
    native.OverlayTarget.Wrist,
    x,
    y,
    width,
    height,
    image.getBitmap()
  );
}
