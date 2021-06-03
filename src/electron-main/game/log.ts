import * as fs from 'fs';
import * as path from 'path';
import * as electron from 'electron';
import * as util from '../../util';
import {GameLogType} from '../../constants';
import * as mainWindow from '../window/main';

interface LogFile {
  id: number;
  filePath: string;
  pendingCount: number;
  offset: number;
  buffer: string;
  gameLogs: (string | number)[][];
  worldName?: string;
  watcher: any;
}

// Application.persistentDataPath
let logDirectoryPath = path.join(
  electron.app.getPath('home'),
  './AppData/LocalLow/VRChat/VRChat/'
);
let logFileIndex = 0;
let logFileMap = new Map<string, LogFile>();
let logDirectoryWatcher: fs.FSWatcher | undefined = void 0;

function isLogFileName(name: string): boolean {
  return /^output_log_.*\.txt$/i.test(name);
}

function onWatchLogDirectory(_type: string, name: string): void {
  if (isLogFileName(name) === false) {
    return;
  }

  watchLog(path.join(logDirectoryPath, name)).catch(util.nop);
}

export async function watch(): Promise<void> {
  await util.sleep(1007);

  // ENOENT
  for (;;) {
    try {
      await fs.promises.access(logDirectoryPath, fs.constants.F_OK);

      if (logDirectoryWatcher !== void 0) {
        return;
      }

      logDirectoryWatcher = fs.watch(logDirectoryPath, onWatchLogDirectory);

      break;
    } catch {}

    await util.sleep(5007);
  }

  try {
    for (let name of await fs.promises.readdir(logDirectoryPath)) {
      onWatchLogDirectory('change', name);
    }
  } catch (err) {
    console.error(err);
  }
}

async function watchLog(filePath: string): Promise<void> {
  let logFile = logFileMap.get(filePath);
  if (logFile === void 0) {
    logFile = {
      id: ++logFileIndex,
      filePath,
      pendingCount: 0,
      offset: 0,
      buffer: '',
      gameLogs: [],
      worldName: void 0,
      watcher: void 0
    };
    logFileMap.set(filePath, logFile);
  }

  if (++logFile.pendingCount !== 1) {
    return;
  }

  try {
    await readLog(logFile);
  } catch (err) {
    console.error(err);
  }

  if (--logFile.pendingCount !== 0) {
    logFile.pendingCount = 0;
    setImmediate(() => {
      watchLog(filePath).catch(util.nop);
    });
  }
}

async function readLog(logFile: LogFile): Promise<void> {
  if (logFile.watcher === void 0) {
    // fs.watchFile() is necessary for fs.watch() to detect changes of this file.
    fs.watchFile(
      logFile.filePath,
      {
        interval: 1007
      },
      (currentStats) => {
        if (currentStats.birthtimeMs === 0) {
          logFile.watcher = void 0;
          fs.unwatchFile(logFile.filePath);
        }
      }
    );
    logFile.watcher = true;
  }

  let {gameLogs} = logFile;
  let oldLength = gameLogs.length;

  await new Promise<void>((resolve, reject) => {
    let stream = fs.createReadStream(logFile.filePath, {
      encoding: 'utf-8',
      start: logFile.offset
    });

    stream.on('error', (err: Error & {code: string}) => {
      if (err.code === 'ENOENT') {
        logFile.offset = 0;
        logFile.buffer = '';
      }
      reject(err);
    });

    stream.on('end', () => {
      logFile.offset += stream.bytesRead;
      resolve();
    });

    stream.on('data', (chunk) => {
      let lines = (logFile.buffer + chunk).split(/\n\n\r\n/);
      logFile.buffer = lines.pop()!;

      for (let line of lines) {
        let gameLog = parseLog(logFile, line);
        if (gameLog === void 0) {
          continue;
        }

        gameLogs.push(gameLog);
      }
    });
  });

  if (gameLogs.length === oldLength) {
    return;
  }

  mainWindow.send(
    'gameLog',
    logFile.id,
    oldLength === 0 ? gameLogs : gameLogs.slice(oldLength)
  );
}

function parseLog(logFile: LogFile, line: string): any[] | undefined {
  if (line[20] !== 'L' || line[31] !== '-') {
    return;
  }

  let offset = 34;

  if (line[34] === '[') {
    if (line[44] === ']') {
      // [Behaviour]
      offset = 46;
    } else {
      offset = line.indexOf('] ', 35);
      if (offset < 0) {
        return;
      }
      offset += 2;
    }
  }

  switch (line[offset]) {
    case 'E':
      if (line.startsWith('Entering Room: ', offset) === true) {
        logFile.worldName = line.substr(offset + 15);
      }
      break;

    case 'J':
      if (
        logFile.worldName !== void 0 &&
        line.startsWith('Joining ', offset) === true &&
        line.startsWith('or Creating Room: ', offset + 8) === false
      ) {
        let {worldName} = logFile;
        logFile.worldName = void 0;
        let location = line.substr(offset + 8);
        let time = parseLogTime(line);
        return [GameLogType.JoiningRoom, time, location, worldName];
      }
      break;

    case 'O':
      switch (line[offset + 8]) {
        case 'J':
          if (line.startsWith('OnPlayerJoined ', offset) === true) {
            let userName = line.substr(offset + 15);
            let time = parseLogTime(line);
            return [GameLogType.PlayerJoined, time, userName];
          }
          break;

        case 'L':
          if (line.startsWith('OnPlayerLeft ', offset) === true) {
            let userName = line.substr(offset + 13);
            let time = parseLogTime(line);
            return [GameLogType.PlayerLeft, time, userName];
          }
          break;

        case 'o':
          if (line.startsWith('OnLeftRoom', offset) === true) {
            let time = parseLogTime(line);
            return [GameLogType.LeftRoom, time];
          }
          break;
      }
      break;

    case 'V':
      if (line.startsWith('VRC Analytics Initialized', offset) === true) {
        let time = parseLogTime(line);
        return [GameLogType.Setup, time];
      }
      break;
  }
}

function parseLogTime(line: string): number {
  return new Date(
    parseInt(line.substr(0, 4), 10),
    parseInt(line.substr(5, 2), 10) - 1,
    parseInt(line.substr(8, 2), 10),
    parseInt(line.substr(11, 2), 10),
    parseInt(line.substr(14, 2), 10),
    parseInt(line.substr(17, 2), 10)
  ).getTime();
}

electron.ipcMain.on('gameLog:sync', (event) => {
  event.returnValue = void 0;

  mainWindow.send('gameLog:syncStart');

  for (let logFile of logFileMap.values()) {
    mainWindow.send('gameLog', logFile.id, logFile.gameLogs);
  }

  mainWindow.send('gameLog:syncEnd');
});
