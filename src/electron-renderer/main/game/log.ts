import * as vue from 'vue';
import * as noty from 'noty';
import * as util from '../../../util';
import {GameLogType} from '../../../constants';

// @ts-expect-error sex
let ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

interface LogContext {
  gameStartTime: number;
  roomJoinTime: number;
  roomLeaveTime: number;
  isInRoom: boolean;
  location: string;
  worldName: string;
  roomUserMap: Map<string, number>;
}

export let gameLogList = vue.reactive<any[]>([]);
export let summary = vue.ref<LogContext | undefined>(void 0);

let isLogInit = false;
let isLogSync = false;
let lastLogTime = 0;
let logSortTimer: any = void 0;
let logContextMap = new Map<number, LogContext>();

function setLogSortTimer(): void {
  if (logSortTimer !== void 0) {
    return;
  }

  logSortTimer = setTimeout(() => {
    logSortTimer = void 0;
    gameLogList.sort((a, b) => b[1] - a[1]); // time
    console.log('sortGameLog', gameLogList.length);
  }, 10);
}

function showNoty(text: string): void {
  new noty({
    type: 'alert',
    layout: 'topRight',
    theme: 'sunset',
    text,
    timeout: 5000,
    queue: 'gameLog'
  }).show();
}

ipcRenderer.on('gameLog:syncStart', () => {
  isLogInit = true;
  isLogSync = true;
});

ipcRenderer.on('gameLog:syncEnd', () => {
  isLogSync = false;
  setLogSortTimer();
});

ipcRenderer.on('gameLog', (_event, id: number, gameLogs: any[][]) => {
  if (isLogInit === false) {
    return;
  }

  let context = logContextMap.get(id);
  if (context === void 0) {
    context = vue.reactive<LogContext>({
      gameStartTime: 0,
      roomJoinTime: 0,
      roomLeaveTime: 0,
      isInRoom: false,
      location: '',
      worldName: '',
      roomUserMap: vue.reactive(new Map<string, number>())
    });
    logContextMap.set(id, context);
  }

  let shouldNoty = isLogSync === false;
  let minNotyTime = Date.now() - 3000; // 3s
  let time = 0;

  for (let gameLog of gameLogs) {
    time = gameLog[1];
    shouldNoty = shouldNoty === true && time >= minNotyTime;

    switch (gameLog[0]) {
      case GameLogType.Setup: {
        context.gameStartTime = time;

        if (shouldNoty === true) {
          showNoty('Playing VRChat');
        }
        break;
      }

      case GameLogType.JoiningRoom: {
        context.roomJoinTime = 0;
        context.isInRoom = true;
        context.location = gameLog[2];
        context.worldName = gameLog[3];
        context.roomUserMap.clear();

        gameLogList.push(gameLog);

        if (shouldNoty === true) {
          showNoty(`Joining room: ${util.escapeHtml(gameLog[3])}`);
        }
        break;
      }

      case GameLogType.LeftRoom: {
        context.roomLeaveTime = time;
        context.isInRoom = false;
        break;
      }

      case GameLogType.PlayerJoined: {
        if (context.isInRoom === false) {
          break;
        }

        if (context.roomJoinTime === 0) {
          context.roomJoinTime = time;
          break; // skip
        }

        context.roomUserMap.set(gameLog[2], gameLog[1]);
        gameLogList.push(gameLog);

        if (shouldNoty === true && time !== context.roomJoinTime) {
          showNoty(`Player joined: ${util.escapeHtml(gameLog[2])}`);
        }
        break;
      }

      case GameLogType.PlayerLeft: {
        if (context.isInRoom === false) {
          break;
        }

        let joinTime = context.roomUserMap.get(gameLog[2]);
        if (joinTime === void 0) {
          break;
        }

        context.roomUserMap.delete(gameLog[2]);

        gameLogList.push([
          gameLog[0],
          gameLog[1],
          gameLog[2],
          Math.floor((gameLog[1] - joinTime) / 1000)
        ]);

        if (shouldNoty === true) {
          showNoty(`Player left: ${util.escapeHtml(gameLog[2])}`);
        }
        break;
      }
    }
  }

  if (time >= lastLogTime) {
    lastLogTime = time;
    summary.value = context;
  }

  if (isLogSync === false) {
    setLogSortTimer();
  }
});

setTimeout(() => {
  ipcRenderer.send('gameLog:sync');
}, 1007);

// ipcRenderer.send(
//     'sqlite:exec',
//     'CREATE TABLE IF NOT EXISTS user_locations (' +
//         'user_id TEXT,' +
//         'world_id TEXT,' +
//         'location TEXT,' +
//         'first_saw_time INTEGER,' +
//         'last_saw_time INTEGER,' +
//         1 +
//         2 +
//         ')'
// );
