import * as path from "path";
import * as electron from "electron";

export const isAppQuit = { value: false };

export const appIcon = electron.nativeImage.createFromPath(
  path.join(electron.app.getAppPath(), "./dist/icons/app.ico")
);

export const userAgent = `SENPAI/${electron.app.getVersion()} git@pypy.gg`;
