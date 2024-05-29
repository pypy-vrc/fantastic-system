import * as path from "path";
import * as electron from "electron";
import * as native from "native";
import * as util from "../../common/util";

let window: electron.BrowserWindow | undefined = void 0;

export function create() {
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
    backgroundColor: "#FF000000",
    hasShadow: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(electron.app.getAppPath(), "./dist/preload.js"),
      sandbox: false,
      defaultEncoding: "utf-8",
      backgroundThrottling: false,
      offscreen: true,
      contextIsolation: true,
      additionalArguments: ["--disable-spell-checking"],
      disableDialogs: true,
      spellcheck: false,
      enableWebSQL: false,
    },
  });

  window.on("close", () => window?.webContents.closeDevTools());

  window.webContents.on("paint", (_e, { x, y, width, height }, image) =>
    native.setOverlayFrameBuffer(
      native.OverlayTarget.HMD,
      x,
      y,
      width,
      height,
      image.getBitmap()
    )
  );

  window.webContents.setFrameRate(30);
  window.webContents.openDevTools();

  // window.loadURL(
  //   "https://testdrive-archive.azurewebsites.net/performance/fishbowl/"
  // );

  window.loadFile("./dist/overlay-hmd.html").catch(util.nop);
}

export function destroy() {
  try {
    window?.destroy();
    window = void 0;
  } catch (err) {
    console.error(err);
  }
}

export function send(channel: string, ...args: unknown[]) {
  window?.webContents.send(channel, ...args);
}
