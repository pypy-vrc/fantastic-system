import * as vue from 'vue';
import * as noty from 'noty';
import * as elementUI from 'element-plus';
import * as util from '../../../../util';
import * as api from '../../game/api';
import {goUserPage} from '../../router';
import * as loading from '../loading';

// @ts-expect-error sex
let ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

interface Props {
  gameLog: any[];
}

async function clickUser(targetDisplayName: string): Promise<void> {
  for (let user of api.userMap.values()) {
    if (user.apiUser.displayName === targetDisplayName) {
      goUserPage(user.id);
      return;
    }
  }

  let isNotFound = true;

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
          isNotFound = false;
          break;
        }
      }
    }
  } catch (err) {
    console.error(err);
  }

  loading.decrement();

  if (isNotFound === true) {
    new noty({
      type: 'error',
      layout: 'bottomRight',
      theme: 'sunset',
      text: `User ${util.escapeHtml(targetDisplayName)} not found`,
      timeout: 5000
    }).show();
  }
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
  name: 'GameLogListItem',
  props: {
    gameLog: Array
  },
  components: {
    Location: require('../location').default
  },
  setup(props: Props): any {
    let gameLogRef = vue.computed(() => props.gameLog);
    // let userRef = vue.computed(() => props.user);

    return {
      gameLog: gameLogRef, // immutable
      // user: userRef,
      // world: vue.computed(() => {
      //     // console.log('FriendListItem:world', props.user.id);
      //     let {worldId} = userRef.value.locationInfo;
      //     if (worldId === void 0) {
      //         return;
      //     }
      //     return api.worldMap.get(worldId);
      // }),
      formatDate: util.formatDate,
      getDurationString: util.getDurationString,
      goUserPage,
      clickUser,
      sendInviteMe,
      playGame
    };
  }
};
