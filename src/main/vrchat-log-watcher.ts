import * as fs from "fs";
import * as path from "path";
import * as electron from "electron";
import * as util from "../common/util";
import { VRChatLogType } from "../common/constants";
import * as mainWindow from "./window/main";

interface LogFile {
  fileName: string;
  filePath: string;
  lockCount: number;
  isWatch: boolean;
  buffer: string;
  byteOffset: number;
  lines: number;
  lastTime: number;
  isActive: boolean;
  roomName: string | null;
  isInRoom: boolean;
  rows: unknown[][];
}

// Application.persistentDataPath
const logDataPath = path.join(
  electron.app.getPath("home"),
  "./AppData/LocalLow/VRChat/VRChat/"
);

let logDataWatcher: fs.FSWatcher | undefined = void 0;
const logFileMap = new Map<string, LogFile>();

function onWatchLogData(_type: string, name: string | null) {
  if (name === null || !/^output_log_.+\.txt$/.test(name)) {
    return;
  }

  watchLog(name).catch(util.nop);
}

export async function setup() {
  for (;;) {
    await util.sleep(1007);

    try {
      await fs.promises.access(logDataPath, fs.constants.F_OK);

      if (logDataWatcher !== void 0) {
        return;
      }

      logDataWatcher = fs.watch(logDataPath, onWatchLogData);
      break;
    } catch {
      // ENOENT
    }
  }

  try {
    for (const entry of await fs.promises.readdir(logDataPath)) {
      onWatchLogData("change", entry);
    }
  } catch (err) {
    console.error(err);
  }
}

async function watchLog(fileName: string) {
  const filePath = path.join(logDataPath, fileName);

  let ctx = logFileMap.get(filePath);
  if (ctx === void 0) {
    ctx = {
      fileName,
      filePath,
      lockCount: 0,
      isWatch: false,
      buffer: "",
      byteOffset: 0,
      lines: 0,
      lastTime: 0,
      isActive: false,
      roomName: null,
      isInRoom: false,
      rows: [],
    };
    logFileMap.set(filePath, ctx);
  }

  if (++ctx.lockCount !== 1) {
    return;
  }

  try {
    await readLog(ctx);
  } catch (err) {
    console.error(err);
  }

  if (--ctx.lockCount === 0) {
    return;
  }

  ctx.lockCount = 0;
  setImmediate(() => watchLog(fileName).catch(util.nop));
}

async function readLog(ctx: LogFile) {
  if (!ctx.isWatch) {
    // fs.watchFile() is necessary for fs.watch() to detect changes of this file.
    fs.watchFile(
      ctx.filePath,
      {
        interval: 1007,
      },
      (stats) => {
        if (stats.birthtimeMs === 0) {
          ctx.isWatch = false;
          fs.unwatchFile(ctx.filePath);
        }
      }
    );
    ctx.isWatch = true;
  }

  const prevLength = ctx.rows.length;

  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(ctx.filePath, {
      encoding: "utf-8",
      start: ctx.byteOffset,
    });

    stream.on("error", (err: Error & { code: string }) => {
      if (err.code === "ENOENT") {
        ctx.buffer = "";
        ctx.byteOffset = 0;
        ctx.lines = 0;
      }
      reject(err);
    });

    stream.on("end", () => {
      ctx.byteOffset += stream.bytesRead;
      resolve();
    });

    stream.on("data", (chunk) => {
      const texts = (ctx.buffer + chunk).split(/\r\n/);
      ctx.buffer = texts.pop() as string;
      let line = ctx.lines;
      ctx.lines += texts.length;
      for (const text of texts) {
        parseLog(ctx, text, ++line);
      }
    });
  });

  if (ctx.rows.length === prevLength) {
    return;
  }

  mainWindow.send(
    "vrchatLog",
    ctx.fileName,
    prevLength !== 0 ? ctx.rows.slice(prevLength) : ctx.rows
  );
}

function parseUserNameAndId(text: string): [name: string, userId: string] {
  // pypy (usr_4f76a584-9d4b-46f6-8209-8305eb683661)
  const match = /^(.+) \((.+)\)$/.exec(text);
  if (match !== null) {
    return [match[1], match[2]];
  }
  return [text, ""];
}

function parseLog(ctx: LogFile, text: string, line: number) {
  if (!/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2} /.test(text)) {
    return;
  }

  const time = Math.floor(
    new Date(
      parseInt(text.slice(0, 4), 10),
      parseInt(text.slice(5, 7), 10) - 1,
      parseInt(text.slice(8, 10), 10),
      parseInt(text.slice(11, 13), 10),
      parseInt(text.slice(14, 16), 10),
      parseInt(text.slice(17, 19), 10)
    ).getTime() / 1000
  );
  ctx.lastTime = time;

  if (text.startsWith("[Behaviour] ", 34)) {
    const p = 46;

    if (!ctx.isActive) {
      return;
    }

    switch (text[p]) {
      case "E":
        if (text.startsWith("Entering Room: ", p)) {
          ctx.roomName = text.slice(p + 15);
        }
        break;

      case "J":
        if (
          ctx.roomName !== null &&
          text.startsWith("Joining ", p) &&
          !text.startsWith("or Creating Room: ", p + 8)
        ) {
          ctx.rows.push([
            line,
            time,
            VRChatLogType.JoiningRoom,
            text.slice(p + 8),
            ctx.roomName,
          ]);
          ctx.roomName = null;
          ctx.isInRoom = true;
        }
        break;

      case "O":
        switch (text[p + 8]) {
          case "J":
            if (ctx.isInRoom && text.startsWith("OnPlayerJoined ", p)) {
              ctx.rows.push([
                line,
                time,
                VRChatLogType.PlayerJoined,
                ...parseUserNameAndId(text.slice(p + 15)),
              ]);
            }
            break;

          case "L":
            if (ctx.isInRoom && text.startsWith("OnPlayerLeft ", p)) {
              ctx.rows.push([
                line,
                time,
                VRChatLogType.PlayerLeft,
                ...parseUserNameAndId(text.slice(p + 13)),
              ]);
            }
            break;

          case "o":
            if (ctx.isInRoom && text.startsWith("OnLeftRoom", p)) {
              ctx.rows.push([line, time, VRChatLogType.LeftRoom]);
              ctx.isInRoom = false;
            }
            break;
        }
        break;
    }
  } else {
    const p = 34;

    switch (text[p]) {
      case "V":
        if (ctx.isActive) {
          if (text.startsWith("VRCApplication: OnApplicationQuit", p)) {
            ctx.rows.push([line, time, VRChatLogType.Quit]);
            ctx.isActive = false;
          }
        } else if (text.startsWith("VRC Analytics Initialized", p)) {
          ctx.rows.push([line, time, VRChatLogType.Init]);
          ctx.isActive = true;
        }
        break;
    }
  }
}

electron.ipcMain.on("vrchatLog:sync", (event) => {
  event.returnValue = void 0;

  mainWindow.send("vrchatLog:syncStart");

  for (const logFile of logFileMap.values()) {
    mainWindow.send("vrchatLog", logFile.fileName, logFile.rows);
  }

  mainWindow.send("vrchatLog:syncEnd");
});
