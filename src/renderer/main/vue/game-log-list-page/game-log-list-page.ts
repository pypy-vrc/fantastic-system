import * as vue from "vue";
import * as util from "../../../../common/util";
import * as log from "../../game/log";
import * as api from "../../game/api";
import { goUserPage } from "../../router";
import * as loading from "../loading";
import { now } from "../clock";
import * as VueLocation from "../location/index.vue";
import * as VueGameLogListItem from "../game-log-list-item/index.vue";

// @ts-expect-error sex
const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

const pageSize = vue.ref(100);
const currentPage = vue.ref(1);

const gameDurationRef = vue.computed(() => {
  const summary = log.summary.value;
  if (summary === void 0) {
    return "";
  }

  const { gameStartTime, roomLeaveTime, isInRoom } = summary;
  if (gameStartTime === 0) {
    return "";
  }

  const time =
    (isInRoom ? Math.floor(now.value / 1000) : roomLeaveTime) - gameStartTime;
  if (time < 0) {
    return "";
  }

  return util.getDurationString(time);
});

const roomDurationRef = vue.computed(() => {
  const summary = log.summary.value;
  if (summary === void 0) {
    return "";
  }

  const { roomJoinTime, roomLeaveTime, isInRoom } = summary;
  if (roomJoinTime === 0) {
    return "";
  }

  const time =
    (isInRoom ? Math.floor(now.value / 1000) : roomLeaveTime) - roomJoinTime;
  if (time < 0) {
    return "";
  }

  return util.getDurationString(time);
});

const roomUserListRef = vue.computed(() => {
  const summary = log.summary.value;
  if (summary === void 0) {
    return [];
  }

  const { roomLeaveTime, isInRoom, roomUserMap } = summary;

  const time = isInRoom ? Math.floor(now.value / 1000) : roomLeaveTime;

  const roomUsers = [];
  for (const [displayName, joinTime] of roomUserMap) {
    roomUsers.push([displayName, time - joinTime]);
  }

  return roomUsers;
});

async function clickUser(targetDisplayName: string) {
  for (const user of api.userMap.values()) {
    if (user.apiUser.displayName === targetDisplayName) {
      goUserPage(user.id);
      return;
    }
  }

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
          break;
        }
      }
    }
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
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
  name: "GameLogListPage",
  components: {
    Location: VueLocation.default,
    GameLogListItem: VueGameLogListItem.default,
  },
  setup() {
    return {
      pageSize,
      currentPage,
      gameLogList: log.instanceLogRows,
      summary: log.summary,
      gameDuration: gameDurationRef,
      roomDuration: roomDurationRef,
      roomUserList: roomUserListRef,
      getDurationString: util.getDurationString,
      clickUser,
      sendInviteMe,
      playGame,
    };
  },
};
