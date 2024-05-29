import * as vue from "vue";
import * as noty from "noty";
import * as util from "../../../../common/util";
import * as api from "../../game/api";
import { goUserPage } from "../../router";
import * as loading from "../loading";
import * as VueLocation from "../location/index.vue";

// @ts-expect-error sex
const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

interface Props {
  gameLog: unknown[];
}

async function clickUser(targetDisplayName: string) {
  for (const user of api.userMap.values()) {
    if (user.apiUser.displayName === targetDisplayName) {
      goUserPage(user.id);
      return;
    }
  }

  let isNotFound = true;

  loading.increment();

  try {
    const { status, data } = await api.fetchUserList(targetDisplayName, 50, 0);
    if (status === api.ApiStatusCode.OK && data !== void 0) {
      for (const apiUser of data) {
        const { id, displayName } = apiUser;
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

  if (isNotFound) {
    new noty({
      type: "error",
      layout: "bottomRight",
      theme: "sunset",
      text: `User ${util.escapeHtml(targetDisplayName)} not found`,
      timeout: 5000,
    }).show();
  }
}

async function sendInviteMe(location: string, worldName: string) {
  worldName;

  try {
    const locationInfo = api.parseLocation(location);
    if (locationInfo.instanceId === void 0) {
      return;
    }

    // eslint-disable-next-line no-alert
    const action = confirm(`sendInviteMe: ${location}`);
    if (!action) {
      return;
    }

    await api.inviteMe(location);
  } catch (err) {
    console.error(err);
  }
}

async function playGame(location: string, worldName: string) {
  worldName;

  try {
    const locationInfo = api.parseLocation(location);
    if (locationInfo.instanceId === void 0) {
      return;
    }

    // eslint-disable-next-line no-alert
    const action = confirm(`playGame: ${location}`);
    if (!action) {
      return;
    }

    const response = await api.fetchWorldInstanceShortName(location);

    await ipcRenderer.invoke(
      "native:playGame",
      `vrchat://launch?id=${location}&shortName=${
        response.data?.secureName ?? ""
      }`
    );
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "GameLogListItem",
  props: {
    gameLog: Array,
  },
  components: {
    Location: VueLocation.default,
  },
  setup(props: Props) {
    const gameLogRef = vue.computed(() => props.gameLog);
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
      playGame,
    };
  },
};
