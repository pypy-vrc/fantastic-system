import { app, nativeImage } from "electron";
import { join } from "node:path";

export const IS_APP_QUIT = { value: false };

export const APP_ICON = nativeImage.createFromPath(
  join(app.getAppPath(), "./dist/icons/app.ico"),
);

export const USER_AGENT = `SENPAI/${app.getVersion()} git@vrcx.net`;
