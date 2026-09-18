import { computed } from "vue";
import noty from "noty";
import {
  escapeHtml,
  formatDate,
  getDurationString,
} from "../../../../common/util.ts";
import {
  ApiStatusCode,
  fetchUserList,
  fetchWorldInstanceShortName,
  inviteMe,
  parseLocation,
  userMap,
} from "../../game/api/index.ts";
import { goUserPage } from "../../router.ts";
import { decrementLoading, incrementLoading } from "../loading.ts";
import VueLocation from "../location/index.vue";

const { ipcRenderer } = window;

type Props = {
  gameLog: unknown[];
};

async function clickUser(targetDisplayName: string) {
  for (const user of userMap.values()) {
    if (user.apiUser.displayName === targetDisplayName) {
      goUserPage(user.id);
      return;
    }
  }

  let isNotFound = true;

  incrementLoading();

  try {
    const { status, data } = await fetchUserList(targetDisplayName, 50, 0);
    if (status === ApiStatusCode.OK && data !== void 0) {
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

  decrementLoading();

  if (isNotFound) {
    new noty({
      type: "error",
      layout: "bottomRight",
      theme: "sunset",
      text: `User ${escapeHtml(targetDisplayName)} not found`,
      timeout: 5000,
    }).show();
  }
}

async function sendInviteMe(location: string, worldName: string) {
  try {
    const locationInfo = parseLocation(location);
    if (locationInfo.instanceId === void 0) {
      return;
    }

    const action = confirm(`sendInviteMe: ${location}`);
    if (!action) {
      return;
    }

    await inviteMe(location);
  } catch (err) {
    console.error(err);
  }
}

async function playGame(location: string, worldName: string) {
  try {
    const locationInfo = parseLocation(location);
    if (locationInfo.instanceId === void 0) {
      return;
    }

    const action = confirm(`playGame: ${location}`);
    if (!action) {
      return;
    }

    const response = await fetchWorldInstanceShortName(location);

    await ipcRenderer.invoke(
      "native:playGame",
      `vrchat://launch?id=${location}&shortName=${
        response.data?.secureName || ""
      }`,
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
    Location: VueLocation,
  },
  setup(props: Props) {
    const gameLogRef = computed(() => props.gameLog);
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
      formatDate: formatDate,
      getDurationString: getDurationString,
      goUserPage,
      clickUser,
      sendInviteMe,
      playGame,
    };
  },
};
