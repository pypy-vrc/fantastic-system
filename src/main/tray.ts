import * as electron from "electron";
import * as pubsub from "../common/pubsub";
import * as global from "./global";

let tray: electron.Tray | undefined = void 0;

export function create() {
  if (tray !== void 0) {
    return;
  }

  tray = new electron.Tray(global.appIcon);
  tray.on("double-click", () => pubsub.publish("tray:double-click"));
  tray.setContextMenu(
    electron.Menu.buildFromTemplate([
      {
        label: "Open",
        click: () => pubsub.publish("tray:open"),
      },
      {
        type: "separator",
      },
      {
        label: "Quit",
        click: () => pubsub.publish("tray:quit"),
      },
    ])
  );
  tray.setToolTip("senpai1");
}

export function destroy() {
  try {
    tray?.destroy();
    tray = void 0;
  } catch (err) {
    console.error(err);
  }
}
