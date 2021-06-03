import * as vue from 'vue';
import * as elementUI from 'element-plus';
import * as util from '../../../../util';
import * as log from '../../game/log';
import * as api from '../../game/api';
import {goUserPage} from '../../router';
import * as loading from '../loading';
import {now} from '../clock';

// @ts-expect-error sex
let ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

let pageSize = vue.ref(20);
let currentPage = vue.ref(1);

let gameDurationRef = vue.computed(() => {
  let summary = log.summary.value;
  if (summary === void 0) {
    return '';
  }

  let {gameStartTime, roomLeaveTime, isInRoom} = summary;
  if (gameStartTime === 0) {
    return '';
  }

  let time = (isInRoom === true ? now.value : roomLeaveTime) - gameStartTime;
  if (time < 0) {
    return '';
  }

  return util.getDurationString(Math.floor(time / 1000));
});

let roomDurationRef = vue.computed(() => {
  let summary = log.summary.value;
  if (summary === void 0) {
    return '';
  }

  let {roomJoinTime, roomLeaveTime, isInRoom} = summary;
  if (roomJoinTime === 0) {
    return '';
  }

  let time = (isInRoom === true ? now.value : roomLeaveTime) - roomJoinTime;
  if (time < 0) {
    return '';
  }

  return util.getDurationString(Math.floor(time / 1000));
});

let roomUserListRef = vue.computed(() => {
  let summary = log.summary.value;
  if (summary === void 0) {
    return [];
  }

  let {roomLeaveTime, isInRoom, roomUserMap} = summary;

  let time = isInRoom === true ? now.value : roomLeaveTime;

  let roomUsers = [];
  for (let [displayName, joinTime] of roomUserMap) {
    roomUsers.push([displayName, Math.floor((time - joinTime) / 1000)]);
  }

  return roomUsers;
});

async function clickUser(targetDisplayName: string): Promise<void> {
  for (let user of api.userMap.values()) {
    if (user.apiUser.displayName === targetDisplayName) {
      goUserPage(user.id);
      return;
    }
  }

  loading.increment();

  try {
    let {status, data} = await api.fetchUserList(targetDisplayName, 50, 0);
    if (status === api.ApiStatusCode.OK && data !== void 0) {
      for (let apiUser of data) {
        let {id, displayName} = apiUser;
        if (id === void 0 || displayName === void 0) {
          continue;
        }

        if (displayName === targetDisplayName) {
          goUserPage(id);
          break;
        }
      }
    }
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

async function sendInviteMe(
  location: string,
  worldName: string
): Promise<void> {
  try {
    let locationInfo = api.parseLocation(location);
    if (locationInfo.instanceId === void 0) {
      return;
    }

    let action = await elementUI.ElMessageBox({
      message: vue.h('div', {}, [
        'sendInviteMe: ',
        vue.h(require('../location').default, {
          location,
          worldName
        })
      ]),
      showCancelButton: true,
      showConfirmButton: true
    });
    if (action !== 'confirm') {
      return;
    }

    await api.sendInvite(api.loginUser.id, {
      instanceId: location,
      worldId: location,
      worldName: ''
    });
  } catch (err) {
    console.error(err);
  }
}

async function playGame(location: string, worldName: string): Promise<void> {
  try {
    let locationInfo = api.parseLocation(location);
    if (locationInfo.instanceId === void 0) {
      return;
    }

    let action = await elementUI.ElMessageBox({
      message: vue.h('div', {}, [
        'playGame: ',
        vue.h(require('../location').default, {
          location,
          worldName
        })
      ]),
      showCancelButton: true,
      showConfirmButton: true
    });
    if (action !== 'confirm') {
      return;
    }

    await ipcRenderer.invoke(
      'native:playGame',
      `vrchat://launch?id=${location}`
    );
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: 'GameLogListPage',
  components: {
    Location: require('../location').default,
    GameLogListItem: require('../game-log-list-item').default
  },
  setup(): any {
    return {
      pageSize,
      currentPage,
      gameLogList: log.gameLogList,
      summary: log.summary,
      gameDuration: gameDurationRef,
      roomDuration: roomDurationRef,
      roomUserList: roomUserListRef,
      getDurationString: util.getDurationString,
      clickUser,
      sendInviteMe,
      playGame
    };
  }
};
