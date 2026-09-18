import { join } from "path";
import { app, BrowserWindow, ipcMain, screen, shell } from "electron";
import { nop } from "../../common/util.ts";
import { APP_ICON, IS_APP_QUIT, USER_AGENT } from "../global.ts";

let window: BrowserWindow | undefined = void 0;

export function createMainWindow() {
  if (window !== void 0) {
    return;
  }

  window = new BrowserWindow({
    width: 800,
    height: 500,
    minWidth: 300,
    minHeight: 200,
    fullscreenable: false,
    icon: APP_ICON,
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      preload: join(app.getAppPath(), "./dist/preload.cjs"),
      sandbox: false,
      defaultEncoding: "utf-8",
      backgroundThrottling: false,
      contextIsolation: true,
      additionalArguments: ["--disable-spell-checking"],
      // disableDialogs: true,
      spellcheck: false,
      enableWebSQL: false,
    },
  });

  window.on("close", (e) => {
    if (!IS_APP_QUIT.value) {
      e.preventDefault();
      window?.hide();
      return;
    }

    window?.webContents.closeDevTools();
  });

  window.on("move", () => {
    // var [x, y] = this.getPosition();
    // var [width, height] = this.getSize();
  });

  window.on("resize", () => {
    // var [x, y] = this.getPosition();
    // var [width, height] = this.getSize();
  });

  window.on("show", () => {
    if (window === void 0) {
      return;
    }

    const { x: winX, y: winY } = window.getBounds();

    for (const { bounds } of screen.getAllDisplays()) {
      const { height, width, x, y } = bounds;
      if (winX >= x && winX <= x + width && winY >= y && winY <= y + height) {
        // okay, windows in a display
        return;
      }
    }

    window.center();
  });

  window.webContents.on("did-finish-load", () => {
    if (window === void 0) {
      return;
    }

    // reset zoom
    window.webContents.setZoomFactor(1);
    window.webContents.setZoomLevel(0);
    window.show();
  });

  window.webContents.on("will-navigate", (e) => {
    e.preventDefault();
  });

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url).catch(nop);

    return {
      action: "deny",
    };
  });

  window.webContents.session.on("will-download", (e) => {
    e.preventDefault();
  });

  window.webContents.session.webRequest.onBeforeSendHeaders(
    {
      urls: ["https://*.vrchat.cloud/*", "wss://*.vrchat.cloud/*"],
    },
    (details, callback) => {
      const { url, requestHeaders } = details;

      // if (url.startsWith("wss://")) {
      //   var headers = {
      //     "User-Agent": "Transmtn-Pipeline",
      //     Upgrade: "websocket",
      //     Connection: "Upgrade",
      //     "Sec-WebSocket-Version": "13",
      //   };
      // } else if (url.startsWith("https://api.vrchat.cloud/api/1/file/")) {
      //   var headers = {
      //     "User-Agent":
      //       "UnityPlayer/2018.4.20f1 (UnityWebRequest/1.0, libcurl/7.52.0-DEV)",
      //     Accept: "*/*",
      //     "Accept-Encoding": "identify",
      //     "X-Unity-Version": "2018.4.20f1",
      //   };
      // } else {
      //   var headers = {
      //     "X-Requested-With": "XMLHttpRequest",
      //     // 'X-MacAddress': '',
      //     // 'X-Client-Version': '',
      //     // 'X-Platform': '',
      //     Origin: "vrchat.com",
      //     "Accept-Encoding": "gzip, identity",
      //     "User-Agent": "VRC.Core.BestHTTP",
      //   };
      // }

      const headers: Record<string, string | string[]> = {
        "User-Agent": USER_AGENT,
      };

      const names = url.startsWith("wss://")
        ? ["Upgrade", "Connection", "Sec-WebSocket-Version"]
        : [
            "Accept",
            "Accept-Encoding",
            "Authorization",
            "Content-Type",
            "Cookie",
            "X-Requested-With",
          ];

      for (const name of names) {
        const value = requestHeaders[name] as string | undefined;
        if (value === void 0) {
          continue;
        }

        headers[name] = value;
      }

      callback({
        cancel: false,
        requestHeaders: headers,
      });
    },
  );

  window.webContents.session.webRequest.onHeadersReceived(
    {
      urls: ["https://*.vrchat.cloud/*"],
    },
    (details, callback) => {
      const responseHeaders = details.responseHeaders || {};

      const cookies = responseHeaders["set-cookie"] as string[] | undefined;
      if (cookies !== void 0) {
        responseHeaders["set-cookie"] = cookies.map((cookie) => {
          const [name] = cookie.split(";");

          if (name.endsWith("=")) {
            // expire
            return (
              name +
              "; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; HttpOnly; SameSite=None"
            );
          }

          if (
            name.startsWith("apiKey=") ||
            name.startsWith("auth=") ||
            name.startsWith("twoFactorAuth=")
          ) {
            // persistent
            return (
              name +
              "; Path=/; Expires=Thu, 31 Dec 2037 23:55:55 GMT; Secure; HttpOnly; SameSite=None"
            );
          }

          // session
          return name + "; Path=/; Secure; HttpOnly; SameSite=None";
        });
      }

      responseHeaders["Access-Control-Allow-Origin"] = ["*"];

      callback({
        cancel: false,
        responseHeaders,
      });
    },
  );

  window.loadFile("./dist/main.html").catch(nop);
  //.finally(() => window?.show());
}

export function destroyMainWindow() {
  try {
    window?.destroy();
    window = void 0;
  } catch (err) {
    console.error(err);
  }
}

export function sendToMainWindow(channel: string, ...args: unknown[]) {
  window?.webContents.send(channel, ...args);
}

export function activateMainWindow() {
  if (window === void 0) {
    return;
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.show();
}

ipcMain.on("main:close", (event) => {
  event.returnValue = void 0;
  window?.close();
});

ipcMain.on("main:minimize", (event) => {
  event.returnValue = void 0;
  window?.minimize();
});

ipcMain.on("main:maximize", (event) => {
  event.returnValue = void 0;

  if (window === void 0) {
    return;
  }

  if (window.isMaximized()) {
    window.restore();
    return;
  }

  window.maximize();
});
