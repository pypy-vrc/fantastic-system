import { join } from "path";
import { app, BrowserWindow } from "electron";
import { OverlayTarget, setOverlayFrameBuffer } from "native";
import { nop } from "../../common/util.ts";

let window: BrowserWindow | undefined = void 0;

export function createHmdWindow() {
  if (window !== void 0) {
    return;
  }

  window = new BrowserWindow({
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
      preload: join(app.getAppPath(), "./dist/preload.cjs"),
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
    setOverlayFrameBuffer(
      OverlayTarget.HMD,
      x,
      y,
      width,
      height,
      image.toBitmap(),
    ),
  );

  window.webContents.setFrameRate(30);
  window.webContents.openDevTools();

  // window.loadURL(
  //   "https://testdrive-archive.azurewebsites.net/performance/fishbowl/"
  // );

  window.loadFile("./dist/overlay-hmd.html").catch(nop);
}

export function destroyHmdWindow() {
  try {
    window?.destroy();
    window = void 0;
  } catch (err) {
    console.error(err);
  }
}

export function sendToHmdWindow(channel: string, ...args: unknown[]) {
  window?.webContents.send(channel, ...args);
}
