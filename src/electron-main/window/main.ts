import * as path from 'path';
import * as electron from 'electron';
import * as util from '../../util';
import * as pubsub from '../../pubsub';
import * as global from '../global';

const userAgent = `VRCX/${electron.app.getVersion()}`;

let window: electron.BrowserWindow | undefined = void 0;

export function create(): void {
  if (window !== void 0) {
    return;
  }

  window = new electron.BrowserWindow({
    width: 800,
    height: 500,
    minWidth: 300,
    minHeight: 200,
    fullscreenable: false,
    icon: global.appIcon,
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(electron.app.getAppPath(), './dist/preload.js'),
      sandbox: false,
      enableRemoteModule: false,
      defaultEncoding: 'utf-8',
      backgroundThrottling: false,
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
  window.on('move', onWindowMove);
  window.on('resize', onWindowResize);
  window.on('show', onWindowShow);

  window.webContents.on('did-finish-load', onDidFinishLoad);
  window.webContents.on('will-navigate', onWillNavigate);
  window.webContents.setWindowOpenHandler(handleWindowOpen);
  window.webContents.session.on('will-download', onWillDownload);

  window.webContents.session.webRequest.onBeforeSendHeaders(
    {
      urls: ['https://*.vrchat.cloud/*', 'wss://*.vrchat.cloud/*']
    },
    onBeforeSendHeaders
  );

  window.webContents.session.webRequest.onHeadersReceived(
    {
      urls: ['https://*.vrchat.cloud/*']
    },
    onHeadersReceived
  );

  // _window.webContents.openDevTools();

  window
    .loadFile('./dist/main.html')
    .catch(util.nop)
    .finally(() => {
      window?.show();
    });
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

export function activate(): void {
  if (window === void 0) {
    return;
  }

  if (window.isMinimized() === true) {
    window.restore();
  }

  window.show();
  window.focus();
}

function close(): void {
  window?.close();
}

function minimize(): void {
  window?.minimize();
}

function maximize(): void {
  if (window === void 0) {
    return;
  }

  if (window.isMaximized() === true) {
    window.restore();
    return;
  }

  window.maximize();
}

function onWindowClose(event: Electron.Event): void {
  if (global.isAppQuit.value === false) {
    event.preventDefault();
    window?.hide();
    return;
  }

  window?.webContents.closeDevTools();
}

function onWindowMove(): void {
  // var [x, y] = this.getPosition();
  // var [width, height] = this.getSize();
}

function onWindowResize(): void {
  // var [x, y] = this.getPosition();
  // var [width, height] = this.getSize();
}

function onWindowShow(): void {
  if (window === void 0) {
    return;
  }

  let {x: winX, y: winY} = window.getBounds();

  for (let {bounds} of electron.screen.getAllDisplays()) {
    let {height, width, x, y} = bounds;
    if (winX >= x && winX <= x + width && winY >= y && winY <= y + height) {
      // okay, windows in a display
      return;
    }
  }

  window.center();
}

function onDidFinishLoad(): void {
  if (window === void 0) {
    return;
  }

  // reset zoom
  window.webContents.setZoomFactor(1);
  window.webContents.setZoomLevel(0);
  window.show();
}

function onWillNavigate(event: Electron.Event): void {
  event.preventDefault();
}

function handleWindowOpen(details: Electron.HandlerDetails): any {
  electron.shell.openExternal(details.url).catch(util.nop);

  return {
    action: 'deny'
  };
}

function onWillDownload(event: Electron.Event): void {
  event.preventDefault();
}

function onBeforeSendHeaders(
  details: Electron.OnBeforeSendHeadersListenerDetails,
  callback: (response: Electron.BeforeSendResponse) => void
): void {
  let {url, requestHeaders} = details;

  // if (url.startsWith('wss://') === true) {
  //     var headers = {
  //         'User-Agent': 'Transmtn-Pipeline',
  //         Upgrade: 'websocket',
  //         Connection: 'Upgrade',
  //         'Sec-WebSocket-Version': '13'
  //     };
  // } else if (url.startsWith('https://api.vrchat.cloud/api/1/file/') === true) {
  //     var headers = {
  //         'User-Agent': 'UnityPlayer/2018.4.20f1 (UnityWebRequest/1.0, libcurl/7.52.0-DEV)',
  //         Accept: '*/*',
  //         'Accept-Encoding': 'identify',
  //         'X-Unity-Version': '2018.4.20f1'
  //     };
  // } else {
  //     var headers = {
  //         'X-Requested-With': 'XMLHttpRequest',
  //         // 'X-MacAddress': '',
  //         // 'X-Client-Version': '',
  //         // 'X-Platform': '',
  //         Origin: 'vrchat.com',
  //         'Accept-Encoding': 'gzip, identity',
  //         'User-Agent': 'VRC.Core.BestHTTP'
  //     };
  // }

  let headers: {[key: string]: string} = {
    'User-Agent': userAgent
  };

  let allowedHeaderNames = null;

  if (url.startsWith('wss://') === true) {
    allowedHeaderNames = ['Upgrade', 'Connection', 'Sec-WebSocket-Version'];
  } else {
    allowedHeaderNames = [
      'Accept',
      'Accept-Encoding',
      'Authorization',
      'Content-Type',
      'Cookie',
      'X-Requested-With'
    ];
  }

  for (let name of allowedHeaderNames) {
    let value = requestHeaders[name] as string | undefined;
    if (value === void 0) {
      continue;
    }

    headers[name] = value;
  }

  callback({
    cancel: false,
    requestHeaders: headers
  });
}

function onHeadersReceived(
  details: Electron.OnHeadersReceivedListenerDetails,
  callback: (response: Electron.HeadersReceivedResponse) => void
): void {
  let responseHeaders = details.responseHeaders ?? {};

  let setCookie = responseHeaders['set-cookie'] as string[] | undefined;
  if (setCookie !== void 0) {
    responseHeaders['set-cookie'] = setCookie.map((cookieHeader) => {
      let [cookie] = cookieHeader.split(';');

      if (cookie.endsWith('=') === true) {
        // expire cookie
        return (
          cookie +
          '; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; HttpOnly; SameSite=None'
        );
      }

      if (
        cookie.startsWith('apiKey=') === true ||
        cookie.startsWith('auth=') === true ||
        cookie.startsWith('twoFactorAuth=') === true
      ) {
        // persistent cookie
        return (
          cookie +
          '; Path=/; Expires=Thu, 31 Dec 2037 23:55:55 GMT; Secure; HttpOnly; SameSite=None'
        );
      }

      // session cookie
      return cookie + '; Path=/; Secure; HttpOnly; SameSite=None';
    });
  }

  responseHeaders['Access-Control-Allow-Origin'] = ['*'];

  callback({
    cancel: false,
    responseHeaders
  });
}

pubsub.subscribe('tray:open', activate);
pubsub.subscribe('tray:double-click', activate);

electron.ipcMain.on('mainWindow:close', (event) => {
  event.returnValue = void 0;
  close();
});

electron.ipcMain.on('mainWindow:minimize', (event) => {
  event.returnValue = void 0;
  minimize();
});

electron.ipcMain.on('mainWindow:maximize', (event) => {
  event.returnValue = void 0;
  maximize();
});
