import * as vue from "vue";
import * as noty from "noty";
import * as util from "../../../common/util";
import { VRChatLogType } from "../../../common/constants";

// @ts-expect-error sex
const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

interface LogContext {
  gameStartTime: number;
  roomJoinTime: number;
  roomLeaveTime: number;
  isInRoom: boolean;
  location: string;
  worldName: string;
  roomUserMap: Map<string, number>;
}

export const instanceLogRows = vue.reactive<unknown[][]>([]);
export const summary = vue.ref<LogContext | undefined>(void 0);

let isLogInit = false;
let isLogSync = false;
let lastLogTime = 0;
let logSortTimer: unknown = void 0;
const logContextMap = new Map<string, LogContext>();

function setLogSortTimer() {
  if (logSortTimer !== void 0) {
    return;
  }

  logSortTimer = setTimeout(() => {
    logSortTimer = void 0;
    instanceLogRows.sort((a, b) => (b[0] as number) - (a[0] as number)); // time
    console.log("sortGameLog", instanceLogRows.length);
  }, 10);
}

function showNoty(text: string) {
  new noty({
    type: "alert",
    layout: "topRight",
    theme: "sunset",
    text,
    timeout: 5000,
    queue: "gameLog",
  }).show();
}

ipcRenderer.on("vrchatLog:syncStart", () => {
  isLogInit = true;
  isLogSync = true;
});

ipcRenderer.on("vrchatLog:syncEnd", () => {
  isLogSync = false;
  setLogSortTimer();
});

ipcRenderer.on("vrchatLog", (_e, fileName: string, rows: unknown[][]) => {
  if (!isLogInit) {
    return;
  }

  let context = logContextMap.get(fileName);
  if (context === void 0) {
    context = vue.reactive<LogContext>({
      gameStartTime: 0,
      roomJoinTime: 0,
      roomLeaveTime: 0,
      isInRoom: false,
      location: "",
      worldName: "",
      roomUserMap: vue.reactive(new Map<string, number>()),
    });
    logContextMap.set(fileName, context);
  }

  let isNoty = !isLogSync;
  const minNotyTime = Math.floor(Date.now() / 1000) - 3; // 3s
  let time = 0;

  for (const row of rows) {
    row.shift(); // remove line number

    time = row[0] as number;
    isNoty = isNoty && time >= minNotyTime;

    switch (row[1]) {
      case VRChatLogType.Init: {
        context.gameStartTime = time;

        if (isNoty) {
          showNoty("Playing VRChat");
        }
        break;
      }

      case VRChatLogType.Quit: {
        context.roomLeaveTime = time;
        context.isInRoom = false;
        break;
      }

      case VRChatLogType.JoiningRoom: {
        context.roomJoinTime = 0;
        context.isInRoom = true;
        context.location = row[2] as string;
        context.worldName = row[3] as string;
        context.roomUserMap.clear();

        instanceLogRows.push(row);

        if (isNoty) {
          showNoty(`Joining room: ${util.escapeHtml(row[3] as string)}`);
        }
        break;
      }

      case VRChatLogType.LeftRoom: {
        context.roomLeaveTime = time;
        context.isInRoom = false;
        break;
      }

      case VRChatLogType.PlayerJoined: {
        if (!context.isInRoom) {
          break;
        }

        if (context.roomJoinTime === 0) {
          context.roomJoinTime = time;
        }

        context.roomUserMap.set(row[2] as string, row[0] as number);
        instanceLogRows.push(row);

        if (isNoty && time !== context.roomJoinTime) {
          showNoty(`Player joined: ${util.escapeHtml(row[2] as string)}`);
        }
        break;
      }

      case VRChatLogType.PlayerLeft: {
        if (!context.isInRoom) {
          break;
        }

        const joinTime = context.roomUserMap.get(row[2] as string);
        if (joinTime === void 0) {
          break;
        }

        context.roomUserMap.delete(row[2] as string);

        instanceLogRows.push([
          row[0],
          row[1],
          row[2],
          (row[0] as number) - joinTime,
        ]);

        if (isNoty) {
          showNoty(`Player left: ${util.escapeHtml(row[2] as string)}`);
        }
        break;
      }
    }
  }

  if (time >= lastLogTime) {
    lastLogTime = time;
    summary.value = context;
  }

  if (!isLogSync) {
    setLogSortTimer();
  }
});

setTimeout(() => {
  ipcRenderer.send("vrchatLog:sync");
}, 1007);
