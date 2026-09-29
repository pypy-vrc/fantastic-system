import { Menu, Tray } from "electron";
import { publish } from "../common/pubsub.ts";
import { APP_ICON } from "./global.ts";

let tray: Tray | undefined = void 0;

export function createTray() {
  if (tray !== void 0) {
    return;
  }

  tray = new Tray(APP_ICON);
  tray.on("double-click", () => publish("tray:double-click"));
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Open",
        click: () => publish("tray:open"),
      },
      {
        type: "separator",
      },
      {
        label: "Quit",
        click: () => publish("tray:quit"),
      },
    ]),
  );
  tray.setToolTip("senpai1");
}

export function destroyTray() {
  try {
    tray?.destroy();
    tray = void 0;
  } catch (err) {
    console.error(err);
  }
}
